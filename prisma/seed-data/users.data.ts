/**
 * Test user data for seed
 * Passwords are hashed with bcrypt (10 rounds)
 */

import * as bcrypt from 'bcrypt';

export interface TestUser {
  name: string;
  email: string;
  passwordHash: string;
  profile: string;
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Get test users with hashed passwords
 * Call this function to get the user data ready for database insertion
 */
export async function getTestUsers(): Promise<TestUser[]> {
  const [password1, password2, password3] = await Promise.all([
    hashPassword('Senha123@'),
    hashPassword('Familia2026@'),
    hashPassword('Empreendedor@'),
  ]);

  return [
    {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      passwordHash: password1,
      profile: 'Profissional jovem, 28 anos, 12 meses de histórico financeiro',
    },
    {
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      passwordHash: password2,
      profile: 'Gestora familiar, 42 anos, 18 meses de histórico financeiro',
    },
    {
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@example.com',
      passwordHash: password3,
      profile: 'Freelancer, 35 anos, 6 meses de histórico financeiro',
    },
  ];
}

/**
 * Test user emails for idempotency checking
 */
export const TEST_USER_EMAILS = [
  'joao.silva@example.com',
  'maria.santos@example.com',
  'carlos.oliveira@example.com',
];
