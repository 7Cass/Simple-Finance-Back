# Reports Module

## Visão Geral
Módulo responsável pela geração de relatórios e análises financeiras. Fornece visões agregadas de saldo, fluxo de caixa, gastos por categoria, e uso de cartões de crédito.

## Arquitetura

```
reports/
├── dto/
│   └── report-filters.dto.ts  # Filtros para relatórios
├── reports.controller.ts      # Endpoints HTTP
├── reports.service.ts         # Lógica de negócio
└── reports.module.ts          # Configuração do módulo
```

---

## Endpoints

### 1. Summary (Resumo Geral)
**Rota**: `GET /reports/summary`
**Acesso**: Autenticado

**Descrição**: Visão geral da situação financeira do usuário

**Response** (200 OK):
```json
{
  "totalBalance": 15000.50,
  "totalCreditLimit": 25000.00,
  "totalCreditCardDebt": 3500.00,
  "pendingIncome": 5000.00,
  "pendingExpenses": 800.00
}
```

**Campos**:
- `totalBalance`: Soma dos saldos de todas as contas bancárias ativas
- `totalCreditLimit`: Soma dos limites de todos os cartões de crédito ativos
- `totalCreditCardDebt`: Soma dos valores não pagos de faturas OPEN/CLOSED/OVERDUE
- `pendingIncome`: Soma de transações INCOME com status PENDING
- `pendingExpenses`: Soma de transações EXPENSE com status PENDING

**Cálculos**:
```typescript
// Saldo total das contas
SELECT SUM(balanceCents) FROM BankAccount
WHERE userId = X AND deleted = false

// Limite total de crédito
SELECT SUM(limitCents) FROM CreditCard
WHERE userId = X AND deleted = false

// Dívida de cartão (faturas não quitadas)
SELECT SUM(totalAmountCents - paidAmountCents) FROM CreditCardBill
WHERE creditCard.userId = X AND status IN (OPEN, CLOSED, OVERDUE)

// Receitas/Despesas pendentes
SELECT SUM(amountCents) FROM Transaction
WHERE userId = X AND status = PENDING AND type = INCOME/EXPENSE
```

---

### 2. Cash Flow (Fluxo de Caixa)
**Rota**: `GET /reports/cash-flow`
**Acesso**: Autenticado

**Query Parameters**:
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)
- `includeDeleted` (opcional): Incluir transações deletadas

**Exemplo**:
```bash
GET /reports/cash-flow?startDate=2025-01-01&endDate=2025-01-31
```

**Response** (200 OK):
```json
{
  "income": 5000.00,
  "expenses": 3500.00,
  "balance": 1500.00,
  "transactionsCount": 45,
  "incomeTransactions": 2,
  "expenseTransactions": 43
}
```

**Campos**:
- `income`: Soma de transações INCOME com status COMPLETED no período
- `expenses`: Soma de transações EXPENSE com status COMPLETED no período
- `balance`: income - expenses
- `transactionsCount`: Total de transações no período
- `incomeTransactions`: Quantidade de transações de receita
- `expenseTransactions`: Quantidade de transações de despesa

**Comportamento**:
- Considera apenas transações COMPLETED
- Ignora transações deletadas (a menos que `includeDeleted=true`)
- Se não fornecer datas, considera todas as transações

---

### 3. Expenses by Category (Despesas por Categoria)
**Rota**: `GET /reports/expenses-by-category`
**Acesso**: Autenticado

**Query Parameters**:
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `includeDeleted` (opcional): Incluir transações deletadas

**Response** (200 OK):
```json
[
  {
    "categoryId": "cat-uuid-1",
    "categoryName": "Alimentação",
    "categoryIcon": "restaurant",
    "categoryColor": "#FF9800",
    "totalAmount": 1500.00,
    "transactionsCount": 25,
    "percentage": 42.86
  },
  {
    "categoryId": "cat-uuid-2",
    "categoryName": "Transporte",
    "categoryIcon": "car",
    "categoryColor": "#2196F3",
    "totalAmount": 800.00,
    "transactionsCount": 12,
    "percentage": 22.86
  },
  {
    "categoryId": null,
    "categoryName": "Sem categoria",
    "totalAmount": 200.00,
    "transactionsCount": 3,
    "percentage": 5.71
  }
]
```

