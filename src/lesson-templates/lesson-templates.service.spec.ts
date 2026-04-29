import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { LessonTemplatesService } from './lesson-templates.service';
import { DB_CONNECTION } from '../database/database.module';

const makeTx = () => ({
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  query: { lessons: { findMany: jest.fn() } },
});

const makeDb = () => {
  const tx = makeTx();
  return {
    query: {
      students: { findFirst: jest.fn() },
      lessonTemplates: { findMany: jest.fn() },
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    transaction: jest.fn().mockImplementation(async (cb) => cb(tx)),
    _tx: tx,
  };
};

const TUTOR_ID = 'tutor-uuid-1111';
const STUDENT_ID = 'student-uuid-2222';
const TEMPLATE_ID = 'template-uuid-3333';

const studentFixture = {
  id: STUDENT_ID,
  tutorId: TUTOR_ID,
  name: 'Иван Иванов',
  defaultPrice: 1500,
  isArchived: false,
};

const templateFixture = {
  id: TEMPLATE_ID,
  studentId: STUDENT_ID,
  dayOfWeek: 2,
  startTime: '10:00',
  durationMinutes: 60,
  defaultPrice: 1500,
  intervalWeeks: 1,
  firstLessonDate: new Date('2026-05-05T10:00:00Z'),
};

const makeGeneratedLessons = (count: number, intervalWeeks: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `lesson-uuid-00${i}`,
    studentId: STUDENT_ID,
    templateId: TEMPLATE_ID,
    scheduledAt: new Date(
      Date.parse('2026-05-05T10:00:00Z') + i * intervalWeeks * 7 * 24 * 60 * 60 * 1000,
    ),
    status: 'PLANNED' as const,
    priceToCharge: 1500,
  }));

