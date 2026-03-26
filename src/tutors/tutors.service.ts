import { Injectable, Inject } from '@nestjs/common';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

@Injectable()
export class TutorsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createTutorDto: CreateTutorDto) {
    const newTutor = await this.db
      .insert(schema.tutors)
      .values({
        name: createTutorDto.name,
        email: 'test@example.com',
        passwordHash: 'fake_hash',
      })
      .returning();

    return newTutor[0];
  }

  async findAll() {
    return await this.db.query.tutors.findMany();
  }
}
