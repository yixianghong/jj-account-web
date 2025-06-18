export type TransactionType = "income" | "expense";

export type PaymentStatus = "pending" | "paid";

export type Category = "存款" | "購物" | "飲食" | "生活" | "旅遊" | "醫療" | "交通" | "房屋" | "電費" | "水費" | "瓦斯費" | "網路費" | "管理費" | "其他";

export type Recorder = string;

export const CATEGORIES: Category[] = [
  "存款",
  "購物",
  "飲食",
  "生活",
  "旅遊",
  "醫療",
  "交通",
  "房屋",
  "電費",
  "水費",
  "瓦斯費",
  "網路費",
  "管理費",
  "其他",
];

export const RECORDERS: Recorder[] = ["jason", "jassica"];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  recorder: Recorder;
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

export interface AccountBook {
  id: string;
  name: string;
  userId: string;
  sharedUsers: string[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
}
