# Categories Module

## Visão Geral
Módulo responsável pelo gerenciamento de categorias de transações. Suporta categorias padrão (globais) e categorias personalizadas por usuário, com ícones e cores.

## Arquitetura

```
categories/
├── dto/
│   ├── create-category.dto.ts  # Validação de criação
│   └── update-category.dto.ts  # Validação de atualização
├── categories.controller.ts    # Endpoints HTTP
├── categories.service.ts       # Lógica de negócio
└── categories.module.ts        # Configuração do módulo
```

## Modelo de Dados

```prisma
model Category {
  id        String          @id @default(uuid())
  name      String
  type      TransactionType // INCOME ou EXPENSE
  icon      String?         // Nome do ícone (ex: "shopping-cart")
  color     String?         // Cor hex (ex: "#FF5733")

  userId    String?         // null = categoria padrão
  isDefault Boolean         @default(false)

  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  user         User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
}
```

---

## Endpoints

### 1. Criar Categoria Personalizada
**Rota**: `POST /categories`
**Acesso**: Autenticado

**Request Body**:
```json
{
  "name": "Freelance",
  "type": "INCOME",
  "icon": "briefcase",
  "color": "#4CAF50"
}
```

**Validações**:
- `name`: Mínimo de 2 caracteres, único por usuário
- `type`: INCOME ou EXPENSE
- `icon`: Opcional, nome do ícone
- `color`: Opcional, formato hex (#RRGGBB)

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Freelance",
  "type": "INCOME",
  "icon": "briefcase",
  "color": "#4CAF50",
  "userId": "user-uuid",
  "isDefault": false,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Erros**:
- `409 Conflict`: Já existe categoria com esse nome para o usuário

---

### 2. Listar Categorias
**Rota**: `GET /categories`
**Acesso**: Autenticado

**Comportamento**:
- Retorna categorias padrão (globais) + categorias personalizadas do usuário
- Ordenação: Padrão primeiro, depois alfabético

**Response** (200 OK):
```json
[
  {
    "id": "uuid-1",
    "name": "Alimentação",
    "type": "EXPENSE",
    "icon": "restaurant",
    "color": "#FF9800",
    "userId": null,
    "isDefault": true
  },
  {
    "id": "uuid-2",
    "name": "Transporte",
    "type": "EXPENSE",
    "icon": "car",
    "color": "#2196F3",
    "userId": null,
    "isDefault": true
  },
  {
    "id": "uuid-3",
    "name": "Freelance",
    "type": "INCOME",
    "icon": "briefcase",
    "color": "#4CAF50",
    "userId": "user-uuid",
    "isDefault": false
  }
]
```

---

### 3. Obter Categoria Específica
**Rota**: `GET /categories/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Freelance",
  "type": "INCOME",
  "icon": "briefcase",
  "color": "#4CAF50",
  "userId": "user-uuid",
  "isDefault": false
}
```

**Erros**:
- `404 Not Found`: Categoria não encontrada ou não acessível

---

### 4. Atualizar Categoria Personalizada
**Rota**: `PATCH /categories/:id`
**Acesso**: Autenticado

**Request Body** (todos opcionais):
```json
{
  "name": "Trabalho Freelance",
  "icon": "laptop",
  "color": "#8BC34A"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Trabalho Freelance",
  "icon": "laptop",
  "color": "#8BC34A",
  ...
}
```

**Erros**:
- `404 Not Found`: Categoria não encontrada
- `403 Forbidden`: Tentativa de editar categoria de outro usuário **ou categoria padrão**

**Importante**: Categorias padrão (isDefault = true) NÃO podem ser editadas.

---

### 5. Deletar Categoria Personalizada
**Rota**: `DELETE /categories/:id`
**Acesso**: Autenticado

**Response** (200 OK):
```json
{
  "message": "Category deleted successfully"
}
```

**Erros**:
- `404 Not Found`: Categoria não encontrada
- `403 Forbidden`: Tentativa de deletar categoria de outro usuário **ou categoria padrão**

**Importante**:
- Categorias padrão NÃO podem ser deletadas
- **Hard delete**: Remove permanentemente (não é soft delete)
- Transações vinculadas ficam com `categoryId = null`

---

## Conceitos Importantes

### Categorias Padrão vs Personalizadas

**Categorias Padrão**:
- `userId = null` e `isDefault = true`
- Disponíveis para todos os usuários
- **Não podem ser editadas ou deletadas**
- Criadas via seed/migration

**Categorias Personalizadas**:
- `userId = <user-uuid>` e `isDefault = false`
- Específicas do usuário
- Podem ser editadas e deletadas
- Criadas via API

### Exemplos de Categorias Padrão
```typescript
// Despesas
{ name: "Alimentação", type: "EXPENSE", icon: "restaurant" }
{ name: "Transporte", type: "EXPENSE", icon: "car" }
{ name: "Saúde", type: "EXPENSE", icon: "medical" }
{ name: "Educação", type: "EXPENSE", icon: "school" }
{ name: "Lazer", type: "EXPENSE", icon: "gamepad" }

// Receitas
{ name: "Salário", type: "INCOME", icon: "wallet" }
{ name: "Investimentos", type: "INCOME", icon: "trending-up" }
{ name: "Freelance", type: "INCOME", icon: "briefcase" }
```

### Ícones e Cores
- **Ícones**: Use nomes compatíveis com a biblioteca de ícones do frontend
- **Cores**: Formato hexadecimal (#RRGGBB)
- Ambos são opcionais, mas melhoram a UX

---

## Integração com Outros Módulos

### Transactions Module
- Transações podem vincular `categoryId`
- Categoria nula é permitida
- Útil para relatórios e filtros

### Reports Module
- **Expenses by Category**: Agrupa por categoria
- Categorias sem transações não aparecem no relatório
- Usa nome, ícone e cor para visualização

---

## Proteção de Categorias Padrão

Todas as operações verificam se categoria é padrão:

```typescript
// Edição
if (category.isDefault) {
  throw new ForbiddenException('Cannot edit default categories');
}

// Deleção
if (category.isDefault) {
  throw new ForbiddenException('Cannot delete default categories');
}
```

---

## Casos de Uso

### 1. Listar Todas as Categorias (Padrão + Personalizadas)
```bash
curl -X GET http://localhost:3000/categories \
  -H "Authorization: Bearer <token>"
```

### 2. Criar Categoria Personalizada
```bash
curl -X POST http://localhost:3000/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pets",
    "type": "EXPENSE",
    "icon": "paw",
    "color": "#FFC107"
  }'
```

### 3. Atualizar Categoria Personalizada
```bash
curl -X PATCH http://localhost:3000/categories/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Animais de Estimação" }'
```

### 4. Deletar Categoria Personalizada
```bash
curl -X DELETE http://localhost:3000/categories/<id> \
  -H "Authorization: Bearer <token>"
```

---

## Testes Recomendados

### Criação
- ✅ Criar categoria personalizada
- ✅ Validar nome único por usuário
- ✅ Validar tipo (INCOME/EXPENSE)
- ✅ Criar com ícone e cor
- ✅ Criar sem ícone e cor (opcionais)
- ✅ Impedir nome duplicado para mesmo usuário

### Listagem
- ✅ Listar retorna padrão + personalizadas
- ✅ Verificar ordenação (padrão primeiro)
- ✅ Verificar isolamento entre usuários
- ✅ Categorias padrão visíveis para todos

### Atualização
- ✅ Atualizar categoria personalizada
- ✅ **Impedir edição de categoria padrão**
- ✅ Impedir editar categoria de outro usuário
- ✅ Validar nome único ao atualizar

### Deleção
- ✅ Deletar categoria personalizada
- ✅ **Impedir deletar categoria padrão**
- ✅ Impedir deletar categoria de outro usuário
- ✅ Verificar transações ficam com categoryId = null

---

## Seeders (Categorias Padrão)

Recomenda-se criar script de seed para categorias padrão:

```typescript
// prisma/seeds/categories.seed.ts
const defaultCategories = [
  // Despesas
  { name: "Alimentação", type: "EXPENSE", icon: "restaurant", color: "#FF9800" },
  { name: "Transporte", type: "EXPENSE", icon: "car", color: "#2196F3" },
  { name: "Moradia", type: "EXPENSE", icon: "home", color: "#9C27B0" },
  { name: "Saúde", type: "EXPENSE", icon: "medical", color: "#F44336" },
  { name: "Educação", type: "EXPENSE", icon: "school", color: "#673AB7" },
  { name: "Lazer", type: "EXPENSE", icon: "gamepad", color: "#E91E63" },
  { name: "Vestuário", type: "EXPENSE", icon: "shirt", color: "#3F51B5" },

  // Receitas
  { name: "Salário", type: "INCOME", icon: "wallet", color: "#4CAF50" },
  { name: "Investimentos", type: "INCOME", icon: "trending-up", color: "#00BCD4" },
  { name: "Freelance", type: "INCOME", icon: "briefcase", color: "#009688" },
];

// Criar com userId = null, isDefault = true
```

---

## Melhorias Futuras

- [ ] Subcategorias (hierarquia)
- [ ] Importar/exportar categorias personalizadas
- [ ] Compartilhar categorias entre usuários
- [ ] Sugestões de categoria baseadas em descrição da transação (ML)
- [ ] Estatísticas por categoria (mais usadas)
- [ ] Metas de gasto por categoria
- [ ] Categorias favoritas/fixadas
- [ ] Arquivamento de categorias (ao invés de deletar)
