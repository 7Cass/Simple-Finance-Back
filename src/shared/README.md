# Shared Layer

## Visão Geral
Camada de código compartilhado que contém Value Objects, Enums e tipos reutilizáveis em toda a aplicação. Não depende de nenhum módulo específico.

## Estrutura

```
shared/
├── value-objects/    # Value Objects (DDD)
│   └── money.vo.ts   # Manipulação de valores monetários
└── types/            # Enums e tipos compartilhados
    └── enums.ts      # Enums do domínio
```

---

## Value Objects

### Money (`value-objects/money.vo.ts`)

**Descrição**: Value Object para manipulação segura de valores monetários, evitando problemas de ponto flutuante.

**Princípios**:
- Imutabilidade: Operações retornam nova instância
- Validação: Apenas valores inteiros (centavos) são aceitos
- Encapsulamento: Lógica monetária centralizada

#### Factory Methods

**fromCents()**: Cria instância a partir de centavos
```typescript
const money = Money.fromCents(1050);
// Representa R$ 10,50
```

**fromReais()**: Cria instância a partir de reais
```typescript
const money = Money.fromReais(10.50);
// Arredonda para centavos: 1050
```

#### Getters

**getCents()**: Retorna valor em centavos
```typescript
const money = Money.fromReais(10.50);
money.getCents(); // 1050
```

**getReais()**: Retorna valor em reais
```typescript
const money = Money.fromCents(1050);
money.getReais(); // 10.50
```

**format()**: Formata como moeda brasileira
```typescript
const money = Money.fromReais(1234.56);
money.format(); // "R$ 1.234,56"
```

#### Operações Aritméticas

**add()**: Adiciona valores
```typescript
const a = Money.fromReais(10.50);
const b = Money.fromReais(5.25);
const result = a.add(b);
result.getReais(); // 15.75
```

**subtract()**: Subtrai valores
```typescript
const a = Money.fromReais(20.00);
const b = Money.fromReais(7.50);
const result = a.subtract(b);
result.getReais(); // 12.50
```

**multiply()**: Multiplica por fator
```typescript
const money = Money.fromReais(10.00);
const result = money.multiply(1.5);
result.getReais(); // 15.00
```

**divide()**: Divide por divisor
```typescript
const money = Money.fromReais(100.00);
const result = money.divide(3);
result.getReais(); // 33.33 (arredondado)
```

#### Comparações

**isPositive()**: Verifica se é positivo
```typescript
Money.fromReais(10).isPositive(); // true
Money.fromReais(-5).isPositive(); // false
```

**isNegative()**: Verifica se é negativo
```typescript
Money.fromReais(-10).isNegative(); // true
Money.fromReais(5).isNegative(); // false
```

**isZero()**: Verifica se é zero
```typescript
Money.fromReais(0).isZero(); // true
Money.fromReais(1).isZero(); // false
```

**equals()**: Compara igualdade
```typescript
const a = Money.fromReais(10.50);
const b = Money.fromReais(10.50);
const c = Money.fromReais(10.51);

a.equals(b); // true
a.equals(c); // false
```

#### Serialização JSON

**toJSON()**: Converte para JSON
```typescript
const money = Money.fromReais(10.50);
money.toJSON();
// {
//   cents: 1050,
//   reais: 10.50,
//   formatted: "R$ 10,50"
// }
```

---

### Uso no Projeto

#### Em Services (conversão API → DB)
```typescript
// API recebe em reais
const balanceCents = Money.fromReais(dto.balance).getCents();

// Salva no banco em centavos
await this.prisma.bankAccount.update({
  where: { id },
  data: { balanceCents },
});
```

#### Em Services (conversão DB → API)
```typescript
// Lê do banco em centavos
const account = await this.prisma.bankAccount.findUnique({ where: { id } });

// Retorna na API em reais
return {
  ...account,
  balance: Money.fromCents(account.balanceCents).getReais(),
};
```

#### Operações Financeiras
```typescript
// Calcular total de transações
const transactions = await this.prisma.transaction.findMany();
let total = Money.fromCents(0);

transactions.forEach(t => {
  total = total.add(Money.fromCents(t.amountCents));
});

return total.getReais();
```

---

## Enums

### Localização: `types/enums.ts`

Todos os enums do domínio estão centralizados neste arquivo.

---

### AccountType

**Descrição**: Tipos de conta bancária

```typescript
enum AccountType {
  CHECKING = 'CHECKING',  // Conta corrente
  SAVINGS = 'SAVINGS',    // Poupança
}
```

**Uso**:
```typescript
bankAccount: {
  type: AccountType.CHECKING
}
```

---

### TransactionType

**Descrição**: Tipos de transação financeira

```typescript
enum TransactionType {
  INCOME = 'INCOME',    // Receita (entrada)
  EXPENSE = 'EXPENSE',  // Despesa (saída)
}
```

**Uso**:
```typescript
transaction: {
  type: TransactionType.EXPENSE,
  amount: 100.00
}
```

**Importante**: O valor (amount) é sempre positivo, o tipo define se é entrada ou saída.

---

### PaymentMethod

**Descrição**: Métodos de pagamento de transações

```typescript
enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',  // Cartão de crédito
  DEBIT = 'DEBIT',              // Débito
  CASH = 'CASH',                // Dinheiro
  TRANSFER = 'TRANSFER',        // Transferência
}
```

**Requisitos por método**:
- `CREDIT_CARD`: requer `creditCardId`
- `DEBIT`, `TRANSFER`: requer `bankAccountId`
- `CASH`: não requer vínculo

**Uso**:
```typescript
transaction: {
  paymentMethod: PaymentMethod.CREDIT_CARD,
  creditCardId: 'uuid'
}
```

