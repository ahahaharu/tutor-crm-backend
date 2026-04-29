import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DB_CONNECTION } from '../database/database.module';
import { TransactionType } from './dto/create-transaction.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDb = () => ({
  query: {
    students: { findFirst: jest.fn() },
  },
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TUTOR_ID = 'tutor-uuid-1111';
const STUDENT_ID = 'student-uuid-2222';
const LESSON_ID = 'lesson-uuid-3333';

const studentFixture = {
  id: STUDENT_ID,
  tutorId: TUTOR_ID,
  name: 'Иван Иванов',
  defaultPrice: 1500,
  isArchived: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionsService', () => {
  let service: TransactionsService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(async () => {
    db = makeDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: DB_CONNECTION, useValue: db },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create()
  // ─────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('создаёт PAYMENT-транзакцию и возвращает её', async () => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      const tx = {
        id: 'tx-uuid-001',
        studentId: STUDENT_ID,
        amount: 1000,
        type: 'PAYMENT',
        lessonId: null,
        createdAt: new Date(),
      };
      db.returning.mockResolvedValue([tx]);

      const result = await service.create(TUTOR_ID, {
        studentId: STUDENT_ID,
        amount: 1000,
        type: TransactionType.PAYMENT,
      });

      expect(result.type).toBe('PAYMENT');
      expect(result.amount).toBe(1000);
    });

    it('создаёт CHARGE-транзакцию', async () => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      const tx = {
        id: 'tx-uuid-002',
        studentId: STUDENT_ID,
        amount: 500,
        type: 'CHARGE',
        lessonId: null,
        createdAt: new Date(),
      };
      db.returning.mockResolvedValue([tx]);

      const result = await service.create(TUTOR_ID, {
        studentId: STUDENT_ID,
        amount: 500,
        type: TransactionType.CHARGE,
      });

      expect(result.type).toBe('CHARGE');
    });

    it('сохраняет lessonId, если передан', async () => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      const tx = {
        id: 'tx-uuid-003',
        studentId: STUDENT_ID,
        amount: 1500,
        type: 'CHARGE',
        lessonId: LESSON_ID,
        createdAt: new Date(),
      };
      db.returning.mockResolvedValue([tx]);

      const result = await service.create(TUTOR_ID, {
        studentId: STUDENT_ID,
        amount: 1500,
        type: TransactionType.CHARGE,
        lessonId: LESSON_ID,
      });

      expect(result.lessonId).toBe(LESSON_ID);
    });

    it('выбрасывает ForbiddenException, если студент чужой', async () => {
      db.query.students.findFirst.mockResolvedValue(null);

      await expect(
        service.create(TUTOR_ID, {
          studentId: STUDENT_ID,
          amount: 1000,
          type: TransactionType.PAYMENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getBalance() — ⭐ динамический расчёт через SQL SUM
  // ─────────────────────────────────────────────────────────────────────────

  describe('getBalance()', () => {
    const setupBalance = (balance: number) => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      db.where.mockResolvedValue([{ balance }]);
    };

    it('возвращает положительный баланс при только PAYMENT', async () => {
      setupBalance(3000);

      const result = await service.getBalance(TUTOR_ID, STUDENT_ID);

      expect(result.balance).toBe(3000);
      expect(result.studentId).toBe(STUDENT_ID);
    });

    it('возвращает отрицательный баланс при только CHARGE', async () => {
      setupBalance(-1500);

      const result = await service.getBalance(TUTOR_ID, STUDENT_ID);

      expect(result.balance).toBe(-1500);
    });

    it('возвращает 0, если транзакций нет', async () => {
      setupBalance(0);

      const result = await service.getBalance(TUTOR_ID, STUDENT_ID);

      expect(result.balance).toBe(0);
    });

    it('возвращает корректный баланс при смешанных транзакциях (PAYMENT - CHARGE)', async () => {
      // 5000 PAYMENT - 3500 CHARGE = 1500
      setupBalance(1500);

      const result = await service.getBalance(TUTOR_ID, STUDENT_ID);

      expect(result.balance).toBe(1500);
    });

    it('выбрасывает ForbiddenException для чужого студента', async () => {
      db.query.students.findFirst.mockResolvedValue(null);

      await expect(
        service.getBalance(TUTOR_ID, STUDENT_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
