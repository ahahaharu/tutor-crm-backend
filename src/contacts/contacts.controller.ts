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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new contact to a student OR a parent' })
  create(
    @Body() createContactDto: CreateContactDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contactsService.create(req.user.sub, createContactDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact details' })
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contactsService.update(id, req.user.sub, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.contactsService.remove(id, req.user.sub);
  }
}
