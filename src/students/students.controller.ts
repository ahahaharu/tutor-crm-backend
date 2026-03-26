import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get('tutor/:tutorId')
  findAllByTutor(@Param('tutorId') tutorId: string) {
    return this.studentsService.findAllByTutor(tutorId);
  }
}
