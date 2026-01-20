# Transactions Module

## Visão Geral
Módulo responsável pelo gerenciamento de transações financeiras na API Simple Finance. Implementa CRUD completo com suporte a parcelamentos, transações recorrentes, múltiplos métodos de pagamento, e atualização automática de saldo de contas bancárias.

## Arquitetura

```
transactions/
├── dto/                              # Data Transfer Objects
│   ├── create-transaction.dto.ts    # Validação de criação
│   ├── update-transaction.dto.ts    # Validação de atualização
│   ├── update-status.dto.ts         # Validação de status
│   └── transaction-filters.dto.ts   # Filtros de busca
├── transactions.controller.ts       # Endpoints HTTP
├── transactions.service.ts          # Lógica de negócio
└── transactions.module.ts           # Configuração do módulo
```

## Modelo de Dados

### Transaction (Prisma Schema)
```prisma
model Transaction {
  id               String            @id @default(uuid())
  description      String
  amountCents      Int               // Sempre positivo, tipo define se é receita/despesa
  type             TransactionType   // INCOME ou EXPENSE
  paymentMethod    PaymentMethod     // CREDIT_CARD, DEBIT, CASH, TRANSFER
  date             DateTime
  status           TransactionStatus // PENDING, COMPLETED, CANCELLED

  // Installments
  isInstallment    Boolean           @default(false)
  installmentNumber Int?
  totalInstallments Int?
  parentId         String?           // Parent transaction for installments

  // Recurrence
  isRecurring      Boolean           @default(false)
  recurrenceRule   RecurrenceRule?   // DAILY, WEEKLY, MONTHLY, YEARLY
  recurrenceEndDate DateTime?

  // Relationships
  categoryId       String?
  bankAccountId    String?
  creditCardId     String?
  userId           String

  // Soft delete
  deleted          Boolean           @default(false)
  deletedAt        DateTime?

  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  // Relations
  category         Category?
  bankAccount      BankAccount?
  creditCard       CreditCard?
  user             User
  parent           Transaction?      @relation("InstallmentParent")
  children         Transaction[]     @relation("InstallmentParent")
}
```

### Enums

#### TransactionType
```typescript
enum TransactionType {
  INCOME    // Receita (ex: salário, freelance)
  EXPENSE   // Despesa (ex: compras, contas)
}
```

#### PaymentMethod
```typescript
enum PaymentMethod {
  CREDIT_CARD  // Cartão de crédito
  DEBIT        // Débito
  CASH         // Dinheiro
  TRANSFER     // Transferência
}
```

#### TransactionStatus
```typescript
enum TransactionStatus {
  PENDING    // Pendente (não afeta saldo ainda)
  COMPLETED  // Completada (afeta saldo)
  CANCELLED  // Cancelada
}
```

#### RecurrenceRule
```typescript
enum RecurrenceRule {
  DAILY    // Diária
  WEEKLY   // Semanal
  MONTHLY  // Mensal
  YEARLY   // Anual
}
```

---

## Endpoints

### 1. Criar Transação
**Rota**: `POST /transactions`
**Acesso**: Autenticado

#### Transação Simples
```json
{
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "date": "2025-01-17",
  "bankAccountId": "account-uuid",
  "categoryId": "category-uuid"
}
```

#### Transação Parcelada (Cartão de Crédito)
```json
{
  "description": "Notebook Dell",
  "amount": 3000.00,
  "type": "EXPENSE",
  "paymentMethod": "CREDIT_CARD",
  "date": "2025-01-17",
  "creditCardId": "card-uuid",
  "categoryId": "category-uuid",
  "installments": 10
}
```

#### Transação Recorrente
```json
{
  "description": "Salário",
  "amount": 5000.00,
  "type": "INCOME",
  "paymentMethod": "TRANSFER",
  "date": "2025-01-05",
  "bankAccountId": "account-uuid",
  "categoryId": "salary-category-uuid",
  "isRecurring": true,
  "recurrenceRule": "MONTHLY",
  "recurrenceEndDate": "2025-12-31"
}
```

**Validações**:
- `description`: Mínimo de 2 caracteres
- `amount`: Número maior que 0 (sempre positivo, tipo define receita/despesa)
- `type`: INCOME ou EXPENSE
- `paymentMethod`: CREDIT_CARD, DEBIT, CASH, TRANSFER
- `date`: Data no formato ISO (YYYY-MM-DD)
- `installments`: 1-100 (apenas para CREDIT_CARD)
- `bankAccountId`: Obrigatório para DEBIT e TRANSFER
- `creditCardId`: Obrigatório para CREDIT_CARD
- `recurrenceRule`: Obrigatório se isRecurring = true

