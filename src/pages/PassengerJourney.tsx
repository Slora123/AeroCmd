import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Plane, Star, Users, BarChart2, Search, Clock } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { cn } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PassengerJourney() {
  const { passengers, flights, security } = useAirportStore();
  const [search, setSearch] = useState('');

  const vipPax = passengers.filter(p => p.is_vip);
  const needsAssist = passengers.filter(p => p.special_assistance);
  const avgWait = passengers.length > 0
    ? (passengers.reduce((s, p) => s + p.wait_time_hrs, 0) / passengers.length).toFixed(2)
    : '0';

  // Nationality breakdown
  const nationalityStats = useMemo(() => {
    const map: Record<string, number> = {};
    passengers.forEach(p => { map[p.nationality] = (map[p.nationality] || 0) + 1; });
    return Object.entries(map)
      .map(([nat, count]) => ({ nat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [passengers]);

  // Age group breakdown
  const ageGroups = useMemo(() => {
    const map: Record<string, number> = {};
    passengers.forEach(p => { if (p.age_group) map[p.age_group] = (map[p.age_group] || 0) + 1; });
    return Object.entries(map).map(([group, count]) => ({ group, count }));
  }, [passengers]);

  // Cabin class breakdown
  const cabinStats = useMemo(() => {
    const map: Record<string, number> = {};
    passengers.forEach(p => { map[p.cabin_class] = (map[p.cabin_class] || 0) + 1; });
    return Object.entries(map).map(([cls, count]) => ({ cls, count }));
  }, [passengers]);

  const filteredPax = useMemo(() => {
    if (!search) return passengers.slice(0, 50);
    const q = search.toLowerCase();
    return passengers.filter(p =>
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.pnr_code?.toLowerCase().includes(q) ||
      p.flight_id?.toLowerCase().includes(q) ||
      p.nationality?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [passengers, search]);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard label="Total Passengers" value={passengers.length.toLocaleString()} icon={<Users size={14} />} color="blue" />
        <StatCard label="VIP" value={vipPax.length} icon={<Star size={14} />} color="purple" />
        <StatCard label="Special Assistance" value={needsAssist.length} icon={<User size={14} />} color="amber" />
        <StatCard label="Avg Wait" value={`${avgWait}h`} icon={<Clock size={14} />} color="blue" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* Demographics */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Demographics" icon={<Globe size={12} />} />

            {/* Nationality */}
            <div className="mt-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Nationalities</p>
              <div className="space-y-1.5">
                {nationalityStats.map((n, i) => (
                  <div key={n.nat} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 flex-1 truncate">{n.nat}</span>
                    <div className="w-20">
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(n.count / nationalityStats[0].count) * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="text-slate-300 w-8 text-right">{n.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Groups */}
            <div className="mt-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Age Groups</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroups} barSize={24}>
                    <XAxis dataKey="group" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="count" radius={3}>
                      {ageGroups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cabin Class */}
            <div className="mt-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Cabin Class</p>
              <div className="space-y-1.5">
                {cabinStats.map((c, i) => (
                  <div key={c.cls}>
                    <ProgressBar value={c.count} max={passengers.length} color={COLORS[i % COLORS.length]}
                      label={`${c.cls}: ${c.count}`} />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Passenger List */}
        <div className="col-span-8">
          <GlassCard className="h-full" padding={false}>
            <div className="p-4 border-b border-white/6">
              <div className="flex items-center gap-3 mb-3">
                <SectionHeader title="Passenger Registry" subtitle={`${passengers.length} passengers`} icon={<Users size={12} />} />
              </div>
              <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                <Search size={12} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, PNR, flight..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto scroll-y" style={{ maxHeight: 'calc(100% - 110px)' }}>
              {/* Header */}
              <div className="grid px-4 py-2 border-b border-white/4 text-[10px] text-slate-500 uppercase tracking-wider"
                style={{ gridTemplateColumns: '36px 160px 80px 80px 70px 80px 60px 80px' }}>
                <span>#</span>
                <span>Name</span>
                <span>PNR</span>
                <span>Flight</span>
                <span>Seat</span>
                <span>Class</span>
                <span>Age</span>
                <span>Tags</span>
              </div>
              {filteredPax.map((p, i) => (
                <motion.div
                  key={p.passenger_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.005, 0.2) }}
                  className="grid px-4 py-2.5 border-b border-white/4 hover:bg-white/3 transition-colors text-xs"
                  style={{ gridTemplateColumns: '36px 160px 80px 80px 70px 80px 60px 80px' }}
                >
                  <span className="text-slate-600 self-center">{i + 1}</span>
                  <div className="self-center flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-slate-500 text-[9px]">{p.nationality}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 self-center font-mono text-[10px]">{p.pnr_code}</span>
                  <span className="text-cyan-400 self-center">{p.flight_id}</span>
                  <span className="text-slate-400 self-center">{p.seat}</span>
                  <span className="text-slate-400 self-center">{p.cabin_class}</span>
                  <span className="text-slate-400 self-center">{p.age}</span>
                  <div className="flex gap-1 self-center flex-wrap">
                    {p.is_vip && <Badge label="VIP" variant="purple" size="sm" />}
                    {p.special_assistance && <Badge label="ASST" variant="warning" size="sm" />}
                  </div>
                </motion.div>
              ))}
              {!search && passengers.length > 50 && (
                <p className="text-xs text-slate-600 text-center py-3">Showing 50 of {passengers.length} passengers</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
      </div>
    </div>
  );
}
