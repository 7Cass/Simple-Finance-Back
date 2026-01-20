import { IsString, Matches } from 'class-validator';

export class GenerateBillDto {
    @IsString()
    @Matches(/^\d{4}-\d{2}$/, { message: 'referenceMonth must be in YYYY-MM format' })
    referenceMonth: string; // Format: "2024-03"
}
