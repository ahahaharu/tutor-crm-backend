import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLessonTemplateDto } from './create-lesson-template.dto';

export class UpdateLessonTemplateDto extends PartialType(
  OmitType(CreateLessonTemplateDto, ['studentId'] as const),
) {}
