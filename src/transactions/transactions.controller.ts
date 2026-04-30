import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
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
} from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a manual transaction (e.g., manual payment or penalty charge)',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction successfully created.',
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed (e.g., invalid amount or unknown transaction type).',
  })
  @ApiForbiddenResponse({
    description: 'Student not found or belongs to another tutor.',
  })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.create(req.user.sub, createTransactionDto);
  }

  @Get('balance/student/:studentId')
  @ApiOperation({ summary: 'Get current calculated balance for a student' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Student balance successfully calculated and retrieved.',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Student belongs to another tutor.',
  })
  getBalance(
    @Param('studentId') studentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.getBalance(req.user.sub, studentId);
  }
}
