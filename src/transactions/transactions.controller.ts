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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a manual transaction (e.g., manual payment)',
  })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.create(req.user.sub, createTransactionDto);
  }

  @Get('balance/student/:studentId')
  @ApiOperation({ summary: 'Get current balance for a student' })
  getBalance(
    @Param('studentId') studentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.transactionsService.getBalance(req.user.sub, studentId);
  }
}
