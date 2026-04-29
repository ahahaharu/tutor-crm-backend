import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DB_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private async checkStudentOwnership(studentId: string, tutorId: string) {
    const student = await this.db.query.students.findFirst({
      where: and(
        eq(schema.students.id, studentId),
        eq(schema.students.tutorId, tutorId),
      ),
    });
    if (!student) {
      throw new ForbiddenException('Student not found or access denied');
    }
  }

  async create(tutorId: string, dto: CreateTransactionDto) {
    await this.checkStudentOwnership(dto.studentId, tutorId);

    const [transaction] = await this.db
      .insert(schema.transactions)
      .values({
        studentId: dto.studentId,
        amount: dto.amount,
        type: dto.type,
        lessonId: dto.lessonId,
      })
      .returning();

    return transaction;
  }

  async getBalance(tutorId: string, studentId: string) {
    await this.checkStudentOwnership(studentId, tutorId);

    const [result] = await this.db
      .select({
        balance: sql<number>`
        COALESCE(
          SUM(
            CASE WHEN ${schema.transactions.type} = 'PAYMENT' THEN ${schema.transactions.amount} 
            ELSE -${schema.transactions.amount} END
          ), 0
        )::int
      `,
      })
      .from(schema.transactions)
      .where(eq(schema.transactions.studentId, studentId));

    return {
      studentId,
      balance: result.balance,
    };
  }
}
