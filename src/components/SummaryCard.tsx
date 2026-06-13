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
  gradient = 'from-white to-gray-50'
}: SummaryCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group hover:scale-[1.02] h-full`}>

      {/* Subtle animated shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

      {/* Faint floating glow behind icon area */}
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none" style={{ backgroundColor: iconColor }} />

      <div className="relative flex flex-col gap-4">

        {/* Row 1: Icon (rounded-square, soft bg) + Trend (plain ↑ 2, green text) */}
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transform group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: iconBgColor }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>

          {trend && (
            <div className={`flex items-center gap-0.5 text-sm font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Row 2 & 3: Big number + Label */}
        <div className="space-y-1">
          <div className="text-4xl font-bold text-gray-900 leading-none tracking-tight">{value}</div>
          <div className="text-sm font-medium text-gray-400">{title}</div>
        </div>

      </div>
    </div>
  );
}