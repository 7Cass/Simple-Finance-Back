/**
 * Transaction templates for seed data
 * Realistic Brazilian transaction scenarios
 */

export interface TransactionTemplate {
  description: string;
  amountCents: number;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'DEBIT' | 'CREDIT_CARD' | 'CASH' | 'TRANSFER';
  category: string;
  isRecurring?: boolean;
  recurrenceRule?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  isInstallment?: boolean;
  totalInstallments?: number;
  probability?: number; // 0-1, chance of this transaction occurring
}

/**
 * Income transaction templates
 */
export const INCOME_TEMPLATES: TransactionTemplate[] = [
  {
    description: 'Salário',
    amountCents: 850000, // R$ 8.500,00
    type: 'INCOME',
    paymentMethod: 'TRANSFER',
    category: 'Salário',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 1.0,
  },
  {
    description: 'Freelance - Website',
    amountCents: 250000, // R$ 2.500,00
    type: 'INCOME',
    paymentMethod: 'TRANSFER',
    category: 'Freelance',
    probability: 0.4,
  },
  {
    description: 'Aluguel - Apartamento',
    amountCents: 180000, // R$ 1.800,00
    type: 'INCOME',
    paymentMethod: 'TRANSFER',
    category: 'Aluguel',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.3,
  },
  {
    description: 'Bônus de desempenho',
    amountCents: 200000, // R$ 2.000,00
    type: 'INCOME',
    paymentMethod: 'TRANSFER',
    category: 'Bônus',
    probability: 0.2,
  },
  {
    description: 'Venda - Mercado Livre',
    amountCents: 35000, // R$ 350,00
    type: 'INCOME',
    paymentMethod: 'TRANSFER',
    category: 'Vendas',
    probability: 0.3,
  },
];

/**
 * Expense transaction templates - Alimentação
 */
export const FOOD_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Mercado Extra - Semanal',
    amountCents: 35050, // R$ 350,50
    type: 'EXPENSE',
    paymentMethod: 'DEBIT',
    category: 'Alimentação',
    probability: 0.9,
  },
  {
    description: 'iFood',
    amountCents: 4500, // R$ 45,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Alimentação',
    probability: 0.6,
  },
  {
    description: 'Padaria da Esquina',
    amountCents: 1850, // R$ 18,50
    type: 'EXPENSE',
    paymentMethod: 'CASH',
    category: 'Alimentação',
    probability: 0.7,
  },
  {
    description: 'Restaurante - Executivo',
    amountCents: 3500, // R$ 35,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Restaurante',
    probability: 0.5,
  },
];

/**
 * Expense transaction templates - Moradia
 */
export const HOUSING_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Aluguel - Apartamento Centro',
    amountCents: 180000, // R$ 1.800,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Moradia',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 1.0,
  },
  {
    description: 'Condomínio',
    amountCents: 65000, // R$ 650,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Moradia',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.8,
  },
  {
    description: 'Conta de Luz - Enel',
    amountCents: 18500, // R$ 185,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Contas',
    probability: 1.0,
  },
  {
    description: 'Conta de Água - Sabesp',
    amountCents: 8500, // R$ 85,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Contas',
    probability: 1.0,
  },
  {
    description: 'Gás - Copagaz',
    amountCents: 9500, // R$ 95,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Contas',
    probability: 0.9,
  },
];

/**
 * Expense transaction templates - Transporte
 */
export const TRANSPORT_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Uber - Viagem',
    amountCents: 3200, // R$ 32,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Transporte',
    probability: 0.6,
  },
  {
    description: '99 - Viagem',
    amountCents: 2800, // R$ 28,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Transporte',
    probability: 0.5,
  },
  {
    description: 'Shell - Posto',
    amountCents: 25000, // R$ 250,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Automóvel',
    probability: 0.7,
  },
  {
    description: 'IPVA - 2025',
    amountCents: 250000, // R$ 2.500,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Impostos',
    probability: 0.2,
  },
  {
    description: 'Estacionamento - Shopping',
    amountCents: 2200, // R$ 22,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Transporte',
    probability: 0.4,
  },
];

/**
 * Expense transaction templates - Saúde
 */
