import { useMemo, useState } from 'react';
import { Search, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../context/useApp';
import { toMonthly, toAnnual, formatCurrency } from '../utils/finance';
import Papa from 'papaparse';

type ViewMode = 'table' | 'timeline';
type ReportType = '收入' | '支出' | '全部';
type MemberOpt = '全部' | '本人' | '配偶' | '家庭合計';

const PAGE_SIZE = 10;

export const HistoryPage = () => {
  const { data, deleteIncome, deleteExpense } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberFilter, setMemberFilter] = useState<MemberOpt>('全部');
  const [reportType, setReportType] = useState<ReportType>('全部');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  type Row = {
    id: string;
    date: string;
    member: string;
    category: string;
    subcategory: string;
    monthly: number;
    annual: number;
    type: 'income' | 'expense';
  };

  const rows: Row[] = useMemo(() => {
    const incomeRows: Row[] = (reportType !== '支出' ? data.incomes : []).map(e => ({
      id: e.id,
      date: e.date,
      member: e.member,
      category: e.category,
      subcategory: e.subcategory,
      monthly: toMonthly(e.amount, e.frequency),
      annual: toAnnual(e.amount, e.frequency),
      type: 'income',
    }));
    const expenseRows: Row[] = (reportType !== '收入' ? data.expenses : []).map(e => ({
      id: e.id,
      date: e.date,
      member: e.member,
      category: e.category,
      subcategory: e.subcategory,
      monthly: toMonthly(e.amount, e.frequency),
      annual: toAnnual(e.amount, e.frequency),
      type: 'expense',
    }));
    return [...incomeRows, ...expenseRows]
      .filter(r => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate))
      .filter(r => memberFilter === '全部' || r.member === memberFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data, startDate, endDate, memberFilter, reportType]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (row: Row) => {
    if (!confirm('確定刪除此記錄？')) return;
    if (row.type === 'income') deleteIncome(row.id);
    else deleteExpense(row.id);
  };

  const handleExport = () => {
    const csv = Papa.unparse(rows.map(r => ({
      日期: r.date,
      成員: r.member,
      類型: r.type === 'income' ? '收入' : '支出',
      大類: r.category,
      細項: r.subcategory,
      月金額: r.monthly.toFixed(0),
      年金額: r.annual.toFixed(0),
    })));
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wealthflow_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeline = useMemo(() => {
    const months = [...new Set(rows.map(r => r.date))].sort((a, b) => b.localeCompare(a));
    return months.map(month => ({
      month,
      rows: rows.filter(r => r.date === month),
      totalIncome: rows.filter(r => r.date === month && r.type === 'income').reduce((s, r) => s + r.monthly, 0),
      totalExpense: rows.filter(r => r.date === month && r.type === 'expense').reduce((s, r) => s + r.monthly, 0),
    }));
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">開始月份</label>
          <input
            type="month"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">結束月份</label>
          <input
            type="month"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">成員</label>
          <select
            value={memberFilter}
            onChange={e => { setMemberFilter(e.target.value as MemberOpt); setPage(1); }}
            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {['全部', '本人', '配偶', '家庭合計'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">類型</label>
          <select
            value={reportType}
            onChange={e => { setReportType(e.target.value as ReportType); setPage(1); }}
            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {['全部', '收入', '支出'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-blue-700 transition-colors">
          <Search size={14} /> 查詢
        </button>
        <button onClick={handleExport} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
          <Download size={14} /> 匯出 CSV
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">檢視模式：</span>
        {[['table', '經典表格'], ['timeline', '時間軸動態']].map(([mode, label]) => (
          <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={viewMode === mode} onChange={() => setViewMode(mode as ViewMode)} className="accent-blue-600" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['時間', '成員', '項目大類', '項目細項', '金額(月)', '金額(年)', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">尚無符合條件的記錄</td></tr>
                ) : pageRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700">{row.date}</td>
                    <td className="px-4 py-3 text-gray-600">{row.member}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.subcategory}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.monthly > 0 ? formatCurrency(row.monthly) : '--'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(row.annual)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(row)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-500">合計</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(rows.reduce((s, r) => s + r.monthly, 0))}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(rows.reduce((s, r) => s + r.annual, 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 gap-3 flex-wrap">
              <span>顯示 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, rows.length)} 筆，共 {rows.length} 筆資料</span>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">◄</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded text-sm ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">►</button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {timeline.length === 0 && <div className="text-center py-12 text-gray-400">尚無符合條件的記錄</div>}
          {timeline.map(({ month, rows: mRows, totalIncome, totalExpense }) => {
            const isExpanded = expandedMonths.has(month);
            return (
              <div key={month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedMonths(s => {
                    const n = new Set(s);
                    if (isExpanded) n.delete(month);
                    else n.add(month);
                    return n;
                  })}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-semibold text-gray-800">{month}</span>
                    <span className="text-sm text-emerald-600">收入 {formatCurrency(totalIncome)}</span>
                    <span className="text-sm text-rose-600">支出 {formatCurrency(totalExpense)}</span>
                    <span className={`text-sm font-medium ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      淨 {formatCurrency(totalIncome - totalExpense)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{mRows.length} 筆記錄</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <div className="space-y-1.5">
                      {mRows.map(row => (
                        <div key={row.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0 gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`w-1.5 h-1.5 rounded-full ${row.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-gray-500">{row.member}</span>
                            <span className="text-gray-700">{row.category} · {row.subcategory}</span>
                          </div>
                          <span className={`font-medium ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(row.monthly)}/月
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
