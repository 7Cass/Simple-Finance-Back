# CLAUDE.MD - Simple Finance API

## Project Overview
Simple Finance API is a personal finance control system focused on monitoring credit cards, bank accounts, and bills. Built with NestJS, PostgreSQL, and Prisma.

## Tech Stack
- **Framework**: NestJS 11.0
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL
- **ORM**: Prisma 7.2
- **Authentication**: JWT (Passport + JWT)
- **Validation**: class-validator + class-transformer
- **Password Hashing**: bcrypt

## Project Structure

```
src/
├── modules/              # Feature modules
│   └── auth/            # Authentication & authorization (JWT, registration, login)
├── shared/              # Reusable business logic
│   ├── value-objects/   # Money value object, etc.
│   └── types/           # Shared enums and types
├── common/              # Infrastructure layer
│   ├── database/        # Prisma service
│   ├── decorators/      # Custom decorators (@Public, @GetUser, etc.)
│   └── guards/          # Authentication guards (JwtAuthGuard)
├── app.module.ts        # Root module
└── main.ts              # Bootstrap file
```

## Database Schema

### Core Models
- **User**: Users with email/password authentication
- **BankAccount**: Bank accounts (CHECKING/SAVINGS) with balance tracking
- **CreditCard**: Credit cards with limits, closing days, and due dates
- **Transaction**: Financial transactions with support for:
  - Installment payments (parcelamento)
  - Recurring transactions
  - Multiple payment methods (CREDIT_CARD, DEBIT, CASH, TRANSFER)
- **CreditCardBill**: Monthly credit card bills with status tracking
- **Category**: Transaction categories (user-specific or default)

### Important Conventions

#### Monetary Values
- **All money stored as cents (Int)** in database
- R$ 10.50 → 1050 cents
- R$ 100.00 → 10000 cents
- Use the Money value object in `src/shared/value-objects/` for conversions
- API accepts/returns values in reals, internally uses cents for precision

#### Enums
- **AccountType**: CHECKING, SAVINGS
- **TransactionType**: INCOME, EXPENSE
- **PaymentMethod**: CREDIT_CARD, DEBIT, CASH, TRANSFER
- **TransactionStatus**: PENDING, COMPLETED, CANCELLED
- **RecurrenceRule**: DAILY, WEEKLY, MONTHLY, YEARLY
- **BillStatus**: OPEN, CLOSED, PAID, OVERDUE

## Current Implementation Status

### ✅ Implemented (100% Functional)
All core features are fully implemented and operational:

1. **Authentication & Authorization**
   - User registration and login
   - JWT token generation and validation
   - Protected routes with global JwtAuthGuard
   - Custom decorators (@Public, @CurrentUser)

2. **Bank Accounts**
   - Complete CRUD operations
   - Balance tracking and updates
   - Soft delete with restore functionality
   - AccountType support (CHECKING, SAVINGS)

3. **Credit Cards**
   - Complete CRUD operations
   - Limit management
   - Closing day and due day tracking
   - Soft delete with restore functionality

4. **Transactions**
   - Complete CRUD with advanced features
   - Installment payments (up to 100x, credit card only)
   - Recurring transactions (DAILY, WEEKLY, MONTHLY, YEARLY)
   - Multiple payment methods (CREDIT_CARD, DEBIT, CASH, TRANSFER)
   - Status management (PENDING, COMPLETED, CANCELLED)
   - Automatic bank account balance updates
   - Soft delete with cascade to installments

5. **Credit Card Bills**
   - Bill generation based on closing/due dates
   - Transaction aggregation by period
   - Payment tracking (partial and full)
   - Status management (OPEN, CLOSED, PAID, OVERDUE)

6. **Categories**
   - Default categories (global, read-only)
   - Custom user categories
   - Icon and color support
   - Type classification (INCOME/EXPENSE)

7. **Reports & Analytics**
   - Summary: Total balance, credit limit, debt, pending transactions
   - Cash Flow: Income vs expenses with period filters
   - Expenses by Category: Aggregation with percentages
   - Income vs Expenses: Monthly trends
   - Credit Card Usage: Limit usage and availability

### 🚧 Future Enhancements
- CSV/OFX import functionality
- Automatic bill status updates (OVERDUE detection via cron)
- Automatic recurring transaction generation
- Multi-currency support
- API rate limiting
- Data export (PDF, Excel)
- Email notifications

## Development Workflow

### Commands
```bash
# Development server (port 3000)
npm run start:dev

# Build production
npm run build

# Run tests
npm run test

# Prisma Studio (database GUI)
npx prisma studio

# Database migrations
npx prisma migrate dev --name <migration-name>
```

### Environment Variables
Required in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/simple_finance?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

## API Endpoints

All endpoints are fully implemented and functional:

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with email/password
- `GET /auth/profile` - Get user profile (authenticated)

