import { Module } from '@nestjs/common';
import { LessonTemplatesService } from './lesson-templates.service';
import { LessonTemplatesController } from './lesson-templates.controller';

@Module({
  controllers: [LessonTemplatesController],
  providers: [LessonTemplatesService],
})
export class LessonTemplatesModule {}