**Response** (201 Created):

Transação simples:
```json
{
  "id": "uuid",
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "EXPENSE",
  "paymentMethod": "DEBIT",
  "date": "2025-01-17T00:00:00.000Z",
  "status": "COMPLETED",
  "isInstallment": false,
  "isRecurring": false,
  "category": { ... },
  "bankAccount": { ... },
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

Transação parcelada (retorna array com todas as parcelas):
```json
[
  {
    "id": "uuid-1",
    "description": "Notebook Dell (1/10)",
    "amount": 300.00,
    "type": "EXPENSE",
    "paymentMethod": "CREDIT_CARD",
    "date": "2025-01-17T00:00:00.000Z",
    "status": "PENDING",
    "isInstallment": true,
    "installmentNumber": 1,
    "totalInstallments": 10,
    "parentId": null,
    ...
  },
  {
    "id": "uuid-2",
    "description": "Notebook Dell (2/10)",
    "amount": 300.00,
    "date": "2025-02-17T00:00:00.000Z",
    "installmentNumber": 2,
    "parentId": "uuid-1",
    ...
  },
  ...
]
```

**Implementação** (`transactions.service.ts:19`):
- Valida requisitos do método de pagamento
- Transações simples: cria 1 registro
- Transações parceladas: cria N registros (1 por parcela)
- DEBIT/CASH/TRANSFER: status COMPLETED (afeta saldo imediatamente)
- CREDIT_CARD: status PENDING (aguarda fatura)
- Atualiza saldo da conta se método for DEBIT/TRANSFER/CASH

---

### 2. Listar Transações
**Rota**: `GET /transactions`
**Acesso**: Autenticado

**Query Parameters** (todos opcionais):
- `type`: TransactionType (INCOME, EXPENSE)
- `paymentMethod`: PaymentMethod
- `status`: TransactionStatus
- `categoryId`: UUID da categoria
- `bankAccountId`: UUID da conta bancária
- `creditCardId`: UUID do cartão
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

**Exemplos**:
```bash
# Todas as transações
GET /transactions

# Apenas despesas
GET /transactions?type=EXPENSE

# Transações de cartão de crédito específico
GET /transactions?creditCardId=<uuid>

# Transações em um período
GET /transactions?startDate=2025-01-01&endDate=2025-01-31

# Transações pendentes de uma categoria
GET /transactions?status=PENDING&categoryId=<uuid>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "description": "Compra no supermercado",
    "amount": 150.50,
    "type": "EXPENSE",
    "paymentMethod": "DEBIT",
    "date": "2025-01-17T00:00:00.000Z",
    "status": "COMPLETED",
    "isInstallment": false,
    "category": { ... },
    "bankAccount": { ... },
    ...
  },
  ...
]
```

**Implementação** (`transactions.service.ts`):
- Aplica todos os filtros fornecidos
- Inclui relações (category, bankAccount, creditCard)
- Ordenado por data (mais recente primeiro)
- Ignora transações deletadas
- Filtrado por usuário autenticado

---

### 3. Obter Transação Específica
**Rota**: `GET /transactions/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "description": "Notebook Dell (1/10)",
  "amount": 300.00,
  "type": "EXPENSE",
  "paymentMethod": "CREDIT_CARD",
  "date": "2025-01-17T00:00:00.000Z",
  "status": "PENDING",
  "isInstallment": true,
  "installmentNumber": 1,
  "totalInstallments": 10,
  "parentId": null,
  "category": { ... },
  "creditCard": { ... },
  "children": [
    { "id": "uuid-2", "installmentNumber": 2, ... },
    { "id": "uuid-3", "installmentNumber": 3, ... },
    ...
  ],
  ...
}
```

**Erros**:
- `404 Not Found`: Transação não encontrada ou pertence a outro usuário

---

### 4. Atualizar Transação
**Rota**: `PATCH /transactions/:id`
**Acesso**: Autenticado

**Request Body** (todos os campos opcionais):
```json
{
  "description": "Compra no mercado (atualizado)",
  "amount": 200.00,
  "categoryId": "new-category-uuid",
  "date": "2025-01-18"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "description": "Compra no mercado (atualizado)",
  "amount": 200.00,
  ...
}
```

**Erros**:
- `404 Not Found`: Transação não encontrada ou deletada
- `403 Forbidden`: Tentativa de editar transação de outro usuário

**Importante**:
- Não permite alterar `type`, `paymentMethod`, `status`
- Use endpoint `/transactions/:id/status` para alterar status
- Atualizar parcela individual não afeta outras parcelas

---

### 5. Atualizar Status
**Rota**: `PATCH /transactions/:id/status`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "status": "COMPLETED"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "description": "Compra no supermercado",
  "status": "COMPLETED",
  ...
}
```

