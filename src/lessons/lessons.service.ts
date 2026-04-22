import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateLessonDto, LessonStatus } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tutorId: string, createLessonDto: CreateLessonDto) {
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, createLessonDto.studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });

    if (!student) {
      throw new ForbiddenException('Student not found or access denied');
    }

    const finalPrice =
      createLessonDto.priceToCharge !== undefined
        ? createLessonDto.priceToCharge
        : student.defaultPrice;

    const [newLesson] = await this.db
      .insert(schema.lessons)
      .values({
        studentId: createLessonDto.studentId,
        scheduledAt: createLessonDto.scheduledAt,
        priceToCharge: finalPrice,
        status: createLessonDto.status,
      })
      .returning();

    return newLesson;
  }

  async findAllForTutor(tutorId: string) {
    const lessonsList = await this.db
      .select({
        lesson: schema.lessons,
        student: {
          id: schema.students.id,
          name: schema.students.name,
          avatarUrl: schema.students.avatarUrl,
        },
      })
      .from(schema.lessons)
      .innerJoin(
        schema.students,
        eq(schema.lessons.studentId, schema.students.id),
      )
      .where(eq(schema.students.tutorId, tutorId))
      .orderBy(schema.lessons.scheduledAt);

    return lessonsList.map((row) => ({
      ...row.lesson,
      student: row.student,
    }));
  }

  async findAllForStudent(tutorId: string, studentId: string) {
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });

    if (!student) throw new ForbiddenException('Access denied');

    return await this.db.query.lessons.findMany({
      where: eq(schema.lessons.studentId, studentId),
      orderBy: (lessons, { asc }) => [asc(lessons.scheduledAt)],
    });
  }

  async update(id: string, tutorId: string, updateLessonDto: UpdateLessonDto) {
    const [currentLessonInfo] = await this.db
      .select({
        lessonId: schema.lessons.id,
        tutorId: schema.students.tutorId,
        studentId: schema.lessons.studentId,
        status: schema.lessons.status,
        priceToCharge: schema.lessons.priceToCharge,
      })
      .from(schema.lessons)
      .innerJoin(
        schema.students,
        eq(schema.lessons.studentId, schema.students.id),
      )
      .where(eq(schema.lessons.id, id))
      .limit(1);

    if (!currentLessonInfo || currentLessonInfo.tutorId !== tutorId) {
      throw new ForbiddenException('Lesson not found or access denied');
    }

    return await this.db.transaction(async (tx) => {
      const [updatedLesson] = await tx
        .update(schema.lessons)
        .set(updateLessonDto)
        .where(eq(schema.lessons.id, id))
        .returning();

      const finalPrice =
        updateLessonDto.priceToCharge !== undefined
          ? updateLessonDto.priceToCharge
          : currentLessonInfo.priceToCharge;

      if (
        updateLessonDto.status === LessonStatus.COMPLETED &&
        currentLessonInfo.status !== 'COMPLETED'
      ) {
        await tx.insert(schema.transactions).values({
          studentId: currentLessonInfo.studentId,
          lessonId: id,
          amount: finalPrice,
          type: 'CHARGE',
        });
      }

      if (
        currentLessonInfo.status === 'COMPLETED' &&
        updateLessonDto.status &&
        updateLessonDto.status !== LessonStatus.COMPLETED
      ) {
        await tx
          .delete(schema.transactions)
          .where(
            and(
              eq(schema.transactions.lessonId, id),
              eq(schema.transactions.type, 'CHARGE'),
            ),
          );
      }

      if (
        currentLessonInfo.status === 'COMPLETED' &&
        updateLessonDto.status === undefined &&
        updateLessonDto.priceToCharge !== undefined &&
        updateLessonDto.priceToCharge !== currentLessonInfo.priceToCharge
      ) {
        await tx
          .update(schema.transactions)
          .set({ amount: finalPrice })
          .where(
            and(
              eq(schema.transactions.lessonId, id),
              eq(schema.transactions.type, 'CHARGE'),
            ),
          );
      }

      return updatedLesson;
    });
  }

  async remove(id: string, tutorId: string) {
    const lessonInfo = await this.db
      .select({ lessonId: schema.lessons.id, tutorId: schema.students.tutorId })
      .from(schema.lessons)
      .innerJoin(
        schema.students,
        eq(schema.lessons.studentId, schema.students.id),
      )
      .where(eq(schema.lessons.id, id))
      .limit(1);

    if (lessonInfo.length === 0 || lessonInfo[0].tutorId !== tutorId) {
      throw new ForbiddenException('Lesson not found or access denied');
    }

    const [deletedLesson] = await this.db
      .delete(schema.lessons)
      .where(eq(schema.lessons.id, id))
      .returning();

    return deletedLesson;
  }
}
