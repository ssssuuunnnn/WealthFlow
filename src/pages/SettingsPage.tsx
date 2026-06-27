import { useRef, type ChangeEvent, type ReactNode } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { exportJson, importJson, defaultData } from '../utils/storage';

export const SettingsPage = () => {
  const { data, setData } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => exportJson(data);

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importJson(file);
      setData(imported);
      alert('資料匯入成功！');
    } catch {
      alert('匯入失敗：JSON 格式不正確');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('確定要清除所有資料？此操作無法復原！')) {
      setData(defaultData());
      alert('資料已清除');
    }
  };

  const Card = ({ title, desc, children }: { title: string; desc: string; children: ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{desc}</p>
      {children}
    </div>
  );

  const stats = {
    incomes: data.incomes.length,
    expenses: data.expenses.length,
    snapshots: data.snapshots.length,
    notes: data.notes.length,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="資料概覽" desc="目前儲存在瀏覽器中的資料統計">
        <div className="grid grid-cols-2 gap-3">
          {[['收入記錄', stats.incomes], ['支出記錄', stats.expenses], ['資產負債快照', stats.snapshots], ['備忘錄', stats.notes]].map(([label, count]) => (
            <div key={label as string} className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="匯出資料" desc="將所有財務資料匯出為 JSON 檔案，可用於備份或遷移">
        <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
          <Download size={16} /> 匯出 JSON 備份
        </button>
      </Card>

      <Card title="匯入資料" desc="從 JSON 備份檔案還原資料（將覆蓋現有資料）">
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
          <Upload size={16} /> 選擇 JSON 檔案匯入
        </button>
      </Card>

      <Card title="清除資料" desc="清除瀏覽器中所有 WealthFlow 資料（不可復原）">
        <button onClick={handleReset} className="flex items-center gap-2 bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-700 transition-colors">
          <Trash2 size={16} /> 清除所有資料
        </button>
      </Card>

      <Card title="關於" desc="">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>WealthFlow 家庭財務羅盤</strong> v1.0.0</p>
          <p>純前端 SPA，資料儲存於瀏覽器 localStorage</p>
          <p>技術棧：React + Vite + TypeScript + Tailwind CSS + Recharts + D3-Sankey</p>
        </div>
      </Card>
    </div>
  );
};
