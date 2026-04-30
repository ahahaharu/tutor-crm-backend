import { INestApplication, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { setupTestApp, cleanDatabase } from '../../test/test-utils';
import { TransactionType } from './dto/create-transaction.dto';

describe('TransactionsService (Integration)', () => {
  let app: INestApplication;
  let service: TransactionsService;
  let db: NodePgDatabase<typeof schema>;

  let tutorId: string;
  let strangerTutorId: string;
  let studentId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;
    service = app.get<TransactionsService>(TransactionsService);
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    const [tutor] = await db
      .insert(schema.tutors)
      .values({
        email: 'tx-owner@test.com',
        passwordHash: 'hash',
        name: 'Owner Tutor',
      })
      .returning();
    tutorId = tutor.id;

    const [stranger] = await db
      .insert(schema.tutors)
      .values({
        email: 'tx-stranger@test.com',
        passwordHash: 'hash',
        name: 'Stranger Tutor',
      })
      .returning();
    strangerTutorId = stranger.id;

    const [student] = await db
      .insert(schema.students)
      .values({
        tutorId: tutor.id,
        name: 'TX Student',
        defaultPrice: 1000,
      })
      .returning();
    studentId = student.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Business Logic & Math', () => {
    it('should correctly calculate the balance after payments and charges', async () => {
      const initial = await service.getBalance(tutorId, studentId);
      expect(initial.balance).toBe(0);

      await service.create(tutorId, {
        studentId,
        amount: 5000,
        type: TransactionType.PAYMENT,
      });

      const afterPayment = await service.getBalance(tutorId, studentId);
      expect(afterPayment.balance).toBe(5000);

      await service.create(tutorId, {
        studentId,
        amount: 1500,
        type: TransactionType.CHARGE,
      });

      const afterCharge = await service.getBalance(tutorId, studentId);
      expect(afterCharge.balance).toBe(3500);
    });
  });

  describe('Service-Level Security (checkStudentOwnership)', () => {
    it('should forbid a stranger tutor from creating a transaction', async () => {
      await expect(
        service.create(strangerTutorId, {
          studentId,
          amount: 1000,
          type: TransactionType.PAYMENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid a stranger tutor from viewing the balance', async () => {
      await expect(
        service.getBalance(strangerTutorId, studentId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
