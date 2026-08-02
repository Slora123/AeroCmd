import { motion } from 'framer-motion';
import {
  Plane, Users, Briefcase, Shield, Wrench, Activity,
  TrendingUp, AlertTriangle, DollarSign, Clock, Zap, BarChart2
} from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { StatCard, GlassCard, SectionHeader, ProgressBar, Badge, LiveDot } from '../components/ui';
import { LiveEventFeed } from '../components/panels/LiveEventFeed';
import { formatCurrency, getHealthColor, cn } from '../utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar,
  PieChart, Pie, Cell,
} from 'recharts';

// Health Ring
function HealthRing({ score }: { score: number }) {
  const color = getHealthColor(score);
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: 'transparent' }];
  return (
    <div className="relative w-24 h-24">
      <PieChart width={96} height={96}>
        <Pie data={data} cx={44} cy={44} innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill === 'transparent' ? 'rgba(255,255,255,0.05)' : entry.fill} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-black tabular-nums" style={{ color }}>{score}</p>
        <p className="text-[9px] text-slate-500">Health</p>
      </div>
    </div>
  );
}

// Airline distribution chart data
function useAirlineData(flights: any[]) {
  const map: Record<string, number> = {};
  flights.forEach(f => { map[f.airline_name] = (map[f.airline_name] || 0) + 1; });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.split(' ')[0], count }));
}

// Delay by reason
function useDelayReasonData(flights: any[]) {
  const map: Record<string, number> = {};
  flights.filter(f => f.delay_minutes > 0).forEach(f => {
    map[f.delay_reason] = (map[f.delay_reason] || 0) + 1;
  });
  return Object.entries(map).map(([reason, count]) => ({ reason, count }));
}

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function CommandCenter() {
  const { kpis, flights, maintenance, gateOccupancy, retail, security } = useAirportStore();
  const airlineData = useAirlineData(flights);
  const delayData = useDelayReasonData(flights);

  // Top delayed flights
  const topDelayed = [...flights].sort((a, b) => b.delay_minutes - a.delay_minutes).slice(0, 5);

  // Revenue trend (by hour from retail)
  const revTrend = Array.from({ length: 12 }).map((_, i) => ({
    h: `${8 + i}:00`,
    revenue: Math.round(Math.random() * 50000 + 10000),
  }));

  const aogFlights = maintenance.filter(m => m.is_aog && !m.is_complete);

  return (
    <div className="h-full flex flex-col overflow-hidden pointer-events-none">
      {/* Top KPI Strip */}
      <div className="flex-shrink-0 grid grid-cols-4 xl:grid-cols-8 gap-2 p-3 pb-0 pointer-events-none">
        <StatCard label="Total Flights" value={kpis.totalFlights} icon={<Plane size={14} />} color="blue" />
        <StatCard label="Delayed" value={kpis.delayedFlights} icon={<AlertTriangle size={14} />} color="amber" />
        <StatCard label="Passengers" value={kpis.totalPassengers.toLocaleString()} icon={<Users size={14} />} color="blue" />
        <StatCard label="On-Time Rate" value={`${kpis.onTimeRate}%`} icon={<TrendingUp size={14} />} color="green" trend="up" trendVal={`${kpis.onTimeRate}% OTP`} />
        <StatCard label="Security Flags" value={kpis.securityFlagged} icon={<Shield size={14} />} color={kpis.securityFlagged > 10 ? 'red' : 'blue'} />
        <StatCard label="Baggage Delayed" value={kpis.baggageDelayed} icon={<Briefcase size={14} />} color={kpis.baggageDelayed > 20 ? 'amber' : 'blue'} />
        <StatCard label="Maintenance AOG" value={kpis.activeMaintenanceAOG} icon={<Wrench size={14} />} color={kpis.activeMaintenanceAOG > 0 ? 'red' : 'green'} />
        <StatCard label="Revenue" value={formatCurrency(kpis.revenueToday, true)} icon={<DollarSign size={14} />} color="purple" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3 pt-2 pointer-events-none">
        <div className="h-full grid grid-cols-12 gap-3 pointer-events-none">
          
          {/* LEFT HUD PANELS */}
          <div className="col-span-3 h-full flex flex-col gap-3 pointer-events-none">
            {/* Airport Health */}
            <GlassCard className="pointer-events-auto">
              <SectionHeader title="Airport Health" icon={<Activity size={12} />} />
              <div className="flex items-center gap-4">
                <HealthRing score={kpis.healthScore} />
                <div className="flex-1 space-y-2">
                  <ProgressBar value={kpis.onTimeRate} label="On-Time Rate" color="#10b981" />
                  <ProgressBar value={100 - (kpis.securityFlagged / Math.max(1, kpis.totalPassengers) * 100)} label="Security Clear" color="#00d4ff" />
                  <ProgressBar value={100 - (kpis.baggageDelayed / Math.max(1, kpis.baggageInTransit) * 100 * 5)} label="Baggage OK" color="#8b5cf6" />
                </div>
              </div>

              {/* AOG Alerts */}
              {aogFlights.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">⚠ AOG Alerts</p>
                  {aogFlights.slice(0, 2).map(m => (
                    <div key={m.work_order} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                      <Wrench size={10} className="text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-red-300 truncate">{m.aircraft_reg}</p>
                        <p className="text-[10px] text-red-500 truncate">{m.defect_description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* CENTER VIEWPORT (Empty for 3D) */}
          <div className="col-span-6 h-full pointer-events-none" />

          {/* RIGHT HUD PANELS */}
          <div className="col-span-3 h-full flex flex-col gap-3 pointer-events-none">
            {/* Gate Occupancy */}
            <GlassCard className="pointer-events-auto">
              <SectionHeader title="Gate Status" subtitle={`${kpis.gatesOccupied} occupied`} icon={<Plane size={12} />} />
              <div className="grid grid-cols-5 gap-1 mt-2">
                {gateOccupancy.slice(0, 20).map(g => (
                  <div
                    key={g.gate}
                    className={cn(
                      'aspect-square rounded flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer transition-all hover:scale-110',
                      g.status === 'boarding' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                      g.status === 'occupied' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      g.status === 'maintenance' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      'bg-white/4 text-slate-600 border border-white/6'
                    )}
                  >
                    {g.gate.replace('B', '')}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Top Delayed Flights */}
            <GlassCard className="pointer-events-auto flex-1 min-h-0 overflow-hidden flex flex-col">
              <SectionHeader title="Top Delayed Flights" subtitle="Sorted by delay" icon={<Clock size={12} />} />
              <div className="space-y-1.5 overflow-y-auto pr-1 pb-2 mt-1">
                {topDelayed.map((f, idx) => (
                  <div key={`${f.flight_id}-${idx}`} className="flex items-center gap-3 py-1.5 border-b border-white/4 hover:bg-white/3 rounded-lg px-2 transition-colors cursor-pointer">
                    <div className="w-16">
                      <p className="text-xs font-bold text-white">{f.flight_id}</p>
                      <p className="text-[10px] text-slate-500">{f.origin} → {f.destination}</p>
                    </div>
                    <div className="flex-1">
                      <ProgressBar value={Math.min(100, f.delay_minutes)} max={120} color={f.delay_minutes > 60 ? '#ef4444' : '#f59e0b'} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-400">+{f.delay_minutes}m</p>
                      <p className="text-[10px] text-slate-600">{f.delay_reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
