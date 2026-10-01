import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type KPICardColor = 'indigo' | 'blue' | 'emerald' | 'green' | 'purple' | 'amber' | 'orange' | 'rose' | 'sky';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: KPICardColor;
  badge?: {
    text: string;
    isPositive?: boolean;
    icon?: LucideIcon;
    customColor?: string;
  } | string;
  trendText?: string;
  subtitle?: string;
  chartType?: 'line' | 'bar' | 'none';
  onClick?: () => void;
  className?: string;
}

interface ColorConfig {
  iconBox: string;
  iconColor: string;
  glowColor: string;
  chartStroke: string;
  chartDot: string;
  chartFill: string;
  barGradient: string;
  trendBadge: string;
}

const colorMap: Record<KPICardColor, ColorConfig> = {
  indigo: {
    iconBox: 'bg-indigo-50/90 border border-white/90',
    iconColor: 'text-[#4f46e5]',
    glowColor: 'bg-indigo-400/10',
    chartStroke: '#6366f1',
    chartDot: '#4f46e5',
    chartFill: 'rgba(99, 102, 241, 0.12)',
    barGradient: 'bg-gradient-to-t from-indigo-500/15 to-indigo-500/75',
    trendBadge: 'bg-indigo-50 text-[#4f46e5]',
  },
  blue: {
    iconBox: 'bg-blue-50/90 border border-white/90',
    iconColor: 'text-blue-600',
    glowColor: 'bg-blue-400/10',
    chartStroke: '#3b82f6',
    chartDot: '#2563eb',
    chartFill: 'rgba(59, 130, 246, 0.12)',
    barGradient: 'bg-gradient-to-t from-blue-500/15 to-blue-500/75',
    trendBadge: 'bg-blue-50 text-blue-600',
  },
  emerald: {
    iconBox: 'bg-emerald-50/90 border border-white/90',
    iconColor: 'text-emerald-600',
    glowColor: 'bg-emerald-400/10',
    chartStroke: '#10b981',
    chartDot: '#059669',
    chartFill: 'rgba(16, 185, 129, 0.12)',
    barGradient: 'bg-gradient-to-t from-emerald-500/15 to-emerald-500/75',
    trendBadge: 'bg-emerald-50 text-emerald-600',
  },
  green: {
    iconBox: 'bg-emerald-50/90 border border-white/90',
    iconColor: 'text-emerald-600',
    glowColor: 'bg-emerald-400/10',
    chartStroke: '#10b981',
    chartDot: '#059669',
    chartFill: 'rgba(16, 185, 129, 0.12)',
    barGradient: 'bg-gradient-to-t from-emerald-500/15 to-emerald-500/75',
    trendBadge: 'bg-emerald-50 text-emerald-600',
  },
  purple: {
    iconBox: 'bg-purple-50/90 border border-white/90',
    iconColor: 'text-purple-600',
    glowColor: 'bg-purple-400/10',
    chartStroke: '#a855f7',
    chartDot: '#9333ea',
    chartFill: 'rgba(168, 85, 247, 0.12)',
    barGradient: 'bg-gradient-to-t from-purple-500/15 to-purple-500/75',
    trendBadge: 'bg-purple-50 text-purple-600',
  },
  amber: {
    iconBox: 'bg-amber-50/90 border border-white/90',
    iconColor: 'text-amber-600',
    glowColor: 'bg-amber-400/10',
    chartStroke: '#f59e0b',
    chartDot: '#d97706',
    chartFill: 'rgba(245, 158, 11, 0.12)',
    barGradient: 'bg-gradient-to-t from-amber-500/15 to-amber-500/75',
    trendBadge: 'bg-amber-50 text-amber-600',
  },
  orange: {
    iconBox: 'bg-amber-50/90 border border-white/90',
    iconColor: 'text-amber-600',
    glowColor: 'bg-amber-400/10',
    chartStroke: '#f59e0b',
    chartDot: '#d97706',
    chartFill: 'rgba(245, 158, 11, 0.12)',
    barGradient: 'bg-gradient-to-t from-amber-500/15 to-amber-500/75',
    trendBadge: 'bg-amber-50 text-amber-600',
  },
  rose: {
    iconBox: 'bg-rose-50/90 border border-white/90',
    iconColor: 'text-rose-600',
    glowColor: 'bg-rose-400/10',
    chartStroke: '#f43f5e',
    chartDot: '#e11d48',
    chartFill: 'rgba(244, 63, 94, 0.12)',
    barGradient: 'bg-gradient-to-t from-rose-500/15 to-rose-500/75',
    trendBadge: 'bg-rose-50 text-rose-600',
  },
  sky: {
    iconBox: 'bg-sky-50/90 border border-white/90',
    iconColor: 'text-sky-600',
    glowColor: 'bg-sky-400/10',
    chartStroke: '#0ea5e9',
    chartDot: '#0284c7',
    chartFill: 'rgba(14, 165, 233, 0.12)',
    barGradient: 'bg-gradient-to-t from-sky-500/15 to-sky-500/75',
    trendBadge: 'bg-sky-50 text-sky-600',
  },
};

