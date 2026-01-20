# Simple Finance API - Referência Completa

**Versão:** 1.0.0
**Base URL:** `http://localhost:3000`
**Última Atualização:** 2026-01-17

---

## Visão Geral

**Status:** ✅ Implementado e funcional
**Total de Endpoints:** 35
**Autenticação:** JWT (Bearer Token)
**Formato de Dados:** JSON
**Timezone:** UTC

### Módulos Disponíveis

| Módulo | Endpoints | Status | Descrição |
|--------|-----------|--------|-----------|
| Auth | 3 | ✅ | Registro, login e perfil de usuário |
| Categories | 5 | ✅ | Categorias de receitas/despesas |
| Bank Accounts | 6 | ✅ | Contas bancárias com saldo |
| Credit Cards | 5 | ✅ | Cartões de crédito e limites |
| Transactions | 6 | ✅ | Transações com parcelamento |
| Bills | 5 | ✅ | Faturas de cartão de crédito |
| Reports | 5 | ✅ | Relatórios financeiros |

---

## 🔐 Authentication

### POST /auth/register
Registra um novo usuário no sistema.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Validações:**
- `email`: deve ser um email válido
- `password`: mínimo 6 caracteres
- `name`: mínimo 2 caracteres

**Response (201):**
```json
{
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `409 Conflict`: Email já está em uso

---

### POST /auth/login
Autentica usuário e retorna token JWT.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 Unauthorized`: Credenciais inválidas

---

### GET /auth/profile
Retorna o perfil do usuário autenticado.

**Request:**
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente

---

## 🏷️ Categories

### POST /categories
Cria uma categoria personalizada.

**Request:**
```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Alimentação",
  "type": "EXPENSE",
  "icon": "🍔",
  "color": "#FF5733"
}
```

**Validações:**
- `name`: mínimo 2 caracteres (obrigatório)
- `type`: "INCOME" ou "EXPENSE" (obrigatório)
- `icon`: string opcional
- `color`: string opcional (hex color)

**Response (201):**
```json
{
  "id": "uuid-v4",
  "name": "Alimentação",
  "type": "EXPENSE",
  "icon": "🍔",
  "color": "#FF5733",
  "isDefault": false,
  "userId": "uuid-v4",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

---

### GET /categories
Lista todas as categorias (padrão + personalizadas do usuário).

**Request:**
```http
GET /categories
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "name": "Salário",
    "type": "INCOME",
    "icon": "💰",
    "color": "#28A745",
    "isDefault": true,
    "userId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "name": "Alimentação",
    "type": "EXPENSE",
    "icon": "🍔",
    "color": "#FF5733",
    "isDefault": false,
    "userId": "uuid-user",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  }
]
```

**Nota:** Categorias padrão (`isDefault: true`) são compartilhadas entre todos os usuários.

---

### GET /categories/:id
Retorna detalhes de uma categoria específica.

**Request:**
```http
GET /categories/uuid-categoria
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-categoria",
  "name": "Alimentação",
  "type": "EXPENSE",
  "icon": "🍔",
  "color": "#FF5733",
  "isDefault": false,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Errors:**
- `404 Not Found`: Categoria não encontrada ou não pertence ao usuário

---

### PATCH /categories/:id
Atualiza uma categoria personalizada.

**Request:**
```http
PATCH /categories/uuid-categoria
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Restaurantes",
  "icon": "🍽️"
}
```

**Response (200):**
```json
{
  "id": "uuid-categoria",
  "name": "Restaurantes",
  "type": "EXPENSE",
  "icon": "🍽️",
  "color": "#FF5733",
  "isDefault": false,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:05:00.000Z"
}
```

**Errors:**
- `403 Forbidden`: Tentativa de editar categoria padrão ou de outro usuário

---

### DELETE /categories/:id
Deleta uma categoria personalizada.