**Comportamentos**:
- `PENDING → COMPLETED`:
  - Se vinculada a conta bancária, atualiza saldo
  - INCOME: adiciona ao saldo
  - EXPENSE: subtrai do saldo
- `COMPLETED → CANCELLED`:
  - Reverte alteração de saldo (se aplicável)
- `PENDING → CANCELLED`:
  - Apenas marca como cancelada

**Implementação**:
- Atualiza saldo automaticamente baseado no tipo e status
- Valida transição de status válida

---

### 6. Deletar Transação (Soft Delete)
**Rota**: `DELETE /transactions/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "message": "Transaction deleted successfully"
}
```

**Comportamento**:
- **Transação simples**: Marca apenas ela como deletada
- **Transação parcelada**: Marca todas as parcelas como deletadas (cascata)
- **Transação com saldo afetado**: Reverte o saldo antes de deletar

**Erros**:
- `404 Not Found`: Transação não encontrada ou já deletada
- `403 Forbidden`: Tentativa de deletar transação de outro usuário

---

## Conceitos Avançados

### 1. Parcelamentos (Installments)

**Como Funciona**:
- Apenas para método `CREDIT_CARD`
- Divide valor total em N parcelas iguais
- Cria N registros de transação (1 por parcela)
- Primeira parcela é "parent", demais referenciam via `parentId`
- Data de cada parcela: incrementa 1 mês

**Exemplo**:
```json
{
  "amount": 1000.00,
  "installments": 5,
  "date": "2025-01-17"
}
```

Gera:
```
Parcela 1: R$ 200,00 em 2025-01-17 (parent)
Parcela 2: R$ 200,00 em 2025-02-17 (parentId = parcela 1)
Parcela 3: R$ 200,00 em 2025-03-17 (parentId = parcela 1)
Parcela 4: R$ 200,00 em 2025-04-17 (parentId = parcela 1)
Parcela 5: R$ 200,00 em 2025-05-17 (parentId = parcela 1)
```

**Soft Delete em Parcelas**:
- Deletar parent: deleta todas as parcelas
- Deletar child: deleta apenas aquela parcela

---

### 2. Transações Recorrentes

**Como Funciona**:
- Define regra de recorrência (DAILY, WEEKLY, MONTHLY, YEARLY)
- Opcionalmente define data de término
- **Nota**: Implementação atual marca como recorrente, mas não cria automaticamente as próximas ocorrências
- Útil para identificar transações que se repetem

**Uso Futuro**:
- Criar job/cron para gerar próximas ocorrências
- Permitir editar/cancelar série inteira
- Relatórios de gastos recorrentes

---

### 3. Atualização Automática de Saldo

**Quando Ocorre**:
- Transação criada com status COMPLETED
- Status alterado de PENDING → COMPLETED
- Status alterado de COMPLETED → CANCELLED
- Transação deletada com status COMPLETED

**Cálculo**:
```typescript
// INCOME + COMPLETED
bankAccount.balance += transaction.amount

// EXPENSE + COMPLETED
bankAccount.balance -= transaction.amount

// CANCELLED (reverte)
// Faz operação inversa
```

**Importante**:
- Apenas transações vinculadas a `bankAccountId` afetam saldo
- Transações de cartão (CREDIT_CARD) NÃO afetam saldo diretamente
- CASH também não afeta (não tem conta vinculada)

---

### 4. Validação de Métodos de Pagamento

**Regras**:
```typescript
// CREDIT_CARD: requer creditCardId
if (paymentMethod === CREDIT_CARD && !creditCardId) {
  throw Error("creditCardId is required for credit card transactions")
}

// DEBIT/TRANSFER: requer bankAccountId
if ([DEBIT, TRANSFER].includes(paymentMethod) && !bankAccountId) {
  throw Error("bankAccountId is required")
}

// CASH: não requer nenhum vínculo
if (paymentMethod === CASH) {
  // ok
}
```

---

## Integração com Outros Módulos

### Bank Accounts Module
- Transações DEBIT/TRANSFER/CASH podem vincular `bankAccountId`
- Status COMPLETED atualiza saldo automaticamente
- Soft delete de conta cascateia para transações

### Credit Cards Module
- Transações CREDIT_CARD requerem `creditCardId`
- Parcelamentos apenas para cartão de crédito
- Status PENDING até fatura ser processada
- Soft delete de cartão cascateia para transações

