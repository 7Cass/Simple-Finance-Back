import { IsDateString, IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../../shared/types/enums';

export class ReportFiltersDto {
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    includeDeleted?: boolean = false;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @IsString()
    @IsOptional()
    categoryId?: string;
}
