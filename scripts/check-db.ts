import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load .env file
config();

async function checkDatabase() {
  console.log('🔍 Checking database connection...');

  // Get DATABASE_URL from environment
  const dbUrl = process.env.DATABASE_URL;
  console.log('📍 DATABASE_URL:', dbUrl?.replace(/:[^:]+@/, '@***@'));

  // Create Prisma Client with adapter (same as production)
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        take: 10,
      });

      console.log('\n📋 User List:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name})`);
      });
    }

    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`\n🏷️  Categories in database: ${categoryCount}`);

    // List a few categories
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        type: true,
        isDefault: true,
      },
      take: 5,
    });

    if (categories.length > 0) {
      console.log('\n📝 Sample Categories:');
      categories.forEach((cat) => {
        console.log(`  - ${cat.name} (${cat.type})`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
