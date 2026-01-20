import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load .env file
config();

// Create Prisma Client WITHOUT adapter (works better for external connections)
const prisma = new PrismaClient();

export async function seedCategories() {
  console.log('🌱 Starting categories seed...');

  // Default income categories
  const incomeCategories = [
    { name: 'Salário', icon: '💰', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#10b981' },
    { name: 'Investimentos', icon: '📈', color: '#14b8a6' },
    { name: 'Presente', icon: '🎁', color: '#06b6d4' },
    { name: 'Bônus', icon: '🎉', color: '#0ea5e9' },
    { name: 'Vendas', icon: '🛒', color: '#3b82f6' },
    { name: 'Aluguel', icon: '🏠', color: '#6366f1' },
    { name: 'Outros', icon: '💵', color: '#8b5cf6' },
  ];

  // Default expense categories
  const expenseCategories = [
    { name: 'Alimentação', icon: '🍔', color: '#ef4444' },
    { name: 'Moradia', icon: '🏠', color: '#f97316' },
    { name: 'Transporte', icon: '🚗', color: '#f59e0b' },
    { name: 'Saúde', icon: '💊', color: '#eab308' },
    { name: 'Educação', icon: '📚', color: '#84cc16' },
    { name: 'Lazer', icon: '🎬', color: '#22c55e' },
    { name: 'Entretenimento', icon: '🎮', color: '#14b8a6' },
    { name: 'Vestuário', icon: '👕', color: '#06b6d4' },
    { name: 'Supermercado', icon: '🛒', color: '#0ea5e9' },
    { name: 'Restaurante', icon: '🍽️', color: '#3b82f6' },
    { name: 'Contas', icon: '📄', color: '#6366f1' },
    { name: 'Internet', icon: '🌐', color: '#8b5cf6' },
    { name: 'Telefone', icon: '📱', color: '#a855f7' },
    { name: 'Streaming', icon: '🎧', color: '#d946ef' },
    { name: 'Viagem', icon: '✈️', color: '#ec4899' },
    { name: 'Automóvel', icon: '🚙', color: '#f43f5e' },
    { name: 'Seguros', icon: '🛡️', color: '#e11d48' },
    { name: 'Impostos', icon: '🏛️', color: '#be123c' },
    { name: 'Dívidas', icon: '💳', color: '#0f172a' },
    { name: 'Outros', icon: '📦', color: '#64748b' },
  ];

  try {
    // Check if categories already exist
    const existingCategories = await prisma.category.count({
      where: { isDefault: true },
    });

    if (existingCategories >= 28) {
      console.log(`✅ Found ${existingCategories} default categories already seeded. Skipping...`);
      return;
    }

    // If some categories exist but not all, delete and recreate
    if (existingCategories > 0) {
      console.log(`⚠️  Found ${existingCategories} default categories (incomplete). Recreating...`);
      await prisma.category.deleteMany({
        where: { isDefault: true },
      });
    }

    console.log('📝 Creating default income categories...');
    for (const category of incomeCategories) {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: 'INCOME',
          isDefault: true,
          userId: null,
        },
      });
    }

    console.log('📝 Creating default expense categories...');
    for (const category of expenseCategories) {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: 'EXPENSE',
          isDefault: true,
          userId: null,
        },
      });
    }

    console.log(`✅ Successfully created ${incomeCategories.length + expenseCategories.length} default categories!`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedCategories()
  .then(() => {
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
