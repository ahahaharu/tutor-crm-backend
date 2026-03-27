import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateParentDto } from './create-parent.dto';

export class UpdateParentDto extends PartialType(
  OmitType(CreateParentDto, ['studentId', 'contacts'] as const),
) {}
