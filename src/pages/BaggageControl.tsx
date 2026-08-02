import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertTriangle, Package, Truck, BarChart2, Filter } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { cn } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Loaded: '#10b981',
  Loading: '#00d4ff',
  'In Transit': '#7c3aed',
  Delayed: '#f59e0b',
  Lost: '#ef4444',
  Delivered: '#10b981',
  Pending: '#64748b',
};

export function BaggageControl() {
  const { baggage, flights } = useAirportStore();
  const [filterStatus, setFilterStatus] = useState('All');

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    baggage.forEach(b => { map[b.status] = (map[b.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [baggage]);

  // Zone breakdown
  const zoneStats = useMemo(() => {
    const map: Record<string, { count: number; delayed: number; weight: number }> = {};
    baggage.forEach(b => {
      if (!map[b.handling_zone]) map[b.handling_zone] = { count: 0, delayed: 0, weight: 0 };
      map[b.handling_zone].count++;
      if (b.is_delayed) map[b.handling_zone].delayed++;
      map[b.handling_zone].weight += b.weight_kg;
    });
    return Object.entries(map).map(([zone, s]) => ({ zone, ...s }));
  }, [baggage]);

  const delayed = baggage.filter(b => b.is_delayed);
  const oversize = baggage.filter(b => b.is_oversize);
  const inTransit = baggage.filter(b => b.status === 'In Transit' || b.status === 'Loading');

  const filteredBaggage = filterStatus === 'All'
    ? baggage
    : baggage.filter(b => b.status === filterStatus || (filterStatus === 'Delayed' && b.is_delayed));

  const totalWeight = baggage.reduce((sum, b) => sum + b.weight_kg, 0);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        <StatCard label="Total Baggage" value={baggage.length.toLocaleString()} icon={<Briefcase size={14} />} color="blue" />
        <StatCard label="In Transit" value={inTransit.length} icon={<Truck size={14} />} color="blue" />
        <StatCard label="Delayed" value={delayed.length} icon={<AlertTriangle size={14} />} color={delayed.length > 20 ? 'amber' : 'green'} />
        <StatCard label="Oversize" value={oversize.length} icon={<Package size={14} />} color="purple" />
        <StatCard label="Total Weight" value={`${(totalWeight / 1000).toFixed(1)}T`} icon={<BarChart2 size={14} />} color="blue" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* Status Distribution */}
        <div className="col-span-3">
          <GlassCard className="h-full">
            <SectionHeader title="Status Breakdown" icon={<BarChart2 size={12} />} />
            <div className="h-36 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                    strokeWidth={0}
                  >
                    {statusBreakdown.map(s => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {statusBreakdown.map(s => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#64748b' }} />
                    <span className="text-slate-400">{s.status}</span>
                  </div>
                  <span className="text-slate-200 font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Zone Stats */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Handling Zones" subtitle="by volume" icon={<Truck size={12} />} />
            <div className="space-y-3 overflow-y-auto scroll-y max-h-[calc(100%-3rem)]">
              {zoneStats.map((z, i) => (
                <div key={z.zone} className="p-3 rounded-xl bg-white/4 border border-white/6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">{z.zone}</span>
                    <div className="flex items-center gap-1">
                      {z.delayed > 0 && <Badge label={`${z.delayed} delayed`} variant="warning" size="sm" />}
                    </div>
                  </div>
                  <ProgressBar
                    value={z.count}
                    max={Math.max(...zoneStats.map(zs => zs.count))}
                    color={z.delayed > 5 ? '#f59e0b' : '#00d4ff'}
                    label={`${z.count} bags · ${(z.weight / 1000).toFixed(1)}T`}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Baggage List */}
        <div className="col-span-5">
          <GlassCard className="h-full" padding={false}>
            <div className="p-4 border-b border-white/6">
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Baggage Items" subtitle={`${filteredBaggage.length} items`} icon={<Briefcase size={12} />} />
              </div>
              <div className="flex gap-1 flex-wrap">
                {['All', 'Delayed', 'Loaded', 'Loading', 'In Transit', 'Pending'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-medium border transition-all',
                      filterStatus === s
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'text-slate-500 border-white/6 hover:text-slate-200'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scroll-y" style={{ maxHeight: 'calc(100% - 100px)' }}>
              {filteredBaggage.slice(0, 50).map((b, i) => (
                <motion.div
                  key={b.tag_number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-white/4 hover:bg-white/3 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLORS[b.status] ?? '#64748b' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-slate-200">{b.tag_number}</p>
                      {b.is_delayed && <Badge label="Delayed" variant="warning" size="sm" />}
                      {b.is_oversize && <Badge label="Oversize" variant="purple" size="sm" />}
                    </div>
                    <p className="text-[10px] text-slate-500">{b.flight_id} · {b.handling_zone} · Belt {b.belt_number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-400">{b.weight_kg.toFixed(1)}kg</p>
                    <Badge label={b.status} size="sm"
                      variant={b.status === 'Loaded' ? 'success' : b.status === 'Delayed' ? 'warning' : 'info'} />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      </div>
    </div>
  );
}
