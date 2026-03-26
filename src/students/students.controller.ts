import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(
    @Body() createStudentDto: CreateStudentDto,
    @Req() req: RequestWithUser,
  ) {
    const tutorId = req.user.sub;
    return this.studentsService.create(createStudentDto, tutorId);
  }

  @Get('tutor/:tutorId')
  findAllByTutor(@Param('tutorId') tutorId: string) {
    return this.studentsService.findAllByTutor(tutorId);
  }
}