**Request:**
```http
DELETE /categories/uuid-categoria
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

**Errors:**
- `403 Forbidden`: Tentativa de deletar categoria padrão ou de outro usuário

**Nota:** Transações vinculadas terão `categoryId` setado para `null`.

---

## 🏦 Bank Accounts

### POST /bank-accounts
Cria uma conta bancária.

**Request:**
```http
POST /bank-accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nubank",
  "type": "CHECKING",
  "initialBalance": 1000.00
}
```

**Validações:**
- `name`: mínimo 2 caracteres (obrigatório)
- `type`: "CHECKING" ou "SAVINGS" (obrigatório)
- `initialBalance`: número opcional (default: 0, pode ser negativo)

**Response (201):**
```json
{
  "id": "uuid-v4",
  "name": "Nubank",
  "type": "CHECKING",
  "balance": 1000.00,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Nota:** `balance` é retornado em reais mas armazenado em centavos (1000.00 → 100000 cents).

---

### GET /bank-accounts
Lista todas as contas bancárias do usuário.

**Request:**
```http
GET /bank-accounts
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "name": "Nubank",
    "type": "CHECKING",
    "balance": 1000.00,
    "userId": "uuid-user",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "name": "Poupança CEF",
    "type": "SAVINGS",
    "balance": 5000.00,
    "userId": "uuid-user",
    "createdAt": "2024-03-10T10:00:00.000Z",
    "updatedAt": "2024-03-10T10:00:00.000Z"
  }
]
```

---

### GET /bank-accounts/:id
Retorna detalhes de uma conta bancária.

**Request:**
```http
GET /bank-accounts/uuid-conta
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-conta",
  "name": "Nubank",
  "type": "CHECKING",
  "balance": 900.00,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T11:00:00.000Z"
}
```

**Errors:**
- `404 Not Found`: Conta não encontrada ou não pertence ao usuário

---

### PATCH /bank-accounts/:id
Atualiza nome ou tipo da conta.

**Request:**
```http
PATCH /bank-accounts/uuid-conta
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nubank Conta Corrente",
  "type": "CHECKING"
}
```

**Response (200):**
```json
{
  "id": "uuid-conta",
  "name": "Nubank Conta Corrente",
  "type": "CHECKING",
  "balance": 900.00,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T11:05:00.000Z"
}
```

**Nota:** O saldo **não** é atualizado por este endpoint. Use `/balance` para isso.

---

### PATCH /bank-accounts/:id/balance
Atualiza o saldo da conta manualmente.

**Request:**
```http
PATCH /bank-accounts/uuid-conta/balance
Authorization: Bearer <token>
Content-Type: application/json

{
  "balance": 1500.50
}
```

**Validações:**
- `balance`: número obrigatório (pode ser negativo)

**Response (200):**
```json
{
  "id": "uuid-conta",
  "name": "Nubank",
  "type": "CHECKING",
  "balance": 1500.50,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T11:10:00.000Z"
}
```

**Uso:** Ajuste manual de saldo (conciliação bancária).

---

### DELETE /bank-accounts/:id
Deleta uma conta bancária.

**Request:**
```http
DELETE /bank-accounts/uuid-conta
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Bank account deleted successfully"
}
```

**Nota:** Transações vinculadas terão `bankAccountId` setado para `null`.

---

## 💳 Credit Cards

### POST /credit-cards
Cria um cartão de crédito.

**Request:**
```http
POST /credit-cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nubank Platinum",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17
}
```

**Validações:**
- `name`: string obrigatória
- `lastFourDigits`: exatamente 4 caracteres (obrigatório)
- `limit`: número >= 0 (obrigatório)
- `closingDay`: 1-31 (obrigatório)
- `dueDay`: 1-31 (obrigatório)

**Response (201):**
```json
{
  "id": "uuid-v4",
  "name": "Nubank Platinum",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Nota:**
- `closingDay`: dia do mês que a fatura fecha
- `dueDay`: dia do mês de vencimento da fatura

---

### GET /credit-cards
Lista todos os cartões de crédito do usuário.

**Request:**
```http
GET /credit-cards
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "name": "Nubank Platinum",
    "lastFourDigits": "1234",
    "limit": 5000.00,
    "closingDay": 10,
    "dueDay": 17,
    "userId": "uuid-user",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "name": "Itaú Gold",
    "lastFourDigits": "5678",
    "limit": 3000.00,
    "closingDay": 5,
    "dueDay": 12,
    "userId": "uuid-user",
    "createdAt": "2024-03-10T10:00:00.000Z",
    "updatedAt": "2024-03-10T10:00:00.000Z"
  }
]
```

---

### GET /credit-cards/:id
Retorna detalhes de um cartão de crédito.

**Request:**
```http
GET /credit-cards/uuid-cartao
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-cartao",
  "name": "Nubank Platinum",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Errors:**
- `404 Not Found`: Cartão não encontrado ou não pertence ao usuário

---

### PATCH /credit-cards/:id
Atualiza informações do cartão.

**Request:**
```http
PATCH /credit-cards/uuid-cartao
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nubank Platinum Plus",
  "limit": 7000.00
}
```