export const HEALTH_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Drogasil - Medicamentos',
    amountCents: 8500, // R$ 85,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Saúde',
    probability: 0.5,
  },
  {
    description: 'Plano de Saúde - Unimed',
    amountCents: 85000, // R$ 850,00
    type: 'EXPENSE',
    paymentMethod: 'TRANSFER',
    category: 'Seguros',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.7,
  },
  {
    description: 'Consulta - Dermatologista',
    amountCents: 45000, // R$ 450,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Saúde',
    probability: 0.2,
  },
];

/**
 * Expense transaction templates - Lazer e Entretenimento
 */
export const ENTERTAINMENT_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Netflix',
    amountCents: 5590, // R$ 55,90
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Streaming',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.9,
  },
  {
    description: 'Spotify Premium',
    amountCents: 2190, // R$ 21,90
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Streaming',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.8,
  },
  {
    description: 'Amazon Prime',
    amountCents: 1490, // R$ 14,90
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Streaming',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.7,
  },
  {
    description: 'Cinemark - Ingresso Duplo',
    amountCents: 9000, // R$ 90,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Lazer',
    probability: 0.4,
  },
  {
    description: 'PlayStation Store - Jogo',
    amountCents: 24900, // R$ 249,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Entretenimento',
    probability: 0.3,
  },
];

/**
 * Expense transaction templates - Contas Mensais
 */
export const MONTHLY_BILLS_EXPENSES: TransactionTemplate[] = [
  {
    description: 'Vivo Pós',
    amountCents: 8900, // R$ 89,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Telefone',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.9,
  },
  {
    description: 'Claro Net Fibra',
    amountCents: 14900, // R$ 149,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Internet',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.95,
  },
  {
    description: 'Academia - Smart Fit',
    amountCents: 5900, // R$ 59,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Saúde',
    isRecurring: true,
    recurrenceRule: 'MONTHLY',
    probability: 0.6,
  },
];

/**
 * Expense transaction templates - Compras Parceladas
 */
export const INSTALLMENT_PURCHASES: TransactionTemplate[] = [
  {
    description: 'iPhone 16 128GB',
    amountCents: 999900, // R$ 9.999,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Vestuário',
    isInstallment: true,
    totalInstallments: 12,
    probability: 0.3,
  },
  {
    description: 'Notebook Dell',
    amountCents: 450000, // R$ 4.500,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Vestuário',
    isInstallment: true,
    totalInstallments: 10,
    probability: 0.25,
  },
  {
    description: 'TV Samsung 55"',
    amountCents: 329900, // R$ 3.299,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Lazer',
    isInstallment: true,
    totalInstallments: 6,
    probability: 0.2,
  },
  {
    description: 'Sofá 3 Lugares',
    amountCents: 210000, // R$ 2.100,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Moradia',
    isInstallment: true,
    totalInstallments: 8,
    probability: 0.15,
  },
  {
    description: 'Cama King Size',
    amountCents: 185000, // R$ 1.850,00
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: 'Moradia',
    isInstallment: true,
    totalInstallments: 5,
    probability: 0.15,
  },
];

/**
 * Get all expense templates grouped by category
 */
export function getAllExpenseTemplates(): TransactionTemplate[] {
  return [
    ...FOOD_EXPENSES,
    ...HOUSING_EXPENSES,
    ...TRANSPORT_EXPENSES,
    ...HEALTH_EXPENSES,
    ...ENTERTAINMENT_EXPENSES,
    ...MONTHLY_BILLS_EXPENSES,
    ...INSTALLMENT_PURCHASES,
  ];
}

/**
 * Get all income templates
 */
export function getAllIncomeTemplates(): TransactionTemplate[] {
  return INCOME_TEMPLATES;
}

/**
 * Select random transactions based on probability
 */
export function selectTransactionsByProbability(
  templates: TransactionTemplate[]
): TransactionTemplate[] {
  return templates.filter(() => Math.random() < (Math.random() * 0.5 + 0.25));
}

/**
 * Get transaction date for a specific month offset
 * @param baseDate Reference date (usually today)
 * @param monthOffset Offset in months (-12 to +6)
 * @param dayOfMonth Preferred day of month (default: random)
 */
export function getTransactionDate(
  baseDate: Date,
  monthOffset: number,
  dayOfMonth?: number
): Date {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + monthOffset);

  if (dayOfMonth) {
    date.setDate(dayOfMonth);
  } else {
    // Random day between 1 and 28
    date.setDate(Math.floor(Math.random() * 28) + 1);
  }

  return date;
}
