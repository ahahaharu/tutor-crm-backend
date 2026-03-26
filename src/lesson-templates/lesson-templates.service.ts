import { Injectable, Inject } from '@nestjs/common';
import { CreateLessonTemplateDto } from './dto/create-lesson-template.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

@Injectable()
export class LessonTemplatesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateLessonTemplateDto) {
    const [template] = await this.db
      .insert(schema.lessonTemplates)
      .values({
        studentId: dto.studentId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        defaultPrice: dto.defaultPrice,
        intervalWeeks: dto.intervalWeeks || 1,
        firstLessonDate: new Date(dto.firstLessonDate),
      })
      .returning();

    const lessonsToInsert: (typeof schema.lessons.$inferInsert)[] = [];
    const currentDate = new Date(dto.firstLessonDate);
    const intervalDays = 7 * template.intervalWeeks;

    for (let i = 0; i < 4; i++) {
      lessonsToInsert.push({
        studentId: dto.studentId,
        templateId: template.id,
        scheduledAt: new Date(currentDate),
        status: 'PLANNED' as const,
        priceToCharge: dto.defaultPrice,
      });
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    const generatedLessons = await this.db
      .insert(schema.lessons)
      .values(lessonsToInsert)
      .returning();

    return {
      message: 'Template and lessons successfully generated',
      template,
      generatedLessonsCount: generatedLessons.length,
      firstGeneratedLesson: generatedLessons[0],
    };
  }
}