**Response (200):**
```json
{
  "id": "uuid-cartao",
  "name": "Nubank Platinum Plus",
  "lastFourDigits": "1234",
  "limit": 7000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T11:00:00.000Z"
}
```

---

### DELETE /credit-cards/:id
Deleta um cartão de crédito.

**Request:**
```http
DELETE /credit-cards/uuid-cartao
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Credit card deleted successfully"
}
```

**Nota:** Transações vinculadas terão `creditCardId` setado para `null`.

---

## 💰 Transactions

### POST /transactions - CASH
Cria transação em dinheiro (não afeta saldo de conta).

**Request:**
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Almoço no restaurante",
  "amount": 50.00,
  "type": "EXPENSE",
  "paymentMethod": "CASH",
  "date": "2024-03-15",
  "categoryId": "uuid-categoria"
}
```

**Response (201):**
```json
{
  "id": "uuid-v4",
  "description": "Almoço no restaurante",
  "amount": 50.00,
  "type": "EXPENSE",
  "paymentMethod": "CASH",
  "date": "2024-03-15T00:00:00.000Z",
  "status": "PENDING",
  "isInstallment": false,
  "installmentNumber": null,
  "totalInstallments": null,
  "isRecurring": false,
  "recurrenceRule": null,
  "recurrenceEndDate": null,
  "category": {
    "id": "uuid-categoria",
    "name": "Alimentação"
  },
  "bankAccount": null,
  "creditCard": null,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

---

### POST /transactions - DEBIT
Cria transação com débito (atualiza saldo quando status = COMPLETED).

**Request:**
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Supermercado",
  "amount": 200.00,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "date": "2024-03-15",
  "bankAccountId": "uuid-conta",
  "categoryId": "uuid-categoria"
}
```

**Validação:** `bankAccountId` é obrigatório para DEBIT e TRANSFER.

**Response (201):**
```json
{
  "id": "uuid-v4",
  "description": "Supermercado",
  "amount": 200.00,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "date": "2024-03-15T00:00:00.000Z",
  "status": "PENDING",
  "isInstallment": false,
  "bankAccount": {
    "id": "uuid-conta",
    "name": "Nubank"
  },
  "category": { "id": "uuid-categoria", "name": "Supermercado" },
  "creditCard": null,
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Nota:** Saldo da conta **não** é afetado até que status seja `COMPLETED`.

---

### POST /transactions - INCOME
Cria transação de receita (aumenta saldo quando COMPLETED).

**Request:**
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Salário Março",
  "amount": 5000.00,
  "type": "INCOME",
  "paymentMethod": "TRANSFER",
  "date": "2024-03-05",
  "bankAccountId": "uuid-conta",
  "categoryId": "uuid-categoria-salario"
}
```

**Nota:** INCOME adiciona ao saldo, EXPENSE subtrai.

---

### POST /transactions - Installments
Cria transação parcelada no cartão de crédito.

**Request:**
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Notebook",
  "amount": 3000.00,
  "type": "EXPENSE",
  "paymentMethod": "CREDIT_CARD",
  "date": "2024-03-15",
  "creditCardId": "uuid-cartao",
  "installments": 6,
  "categoryId": "uuid-categoria"
}
```

**Validação:**
- `creditCardId` obrigatório para CREDIT_CARD
- `installments` entre 1 e 100

**Response (201):**
```json
[
  {
    "id": "uuid-1",
    "description": "Notebook (1/6)",
    "amount": 500.00,
    "date": "2024-03-15T00:00:00.000Z",
    "isInstallment": true,
    "installmentNumber": 1,
    "totalInstallments": 6,
    ...
  },
  {
    "id": "uuid-2",
    "description": "Notebook (2/6)",
    "amount": 500.00,
    "date": "2024-04-15T00:00:00.000Z",
    "isInstallment": true,
    "installmentNumber": 2,
    "totalInstallments": 6,
    ...
  },
  ...
]
```

**Comportamento:**
- Cria 6 transações automaticamente
- Valor dividido igualmente (R$ 3000 / 6 = R$ 500)
- Datas incrementadas mensalmente
- Relação parent-child (primeira transação é o parent)
- Deletar o parent deleta todas as parcelas

---

### POST /transactions - Recurring
Cria template de transação recorrente.

**Request:**
```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Aluguel",
  "amount": 1500.00,
  "type": "EXPENSE",
  "paymentMethod": "TRANSFER",
  "date": "2024-03-05",
  "bankAccountId": "uuid-conta",
  "categoryId": "uuid-categoria-moradia",
  "isRecurring": true,
  "recurrenceRule": "MONTHLY",
  "recurrenceEndDate": "2024-12-31"
}
```

