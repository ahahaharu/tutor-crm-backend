import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';

describe('StudentsModule (e2e) - Security & Data Isolation', () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    const tutorA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'students-tutorA@test.com',
        password: 'Password123!',
        name: 'Tutor A',
      });

    tokenA = (tutorA.body as { access_token: string }).access_token;

    const tutorB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'students-tutorB@test.com',
        password: 'Password123!',
        name: 'Tutor B',
      });

    tokenB = (tutorB.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Tutor A должен успешно создать своего студента', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Student A',
        defaultPrice: 1500,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Student A');
  });

  it('Tutor B НЕ ДОЛЖЕН иметь доступ к студенту Tutor A (GET)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student A', defaultPrice: 1500 });

    const studentId = (createRes.body as { id: string }).id;

    await request(app.getHttpServer())
      .get(`/students/${studentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('Tutor B НЕ ДОЛЖЕН иметь возможность удалить студента Tutor A (DELETE)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student A', defaultPrice: 1500 });

    const studentId = (createRes.body as { id: string }).id;

    await request(app.getHttpServer())
      .delete(`/students/${studentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
