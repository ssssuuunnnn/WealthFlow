import type { IncomeEntry, ExpenseEntry, BalanceSheetSnapshot, TimeFrequency } from '../types';

export const safeNum = (v: unknown): number => Number(v) || 0;

// Convert any frequency amount to monthly
export const toMonthly = (amount: number, freq: TimeFrequency): number => {
  const a = safeNum(amount);
  if (freq === '月') return a;
  if (freq === '季') return a / 3;
  return a / 12; // 年
};

// Convert any frequency amount to annual
export const toAnnual = (amount: number, freq: TimeFrequency): number => {
  const a = safeNum(amount);
  if (freq === '月') return a * 12;
  if (freq === '季') return a * 4;
  return a;
};

export const totalAssets = (s: BalanceSheetSnapshot): number => {
  const l = s.assets.liquidAssets;
  const su = s.assets.selfUsedAssets;
  return safeNum(l.cashAndDeposit) + safeNum(l.foreignDeposit) + safeNum(l.taiwanDeposit) +
    safeNum(l.stocks) + safeNum(l.bonds) + safeNum(l.fundsAndEtf) + safeNum(l.others) +
    safeNum(su.realEstate) + safeNum(su.car);
};

export const totalLiabilities = (s: BalanceSheetSnapshot): number => {
  return safeNum(s.liabilities.shortTerm.creditCardAndShortTerm) +
    safeNum(s.liabilities.longTerm.houseLoan) +
    safeNum(s.liabilities.longTerm.otherLoan);
};

export const netWorth = (s: BalanceSheetSnapshot): number => totalAssets(s) - totalLiabilities(s);

export const debtRatio = (s: BalanceSheetSnapshot): number => {
  const ta = totalAssets(s);
  if (ta === 0) return 0;
  return (totalLiabilities(s) / ta) * 100;
};

export const monthlyIncome = (entries: IncomeEntry[], date: string, member?: string): number =>
  entries
    .filter(e => e.date === date && (!member || member === '全部' || e.member === member))
    .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);

export const monthlyExpense = (entries: ExpenseEntry[], date: string, member?: string): number =>
  entries
    .filter(e => e.date === date && (!member || member === '全部' || e.member === member))
    .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);

export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n);

export const formatCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};