**Validação:**
- Se `isRecurring: true`, `recurrenceRule` é obrigatório
- `recurrenceRule`: "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
- `recurrenceEndDate`: opcional

**Nota:** A API **não** gera ocorrências automaticamente. Use este endpoint para criar cada instância conforme necessário.

---

### GET /transactions
Lista transações com filtros opcionais.

**Request:**
```http
GET /transactions?type=EXPENSE&startDate=2024-03-01&endDate=2024-03-31&status=COMPLETED
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: INCOME | EXPENSE
- `paymentMethod`: CREDIT_CARD | DEBIT | CASH | TRANSFER
- `status`: PENDING | COMPLETED | CANCELLED
- `categoryId`: UUID
- `bankAccountId`: UUID
- `creditCardId`: UUID
- `isInstallment`: true | false
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "description": "Supermercado",
    "amount": 200.00,
    "type": "EXPENSE",
    "paymentMethod": "DEBIT",
    "date": "2024-03-15T00:00:00.000Z",
    "status": "COMPLETED",
    "isInstallment": false,
    "bankAccount": { "id": "uuid-conta", "name": "Nubank" },
    "category": { "id": "uuid-cat", "name": "Supermercado" },
    "creditCard": null,
    "userId": "uuid-user",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T11:00:00.000Z"
  },
  ...
]
```

---

### GET /transactions/:id
Retorna detalhes de uma transação específica.

**Request:**
```http
GET /transactions/uuid-transacao
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-transacao",
  "description": "Notebook (1/6)",
  "amount": 500.00,
  "type": "EXPENSE",
  "paymentMethod": "CREDIT_CARD",
  "date": "2024-03-15T00:00:00.000Z",
  "status": "PENDING",
  "isInstallment": true,
  "installmentNumber": 1,
  "totalInstallments": 6,
  "isRecurring": false,
  "recurrenceRule": null,
  "recurrenceEndDate": null,
  "category": { "id": "uuid-cat", "name": "Eletrônicos" },
  "bankAccount": null,
  "creditCard": { "id": "uuid-card", "name": "Nubank Platinum" },
  "userId": "uuid-user",
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

---

### PATCH /transactions/:id
Atualiza campos de uma transação.

**Request:**
```http
PATCH /transactions/uuid-transacao
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Supermercado Extra",
  "amount": 250.00,
  "categoryId": "uuid-outra-categoria"
}
```

**Response (200):**
```json
{
  "id": "uuid-transacao",
  "description": "Supermercado Extra",
  "amount": 250.00,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "date": "2024-03-15T00:00:00.000Z",
  "status": "PENDING",
  ...
}
```

---

### PATCH /transactions/:id/status
Atualiza status da transação (gatilho para atualização de saldo).

**Request:**
```http
PATCH /transactions/uuid-transacao/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Validação:**
- `status`: "PENDING", "COMPLETED", ou "CANCELLED"

**Response (200):**
```json
{
  "id": "uuid-transacao",
  "description": "Supermercado",
  "amount": 200.00,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "status": "COMPLETED",
  "bankAccount": { "id": "uuid-conta", "name": "Nubank" },
  ...
}
```

**Comportamento de Atualização de Saldo:**

| Método de Pagamento | Atualiza Saldo? | Quando? |
|---------------------|-----------------|---------|
| DEBIT | ✅ Sim | status → COMPLETED |
| TRANSFER | ✅ Sim | status → COMPLETED |
| CASH | ❌ Não | - |
| CREDIT_CARD | ❌ Não | (afeta fatura) |

**Regras:**
- **INCOME + COMPLETED**: adiciona ao saldo da conta
- **EXPENSE + COMPLETED**: subtrai do saldo da conta
- **Reverter (COMPLETED → PENDING)**: reverte a operação no saldo

**Exemplo:**
```
Conta inicial: R$ 1000
DEBIT EXPENSE R$ 200 → status COMPLETED
Conta final: R$ 800

Reverter status → PENDING
Conta final: R$ 1000 (restaurado)
```

---

### DELETE /transactions/:id
Deleta uma transação.

**Request:**
```http
DELETE /transactions/uuid-transacao
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Transaction deleted successfully"
}
```

**Comportamento para Parceladas:**
- Se deletar **parent** (primeira parcela): deleta todas as parcelas
- Se deletar parcela filha: deleta apenas aquela parcela
- Validar com `parentId` se é parent ou child

---

## 📄 Bills

