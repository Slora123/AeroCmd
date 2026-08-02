import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'none';
  onClick?: () => void;
  hover?: boolean;
  padding?: boolean;
}

export function GlassCard({
  children, className, glow = 'none', onClick, hover = false, padding = true,
}: GlassCardProps) {
  const glowClass = {
    blue: 'glow-blue border-cyan-500/30',
    amber: 'glow-amber border-amber-500/30',
    red: 'glow-red border-red-500/30',
    green: 'glow-green border-emerald-500/30',
    purple: 'shadow-purple-500/30 border-purple-500/30',
    none: 'border-white/10',
  }[glow];

  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'glass-card relative pointer-events-auto overflow-hidden',
        'backdrop-blur-xl bg-slate-950/95 border shadow-lg rounded-xl',
        glowClass,
        padding && 'p-3',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Subtle ambient interior glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// ---- Stat Card ----
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendVal?: string;
  color?: 'blue' | 'amber' | 'red' | 'green' | 'purple';
  animate?: boolean;
}

export function StatCard({
  label, value, sub, icon, trend, trendVal, color = 'blue', animate = true,
}: StatCardProps) {
  const colorMap = {
    blue: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    green: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'glass-card p-3 relative overflow-hidden pointer-events-auto',
        'backdrop-blur-xl bg-slate-950/95 border shadow-lg rounded-xl',
        c.border
      )}
    >
      {/* background glow */}
      <div className={cn('absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10', c.bg)} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums', c.text)}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3', c.bg)}>
            <span className={c.text}>{icon}</span>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            'text-xs font-medium',
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendVal}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ---- Section Header ----
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

// ---- Status Badge ----
interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function Badge({ label, variant = 'default', size = 'sm', pulse = false }: BadgeProps) {
  const variantClass = {
    default: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }[variant];

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded border font-medium', variantClass, sizeClass)}>
      {pulse && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-400 status-blink': variant === 'success',
        'bg-amber-400 status-blink': variant === 'warning',
        'bg-red-400 status-blink': variant === 'danger',
        'bg-cyan-400 status-blink': variant === 'info',
      })} />}
      {label}
    </span>
  );
}

// ---- Progress Bar ----
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  animated?: boolean;
  label?: string;
}

export function ProgressBar({ value, max = 100, color = '#00d4ff', height = '4px', animated = true, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full relative"
          style={{ background: color }}
        >
          {animated && (
            <div className="absolute inset-0 rounded-full opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`, animation: 'shimmer 2s infinite' }} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ---- Live Dot ----
export function LiveDot({ active = true, size = 'sm' }: { active?: boolean; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5';
  return (
    <span className="relative inline-flex">
      <span className={cn(sz, 'rounded-full', active ? 'bg-cyan-400' : 'bg-slate-600')} />
      {active && (
        <span className={cn(sz, 'absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75')} />
      )}
    </span>
  );
}
