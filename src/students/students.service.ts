import { Injectable, Inject } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createStudentDto: CreateStudentDto, tutorId: string) {
    const newStudent = await this.db
      .insert(schema.students)
      .values({
        tutorId: tutorId,
        name: createStudentDto.name,
        contactInfo: createStudentDto.contactInfo,
      })
      .returning();

    return newStudent[0];
  }

  async findAllByTutor(tutorId: string) {
    return await this.db.query.students.findMany({
      where: eq(schema.students.tutorId, tutorId),
    });
  }
}