### POST /bills/generate/:creditCardId
Gera fatura do cartão para um mês de referência.

**Request:**
```http
POST /bills/generate/uuid-cartao
Authorization: Bearer <token>
Content-Type: application/json

{
  "referenceMonth": "2024-03"
}
```

**Validação:**
- `referenceMonth`: formato "YYYY-MM" (obrigatório)

**Response (201):**
```json
{
  "id": "uuid-v4",
  "referenceMonth": "2024-03-01T00:00:00.000Z",
  "closingDate": "2024-03-10T00:00:00.000Z",
  "dueDate": "2024-03-17T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 0.00,
  "balance": 1500.00,
  "status": "OPEN",
  "creditCard": {
    "id": "uuid-cartao",
    "name": "Nubank Platinum",
    "lastFourDigits": "1234"
  },
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2024-03-15T10:00:00.000Z"
}
```

**Lógica de Período:**
```
Cartão fecha dia 10, vence dia 17
Fatura de Março 2024:
- Período: 11/Fev/2024 00:00 até 10/Mar/2024 23:59
- Closing Date: 10/Mar/2024
- Due Date: 17/Mar/2024
```

**Comportamento:**
1. Coleta todas as transações CREDIT_CARD no período
2. Exclui transações CANCELLED
3. Calcula `totalAmount` (soma dos amounts)
4. Vincula transações à fatura (define `billId`)
5. Status inicial: OPEN

**Errors:**
- `409 Conflict`: Fatura já existe para este período
- `404 Not Found`: Cartão não encontrado

---

### GET /bills
Lista faturas do usuário.

**Request:**
```http
GET /bills?creditCardId=uuid-cartao&status=OPEN
Authorization: Bearer <token>
```

**Query Parameters:**
- `creditCardId`: UUID (opcional)
- `status`: OPEN | CLOSED | PAID | OVERDUE (opcional)

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "referenceMonth": "2024-03-01T00:00:00.000Z",
    "closingDate": "2024-03-10T00:00:00.000Z",
    "dueDate": "2024-03-17T00:00:00.000Z",
    "totalAmount": 1500.00,
    "paidAmount": 500.00,
    "balance": 1000.00,
    "status": "OPEN",
    "creditCard": {
      "id": "uuid-cartao",
      "name": "Nubank Platinum",
      "lastFourDigits": "1234"
    },
    "createdAt": "2024-03-10T10:00:00.000Z",
    "updatedAt": "2024-03-15T11:00:00.000Z"
  },
  ...
]
```

---

### GET /bills/:id
Retorna detalhes da fatura com transações.

**Request:**
```http
GET /bills/uuid-fatura
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-fatura",
  "referenceMonth": "2024-03-01T00:00:00.000Z",
  "closingDate": "2024-03-10T00:00:00.000Z",
  "dueDate": "2024-03-17T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 0.00,
  "balance": 1500.00,
  "status": "OPEN",
  "creditCard": {
    "id": "uuid-cartao",
    "name": "Nubank Platinum",
    "lastFourDigits": "1234"
  },
  "transactions": [
    {
      "id": "uuid-t1",
      "description": "Notebook (1/6)",
      "amount": 500.00,
      "date": "2024-02-15T00:00:00.000Z",
      "status": "COMPLETED"
    },
    {
      "id": "uuid-t2",
      "description": "Supermercado Online",
      "amount": 300.00,
      "date": "2024-02-20T00:00:00.000Z",
      "status": "COMPLETED"
    },
    ...
  ],
  "createdAt": "2024-03-10T10:00:00.000Z",
  "updatedAt": "2024-03-10T10:00:00.000Z"
}
```

---

### PATCH /bills/:id/pay
Realiza pagamento (total ou parcial) da fatura.

**Request:**
```http
PATCH /bills/uuid-fatura/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00,
  "bankAccountId": "uuid-conta"
}
```

**Validação:**
- `amount`: número > 0 (obrigatório)
- `bankAccountId`: UUID (opcional, para registro)

**Response (200):**
```json
{
  "id": "uuid-fatura",
  "referenceMonth": "2024-03-01T00:00:00.000Z",
  "closingDate": "2024-03-10T00:00:00.000Z",
  "dueDate": "2024-03-17T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 500.00,
  "balance": 1000.00,
  "status": "OPEN",
  "creditCard": { ... },
  "createdAt": "2024-03-10T10:00:00.000Z",
  "updatedAt": "2024-03-15T11:00:00.000Z"
}
```

**Comportamento:**
- Incrementa `paidAmount`
- Calcula `balance = totalAmount - paidAmount`
- Se `paidAmount >= totalAmount`: status → PAID

**Pagamento Parcial:**
```
Total: R$ 1500
Pagamento 1: R$ 500 → paidAmount: R$ 500, status: OPEN
Pagamento 2: R$ 500 → paidAmount: R$ 1000, status: OPEN
Pagamento 3: R$ 500 → paidAmount: R$ 1500, status: PAID
```

---

### PATCH /bills/:id/close
Fecha a fatura (não permite mais transações vinculadas).

**Request:**
```http
PATCH /bills/uuid-fatura/close
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-fatura",
  ...
  "status": "CLOSED",
  "updatedAt": "2024-03-15T11:00:00.000Z"
}
```

**Errors:**
- `409 Conflict`: Fatura já está PAID

**Uso:** Fechar fatura no dia do fechamento para impedir novas transações.

---

## 📊 Reports

### GET /reports/summary
Resumo financeiro geral do usuário.

**Request:**
```http
GET /reports/summary
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalBalance": 1500.00,
  "totalCreditLimit": 8000.00,
  "totalCreditCardDebt": 2500.00,
  "pendingIncome": 0.00,
  "pendingExpenses": 350.00
}
```

**Cálculos:**
- `totalBalance`: soma de todos os saldos de contas bancárias
- `totalCreditLimit`: soma dos limites de todos os cartões
- `totalCreditCardDebt`: soma dos saldos devidos de faturas (OPEN, CLOSED, OVERDUE)
- `pendingIncome`: soma de transações INCOME com status PENDING
- `pendingExpenses`: soma de transações EXPENSE com status PENDING

---

### GET /reports/cash-flow
Fluxo de caixa para um período.

**Request:**
```http
GET /reports/cash-flow?startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: YYYY-MM-DD (opcional)
- `endDate`: YYYY-MM-DD (opcional)