describe('LessonTemplatesService', () => {
  let service: LessonTemplatesService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(async () => {
    db = makeDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonTemplatesService,
        { provide: DB_CONNECTION, useValue: db },
      ],
    }).compile();
    service = module.get<LessonTemplatesService>(LessonTemplatesService);
  });

  const baseDto = {
    studentId: STUDENT_ID,
    dayOfWeek: 2,
    startTime: '10:00',
    durationMinutes: 60,
    defaultPrice: 1500,
    intervalWeeks: 1,
    firstLessonDate: '2026-05-05T10:00:00Z',
  };

  // ──────────────────────────────────────────────
  // create()
  // ──────────────────────────────────────────────

  describe('create()', () => {
    const setup = (intervalWeeks = 1) => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      const tx = db._tx;
      tx.returning
        .mockResolvedValueOnce([{ ...templateFixture, intervalWeeks }])
        .mockResolvedValueOnce(makeGeneratedLessons(4, intervalWeeks));
    };

    it('генерирует ровно 4 урока', async () => {
      setup(1);
      const result = await service.create(TUTOR_ID, baseDto);
      expect(result.generatedLessonsCount).toBe(4);
    });

    it('ответ содержит template, generatedLessonsCount, firstGeneratedLesson', async () => {
      setup(1);
      const result = await service.create(TUTOR_ID, baseDto);
      expect(result).toHaveProperty('template');
      expect(result).toHaveProperty('firstGeneratedLesson');
    });

    it('intervalWeeks=1 — шаг между уроками 7 дней', async () => {
      setup(1);
      await service.create(TUTOR_ID, { ...baseDto, intervalWeeks: 1 });
      const tx = db._tx;
      const lessonsPayload = tx.values.mock.calls[1]?.[0] as Array<{ scheduledAt: Date }>;
      if (lessonsPayload?.length >= 2) {
        const diff = lessonsPayload[1].scheduledAt.getTime() - lessonsPayload[0].scheduledAt.getTime();
        expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
      }
    });

    it('intervalWeeks=2 — шаг между уроками 14 дней', async () => {
      setup(2);
      await service.create(TUTOR_ID, { ...baseDto, intervalWeeks: 2 });
      const tx = db._tx;
      const lessonsPayload = tx.values.mock.calls[1]?.[0] as Array<{ scheduledAt: Date }>;
      if (lessonsPayload?.length >= 2) {
        const diff = lessonsPayload[1].scheduledAt.getTime() - lessonsPayload[0].scheduledAt.getTime();
        expect(diff).toBe(14 * 24 * 60 * 60 * 1000);
      }
    });

    it('цена уроков берётся из defaultPrice DTO', async () => {
      setup(1);
      await service.create(TUTOR_ID, { ...baseDto, defaultPrice: 2000 });
      const tx = db._tx;
      const lessonsPayload = tx.values.mock.calls[1]?.[0] as Array<{ priceToCharge: number }>;
      expect(lessonsPayload?.every((l) => l.priceToCharge === 2000)).toBe(true);
    });

    it('выбрасывает ForbiddenException для чужого студента', async () => {
      db.query.students.findFirst.mockResolvedValue(null);
      await expect(service.create(TUTOR_ID, baseDto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────
  // findAllForStudent()
  // ──────────────────────────────────────────────

  describe('findAllForStudent()', () => {
    it('возвращает список шаблонов', async () => {
      db.query.students.findFirst.mockResolvedValue(studentFixture);
      db.query.lessonTemplates.findMany.mockResolvedValue([templateFixture]);
      const result = await service.findAllForStudent(TUTOR_ID, STUDENT_ID);
      expect(result).toHaveLength(1);
    });

    it('выбрасывает ForbiddenException для чужого студента', async () => {
      db.query.students.findFirst.mockResolvedValue(null);
      await expect(service.findAllForStudent(TUTOR_ID, STUDENT_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────
  // update()
  // ──────────────────────────────────────────────

  describe('update()', () => {
    it('выбрасывает ForbiddenException если шаблон не найден', async () => {
      db.limit.mockResolvedValue([]);
      await expect(service.update(TEMPLATE_ID, TUTOR_ID, { defaultPrice: 2000 })).rejects.toThrow(ForbiddenException);
    });

    it('выбрасывает ForbiddenException для чужого шаблона', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: 'other-tutor' }]);
      await expect(service.update(TEMPLATE_ID, TUTOR_ID, {})).rejects.toThrow(ForbiddenException);
    });

    it('при изменении defaultPrice обновляет priceToCharge у PLANNED уроков', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: TUTOR_ID }]);
      const tx = db._tx;
      tx.returning.mockResolvedValue([{ ...templateFixture, defaultPrice: 2000 }]);
      tx.query.lessons.findMany.mockResolvedValue([
        { id: 'lesson-1', status: 'PLANNED', scheduledAt: new Date() },
      ]);

      await service.update(TEMPLATE_ID, TUTOR_ID, { defaultPrice: 2000 });

      expect(tx.set).toHaveBeenCalledWith(expect.objectContaining({ priceToCharge: 2000 }));
    });

    it('при изменении startTime обновляет scheduledAt у PLANNED уроков', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: TUTOR_ID }]);
      const tx = db._tx;
      tx.returning.mockResolvedValue([{ ...templateFixture, startTime: '14:00' }]);
      tx.query.lessons.findMany.mockResolvedValue([
        { id: 'lesson-1', status: 'PLANNED', scheduledAt: new Date('2026-05-05T10:00:00Z') },
      ]);

      await service.update(TEMPLATE_ID, TUTOR_ID, { startTime: '14:00' });

      expect(tx.set).toHaveBeenCalledWith(expect.objectContaining({ scheduledAt: expect.any(Date) }));
    });

    it('без изменений цены/времени — уроки не трогаются', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: TUTOR_ID }]);
      const tx = db._tx;
      tx.returning.mockResolvedValue([templateFixture]);
      tx.query.lessons.findMany.mockResolvedValue([
        { id: 'lesson-1', status: 'PLANNED', scheduledAt: new Date() },
      ]);

      await service.update(TEMPLATE_ID, TUTOR_ID, { dayOfWeek: 3 });

      expect(tx.set).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // remove()
  // ──────────────────────────────────────────────

  describe('remove()', () => {
    it('успешно удаляет шаблон', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: TUTOR_ID }]);
      db.returning.mockResolvedValue([templateFixture]);
      const result = await service.remove(TEMPLATE_ID, TUTOR_ID);
      expect(result.id).toBe(TEMPLATE_ID);
    });

    it('выбрасывает ForbiddenException для чужого шаблона', async () => {
      db.limit.mockResolvedValue([{ templateId: TEMPLATE_ID, tutorId: 'other-tutor' }]);
      await expect(service.remove(TEMPLATE_ID, TUTOR_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});
