/**
 * Main seed script for Simple Finance
 * Creates comprehensive test data including users, accounts, transactions, and bills
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedCategories } from './seed-categories';
import { getTestUsers, TEST_USER_EMAILS } from './seed-data/users.data';
import { getBankAccountsForUser, getCreditCardsForUser } from './seed-data/accounts.data';
import { getAllExpenseTemplates, getAllIncomeTemplates } from './seed-data/transactions.data';
import { createInstallmentSeries } from './seed-utils/transaction-builder';
import { addMonths, generateBillPeriod, getTransactionDate } from './seed-utils/date-helpers';

// Load .env file
config();

// Create Prisma Client with PostgreSQL adapter (required for Prisma 7)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

// CLI arguments
const args = process.argv.slice(2);
const IS_CLEAN = args.includes('--clean');
const IS_FORCE = args.includes('--force');

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting Simple Finance seed...');
  console.log('');

  // Check for existing test users
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: TEST_USER_EMAILS } },
  });

  // Clean existing data if --clean flag is set
  if (IS_CLEAN && existingUsers.length > 0) {
    console.log('🧹 Cleaning existing seed data...');
    await cleanSeedData();
    console.log('');
  } else if (existingUsers.length >= 3 && !IS_FORCE) {
    console.log(`✅ Found ${existingUsers.length} test users already seeded. Skipping...`);
    console.log('   Use --force to override or --clean to reset data.');
    return;
  }

  // 1. Seed categories (global default categories)
  console.log('📂 Step 1: Seeding categories...');
  await seedCategories();
  console.log('');

  // 2. Seed users
  console.log('👤 Step 2: Seeding users...');
  const users = await seedUsers();
  console.log('');

  // 3. Seed bank accounts and credit cards
  console.log('💳 Step 3: Seeding bank accounts and credit cards...');
  const accounts = await seedAccounts(users);
  console.log('');

  // 4. Seed transactions
  console.log('💰 Step 4: Seeding transactions...');
  await seedTransactions(users, accounts);
  console.log('');

  // 5. Seed credit card bills
  console.log('📊 Step 5: Seeding credit card bills...');
  await seedBills(accounts.creditCards);
  console.log('');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Bank Accounts: ${accounts.bankAccounts.length}`);
  console.log(`   Credit Cards: ${accounts.creditCards.length}`);
  console.log(`   Total Transactions: ${await prisma.transaction.count()}`);
  console.log(`   Total Bills: ${await prisma.creditCardBill.count()}`);
}

/**
 * Clean existing seed data
 */
async function cleanSeedData() {
  // Delete in reverse order to respect foreign keys
  await prisma.transaction.deleteMany({
    where: { user: { email: { in: TEST_USER_EMAILS } } },
  });
  console.log('  ✓ Deleted transactions');

  await prisma.creditCardBill.deleteMany({
    where: {
      creditCard: {
        user: { email: { in: TEST_USER_EMAILS } },
      },
    },
  });
  console.log('  ✓ Deleted credit card bills');

  await prisma.creditCard.deleteMany({
    where: { user: { email: { in: TEST_USER_EMAILS } } },
  });
  console.log('  ✓ Deleted credit cards');

  await prisma.bankAccount.deleteMany({
    where: { user: { email: { in: TEST_USER_EMAILS } } },
  });
  console.log('  ✓ Deleted bank accounts');

  await prisma.category.deleteMany({
    where: { user: { email: { in: TEST_USER_EMAILS } } },
  });
  console.log('  ✓ Deleted custom categories');

  await prisma.user.deleteMany({
    where: { email: { in: TEST_USER_EMAILS } },
  });
  console.log('  ✓ Deleted users');
}

/**
 * Seed users
 */
async function seedUsers() {
  const testUsers = await getTestUsers();
  const users: Array<{ id: string; email: string; name: string }> = [];

  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.passwordHash,
      },
    });
    users.push(user);
    console.log(`  ✓ Created user: ${user.name} (${user.email})`);
  }

  return users;
}

/**
 * Seed bank accounts and credit cards
 */
async function seedAccounts(users: Array<{ id: string; email: string; name: string }>) {
  const allBankAccounts: Array<{ id: string; userId: string }> = [];
  const allCreditCards: Array<{ id: string; userId: string; closingDay: number; dueDay: number }> = [];

  for (const user of users) {
    // Create bank accounts
    const bankAccountsData = getBankAccountsForUser(user.email);
    for (const accountData of bankAccountsData) {
      const account = await prisma.bankAccount.create({
        data: {
          ...accountData,
          userId: user.id,
        },
      });
      allBankAccounts.push(account);
      console.log(`  ✓ Created bank account: ${account.name} (${account.type})`);
    }

    // Create credit cards
    const creditCardsData = getCreditCardsForUser(user.email);
    for (const cardData of creditCardsData) {
      const card = await prisma.creditCard.create({
        data: {
          ...cardData,
          userId: user.id,
        },
      });
      allCreditCards.push(card);
      console.log(`  ✓ Created credit card: ${card.name} (****${card.lastFourDigits})`);
    }
  }

  return { bankAccounts: allBankAccounts, creditCards: allCreditCards };
}

