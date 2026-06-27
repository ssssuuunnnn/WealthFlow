import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  color?: 'green' | 'red' | 'blue' | 'amber';
  icon?: ReactNode;
}

const colorMap = {
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  red: 'bg-rose-50 text-rose-600 border-rose-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
};

export const KpiCard = ({ title, value, subtitle, trend, color = 'blue', icon }: KpiCardProps) => (
  <div className={`rounded-xl border p-5 ${colorMap[color]} transition-all duration-200`}>
    <div className="flex items-start justify-between gap-4">
      <p className="text-sm font-medium opacity-75">{title}</p>
      {icon && <span className="opacity-60">{icon}</span>}
    </div>
    <p className="text-2xl font-bold mt-2 truncate">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      {trend !== undefined && (
        <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
      {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
    </div>
  </div>
);
