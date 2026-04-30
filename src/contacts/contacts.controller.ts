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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
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

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new contact to a student OR a parent' })
  @ApiResponse({ status: 201, description: 'Contact successfully created.' })
  @ApiBadRequestResponse({
    description:
      'Validation failed (e.g., missing both studentId and parentId).',
  })
  @ApiForbiddenResponse({
    description:
      'Access denied. The target student or parent belongs to another tutor.',
  })
  create(
    @Body() createContactDto: CreateContactDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contactsService.create(req.user.sub, createContactDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update contact details (type, value, or custom label)',
  })
  @ApiParam({ name: 'id', description: 'Contact ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Contact successfully updated.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiNotFoundResponse({ description: 'Contact not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contactsService.update(id, req.user.sub, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Contact successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Contact not found.' })
  @ApiForbiddenResponse({ description: 'Access denied.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.contactsService.remove(id, req.user.sub);
  }
}
