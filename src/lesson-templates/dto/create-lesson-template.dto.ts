import {
  IsUUID,
  IsInt,
  IsString,
  IsDateString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateLessonTemplateDto {
  @IsUUID('4', { message: 'studentId must be a valid UUID' })
  studentId: string;

  @IsInt()
  @Min(1)
  @Max(7, { message: 'dayOfWeek must be between 1 and 7 (1 = Monday)' })
  dayOfWeek: number;

  @IsString({
    message: 'startTime must be a valid time string, e.g., 15:00:00',
  })
  startTime: string;

  @IsInt()
  @Min(15, { message: 'durationMinutes must be at least 15' })
  durationMinutes: number;

  @IsInt()
  @Min(0, { message: 'defaultPrice cannot be negative' })
  defaultPrice: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'intervalWeeks must be at least 1' })
  intervalWeeks?: number;

  @IsDateString(
    {},
    { message: 'firstLessonDate must be a valid ISO 8601 date string' },
  )
  firstLessonDate: string;
}