### Bank Accounts
- `POST /bank-accounts` - Create bank account
- `GET /bank-accounts` - List all accounts (with includeDeleted filter)
- `GET /bank-accounts/:id` - Get specific account
- `PATCH /bank-accounts/:id` - Update account name/type
- `PATCH /bank-accounts/:id/balance` - Update account balance
- `DELETE /bank-accounts/:id` - Soft delete account
- `PATCH /bank-accounts/:id/restore` - Restore deleted account

### Credit Cards
- `POST /credit-cards` - Create credit card
- `GET /credit-cards` - List all cards (with includeDeleted filter)
- `GET /credit-cards/:id` - Get specific card
- `PATCH /credit-cards/:id` - Update card details
- `DELETE /credit-cards/:id` - Soft delete card
- `PATCH /credit-cards/:id/restore` - Restore deleted card

### Transactions
- `POST /transactions` - Create transaction (simple, installment, or recurring)
- `GET /transactions` - List transactions with filters
- `GET /transactions/:id` - Get specific transaction
- `PATCH /transactions/:id` - Update transaction
- `PATCH /transactions/:id/status` - Update transaction status
- `DELETE /transactions/:id` - Soft delete transaction

### Bills
- `POST /bills/generate/:creditCardId` - Generate bill for specific month
- `GET /bills` - List bills (with filters)
- `GET /bills/:id` - Get bill with transactions
- `PATCH /bills/:id/pay` - Pay bill (full or partial)
- `PATCH /bills/:id/close` - Close bill

### Categories
- `POST /categories` - Create custom category
- `GET /categories` - List all categories (default + custom)
- `GET /categories/:id` - Get specific category
- `PATCH /categories/:id` - Update custom category
- `DELETE /categories/:id` - Delete custom category

### Reports
- `GET /reports/summary` - General financial summary
- `GET /reports/cash-flow` - Income vs expenses with period filters
- `GET /reports/expenses-by-category` - Expenses grouped by category
- `GET /reports/income-vs-expenses` - Monthly trends
- `GET /reports/credit-card-usage` - Credit card usage and limits

## Code Patterns

### Authentication
- Use `@Public()` decorator for public endpoints
- Use `@GetUser()` decorator to get current user in controllers
- JWT tokens expire in 7 days (configurable)
- All endpoints are protected by default (JwtAuthGuard is global)

### Validation
- Use DTOs with class-validator decorators
- ValidationPipe is enabled globally with transform: true

### Database Access
- Inject PrismaService in services/modules
- All timestamps (createdAt, updatedAt) are automatic
- Use cascading deletes: deleting a User deletes all related data

## Testing Strategy
- Jest for unit tests
- Supertest for E2E tests
- Test files: `*.spec.ts` (unit) in src/, `*.e2e-spec.ts` in test/

## Important Notes for Claude

1. **Always use cents for monetary values** in database operations
2. **Language**: README and user-facing content is in Portuguese (BR), but code should remain in English
3. **IDs are UUIDs**, not auto-incrementing integers
4. **Cascade deletes**: Be aware that deleting users will delete all their data
5. **Transaction installments**: Use parent-child relationship with parentId
6. **Credit card bills**: Auto-generate based on closing/due days
7. **No Git repo yet**: Project is not in version control

## Documentation Structure

Detailed documentation for each module can be found in their respective directories:

### Modules Documentation
- **Auth**: `src/modules/auth/README.md` - Authentication, JWT, decorators, strategies
- **Bank Accounts**: `src/modules/bank-accounts/README.md` - CRUD, soft delete, balance management
- **Credit Cards**: `src/modules/credit-cards/README.md` - CRUD, soft delete, closing/due dates
- **Transactions**: `src/modules/transactions/README.md` - CRUD, installments, recurrence, payment methods
- **Bills**: `src/modules/bills/README.md` - Bill generation, payment tracking, period calculation
- **Categories**: `src/modules/categories/README.md` - Default vs custom, CRUD, protection
- **Reports**: `src/modules/reports/README.md` - All report types, aggregations, filters

### Infrastructure Documentation
- **Common Layer**: `src/common/README.md` - PrismaService, decorators, guards
- **Shared Layer**: `src/shared/README.md` - Money Value Object, enums, types

Each module README contains:
- Detailed endpoint documentation with examples
- Request/response formats
- Business logic explanations
- Integration points with other modules
- Testing recommendations
- Future improvements

## Next Development Priorities
1. CSV/OFX import functionality
2. Job/cron for automatic bill status updates (OVERDUE)
3. Job/cron for recurring transaction generation
4. Enhanced error handling and logging
5. API rate limiting
6. Data export (PDF, Excel, CSV)
7. Email notifications for due dates
8. Multi-currency support
