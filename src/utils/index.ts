import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import type { Flight } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, fmt = 'HH:mm'): string {
  if (!dateStr) return '--';
  try {
    const d = parseISO(dateStr.replace(' ', 'T'));
    if (!isValid(d)) return '--';
    return format(d, fmt);
  } catch {
    return '--';
  }
}

export function formatDateFull(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy HH:mm');
}

export function formatCurrency(val: number, compact = false): string {
  if (compact) {
    if (val >= 1_000_000) return `₹${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

export function formatDelay(minutes: number): string {
  if (minutes === 0) return 'On Time';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `+${h}h ${m}m`;
  return `+${m}m`;
}

export function getFlightStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Departed': 'text-emerald-400',
    'Boarding': 'text-cyan-400',
    'Delayed': 'text-amber-400',
    'Cancelled': 'text-red-400',
    'Scheduled': 'text-purple-400',
    'On-Time': 'text-emerald-400',
    'Taxiing': 'text-blue-400',
    'Arrived': 'text-teal-400',
  };
  return map[status] ?? 'text-slate-400';
}

export function getFlightStatusBadge(status: string): string {
  const map: Record<string, string> = {
    'Departed': 'badge-departed',
    'Boarding': 'badge-boarding',
    'Delayed': 'badge-delayed',
    'Cancelled': 'badge-cancelled',
    'Scheduled': 'badge-scheduled',
    'On-Time': 'badge-on-time',
  };
  return map[status] ?? 'badge-scheduled';
}

export function getDelayReason(reason: string): string {
  const map: Record<string, string> = {
    'ATC': 'Air Traffic Control',
    'WX': 'Weather',
    'TECH': 'Technical Issue',
    'CREW': 'Crew Availability',
    'OPS': 'Operations',
    'SECURITY': 'Security',
    'FUEL': 'Fueling Delay',
  };
  return map[reason] ?? reason;
}

export function getAirlineColor(code: string): string {
  const colors: Record<string, string> = {
    'AI': '#FF6B00',
    'UK': '#8B5CF6',
    'SG': '#EF4444',
    'EK': '#10B981',
    'BA': '#1D4ED8',
    'LH': '#FBBF24',
    'SQ': '#06B6D4',
    'QR': '#7C3AED',
    'AF': '#F59E0B',
    'KL': '#3B82F6',
    '6E': '#0EA5E9',
    'IX': '#EC4899',
  };
  return colors[code] ?? '#64748B';
}

export function getRiskColor(score: number): string {
  if (score >= 0.7) return '#ef4444';
  if (score >= 0.4) return '#f59e0b';
  return '#10b981';
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function computeDelayPrediction(flight: Flight): { probability: number; label: string } {
  // Heuristic from data fields
  let score = 0;
  if (flight.delay_minutes > 0) score += 0.3;
  if (flight.delay_severity === 'Severe') score += 0.3;
  else if (flight.delay_severity === 'Moderate') score += 0.15;
  if (flight.risk_score > 0.6) score += 0.2;
  if (flight.is_holiday) score += 0.05;
  if (flight.time_of_day === 'Night') score += 0.05;
  score = Math.min(0.99, score);
  return {
    probability: Math.round(score * 100),
    label: score > 0.6 ? 'High Risk' : score > 0.3 ? 'Moderate Risk' : 'Low Risk',
  };
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
