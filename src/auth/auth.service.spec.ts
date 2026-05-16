import {
  INestApplication,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { setupTestApp, cleanDatabase } from '../../test/test-utils';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

describe('AuthService (Integration)', () => {
  let app: INestApplication;
  let service: AuthService;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;
    service = app.get<AuthService>(AuthService);
    app.enableShutdownHooks();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  afterAll(async () => {
    await app.close();
  });

  const testDto = {
    email: 'integration@test.com',
    password: 'Password123!',
    name: 'Integration Tutor',
  };

  describe('register', () => {
    it('should successfully register and return a token', async () => {
      const result = await service.register(testDto);

      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(testDto.email);

      const savedUser = await db.query.tutors.findFirst({
        where: eq(schema.tutors.email, testDto.email),
      });

      expect(savedUser).toBeDefined();
      expect(savedUser?.name).toBe(testDto.name);

      const isHashValid = await bcrypt.compare(
        testDto.password,
        savedUser!.passwordHash,
      );
      expect(isHashValid).toBe(true);
    });

    it('should throw BadRequestException for duplicate email', async () => {
      await service.register(testDto);

      await expect(service.register(testDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(testDto);
    });

    it('should successfully login and return token', async () => {
      const result = await service.login({
        email: testDto.email,
        password: testDto.password,
      });

      expect(result).toHaveProperty('access_token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      await expect(
        service.login({ email: testDto.email, password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      await expect(
        service.login({ email: 'nobody@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
