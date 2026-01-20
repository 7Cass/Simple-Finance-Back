# Bank Accounts Module

## Visão Geral
Módulo responsável pelo gerenciamento de contas bancárias (corrente e poupança) na API Simple Finance. Implementa CRUD completo com soft delete, controle de saldo e integração com transações.

## Arquitetura

```
bank-accounts/
├── dto/                           # Data Transfer Objects
│   ├── create-bank-account.dto.ts # Validação de criação
│   ├── update-bank-account.dto.ts # Validação de atualização
│   └── update-balance.dto.ts      # Validação de saldo
├── bank-accounts.controller.ts    # Endpoints HTTP
├── bank-accounts.service.ts       # Lógica de negócio
└── bank-accounts.module.ts        # Configuração do módulo
```

## Modelo de Dados

### BankAccount (Prisma Schema)
```prisma
model BankAccount {
  id           String      @id @default(uuid())
  name         String
  type         AccountType // CHECKING ou SAVINGS
  balanceCents Int         // Armazenado em centavos
  userId       String
  deleted      Boolean     @default(false)
  deletedAt    DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
}
```

### AccountType Enum
```typescript
enum AccountType {
  CHECKING  // Conta corrente
  SAVINGS   // Poupança
}
```

---

## Endpoints

### 1. Criar Conta Bancária
**Rota**: `POST /bank-accounts`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "name": "Conta Bradesco",
  "type": "CHECKING",
  "initialBalance": 1500.50
}
```

**Validações**:
- `name`: Mínimo de 2 caracteres
- `type`: Deve ser `CHECKING` ou `SAVINGS`
- `initialBalance`: Opcional, número em reais (padrão: 0)

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Conta Bradesco",
  "type": "CHECKING",
  "balance": 1500.50,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Implementação** (`bank-accounts.service.ts:17`):
- Converte valor de reais para centavos usando `Money` value object
- Vincula conta ao usuário autenticado
- Retorna saldo em reais na resposta

---

### 2. Listar Contas Bancárias
**Rota**: `GET /bank-accounts`
**Acesso**: Autenticado

**Query Parameters**:
- `includeDeleted` (boolean, opcional): Inclui contas deletadas

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Conta Bradesco",
    "type": "CHECKING",
    "balance": 1500.50,
    "userId": "user-uuid",
    "createdAt": "2025-01-17T10:00:00.000Z",
    "updatedAt": "2025-01-17T10:00:00.000Z"
  },
  {
    "id": "uuid",
    "name": "Poupança Itaú",
    "type": "SAVINGS",
    "balance": 5000.00,
    "userId": "user-uuid",
    "createdAt": "2025-01-16T09:00:00.000Z",
    "updatedAt": "2025-01-16T09:00:00.000Z"
  }
]
```

**Implementação** (`bank-accounts.service.ts:32`):
- Por padrão, retorna apenas contas não deletadas
- Com `includeDeleted=true`, retorna todas (incluindo deletadas)
- Ordenado por data de criação (mais recente primeiro)
- Filtrado por usuário autenticado

---

