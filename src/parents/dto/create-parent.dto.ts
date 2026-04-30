import {
  IsString,
  Length,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NestedContactDto } from '../../students/dto/create-student.dto';

export class CreateParentDto {
  @ApiProperty({
    description: 'ID of the student to whom we are linking the parent',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'Мария Ивановна' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiPropertyOptional({ type: [NestedContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedContactDto)
  contacts?: NestedContactDto[];
}