/**
 * Seed transactions
 */
async function seedTransactions(users: Array<{ id: string; name: string }>, accounts: { bankAccounts: Array<{ id: string; userId: string }>; creditCards: Array<{ id: string; userId: string; closingDay: number; dueDay: number }> }) {
  const { bankAccounts, creditCards } = accounts;
  const today = new Date();

  // Get all categories
  const categories = await prisma.category.findMany();

  const totalTransactions = { income: 0, expense: 0, installments: 0 };

  // Process each user
  for (const user of users) {
    const userBankAccounts = bankAccounts.filter((a) => a.userId === user.id);
    const userCreditCards = creditCards.filter((c) => c.userId === user.id);

    // Seed past transactions (12 to 2 months ago)
    console.log(`  👤 ${user.name}: Seeding past transactions...`);
    for (let monthOffset = -12; monthOffset <= -2; monthOffset++) {
      const monthDate = addMonths(today, monthOffset);
      await seedMonthTransactions(
        user,
        userBankAccounts,
        userCreditCards,
        categories,
        monthDate,
        totalTransactions
      );
    }

    // Seed current month transactions
    console.log(`  👤 ${user.name}: Seeding current month transactions...`);
    await seedCurrentMonthTransactions(
      user,
      userBankAccounts,
      userCreditCards,
      categories,
      today,
      totalTransactions
    );

    // Seed future scheduled transactions (1 to 6 months ahead)
    console.log(`  👤 ${user.name}: Seeding future scheduled transactions...`);
    for (let monthOffset = 1; monthOffset <= 6; monthOffset++) {
      const monthDate = addMonths(today, monthOffset);
      await seedFutureTransactions(
        user,
        userBankAccounts,
        userCreditCards,
        categories,
        monthDate,
        totalTransactions
      );
    }
  }

  console.log(`  ✓ Total transactions created:`);
  console.log(`    - Income: ${totalTransactions.income}`);
  console.log(`    - Expense: ${totalTransactions.expense}`);
  console.log(`    - Installment series: ${totalTransactions.installments}`);
}

/**
 * Seed transactions for a specific month
 */
async function seedMonthTransactions(
  user: { id: string; name: string },
  bankAccounts: Array<{ id: string }>,
  creditCards: Array<{ id: string }>,
  categories: Array<{ id: string; name: string }>,
  monthDate: Date,
  totals: { income: number; expense: number; installments: number }
) {
  // Income transactions (salary at beginning of month)
  const incomeTemplates = getAllIncomeTemplates();
  for (const template of incomeTemplates) {
    if (template.isRecurring && template.recurrenceRule === 'MONTHLY') {
      const category = categories.find((c) => c.name === template.category);
      if (!category) continue;

      const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];

      await prisma.transaction.create({
        data: {
          description: template.description,
          amountCents: template.amountCents,
          type: template.type,
          paymentMethod: template.paymentMethod,
          date: getTransactionDate(monthDate, 0, 5), // Day 5 of month
          status: 'COMPLETED',
          isRecurring: true,
          recurrenceRule: template.recurrenceRule,
          userId: user.id,
          categoryId: category.id,
          bankAccountId: bankAccount.id,
        },
      });
      totals.income++;
    }
  }

  // Expense transactions
  const expenseTemplates = getAllExpenseTemplates();
  const numTransactions = Math.floor(Math.random() * 8) + 5; // 5-12 transactions per month

  for (let i = 0; i < numTransactions; i++) {
    const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];

    // Skip if probability check fails
    if (template.probability && Math.random() > template.probability) continue;

    // Skip installments for random months (avoid too many)
    if (template.isInstallment && Math.random() > 0.15) continue;

    const category = categories.find((c) => c.name === template.category);
    if (!category) continue;

    const dayOfMonth = Math.floor(Math.random() * 28) + 1;

    // Handle installments
    if (template.isInstallment && template.totalInstallments) {
      // Only create installments if first installment falls in this month
      const card = creditCards[Math.floor(Math.random() * creditCards.length)];

      await createInstallmentSeries(prisma, {
        description: template.description,
        amountCents: template.amountCents,
        totalInstallments: template.totalInstallments,
        firstDate: getTransactionDate(monthDate, 0, dayOfMonth),
        categoryId: category.id,
        creditCardId: card.id,
        userId: user.id,
        type: template.type,
      });
      totals.installments++;
    } else if (template.isRecurring && template.recurrenceRule === 'MONTHLY') {
      // Recurring monthly expense
      const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
      const card = creditCards[Math.floor(Math.random() * creditCards.length)];
      const paymentMethod = template.paymentMethod;

      await prisma.transaction.create({
        data: {
          description: template.description,
          amountCents: template.amountCents,
          type: template.type,
          paymentMethod,
          date: getTransactionDate(monthDate, 0, dayOfMonth),
          status: 'COMPLETED',
          isRecurring: true,
          recurrenceRule: template.recurrenceRule,
          userId: user.id,
          categoryId: category.id,
          bankAccountId: paymentMethod !== 'CREDIT_CARD' ? bankAccount.id : undefined,
          creditCardId: paymentMethod === 'CREDIT_CARD' ? card.id : undefined,
        },
      });
      totals.expense++;
    } else {
      // One-time expense
      const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
      const card = creditCards[Math.floor(Math.random() * creditCards.length)];
      const paymentMethod = template.paymentMethod;

      await prisma.transaction.create({
        data: {
          description: template.description,
          amountCents: template.amountCents,
          type: template.type,
          paymentMethod,
          date: getTransactionDate(monthDate, 0, dayOfMonth),
          status: 'COMPLETED',
          userId: user.id,
          categoryId: category.id,
          bankAccountId: paymentMethod !== 'CREDIT_CARD' ? bankAccount.id : undefined,
          creditCardId: paymentMethod === 'CREDIT_CARD' ? card.id : undefined,
        },
      });
      totals.expense++;
    }
  }
}

