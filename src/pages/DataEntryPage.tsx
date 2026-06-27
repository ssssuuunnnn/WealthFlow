import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Save, Copy } from 'lucide-react';
import { useApp } from '../context/useApp';
import type { IncomeEntry, ExpenseEntry, BalanceSheetSnapshot, TimeFrequency } from '../types';
import { safeNum } from '../utils/finance';

type ActiveTab = 'cashflow' | 'balance';
type MemberFilter = '本人' | '配偶' | '家庭合計';

const MEMBERS: MemberFilter[] = ['本人', '配偶', '家庭合計'];

const INCOME_STRUCTURE = [
  {
    category: '工作收入' as const,
    subcategories: ['薪資', '獎金(三節/年終)', '加班費', '兼職收入', '營業分紅'],
  },
  {
    category: '理財收入' as const,
    subcategories: ['利息', '股利/基金收入', '租金收入', '投資收入'],
  },
];

const EXPENSE_STRUCTURE = [
  {
    category: '生活費' as const,
    subcategories: ['食', '衣', '住', '行', '醫療'],
  },
  {
    category: '貸款' as const,
    subcategories: ['房屋貸款', '房租', '信貸/車貸'],
  },
  {
    category: '撫育費用' as const,
    subcategories: ['父母撫養', '子女學雜費', '子女才藝'],
  },
  {
    category: '保險費' as const,
    subcategories: ['健保', '商業保險'],
  },
  {
    category: '理財支出' as const,
    subcategories: ['定期定額基金', '股票認股', '儲蓄險'],
  },
  {
    category: '稅賦' as const,
    subcategories: ['所得稅', '地價稅/房屋稅'],
  },
  {
    category: '雜費' as const,
    subcategories: ['旅遊', '交際', '其他'],
  },
];

interface EntryDraft {
  [subcategory: string]: { amount: string; frequency: TimeFrequency };
}

const FreqSelect = ({ value, onChange }: { value: TimeFrequency; onChange: (v: TimeFrequency) => void }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value as TimeFrequency)}
    className="border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
  >
    {(['月', '季', '年'] as TimeFrequency[]).map(f => <option key={f} value={f}>{f}</option>)}
  </select>
);

