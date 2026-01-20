# Technical Debt & Identified Bugs

## 1. Transaction Deletion vs. Bank Account Balance (CRITICAL)

### The Issue
Currently, when a `COMPLETED` transaction (Income or Expense) is deleted using the `DELETE /transactions/:id` endpoint, the system performs a soft delete but **does not revert the impact on the bank account balance**.

**Example:**
1. User has a bank account with **R$ 1,000.00**.
2. User creates an Expense of **R$ 200.00** (Status: COMPLETED).
3. Bank account balance updates to **R$ 800.00**.
4. User realizes the transaction was a mistake and deletes it.
5. Transaction is marked as `deleted: true`.
6. **Result:** Bank account balance remains **R$ 800.00**. It should be restored to **R$ 1,000.00**.

### Proposed Solution
Modify `TransactionsService.remove()`:
- Before soft-deleting, check if `status === COMPLETED` and if `bankAccountId` is present.
- If true, call `updateBankAccountBalance` with the reverse operation (add if it was expense, subtract if it was income).
- This must also be handled for child transactions if a parent installment is deleted.

---

## 2. Credit Card Bill Synchronization on Delete (HIGH)

### The Issue
Credit Card Bills (`CreditCardBill`) store a static `totalAmount` snapshot generated at creation time. If a transaction linked to an **OPEN** bill is deleted, the transaction is removed (soft deleted), but the Bill's `totalAmount` **is not recalculated**.

**Example:**
1. Bill generated with 2 items of R$ 50.00 each. Total: **R$ 100.00**.
2. User deletes one transaction of R$ 50.00.
3. Transaction is hidden from lists.
4. **Result:** Bill metadata still shows Total: **R$ 100.00**, but the actual sum of visible items is **R$ 50.00**.

### Proposed Solution
Modify `TransactionsService.remove()`:
- Check if the transaction has a `billId`.
- If yes, fetch the Bill.
- **If Bill is OPEN:** Recalculate the bill total (subtract the deleted amount) and update `CreditCardBill.totalAmountCents`.
- **If Bill is CLOSED/PAID:** Block the deletion (`ForbiddenException`). User must reopen the bill or handle it via a manual adjustment transaction, as changing history for paid bills breaks reconciliation.

---

## 3. Cascading Soft Deletes (Bank Accounts & Credit Cards)

### The Issue
Deleting a Bank Account or Credit Card performs a "Cascading Soft Delete" on all its associated transactions.
- `BankAccountsService.remove()` -> Soft deletes account AND all its transactions.
- `CreditCardsService.remove()` -> Soft deletes card AND all its transactions.

**Consequences:**
1. **Transfer History Loss:** If user deletes "Old Account A", transfers made from "Old Account A" to "Current Account B" disappear from Account B's history too, as they are the same record.
2. **Bill History Loss:** If user deletes an old Credit Card, all past bills become empty (header remains, items disappear), making it impossible to review past spending.

### Proposed Solution
Modify `remove()` in both services:
- **Do NOT** soft delete the associated transactions.
- Only soft delete the Account/Card entity itself.
- Ensure the frontend/API handles displaying transactions where the parent Account/Card is deleted (e.g., show "Deleted Account" or the old name).

---

## 4. Category Deletion Strategy Inconsistency

### The Issue
- Bank Accounts, Credit Cards, and Transactions use **Soft Delete** (`deleted: boolean`).
- Categories use **Hard Delete** (physical row removal) with `ON DELETE SET NULL`.

### Proposed Solution
- Migrate Categories to use **Soft Delete** for consistency and to preserve historical reporting (e.g., knowing that R$ 500 was spent on "Old Category" is better than "Uncategorized").

---

## 5. Bill Generation vs. Transaction Creation Order

### The Issue
Bills are snapshots. If a user generates a bill for "February" *before* creating the transactions for that month, the bill will be created with Total: 0. Creating transactions *afterwards* does not automatically link them to the already created bill or update its total.

### Proposed Solution
- **Option A (Auto-Sync):** When creating/updating a Credit Card transaction, check if a Bill exists for that date. If it exists and is OPEN, link it and update the total.
- **Option B (UX/Block):** Prevent generating a bill for a future or current incomplete period without a warning.
- **Option C (Refresh Endpoint):** Add a `POST /bills/:id/refresh` endpoint to recalculate the bill based on current transactions.

---

## Summary of Refactoring Plan

| Priority | Component | Action |
| :--- | :--- | :--- |
| 🔴 Critical | Transactions | Implement Balance Reversion on Delete |
| 🟠 High | Bills | Implement Total Update on Transaction Delete (Open Bills) |
| 🟠 High | Bills | Block Transaction Delete on Closed/Paid Bills |
| 🟡 Medium | Accounts/Cards | Stop Cascading Soft Delete (Preserve History) |
| 🔵 Low | Categories | Switch to Soft Delete |
