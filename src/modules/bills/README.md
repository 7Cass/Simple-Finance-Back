# Bills Module

## Visão Geral
Módulo responsável pelo gerenciamento de faturas de cartões de crédito. Gera faturas baseadas no período de fechamento, agrega transações, e controla pagamentos.

## Arquitetura

```
bills/
├── dto/
│   ├── generate-bill.dto.ts  # Validação de geração
│   └── pay-bill.dto.ts        # Validação de pagamento
├── bills.controller.ts        # Endpoints HTTP
├── bills.service.ts           # Lógica de negócio
└── bills.module.ts            # Configuração do módulo
```

## Modelo de Dados

```prisma
model CreditCardBill {
  id             String     @id @default(uuid())
  referenceMonth DateTime   // Mês de referência (YYYY-MM-01)
  closingDate    DateTime   // Data de fechamento
  dueDate        DateTime   // Data de vencimento

  totalAmountCents Int      // Valor total em centavos
  paidAmountCents  Int      @default(0)  // Valor pago

  status         BillStatus // OPEN, CLOSED, PAID, OVERDUE

  creditCardId   String
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  creditCard     CreditCard @relation(fields: [creditCardId], references: [id], onDelete: Cascade)

  @@unique([creditCardId, referenceMonth])
}
```

### BillStatus Enum
```typescript
enum BillStatus {
  OPEN     // Fatura aberta (ainda pode receber transações)
  CLOSED   // Fatura fechada (não recebe mais transações)
  PAID     // Fatura paga
  OVERDUE  // Fatura vencida
}
```

---

## Endpoints

### 1. Gerar Fatura
**Rota**: `POST /bills/generate/:creditCardId`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "referenceMonth": "2025-01"
}
```

**Processo de Geração**:
1. Valida cartão pertence ao usuário
2. Calcula datas do período:
   - `closingDate`: dia de fechamento do mês de referência
   - `previousClosingDate`: dia de fechamento do mês anterior
   - `dueDate`: dia de vencimento do mês de referência
3. Busca transações entre `previousClosingDate + 1 dia` e `closingDate`
4. Soma valores de transações não canceladas
5. Cria fatura com status `OPEN`

**Exemplo de Cálculo de Período**:
```
Cartão: closingDay = 10, dueDay = 17
referenceMonth: "2025-02"

closingDate: 2025-02-10
previousClosingDate: 2025-01-10
dueDate: 2025-02-17

Período de transações:
  De: 2025-01-11 00:00:00
  Até: 2025-02-10 23:59:59
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "referenceMonth": "2025-02-01T00:00:00.000Z",
  "closingDate": "2025-02-10T00:00:00.000Z",
  "dueDate": "2025-02-17T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 0.00,
  "balance": 1500.00,
  "status": "OPEN",
  "creditCardId": "card-uuid",
  "transactionsCount": 15,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Cartão não encontrado
- `409 Conflict`: Fatura já existe para esse mês

---

### 2. Listar Faturas
**Rota**: `GET /bills`
**Acesso**: Autenticado

**Query Parameters**:
- `creditCardId` (opcional): Filtrar por cartão
- `status` (opcional): Filtrar por status

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "referenceMonth": "2025-02-01T00:00:00.000Z",
    "closingDate": "2025-02-10T00:00:00.000Z",
    "dueDate": "2025-02-17T00:00:00.000Z",
    "totalAmount": 1500.00,
    "paidAmount": 0.00,
    "balance": 1500.00,
    "status": "OPEN",
    "creditCard": { ... },
    "transactionsCount": 15
  },
  ...
]
```

---

### 3. Obter Fatura com Transações
**Rota**: `GET /bills/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "referenceMonth": "2025-02-01T00:00:00.000Z",
  "closingDate": "2025-02-10T00:00:00.000Z",
  "dueDate": "2025-02-17T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 0.00,
  "balance": 1500.00,
  "status": "OPEN",
  "creditCard": {
    "id": "card-uuid",
    "name": "Nubank",
    "lastFourDigits": "1234"
  },
  "transactions": [
    {
      "id": "txn-uuid",
      "description": "Compra no mercado",
      "amount": 150.00,
      "date": "2025-01-15T00:00:00.000Z",
      "category": { ... }
    },
    ...
  ]
}
```

---

### 4. Pagar Fatura
**Rota**: `PATCH /bills/:id/pay`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "amount": 1500.00,
  "bankAccountId": "account-uuid"
}
```

**Comportamento**:
- Soma `amount` ao `paidAmount`
- Se `paidAmount >= totalAmount`: status → PAID
- Deduz valor da conta bancária especificada
- Cria transação de pagamento vinculada à conta

**Response** (200 OK):
```json
{
  "id": "uuid",
  "referenceMonth": "2025-02-01T00:00:00.000Z",
  "totalAmount": 1500.00,
  "paidAmount": 1500.00,
  "balance": 0.00,
  "status": "PAID",
  ...
}
```

**Erros**:
- `404 Not Found`: Fatura não encontrada
- `403 Forbidden`: Fatura/conta de outro usuário
- `400 Bad Request`: Valor <= 0

---

### 5. Fechar Fatura
**Rota**: `PATCH /bills/:id/close`
**Acesso**: Autenticado

**Comportamento**:
- Muda status de `OPEN` → `CLOSED`
- Fatura fechada não recebe mais transações
- Valores ficam fixos

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "CLOSED",
  ...
}
```

---

## Conceitos Importantes

### Ciclo de Vida da Fatura
```
1. OPEN
   ↓ (gerar fatura)
   Fatura criada, pode receber transações

2. CLOSED
   ↓ (fechar fatura)
   Não recebe mais transações, valores fixos

3. PAID
   ↓ (pagar fatura integralmente)
   Fatura quitada

4. OVERDUE
   ↓ (data de vencimento passou)
   Fatura em atraso (requer job/cron)
```

### Período de Fatura
- **Período de transações**: Do dia após o fechamento anterior até o dia do fechamento atual
- **Prazo de pagamento**: Do fechamento até o vencimento
- Transações fora do período vão para outra fatura

### Pagamento Parcial
- Permite pagar valores menores que o total
- `balance = totalAmount - paidAmount`
- Status muda para PAID apenas quando `paidAmount >= totalAmount`

---

## Integração com Outros Módulos

### Credit Cards Module
- Usa `closingDay` e `dueDay` do cartão
- Cartão deletado = faturas deletadas (cascade)
- Uma fatura por cartão por mês

### Transactions Module
- Agrega transações do período
- Apenas transações não canceladas
- Transações CREDIT_CARD do cartão específico

### Bank Accounts Module
- Pagamento deduz saldo da conta
- Requer `bankAccountId` para pagar

---

## Testes Recomendados

- ✅ Gerar fatura para mês válido
- ✅ Validar cálculo de período correto
- ✅ Validar agregação de transações
- ✅ Impedir duplicação de fatura (mesmo mês)
- ✅ Pagar fatura integralmente
- ✅ Pagar fatura parcialmente
- ✅ Verificar atualização de status ao pagar
- ✅ Fechar fatura
- ✅ Listar com filtros

---

## Melhorias Futuras

- [ ] Job para marcar faturas como OVERDUE automaticamente
- [ ] Histórico de pagamentos
- [ ] Juros e multas por atraso
- [ ] Parcelamento de fatura
- [ ] Agendamento de pagamento
- [ ] Notificações de vencimento próximo
- [ ] PDF da fatura
- [ ] Comparação entre faturas (mês a mês)
