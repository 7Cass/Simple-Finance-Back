import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Money } from '../../shared/value-objects/money.vo';
import { GenerateBillDto } from './dto/generate-bill.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { BillStatus, TransactionStatus } from '../../shared/types/enums';

@Injectable()
export class BillsService {
    constructor(private prisma: PrismaService) { }

    async generateBill(creditCardId: string, dto: GenerateBillDto, userId: string) {
        // 1. Verify credit card ownership
        const card = await this.prisma.creditCard.findFirst({
            where: { id: creditCardId, userId },
        });

        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        if (card.deleted) {
            throw new NotFoundException('Credit card not found');
        }

        // 2. Parse reference month
        const [year, month] = dto.referenceMonth.split('-').map(Number);
        const referenceDate = new Date(year, month - 1, 1);

        // 3. Check if bill already exists
        const existingBill = await this.prisma.creditCardBill.findUnique({
            where: {
                creditCardId_referenceMonth: {
                    creditCardId,
                    referenceMonth: referenceDate,
                },
            },
        });

        if (existingBill) {
            throw new ConflictException('Bill already exists for this period');
        }

        // 4. Calculate period dates
        // Closing date: day X of the reference month
        const closingDate = new Date(year, month - 1, card.closingDay);

        // Previous closing date: day X of the previous month
        const previousClosingDate = this.subtractMonths(closingDate, 1);

        // Due date: day Y of the reference month
        const dueDate = new Date(year, month - 1, card.dueDay);

        // 5. Find transactions in the period (previous closing + 1 day to closing date)
        const periodStart = new Date(previousClosingDate);
        periodStart.setDate(periodStart.getDate() + 1);
        periodStart.setHours(0, 0, 0, 0);

        const periodEnd = new Date(closingDate);
        periodEnd.setHours(23, 59, 59, 999);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                creditCardId,
                userId,
                date: {
                    gte: periodStart,
                    lte: periodEnd,
                },
                status: { not: TransactionStatus.CANCELLED },
            },
        });

        // 6. Calculate total amount
        const totalAmountCents = transactions.reduce((sum, t) => sum + t.amountCents, 0);

        // 7. Create bill
        const bill = await this.prisma.creditCardBill.create({
            data: {
                creditCardId,
                referenceMonth: referenceDate,
                closingDate,
                dueDate,
                totalAmountCents,
                paidAmountCents: 0,
                status: BillStatus.OPEN,
            },
        });

        // 8. Link transactions to bill
        if (transactions.length > 0) {
            await this.prisma.transaction.updateMany({
                where: {
                    id: { in: transactions.map((t) => t.id) },
                },
                data: { billId: bill.id },
            });
        }

        return this.formatBill(bill);
    }

    async findAll(userId: string, filters?: any) {
        const where: any = {
            creditCard: {
                userId,
                deleted: false,
            },
        };

        if (filters?.creditCardId) where.creditCardId = filters.creditCardId;
        if (filters?.status) where.status = filters.status;

        const bills = await this.prisma.creditCardBill.findMany({
            where,
            include: {
                creditCard: {
                    select: {
                        id: true,
                        name: true,
                        lastFourDigits: true,
                    },
                },
            },
            orderBy: { referenceMonth: 'desc' },
        });

        return bills.map((bill) => this.formatBill(bill));
    }

    async findOne(id: string, userId: string) {
        const bill = await this.prisma.creditCardBill.findFirst({
            where: {
                id,
                creditCard: {
                    userId,
                    deleted: false,
                },
            },
            include: {
                creditCard: {
                    select: {
                        id: true,
                        name: true,
                        lastFourDigits: true,
                    },
                },
                transactions: {
                    orderBy: { date: 'asc' },
                },
            },
        });

        if (!bill) {
            throw new NotFoundException('Bill not found');
        }

        return {
            ...this.formatBill(bill),
            transactions: bill.transactions.map((t) => ({
                id: t.id,
                description: t.description,
                amount: t.amountCents, // Returns in cents
                date: t.date,
                status: t.status,
            })),
        };
    }

    async payBill(id: string, dto: PayBillDto, userId: string) {
        const bill = await this.prisma.creditCardBill.findFirst({
            where: {
                id,
                creditCard: {
                    userId,
                    deleted: false,
                },
            },
        });

        if (!bill) {
            throw new NotFoundException('Bill not found');
        }

        const paymentAmountCents = Money.fromReais(dto.amount).getCents();
        const newPaidAmountCents = bill.paidAmountCents + paymentAmountCents;

        // Determine new status
        let newStatus = bill.status;
        if (newPaidAmountCents >= bill.totalAmountCents) {
            newStatus = BillStatus.PAID;
        } else if (bill.status === BillStatus.OPEN) {
            newStatus = BillStatus.OPEN;
        }

        const updatedBill = await this.prisma.creditCardBill.update({
            where: { id },
            data: {
                paidAmountCents: newPaidAmountCents,
                status: newStatus,
            },
            include: {
                creditCard: {
                    select: {
                        id: true,
                        name: true,
                        lastFourDigits: true,
                    },
                },
            },
        });

        return this.formatBill(updatedBill);
    }

    async closeBill(id: string, userId: string) {
        const bill = await this.prisma.creditCardBill.findFirst({
            where: {
                id,
                creditCard: {
                    userId,
                    deleted: false,
                },
            },
        });

        if (!bill) {
            throw new NotFoundException('Bill not found');
        }

        if (bill.status === BillStatus.PAID) {
            throw new ConflictException('Cannot close a bill that is already paid');
        }

        const updatedBill = await this.prisma.creditCardBill.update({
            where: { id },
            data: { status: BillStatus.CLOSED },
            include: {
                creditCard: {
                    select: {
                        id: true,
                        name: true,
                        lastFourDigits: true,
                    },
                },
            },
        });

        return this.formatBill(updatedBill);
    }

    private formatBill(bill: any) {
        const totalAmount = bill.totalAmountCents; // Returns in cents
        const paidAmount = bill.paidAmountCents; // Returns in cents
        const balance = totalAmount - paidAmount;

        return {
            id: bill.id,
            referenceMonth: bill.referenceMonth,
            closingDate: bill.closingDate,
            dueDate: bill.dueDate,
            totalAmount,
            paidAmount,
            balance,
            status: bill.status,
            creditCard: bill.creditCard,
            createdAt: bill.createdAt,
            updatedAt: bill.updatedAt,
        };
    }

    private subtractMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() - months);
        return result;
    }
}
