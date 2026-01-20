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
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bank-accounts')
export class BankAccountsController {
    constructor(private readonly bankAccountsService: BankAccountsService) { }

    @Post()
    create(
        @Body() createBankAccountDto: CreateBankAccountDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bankAccountsService.create(createBankAccountDto, user.id);
    }

    @Get()
    findAll(
        @CurrentUser() user: { id: string },
        @Query('includeDeleted') includeDeleted?: boolean
    ) {
        return this.bankAccountsService.findAll(user.id, includeDeleted);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.bankAccountsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateBankAccountDto: UpdateBankAccountDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bankAccountsService.update(id, updateBankAccountDto, user.id);
    }

    @Patch(':id/balance')
    updateBalance(
        @Param('id') id: string,
        @Body() updateBalanceDto: UpdateBalanceDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bankAccountsService.updateBalance(id, updateBalanceDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.bankAccountsService.remove(id, user.id);
    }

    @Patch(':id/restore')
    restore(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.bankAccountsService.restore(id, user.id);
    }
}
