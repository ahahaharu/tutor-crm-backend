import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '../../students/dto/create-student.dto';

export class CreateContactDto {
  @ApiPropertyOptional({
    description: 'ID ученика (передавать, если контакт для ученика)',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'ID родителя (передавать, если контакт для родителя)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: ContactType, example: ContactType.TELEGRAM })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiProperty({ example: '@username' })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    description: 'Кастомное название (только для типа CUSTOM)',
  })
  @IsOptional()
  @IsString()
  customLabel?: string;
}
