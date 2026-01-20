# Auth Module

## Visão Geral
Módulo responsável pela autenticação e autorização de usuários na API Simple Finance. Implementa registro, login e gerenciamento de perfis usando JWT (JSON Web Tokens).

## Arquitetura

```
auth/
├── dto/                      # Data Transfer Objects
│   ├── register.dto.ts      # Validação de registro
│   └── login.dto.ts         # Validação de login
├── strategies/              # Estratégias Passport
│   └── jwt.strategy.ts      # Estratégia JWT
├── auth.controller.ts       # Endpoints HTTP
├── auth.service.ts          # Lógica de negócio
└── auth.module.ts           # Configuração do módulo
```

## Tecnologias Utilizadas
- **Passport JWT**: Estratégia de autenticação
- **bcrypt**: Hash de senhas (salt rounds: 10)
- **@nestjs/jwt**: Geração e validação de tokens
- **class-validator**: Validação de DTOs

## Endpoints

### 1. Registro de Usuário
**Rota**: `POST /auth/register`
**Acesso**: Público (`@Public()`)

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Validações**:
- `email`: Deve ser um e-mail válido
- `password`: Mínimo de 6 caracteres
- `name`: Mínimo de 2 caracteres

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "createdAt": "2025-01-17T10:00:00.000Z",
    "updatedAt": "2025-01-17T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- `409 Conflict`: E-mail já cadastrado

**Implementação** (`auth.service.ts:19`):
- Verifica e-mail duplicado
- Hash da senha com bcrypt
- Criação do usuário no banco
- Geração automática de token JWT
- Retorno sem o campo `password`

---

### 2. Login
**Rota**: `POST /auth/login`
**Acesso**: Público (`@Public()`)

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "createdAt": "2025-01-17T10:00:00.000Z",
    "updatedAt": "2025-01-17T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- `401 Unauthorized`: Credenciais inválidas (e-mail ou senha incorretos)

**Implementação** (`auth.service.ts:47`):
- Busca usuário por e-mail
- Compara senha com bcrypt.compare()
- Gera novo token JWT
- Retorno sem o campo `password`

---

### 3. Perfil do Usuário
**Rota**: `GET /auth/profile`
**Acesso**: Autenticado (requer token JWT)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z"
}
```

**Erros**:
- `401 Unauthorized`: Token inválido ou expirado

**Implementação** (`auth.service.ts:71`):
- Extrai `userId` do token JWT via decorator `@CurrentUser()`
- Retorna dados do usuário (sem senha)

---

## Autenticação JWT

### Configuração
- **Secret**: Definido em `JWT_SECRET` (.env)
- **Expiração**: Definida em `JWT_EXPIRES_IN` (.env) - padrão 7 dias
- **Payload**:
  ```json
  {
    "sub": "userId",
    "email": "user@example.com",
    "iat": 1705491600,
    "exp": 1706096400
  }
  ```

### JWT Strategy (`strategies/jwt.strategy.ts`)
- Valida tokens em todas as rotas protegidas
- Extrai payload do token
- Anexa `user` ao request: `{ id: string, email: string }`

### Guards
- **JwtAuthGuard**: Aplicado globalmente no `app.module.ts`
- Todas as rotas são protegidas por padrão
- Use decorator `@Public()` para rotas públicas

---

## Decorators Personalizados

### @Public()
**Localização**: `src/common/decorators/public.decorator.ts`

Marca uma rota como pública, ignorando a autenticação JWT.

**Uso**:
```typescript
@Public()
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

### @CurrentUser()
**Localização**: `src/common/decorators/current-user.decorator.ts`

Extrai o usuário autenticado do request.

**Uso**:
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: { id: string }) {
  return this.authService.getProfile(user.id);
}
```

**Retorna**:
```typescript
{
  id: string;      // UUID do usuário
  email: string;   // E-mail do usuário
}
```

---

## Segurança

### Hash de Senhas
- **Algoritmo**: bcrypt
- **Salt rounds**: 10
- Senhas nunca são retornadas nas respostas da API
- Uso do operador spread para remover o campo: `const { password, ...result } = user;`

### Validação de E-mail Duplicado
- Verifica unicidade antes de criar usuário
- Retorna `409 Conflict` se e-mail já existe

### Mensagens de Erro Genéricas
- Login falho sempre retorna "Invalid credentials"
- Não revela se e-mail existe ou senha está incorreta
- Previne enumeração de e-mails

---

## Fluxo de Autenticação

### Registro
```
Cliente → POST /auth/register
         ↓
