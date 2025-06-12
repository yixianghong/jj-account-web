export type TransactionType = "income" | "expense";

export type PaymentStatus = "pending" | "paid";

export type Category = "存款" | "購物" | "飲食" | "生活" | "旅遊" | "其他";

export const CATEGORIES: Category[] = [
  "存款",
  "購物",
  "飲食",
  "生活",
  "旅遊",
  "其他",
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
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
    [key in Category]?: number;
  };
}
