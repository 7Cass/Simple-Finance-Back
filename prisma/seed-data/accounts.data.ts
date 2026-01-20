/**
 * Test bank accounts and credit cards for seed
 */

export interface BankAccountData {
  name: string;
  type: 'CHECKING' | 'SAVINGS';
  balanceCents: number;
  userId: string;
}

export interface CreditCardData {
  name: string;
  lastFourDigits: string;
  limitCents: number;
  closingDay: number;
  dueDay: number;
  userId: string;
}

/**
 * Get bank accounts for each user
 */
export function getBankAccountsForUser(userEmail: string): BankAccountData[] {
  // Extract user identifier from email
  const userId = userEmail.toLowerCase();

  // Different accounts based on user
  if (userId.includes('joao')) {
    return [
      {
        name: 'Nubank',
        type: 'CHECKING',
        balanceCents: 543200, // R$ 5.432,00
        userId: userEmail,
      },
    ];
  } else if (userId.includes('maria')) {
    return [
      {
        name: 'Itaú',
        type: 'CHECKING',
        balanceCents: 1250000, // R$ 12.500,00
        userId: userEmail,
      },
      {
        name: 'Poupança BB',
        type: 'SAVINGS',
        balanceCents: 5000000, // R$ 50.000,00
        userId: userEmail,
      },
    ];
  } else {
    // carlos
    return [
      {
        name: 'Inter',
        type: 'CHECKING',
        balanceCents: 875000, // R$ 8.750,00
        userId: userEmail,
      },
      {
        name: 'Nubank',
        type: 'CHECKING',
        balanceCents: 215000, // R$ 2.150,00
        userId: userEmail,
      },
    ];
  }
}

/**
 * Get credit cards for each user
 */
export function getCreditCardsForUser(userEmail: string): CreditCardData[] {
  // Extract user identifier from email
  const userId = userEmail.toLowerCase();

  // Different cards based on user
  if (userId.includes('joao')) {
    return [
      {
        name: 'Nubank',
        lastFourDigits: '4829',
        limitCents: 800000, // R$ 8.000,00
        closingDay: 3,
        dueDay: 10,
        userId: userEmail,
      },
      {
        name: 'Inter Platinum',
        lastFourDigits: '9156',
        limitCents: 1500000, // R$ 15.000,00
        closingDay: 25,
        dueDay: 5,
        userId: userEmail,
      },
    ];
  } else if (userId.includes('maria')) {
    return [
      {
        name: 'Itaú',
        lastFourDigits: '7234',
        limitCents: 1000000, // R$ 10.000,00
        closingDay: 10,
        dueDay: 18,
        userId: userEmail,
      },
      {
        name: 'Nubank',
        lastFourDigits: '3891',
        limitCents: 500000, // R$ 5.000,00
        closingDay: 3,
        dueDay: 10,
        userId: userEmail,
      },
      {
        name: 'Bradesco',
        lastFourDigits: '1456',
        limitCents: 700000, // R$ 7.000,00
        closingDay: 15,
        dueDay: 22,
        userId: userEmail,
      },
    ];
  } else {
    // carlos
    return [
      {
        name: 'Inter Black',
        lastFourDigits: '6789',
        limitCents: 2000000, // R$ 20.000,00
        closingDay: 20,
        dueDay: 28,
        userId: userEmail,
      },
    ];
  }
}
