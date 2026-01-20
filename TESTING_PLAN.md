# Plano de Testes - Simple Finance API

**Status:** Planejado (Aguardando implementação)
**Data de criação:** 2026-01-17
**Última atualização:** 2026-01-17

---

## Estratégia de Testes

### Proporção Ideal

- **E2E (End-to-End):** 100% dos endpoints (35 rotas)
- **Integração:** 60-70% dos services (foco em lógica complexa)
- **Unitários:** 20-30% (apenas Value Objects e helpers core)

### Justificativa

**E2E 100% - Prioridade Máxima**
- Garante que todos os fluxos de usuário funcionam de ponta a ponta
- Testa a aplicação como um usuário real usaria
- Cobre integrações reais (controllers + services + database)
- Alto valor de confiança com menor custo de manutenção

**Integração 60-70% - Foco em Complexidade**
- Testa a "cola" entre componentes
- Services + Prisma (banco de teste real)
- Lógica de negócio mais complexa
- Casos que não são óbvios nos testes E2E

**Unitários 20-30% - Apenas Core**
- Value Objects (Money)
- Funções puras de cálculo
- Validações complexas isoladas
- Helpers e utilitários

---

## Ordem de Implementação

### Fase 1: Setup e Infraestrutura
1. Configurar banco de dados de teste
2. Criar fixtures e factories de dados
3. Criar helpers de teste reutilizáveis
4. Configurar scripts de teste no package.json

### Fase 2: E2E (Prioridade Máxima)
1. Auth Module (3 endpoints)
2. Categories Module (5 endpoints)
3. Bank Accounts Module (6 endpoints)
4. Credit Cards Module (5 endpoints)
5. Transactions Module (6 endpoints) - **mais complexo**
6. Bills Module (5 endpoints) - **bill generation**
7. Reports Module (5 endpoints)
8. Complete Flow (fluxo integrado completo)

### Fase 3: Integração Seletiva
1. Transactions Service (installments logic)
2. Bills Service (period calculation)
3. Balance Updates (transactions → accounts)
4. Money conversions em contexto real

### Fase 4: Unitários Core
1. Money Value Object
2. Date helpers (addMonths, subtractMonths)
3. Validações de negócio isoladas

---

## Estrutura de Arquivos

```
test/
├── setup/
│   ├── database.setup.ts           # Setup do banco de testes
│   ├── prisma.test.service.ts      # PrismaService para testes
│   └── test-helpers.ts             # Helpers reutilizáveis
├── fixtures/
│   ├── user.fixture.ts             # Dados de usuário
│   ├── category.fixture.ts         # Categorias padrão
│   ├── bank-account.fixture.ts     # Contas bancárias
│   ├── credit-card.fixture.ts      # Cartões
│   └── transaction.fixture.ts      # Transações
├── factories/
│   ├── user.factory.ts             # Factory de usuário
│   ├── account.factory.ts          # Factory de conta
│   └── transaction.factory.ts      # Factory de transação
├── e2e/
│   ├── auth.e2e-spec.ts            # 3 endpoints
│   ├── categories.e2e-spec.ts      # 5 endpoints
│   ├── bank-accounts.e2e-spec.ts   # 6 endpoints
│   ├── credit-cards.e2e-spec.ts    # 5 endpoints
│   ├── transactions.e2e-spec.ts    # 6 endpoints (complexo)
│   ├── bills.e2e-spec.ts           # 5 endpoints
│   ├── reports.e2e-spec.ts         # 5 endpoints
│   └── flows/
│       └── complete-user-flow.e2e-spec.ts
├── integration/
│   ├── transactions.service.integration-spec.ts
│   ├── bills.service.integration-spec.ts
│   ├── balance-updates.integration-spec.ts
│   └── money-handling.integration-spec.ts
└── unit/
    ├── money.vo.spec.ts
    ├── date-helpers.spec.ts
    └── validators.spec.ts
```

---

## Setup Necessário

### 1. Banco de Dados de Teste

**Opção 1: PostgreSQL dedicado (recomendado)**
```bash
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/simple_finance_test?schema=public"
```

**Opção 2: SQLite in-memory (mais rápido)**
```bash
# .env.test
DATABASE_URL="file:./test.db"
```

