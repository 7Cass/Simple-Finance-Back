
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BillsService } from '../src/modules/bills/bills.service';
import { TransactionsService } from '../src/modules/transactions/transactions.service';
import { CreditCardsService } from '../src/modules/credit-cards/credit-cards.service';
import { PrismaService } from '../src/common/database/prisma.service';
import { PaymentMethod, TransactionType, RecurrenceRule } from '../src/shared/types/enums';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const billsService = app.get(BillsService);
  const transactionsService = app.get(TransactionsService);
  const creditCardsService = app.get(CreditCardsService);
  const prisma = app.get(PrismaService);

  try {
    console.log('--- Starting Reproduction Script ---');

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `test_bill_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Bill Tester',
      },
    });
    console.log(`Created User: ${user.id}`);

    // 2. Create Credit Card (Closes 10th, Due 17th)
    const card = await creditCardsService.create({
      name: 'Test Card',
      lastFourDigits: '1234',
      limit: 5000,
      closingDay: 10,
      dueDay: 17
    }, user.id);
    console.log(`Created Card: ${card.id} (Closing: ${card.closingDay})`);

    // 3. Create Transactions (Installment + Recurring)
    console.log('\n--- Creating Installment Transaction (10x) ---');
    const txInstallments: any = await transactionsService.create({
        description: 'Installment Purchase',
        amount: 1000, // 100 per installment
        type: TransactionType.EXPENSE,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        date: '2026-01-17',
        creditCardId: card.id,
        installments: 10
    }, user.id);
    console.log(`Created ${txInstallments.length} installments.`);
    console.log(`First installment date: ${txInstallments[0].date}`);

    console.log('\n--- Creating Recurring Transaction ---');
    const txRecurring: any = await transactionsService.create({
        description: 'Recurring Subscription',
        amount: 50,
        type: TransactionType.EXPENSE,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        date: '2026-01-17',
        creditCardId: card.id,
        isRecurring: true,
        recurrenceRule: RecurrenceRule.MONTHLY
    }, user.id);
    console.log(`Created Recurring Transaction: ${txRecurring.id} on ${txRecurring.date}`);

    // 4. Generate Bill for FEB 2026 (Should contain 1st installment + recurring)
    // Period: Jan 11, 2026 to Feb 10, 2026
    console.log('\n--- Generating FEB 2026 Bill ---');
    const billFeb = await billsService.generateBill(card.id, { referenceMonth: '2026-02' }, user.id);
    
    console.log(`Feb Bill Total: ${billFeb.totalAmount} (Expected: 100 + 50 = 150)`);
    const febBillDetails = await billsService.findOne(billFeb.id, user.id);
    console.log(`Feb Bill Transactions Found: ${febBillDetails.transactions.length}`);
    febBillDetails.transactions.forEach(t => console.log(` - ${t.description}: ${t.amount} (${t.date})`));

  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
