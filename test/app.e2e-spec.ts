import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';

interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string | string[];
  field?: string;
  timestamp: string;
  path: string;
  method: string;
}

interface SuccessAuthBody {
  user: { id: string; email: string };
  access_token: string;
}

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test Tutor',
  };

  it('/auth/register (POST) - should register successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const body = response.body as SuccessAuthBody;

    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(testUser.email);
    expect(body).toHaveProperty('access_token');
  });

  it('/auth/register (POST) - error 400 validation failed (class-validator)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: '123',
        name: '',
      })
      .expect(400);

    const body = response.body as ErrorResponseBody;

    expect(body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(body.message)).toBe(true);
  });

  it('/auth/register (POST) - error 400 duplicate email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(400);

    const body = response.body as ErrorResponseBody;

    expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(body.field).toBe('email');
  });

  it('/auth/login (POST) - should return token', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const body = response.body as SuccessAuthBody;

    expect(body).toHaveProperty('access_token');
  });

  it('/auth/login (POST) - error 401 with correct strict structure', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      })
      .expect(401);

    const body = response.body as ErrorResponseBody;

    expect(body.code).toBe('INVALID_CREDENTIALS');
    expect(body).toHaveProperty('message');
  });
});
