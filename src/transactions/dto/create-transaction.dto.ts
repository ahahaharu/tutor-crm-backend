import { IsUUID, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  CHARGE = 'CHARGE',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID ученика' })
  @IsUUID('4', { message: 'studentId must be a valid UUID' })
  studentId: string;

  @ApiProperty({ description: 'Сумма транзакции', minimum: 1 })
  @IsInt()
  @Min(1, { message: 'amount must be greater than 0' })
  amount: number;

  @ApiProperty({ description: 'Тип транзакции', enum: TransactionType })
  @IsEnum(TransactionType, {
    message: 'type must be exactly PAYMENT or CHARGE',
  })
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'ID урока (если это списание за конкретный урок)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'lessonId must be a valid UUID' })
  lessonId?: string;
}
