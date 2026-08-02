import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { formatDate, cn } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export function MaintenanceHub() {
  const { maintenance, flights, staffShifts } = useAirportStore();

  const aogLogs = maintenance.filter(m => m.is_aog);
  const incomplete = maintenance.filter(m => !m.is_complete);
  const complete = maintenance.filter(m => m.is_complete);
  const highPriority = maintenance.filter(m => m.priority >= 4 && !m.is_complete);

  // Work type breakdown
  const workTypes = useMemo(() => {
    const map: Record<string, number> = {};
    maintenance.forEach(m => { map[m.work_type] = (map[m.work_type] || 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [maintenance]);

  // Defect categories
  const defects = useMemo(() => {
    const map: Record<string, number> = {};
    maintenance.forEach(m => {
      const key = m.defect_description?.split(' ').slice(0, 2).join(' ') || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([desc, count]) => ({ desc, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [maintenance]);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <StatCard label="Total Work Orders" value={maintenance.length} icon={<Wrench size={14} />} color="blue" />
          <StatCard
            label="AOG Aircraft"
            value={aogLogs.filter(m => !m.is_complete).length}
            icon={<AlertTriangle size={14} />}
            color={aogLogs.filter(m => !m.is_complete).length > 0 ? 'red' : 'green'}
            sub="Aircraft On Ground"
          />
          <StatCard label="Incomplete" value={incomplete.length} icon={<Clock size={14} />} color="amber" />
          <StatCard label="Completed" value={complete.length} icon={<CheckCircle size={14} />} color="green"
            sub={`${Math.round((complete.length / Math.max(1, maintenance.length)) * 100)}% completion rate`}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* AOG Panel */}
        <div className="col-span-4">
          <GlassCard className="h-full" glow={aogLogs.filter(m => !m.is_complete).length > 0 ? 'red' : 'none'}>
            <SectionHeader title="AOG Status" subtitle="Aircraft On Ground" icon={<AlertTriangle size={12} />} />
            <div className="space-y-2 overflow-y-auto scroll-y max-h-[calc(100%-3rem)]">
              {aogLogs.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <p className="text-xs text-emerald-400">No AOG aircraft</p>
                </div>
              ) : aogLogs.map(m => (
                <motion.div
                  key={m.work_order}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-3 rounded-xl border',
                    m.is_complete
                      ? 'bg-emerald-500/8 border-emerald-500/20'
                      : 'bg-red-500/10 border-red-500/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.aircraft_reg}</span>
                      <Badge label={`P${m.priority}`} variant={m.priority >= 4 ? 'danger' : 'warning'} size="sm" />
                    </div>
                    <Badge
                      label={m.is_complete ? 'Complete' : 'AOG'}
                      variant={m.is_complete ? 'success' : 'danger'}
                      size="sm"
                      pulse={!m.is_complete}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1">{m.defect_description}</p>
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>{m.work_type}</span>
                    <span>Duration: {m.duration_hrs}h</span>
                    <span>{formatDate(m.start_time, 'dd MMM HH:mm')}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Work Type Chart */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Work Order Types" icon={<Activity size={12} />} />
            <div className="h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workTypes.slice(0, 6)} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" radius={3}>
                    {workTypes.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#00d4ff' : i === 1 ? '#7c3aed' : i === 2 ? '#10b981' : i === 3 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Defect list */}
            <div className="mt-4">
              <p className="text-xs text-slate-400 font-medium mb-2">Common Defects</p>
              {defects.slice(0, 5).map((d, i) => (
                <div key={d.desc} className="flex items-center gap-2 py-1.5 border-b border-white/4 text-xs">
                  <span className="text-slate-500 w-4 text-center">{i + 1}</span>
                  <span className="flex-1 text-slate-300 truncate">{d.desc}</span>
                  <span className="text-slate-500">{d.count}x</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Work Orders List */}
        <div className="col-span-4">
          <GlassCard className="h-full" padding={false}>
            <div className="p-4 border-b border-white/6">
              <SectionHeader title="Work Orders" subtitle={`${incomplete.length} open`} icon={<Wrench size={12} />} />
            </div>
            <div className="overflow-y-auto scroll-y" style={{ maxHeight: 'calc(100% - 60px)' }}>
              {maintenance.slice(0, 30).map((m, i) => (
                <motion.div
                  key={m.work_order}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-white/4 hover:bg-white/3 transition-colors"
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    m.is_complete ? 'bg-emerald-400' :
                    m.is_aog ? 'bg-red-400 status-blink' :
                    m.priority >= 4 ? 'bg-amber-400' : 'bg-slate-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-white">{m.aircraft_reg}</p>
                      <p className="text-[10px] text-slate-500">{m.work_type}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{m.defect_description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {m.is_aog && <Badge label="AOG" variant="danger" size="sm" pulse />}
                    {m.is_complete ? <Badge label="Done" variant="success" size="sm" /> :
                      <Badge label={`P${m.priority}`} variant={m.priority >= 4 ? 'danger' : 'warning'} size="sm" />}
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
