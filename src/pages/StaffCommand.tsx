import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Shield, Award, BarChart2, Star } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { cn } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const DEPT_COLORS: Record<string, string> = {
  'Ops': '#00d4ff',
  'Security': '#ef4444',
  'Retail': '#f59e0b',
  'GH': '#10b981',
  'MTC': '#7c3aed',
  'CC': '#8b5cf6',
  'RET': '#ec4899',
  'SEC': '#ef4444',
  'OPS': '#00d4ff',
};

export function StaffCommand() {
  const { staffShifts } = useAirportStore();

  const deptStats = useMemo(() => {
    const map: Record<string, { count: number; overtime: number; hours: number }> = {};
    staffShifts.forEach(s => {
      const dept = s.department;
      if (!map[dept]) map[dept] = { count: 0, overtime: 0, hours: 0 };
      map[dept].count++;
      if (s.is_overtime) map[dept].overtime++;
      map[dept].hours += s.hours;
    });
    return Object.entries(map).map(([dept, stats]) => ({ dept, ...stats })).sort((a, b) => b.count - a.count);
  }, [staffShifts]);

  const roleStats = useMemo(() => {
    const map: Record<string, number> = {};
    staffShifts.forEach(s => { map[s.role] = (map[s.role] || 0) + 1; });
    return Object.entries(map).map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count);
  }, [staffShifts]);

  const overtimeStaff = staffShifts.filter(s => s.is_overtime);
  const totalHours = staffShifts.reduce((sum, s) => sum + s.hours, 0);

  // Gate coverage
  const gateMap: Record<string, string[]> = {};
  staffShifts.forEach(s => {
    if (s.gate) { gateMap[s.gate] = [...(gateMap[s.gate] || []), s.staff_name]; }
  });

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <StatCard label="Total Staff" value={staffShifts.length} icon={<Users size={14} />} color="blue" />
          <StatCard label="Overtime" value={overtimeStaff.length} icon={<Clock size={14} />} color={overtimeStaff.length > 10 ? 'amber' : 'green'}
            sub={`${((overtimeStaff.length / Math.max(1, staffShifts.length)) * 100).toFixed(0)}% on OT`}
          />
          <StatCard label="Departments" value={deptStats.length} icon={<Shield size={14} />} color="purple" />
          <StatCard label="Total Hours" value={`${(totalHours / 1000).toFixed(1)}K`} icon={<BarChart2 size={14} />} color="blue" />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* Dept breakdown */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Department Coverage" icon={<BarChart2 size={12} />} />
            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats} barSize={18}>
                  <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" radius={3}>
                    {deptStats.map((d, i) => (
                      <Cell key={i} fill={DEPT_COLORS[d.dept] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* OT breakdown */}
            <div className="mt-3 space-y-1.5">
              {deptStats.slice(0, 5).map(d => (
                <div key={d.dept} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: DEPT_COLORS[d.dept] ?? '#64748b' }} />
                  <span className="text-slate-400 flex-1">{d.dept}</span>
                  <span className="text-slate-200 font-medium">{d.count}</span>
                  {d.overtime > 0 && <Badge label={`+${d.overtime} OT`} variant="warning" size="sm" />}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Role Distribution */}
        <div className="col-span-3">
          <GlassCard className="h-full">
            <SectionHeader title="Roles" subtitle="By function" icon={<Award size={12} />} />
            <div className="space-y-2 mt-3 overflow-y-auto scroll-y max-h-[calc(100%-3rem)]">
              {roleStats.map((r, i) => (
                <div key={r.role}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{r.role}</span>
                    <span className="text-slate-200">{r.count}</span>
                  </div>
                  <ProgressBar value={r.count} max={roleStats[0]?.count ?? 1} color={['#00d4ff', '#7c3aed', '#10b981', '#f59e0b'][i % 4]} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Staff List */}
        <div className="col-span-5">
          <GlassCard className="h-full" padding={false}>
            <div className="p-4 border-b border-white/6">
              <SectionHeader title="Staff Roster" subtitle={`${staffShifts.length} on duty`} icon={<Users size={12} />} />
            </div>
            <div className="overflow-y-auto scroll-y" style={{ maxHeight: 'calc(100% - 60px)' }}>
              {staffShifts.map((s, i) => (
                <motion.div
                  key={s.staff_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-white/4 hover:bg-white/3 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: `${DEPT_COLORS[s.department] ?? '#64748b'}20`, color: DEPT_COLORS[s.department] ?? '#64748b' }}>
                    {s.staff_name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-white truncate">{s.staff_name}</p>
                      {s.is_overtime && <Badge label="OT" variant="warning" size="sm" />}
                    </div>
                    <p className="text-[10px] text-slate-500">{s.role} · {s.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-400">{s.hours}h</p>
                    {s.gate && <p className="text-[10px] text-cyan-500">Gate {s.gate}</p>}
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
