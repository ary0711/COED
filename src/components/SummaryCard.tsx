import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: string;
  trendUp?: boolean;
  gradient?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  trendUp,
  gradient = 'from-white to-blue-50'
}: SummaryCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 backdrop-blur-sm group hover:scale-105`}>
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Floating icon background */}
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: iconColor }}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: iconBgColor }}>
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
}
