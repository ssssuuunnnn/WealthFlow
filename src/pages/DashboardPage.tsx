import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, PiggyBank, Building2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/useApp';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SankeyChart } from '../components/dashboard/SankeyChart';
import {
  toMonthly, totalAssets, totalLiabilities, netWorth, debtRatio,
  formatCurrency, formatCompact, safeNum,
} from '../utils/finance';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const DashboardPage = () => {
  const { data, selectedDate, setSelectedDate } = useApp();
  const year = selectedDate.slice(0, 4);

  const monthIncome = useMemo(
    () => data.incomes
      .filter(e => e.date === selectedDate)
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0),
    [data.incomes, selectedDate],
  );

  const monthExpense = useMemo(
    () => data.expenses
      .filter(e => e.date === selectedDate)
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0),
    [data.expenses, selectedDate],
  );

  const netCashFlow = monthIncome - monthExpense;

  const latestSnapshot = useMemo(() => {
    const snaps = data.snapshots
      .filter(s => s.member === '家庭合計')
      .sort((a, b) => b.date.localeCompare(a.date));
    return snaps[0] ?? null;
  }, [data.snapshots]);

  const nw = latestSnapshot ? netWorth(latestSnapshot) : 0;
  const dr = latestSnapshot ? debtRatio(latestSnapshot) : 0;

  const investmentExpense = useMemo(
    () => data.expenses
      .filter(e => e.date === selectedDate && e.category === '理財支出')
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0),
    [data.expenses, selectedDate],
  );

  const savingsRate = monthIncome > 0
    ? ((investmentExpense + Math.max(0, netCashFlow - investmentExpense)) / monthIncome) * 100
    : 0;

  const sankeyNodes = [
    { name: '工作收入', color: '#059669' },
    { name: '理財收入', color: '#0284c7' },
    { name: '總收入', color: '#6366f1' },
    { name: '生活費', color: '#f43f5e' },
    { name: '貸款', color: '#ef4444' },
    { name: '撫育費用', color: '#f97316' },
    { name: '保險費', color: '#eab308' },
    { name: '理財支出', color: '#3b82f6' },
    { name: '稅賦雜費', color: '#8b5cf6' },
    { name: '超額儲蓄', color: '#10b981' },
  ];

  const incomeByType = useMemo(() => {
    const workIncome = data.incomes
      .filter(e => e.date === selectedDate && e.category === '工作收入')
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
    const financeIncome = data.incomes
      .filter(e => e.date === selectedDate && e.category === '理財收入')
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
    return { workIncome, financeIncome };
  }, [data.incomes, selectedDate]);

  const expenseByCategory = useMemo(() => {
    const cats = ['生活費', '貸款', '撫育費用', '保險費', '理財支出', '稅賦', '雜費'] as const;
    return cats.reduce((acc, cat) => {
      acc[cat] = data.expenses
        .filter(e => e.date === selectedDate && e.category === cat)
        .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
      return acc;
    }, {} as Record<string, number>);
  }, [data.expenses, selectedDate]);

  const sankeyLinks = useMemo(() => {
    const surplus = Math.max(0, monthIncome - monthExpense);
    return [
      { source: 0, target: 2, value: incomeByType.workIncome },
      { source: 1, target: 2, value: incomeByType.financeIncome },
      { source: 2, target: 3, value: expenseByCategory['生活費'] ?? 0 },
      { source: 2, target: 4, value: expenseByCategory['貸款'] ?? 0 },
      { source: 2, target: 5, value: expenseByCategory['撫育費用'] ?? 0 },
      { source: 2, target: 6, value: expenseByCategory['保險費'] ?? 0 },
      { source: 2, target: 7, value: expenseByCategory['理財支出'] ?? 0 },
      { source: 2, target: 8, value: (expenseByCategory['稅賦'] ?? 0) + (expenseByCategory['雜費'] ?? 0) },
      { source: 2, target: 9, value: surplus },
    ];
  }, [incomeByType, expenseByCategory, monthIncome, monthExpense]);

  const trendData = useMemo(
    () => MONTHS.map((m, i) => {
      const date = `${year}-${String(i + 1).padStart(2, '0')}`;
      const inc = data.incomes.filter(e => e.date === date).reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
      const exp = data.expenses.filter(e => e.date === date).reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
      return { month: m, income: Math.round(inc), expense: Math.round(exp) };
    }),
    [data, year],
  );

  const barData = useMemo(() => {
    if (!latestSnapshot) return [];
    const la = latestSnapshot.assets.liquidAssets;
    const su = latestSnapshot.assets.selfUsedAssets;
    const liq = safeNum(la.cashAndDeposit) + safeNum(la.foreignDeposit) + safeNum(la.taiwanDeposit) +
      safeNum(la.stocks) + safeNum(la.bonds) + safeNum(la.fundsAndEtf) + safeNum(la.others);
    const selfUsed = safeNum(su.realEstate) + safeNum(su.car);
    const shortTerm = safeNum(latestSnapshot.liabilities.shortTerm.creditCardAndShortTerm);
    const longTerm = safeNum(latestSnapshot.liabilities.longTerm.houseLoan) + safeNum(latestSnapshot.liabilities.longTerm.otherLoan);
    return [
      { name: '資產', liquid: liq, selfUsed, shortTerm: 0, longTerm: 0 },
      { name: '負債', liquid: 0, selfUsed: 0, shortTerm, longTerm },
    ];
  }, [latestSnapshot]);

  const recentNotes = data.notes.slice(-5).reverse();
  const snapshotDate = latestSnapshot?.date ?? selectedDate;
  const ta = latestSnapshot ? totalAssets(latestSnapshot) : 0;
  const tl = latestSnapshot ? totalLiabilities(latestSnapshot) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input
          type="month"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">目前檢視期間</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="當月淨現金流"
          value={formatCurrency(netCashFlow)}
          color={netCashFlow >= 0 ? 'green' : 'red'}
          icon={<DollarSign size={20} />}
          subtitle={netCashFlow >= 0 ? '正向現金流' : '注意赤字'}
        />
        <KpiCard
          title="家庭儲蓄理財率"
          value={`${savingsRate.toFixed(1)}%`}
          color={savingsRate >= 30 ? 'green' : savingsRate >= 15 ? 'blue' : 'amber'}
          icon={<PiggyBank size={20} />}
          subtitle={savingsRate >= 30 ? '優良' : savingsRate >= 15 ? '良好' : '待改善'}
        />
        <KpiCard
          title="家庭淨資產"
          value={`$${formatCompact(nw)}`}
          color="blue"
          icon={<Building2 size={20} />}
          subtitle={latestSnapshot ? `截至 ${snapshotDate}` : '尚無快照'}
        />
        <KpiCard
          title="整體負債比率"
          value={`${dr.toFixed(1)}%`}
          color={dr <= 50 ? 'green' : dr <= 70 ? 'amber' : 'red'}
          icon={<ShieldAlert size={20} />}
          subtitle={dr <= 50 ? '安全' : dr <= 70 ? '注意' : '警戒'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">資金流向桑基圖</h3>
          <div className="h-72">
            <SankeyChart nodes={sankeyNodes} links={sankeyLinks} width={540} height={280} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3 className="font-semibold text-gray-800">資產負債對比圖</h3>
            <span className="text-xs text-gray-500">資產 {formatCurrency(ta)} / 負債 {formatCurrency(tl)}</span>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Legend />
                <Bar dataKey="liquid" name="生息資產" stackId="a" fill="#059669" />
                <Bar dataKey="selfUsed" name="自用資產" stackId="a" fill="#34d399" />
                <Bar dataKey="shortTerm" name="短期負債" stackId="b" fill="#f43f5e" />
                <Bar dataKey="longTerm" name="長期負債" stackId="b" fill="#9f1239" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">尚無資產負債快照資料</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">收支歷史趨勢 ({year}年)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v: number) => formatCompact(v)} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Legend />
            <Line type="monotone" dataKey="income" name="總收入" stroke="#059669" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expense" name="總支出" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {recentNotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">💡 財務備忘與動態提示</h3>
          <div className="space-y-2">
            {recentNotes.map(note => (
              <div key={note.id} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 shrink-0 font-medium">{note.date}</span>
                <span className="text-blue-600 font-medium shrink-0">{note.member}</span>
                <span>{note.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
