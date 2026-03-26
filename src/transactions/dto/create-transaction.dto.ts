import { IsUUID, IsInt, IsEnum, IsOptional, Min } from 'class-validator';

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  CHARGE = 'CHARGE',
}

export class CreateTransactionDto {
  @IsUUID('4', { message: 'studentId must be a valid UUID' })
  studentId: string;

  @IsInt()
  @Min(1, { message: 'amount must be greater than 0' })
  amount: number;

  @IsEnum(TransactionType, {
    message: 'type must be exactly PAYMENT or CHARGE',
  })
  type: 'PAYMENT' | 'CHARGE';

  @IsOptional()
  @IsUUID('4', { message: 'lessonId must be a valid UUID' })
  lessonId?: string;
}
