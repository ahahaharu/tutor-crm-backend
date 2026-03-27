import {
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LessonStatus {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  MISSED = 'MISSED',
}

export class CreateLessonDto {
  @ApiProperty({ description: 'ID ученика, которому назначается урок' })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description:
      'Дата и время урока в формате ISO (например, 2026-03-27T15:00:00.000Z)',
  })
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;

  @ApiProperty({
    description:
      'Стоимость занятия (в копейках/центах или рублях - как ты решишь)',
  })
  @IsInt()
  @Min(0)
  priceToCharge: number;

  @ApiPropertyOptional({ enum: LessonStatus, default: LessonStatus.PLANNED })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus = LessonStatus.PLANNED;
}
