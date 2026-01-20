import { IsString, IsNumber, IsInt, Min, Max, Length, IsOptional } from 'class-validator';

export class UpdateCreditCardDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @Length(4, 4)
    @IsOptional()
    lastFourDigits?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    limit?: number; // in reais

    @IsInt()
    @Min(1)
    @Max(31)
    @IsOptional()
    closingDay?: number;

    @IsInt()
    @Min(1)
    @Max(31)
    @IsOptional()
    dueDay?: number;
}
