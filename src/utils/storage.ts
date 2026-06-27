import type { AppData } from '../types';

const KEY = 'wealthflow_data';

export const defaultData = (): AppData => ({
  incomes: [],
  expenses: [],
  snapshots: [],
  notes: [],
});

export const loadData = (): AppData => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    return JSON.parse(raw) as AppData;
  } catch {
    return defaultData();
  }
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

export const exportJson = (data: AppData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wealthflow_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importJson = (file: File): Promise<AppData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.readAsText(file);
  });
