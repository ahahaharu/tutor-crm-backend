import { TestingModule, Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DB_CONNECTION } from '../src/database/database.module';
import * as schema from '../src/db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function setupTestApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  const db = moduleFixture.get<NodePgDatabase<typeof schema>>(DB_CONNECTION);

  return { app, db };
}

export async function cleanDatabase(db: NodePgDatabase<typeof schema>) {
  const tables = [
    schema.transactions,
    schema.lessons,
    schema.lessonTemplates,
    schema.students,
    schema.tutors,
  ];

  for (const table of tables) {
    await db.delete(table);
  }
}
