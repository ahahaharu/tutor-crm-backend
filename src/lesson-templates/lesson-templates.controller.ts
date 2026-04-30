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
import { LessonTemplatesService } from './lesson-templates.service';
import { CreateLessonTemplateDto } from './dto/create-lesson-template.dto';
import { UpdateLessonTemplateDto } from './dto/update-lesson-template.dto';
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

@ApiTags('Lesson Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lesson-templates')
export class LessonTemplatesController {
  constructor(
    private readonly lessonTemplatesService: LessonTemplatesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a lesson template and auto-generate upcoming lessons',
  })
  @ApiResponse({
    status: 201,
    description: 'Template successfully created and initial lessons generated.',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g., invalid cron format or date).',
  })
  @ApiForbiddenResponse({
    description: 'Student not found or belongs to another tutor.',
  })
  create(
    @Body() createLessonTemplateDto: CreateLessonTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonTemplatesService.create(
      req.user.sub,
      createLessonTemplateDto,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all lesson templates for a specific student' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of templates successfully retrieved.',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Student belongs to another tutor.',
  })
  findAllForStudent(
    @Param('studentId') studentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonTemplatesService.findAllForStudent(
      req.user.sub,
      studentId,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a lesson template and optionally cascade changes to future lessons',
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', type: 'string' })
  @ApiResponse({
    status: 200,
    description:
      'Template successfully updated. Future lessons modified accordingly.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiNotFoundResponse({ description: 'Template not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  update(
    @Param('id') id: string,
    @Body() updateLessonTemplateDto: UpdateLessonTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.lessonTemplatesService.update(
      id,
      req.user.sub,
      updateLessonTemplateDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete a lesson template (does not delete already generated lessons)',
  })
  @ApiParam({ name: 'id', description: 'Template ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Template successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Template not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.lessonTemplatesService.remove(id, req.user.sub);
  }
}
