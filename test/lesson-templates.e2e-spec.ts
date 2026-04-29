import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { Server } from 'http';

describe('LessonTemplatesModule (e2e) - Lifecycle & Security', () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let server: Server;

  let tokenA: string;
  let tokenB: string;
  let studentIdA: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;
    server = app.getHttpServer() as Server;
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    const tutorA = await request(server).post('/auth/register').send({
      email: 'templates-tutorA@test.com',
      password: 'Password123!',
      name: 'Tutor A',
    });
    tokenA = (tutorA.body as { access_token: string }).access_token;

    const tutorB = await request(server).post('/auth/register').send({
      email: 'templates-tutorB@test.com',
      password: 'Password123!',
      name: 'Tutor B',
    });
    tokenB = (tutorB.body as { access_token: string }).access_token;

    const studentA = await request(server)
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student A', defaultPrice: 1000 });
    studentIdA = (studentA.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const getFutureDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString();
  };

  const validTemplatePayload = {
    dayOfWeek: 1,
    startTime: '15:00:00',
    durationMinutes: 60,
    defaultPrice: 1500,
    intervalWeeks: 1,
  };

  describe('Positive Scenarios', () => {
    it('should allow Tutor A to create a template for their student', async () => {
      const payload = {
        ...validTemplatePayload,
        studentId: studentIdA,
        firstLessonDate: getFutureDate(),
      };

      const res = await request(server)
        .post('/lesson-templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload)
        .expect(201);

      interface TemplateCreationResponse {
        message: string;
        template: {
          id: string;
          studentId: string;
          dayOfWeek: number;
        };
        generatedLessonsCount: number;
      }

      const body = res.body as TemplateCreationResponse;

      expect(body.template).toHaveProperty('id');
      expect(body.template.studentId).toBe(studentIdA);
      expect(body.template.dayOfWeek).toBe(1);
      expect(body.generatedLessonsCount).toBeGreaterThan(0);
    });

    it('should allow Tutor A to get templates of their student', async () => {
      await request(server)
        .post('/lesson-templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...validTemplatePayload,
          studentId: studentIdA,
          firstLessonDate: getFutureDate(),
        });

      const res = await request(server)
        .get(`/lesson-templates/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as unknown[];
      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  describe('Zero Trust Security', () => {
    it('should not allow Tutor B to create a template for Tutor A student', async () => {
      await request(server)
        .post('/lesson-templates')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          ...validTemplatePayload,
          studentId: studentIdA,
          firstLessonDate: getFutureDate(),
        })
        .expect(403);
    });

    it('should not allow Tutor B to get templates of Tutor A student', async () => {
      await request(server)
        .get(`/lesson-templates/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should not allow Tutor B to update or delete Tutor A template', async () => {
      const createRes = await request(server)
        .post('/lesson-templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...validTemplatePayload,
          studentId: studentIdA,
          firstLessonDate: getFutureDate(),
        });

      const templateId = (createRes.body as { template: { id: string } })
        .template.id;

      await request(server)
        .patch(`/lesson-templates/${templateId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ defaultPrice: 5000 })
        .expect(403);

      await request(server)
        .delete(`/lesson-templates/${templateId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });
  });
});
