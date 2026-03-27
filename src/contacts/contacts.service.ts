import {
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private async verifyContactOwnership(contactId: string, tutorId: string) {
    const contact = await this.db.query.contacts.findFirst({
      where: eq(schema.contacts.id, contactId),
      with: {
        student: true,
        parent: {
          with: { student: true },
        },
      },
    });

    if (!contact)
      throw new ForbiddenException('Contact not found or access denied');

    const ownerTutorId = contact.studentId
      ? contact.student?.tutorId
      : contact.parent?.student?.tutorId;

    if (ownerTutorId !== tutorId) {
      throw new ForbiddenException('Contact not found or access denied');
    }

    return contact;
  }

  async create(tutorId: string, createContactDto: CreateContactDto) {
    if (createContactDto.studentId && createContactDto.parentId) {
      throw new BadRequestException(
        'Contact must belong to EITHER a student OR a parent, not both.',
      );
    }
    if (!createContactDto.studentId && !createContactDto.parentId) {
      throw new BadRequestException(
        'You must provide EITHER studentId OR parentId.',
      );
    }

    if (createContactDto.studentId) {
      const student = await this.db.query.students.findFirst({
        where: and(
          eq(schema.students.id, createContactDto.studentId),
          eq(schema.students.tutorId, tutorId),
        ),
      });
      if (!student)
        throw new ForbiddenException('Student not found or access denied');
    }

    if (createContactDto.parentId) {
      const parent = await this.db.query.parents.findFirst({
        where: eq(schema.parents.id, createContactDto.parentId),
        with: { student: true },
      });
      if (!parent || parent.student.tutorId !== tutorId) {
        throw new ForbiddenException('Parent not found or access denied');
      }
    }

    const [newContact] = await this.db
      .insert(schema.contacts)
      .values({
        studentId: createContactDto.studentId,
        parentId: createContactDto.parentId,
        type: createContactDto.type as typeof schema.contacts.$inferInsert.type,
        value: createContactDto.value,
        customLabel: createContactDto.customLabel,
      })
      .returning();

    return newContact;
  }

  async update(
    id: string,
    tutorId: string,
    updateContactDto: UpdateContactDto,
  ) {
    await this.verifyContactOwnership(id, tutorId);

    const [updatedContact] = await this.db
      .update(schema.contacts)
      .set({
        type: updateContactDto.type as typeof schema.contacts.$inferInsert.type,
        value: updateContactDto.value,
        customLabel: updateContactDto.customLabel,
      })
      .where(eq(schema.contacts.id, id))
      .returning();

    return updatedContact;
  }

  async remove(id: string, tutorId: string) {
    await this.verifyContactOwnership(id, tutorId);

    const [deletedContact] = await this.db
      .delete(schema.contacts)
      .where(eq(schema.contacts.id, id))
      .returning();

    return deletedContact;
  }
}
