import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('summary')
    getSummary(@CurrentUser() user: { id: string }) {
        return this.reportsService.getSummary(user.id);
    }

    @Get('cash-flow')
    getCashFlow(@CurrentUser() user: { id: string }, @Query() filters: ReportFiltersDto) {
        return this.reportsService.getCashFlow(user.id, filters);
    }

    @Get('expenses-by-category')
    getExpensesByCategory(@CurrentUser() user: { id: string }, @Query() filters: ReportFiltersDto) {
        return this.reportsService.getExpensesByCategory(user.id, filters);
    }

    @Get('income-vs-expenses')
    getIncomeVsExpenses(@CurrentUser() user: { id: string }, @Query() filters: ReportFiltersDto) {
        return this.reportsService.getIncomeVsExpenses(user.id, filters);
    }

    @Get('credit-card-usage')
    getCreditCardUsage(
        @CurrentUser() user: { id: string },
        @Query('includeDeleted') includeDeleted?: boolean
    ) {
        return this.reportsService.getCreditCardUsage(user.id, includeDeleted || false);
    }
}
