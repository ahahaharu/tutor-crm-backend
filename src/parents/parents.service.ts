import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

@Injectable()
export class ParentsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tutorId: string, createParentDto: CreateParentDto) {
    // 1. Проверяем, наш ли это ученик
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, createParentDto.studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });

    if (!student)
      throw new ForbiddenException('Student not found or access denied');

    return await this.db.transaction(async (tx) => {
      const [newParent] = await tx
        .insert(schema.parents)
        .values({
          studentId: createParentDto.studentId,
          name: createParentDto.name,
        })
        .returning();

      if (createParentDto.contacts && createParentDto.contacts.length > 0) {
        const parentContacts = createParentDto.contacts.map((contact) => ({
          parentId: newParent.id,
          type: contact.type as typeof schema.contacts.$inferInsert.type,
          value: contact.value,
          customLabel: contact.customLabel,
        }));
        await tx.insert(schema.contacts).values(parentContacts);
      }

      return newParent;
    });
  }

  async update(id: string, tutorId: string, updateParentDto: UpdateParentDto) {
    const parentInfo = await this.db
      .select({ parentId: schema.parents.id, tutorId: schema.students.tutorId })
      .from(schema.parents)
      .innerJoin(
        schema.students,
        eq(schema.parents.studentId, schema.students.id),
      )
      .where(eq(schema.parents.id, id))
      .limit(1);

    if (parentInfo.length === 0 || parentInfo[0].tutorId !== tutorId) {
      throw new ForbiddenException('Parent not found or access denied');
    }

    const [updatedParent] = await this.db
      .update(schema.parents)
      .set(updateParentDto)
      .where(eq(schema.parents.id, id))
      .returning();

    return updatedParent;
  }

  async remove(id: string, tutorId: string) {
    const parentInfo = await this.db
      .select({ parentId: schema.parents.id, tutorId: schema.students.tutorId })
      .from(schema.parents)
      .innerJoin(
        schema.students,
        eq(schema.parents.studentId, schema.students.id),
      )
      .where(eq(schema.parents.id, id))
      .limit(1);

    if (parentInfo.length === 0 || parentInfo[0].tutorId !== tutorId) {
      throw new ForbiddenException('Parent not found or access denied');
    }

    const [deletedParent] = await this.db
      .delete(schema.parents)
      .where(eq(schema.parents.id, id))
      .returning();

    return deletedParent;
  }
}
