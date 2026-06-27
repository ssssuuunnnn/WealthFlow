import type { ReactNode } from 'react';
import { LayoutDashboard, PenLine, History, Settings } from 'lucide-react';
import { useApp } from '../../context/useApp';
import type { Page } from '../../types';

const navItems: { page: Page; label: string; icon: ReactNode }[] = [
  { page: 'dashboard', label: '主儀表板', icon: <LayoutDashboard size={20} /> },
  { page: 'data-entry', label: '數據輸入', icon: <PenLine size={20} /> },
  { page: 'history', label: '歷史查詢', icon: <History size={20} /> },
  { page: 'settings', label: '系統設定', icon: <Settings size={20} /> },
];

export const Sidebar = () => {
  const { currentPage, setCurrentPage } = useApp();
  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-slate-900 flex flex-col z-20">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-white font-bold text-lg leading-tight">💰 WealthFlow</h1>
        <p className="text-slate-400 text-xs mt-0.5">家庭財務羅盤</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
              ${currentPage === item.page
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">v1.0.0</p>
      </div>
    </aside>
  );
};
