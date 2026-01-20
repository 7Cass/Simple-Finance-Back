# Credit Cards Module

## Visão Geral
Módulo responsável pelo gerenciamento de cartões de crédito na API Simple Finance. Implementa CRUD completo com soft delete, controle de limites, datas de fechamento/vencimento e integração com transações e faturas.

## Arquitetura

```
credit-cards/
├── dto/                           # Data Transfer Objects
│   ├── create-credit-card.dto.ts # Validação de criação
│   └── update-credit-card.dto.ts # Validação de atualização
├── credit-cards.controller.ts    # Endpoints HTTP
├── credit-cards.service.ts       # Lógica de negócio
└── credit-cards.module.ts        # Configuração do módulo
```

## Modelo de Dados

### CreditCard (Prisma Schema)
```prisma
model CreditCard {
  id             String    @id @default(uuid())
  name           String
  lastFourDigits String    // Últimos 4 dígitos (segurança)
  limitCents     Int       // Limite em centavos
  closingDay     Int       // Dia do fechamento da fatura (1-31)
  dueDay         Int       // Dia do vencimento da fatura (1-31)
  userId         String
  deleted        Boolean   @default(false)
  deletedAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions   Transaction[]
  bills          CreditCardBill[]
}
```

---

## Endpoints

### 1. Criar Cartão de Crédito
**Rota**: `POST /credit-cards`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "name": "Nubank",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17
}
```

**Validações**:
- `name`: String obrigatória
- `lastFourDigits`: Exatamente 4 caracteres
- `limit`: Número maior ou igual a 0 (em reais)
- `closingDay`: Inteiro entre 1 e 31
- `dueDay`: Inteiro entre 1 e 31

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Nubank",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Implementação** (`credit-cards.service.ts:16`):
- Converte limite de reais para centavos usando `Money` value object
- Armazena apenas últimos 4 dígitos (segurança PCI DSS)
- Vincula cartão ao usuário autenticado

---

### 2. Listar Cartões de Crédito
**Rota**: `GET /credit-cards`
**Acesso**: Autenticado

**Query Parameters**:
- `includeDeleted` (boolean, opcional): Inclui cartões deletados

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Nubank",
    "lastFourDigits": "1234",
    "limit": 5000.00,
    "closingDay": 10,
    "dueDay": 17,
    "userId": "user-uuid",
    "createdAt": "2025-01-17T10:00:00.000Z",
    "updatedAt": "2025-01-17T10:00:00.000Z"
  },
  {
    "id": "uuid",
    "name": "Bradesco Platinum",
    "lastFourDigits": "5678",
    "limit": 10000.00,
    "closingDay": 5,
    "dueDay": 12,
    "userId": "user-uuid",
    "createdAt": "2025-01-16T09:00:00.000Z",
    "updatedAt": "2025-01-16T09:00:00.000Z"
  }
]
```

**Implementação** (`credit-cards.service.ts:33`):
- Por padrão, retorna apenas cartões não deletados
- Com `includeDeleted=true`, retorna todos
- Ordenado por data de criação (mais recente primeiro)
- Filtrado por usuário autenticado

---

