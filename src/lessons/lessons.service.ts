import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class LessonsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAllByStudent(studentId: string) {
    return await this.db.query.lessons.findMany({
      where: eq(schema.lessons.studentId, studentId),
      orderBy: (lessons, { asc }) => [asc(lessons.scheduledAt)],
    });
  }
}
