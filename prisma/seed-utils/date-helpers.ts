/**
 * Date helper utilities for seed data generation
 */

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Subtract months from a date
 */
export function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

/**
 * Get first and last day of a month
 */
export function getMonthBounds(year: number, month: number): {
  firstDay: Date;
  lastDay: Date;
} {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
  return { firstDay, lastDay };
}

/**
 * Generate bill period (closing date and due date) based on credit card settings
 * @param baseDate Reference date for the bill
 * @param closingDay Day of month when bill closes (1-31)
 * @param dueDay Day of month when bill is due (1-31)
 * @returns Object with closingDate, dueDate, and referenceMonth
 */
export function generateBillPeriod(
  baseDate: Date,
  closingDay: number,
  dueDay: number
): {
  closingDate: Date;
  dueDate: Date;
  referenceMonth: Date;
} {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-indexed

  // Closing date: specified day of current month
  const closingDate = new Date(year, month, closingDay, 23, 59, 59, 999);

  // Due date: specified day of next month (or same month if dueDay > closingDay)
  let dueDate: Date;
  if (dueDay > closingDay) {
    // Due in same month (e.g., closes on 5th, due on 10th)
    dueDate = new Date(year, month, dueDay, 23, 59, 59, 999);
  } else {
    // Due in next month (e.g., closes on 25th, due on 5th)
    dueDate = new Date(year, month + 1, dueDay, 23, 59, 59, 999);
  }

  // Reference month is the month of the closing date
  const referenceMonth = new Date(year, month, 1, 0, 0, 0, 0);

  return { closingDate, dueDate, referenceMonth };
}

/**
 * Get date for a specific installment
 * @param firstDate Date of first installment
 * @param installmentNumber Which installment (1-based)
 * @returns Date for this installment
 */
export function getInstallmentDate(
  firstDate: Date,
  installmentNumber: number
): Date {
  // First installment is at firstDate
  // Each subsequent installment is +1 month
  return addMonths(firstDate, installmentNumber - 1);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  const now = new Date();
  return date < now;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date string to Date object at midnight
 */
export function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get transaction date for a specific month offset
 * @param baseDate Reference date
 * @param monthOffset Offset in months
 * @param dayOfMonth Preferred day of month (default: random 1-28)
 */
export function getTransactionDate(baseDate: Date, monthOffset: number, dayOfMonth?: number): Date {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + monthOffset);

  if (dayOfMonth) {
    date.setDate(dayOfMonth);
  } else {
    // Random day between 1 and 28
    date.setDate(Math.floor(Math.random() * 28) + 1);
  }

  return date;
}
