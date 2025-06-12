export type TransactionType = "income" | "expense";

export type PaymentStatus = "pending" | "paid";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  recorder: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categorySummary: {
    [key: string]: number;
  };
}
