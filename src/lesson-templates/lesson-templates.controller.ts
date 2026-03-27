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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Update a lesson template' })
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
  @ApiOperation({ summary: 'Delete a lesson template' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.lessonTemplatesService.remove(id, req.user.sub);
  }
}
