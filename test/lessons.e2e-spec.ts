import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { LessonStatus } from '../src/lessons/dto/create-lesson.dto';
import { Server } from 'http';

describe('LessonsModule (e2e) - Lifecycle & Security', () => {
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
      email: 'lessons-tutorA@test.com',
      password: 'Password123!',
      name: 'Tutor A',
    });
    tokenA = (tutorA.body as { access_token: string }).access_token;

    const tutorB = await request(server).post('/auth/register').send({
      email: 'lessons-tutorB@test.com',
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

  describe('Positive Scenarios', () => {
    it('should allow Tutor A to create a lesson for their student', async () => {
      const scheduledAt = getFutureDate();

      const res = await request(server)
        .post('/lessons')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          studentId: studentIdA,
          scheduledAt,
          priceToCharge: 1500,
        })
        .expect(201);

      // Явно описываем ожидаемый тип ответа
      const body = res.body as {
        id: string;
        studentId: string;
        status: LessonStatus;
      };

      expect(body).toHaveProperty('id');
      expect(body.studentId).toBe(studentIdA);
      expect(body.status).toBe(LessonStatus.PLANNED);
    });

    it('should allow Tutor A to get lessons of their student', async () => {
      await request(server)
        .post('/lessons')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ studentId: studentIdA, scheduledAt: getFutureDate() });

      const res = await request(server)
        .get(`/lessons/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as unknown[];

      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  describe('Zero Trust Security', () => {
    it('should not allow Tutor B to create a lesson for Tutor A student', async () => {
      await request(server)
        .post('/lessons')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          studentId: studentIdA,
          scheduledAt: getFutureDate(),
        })
        .expect(403);
    });

    it('should not allow Tutor B to get lessons of Tutor A student', async () => {
      await request(server)
        .get(`/lessons/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should not allow Tutor B to update or delete Tutor A lesson', async () => {
      const createRes = await request(server)
        .post('/lessons')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ studentId: studentIdA, scheduledAt: getFutureDate() });

      const lessonId = (createRes.body as { id: string }).id;

      await request(server)
        .patch(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: LessonStatus.COMPLETED })
        .expect(403);

      await request(server)
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });
  });
});
