-- Seed categorias padrão - Simple Finance
-- Execute no banco de produção do PostgreSQL

-- Categorias de Receita (INCOME)
INSERT INTO "Category" ("id", name, icon, color, type, "isDefault", "userId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Salário', '💰', '#22c55e', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Freelance', '💻', '#10b981', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Investimentos', '📈', '#14b8a6', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Presente', '🎁', '#06b6d4', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Bônus', '🎉', '#0ea5e9', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Vendas', '🛒', '#3b82f6', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Aluguel', '🏠', '#6366f1', 'INCOME', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Outros', '💵', '#8b5cf6', 'INCOME', true, NULL, NOW(), NOW());

-- Categorias de Despesa (EXPENSE)
INSERT INTO "Category" ("id", name, icon, color, type, "isDefault", "userId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Alimentação', '🍔', '#ef4444', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Moradia', '🏠', '#f97316', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Transporte', '🚗', '#f59e0b', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Saúde', '💊', '#eab308', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Educação', '📚', '#84cc16', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Lazer', '🎬', '#22c55e', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Entretenimento', '🎮', '#14b8a6', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Vestuário', '👕', '#06b6d4', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Supermercado', '🛒', '#0ea5e9', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Restaurante', '🍽️', '#3b82f6', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Contas', '📄', '#6366f1', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Internet', '🌐', '#8b5cf6', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Telefone', '📱', '#a855f7', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Streaming', '🎧', '#d946ef', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Viagem', '✈️', '#ec4899', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Automóvel', '🚙', '#f43f5e', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Seguros', '🛡️', '#e11d48', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Impostos', '🏛️', '#be123c', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Dívidas', '💳', '#0f172a', 'EXPENSE', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Outros', '📦', '#64748b', 'EXPENSE', true, NULL, NOW(), NOW());
