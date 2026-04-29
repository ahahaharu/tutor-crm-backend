import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DB_CONNECTION } from '../database/database.module';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDb = () => ({
  query: {
    tutors: { findFirst: jest.fn() },
  },
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
});

const makeJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TUTOR_ID = 'tutor-uuid-0001';
const EMAIL = 'test@tutor.com';
const PASSWORD = 'SuperSecret123';
const HASHED = bcrypt.hashSync(PASSWORD, 10);

const tutorFixture = {
  id: TUTOR_ID,
  email: EMAIL,
  name: 'Test Tutor',
  passwordHash: HASHED,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;
  let db: ReturnType<typeof makeDb>;
  let jwtService: ReturnType<typeof makeJwtService>;

  beforeEach(async () => {
    db = makeDb();
    jwtService = makeJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DB_CONNECTION, useValue: db },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // register()
  // ─────────────────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('успешно регистрирует пользователя и возвращает access_token', async () => {
      db.query.tutors.findFirst.mockResolvedValue(null);
      db.returning.mockResolvedValue([tutorFixture]);

      const result = await service.register({
        name: 'Test Tutor',
        email: EMAIL,
        password: PASSWORD,
      });

      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
      expect(result.user).toMatchObject({ id: TUTOR_ID, email: EMAIL, name: 'Test Tutor' });
    });

    it('выбрасывает BadRequestException при дублирующемся email', async () => {
      db.query.tutors.findFirst.mockResolvedValue(tutorFixture);

      await expect(
        service.register({ name: 'Test', email: EMAIL, password: PASSWORD }),
      ).rejects.toThrow(BadRequestException);
    });

    it('не хранит пароль в открытом виде (хеш отличается от пароля)', async () => {
      db.query.tutors.findFirst.mockResolvedValue(null);

      let capturedHash: string = '';
      db.returning.mockImplementation(async function (this: unknown) {
        // Перехватываем values, чтобы проверить хеш
        return [tutorFixture];
      });

      // Мокаем insert/values чтобы получить вставляемые данные
      const capturedValues: Record<string, unknown>[] = [];
      db.values.mockImplementation(function (vals: Record<string, unknown>) {
        capturedValues.push(vals);
        return db;
      });

      await service.register({ name: 'Test', email: EMAIL, password: PASSWORD });

      capturedHash = capturedValues[0]?.passwordHash as string;

      expect(capturedHash).not.toBe(PASSWORD);
      const isValid = await bcrypt.compare(PASSWORD, capturedHash);
      expect(isValid).toBe(true);
    });

    it('генерирует JWT-токен с правильным payload (sub, email)', async () => {
      db.query.tutors.findFirst.mockResolvedValue(null);
      db.returning.mockResolvedValue([tutorFixture]);

      await service.register({ name: 'Test', email: EMAIL, password: PASSWORD });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: TUTOR_ID, email: EMAIL }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // login()
  // ─────────────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('успешно логинит и возвращает access_token', async () => {
      db.query.tutors.findFirst.mockResolvedValue(tutorFixture);

      const result = await service.login({ email: EMAIL, password: PASSWORD });

      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
      expect(result.user.email).toBe(EMAIL);
    });

    it('выбрасывает UnauthorizedException при несуществующем email', async () => {
      db.query.tutors.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@email.com', password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('выбрасывает UnauthorizedException при неверном пароле', async () => {
      db.query.tutors.findFirst.mockResolvedValue(tutorFixture);

      await expect(
        service.login({ email: EMAIL, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('не раскрывает причину ошибки (одинаковое сообщение для неверного email/пароля)', async () => {
      db.query.tutors.findFirst.mockResolvedValue(null);

      let error1: Error | null = null;
      try {
        await service.login({ email: 'wrong@email.com', password: PASSWORD });
      } catch (e) {
        error1 = e as Error;
      }

      db.query.tutors.findFirst.mockResolvedValue(tutorFixture);

      let error2: Error | null = null;
      try {
        await service.login({ email: EMAIL, password: 'wrongpass' });
      } catch (e) {
        error2 = e as Error;
      }

      expect(error1?.message).toBe(error2?.message);
    });
  });
});
