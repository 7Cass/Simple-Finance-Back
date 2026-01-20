import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { GenerateBillDto } from './dto/generate-bill.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { BillFiltersDto } from './dto/bill-filters.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bills')
export class BillsController {
    constructor(private readonly billsService: BillsService) { }

    @Post('generate/:creditCardId')
    generateBill(
        @Param('creditCardId') creditCardId: string,
        @Body() generateBillDto: GenerateBillDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.billsService.generateBill(creditCardId, generateBillDto, user.id);
    }

    @Get()
    findAll(@CurrentUser() user: { id: string }, @Query() filters: BillFiltersDto) {
        return this.billsService.findAll(user.id, filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.billsService.findOne(id, user.id);
    }

    @Patch(':id/pay')
    payBill(
        @Param('id') id: string,
        @Body() payBillDto: PayBillDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.billsService.payBill(id, payBillDto, user.id);
    }

    @Patch(':id/close')
    closeBill(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.billsService.closeBill(id, user.id);
    }
}
