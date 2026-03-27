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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
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
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetStudentsQueryDto } from './dto/get-students-query.dto';

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
  @ApiOperation({
    summary:
      'Get all students for a specific tutor with pagination and filters',
  })
  findAllByTutor(
    @Param('tutorId') tutorId: string,
    @Query() query: GetStudentsQueryDto,
  ) {
    return this.studentsService.findAllByTutor(tutorId, query);
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

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload a custom avatar for a student' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException(
              'Only image files (jpg, jpeg, png, webp) are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadAvatar(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const tutorId = req.user.sub;
    const publicUrl = `/uploads/avatars/${file.filename}`;

    return this.studentsService.updateAvatar(id, tutorId, publicUrl);
  }
}