### 3. Obter Cartão Específico
**Rota**: `GET /credit-cards/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Nubank",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Cartão não encontrado ou pertence a outro usuário

**Implementação** (`credit-cards.service.ts:45`):
- Busca cartão por ID e userId
- Ignora cartões deletados
- Verifica ownership automaticamente

---

### 4. Atualizar Cartão
**Rota**: `PATCH /credit-cards/:id`
**Acesso**: Autenticado

**Request Body** (todos os campos são opcionais):
```json
{
  "name": "Nubank Ultravioleta",
  "lastFourDigits": "9999",
  "limit": 15000.00,
  "closingDay": 15,
  "dueDay": 22
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Nubank Ultravioleta",
  "lastFourDigits": "9999",
  "limit": 15000.00,
  "closingDay": 15,
  "dueDay": 22,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Cartão não encontrado ou deletado
- `403 Forbidden`: Tentativa de editar cartão de outro usuário

**Implementação** (`credit-cards.service.ts:57`):
- Permite atualizar todos os campos
- Valida ownership antes de atualizar
- Cartão deletado não pode ser editado
- Converte limite para centavos se fornecido

---

### 5. Deletar Cartão (Soft Delete)
**Rota**: `DELETE /credit-cards/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "message": "Credit card deleted successfully"
}
```

**Erros**:
- `404 Not Found`: Cartão não encontrado ou já deletado
- `403 Forbidden`: Tentativa de deletar cartão de outro usuário

**Implementação** (`credit-cards.service.ts:90`):
- **Soft delete**: Marca `deleted = true` e seta `deletedAt`
- **NÃO remove permanentemente** do banco de dados
- **Cascata**: Marca todas as transações associadas como deletadas
- Cartão deletado não aparece em listagens por padrão

**Importante**:
- Soft delete em cascata afeta transações vinculadas
- Cartões deletados podem ser restaurados
- Dados não são perdidos permanentemente

---

### 6. Restaurar Cartão
**Rota**: `PATCH /credit-cards/:id/restore`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Nubank",
  "lastFourDigits": "1234",
  "limit": 5000.00,
  "closingDay": 10,
  "dueDay": 17,
  "userId": "user-uuid",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z"
}
```

**Erros**:
- `404 Not Found`: Cartão não encontrado
- `403 Forbidden`: Tentativa de restaurar cartão de outro usuário
- `409 Conflict`: Cartão não está deletado

**Implementação** (`credit-cards.service.ts:128`):
- Marca `deleted = false` e limpa `deletedAt`
- **Restaura automaticamente** transações associadas
- Retorna cartão formatado

---

## Conceitos Importantes

### Dia de Fechamento (closingDay)
- Dia do mês em que a fatura fecha
- Compras após essa data vão para a próxima fatura
- Exemplo: `closingDay: 10` → fatura fecha dia 10 de cada mês

### Dia de Vencimento (dueDay)
- Dia do mês em que a fatura vence
- Prazo para pagamento sem juros
- Geralmente 7-15 dias após o fechamento
- Exemplo: `dueDay: 17` → fatura vence dia 17 de cada mês

### Exemplo de Ciclo de Fatura
```
Cartão: Nubank
closingDay: 10
dueDay: 17

Janeiro:
- Dia 1-10: Compras na fatura de JANEIRO
- Dia 11-31: Compras na fatura de FEVEREIRO

Fevereiro:
- Dia 10: Fatura de JANEIRO fecha
- Dia 17: Fatura de JANEIRO vence (prazo para pagar)
```

### Últimos 4 Dígitos (lastFourDigits)
**Segurança PCI DSS**:
- Nunca armazene número completo do cartão
- Armazene apenas os 4 últimos dígitos
- Usado apenas para identificação visual
- Exemplo: "Nubank •••• 1234"

---

## Conversão de Valores Monetários

### Money Value Object
Funciona igual ao módulo de contas bancárias.

**Conversão Reais → Centavos**:
```typescript
const limitCents = Money.fromReais(5000.00).getCents();
// limitCents = 500000
```

**Conversão Centavos → Reais**:
```typescript
limit: Money.fromCents(card.limitCents).getReais()
// 500000 centavos → 5000.00 reais
```

### Armazenamento
- **Banco de dados**: Armazena em centavos (campo `limitCents`)
- **API**: Aceita e retorna em reais (campo `limit`)

---

## Soft Delete

Funciona da mesma forma que no módulo de contas bancárias:
- Marca `deleted = true` e preenche `deletedAt`
- Soft delete cascateia para transações
- Cartões deletados podem ser restaurados
- Use `includeDeleted=true` para listar deletados

---

## Validações e Segurança

### Ownership Validation
```typescript
if (card.userId !== userId) {
  throw new ForbiddenException('Cannot edit credit cards from other users');
}
```

### Input Validation
- Nome obrigatório
- Últimos 4 dígitos devem ter exatamente 4 caracteres
- Limite deve ser >= 0
- Dias de fechamento/vencimento entre 1 e 31
- DTOs com class-validator

### State Validation
- Cartões deletados não podem ser editados
- Apenas cartões deletados podem ser restaurados

---

## Integração com Outros Módulos

### Transactions Module
- Transações podem usar `CREDIT_CARD` como método de pagamento
- Requer `creditCardId` quando `paymentMethod = CREDIT_CARD`
- Soft delete de cartão cascateia para transações
- Transações no período são usadas para gerar faturas

### Bills Module
- Faturas (CreditCardBill) são geradas por cartão
- Usa `closingDay` e `dueDay` para calcular períodos
- Agrega transações entre datas de fechamento
- Faturas mostram uso vs. limite do cartão

### Reports Module
- **Credit Card Usage**: Calcula % de uso do limite
- **Summary**: Calcula limite disponível total
- Ignora cartões deletados nos relatórios

---

## Casos de Uso

### 1. Criar Cartão de Crédito
```bash
curl -X POST http://localhost:3000/credit-cards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nubank",
    "lastFourDigits": "1234",
    "limit": 5000.00,
    "closingDay": 10,
    "dueDay": 17
  }'
