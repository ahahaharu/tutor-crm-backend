import { Controller, Post, Body } from '@nestjs/common';
import { LessonTemplatesService } from './lesson-templates.service';
import { CreateLessonTemplateDto } from './dto/create-lesson-template.dto';

@Controller('lesson-templates')
export class LessonTemplatesController {
  constructor(
    private readonly lessonTemplatesService: LessonTemplatesService,
  ) {}

  @Post()
  create(@Body() createLessonTemplateDto: CreateLessonTemplateDto) {
    return this.lessonTemplatesService.create(createLessonTemplateDto);
  }
}