/**
 * Seed current month transactions
 */
async function seedCurrentMonthTransactions(
  user: any,
  bankAccounts: any[],
  creditCards: any[],
  categories: any[],
  today: Date,
  totals: any
) {
  // Income (salary)
  const incomeTemplates = getAllIncomeTemplates();
  for (const template of incomeTemplates) {
    if (template.isRecurring && template.recurrenceRule === 'MONTHLY') {
      const category = categories.find((c) => c.name === template.category);
      if (!category) continue;

      const bankAccount = bankAccounts[0];

      await prisma.transaction.create({
        data: {
          description: template.description,
          amountCents: template.amountCents,
          type: template.type,
          paymentMethod: template.paymentMethod,
          date: getTransactionDate(today, 0, 5),
          status: 'COMPLETED',
          isRecurring: true,
          recurrenceRule: template.recurrenceRule,
          userId: user.id,
          categoryId: category.id,
          bankAccountId: bankAccount.id,
        },
      });
      totals.income++;
    }
  }

  // Recurring monthly expenses (some COMPLETED, some PENDING)
  const recurringTemplates = getAllExpenseTemplates().filter(
    (t) => t.isRecurring && t.recurrenceRule === 'MONTHLY'
  );

  for (const template of recurringTemplates) {
    const category = categories.find((c) => c.name === template.category);
    if (!category || !template.probability || Math.random() > template.probability) continue;

    const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
    const card = creditCards[Math.floor(Math.random() * creditCards.length)];
    const paymentMethod = template.paymentMethod;
    const dayOfMonth = Math.floor(Math.random() * 15) + 1;

    const status = dayOfMonth < today.getDate() ? 'COMPLETED' : 'PENDING';

    await prisma.transaction.create({
      data: {
        description: template.description,
        amountCents: template.amountCents,
        type: template.type,
        paymentMethod,
        date: getTransactionDate(today, 0, dayOfMonth),
        status,
        isRecurring: true,
        recurrenceRule: template.recurrenceRule,
        userId: user.id,
        categoryId: category.id,
        bankAccountId: paymentMethod !== 'CREDIT_CARD' ? bankAccount.id : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' ? card.id : undefined,
      },
    });
    totals.expense++;
  }

  // Random daily expenses (mixed status)
  const randomExpenses = Math.floor(Math.random() * 8) + 5;
  const expenseTemplates = getAllExpenseTemplates().filter(
    (t) => !t.isRecurring && !t.isInstallment
  );

  for (let i = 0; i < randomExpenses; i++) {
    const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
    if (!template.probability || Math.random() > template.probability) continue;

    const category = categories.find((c) => c.name === template.category);
    if (!category) continue;

    const dayOfMonth = Math.floor(Math.random() * 28) + 1;
    const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
    const card = creditCards[Math.floor(Math.random() * creditCards.length)];
    const paymentMethod = template.paymentMethod;

    const status = dayOfMonth <= today.getDate() ? 'COMPLETED' : 'PENDING';

    await prisma.transaction.create({
      data: {
        description: template.description,
        amountCents: template.amountCents,
        type: template.type,
        paymentMethod,
        date: getTransactionDate(today, 0, dayOfMonth),
        status,
        userId: user.id,
        categoryId: category.id,
        bankAccountId: paymentMethod !== 'CREDIT_CARD' ? bankAccount.id : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' ? card.id : undefined,
      },
    });
    totals.expense++;
  }
}

