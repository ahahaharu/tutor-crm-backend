import {
  IsUUID,
  IsInt,
  IsString,
  IsDateString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonTemplateDto {
  @ApiProperty({ description: 'ID ученика' })
  @IsUUID('4', { message: 'studentId must be a valid UUID' })
  studentId: string;

  @ApiProperty({
    description: 'День недели (1 = Понедельник, 7 = Воскресенье)',
    minimum: 1,
    maximum: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7, { message: 'dayOfWeek must be between 1 and 7 (1 = Monday)' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Время начала урока', example: '15:00:00' })
  @IsString({
    message: 'startTime must be a valid time string, e.g., 15:00:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'Продолжительность в минутах',
    minimum: 15,
    example: 60,
  })
  @IsInt()
  @Min(15, { message: 'durationMinutes must be at least 15' })
  durationMinutes: number;

  @ApiProperty({ description: 'Стоимость урока по умолчанию', example: 1500 })
  @IsInt()
  @Min(0, { message: 'defaultPrice cannot be negative' })
  defaultPrice: number;

  @ApiPropertyOptional({
    description: 'Интервал в неделях (по умолчанию 1 - каждую неделю)',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'intervalWeeks must be at least 1' })
  intervalWeeks?: number;

  @ApiProperty({
    description: 'Дата первого занятия',
    example: '2026-03-30T15:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'firstLessonDate must be a valid ISO 8601 date string' },
  )
  firstLessonDate: string;
}