### Categories Module
- Transações podem vincular `categoryId`
- Útil para relatórios por categoria
- Categoria pode ser nula (opcional)

### Bills Module
- Faturas agregam transações de cartão no período
- Usa date, creditCardId, status para filtrar
- Pagar fatura pode mudar status para COMPLETED

---

## Casos de Uso

### 1. Compra no Débito
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Supermercado",
    "amount": 150.00,
    "type": "EXPENSE",
    "paymentMethod": "DEBIT",
    "date": "2025-01-17",
    "bankAccountId": "<account-uuid>",
    "categoryId": "<category-uuid>"
  }'
```

### 2. Compra Parcelada no Cartão
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Notebook",
    "amount": 3000.00,
    "type": "EXPENSE",
    "paymentMethod": "CREDIT_CARD",
    "date": "2025-01-17",
    "creditCardId": "<card-uuid>",
    "categoryId": "<category-uuid>",
    "installments": 10
  }'
```

### 3. Recebimento de Salário Recorrente
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Salário",
    "amount": 5000.00,
    "type": "INCOME",
    "paymentMethod": "TRANSFER",
    "date": "2025-01-05",
    "bankAccountId": "<account-uuid>",
    "isRecurring": true,
    "recurrenceRule": "MONTHLY"
  }'
```

### 4. Filtrar Despesas do Mês
```bash
curl -X GET "http://localhost:3000/transactions?type=EXPENSE&startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer <token>"
```

### 5. Completar Transação Pendente
```bash
curl -X PATCH http://localhost:3000/transactions/<id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED" }'
```

---

## Testes Recomendados

### Criação
- ✅ Criar transação simples (DEBIT, CASH, TRANSFER, CREDIT_CARD)
- ✅ Criar transação parcelada (apenas CREDIT_CARD)
- ✅ Criar transação recorrente
- ✅ Validar parcelamento não permitido para DEBIT/CASH/TRANSFER
- ✅ Validar bankAccountId obrigatório para DEBIT/TRANSFER
- ✅ Validar creditCardId obrigatório para CREDIT_CARD
- ✅ Verificar status inicial (COMPLETED para DEBIT/CASH/TRANSFER, PENDING para CREDIT_CARD)
- ✅ Verificar atualização de saldo para transações COMPLETED

### Parcelamentos
- ✅ Criar 10 parcelas e verificar N registros
- ✅ Verificar datas incrementadas mensalmente
- ✅ Verificar parentId nas parcelas filhas
- ✅ Verificar descrição com "(X/N)"
- ✅ Deletar parent e verificar cascata

### Listagem e Filtros
- ✅ Filtrar por tipo (INCOME/EXPENSE)
- ✅ Filtrar por método de pagamento
- ✅ Filtrar por status
- ✅ Filtrar por categoria
- ✅ Filtrar por conta/cartão
- ✅ Filtrar por período de datas
- ✅ Verificar isolamento entre usuários

### Atualização de Status
- ✅ PENDING → COMPLETED (verificar saldo atualizado)
- ✅ COMPLETED → CANCELLED (verificar saldo revertido)
- ✅ PENDING → CANCELLED

### Soft Delete
- ✅ Deletar transação simples
- ✅ Deletar parcela parent (verificar cascata)
- ✅ Verificar reversão de saldo ao deletar COMPLETED

---

## Dependências

### Módulos Importados
- `PrismaModule`: Acesso ao banco de dados

### Value Objects
- `Money`: Conversões reais ↔ centavos

### Enums
- `TransactionType`, `PaymentMethod`, `TransactionStatus`, `RecurrenceRule`

---

## Notas Importantes

1. **Valores Sempre Positivos**: Amount é sempre positivo, `type` define receita/despesa
2. **Status vs Saldo**: Apenas COMPLETED afeta saldo de contas
3. **Parcelamentos**: Apenas cartão de crédito
4. **Recorrências**: Marcadas mas não auto-criadas (implementar job futuro)
5. **Soft Delete**: Cascateia para parcelas filhas
6. **Validação de Métodos**: Cada método tem requisitos específicos

---

## Melhorias Futuras

- [ ] Job/cron para criar próximas ocorrências de transações recorrentes
- [ ] Edição em lote de parcelas
- [ ] Cancelamento de série recorrente
- [ ] Anexos/comprovantes de transação
- [ ] Tags adicionais além de categorias
- [ ] Notas/observações em transações
- [ ] Split de transações (múltiplas categorias)
- [ ] Transações transferência entre contas próprias
- [ ] Geolocalização de transações
- [ ] Importação de extratos bancários (CSV/OFX)
