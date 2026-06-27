import { Bell, User } from 'lucide-react';
import { useApp } from '../../context/useApp';
import type { Page } from '../../types';

const pageTitle: Record<Page, string> = {
  dashboard: '主儀表板',
  'data-entry': '數據輸入中心',
  history: '歷史紀錄查詢',
  settings: '系統設定',
};

export const TopNavbar = () => {
  const { currentPage } = useApp();
  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <h2 className="text-gray-800 font-semibold text-base">{pageTitle[currentPage]}</h2>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        </button>
      </div>
    </header>
  );
};
