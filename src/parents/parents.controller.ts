import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
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

@ApiTags('Parents')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new parent to a student' })
  @ApiResponse({ status: 201, description: 'Parent successfully created.' })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g., missing studentId).',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. The target student belongs to another tutor.',
  })
  create(
    @Body() createParentDto: CreateParentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.parentsService.create(req.user.sub, createParentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update parent details (e.g., name)' })
  @ApiParam({ name: 'id', description: 'Parent ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Parent successfully updated.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiNotFoundResponse({ description: 'Parent not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  update(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.parentsService.update(id, req.user.sub, updateParentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parent and their associated contacts' })
  @ApiParam({ name: 'id', description: 'Parent ID (UUID)', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Parent and related contacts successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Parent not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.parentsService.remove(id, req.user.sub);
  }
}
