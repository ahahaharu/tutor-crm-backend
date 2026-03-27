import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateStudentDto } from './dto/update-student.dto';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student securely' })
  @ApiResponse({ status: 201, description: 'Student successfully created.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Token missing or invalid.',
  })
  create(
    @Body() createStudentDto: CreateStudentDto,
    @Req() req: RequestWithUser,
  ) {
    const tutorId = req.user.sub;
    return this.studentsService.create(createStudentDto, tutorId);
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get all students for a specific tutor' })
  findAllByTutor(@Param('tutorId') tutorId: string) {
    return this.studentsService.findAllByTutor(tutorId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: RequestWithUser,
  ) {
    const tutorId = req.user.sub;
    return this.studentsService.update(id, tutorId, updateStudentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const tutorId = req.user.sub;
    return this.studentsService.remove(id, tutorId);
  }
}