```

### 2. Listar Todos os Cartões
```bash
curl -X GET http://localhost:3000/credit-cards \
  -H "Authorization: Bearer <token>"
```

### 3. Atualizar Limite do Cartão
```bash
curl -X PATCH http://localhost:3000/credit-cards/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "limit": 10000.00 }'
```

### 4. Soft Delete de Cartão
```bash
curl -X DELETE http://localhost:3000/credit-cards/<id> \
  -H "Authorization: Bearer <token>"
```

### 5. Restaurar Cartão Deletado
```bash
curl -X PATCH http://localhost:3000/credit-cards/<id>/restore \
  -H "Authorization: Bearer <token>"
```

---

## Testes Recomendados

### Criação
- ✅ Criar cartão com todos os campos válidos
- ✅ Validar lastFourDigits com 4 caracteres exatos
- ✅ Validar limite mínimo (>= 0)
- ✅ Validar closingDay (1-31)
- ✅ Validar dueDay (1-31)
- ✅ Limite deve ser convertido para centavos

### Listagem
- ✅ Listar cartões do usuário autenticado
- ✅ Listar apenas cartões ativos (padrão)
- ✅ Listar incluindo deletados
- ✅ Verificar isolamento entre usuários

### Atualização
- ✅ Atualizar nome
- ✅ Atualizar limite
- ✅ Atualizar datas de fechamento/vencimento
- ✅ Atualizar últimos 4 dígitos
- ✅ Impedir edição de cartão deletado
- ✅ Impedir edição de cartão de outro usuário

### Soft Delete
- ✅ Deletar cartão
- ✅ Verificar cascata para transações
- ✅ Cartão deletado não aparece em listagem padrão
- ✅ Impedir deletar cartão de outro usuário
- ✅ Impedir deletar cartão já deletado

### Restauração
- ✅ Restaurar cartão deletado
- ✅ Verificar cascata de restauração de transações
- ✅ Impedir restaurar cartão não deletado
- ✅ Impedir restaurar cartão de outro usuário

---

## Dependências

### Módulos Importados
- `PrismaModule`: Acesso ao banco de dados

### Value Objects
- `Money`: Conversões reais ↔ centavos

---

## Notas Importantes

1. **Segurança PCI DSS**: Nunca armazene número completo do cartão
2. **Valores em Centavos**: Limite sempre armazenado em centavos
3. **Soft Delete**: Nunca delete permanentemente
4. **Cascata**: Deletar cartão afeta transações e faturas
5. **Ownership**: Usuário só acessa seus próprios cartões
6. **Datas de Fatura**: closingDay e dueDay são essenciais para geração de faturas

---

## Melhorias Futuras

- [ ] Adicionar campo `brand` (Visa, Mastercard, Elo, etc.)
- [ ] Adicionar campo `type` (crédito, débito, múltiplo)
- [ ] Suporte a múltiplas bandeiras no mesmo cartão
- [ ] Validação de datas (dueDay deve ser > closingDay)
- [ ] Alertas de limite próximo ao máximo
- [ ] Histórico de alterações de limite
- [ ] Flag de cartão principal/preferido
- [ ] Integração com APIs de bancos para limites em tempo real
- [ ] Cashback/pontos/milhas tracking
- [ ] Anuidade tracking
