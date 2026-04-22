import {
  IsString,
  IsOptional,
  Length,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContactType {
  PHONE = 'PHONE',
  TELEGRAM = 'TELEGRAM',
  VIBER = 'VIBER',
  WHATSAPP = 'WHATSAPP',
  VK = 'VK',
  DISCORD = 'DISCORD',
  CUSTOM = 'CUSTOM',
}

export class CreateContactDto {
  @ApiProperty({ enum: ContactType, example: ContactType.TELEGRAM })
  @IsEnum(ContactType, { message: 'Недопустимый тип контакта' })
  type: ContactType;

  @ApiProperty({ example: '@ivan_student' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'Skype (если тип CUSTOM)' })
  @IsOptional()
  @IsString()
  customLabel?: string;
}

export class CreateParentDto {
  @ApiProperty({ example: 'Мария Ивановна' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}

export class CreateStudentDto {
  @ApiProperty({ example: 'Петя Иванов' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];

  @ApiPropertyOptional({ type: [CreateParentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParentDto)
  parents?: CreateParentDto[];

  @ApiPropertyOptional({
    description: 'Стандартная цена за урок',
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultPrice?: number;
}
