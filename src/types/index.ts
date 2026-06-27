export type FinanceMember = '本人' | '配偶' | '家庭合計';
export type TimeFrequency = '月' | '季' | '年';

export interface IncomeEntry {
  id: string;
  date: string; // YYYY-MM
  member: FinanceMember;
  category: '工作收入' | '理財收入';
  subcategory: string;
  frequency: TimeFrequency;
  amount: number;
  note?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM
  member: FinanceMember;
  category: '生活費' | '貸款' | '撫育費用' | '保險費' | '理財支出' | '稅賦' | '雜費';
  subcategory: string;
  frequency: TimeFrequency;
  amount: number;
  note?: string;
}

export interface LiquidAssets {
  cashAndDeposit: number;
  foreignDeposit: number;
  taiwanDeposit: number;
  stocks: number;
  bonds: number;
  fundsAndEtf: number;
  others: number;
}

export interface SelfUsedAssets {
  realEstate: number;
  car: number;
}

export interface BalanceSheetSnapshot {
  date: string; // YYYY-MM
  member: FinanceMember;
  assets: {
    liquidAssets: LiquidAssets;
    selfUsedAssets: SelfUsedAssets;
  };
  liabilities: {
    shortTerm: {
      creditCardAndShortTerm: number;
    };
    longTerm: {
      houseLoan: number;
      otherLoan: number;
    };
  };
}

export interface AppData {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  snapshots: BalanceSheetSnapshot[];
  notes: { id: string; date: string; member: FinanceMember; content: string }[];
}

export type Page = 'dashboard' | 'data-entry' | 'history' | 'settings';
