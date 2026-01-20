# PRODUCT CONTEXT & AI GUIDELINES - Simple Finance

> **SYSTEM PROMPT:** This document serves as the absolute source of truth for the "Simple Finance" project. When generating code, tests, or documentation, adhere strictly to the rules, patterns, and domain logic defined below.

## 1. Project Identity
**Simple Finance** is a personal finance management system focused on strict control of credit cards, bank accounts, and monthly bills.
- **Core Philosophy:** Precision over approximation. Zero floating-point math.
- **Current State:** Backend (NestJS) complete. Frontend pending.

## 2. Tech Stack & Constraints
- **Backend:** NestJS 11+, TypeScript 5.7+, Node.js.
- **Database:** PostgreSQL with Prisma ORM 7.2.
- **Authentication:** JWT (Passport), bcrypt for hashing.
- **Validation:** `class-validator` and `class-transformer`.
- **Formatting:** Prettier + ESLint (Standard TS rules).

## 3. CRITICAL INVARIANTS (Do Not Break)

### 💰 Rule #1: Money is Integer (Cents)
- **Storage:** ALL monetary values in the database are stored as **Integers** representing cents.
  - `R$ 10,00` -> Store as `1000`.
  - `R$ 0,50` -> Store as `50`.
- **Computation:** NEVER perform math on floating-point numbers.
- **Value Object:** Use the existing `Money` Value Object (if available in context) or helper functions to convert `Cents <-> Reais`.
- **API Contract:** The API receives and returns numeric values. Ideally, DTOs should handle transformation, but ensure the database layer *always* receives integers.

### 🔐 Rule #2: User Isolation
- Every query MUST be scoped to the `req.user.id`.
- Use the `@CurrentUser()` decorator in Controllers.
- **Security:** Never trust an ID coming from `params` without verifying it belongs to the current user (e.g., `where: { id: params.id, userId: user.id }`).

## 4. Domain Logic & Business Rules

### A. Transactions & Installments
- **Types:** `INCOME` (adds to balance) vs `EXPENSE` (subtracts).
- **Installment Logic:**
  - An installment purchase of R$ 100 in 10x creates **10 separate Transaction records**.
  - **Linking:** The first transaction is the parent (or they share a `parentId`).
  - **Deletion:** Deleting a parent transaction MUST delete all child installments (Cascade).
  - **Naming:** Description usually appends `(1/10)`, `(2/10)`, etc.

### B. Credit Cards & Bills
- **Cycle:**
  - **Closing Day:** The day the bill closes. Transactions after this date go to the *next* month's bill.
  - **Due Day:** The day the bill must be paid.
- **Bill Generation:**
  - One `CreditCardBill` per card per month.
  - Unique constraint: `[creditCardId, referenceMonth]`.
  - Status flow: `OPEN` -> `CLOSED` -> `PAID`.

### C. Bank Accounts
- **Types:** `CHECKING` (Conta Corrente), `SAVINGS` (Poupança).
- **Balance:** Can be negative (overdraft).
- **Updates:** Balance is updated strictly via specific endpoints or triggered by Transaction status changes (`PENDING` -> `COMPLETED`).

## 5. Architectural Standards (NestJS)

### Structure
```
src/
├── modules/           # Feature Modules (Auth, BankAccounts, etc.)
│   └── [feature]/
│       ├── dto/       # Input/Output validation
│       ├── [name].controller.ts
│       ├── [name].service.ts
│       └── [name].module.ts
├── shared/            # Shared Logic
│   └── value-objects/ # e.g., Money.vo.ts
└── common/            # Infra (Guards, Decorators, Database)
```

### Coding Patterns
1.  **Service Layer:** Contains ALL business logic. Controllers should be thin adapters.
2.  **DTOs:** strict typing. Use `@IsInt()`, `@IsString()`, `@IsOptional()`.
3.  **Return Types:** Explicitly declare return types for all methods.
4.  **Error Handling:** Throw standard NestJS HTTP Exceptions (`NotFoundException`, `BadRequestException`).

## 6. Frontend Integration Protocols (For Future Use)
- **Currency Display:** Frontend is responsible for dividing API integer values by 100 and formatting as Locale Currency (BRL).
- **Dates:** API returns ISO 8601 strings. Frontend handles timezone display.
- **State:** If using Next.js, prefer Server Actions or TanStack Query. If Angular, use Services with Signals.

## 7. Testing Strategy
- **Unit:** Jest. Mock PrismaService. Test business logic in Services.
- **E2E:** Supertest. Use a test database. Test full request flow including Auth.