### 3. Obter Conta Específica
**Rota**: `GET /bank-accounts/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Conta Bradesco",
  "type": "CHECKING",
  "balance": 1500.50,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Conta não encontrada ou pertence a outro usuário

**Implementação** (`bank-accounts.service.ts:44`):
- Busca conta por ID e userId
- Ignora contas deletadas (deleted: false)
- Verifica ownership automaticamente

---

### 4. Atualizar Conta
**Rota**: `PATCH /bank-accounts/:id`
**Acesso**: Autenticado

**Request Body** (todos os campos são opcionais):
```json
{
  "name": "Conta Bradesco Universitária",
  "type": "SAVINGS"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Conta Bradesco Universitária",
  "type": "SAVINGS",
  "balance": 1500.50,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Conta não encontrada ou deletada
- `403 Forbidden`: Tentativa de editar conta de outro usuário

**Implementação** (`bank-accounts.service.ts:56`):
- Permite atualizar apenas `name` e `type`
- Saldo é atualizado via endpoint dedicado
- Valida ownership antes de atualizar
- Conta deletada não pode ser editada

**Importante**: Esta rota NÃO atualiza o saldo. Use `/bank-accounts/:id/balance` para isso.

---

### 5. Atualizar Saldo
**Rota**: `PATCH /bank-accounts/:id/balance`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "balance": 2000.00
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Conta Bradesco",
  "type": "CHECKING",
  "balance": 2000.00,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Conta não encontrada ou deletada
- `403 Forbidden`: Tentativa de editar conta de outro usuário

**Implementação** (`bank-accounts.service.ts:84`):
- Atualiza saldo manualmente
- Converte reais para centavos
- Útil para ajustes manuais ou correções

**Observação**: O saldo também é atualizado automaticamente quando transações mudam de status (PENDING → COMPLETED).

---

### 6. Deletar Conta (Soft Delete)
**Rota**: `DELETE /bank-accounts/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "message": "Bank account deleted successfully"
}
```

**Erros**:
- `404 Not Found`: Conta não encontrada ou já deletada
- `403 Forbidden`: Tentativa de deletar conta de outro usuário

**Implementação** (`bank-accounts.service.ts:111`):
- **Soft delete**: Marca `deleted = true` e seta `deletedAt`
- **NÃO remove permanentemente** do banco de dados
- **Cascata**: Marca todas as transações associadas como deletadas
- Conta deletada não aparece em listagens por padrão

**Importante**:
- Soft delete em cascata afeta transações vinculadas
- Contas deletadas podem ser restauradas
- Dados não são perdidos permanentemente

---

### 7. Restaurar Conta
**Rota**: `PATCH /bank-accounts/:id/restore`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Conta Bradesco",
  "type": "CHECKING",
  "balance": 1500.50,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Conta não encontrada
- `403 Forbidden`: Tentativa de restaurar conta de outro usuário
- `409 Conflict`: Conta não está deletada

**Implementação** (`bank-accounts.service.ts:149`):
- Marca `deleted = false` e limpa `deletedAt`
- **Restaura automaticamente** transações associadas
- Retorna conta formatada

---

## Conversão de Valores Monetários

### Money Value Object
O módulo usa o value object `Money` (`src/shared/value-objects/money.vo.ts`) para conversões precisas.

**Conversão Reais → Centavos**:
```typescript
// R$ 10,50 → 1050 centavos
const balanceCents = Money.fromReais(10.50).getCents();
// balanceCents = 1050
```

**Conversão Centavos → Reais**:
```typescript
// 1050 centavos → R$ 10,50
const balance = Money.fromCents(1050).getReais();
// balance = 10.50
```

### Armazenamento
- **Banco de dados**: Armazena em centavos (campo `balanceCents`)
- **API**: Aceita e retorna em reais (campos `balance` e `initialBalance`)
- **Precisão**: Evita problemas de ponto flutuante

### Exemplo no Service
```typescript
// Entrada da API: 100.50 (reais)
const balanceCents = Money.fromReais(dto.balance).getCents();
// Armazena no banco: 10050 (centavos)

// Leitura do banco: 10050 (centavos)
balance: Money.fromCents(account.balanceCents).getReais()
// Retorna na API: 100.50 (reais)
```

---

## Soft Delete

### O que é Soft Delete?
Em vez de deletar permanentemente registros, marca-os como deletados:
- Define `deleted = true`
- Preenche `deletedAt` com timestamp
- Mantém dados no banco para auditoria/restauração

### Implementação
```typescript
// Deletar conta
await this.prisma.bankAccount.update({
  where: { id },
  data: {
    deleted: true,
    deletedAt: new Date(),
  },
});

// Deletar transações associadas (cascata)
await this.prisma.transaction.updateMany({
  where: { bankAccountId: id },
  data: {
    deleted: true,
    deletedAt: new Date(),
  },
});
```

### Filtros em Queries
```typescript
// Listar apenas contas ativas
where: { userId, deleted: false }

// Listar todas (incluindo deletadas)
where: { userId, deleted: includeDeleted ? undefined : false }
```

### Restauração
```typescript
// Restaurar conta
await this.prisma.bankAccount.update({
  where: { id },
  data: {
    deleted: false,
    deletedAt: null,
  },
});

// Restaurar transações (cascata)
await this.prisma.transaction.updateMany({
  where: { bankAccountId: id },
  data: {
    deleted: false,
    deletedAt: null,
  },
});
```

---

## Validações e Segurança

### Ownership Validation
Todas as operações verificam se a conta pertence ao usuário autenticado:
```typescript
if (account.userId !== userId) {
  throw new ForbiddenException('Cannot edit bank accounts from other users');
}
```

### State Validation
- Contas deletadas não podem ser editadas/atualizadas
- Apenas contas deletadas podem ser restauradas
- Validações em cada operação

### Input Validation
- DTOs com class-validator
- Nome mínimo de 2 caracteres
- Tipo deve ser enum válido
- Saldo deve ser número

---

## Integração com Outros Módulos

### Transactions Module
- Transações podem ser vinculadas a contas via `bankAccountId`
- Métodos de pagamento `DEBIT` e `TRANSFER` requerem conta bancária
- Saldo é atualizado quando transação é marcada como `COMPLETED`
- Soft delete de conta cascateia para transações

### Reports Module
- **Summary**: Calcula saldo total de todas as contas ativas
- **Cash Flow**: Usa transações vinculadas a contas
- Contas deletadas são ignoradas nos relatórios

---

## Casos de Uso

### 1. Criar Conta Inicial
```bash
curl -X POST http://localhost:3000/bank-accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Corrente Principal",
    "type": "CHECKING",
    "initialBalance": 5000.00
  }'
```

### 2. Listar Todas as Contas
```bash
curl -X GET http://localhost:3000/bank-accounts \
  -H "Authorization: Bearer <token>"
```

### 3. Atualizar Saldo Manualmente
```bash
curl -X PATCH http://localhost:3000/bank-accounts/<id>/balance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "balance": 6000.00 }'
```

### 4. Soft Delete de Conta
```bash
curl -X DELETE http://localhost:3000/bank-accounts/<id> \
  -H "Authorization: Bearer <token>"
```

### 5. Restaurar Conta Deletada
```bash
curl -X PATCH http://localhost:3000/bank-accounts/<id>/restore \
  -H "Authorization: Bearer <token>"
```

### 6. Listar Incluindo Deletadas
```bash
curl -X GET "http://localhost:3000/bank-accounts?includeDeleted=true" \
  -H "Authorization: Bearer <token>"
```

---

## Testes Recomendados

### Criação
- ✅ Criar conta com saldo inicial
- ✅ Criar conta sem saldo (padrão 0)
- ✅ Criar conta CHECKING
- ✅ Criar conta SAVINGS
- ✅ Validar nome mínimo (2 caracteres)
- ✅ Validar tipo inválido

### Listagem
- ✅ Listar contas do usuário autenticado
- ✅ Listar apenas contas ativas (padrão)
- ✅ Listar incluindo deletadas
- ✅ Verificar isolamento entre usuários

### Atualização
- ✅ Atualizar nome
- ✅ Atualizar tipo
- ✅ Atualizar saldo
- ✅ Impedir edição de conta deletada
- ✅ Impedir edição de conta de outro usuário

### Soft Delete
- ✅ Deletar conta
- ✅ Verificar cascata para transações
- ✅ Conta deletada não aparece em listagem padrão
- ✅ Impedir deletar conta de outro usuário
- ✅ Impedir deletar conta já deletada

### Restauração
- ✅ Restaurar conta deletada
- ✅ Verificar cascata de restauração de transações
- ✅ Impedir restaurar conta não deletada
- ✅ Impedir restaurar conta de outro usuário

---

## Variáveis de Ambiente

Este módulo não requer variáveis de ambiente específicas. Usa as configurações globais do Prisma.

---

## Dependências

### Módulos Importados
- `PrismaModule`: Acesso ao banco de dados

### Value Objects
- `Money`: Conversões reais ↔ centavos

### Enums
- `AccountType`: CHECKING, SAVINGS

---

## Notas Importantes

1. **Valores em Centavos**: Sempre armazene em centavos no banco, converta na API
2. **Soft Delete**: Nunca delete permanentemente, use soft delete
3. **Cascata**: Deletar conta afeta transações automaticamente
4. **Ownership**: Usuário só acessa suas próprias contas
5. **Saldo Manual**: Use `/balance` para ajustes manuais
6. **Saldo Automático**: Transações atualizam saldo automaticamente

---

## Melhorias Futuras

- [ ] Adicionar campo `institution` (banco/instituição financeira)
- [ ] Suporte a múltiplas moedas
- [ ] Histórico de alterações de saldo
- [ ] Limite de saldo negativo configurável
- [ ] Validação de IBAN/número de conta
- [ ] Sincronização com APIs bancárias (Open Banking)
- [ ] Relatório de extrato da conta
- [ ] Arquivamento de contas (diferente de soft delete)
