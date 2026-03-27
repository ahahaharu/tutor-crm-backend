import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(
  OmitType(CreateContactDto, ['studentId', 'parentId'] as const),
) {}