**Cálculos**:
```typescript
// Total de despesas
const totalExpenses = SUM(amountCents WHERE type = EXPENSE)

// Por categoria
const categoryTotal = SUM(amountCents WHERE categoryId = X)
const percentage = (categoryTotal / totalExpenses) * 100
```

**Ordenação**: Por valor total (descendente)

**Comportamento**:
- Considera apenas transações EXPENSE
- Apenas transações COMPLETED
- Agrupa por categoria (incluindo null/"Sem categoria")
- Calcula percentual de cada categoria sobre o total

---

### 4. Income vs Expenses (Receitas vs Despesas)
**Rota**: `GET /reports/income-vs-expenses`
**Acesso**: Autenticado

**Query Parameters**:
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `includeDeleted` (opcional): Incluir transações deletadas

**Response** (200 OK):
```json
[
  {
    "month": "2025-01",
    "income": 5000.00,
    "expenses": 3200.00,
    "difference": 1800.00,
    "incomeCount": 2,
    "expenseCount": 35
  },
  {
    "month": "2025-02",
    "income": 5000.00,
    "expenses": 4100.00,
    "difference": 900.00,
    "incomeCount": 2,
    "expenseCount": 42
  },
  {
    "month": "2025-03",
    "income": 5500.00,
    "expenses": 3800.00,
    "difference": 1700.00,
    "incomeCount": 3,
    "expenseCount": 38
  }
]
```

**Campos**:
- `month`: Mês no formato "YYYY-MM"
- `income`: Total de receitas no mês
- `expenses`: Total de despesas no mês
- `difference`: income - expenses
- `incomeCount`: Quantidade de transações de receita
- `expenseCount`: Quantidade de transações de despesa

**Comportamento**:
- Agrupa transações por mês
- Considera apenas COMPLETED
- Útil para gráficos de linha/barra
- Ordenado cronologicamente

---

### 5. Credit Card Usage (Uso de Cartões de Crédito)
**Rota**: `GET /reports/credit-card-usage`
**Acesso**: Autenticado

**Response** (200 OK):
```json
[
  {
    "creditCardId": "card-uuid-1",
    "creditCardName": "Nubank",
    "lastFourDigits": "1234",
    "limit": 5000.00,
    "used": 2500.00,
    "available": 2500.00,
    "usagePercentage": 50.00,
    "pendingDebt": 2500.00
  },
  {
    "creditCardId": "card-uuid-2",
    "creditCardName": "Bradesco Platinum",
    "lastFourDigits": "5678",
    "limit": 10000.00,
    "used": 1000.00,
    "available": 9000.00,
    "usagePercentage": 10.00,
    "pendingDebt": 1000.00
  }
]
```

**Campos**:
- `limit`: Limite total do cartão
- `used`: Valor gasto (faturas não pagas)
- `available`: Limite disponível (limit - used)
- `usagePercentage`: Percentual de uso do limite
- `pendingDebt`: Soma de valores não pagos das faturas (OPEN/CLOSED/OVERDUE)

**Cálculos**:
```typescript
// Débito pendente
const pendingDebt = SUM(totalAmountCents - paidAmountCents)
  FROM CreditCardBill
  WHERE creditCardId = X
    AND status IN (OPEN, CLOSED, OVERDUE)

// Percentual de uso
const usagePercentage = (pendingDebt / limitCents) * 100

// Limite disponível
const available = limitCents - pendingDebt
```

**Comportamento**:
- Lista todos os cartões ativos do usuário
- Calcula débito baseado em faturas não quitadas
- Útil para visualizar saúde financeira dos cartões

---

## Integração com Outros Módulos

### Bank Accounts Module
- **Summary**: Soma saldos de contas ativas
- Ignora contas deletadas