**Response (200):**
```json
{
  "period": {
    "startDate": "2024-03-01",
    "endDate": "2024-03-31"
  },
  "income": 5000.00,
  "expenses": 3200.00,
  "balance": 1800.00,
  "transactionCount": 45
}
```

**Nota:** Considera apenas transações com status COMPLETED.

---

### GET /reports/expenses-by-category
Despesas agrupadas por categoria.

**Request:**
```http
GET /reports/expenses-by-category?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "totalExpenses": 15000.00,
  "categories": [
    {
      "categoryId": "uuid-1",
      "categoryName": "Alimentação",
      "totalAmount": 5000.00,
      "transactionCount": 120,
      "percentage": 33.33
    },
    {
      "categoryId": "uuid-2",
      "categoryName": "Transporte",
      "totalAmount": 3000.00,
      "transactionCount": 80,
      "percentage": 20.00
    },
    {
      "categoryId": null,
      "categoryName": "Sem categoria",
      "totalAmount": 500.00,
      "transactionCount": 10,
      "percentage": 3.33
    },
    ...
  ]
}
```

**Ordenação:** Decrescente por `totalAmount`.

---

### GET /reports/income-vs-expenses
Comparação de receitas vs despesas por mês.

**Request:**
```http
GET /reports/income-vs-expenses?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "totalIncome": 60000.00,
  "totalExpenses": 45000.00,
  "difference": 15000.00,
  "byMonth": [
    {
      "month": "2024-01",
      "income": 5000.00,
      "expenses": 3800.00,
      "balance": 1200.00
    },
    {
      "month": "2024-02",
      "income": 5000.00,
      "expenses": 3600.00,
      "balance": 1400.00
    },
    ...
  ]
}
```

---

### GET /reports/credit-card-usage
Utilização de cartões de crédito.

**Request:**
```http
GET /reports/credit-card-usage
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "cards": [
    {
      "cardId": "uuid-1",
      "cardName": "Nubank Platinum",
      "lastFourDigits": "1234",
      "limit": 5000.00,
      "currentUsage": 1200.00,
      "availableLimit": 3800.00,
      "usagePercentage": 24.00
    },
    {
      "cardId": "uuid-2",
      "cardName": "Itaú Gold",
      "lastFourDigits": "5678",
      "limit": 3000.00,
      "currentUsage": 0.00,
      "availableLimit": 3000.00,
      "usagePercentage": 0.00
    }
  ]
}
```

**Cálculos:**
- `currentUsage`: soma de saldos de faturas OPEN, CLOSED, OVERDUE
- `availableLimit`: limit - currentUsage
- `usagePercentage`: (currentUsage / limit) * 100