### 2. Scripts de Teste

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:integration": "jest --testMatch='**/*.integration-spec.ts'",
    "test:unit": "jest --testMatch='**/*.spec.ts'",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:db:reset": "dotenv -e .env.test -- npx prisma migrate reset --force --skip-seed",
    "test:db:push": "dotenv -e .env.test -- npx prisma db push"
  }
}
```

### 3. Configuração do Jest

```javascript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFilesAfterEnv": ["<rootDir>/setup/database.setup.ts"],
  "coverageDirectory": "./coverage-e2e",
  "collectCoverageFrom": [
    "src/**/*.controller.ts",
    "src/**/*.service.ts"
  ]
}
```

### 4. Dependências Necessárias

```bash
npm install --save-dev @types/supertest supertest
npm install --save-dev dotenv-cli
```

---

## Detalhamento dos Testes E2E

### Auth Module (3 endpoints)

```typescript
// test/e2e/auth.e2e-spec.ts
describe('Auth (E2E)', () => {
  describe('POST /auth/register', () => {
    it('should register a new user with valid data');
    it('should return 409 if email already exists');
    it('should return 400 if password is too short');
    it('should return 400 if email is invalid');
    it('should hash password before saving');
    it('should return access_token after registration');
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials');
    it('should return 401 with incorrect password');
    it('should return 401 with non-existent email');
    it('should return access_token after login');
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token');
    it('should return 401 without token');
    it('should return 401 with invalid token');
    it('should return 401 with expired token');
  });
});
```

### Categories Module (5 endpoints)

```typescript
// test/e2e/categories.e2e-spec.ts
describe('Categories (E2E)', () => {
  describe('POST /categories', () => {
    it('should create custom category for authenticated user');
    it('should validate name (min 2 chars)');
    it('should validate type (INCOME or EXPENSE)');
    it('should accept optional icon and color');
    it('should set isDefault to false');
  });

  describe('GET /categories', () => {
    it('should list default categories + user categories');
    it('should not show other users categories');
    it('should order by isDefault desc, name asc');
  });

  describe('GET /categories/:id', () => {
    it('should return category if default or owned by user');
    it('should return 404 if not found');
    it('should return 404 if belongs to other user');
  });

  describe('PATCH /categories/:id', () => {
    it('should update user category');
    it('should return 403 when trying to edit default category');
    it('should return 403 when trying to edit other user category');
    it('should validate updated fields');
  });

  describe('DELETE /categories/:id', () => {
    it('should delete user category');
    it('should return 403 when trying to delete default category');
    it('should return 403 when trying to delete other user category');
    it('should set transactions categoryId to null (ON DELETE SET NULL)');
  });
});
```

### Bank Accounts Module (6 endpoints)

```typescript
// test/e2e/bank-accounts.e2e-spec.ts
describe('Bank Accounts (E2E)', () => {
  describe('POST /bank-accounts', () => {
    it('should create bank account with initial balance');
    it('should create bank account with zero balance if not provided');
    it('should convert reais to cents for storage');
    it('should validate account type (CHECKING or SAVINGS)');
    it('should validate name (min 2 chars)');
  });

  describe('GET /bank-accounts', () => {
    it('should list user bank accounts');
    it('should not show other users accounts');
    it('should convert cents to reais in response');
    it('should order by createdAt desc');
  });

  describe('GET /bank-accounts/:id', () => {
    it('should return account if owned by user');
    it('should return 404 if not found');
    it('should return 404 if belongs to other user');
    it('should format balance in reais');
  });

  describe('PATCH /bank-accounts/:id', () => {
    it('should update account name and type');
    it('should not update balance directly');
    it('should return 403 for other user account');
  });

  describe('PATCH /bank-accounts/:id/balance', () => {
    it('should update balance manually');
    it('should accept negative balance');
    it('should convert reais to cents');
    it('should return updated balance in reais');
  });

  describe('DELETE /bank-accounts/:id', () => {
    it('should delete user account');
    it('should set transactions bankAccountId to null');
    it('should return 403 for other user account');
  });
});
```

### Credit Cards Module (5 endpoints)

```typescript
// test/e2e/credit-cards.e2e-spec.ts
describe('Credit Cards (E2E)', () => {
  describe('POST /credit-cards', () => {
    it('should create credit card with valid data');
    it('should validate lastFourDigits (exactly 4 chars)');
    it('should validate closingDay (1-31)');
    it('should validate dueDay (1-31)');
    it('should convert limit from reais to cents');
    it('should validate limit >= 0');
  });

  describe('GET /credit-cards', () => {
    it('should list user credit cards');
    it('should not show other users cards');
    it('should convert cents to reais in response');
  });

  describe('GET /credit-cards/:id', () => {
    it('should return card if owned by user');
    it('should return 404 if not found');
    it('should return 404 if belongs to other user');
  });

  describe('PATCH /credit-cards/:id', () => {
    it('should update card fields');
    it('should convert limit if provided');
    it('should validate day ranges');
    it('should return 403 for other user card');
  });

  describe('DELETE /credit-cards/:id', () => {
    it('should delete user card');
    it('should set transactions creditCardId to null');
    it('should return 403 for other user card');
  });
});
```

### Transactions Module (6 endpoints) - COMPLEXO

```typescript
// test/e2e/transactions.e2e-spec.ts
describe('Transactions (E2E)', () => {
  describe('POST /transactions', () => {
    describe('Simple Transactions', () => {
      it('should create CASH transaction');
      it('should create DEBIT transaction with bankAccountId');
      it('should create TRANSFER transaction with bankAccountId');
      it('should create CREDIT_CARD transaction with creditCardId');
      it('should validate amount > 0');
      it('should validate payment method requirements');
      it('should fail CREDIT_CARD without creditCardId');
      it('should fail DEBIT without bankAccountId');
    });

    describe('Installment Transactions', () => {
      it('should create 6 installments for CREDIT_CARD');
      it('should divide amount equally among installments');
      it('should set correct installmentNumber and totalInstallments');
      it('should create parent-child relationship');
      it('should increment dates monthly');
      it('should append (X/N) to description');
      it('should fail installments for non-CREDIT_CARD payment');
      it('should validate installments (1-100)');
    });

    describe('Recurring Transactions', () => {
      it('should create recurring template with rule');
      it('should validate recurrenceRule if isRecurring=true');
      it('should accept optional recurrenceEndDate');
    });
  });

  describe('GET /transactions', () => {
    it('should list user transactions');
    it('should filter by type (INCOME/EXPENSE)');
    it('should filter by paymentMethod');
    it('should filter by status');
    it('should filter by categoryId');
    it('should filter by bankAccountId');
    it('should filter by creditCardId');
    it('should filter by isInstallment');
    it('should filter by date range (startDate, endDate)');
    it('should combine multiple filters');
    it('should order by date desc');
  });

  describe('GET /transactions/:id', () => {
    it('should return transaction with relations');
    it('should format amount in reais');
    it('should include category, bankAccount, creditCard');
    it('should return 404 if not found');
  });

  describe('PATCH /transactions/:id', () => {
    it('should update transaction fields');
    it('should convert amount if provided');
    it('should validate updated fields');
    it('should return 403 for other user transaction');
  });

  describe('PATCH /transactions/:id/status', () => {
    it('should update status to COMPLETED');
    it('should update bank account balance when DEBIT becomes COMPLETED');
    it('should add amount for INCOME to bank balance');
    it('should subtract amount for EXPENSE from bank balance');
    it('should reverse balance when changing from COMPLETED to PENDING');
    it('should not affect balance for CREDIT_CARD transactions');
    it('should not affect balance for CASH transactions');
    it('should handle status CANCELLED');
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete single transaction');
    it('should delete parent and all installment children');
    it('should not delete children when deleting child installment');
    it('should return 403 for other user transaction');
  });
});
```

### Bills Module (5 endpoints)

```typescript
// test/e2e/bills.e2e-spec.ts
describe('Bills (E2E)', () => {
  describe('POST /bills/generate/:creditCardId', () => {
    it('should generate bill for reference month');
    it('should calculate period from previous closing to current closing');
    it('should collect transactions in the period');
    it('should calculate total amount correctly');
    it('should set closingDate and dueDate based on card');
    it('should link transactions to bill');
    it('should return 409 if bill already exists for period');
    it('should return 404 if card not found');
    it('should return 404 if card belongs to other user');
    it('should validate referenceMonth format (YYYY-MM)');
    it('should handle edge case: closing day 31 in February');
  });

  describe('GET /bills', () => {
    it('should list user bills');
    it('should not show other users bills');
    it('should filter by creditCardId');
    it('should filter by status');
    it('should order by referenceMonth desc');
    it('should format amounts in reais');
  });

  describe('GET /bills/:id', () => {
    it('should return bill with transactions');
    it('should include creditCard info');
    it('should calculate balance (total - paid)');
    it('should format all amounts in reais');
    it('should return 404 if not found');
    it('should return 404 if belongs to other user');
  });

  describe('PATCH /bills/:id/pay', () => {
    it('should accept partial payment');
    it('should increment paidAmount');
    it('should update status to PAID when fully paid');
    it('should keep status OPEN if partially paid');
    it('should accept optional bankAccountId');
    it('should validate amount > 0');
  });

  describe('PATCH /bills/:id/close', () => {
    it('should update status to CLOSED');
    it('should return 409 if already PAID');
    it('should return 404 if not found');
  });
});
```

### Reports Module (5 endpoints)

```typescript
// test/e2e/reports.e2e-spec.ts
describe('Reports (E2E)', () => {
  describe('GET /reports/summary', () => {
    it('should calculate total balance from all bank accounts');
    it('should calculate total credit limit from all cards');
    it('should calculate total credit card debt from open bills');
    it('should calculate pending income');
    it('should calculate pending expenses');
    it('should return zeros if no data');
  });

  describe('GET /reports/cash-flow', () => {
    it('should calculate income and expenses for period');
    it('should filter by startDate and endDate');
    it('should only include COMPLETED transactions');
    it('should calculate balance (income - expenses)');
    it('should return transactionCount');
  });

  describe('GET /reports/expenses-by-category', () => {
    it('should group expenses by category');
    it('should calculate total per category');
    it('should calculate percentage per category');
    it('should count transactions per category');
    it('should handle uncategorized transactions');
    it('should order by amount descending');
    it('should filter by date range');
    it('should only include COMPLETED transactions');
  });

  describe('GET /reports/income-vs-expenses', () => {
    it('should calculate total income and expenses');
    it('should calculate difference');
    it('should break down by month');
    it('should calculate balance per month');
    it('should order months chronologically');
    it('should filter by date range');
  });

  describe('GET /reports/credit-card-usage', () => {
    it('should list all user credit cards');
    it('should calculate current usage from open bills');
    it('should calculate available limit');
    it('should calculate usage percentage');
    it('should handle cards with no usage');
    it('should format all amounts in reais');
  });
});
```

### Complete Flow (Fluxo Integrado)

```typescript
// test/e2e/flows/complete-user-flow.e2e-spec.ts
describe('Complete User Flow (E2E)', () => {
  it('should complete full financial workflow', async () => {
    // 1. Register user
    // 2. Login and get token
    // 3. Create categories (Alimentação, Transporte, Salário)
    // 4. Create bank account (Nubank, R$ 1000)
    // 5. Create credit card (Nubank, limit R$ 5000, closes 10, due 17)
    // 6. Create DEBIT transaction (Supermercado R$ 100)
    // 7. Verify balance updated to R$ 900
    // 8. Update transaction status to COMPLETED
    // 9. Create CREDIT_CARD transaction with 6 installments
    // 10. Verify 6 transactions created
    // 11. Generate bill for credit card
    // 12. Verify bill contains installment transactions
    // 13. Pay bill partially
    // 14. Pay bill fully (status → PAID)
    // 15. Check summary report
    // 16. Check cash flow report
    // 17. Check expenses by category
    // 18. Verify all data is correct
  });
});
```

---

## Detalhamento dos Testes de Integração

### Transactions Service Integration

```typescript
// test/integration/transactions.service.integration-spec.ts
describe('Transactions Service (Integration)', () => {
  describe('Installment Creation', () => {
    it('should create installments with correct parent-child relationship');
    it('should divide amount correctly handling rounding');
    it('should increment dates by exact month intervals');
    it('should handle month edge cases (Jan 31 → Feb 28)');
  });

  describe('Balance Updates', () => {
    it('should update bank account balance on status change');
    it('should handle concurrent balance updates correctly');
    it('should reverse balance update correctly');
    it('should not update balance for CREDIT_CARD transactions');
  });

  describe('Transaction Filters', () => {
    it('should combine multiple filters correctly');
    it('should handle date range boundaries');
    it('should filter installments correctly');
  });
});
```

### Bills Service Integration

```typescript
// test/integration/bills.service.integration-spec.ts
describe('Bills Service (Integration)', () => {
  describe('Bill Generation', () => {
    it('should calculate period correctly for different closing days');
    it('should handle edge case: closing day 31');
    it('should collect correct transactions in period');
    it('should calculate total amount correctly');
    it('should link transactions to bill atomically');
  });

  describe('Period Calculation', () => {
    it('should handle January closing correctly');
    it('should handle December closing correctly');
    it('should handle leap year February');
    it('should handle month transitions');
  });

  describe('Payment Tracking', () => {
    it('should handle multiple partial payments');
    it('should update status correctly when fully paid');
    it('should prevent overpayment');
  });
});
```

### Balance Updates Integration

```typescript
// test/integration/balance-updates.integration-spec.ts
describe('Balance Updates (Integration)', () => {
  it('should update balance when DEBIT transaction becomes COMPLETED');
  it('should reverse balance when COMPLETED transaction becomes PENDING');
  it('should handle multiple transactions updating same account');
  it('should maintain balance consistency with concurrent updates');
  it('should not update balance for CASH transactions');
  it('should not update balance for CREDIT_CARD transactions');
});
```

### Money Handling Integration

```typescript
// test/integration/money-handling.integration-spec.ts
describe('Money Handling (Integration)', () => {
  it('should convert reais to cents and back correctly');
  it('should handle rounding in installment division');
  it('should maintain precision in balance updates');
  it('should format money correctly in reports');
  it('should handle very large amounts');
  it('should handle very small amounts (cents)');
});
```

---

## Detalhamento dos Testes Unitários

### Money Value Object

```typescript
// src/shared/value-objects/money.vo.spec.ts
describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create from cents');
    it('should create from reais');
    it('should throw error if cents is not integer');
    it('should handle negative values');
    it('should handle zero');
  });

  describe('Conversions', () => {
    it('should convert reais to cents (10.50 → 1050)');
    it('should convert cents to reais (1050 → 10.50)');
    it('should round correctly (10.555 → 1056)');
  });

  describe('Operations', () => {
    it('should add two Money instances');
    it('should subtract two Money instances');
    it('should multiply by factor');
    it('should divide by divisor with rounding');
  });

  describe('Comparisons', () => {
    it('should check if positive');
    it('should check if negative');
    it('should check if zero');
    it('should check equality');
  });

  describe('Formatting', () => {
    it('should format in BRL currency (R$ 1.234,56)');
    it('should format negative values');
    it('should handle zero');
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts');
    it('should handle division by 3 (rounding)');
    it('should handle division by 7 (rounding)');
  });
});
```

### Date Helpers

```typescript
// test/unit/date-helpers.spec.ts
describe('Date Helpers', () => {
  describe('addMonths', () => {
    it('should add months correctly');
    it('should handle year transition (Dec → Jan)');
    it('should handle edge case: Jan 31 + 1 month = Feb 28/29');
    it('should handle leap years');
  });

  describe('subtractMonths', () => {
    it('should subtract months correctly');
    it('should handle year transition (Jan → Dec)');
    it('should handle edge cases');
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for each month');
    it('should handle February in leap years');
    it('should handle February in non-leap years');
  });
});
```

---

## Helpers e Fixtures

### Test Helpers

```typescript
// test/setup/test-helpers.ts

