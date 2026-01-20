import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { TransactionType, TransactionStatus, BillStatus } from '../../shared/types/enums';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getSummary(userId: string) {
        // Get all bank accounts balance
        const bankAccounts = await this.prisma.bankAccount.findMany({
            where: { userId, deleted: false },
        });
        const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balanceCents, 0);

        // Get all credit cards limit
        const creditCards = await this.prisma.creditCard.findMany({
            where: { userId, deleted: false },
        });
        const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limitCents, 0);

        // Get credit card debt (open bills)
        const openBills = await this.prisma.creditCardBill.findMany({
            where: {
                creditCard: { userId, deleted: false },
                status: { in: [BillStatus.OPEN, BillStatus.CLOSED, BillStatus.OVERDUE] },
            },
        });
        const totalCreditCardDebt = openBills.reduce((sum, bill) => sum + (bill.totalAmountCents - bill.paidAmountCents), 0);

        // Get pending transactions
        const pendingTransactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                status: TransactionStatus.PENDING,
                deleted: false,
            },
        });

        const pendingIncome = pendingTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amountCents, 0);

        const pendingExpenses = pendingTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amountCents, 0);

        return {
            totalBalance, // Returns in cents
            totalCreditLimit, // Returns in cents
            totalCreditCardDebt, // Returns in cents
            pendingIncome, // Returns in cents
            pendingExpenses, // Returns in cents
        };
    }

    async getCashFlow(userId: string, filters: ReportFiltersDto) {
        const where: any = {
            userId,
            status: TransactionStatus.COMPLETED,
        };

        if (!filters.includeDeleted) {
            where.deleted = false;
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = new Date(filters.startDate);
            if (filters.endDate) where.date.lte = new Date(filters.endDate);
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            orderBy: { date: 'asc' },
            include: {
                category: true,
            },
        });

        const income = transactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amountCents, 0);

        const expenses = transactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amountCents, 0);

        return {
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
            income, // Returns in cents
            expenses, // Returns in cents
            balance: income - expenses, // Returns in cents
            transactionCount: transactions.length,
        };
    }

    async getExpensesByCategory(userId: string, filters: ReportFiltersDto) {
        const where: any = {
            userId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.COMPLETED,
        };

        if (!filters.includeDeleted) {
            where.deleted = false;
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = new Date(filters.startDate);
            if (filters.endDate) where.date.lte = new Date(filters.endDate);
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                category: true,
            },
        });

        const totalExpenses = transactions.reduce((sum, t) => sum + t.amountCents, 0);

        // Group by category
        const categoryMap = new Map<string, { name: string; amountCents: number; count: number }>();

        transactions.forEach((t) => {
            const categoryId = t.categoryId || 'uncategorized';
            const categoryName = t.category?.name || 'Sem categoria';

            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, { name: categoryName, amountCents: 0, count: 0 });
            }

            const category = categoryMap.get(categoryId)!;
            category.amountCents += t.amountCents;
            category.count += 1;
        });

        const categories = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
            categoryId: categoryId === 'uncategorized' ? null : categoryId,
            categoryName: data.name,
            totalAmount: data.amountCents, // Returns in cents
            transactionCount: data.count,
            percentage: totalExpenses > 0 ? (data.amountCents / totalExpenses) * 100 : 0,
        }));

        // Sort by amount descending
        categories.sort((a, b) => b.totalAmount - a.totalAmount);

        return {
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
            totalExpenses, // Returns in cents
            categories,
        };
    }

    async getIncomeVsExpenses(userId: string, filters: ReportFiltersDto) {
        const where: any = {
            userId,
            status: TransactionStatus.COMPLETED,
        };

        if (!filters.includeDeleted) {
            where.deleted = false;
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = new Date(filters.startDate);
            if (filters.endDate) where.date.lte = new Date(filters.endDate);
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            orderBy: { date: 'asc' },
        });

        const totalIncome = transactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amountCents, 0);

        const totalExpenses = transactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amountCents, 0);

        // Group by month
        const monthMap = new Map<string, { income: number; expenses: number }>();

        transactions.forEach((t) => {
            const monthKey = t.date.toISOString().substring(0, 7); // YYYY-MM

            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { income: 0, expenses: 0 });
            }

            const monthData = monthMap.get(monthKey)!;
            if (t.type === TransactionType.INCOME) {
                monthData.income += t.amountCents;
            } else {
                monthData.expenses += t.amountCents;
            }
        });

        const byMonth = Array.from(monthMap.entries())
            .map(([month, data]) => ({
                month,
                income: data.income, // Returns in cents
                expenses: data.expenses, // Returns in cents
                balance: data.income - data.expenses, // Returns in cents
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
            totalIncome, // Returns in cents
            totalExpenses, // Returns in cents
            difference: totalIncome - totalExpenses, // Returns in cents
            byMonth,
        };
    }

    async getCreditCardUsage(userId: string, includeDeleted: boolean = false) {
        const cards = await this.prisma.creditCard.findMany({
            where: {
                userId,
                deleted: includeDeleted ? undefined : false,
            },
            include: {
                bills: {
                    where: {
                        status: { in: [BillStatus.OPEN, BillStatus.CLOSED, BillStatus.OVERDUE] },
                    },
                },
            },
        });

        // Get current month dates
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const cardUsage = await Promise.all(
            cards.map(async (card) => {
                // Usage from existing bills
                const billsUsageCents = card.bills.reduce(
                    (sum, bill) => sum + (bill.totalAmountCents - bill.paidAmountCents),
                    0
                );

                // Get current month transactions for this card that are not yet in a bill
                const currentMonthTransactions = await this.prisma.transaction.findMany({
                    where: {
                        creditCardId: card.id,
                        date: {
                            gte: startOfCurrentMonth,
                            lte: endOfCurrentMonth,
                        },
                        status: { in: [TransactionStatus.COMPLETED, TransactionStatus.PENDING] },
                        deleted: false,
                        billId: null, // Not yet in a bill
                    },
                });

                const currentMonthUsageCents = currentMonthTransactions.reduce(
                    (sum, txn) => sum + txn.amountCents,
                    0
                );

                const totalUsageCents = billsUsageCents + currentMonthUsageCents;
                const limit = card.limitCents; // Returns in cents
                const usage = totalUsageCents; // Returns in cents
                const available = limit - usage;
                const usagePercentage = limit > 0 ? (usage / limit) * 100 : 0;

                return {
                    cardId: card.id,
                    cardName: card.name,
                    lastFourDigits: card.lastFourDigits,
                    limit, // Returns in cents
                    currentUsage: usage, // Returns in cents
                    availableLimit: available, // Returns in cents
                    usagePercentage,
                };
            })
        );

        return { cards: cardUsage };
    }
}
