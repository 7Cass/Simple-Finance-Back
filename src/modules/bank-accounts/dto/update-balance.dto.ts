import { IsNumber } from 'class-validator';

export class UpdateBalanceDto {
    @IsNumber()
    balance: number; // new absolute balance in reais
}