export class TestHelpers {
  // Create authenticated user and return token
  static async createAuthenticatedUser(app: INestApplication) {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    return response.body.access_token;
  }

  // Create bank account
  static async createBankAccount(app: INestApplication, token: string, data?: any) {
    return request(app.getHttpServer())
      .post('/bank-accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Account',
        type: 'CHECKING',
        initialBalance: 1000,
        ...data
      });
  }

  // Create credit card
  static async createCreditCard(app: INestApplication, token: string, data?: any) {
    return request(app.getHttpServer())
      .post('/credit-cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Card',
        lastFourDigits: '1234',
        limit: 5000,
        closingDay: 10,
        dueDay: 17,
        ...data
      });
  }

  // Create category
  static async createCategory(app: INestApplication, token: string, data?: any) {
    return request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Category',
        type: 'EXPENSE',
        ...data
      });
  }

  // Clean database
  static async cleanDatabase(prisma: PrismaService) {
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.creditCardBill.deleteMany(),
      prisma.category.deleteMany(),
      prisma.bankAccount.deleteMany(),
      prisma.creditCard.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }
}
```

### Fixtures

```typescript
// test/fixtures/user.fixture.ts
export const userFixtures = {
  validUser: {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe'
  },
  anotherUser: {
    email: 'jane@example.com',
    password: 'password456',
    name: 'Jane Smith'
  }
};

