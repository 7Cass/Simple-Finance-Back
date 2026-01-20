import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    create(
        @Body() createTransactionDto: CreateTransactionDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.transactionsService.create(createTransactionDto, user.id);
    }

    @Get()
    findAll(
        @CurrentUser() user: { id: string },
        @Query() filters: TransactionFiltersDto
    ) {
        return this.transactionsService.findAll(user.id, filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.transactionsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.transactionsService.update(id, updateTransactionDto, user.id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.transactionsService.updateStatus(id, updateStatusDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.transactionsService.remove(id, user.id);
    }
}
