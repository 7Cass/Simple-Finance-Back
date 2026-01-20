import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class PayBillDto {
    @IsNumber()
    @Min(0.01)
    amount: number; // in reais

    @IsString()
    @IsOptional()
    bankAccountId?: string; // optional: bank account used to pay
}
