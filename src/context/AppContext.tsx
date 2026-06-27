import { useCallback, useState, type ReactNode } from 'react';
import type { AppData, IncomeEntry, ExpenseEntry, BalanceSheetSnapshot, Page, FinanceMember } from '../types';
import { loadData, saveData } from '../utils/storage';
import { AppContext } from './app-context';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<AppData>(loadData);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
  );

  const persist = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: AppData) => AppData)(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  const addIncome = (e: IncomeEntry) => persist(prev => ({ ...prev, incomes: [...prev.incomes, e] }));
  const updateIncome = (e: IncomeEntry) => persist(prev => ({ ...prev, incomes: prev.incomes.map(x => x.id === e.id ? e : x) }));
  const deleteIncome = (id: string) => persist(prev => ({ ...prev, incomes: prev.incomes.filter(x => x.id !== id) }));
  const addExpense = (e: ExpenseEntry) => persist(prev => ({ ...prev, expenses: [...prev.expenses, e] }));
  const updateExpense = (e: ExpenseEntry) => persist(prev => ({ ...prev, expenses: prev.expenses.map(x => x.id === e.id ? e : x) }));
  const deleteExpense = (id: string) => persist(prev => ({ ...prev, expenses: prev.expenses.filter(x => x.id !== id) }));
  const upsertSnapshot = (s: BalanceSheetSnapshot) => {
    persist(prev => {
      const exists = prev.snapshots.find(x => x.date === s.date && x.member === s.member);
      const snapshots = exists
        ? prev.snapshots.map(x => (x.date === s.date && x.member === s.member ? s : x))
        : [...prev.snapshots, s];
      return { ...prev, snapshots };
    });
  };
  const addNote = (date: string, member: FinanceMember, content: string) => {
    const note = { id: crypto.randomUUID(), date, member, content };
    persist(prev => ({ ...prev, notes: [...prev.notes, note] }));
  };
  const setData = (d: AppData) => persist(d);

  return (
    <AppContext.Provider value={{
      data,
      currentPage,
      setCurrentPage,
      selectedDate,
      setSelectedDate,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      upsertSnapshot,
      addNote,
      setData,
    }}>
      {children}
    </AppContext.Provider>
  );
};
