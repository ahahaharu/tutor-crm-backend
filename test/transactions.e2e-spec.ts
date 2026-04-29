import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, cleanDatabase } from './test-utils';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import { Server } from 'http';
import { TransactionType } from '../src/transactions/dto/create-transaction.dto';

describe('TransactionsModule (e2e) - Lifecycle & Security', () => {
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
      email: 'tx-tutorA@test.com',
      password: 'Password123!',
      name: 'Tutor A',
    });
    tokenA = (tutorA.body as { access_token: string }).access_token;

    const tutorB = await request(server).post('/auth/register').send({
      email: 'tx-tutorB@test.com',
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

  describe('Positive Scenarios', () => {
    it('should allow Tutor A to add a PAYMENT transaction for their student', async () => {
      const res = await request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          studentId: studentIdA,
          amount: 5000,
          type: TransactionType.PAYMENT,
        })
        .expect(201);

      const body = res.body as {
        id: string;
        amount: number;
        type: TransactionType;
      };

      expect(body).toHaveProperty('id');
      expect(body.amount).toBe(5000);
      expect(body.type).toBe(TransactionType.PAYMENT);
    });

    it('should allow Tutor A to get the balance of their student', async () => {
      await request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          studentId: studentIdA,
          amount: 2500,
          type: TransactionType.PAYMENT,
        });

      await request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          studentId: studentIdA,
          amount: 1000,
          type: TransactionType.CHARGE,
        });

      const res = await request(server)
        .get(`/transactions/balance/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as { studentId: string; balance: number };

      expect(body.studentId).toBe(studentIdA);
      expect(body.balance).toBe(1500);
    });
  });

  describe('Zero Trust Security', () => {
    it('should not allow Tutor B to create a transaction for Tutor A student', async () => {
      await request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          studentId: studentIdA,
          amount: 1000,
          type: TransactionType.PAYMENT,
        })
        .expect(403);
    });

    it('should not allow Tutor B to get the balance of Tutor A student', async () => {
      await request(server)
        .get(`/transactions/balance/student/${studentIdA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });
  });
});
