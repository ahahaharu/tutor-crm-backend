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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lesson for a student' })
  @ApiResponse({ status: 201, description: 'Lesson successfully created.' })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g., incorrect date format).',
  })
  @ApiForbiddenResponse({
    description: 'Student not found or belongs to another tutor.',
  })
  create(
    @Body() createLessonDto: CreateLessonDto,
    @Req() req: RequestWithUser,
  ) {
    const tutorId = req.user.sub;
    return this.lessonsService.create(tutorId, createLessonDto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get all lessons for the tutor calendar' })
  @ApiResponse({
    status: 200,
    description:
      'List of lessons with nested student info successfully retrieved.',
  })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  findAllForCalendar(@Req() req: RequestWithUser) {
    return this.lessonsService.findAllForTutor(req.user.sub);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all lessons for a specific student' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lessons successfully retrieved.',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Student belongs to another tutor.',
  })
  findAllForStudent(
    @Param('studentId') studentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonsService.findAllForStudent(req.user.sub, studentId);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a lesson (e.g., change status to COMPLETED to trigger billing)',
  })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lesson successfully updated.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonsService.update(id, req.user.sub, updateLessonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lesson successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.lessonsService.remove(id, req.user.sub);
  }
}
