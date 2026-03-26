import { IsString, IsUUID, IsOptional, Length } from 'class-validator';

export class CreateStudentDto {
  @IsUUID('4', { message: 'tutorId must be a valid UUID' })
  tutorId: string;

  @IsString()
  @Length(2, 50, { message: 'name must be between 2 and 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  contactInfo?: string;
}
