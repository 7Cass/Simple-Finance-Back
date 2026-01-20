import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { BillStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class BillFiltersDto {
    @IsOptional()
    @IsString()
    creditCardId?: string;

    @IsOptional()
    @IsEnum(BillStatus)
    status?: BillStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    year?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;
}