---

### TransactionStatus

**Descrição**: Status de uma transação

```typescript
enum TransactionStatus {
  PENDING = 'PENDING',      // Pendente (não afeta saldo)
  COMPLETED = 'COMPLETED',  // Completada (afeta saldo)
  CANCELLED = 'CANCELLED',  // Cancelada
}
```

**Impacto no saldo**:
- `PENDING`: Não afeta saldo de conta bancária
- `COMPLETED`: Afeta saldo (adiciona INCOME, subtrai EXPENSE)
- `CANCELLED`: Não afeta saldo

**Transições comuns**:
```
PENDING → COMPLETED (efetiva transação)
COMPLETED → CANCELLED (cancela transação)
PENDING → CANCELLED (cancela antes de efetivar)
```

---

### RecurrenceRule

**Descrição**: Regras de recorrência de transações

```typescript
enum RecurrenceRule {
  DAILY = 'DAILY',      // Diária
  WEEKLY = 'WEEKLY',    // Semanal
  MONTHLY = 'MONTHLY',  // Mensal
  YEARLY = 'YEARLY',    // Anual
}
```

**Uso**:
```typescript
transaction: {
  isRecurring: true,
  recurrenceRule: RecurrenceRule.MONTHLY,
  recurrenceEndDate: '2025-12-31'
}
```

**Exemplos**:
- Salário: MONTHLY
- Aluguel: MONTHLY
- Assinatura streaming: MONTHLY
- Anuidade cartão: YEARLY

---

### BillStatus

**Descrição**: Status de fatura de cartão de crédito

```typescript
enum BillStatus {
  OPEN = 'OPEN',        // Aberta (recebe transações)
  CLOSED = 'CLOSED',    // Fechada (não recebe mais transações)
  PAID = 'PAID',        // Paga (quitada)
  OVERDUE = 'OVERDUE',  // Vencida (em atraso)
}
```

**Ciclo de vida**:
```
OPEN → (fechar) → CLOSED → (pagar) → PAID
                             ↓ (vencer)
                          OVERDUE
```

**Comportamentos**:
- `OPEN`: Pode receber novas transações
- `CLOSED`: Valores fixos, aguarda pagamento
- `PAID`: Fatura quitada
- `OVERDUE`: Vencida, precisa atenção

---

## Padrões de Uso

### 1. Importar Enums
```typescript
import {
  TransactionType,
  PaymentMethod,
  TransactionStatus
} from '../shared/types/enums';
```

### 2. Usar em DTOs
```typescript
export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
```

### 3. Usar Money VO
```typescript
import { Money } from '../shared/value-objects/money.vo';

// Converter entrada da API
const amountCents = Money.fromReais(dto.amount).getCents();

// Converter saída para API
balance: Money.fromCents(account.balanceCents).getReais()
```

---

## Benefícios

### Money Value Object

✅ **Precisão**: Sem erros de ponto flutuante
```typescript
// Problema JS:
0.1 + 0.2 = 0.30000000000000004

// Com Money VO:
Money.fromReais(0.1).add(Money.fromReais(0.2)).getReais() = 0.3
```

✅ **Imutabilidade**: Operações seguras
```typescript
const a = Money.fromReais(10);
const b = a.add(Money.fromReais(5));
// 'a' permanece 10, 'b' é novo objeto com 15
```

✅ **Validação**: Apenas inteiros (centavos)
```typescript
Money.fromCents(10.5); // Error: Must be integer
```

✅ **Encapsulamento**: Lógica monetária centralizada
```typescript
money.format(); // "R$ 10,50"
// Não precisa formatar manualmente em cada lugar
```

### Enums

✅ **Type Safety**: TypeScript valida em tempo de compilação
```typescript
type: TransactionType.INCOME // ✓ válido
type: "INVALID" // ✗ erro de compilação
```

✅ **Auto-complete**: IDE sugere valores válidos
✅ **Refatoração Segura**: Mudar enum atualiza todos os usos
✅ **Documentação**: Valores possíveis claros no código

---

## Testes Recomendados

### Money VO
- ✅ Criar de centavos e reais
- ✅ Converter entre centavos e reais
- ✅ Adicionar, subtrair, multiplicar, dividir
- ✅ Comparações (isPositive, isNegative, isZero, equals)
- ✅ Formatar como moeda brasileira
- ✅ Arredondamento correto
- ✅ Imutabilidade (operações não modificam original)
- ✅ Validar apenas inteiros em constructor

### Enums
- ✅ Valores correspondem às strings
- ✅ Todos os enums exportados corretamente
- ✅ Uso em DTOs com @IsEnum()
- ✅ Uso em Prisma schema

---

## Convenções

### Money
- **Banco de dados**: Sempre em centavos (Int)
- **API (entrada/saída)**: Sempre em reais (Number)
- **Conversão**: Use Money VO em services

### Enums
- **Nomenclatura**: PascalCase para nome, UPPER_CASE para valores
- **Valores**: Strings descritivas (não números)
- **Sincronização**: Enums TypeScript devem corresponder ao Prisma schema

---

## Melhorias Futuras

### Money VO
- [ ] Suporte a múltiplas moedas (USD, EUR, etc.)
- [ ] Operações com taxas de conversão
- [ ] Validação de limites (min/max)
- [ ] Comparadores (greaterThan, lessThan)
- [ ] Porcentagens (calculatePercentage, applyPercentage)

### Enums
- [ ] Adicionar descrições/labels para UI
- [ ] Enum de categorias padrão
- [ ] Enum de instituições bancárias
- [ ] Enum de bandeiras de cartão (Visa, Mastercard, Elo)
- [ ] Enum de status de usuário (ACTIVE, INACTIVE, SUSPENDED)
