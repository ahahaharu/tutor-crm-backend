import { INestApplication } from '@nestjs/common';
import { LessonTemplatesService } from './lesson-templates.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { setupTestApp, cleanDatabase } from '../../test/test-utils';
import { eq } from 'drizzle-orm';

describe('LessonTemplatesService (Integration)', () => {
  let app: INestApplication;
  let service: LessonTemplatesService;
  let db: NodePgDatabase<typeof schema>;

  let tutorId: string;
  let studentId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    // Достаем наш сервис напрямую из DI-контейнера NestJS
    service = app.get<LessonTemplatesService>(LessonTemplatesService);
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    // В интеграционных тестах мы можем не дергать API авторизации,
    // а создавать записи напрямую в БД — это быстрее и надежнее.
    const [tutor] = await db
      .insert(schema.tutors)
      .values({
        email: 'integration@test.com',
        passwordHash: 'hash',
        name: 'Integration Tutor',
      })
      .returning();
    tutorId = tutor.id;

    const [student] = await db
      .insert(schema.students)
      .values({
        tutorId: tutor.id,
        name: 'Integration Student',
        defaultPrice: 1000,
      })
      .returning();
    studentId = student.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create()', () => {
    it('должен создать шаблон и сгенерировать 4 урока с правильным интервалом', async () => {
      // 2026-04-01 - это Среда
      const firstLessonDate = new Date('2026-04-01T15:00:00.000Z');

      const result = await service.create(tutorId, {
        studentId,
        dayOfWeek: 3, // Среда
        startTime: '15:00:00',
        durationMinutes: 60,
        defaultPrice: 1500,
        intervalWeeks: 2, // Раз в ДВЕ недели
        firstLessonDate: firstLessonDate.toISOString(),
      });

      expect(result.generatedLessonsCount).toBe(4);

      // Проверяем, что уроки реально появились в базе
      const generatedLessons = await db.query.lessons.findMany({
        where: eq(schema.lessons.templateId, result.template.id),
        orderBy: (lessons, { asc }) => [asc(lessons.scheduledAt)],
      });

      expect(generatedLessons).toHaveLength(4);

      // Проверяем математику дат (шаг в 14 дней, так как intervalWeeks = 2)
      const expectedDates = [
        '2026-04-01T15:00:00.000Z',
        '2026-04-15T15:00:00.000Z',
        '2026-04-29T15:00:00.000Z',
        '2026-05-13T15:00:00.000Z',
      ];

      generatedLessons.forEach((lesson, index) => {
        expect(lesson.scheduledAt.toISOString()).toBe(expectedDates[index]);
        expect(lesson.priceToCharge).toBe(1500);
      });
    });
  });

  describe('update()', () => {
    it('должен обновить шаблон и каскадно изменить цену и время у будущих уроков', async () => {
      // 1. Создаем шаблон
      const createResult = await service.create(tutorId, {
        studentId,
        dayOfWeek: 1,
        startTime: '10:00:00',
        durationMinutes: 60,
        defaultPrice: 1000,
        intervalWeeks: 1,
        firstLessonDate: new Date('2026-05-04T10:00:00.000Z').toISOString(),
      });

      // 2. Обновляем цену и время
      await service.update(createResult.template.id, tutorId, {
        defaultPrice: 2500,
        startTime: '18:30:00',
      });

      // 3. Достаем обновленные уроки из базы
      const updatedLessons = await db.query.lessons.findMany({
        where: eq(schema.lessons.templateId, createResult.template.id),
      });

      // 4. Проверяем, что каскадное обновление сработало
      updatedLessons.forEach((lesson) => {
        expect(lesson.priceToCharge).toBe(2500);

        // Проверяем, что время изменилось на 18:30
        const lessonDate = new Date(lesson.scheduledAt);
        expect(lessonDate.getUTCHours()).toBe(18);
        expect(lessonDate.getUTCMinutes()).toBe(30);
      });
    });
  });
});
