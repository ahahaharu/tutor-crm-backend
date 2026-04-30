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

    service = app.get<LessonTemplatesService>(LessonTemplatesService);
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

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
    it('should create a template and generate 4 lessons with the correct interval', async () => {
      const firstLessonDate = new Date('2026-04-01T15:00:00.000Z');

      const result = await service.create(tutorId, {
        studentId,
        dayOfWeek: 3,
        startTime: '15:00:00',
        durationMinutes: 60,
        defaultPrice: 1500,
        intervalWeeks: 2,
        firstLessonDate: firstLessonDate.toISOString(),
      });

      expect(result.generatedLessonsCount).toBe(4);

      const generatedLessons = await db.query.lessons.findMany({
        where: eq(schema.lessons.templateId, result.template.id),
        orderBy: (lessons, { asc }) => [asc(lessons.scheduledAt)],
      });

      expect(generatedLessons).toHaveLength(4);

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
    it('should update the template and cascade price and time changes to future lessons', async () => {
      const createResult = await service.create(tutorId, {
        studentId,
        dayOfWeek: 1,
        startTime: '10:00:00',
        durationMinutes: 60,
        defaultPrice: 1000,
        intervalWeeks: 1,
        firstLessonDate: new Date('2026-05-04T10:00:00.000Z').toISOString(),
      });

      await service.update(createResult.template.id, tutorId, {
        defaultPrice: 2500,
        startTime: '18:30:00',
      });

      const updatedLessons = await db.query.lessons.findMany({
        where: eq(schema.lessons.templateId, createResult.template.id),
      });

      updatedLessons.forEach((lesson) => {
        expect(lesson.priceToCharge).toBe(2500);

        const lessonDate = new Date(lesson.scheduledAt);
        expect(lessonDate.getUTCHours()).toBe(18);
        expect(lessonDate.getUTCMinutes()).toBe(30);
      });
    });
  });
});
