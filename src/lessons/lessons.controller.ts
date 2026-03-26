import { Controller, Get, Param } from '@nestjs/common';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('student/:studentId')
  findAllByStudent(@Param('studentId') studentId: string) {
    return this.lessonsService.findAllByStudent(studentId);
  }
}
