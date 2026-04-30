import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { Server } from 'http';

describe('StudentsModule (e2e) - Security & Data Isolation', () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let httpServer: Server;

  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    httpServer = app.getHttpServer() as unknown as Server;

    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    const tutorA = await request(httpServer).post('/auth/register').send({
      email: 'students-tutorA@test.com',
      password: 'Password123!',
      name: 'Tutor A',
    });

    tokenA = (tutorA.body as { access_token: string }).access_token;

    const tutorB = await request(httpServer).post('/auth/register').send({
      email: 'students-tutorB@test.com',
      password: 'Password123!',
      name: 'Tutor B',
    });

    tokenB = (tutorB.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Tutor A should successfully create their own student', async () => {
    const res = await request(httpServer)
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Student A',
        defaultPrice: 1500,
      })
      .expect(201);

    const body = res.body as { id: string; name: string };
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name', 'Student A');
  });

  it("Tutor B MUST NOT have access to Tutor A's student (GET)", async () => {
    const createRes = await request(httpServer)
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student A', defaultPrice: 1500 });

    const studentId = (createRes.body as { id: string }).id;

    await request(httpServer)
      .get(`/students/${studentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it("Tutor B MUST NOT be able to delete Tutor A's student (DELETE)", async () => {
    const createRes = await request(httpServer)
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student A', defaultPrice: 1500 });

    const studentId = (createRes.body as { id: string }).id;

    await request(httpServer)
      .delete(`/students/${studentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('Tutor A should only retrieve their own students (GET /students)', async () => {
    await request(httpServer)
      .post('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Student For A', defaultPrice: 1000 });

    await request(httpServer)
      .post('/students')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Student For B', defaultPrice: 2000 });

    const res = await request(httpServer)
      .get('/students')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const body = res.body as { data: Array<{ name: string }> };

    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Student For A');
  });
});
