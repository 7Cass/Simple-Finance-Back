# Simple Finance API

API para controle financeiro pessoal com foco em monitoramento de cartões de crédito, contas correntes e faturas.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **Prisma** - ORManagementSystem
- **JWT** - Autenticação
- **TypeScript** - Linguagem

## 📁 Estrutura do Projeto

```
src/
├── modules/          # Módulos de features
│   └── auth/        # Autenticação e autorização
├── shared/          # Código reutilizável
│   ├── value-objects/  # Money, etc
│   └── types/       # Enums compartilhados
└── common/          # Infraestrutura
    ├── database/    # Prisma service
    ├── decorators/  # Custom decorators
    └── guards/      # Guards de autenticação
```

## 🛠️ Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar banco de dados

Atualize o `.env` com suas credenciais do PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/simple_finance?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

### 3. Rodar migrations

```bash
npx prisma migrate dev --name init
```

### 4. Iniciar o servidor

```bash
npm run start:dev
```

A API estará rodando em `http://localhost:3000`

## 📚 Endpoints Disponíveis

### Autenticação

- `POST /auth/register` - Criar nova conta
- `POST /auth/login` - Fazer login
- `GET /auth/profile` - Obter perfil (autenticado)

**Exemplo de registro:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123",
    "name": "João Silva"
  }'
```

**Exemplo de login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

**Exemplo de acesso autenticado:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 💰 Valores Monetários

Todos os valores monetários são armazenados como **centavos (Int)** no banco de dados:

- R$ 10,50 = 1050 centavos
- R$ 100,00 = 10000 centavos

A API aceita e retorna valores em reais, mas internamente usa centavos para evitar problemas de precisão.

## 🗄️ Esquema do Banco de Dados

Ver `prisma/schema.prisma` para o esquema completo.

Principais modelos:
- `User` - Usuários
- `BankAccount` - Contas bancárias
- `CreditCard` - Cartões de crédito
- `Transaction` - Transações (com suporte a parcelamento e recorrência)
- `CreditCardBill` - Faturas de cartão
- `Category` - Categorias de transações

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm run test

# Prisma Studio (GUI)
npx prisma studio
```

## 📝 Próximos Passos

- [ ] Implementar módulos de contas bancárias
- [ ] Implementar módulos de cartões de crédito
- [ ] Implementar transações com parcelamento
- [ ] Implementar faturas de cartão
- [ ] Adicionar categorias
- [ ] Implementar relatórios
- [ ] Adicionar importação de extratos (CSV/OFX)

## 📄 Licença

MIT
