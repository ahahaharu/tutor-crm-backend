import { INestApplication } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { setupTestApp, cleanDatabase } from '../../test/test-utils';
import { eq } from 'drizzle-orm';
import { LessonStatus } from './dto/create-lesson.dto';

describe('LessonsService (Integration)', () => {
  let app: INestApplication;
  let service: LessonsService;
  let db: NodePgDatabase<typeof schema>;

  let tutorId: string;
  let studentId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;
    service = app.get<LessonsService>(LessonsService);
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    const [tutor] = await db
      .insert(schema.tutors)
      .values({
        email: 'billing-tutor@test.com',
        passwordHash: 'hash',
        name: 'Billing Tutor',
      })
      .returning();
    tutorId = tutor.id;

    const [student] = await db
      .insert(schema.students)
      .values({
        tutorId: tutor.id,
        name: 'Billing Student',
        defaultPrice: 1000,
      })
      .returning();
    studentId = student.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Automatic Billing Logic', () => {
    it('should create a CHARGE transaction when a lesson is marked as COMPLETED', async () => {
      const lesson = await service.create(tutorId, {
        studentId,
        scheduledAt: new Date('2026-05-01T15:00:00Z'),
      });

      await service.update(lesson.id, tutorId, {
        status: LessonStatus.COMPLETED,
      });

      const transactions = await db.query.transactions.findMany({
        where: eq(schema.transactions.lessonId, lesson.id),
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('CHARGE');
      expect(transactions[0].amount).toBe(1000);
    });

    it('should delete the CHARGE transaction if the lesson status changes from COMPLETED to PLANNED', async () => {
      const lesson = await service.create(tutorId, {
        studentId,
        scheduledAt: new Date('2026-05-01T15:00:00Z'),
      });

      // Завершаем урок (создается транзакция)
      await service.update(lesson.id, tutorId, {
        status: LessonStatus.COMPLETED,
      });

      await service.update(lesson.id, tutorId, {
        status: LessonStatus.PLANNED,
      });

      const transactions = await db.query.transactions.findMany({
        where: eq(schema.transactions.lessonId, lesson.id),
      });

      expect(transactions).toHaveLength(0);
    });

    it('should update the transaction amount if the price of a COMPLETED lesson changes', async () => {
      const lesson = await service.create(tutorId, {
        studentId,
        scheduledAt: new Date('2026-05-01T15:00:00Z'),
        priceToCharge: 1500,
      });

      await service.update(lesson.id, tutorId, {
        status: LessonStatus.COMPLETED,
      });

      await service.update(lesson.id, tutorId, { priceToCharge: 2000 });

      const transactions = await db.query.transactions.findMany({
        where: eq(schema.transactions.lessonId, lesson.id),
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(2000);
    });
  });
});
