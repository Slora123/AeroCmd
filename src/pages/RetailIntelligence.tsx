import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, TrendingUp, BarChart2, CreditCard, Package } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { formatCurrency, cn } from '../utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
  PieChart, Pie
} from 'recharts';

const STORE_COLORS: Record<string, string> = {
  'Duty Free': '#00d4ff',
  'Food & Beverage': '#f59e0b',
  'Electronics': '#7c3aed',
  'Fashion': '#ec4899',
  'Books': '#10b981',
  'Retail': '#8b5cf6',
};

export function RetailIntelligence() {
  const { retail } = useAirportStore();

  const totalRevenue = retail.reduce((sum, r) => sum + r.price, 0);
  const totalCost = retail.reduce((sum, r) => sum + r.cost, 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const dutyFreeCount = retail.filter(r => r.is_duty_free).length;

  // Store type breakdown
  const storeBreakdown = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    retail.forEach(r => {
      if (!map[r.store_type]) map[r.store_type] = { revenue: 0, count: 0 };
      map[r.store_type].revenue += r.price;
      map[r.store_type].count++;
    });
    return Object.entries(map)
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [retail]);

  // Product breakdown
  const productStats = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    retail.forEach(r => {
      if (!map[r.product]) map[r.product] = { revenue: 0, count: 0 };
      map[r.product].revenue += r.price;
      map[r.product].count++;
    });
    return Object.entries(map)
      .map(([product, stats]) => ({ product, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [retail]);

  // Payment method breakdown
  const paymentStats = useMemo(() => {
    const map: Record<string, number> = {};
    retail.forEach(r => { map[r.payment_method] = (map[r.payment_method] || 0) + r.price; });
    return Object.entries(map).map(([method, revenue]) => ({ method, revenue }));
  }, [retail]);

  // Hourly revenue trend (simulated from transaction times)
  const hourlyTrend = useMemo(() => {
    const hours: Record<number, number> = {};
    retail.forEach(r => {
      try {
        const h = new Date(r.transaction_time.replace(' ', 'T')).getHours();
        if (!isNaN(h)) hours[h] = (hours[h] || 0) + r.price;
      } catch {}
    });
    return Array.from({ length: 24 }).map((_, h) => ({
      hour: `${h}:00`,
      revenue: hours[h] || 0,
    }));
  }, [retail]);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue, true)} icon={<DollarSign size={14} />} color="purple" />
        <StatCard label="Transactions" value={retail.length.toLocaleString()} icon={<ShoppingBag size={14} />} color="blue" />
        <StatCard
          label="Gross Margin"
          value={`${margin.toFixed(1)}%`}
          icon={<TrendingUp size={14} />}
          color={margin > 30 ? 'green' : margin > 20 ? 'blue' : 'amber'}
        />
        <StatCard label="Duty Free Sales" value={dutyFreeCount.toLocaleString()} icon={<Package size={14} />} color="blue"
          sub={`${((dutyFreeCount / Math.max(1, retail.length)) * 100).toFixed(0)}% of transactions`}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* Revenue Trend */}
        <div className="col-span-7">
          <GlassCard className="h-full">
            <SectionHeader title="Revenue by Hour" subtitle="Daily pattern" icon={<BarChart2 size={12} />} />
            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.split(':')[0]} interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, true), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Store breakdown bars */}
            <div className="mt-3 space-y-2">
              {storeBreakdown.slice(0, 4).map((s, i) => (
                <div key={s.type} className="flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: STORE_COLORS[s.type] ?? '#64748b' }} />
                  <span className="text-slate-400 w-28 truncate">{s.type}</span>
                  <div className="flex-1">
                    <ProgressBar value={s.revenue} max={storeBreakdown[0]?.revenue ?? 1}
                      color={STORE_COLORS[s.type] ?? '#64748b'} />
                  </div>
                  <span className="text-slate-200 font-medium w-16 text-right">{formatCurrency(s.revenue, true)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Products + Payments */}
        <div className="col-span-5">
          <div className="h-full flex flex-col gap-3">
            {/* Top Products */}
            <GlassCard className="flex-1">
              <SectionHeader title="Top Products" icon={<Package size={12} />} />
              <div className="space-y-1.5 mt-2 overflow-y-auto scroll-y max-h-48">
                {productStats.map((p, i) => (
                  <div key={p.product} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 w-4 text-center">{i + 1}</span>
                    <span className="flex-1 text-slate-300 truncate">{p.product}</span>
                    <span className="text-slate-500">{p.count}x</span>
                    <span className="text-purple-400 font-medium">{formatCurrency(p.revenue, true)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Payment Methods */}
            <GlassCard>
              <SectionHeader title="Payment Methods" icon={<CreditCard size={12} />} />
              <div className="space-y-2 mt-2">
                {paymentStats.map((p, i) => (
                  <div key={p.method} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-14">{p.method}</span>
                    <div className="flex-1">
                      <ProgressBar value={p.revenue} max={paymentStats.reduce((s, ps) => s + ps.revenue, 0)}
                        color={['#00d4ff', '#7c3aed', '#10b981'][i % 3]} />
                    </div>
                    <span className="text-xs text-slate-300">{formatCurrency(p.revenue, true)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
