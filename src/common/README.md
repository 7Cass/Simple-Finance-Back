# Common Layer

## Visão Geral
Camada de infraestrutura compartilhada que fornece serviços, decorators e guards usados por todos os módulos da aplicação.

## Estrutura

```
common/
├── database/           # Prisma service e configuração
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── decorators/         # Custom decorators
│   ├── current-user.decorator.ts
│   └── public.decorator.ts
└── guards/            # Guards de autenticação
    └── jwt-auth.guard.ts
```

---

## Database

### PrismaService (`database/prisma.service.ts`)

**Descrição**: Serviço que encapsula o Prisma Client, gerenciando a conexão com o banco de dados.

**Implementação**:
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Uso**:
```typescript
@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async findUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

**Características**:
- Conexão automática ao iniciar módulo
- Desconexão automática ao destruir módulo
- Singleton (uma única instância por aplicação)
- Thread-safe e com connection pooling

---

### PrismaModule (`database/prisma.module.ts`)

**Descrição**: Módulo global que exporta o PrismaService.

**Configuração**:
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Características**:
- Marcado como `@Global()`: disponível em toda a aplicação sem imports explícitos
- Deve ser importado apenas no `AppModule`
- Exporta `PrismaService` para uso em outros módulos

---

## Decorators

### @CurrentUser() (`decorators/current-user.decorator.ts`)

**Descrição**: Extrai o usuário autenticado do request.

**Implementação**:
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Uso**:
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: { id: string; email: string }) {
  return this.authService.getProfile(user.id);
}
```

**O que retorna**:
```typescript
{
  id: string;      // UUID do usuário
  email: string;   // E-mail do usuário
}
```

**Como funciona**:
1. JWT Strategy valida token e anexa payload ao `request.user`
2. Decorator extrai `request.user`
3. Controller recebe usuário autenticado

**Importante**:
- Apenas funciona em rotas autenticadas (protegidas pelo JwtAuthGuard)
- Rotas com `@Public()` não têm acesso ao CurrentUser

---

### @Public() (`decorators/public.decorator.ts`)

**Descrição**: Marca uma rota como pública, ignorando autenticação JWT.

**Implementação**:
```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Uso**:
```typescript
@Public()
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

**Como funciona**:
1. Decorator adiciona metadata `isPublic: true` na rota
2. JwtAuthGuard verifica essa metadata antes de validar token
3. Se `isPublic = true`, guard permite acesso sem token

**Quando usar**:
- Endpoints de registro e login
- Endpoints públicos (documentação, health check, etc.)
- Webhooks externos

**Importante**:
- Por padrão, TODAS as rotas são protegidas (JwtAuthGuard é global)
- Use `@Public()` explicitamente para rotas públicas

---

## Guards

### JwtAuthGuard (`guards/jwt-auth.guard.ts`)

**Descrição**: Guard global que protege todas as rotas, exceto aquelas marcadas com `@Public()`.

**Implementação**:
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Permite acesso público
    }

    return super.canActivate(context); // Valida JWT
  }
}
```

**Como funciona**:
1. Intercepta todas as requisições
2. Verifica se rota tem metadata `isPublic`
3. Se pública: permite acesso
4. Se protegida: valida token JWT via Passport
5. Se token válido: anexa usuário ao request e permite acesso
6. Se token inválido: retorna 401 Unauthorized

**Configuração Global** (`app.module.ts`):
```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

**Erros**:
- `401 Unauthorized`: Token ausente, inválido ou expirado

**Importante**:
- Aplicado globalmente, protege todas as rotas por padrão
- Usa estratégia 'jwt' do Passport (definida em JwtStrategy)
- Verifica metadata para identificar rotas públicas

---

## Padrões de Uso

### 1. Injetar PrismaService
```typescript
@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async getData() {
    return this.prisma.myModel.findMany();
  }
}
```

### 2. Usar CurrentUser em Controllers
```typescript
@Controller('items')
export class ItemsController {
  @Post()
  create(
    @Body() dto: CreateItemDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.service.findAll(user.id);
  }
}
```

### 3. Criar Rota Pública
```typescript
@Controller('public')
export class PublicController {
  @Public()
  @Get('info')
  getInfo() {
    return { message: 'Esta é uma rota pública' };
  }
}
```

---

## Fluxo de Autenticação

```
Cliente envia request com token
         ↓
JwtAuthGuard intercepta
         ↓
Verifica @Public() metadata
         ↓ (se não for pública)
Valida token JWT (via Passport)
         ↓
JWT Strategy extrai payload
         ↓
Anexa payload ao request.user
         ↓
Controller usa @CurrentUser() para acessar user
```

---

## Integração com Módulos

### Todos os módulos usam:
- **PrismaService**: Acesso ao banco de dados
- **@CurrentUser()**: Identificar usuário autenticado
- **JwtAuthGuard**: Proteção automática de rotas

### Apenas Auth Module usa:
- **@Public()**: Rotas de registro e login

---

## Testes Recomendados

### PrismaService
- ✅ Conecta ao banco ao iniciar
- ✅ Desconecta ao destruir
- ✅ Executa queries corretamente

### @CurrentUser()
- ✅ Extrai usuário de request autenticado
- ✅ Retorna { id, email }
- ✅ Funciona em rotas protegidas

### @Public()
- ✅ Permite acesso sem token
- ✅ Não valida JWT em rotas públicas
- ✅ Outras rotas continuam protegidas

### JwtAuthGuard
- ✅ Bloqueia requisições sem token
- ✅ Bloqueia requisições com token inválido
- ✅ Permite requisições com token válido
- ✅ Permite rotas marcadas como @Public()
- ✅ Anexa usuário ao request.user

---

## Configuração

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://user:password@localhost:5432/simple_finance?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

### Setup no AppModule
```typescript
@Module({
  imports: [
    PrismaModule,  // Importar uma vez
    AuthModule,
    // ... outros módulos
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // Guard global
    },
  ],
})
export class AppModule {}
```

---

## Notas Importantes

1. **PrismaModule é Global**: Não precisa importar em cada módulo
2. **JwtAuthGuard é Global**: Todas as rotas são protegidas por padrão
3. **@Public() é Explícito**: Sempre marque rotas públicas
4. **@CurrentUser() só funciona com autenticação**: Não use em rotas públicas
5. **Thread-Safety**: Prisma Client é thread-safe, use uma única instância

---

## Melhorias Futuras

- [ ] Logger customizado
- [ ] Exception filters globais
- [ ] Interceptors para transformação de resposta
- [ ] Rate limiting decorator
- [ ] Roles/Permissions decorator (@Roles('admin'))
- [ ] API versioning decorator
- [ ] Request ID tracking
- [ ] Audit logging decorator