const AccordionSection = ({
  title, color, children, defaultOpen = false,
}: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold ${color} transition-all duration-200`}
      >
        <span>{title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="px-4 pb-4 pt-2 bg-white space-y-2 transition-all duration-200">{children}</div>}
    </div>
  );
};

const blankSnapshot = (date: string, member: MemberFilter): BalanceSheetSnapshot => ({
  date,
  member,
  assets: {
    liquidAssets: { cashAndDeposit: 0, foreignDeposit: 0, taiwanDeposit: 0, stocks: 0, bonds: 0, fundsAndEtf: 0, others: 0 },
    selfUsedAssets: { realEstate: 0, car: 0 },
  },
  liabilities: {
    shortTerm: { creditCardAndShortTerm: 0 },
    longTerm: { houseLoan: 0, otherLoan: 0 },
  },
});

const BalanceSheetTab = ({ member, date }: { member: MemberFilter; date: string }) => {
  const { data, upsertSnapshot } = useApp();

  const existing = useMemo(
    () => data.snapshots.find(s => s.date === date && s.member === member),
    [data.snapshots, date, member],
  );

  const [form, setForm] = useState<BalanceSheetSnapshot>(existing ?? blankSnapshot(date, member));

  useEffect(() => {
    setForm(existing ?? blankSnapshot(date, member));
  }, [existing, date, member]);

  const setLA = (key: keyof BalanceSheetSnapshot['assets']['liquidAssets'], val: string) =>
    setForm(f => ({ ...f, assets: { ...f.assets, liquidAssets: { ...f.assets.liquidAssets, [key]: safeNum(val) } } }));
  const setSA = (key: keyof BalanceSheetSnapshot['assets']['selfUsedAssets'], val: string) =>
    setForm(f => ({ ...f, assets: { ...f.assets, selfUsedAssets: { ...f.assets.selfUsedAssets, [key]: safeNum(val) } } }));
  const setST = (val: string) =>
    setForm(f => ({ ...f, liabilities: { ...f.liabilities, shortTerm: { creditCardAndShortTerm: safeNum(val) } } }));
  const setLT = (key: 'houseLoan' | 'otherLoan', val: string) =>
    setForm(f => ({ ...f, liabilities: { ...f.liabilities, longTerm: { ...f.liabilities.longTerm, [key]: safeNum(val) } } }));

  const fillLastMonth = () => {
    const [y, m] = date.split('-').map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    const last = data.snapshots.find(s => s.date === prev && s.member === member);
    if (last) {
      setForm({ ...last, date, member });
      return;
    }
    alert('找不到上月快照資料');
  };

  const handleSave = () => {
    upsertSnapshot({ ...form, date, member });
    alert('資產負債快照已儲存');
  };

  const field = (label: string, val: number, onChange: (v: string) => void) => (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type="number"
        value={val || ''}
        onChange={e => onChange(e.target.value)}
        className="w-36 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="0"
      />
    </div>
  );

  const la = form.assets.liquidAssets;
  const su = form.assets.selfUsedAssets;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={fillLastMonth} className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
          <Copy size={14} /> 同上月數據
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">📈 資產項目</h4>
          <div className="bg-emerald-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 mb-2">生息資產</p>
            {field('現金/活存/支存', la.cashAndDeposit, v => setLA('cashAndDeposit', v))}
            {field('外幣存款/貨幣基金', la.foreignDeposit, v => setLA('foreignDeposit', v))}
            {field('台幣定存', la.taiwanDeposit, v => setLA('taiwanDeposit', v))}
            {field('股票市值', la.stocks, v => setLA('stocks', v))}
            {field('債券', la.bonds, v => setLA('bonds', v))}
            {field('共同基金/ETF', la.fundsAndEtf, v => setLA('fundsAndEtf', v))}
            {field('其他(期貨/儲蓄險等)', la.others, v => setLA('others', v))}
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 mb-2">自用資產</p>
            {field('自用房屋土地估值', su.realEstate, v => setSA('realEstate', v))}
            {field('自用汽車', su.car, v => setSA('car', v))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold text-rose-700 text-sm uppercase tracking-wide">📉 負債項目</h4>
          <div className="bg-rose-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-rose-700 mb-2">消費性負債</p>
            {field('信用卡未繳/民間借貸', form.liabilities.shortTerm.creditCardAndShortTerm, setST)}
          </div>
          <div className="bg-rose-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-rose-700 mb-2">長期擔保負債</p>
            {field('自用房屋貸款', form.liabilities.longTerm.houseLoan, v => setLT('houseLoan', v))}
            {field('信貸/車貸/保單貸款', form.liabilities.longTerm.otherLoan, v => setLT('otherLoan', v))}
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
          <Save size={16} /> 儲存資產負債快照
        </button>
      </div>
    </div>
  );
};

export const DataEntryPage = () => {
  const {
    data,
    selectedDate,
    setSelectedDate,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addNote,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashflow');
  const [member, setMember] = useState<MemberFilter>('本人');
  const [note, setNote] = useState('');

  const incomeDraft = useMemo((): EntryDraft => {
    const entries = data.incomes.filter(e => e.date === selectedDate && e.member === member);
    const draft: EntryDraft = {};
    entries.forEach(e => {
      draft[e.subcategory] = { amount: String(e.amount), frequency: e.frequency };
    });
    return draft;
  }, [data.incomes, selectedDate, member]);

  const expenseDraft = useMemo((): EntryDraft => {
    const entries = data.expenses.filter(e => e.date === selectedDate && e.member === member);
    const draft: EntryDraft = {};
    entries.forEach(e => {
      draft[e.subcategory] = { amount: String(e.amount), frequency: e.frequency };
    });
    return draft;
  }, [data.expenses, selectedDate, member]);

  const [localIncome, setLocalIncome] = useState<EntryDraft>(incomeDraft);
  const [localExpense, setLocalExpense] = useState<EntryDraft>(expenseDraft);

  useEffect(() => {
    setLocalIncome(incomeDraft);
  }, [incomeDraft]);

  useEffect(() => {
    setLocalExpense(expenseDraft);
  }, [expenseDraft]);

  const setIncomeField = (sub: string, field: 'amount' | 'frequency', val: string) =>
    setLocalIncome(d => ({ ...d, [sub]: { amount: d[sub]?.amount ?? '0', frequency: d[sub]?.frequency ?? '月', [field]: val } }));

  const setExpenseField = (sub: string, field: 'amount' | 'frequency', val: string) =>
    setLocalExpense(d => ({ ...d, [sub]: { amount: d[sub]?.amount ?? '0', frequency: d[sub]?.frequency ?? '月', [field]: val } }));

  const handleSave = () => {
    INCOME_STRUCTURE.forEach(({ category, subcategories }) => {
      subcategories.forEach(sub => {
        const existing = data.incomes.find(e => e.date === selectedDate && e.member === member && e.subcategory === sub);
        const draft = localIncome[sub];
        const amount = safeNum(draft?.amount);
        if (amount > 0) {
          const entry: IncomeEntry = {
            id: existing?.id ?? crypto.randomUUID(),
            date: selectedDate,
            member,
            category,
            subcategory: sub,
            frequency: draft?.frequency ?? '月',
            amount,
          };
          if (existing) updateIncome(entry);
          else addIncome(entry);
        } else if (existing) {
          deleteIncome(existing.id);
        }
      });
    });

    EXPENSE_STRUCTURE.forEach(({ category, subcategories }) => {
      subcategories.forEach(sub => {
        const existing = data.expenses.find(e => e.date === selectedDate && e.member === member && e.subcategory === sub);
        const draft = localExpense[sub];
        const amount = safeNum(draft?.amount);
        if (amount > 0) {
          const entry: ExpenseEntry = {
            id: existing?.id ?? crypto.randomUUID(),
            date: selectedDate,
            member,
            category,
            subcategory: sub,
            frequency: draft?.frequency ?? '月',
            amount,
          };
          if (existing) updateExpense(entry);
          else addExpense(entry);
        } else if (existing) {
          deleteExpense(existing.id);
        }
      });
    });

    if (note.trim()) {
      addNote(selectedDate, member, note.trim());
      setNote('');
    }

    alert('資料已儲存！');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {MEMBERS.map(m => (
            <button
              key={m}
              onClick={() => setMember(m)}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${member === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {[['cashflow', '現金流輸入'], ['balance', '資產負債快照']].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ActiveTab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px
              ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'cashflow' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">💰 現金收入</h4>
              {INCOME_STRUCTURE.map(({ category, subcategories }) => (
                <AccordionSection key={category} title={category} color="bg-emerald-50 text-emerald-800 hover:bg-emerald-100" defaultOpen>
                  {subcategories.map(sub => (
                    <div key={sub} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-32 shrink-0">{sub}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={localIncome[sub]?.amount ?? ''}
                        onChange={e => setIncomeField(sub, 'amount', e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <FreqSelect
                        value={(localIncome[sub]?.frequency as TimeFrequency) ?? '月'}
                        onChange={v => setIncomeField(sub, 'frequency', v)}
                      />
                    </div>
                  ))}
                </AccordionSection>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-rose-700 text-sm uppercase tracking-wide">💸 現金支出</h4>
              {EXPENSE_STRUCTURE.map(({ category, subcategories }) => (
                <AccordionSection key={category} title={category} color="bg-rose-50 text-rose-800 hover:bg-rose-100">
                  {subcategories.map(sub => (
                    <div key={sub} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-32 shrink-0">{sub}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={localExpense[sub]?.amount ?? ''}
                        onChange={e => setExpenseField(sub, 'amount', e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <FreqSelect
                        value={(localExpense[sub]?.frequency as TimeFrequency) ?? '月'}
                        onChange={v => setExpenseField(sub, 'frequency', v)}
                      />
                    </div>
                  ))}
                </AccordionSection>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">備註說明</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="請輸入本月財務備忘..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex justify-end">
              <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
                <Save size={16} /> 儲存當月收支資料
              </button>
            </div>
          </div>
        </div>
      ) : (
        <BalanceSheetTab member={member} date={selectedDate} />
      )}
    </div>
  );
};
