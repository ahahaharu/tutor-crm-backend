import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lesson for a student' })
  create(
    @Body() createLessonDto: CreateLessonDto,
    @Req() req: RequestWithUser,
  ) {
    const tutorId = req.user.sub;
    return this.lessonsService.create(tutorId, createLessonDto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get all lessons for the tutor calendar' })
  findAllForCalendar(@Req() req: RequestWithUser) {
    return this.lessonsService.findAllForTutor(req.user.sub);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all lessons for a specific student' })
  findAllForStudent(
    @Param('studentId') studentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonsService.findAllForStudent(req.user.sub, studentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson' })
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonsService.update(id, req.user.sub, updateLessonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.lessonsService.remove(id, req.user.sub);
  }
}