// test/fixtures/bank-account.fixture.ts
export const bankAccountFixtures = {
  checking: {
    name: 'Nubank',
    type: 'CHECKING',
    initialBalance: 1000
  },
  savings: {
    name: 'Poupança CEF',
    type: 'SAVINGS',
    initialBalance: 5000
  }
};

// test/fixtures/transaction.fixture.ts
export const transactionFixtures = {
  cashExpense: {
    description: 'Almoço',
    amount: 50,
    type: 'EXPENSE',
    paymentMethod: 'CASH',
    date: '2024-03-15'
  },
  creditCardInstallment: {
    description: 'Notebook',
    amount: 3000,
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    date: '2024-03-15',
    installments: 6
  }
};
```

---

## Database Setup para Testes

```typescript
// test/setup/database.setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Conectar ao banco de teste
  await prisma.$connect();

  // Limpar banco antes de cada suite
  await cleanDatabase();
});

afterAll(async () => {
  // Desconectar após todos os testes
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpar banco antes de cada teste
  await cleanDatabase();
});

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.creditCardBill.deleteMany(),
    prisma.category.deleteMany(),
    prisma.bankAccount.deleteMany(),
    prisma.creditCard.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export { prisma };
```

---

## Métricas de Sucesso

### Cobertura Esperada

**E2E:**
- Controllers: 100%
- Routes: 100% (35/35 endpoints)
- Fluxos críticos: 100%

**Integração:**
- Services complexos: 60-70%
- Lógica de negócio: 70%

**Unitários:**
- Value Objects: 100%
- Helpers: 80%

**Overall:**
- Target: 80-90% de cobertura total

### Checklist de Implementação

#### Setup (Fase 1)
- [ ] Configurar banco de dados de teste
- [ ] Criar test helpers reutilizáveis
- [ ] Criar fixtures de dados
- [ ] Configurar scripts npm
- [ ] Configurar jest-e2e.json
- [ ] Testar setup com teste dummy

#### E2E (Fase 2)
- [ ] Auth Module (3 endpoints)
- [ ] Categories Module (5 endpoints)
- [ ] Bank Accounts Module (6 endpoints)
- [ ] Credit Cards Module (5 endpoints)
- [ ] Transactions Module (6 endpoints)
- [ ] Bills Module (5 endpoints)
- [ ] Reports Module (5 endpoints)
- [ ] Complete Flow (fluxo integrado)

#### Integração (Fase 3)
- [ ] Transactions Service (installments)
- [ ] Bills Service (period calculation)
- [ ] Balance Updates
- [ ] Money Handling

#### Unitários (Fase 4)
- [ ] Money Value Object
- [ ] Date Helpers
- [ ] Validators

#### Finalização
- [ ] Rodar todos os testes
- [ ] Verificar cobertura (npm run test:cov)
- [ ] Documentar casos de edge conhecidos
- [ ] Revisar e refatorar testes duplicados

---

## Comandos Úteis

```bash
# Rodar todos os testes
npm run test

# Rodar apenas E2E
npm run test:e2e

# Rodar apenas integração
npm run test:integration

# Rodar apenas unitários
npm run test:unit

# Rodar com cobertura
npm run test:cov

# Rodar em watch mode
npm run test:watch

# Resetar banco de testes
npm run test:db:reset

# Debug de testes
npm run test:debug
```

---

## Notas Importantes

1. **Isolamento de Testes:** Cada teste deve ser independente e limpar o banco após execução
2. **Performance:** E2E podem ser lentos, considere rodar em paralelo quando possível
3. **Flakiness:** Evitar testes flaky usando dados determinísticos e await correto
4. **Manutenção:** Manter fixtures e helpers atualizados quando schema mudar
5. **CI/CD:** Configurar pipeline para rodar testes automaticamente
6. **Banco de Teste:** NUNCA usar banco de produção ou desenvolvimento para testes

---

## Próximos Passos

Quando for implementar:
1. Começar pela **Fase 1 (Setup)**
2. Implementar **E2E Auth** como teste piloto
3. Se E2E Auth funcionar bem, seguir ordem dos módulos
4. Ao final de cada módulo, rodar cobertura e ajustar
5. Implementar integração e unitários conforme necessidade

**Boa sorte! 🚀**