/**
 * Seed future scheduled transactions
 */
async function seedFutureTransactions(
  user: any,
  bankAccounts: any[],
  creditCards: any[],
  categories: any[],
  monthDate: Date,
  totals: any
) {
  // Only recurring monthly expenses in the future
  const recurringTemplates = getAllExpenseTemplates().filter(
    (t) => t.isRecurring && t.recurrenceRule === 'MONTHLY'
  );

  // Seed 3-5 recurring transactions per future month
  const numTransactions = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < numTransactions; i++) {
    const template = recurringTemplates[Math.floor(Math.random() * recurringTemplates.length)];
    if (!template.probability || Math.random() > template.probability) continue;

    const category = categories.find((c) => c.name === template.category);
    if (!category) continue;

    const dayOfMonth = Math.floor(Math.random() * 15) + 1;
    const bankAccount = bankAccounts[0];
    const card = creditCards[0];
    const paymentMethod = template.paymentMethod;

    await prisma.transaction.create({
      data: {
        description: template.description,
        amountCents: template.amountCents,
        type: template.type,
        paymentMethod,
        date: getTransactionDate(monthDate, 0, dayOfMonth),
        status: 'PENDING',
        isRecurring: true,
        recurrenceRule: template.recurrenceRule,
        userId: user.id,
        categoryId: category.id,
        bankAccountId: paymentMethod !== 'CREDIT_CARD' ? bankAccount.id : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' ? card.id : undefined,
      },
    });
    totals.expense++;
  }
}

/**
 * Seed credit card bills
 */
async function seedBills(creditCards: any[]) {
  const today = new Date();
  let billsCreated = 0;

  for (const card of creditCards) {
    // Generate bills for past 12 months + current month
    for (let monthOffset = -12; monthOffset <= 0; monthOffset++) {
      const monthDate = addMonths(today, monthOffset);

      // Calculate bill period based on card closing/due days
      const { closingDate, dueDate, referenceMonth } = generateBillPeriod(
        monthDate,
        card.closingDay,
        card.dueDay
      );

      // Get transactions for this period
      const periodStart = new Date(closingDate);
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setDate(periodStart.getDate() + 1);

      const transactions = await prisma.transaction.findMany({
        where: {
          creditCardId: card.id,
          date: {
            gte: periodStart,
            lte: closingDate,
          },
        },
      });

      if (transactions.length === 0) continue;

      // Calculate total amount
      const totalAmountCents = transactions.reduce((sum, t) => sum + t.amountCents, 0);

      // Determine bill status based on due date
      let status = 'OPEN';
      if (dueDate < today) {
        status = 'PAID';
      } else if (referenceMonth < new Date(today.getFullYear(), today.getMonth(), 1)) {
        status = 'PAID';
      }

      // Check if bill already exists
      const existingBill = await prisma.creditCardBill.findUnique({
        where: {
          creditCardId_referenceMonth: {
            creditCardId: card.id,
            referenceMonth,
          },
        },
      });

      if (existingBill) {
        // Link transactions to existing bill
        await Promise.all(
          transactions.map((t) =>
            prisma.transaction.update({
              where: { id: t.id },
              data: { billId: existingBill.id },
            })
          )
        );
        continue;
      }

      // Create bill
      const bill = await prisma.creditCardBill.create({
        data: {
          creditCardId: card.id,
          referenceMonth,
          closingDate,
          dueDate,
          totalAmountCents,
          paidAmountCents: status === 'PAID' ? totalAmountCents : 0,
          status: status as any,
        },
      });

      // Link transactions to bill
      await Promise.all(
        transactions.map((t) =>
          prisma.transaction.update({
            where: { id: t.id },
            data: { billId: bill.id },
          })
        )
      );

      billsCreated++;
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      console.log(
        `  ✓ Created bill for ${card.name}: ${monthName} (R$ ${(totalAmountCents / 100).toFixed(2)})`
      );
    }
  }

  console.log(`  ✓ Total bills created: ${billsCreated}`);
}

// Run seed if executed directly
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('💥 Seed failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