const defaultBars = [35, 52, 40, 60, 30, 50, 42, 68, 55, 45, 75, 78, 90, 100];

export default function KPICard({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  badge,
  subtitle,
  chartType,
  onClick,
  className = '',
}: KPICardProps) {
  const conf = colorMap[color] || colorMap.indigo;

  // Auto-detect chart type if not specified
  const effectiveChartType = chartType ?? (
    color === 'emerald' || color === 'green' || color === 'amber' || color === 'orange' || color === 'rose'
      ? 'bar'
      : 'line'
  );

  return (
    <div
      onClick={onClick}
      className={`relative p-3.5 sm:p-4 overflow-hidden bg-white/85 backdrop-blur-xl border border-white/90 rounded-2xl shadow-[0_3px_15px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''
        } ${className}`}
    >
      {/* Decorative Subtle Glow */}
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${conf.glowColor} blur-lg pointer-events-none opacity-80`}
      />

      {/* TOP ROW: ICON & BADGE */}
      <div className="relative z-10 flex items-center justify-between">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${conf.iconBox} ${conf.iconColor} shadow-2xs flex-shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>

        {badge && (
          <div>
            {typeof badge === 'string' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold shadow-2xs">
                {badge}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-2xs ${badge.customColor
                  ? badge.customColor
                  : badge.isPositive === true
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                    : badge.isPositive === false
                      ? 'text-rose-700 bg-rose-50 border border-rose-100'
                      : conf.trendBadge
                  }`}
              >
                {badge.icon && <badge.icon className="w-2.5 h-2.5 flex-shrink-0" />}
                <span>{badge.text}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* MIDDLE: TITLE & VALUE */}
      <div className="relative z-10 mt-2 mb-0.5">
        <p className="text-slate-400 font-bold text-[10px] sm:text-[11px] tracking-wider uppercase truncate">
          {title}
        </p>
        <h3
          title={subtitle || (typeof value === 'string' ? value : String(value))}
          className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5 truncate"
        >
          {value}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* BOTTOM VISUAL: COMPACT SPARKLINE / BARS */}
      {effectiveChartType === 'line' && (
        <div className="relative w-full h-[20px] mt-0.5 pointer-events-none z-0">
          <svg viewBox="0 0 400 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <path
              fill={conf.chartFill}
              d="
                M0,65
                C40,40 70,45 100,58
                C130,72 155,55 185,48
                C215,40 230,55 260,42
                C295,25 320,38 345,22
                C370,8 385,12 400,5
                L400,80
                L0,80 Z
              "
            />
            <path
              fill="none"
              stroke={conf.chartStroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="
                M0,65
                C40,40 70,45 100,58
                C130,72 155,55 185,48
                C215,40 230,55 260,42
                C295,25 320,38 345,22
                C370,8 385,12 400,5
              "
            />
            <circle cx="400" cy="5" r="5" fill={conf.chartDot} stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      )}

      {effectiveChartType === 'bar' && (
        <div className="relative w-full h-[18px] mt-0.5 flex items-end gap-1 pointer-events-none z-0 opacity-80">
          {defaultBars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}%` }}
              className={`flex-1 min-w-[2.5px] rounded-t-[2px] ${conf.barGradient}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