---

## ⚙️ Configurações Técnicas

### Money Handling

**Regra de Ouro:** API trabalha em **reais**, banco armazena em **centavos**.

**Conversão:**
```
Input (API):  R$ 10.50
Storage (DB): 1050 cents
Output (API): R$ 10.50
```

**Por quê?**
- Evita erros de ponto flutuante
- Precisão em operações matemáticas
- Padrão da indústria para valores monetários

**Implementação:**
```typescript
// Money Value Object
Money.fromReais(10.50).getCents()  // 1050
Money.fromCents(1050).getReais()   // 10.50
```

---

### Transaction Status & Balance Updates

**Estados de Transação:**
- `PENDING`: criada mas não efetivada
- `COMPLETED`: efetivada (afeta saldo)
- `CANCELLED`: cancelada

**Fluxo de Atualização de Saldo:**

```
Transação DEBIT R$ 100 criada → status: PENDING
Saldo da conta: R$ 1000 (não muda)

PATCH /transactions/:id/status { "status": "COMPLETED" }
Saldo da conta: R$ 900 (subtraiu)

PATCH /transactions/:id/status { "status": "PENDING" }
Saldo da conta: R$ 1000 (reverteu)
```

**Tabela de Impactos:**

| Tipo | Método | Status | Impacto no Saldo |
|------|--------|--------|------------------|
| INCOME | DEBIT | COMPLETED | + amount |
| INCOME | TRANSFER | COMPLETED | + amount |
| EXPENSE | DEBIT | COMPLETED | - amount |
| EXPENSE | TRANSFER | COMPLETED | - amount |
| ANY | CASH | ANY | sem impacto |
| ANY | CREDIT_CARD | ANY | sem impacto (vai para fatura) |

---

### Installments Logic

**Criação de Parcelas:**

```http
POST /transactions
{
  "amount": 3000.00,
  "installments": 6,
  "paymentMethod": "CREDIT_CARD",
  "date": "2024-03-15"
}
```

**Resultado:**
```
6 transações criadas:
1. Notebook (1/6) - R$ 500 - 15/Mar/2024
2. Notebook (2/6) - R$ 500 - 15/Abr/2024
3. Notebook (3/6) - R$ 500 - 15/Mai/2024
4. Notebook (4/6) - R$ 500 - 15/Jun/2024
5. Notebook (5/6) - R$ 500 - 15/Jul/2024
6. Notebook (6/6) - R$ 500 - 15/Ago/2024
```

**Estrutura Parent-Child:**
- Primeira transação (`installmentNumber: 1`) é o **parent**
- `parentId` da primeira aponta para ela mesma
- Demais transações têm `parentId` apontando para a primeira

**Deletar Parcelas:**
- Deletar parent → deleta todas as parcelas (cascade)
- Deletar child → deleta apenas aquela parcela

---

### Bill Generation Logic

**Exemplo Prático:**

```
Cartão Nubank:
- closingDay: 10
- dueDay: 17

Gerar fatura de Março 2024:
POST /bills/generate/uuid-cartao { "referenceMonth": "2024-03" }

Período calculado:
- Início: 11/Fev/2024 00:00:00
- Fim: 10/Mar/2024 23:59:59
- Closing: 10/Mar/2024
- Due: 17/Mar/2024

Transações coletadas:
- Todas CREDIT_CARD entre 11/Fev e 10/Mar
- Status != CANCELLED
```

**Edge Cases:**
- Closing day 31 em Fevereiro → ajusta para último dia (28 ou 29)
- Transições de ano tratadas corretamente

---

### Authorization & Security

**JWT Token:**
- Obtido via `/auth/login` ou `/auth/register`
- Validade: 7 dias (configurável via `JWT_EXPIRES_IN`)
- Payload: `{ sub: userId, email: userEmail }`

**Header de Autenticação:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Isolamento de Dados:**
- Todas as queries filtram por `userId` automaticamente
- Usuários não podem acessar dados de outros usuários
- Tentativas retornam `403 Forbidden` ou `404 Not Found`

**Endpoints Públicos:**
- `POST /auth/register`
- `POST /auth/login`

**Todos os demais endpoints requerem autenticação.**

---

## 🚀 Getting Started

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/simple_finance?schema=public"
JWT_SECRET="seu-secret-seguro-aqui"
JWT_EXPIRES_IN="7d"
```

### 3. Setup do Banco de Dados
```bash
# Executar migrations
npx prisma migrate deploy

