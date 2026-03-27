import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { CreateLessonTemplateDto } from './dto/create-lesson-template.dto';
import { UpdateLessonTemplateDto } from './dto/update-lesson-template.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class LessonTemplatesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tutorId: string, dto: CreateLessonTemplateDto) {
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, dto.studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });

    if (!student)
      throw new ForbiddenException('Student not found or access denied');

    return await this.db.transaction(async (tx) => {
      const [template] = await tx
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

      const generatedLessons = await tx
        .insert(schema.lessons)
        .values(lessonsToInsert)
        .returning();

      return {
        message: 'Template and lessons successfully generated',
        template,
        generatedLessonsCount: generatedLessons.length,
        firstGeneratedLesson: generatedLessons[0],
      };
    });
  }

  async findAllForStudent(tutorId: string, studentId: string) {
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });
    if (!student) throw new ForbiddenException('Access denied');

    return await this.db.query.lessonTemplates.findMany({
      where: eq(schema.lessonTemplates.studentId, studentId),
    });
  }

  async update(id: string, tutorId: string, dto: UpdateLessonTemplateDto) {
    const templateInfo = await this.db
      .select({
        templateId: schema.lessonTemplates.id,
        tutorId: schema.students.tutorId,
      })
      .from(schema.lessonTemplates)
      .innerJoin(
        schema.students,
        eq(schema.lessonTemplates.studentId, schema.students.id),
      )
      .where(eq(schema.lessonTemplates.id, id))
      .limit(1);

    if (templateInfo.length === 0 || templateInfo[0].tutorId !== tutorId) {
      throw new ForbiddenException('Template not found or access denied');
    }

    const { firstLessonDate, ...restDto } = dto;

    return await this.db.transaction(async (tx) => {
      const [updatedTemplate] = await tx
        .update(schema.lessonTemplates)
        .set({
          ...restDto,
          ...(firstLessonDate
            ? { firstLessonDate: new Date(firstLessonDate) }
            : {}),
        })
        .where(eq(schema.lessonTemplates.id, id))
        .returning();

      const futureLessons = await tx.query.lessons.findMany({
        where: and(
          eq(schema.lessons.templateId, id),
          eq(schema.lessons.status, 'PLANNED'),
        ),
      });

      for (const lesson of futureLessons) {
        const updateData: Partial<typeof schema.lessons.$inferInsert> = {};

        if (restDto.defaultPrice !== undefined) {
          updateData.priceToCharge = restDto.defaultPrice;
        }

        if (restDto.startTime) {
          const [hours, minutes] = restDto.startTime.split(':').map(Number);
          const newDate = new Date(lesson.scheduledAt);
          newDate.setUTCHours(hours, minutes, 0, 0);
          updateData.scheduledAt = newDate;
        }

        if (Object.keys(updateData).length > 0) {
          await tx
            .update(schema.lessons)
            .set(updateData)
            .where(eq(schema.lessons.id, lesson.id));
        }
      }

      return updatedTemplate;
    });
  }

  async remove(id: string, tutorId: string) {
    const templateInfo = await this.db
      .select({
        templateId: schema.lessonTemplates.id,
        tutorId: schema.students.tutorId,
      })
      .from(schema.lessonTemplates)
      .innerJoin(
        schema.students,
        eq(schema.lessonTemplates.studentId, schema.students.id),
      )
      .where(eq(schema.lessonTemplates.id, id))
      .limit(1);

    if (templateInfo.length === 0 || templateInfo[0].tutorId !== tutorId) {
      throw new ForbiddenException('Template not found or access denied');
    }

    const [deletedTemplate] = await this.db
      .delete(schema.lessonTemplates)
      .where(eq(schema.lessonTemplates.id, id))
      .returning();

    return deletedTemplate;
  }
}
