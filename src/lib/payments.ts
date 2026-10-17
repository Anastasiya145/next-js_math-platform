import { isIntegerInRange } from "@/lib/validation";

export const MAX_PAYMENT_AMOUNT = 1_000_000;
export const MAX_PAYMENT_NOTE_LENGTH = 200;

// Payments are whole hryvnias; `balance` is earned minus paid, so a positive balance is a debt.
export type PaymentBalance = {
  studentId: number;
  name: string;
  earned: number;
  paid: number;
  balance: number;
};

export type Payment = {
  id: number;
  studentId: number;
  studentName: string;
  paidOn: string;
  amount: number;
  note: string;
};

export type PaymentsData = { balances: PaymentBalance[]; payments: Payment[] };

export const isPaymentAmount = (value: unknown): value is number =>
  isIntegerInRange(value, 1, MAX_PAYMENT_AMOUNT);
