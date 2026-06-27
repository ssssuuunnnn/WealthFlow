import { createContext } from 'react';
import type { AppData, IncomeEntry, ExpenseEntry, BalanceSheetSnapshot, Page, FinanceMember } from '../types';

export interface AppContextValue {
  data: AppData;
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  addIncome: (e: IncomeEntry) => void;
  updateIncome: (e: IncomeEntry) => void;
  deleteIncome: (id: string) => void;
  addExpense: (e: ExpenseEntry) => void;
  updateExpense: (e: ExpenseEntry) => void;
  deleteExpense: (id: string) => void;
  upsertSnapshot: (s: BalanceSheetSnapshot) => void;
  addNote: (date: string, member: FinanceMember, content: string) => void;
  setData: (d: AppData) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