### Credit Cards Module
- **Summary**: Soma limites de cartões ativos
- **Credit Card Usage**: Calcula uso por cartão

### Transactions Module
- **Cash Flow**: Agrega transações por tipo
- **Expenses by Category**: Agrupa despesas por categoria
- **Income vs Expenses**: Agrega por mês

### Bills Module
- **Summary**: Calcula dívida total de cartões
- **Credit Card Usage**: Usa faturas não quitadas

### Categories Module
- **Expenses by Category**: Usa nome, ícone e cor das categorias

---

## Casos de Uso

### 1. Dashboard Principal
```bash
# Obter resumo geral
curl -X GET http://localhost:3000/reports/summary \
  -H "Authorization: Bearer <token>"
```

### 2. Análise Mensal
```bash
# Fluxo de caixa do mês atual
curl -X GET "http://localhost:3000/reports/cash-flow?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer <token>"

# Despesas por categoria no mês
curl -X GET "http://localhost:3000/reports/expenses-by-category?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer <token>"
```

### 3. Análise de Tendências
```bash
# Receitas vs Despesas nos últimos 12 meses
curl -X GET "http://localhost:3000/reports/income-vs-expenses?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

### 4. Gestão de Cartões
```bash
# Verificar uso dos cartões
curl -X GET http://localhost:3000/reports/credit-card-usage \
  -H "Authorization: Bearer <token>"
```

---

## Características dos Relatórios

### Read-Only
- Todos os endpoints são **apenas leitura** (GET)
- Não modificam dados
- Sem side effects

### Agregação em Tempo Real
- Não há cache, dados sempre atualizados
- Cálculos feitos on-demand
- Para grandes volumes, considerar cache futuro

### Conversão de Valores
- Todos os valores retornados em reais
- Conversão automática de centavos usando `Money` VO

### Isolamento de Usuários
- Todos os relatórios filtram por `userId`
- Usuário só vê seus próprios dados
- Segurança garantida no service layer

---

## Performance

### Otimizações Atuais
- Queries direcionadas com WHERE clauses
- Uso de índices (userId, date, status)
- Agregações no banco de dados (SUM, COUNT)

### Possíveis Melhorias
- [ ] Cache de relatórios (Redis)
- [ ] Materialização de views
- [ ] Paginação para grandes datasets
- [ ] Background jobs para relatórios pesados
- [ ] Indexação adicional

---

## Testes Recomendados

### Summary
- ✅ Calcular saldo total de contas
- ✅ Calcular limite total de cartões
- ✅ Calcular dívida de cartões
- ✅ Calcular receitas/despesas pendentes
- ✅ Ignorar contas/cartões deletados

### Cash Flow
- ✅ Filtrar por período
- ✅ Calcular receitas e despesas
- ✅ Calcular balanço
- ✅ Contar transações
- ✅ Incluir/excluir deletadas

### Expenses by Category
- ✅ Agrupar por categoria
- ✅ Calcular percentuais
- ✅ Incluir "Sem categoria"
- ✅ Ordenar por valor
- ✅ Filtrar por período

### Income vs Expenses
- ✅ Agrupar por mês
- ✅ Calcular diferença
- ✅ Ordenar cronologicamente
- ✅ Lidar com meses sem transações

### Credit Card Usage
- ✅ Listar todos os cartões ativos
- ✅ Calcular débito pendente
- ✅ Calcular percentual de uso
- ✅ Calcular limite disponível

---

## Melhorias Futuras

- [ ] Exportar relatórios (PDF, Excel, CSV)
- [ ] Relatórios agendados por e-mail
- [ ] Comparação entre períodos (mês a mês, ano a ano)
- [ ] Previsões baseadas em histórico
- [ ] Gráficos e visualizações (retornar dados formatados para charts)
- [ ] Relatório de patrimônio líquido
- [ ] Relatório de evolução de saldo
- [ ] Análise de gastos recorrentes
- [ ] Alertas baseados em padrões (gastos anormais)
- [ ] Benchmark com média de usuários (anonimizado)
