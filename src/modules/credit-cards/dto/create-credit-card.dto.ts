import { IsString, IsNumber, IsInt, Min, Max, Length } from 'class-validator';

export class CreateCreditCardDto {
    @IsString()
    name: string;

    @IsString()
    @Length(4, 4)
    lastFourDigits: string;

    @IsNumber()
    @Min(0)
    limit: number; // in reais

    @IsInt()
    @Min(1)
    @Max(31)
    closingDay: number;

    @IsInt()
    @Min(1)
    @Max(31)
    dueDay: number;
}