Validação do DTO (class-validator)
         ↓
Verifica e-mail duplicado
         ↓
Hash da senha (bcrypt)
         ↓
Cria usuário no banco
         ↓
Gera token JWT
         ↓
Retorna { user, access_token }
```

### Login
```
Cliente → POST /auth/login
         ↓
Busca usuário por e-mail
         ↓
Compara senha (bcrypt.compare)
         ↓
Gera token JWT
         ↓
Retorna { user, access_token }
```

### Acesso a Rota Protegida
```
Cliente → GET /qualquer-rota (Header: Authorization: Bearer <token>)
         ↓
JwtAuthGuard intercepta
         ↓
JWT Strategy valida token
         ↓
Extrai payload e anexa ao request
         ↓
Controller/Service acessa via @CurrentUser()
```

---

## Dependências

### Módulos Importados
- `JwtModule`: Configuração de JWT com secret e expiração
- `PassportModule`: Framework de autenticação
- `PrismaModule`: Acesso ao banco de dados

### Providers
- `AuthService`: Lógica de negócio
- `JwtStrategy`: Estratégia de validação JWT

---

## Testes

### Casos de Teste Recomendados
- ✅ Registro com dados válidos
- ✅ Registro com e-mail duplicado (409)
- ✅ Registro com e-mail inválido (400)
- ✅ Registro com senha curta (400)
- ✅ Login com credenciais válidas
- ✅ Login com e-mail inexistente (401)
- ✅ Login com senha incorreta (401)
- ✅ Acesso ao perfil com token válido
- ✅ Acesso ao perfil com token inválido (401)
- ✅ Acesso ao perfil sem token (401)

---

## Variáveis de Ambiente

```env
# JWT Configuration
JWT_SECRET="your-secret-key-here"       # Chave secreta para assinar tokens
JWT_EXPIRES_IN="7d"                     # Tempo de expiração (7 dias)
```

---

## Integração com Outros Módulos

Todos os módulos da aplicação dependem do módulo Auth para autenticação:
- **Bank Accounts**: Usuário autenticado acessa apenas suas contas
- **Credit Cards**: Usuário autenticado acessa apenas seus cartões
- **Transactions**: Transações são vinculadas ao usuário via contas/cartões
- **Categories**: Categorias personalizadas por usuário
- **Bills**: Faturas vinculadas aos cartões do usuário
- **Reports**: Relatórios calculados apenas com dados do usuário

### Exemplo de Uso em Outro Módulo
```typescript
@Controller('bank-accounts')
export class BankAccountsController {
  @Post()
  async create(
    @Body() dto: CreateBankAccountDto,
    @CurrentUser() user: { id: string }  // ← Usuário autenticado
  ) {
    return this.service.create(dto, user.id);
  }
}
```

---

## Notas Importantes

1. **Cascading Delete**: Deletar um usuário remove todos os dados relacionados (contas, cartões, transações, etc.)
2. **UUIDs**: IDs de usuário são UUIDs, não integers
3. **Global Guard**: JwtAuthGuard é global, todas as rotas são protegidas por padrão
4. **Token Expiration**: Tokens expiram em 7 dias por padrão (configurável)
5. **Password Policy**: Mínimo de 6 caracteres (pode ser melhorado com regex para senhas fortes)

---

## Melhorias Futuras

- [ ] Implementar refresh tokens
- [ ] Adicionar 2FA (autenticação de dois fatores)
- [ ] Implementar reset de senha por e-mail
- [ ] Adicionar rate limiting no login
- [ ] Melhorar validação de senha (requisitos de força)
- [ ] Implementar blacklist de tokens (logout)
- [ ] Adicionar logs de tentativas de login
- [ ] Implementar verificação de e-mail
