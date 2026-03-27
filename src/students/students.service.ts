import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createStudentDto: CreateStudentDto, tutorId: string) {
    return await this.db.transaction(async (tx) => {
      const [newStudent] = await tx
        .insert(schema.students)
        .values({
          tutorId: tutorId,
          name: createStudentDto.name,
        })
        .returning();

      if (createStudentDto.contacts && createStudentDto.contacts.length > 0) {
        const studentContacts = createStudentDto.contacts.map((contact) => ({
          studentId: newStudent.id,
          type: contact.type as typeof schema.contacts.$inferInsert.type,
          value: contact.value,
          customLabel: contact.customLabel,
        }));
        await tx.insert(schema.contacts).values(studentContacts);
      }

      if (createStudentDto.parents && createStudentDto.parents.length > 0) {
        for (const parent of createStudentDto.parents) {
          const [newParent] = await tx
            .insert(schema.parents)
            .values({
              studentId: newStudent.id,
              name: parent.name,
            })
            .returning();

          if (parent.contacts && parent.contacts.length > 0) {
            const parentContacts = parent.contacts.map((contact) => ({
              parentId: newParent.id,
              type: contact.type as typeof schema.contacts.$inferInsert.type,
              value: contact.value,
              customLabel: contact.customLabel,
            }));
            await tx.insert(schema.contacts).values(parentContacts);
          }
        }
      }

      return newStudent;
    });
  }

  async findAllByTutor(tutorId: string) {
    return await this.db.query.students.findMany({
      where: eq(schema.students.tutorId, tutorId),
    });
  }

  async update(
    id: string,
    tutorId: string,
    updateStudentDto: UpdateStudentDto,
  ) {
    const [updatedStudent] = await this.db
      .update(schema.students)
      .set(updateStudentDto)
      .where(
        and(eq(schema.students.id, id), eq(schema.students.tutorId, tutorId)),
      )
      .returning();

    if (!updatedStudent) {
      throw new NotFoundException('Student not found or access denied');
    }

    return updatedStudent;
  }

  async remove(id: string, tutorId: string) {
    const [deletedStudent] = await this.db
      .delete(schema.students)
      .where(
        and(eq(schema.students.id, id), eq(schema.students.tutorId, tutorId)),
      )
      .returning();

    if (!deletedStudent) {
      throw new NotFoundException('Student not found or access denied');
    }

    return { message: 'Student successfully deleted', id: deletedStudent.id };
  }
}