# (Opcional) Visualizar banco
npx prisma studio
```

### 4. Iniciar Servidor
```bash
# Desenvolvimento (porta 3000)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### 5. Testar API
```bash
# Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'

# Login (guarde o access_token)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'

# Usar token
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧪 Workflow de Teste Completo

**Fluxo End-to-End:**

```bash
# 1. Register user
POST /auth/register

# 2. Login (get token)
POST /auth/login

# 3. Create categories
POST /categories → Alimentação (EXPENSE)
POST /categories → Transporte (EXPENSE)
POST /categories → Salário (INCOME)

# 4. Create bank account
POST /bank-accounts → Nubank (R$ 1000)

# 5. Create credit card
POST /credit-cards → Nubank Platinum (limite R$ 5000, fecha 10, vence 17)

# 6. Create DEBIT transaction
POST /transactions → Supermercado R$ 100 (DEBIT, status PENDING)
# Saldo ainda: R$ 1000

# 7. Update status to COMPLETED
PATCH /transactions/:id/status → { "status": "COMPLETED" }
# Saldo agora: R$ 900 ✅

# 8. Create installment transaction
POST /transactions → Notebook R$ 3000, 6x (CREDIT_CARD)
# Cria 6 transações de R$ 500

# 9. Generate credit card bill
POST /bills/generate/:cardId → { "referenceMonth": "2024-03" }
# Coleta transações do período

# 10. Pay bill
PATCH /bills/:id/pay → { "amount": 500 }
# Pagamento parcial

PATCH /bills/:id/pay → { "amount": 1000 }
# Status → PAID quando paidAmount >= totalAmount

# 11. Check reports
GET /reports/summary
GET /reports/cash-flow?startDate=2024-03-01&endDate=2024-03-31
GET /reports/expenses-by-category?startDate=2024-01-01&endDate=2024-12-31
GET /reports/credit-card-usage

# Verify: saldo da conta, faturas, relatórios estão corretos ✅
```

---

## ❌ Error Handling

**Status Codes:**

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Sucesso (GET, PATCH) |
| 201 | Created | Recurso criado (POST) |
| 400 | Bad Request | Validação falhou |
| 401 | Unauthorized | Token ausente/inválido |
| 403 | Forbidden | Sem permissão (acesso a dado de outro usuário) |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Duplicação (ex: fatura já existe) |
| 500 | Internal Error | Erro no servidor |

**Formato de Erro:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be longer than 6 characters"
  ],
  "error": "Bad Request"
}
```

**Exemplos Comuns:**

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Cannot edit categories from other users"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Bank account not found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Bill already exists for this period"
}
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev          # Inicia servidor com hot reload
npm run build              # Build para produção
npm run start:prod         # Inicia servidor de produção

# Testes (quando implementados)
npm run test               # Rodar testes unitários
npm run test:e2e           # Rodar testes E2E
npm run test:cov           # Rodar com cobertura

# Database
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Criar nova migration
npx prisma migrate reset   # Resetar banco (CUIDADO!)
npx prisma db push         # Push schema sem migration

# Linting & Formatting
npm run lint               # Verificar problemas
npm run format             # Formatar código
```

---

## 📚 Recursos Adicionais

**Documentação do Projeto:**
- `README.md` - Overview do projeto
- `CLAUDE.md` - Instruções para Claude AI
- `IMPLEMENTATION_SUMMARY.md` - Detalhes técnicos da implementação
- `TESTING_PLAN.md` - Plano de testes (futuro)
- `API_REFERENCE.md` - Este documento

**Stack Técnico:**
- NestJS 11.0 - Framework
- TypeScript 5.7 - Linguagem
- Prisma 7.2 - ORM
- PostgreSQL - Banco de dados
- JWT - Autenticação
- class-validator - Validação

**Links Úteis:**
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

## 📝 Notas Finais

**Estado Atual:** API 100% funcional e pronta para uso ✅

**Próximos Passos:**
1. Implementar testes (ver TESTING_PLAN.md)
2. Adicionar importação CSV/OFX (futuro)
3. Implementar notificações de vencimento
4. Dashboard frontend

**Contribuindo:**
- Seguir padrões NestJS
- Manter Money VO para valores monetários
- Adicionar validações robustas em DTOs
- Documentar novos endpoints neste arquivo

**Suporte:**
- Issues: Reportar em GitHub (quando disponível)
- Documentação: Consultar arquivos .md no projeto

---

**Desenvolvido com ❤️ usando NestJS + Prisma**

**Última atualização:** 2026-01-17
**Versão da API:** 1.0.0
