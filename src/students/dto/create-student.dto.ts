import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Импортируем из Swagger

export class CreateStudentDto {
  @ApiProperty({
    example: 'Anton Secure',
    description: 'The full name of the student',
  })
  @IsString()
  @Length(2, 50, { message: 'name must be between 2 and 50 characters' })
  name: string;

  @ApiPropertyOptional({
    example: '@anton_telegram',
    description: 'Contact information (Telegram, phone, etc.)',
  })
  @IsOptional()
  @IsString()
  contactInfo?: string;
}
