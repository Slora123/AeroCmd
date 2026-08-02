import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Clock, Users, BarChart2, Filter } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar } from '../components/ui';
import { cn } from '../utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ScatterChart, Scatter, PieChart, Pie
} from 'recharts';

const LANE_COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SecurityOperations() {
  const { security, passengers, staffShifts } = useAirportStore();
  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  // Aggregate by lane
  const laneStats = useMemo(() => {
    const map: Record<number, { count: number; flagged: number; avgWait: number; queueLen: number; isPeak: boolean }> = {};
    security.forEach(s => {
      if (!map[s.lane_number]) map[s.lane_number] = { count: 0, flagged: 0, avgWait: 0, queueLen: 0, isPeak: false };
      map[s.lane_number].count++;
      if (s.is_flagged) map[s.lane_number].flagged++;
      map[s.lane_number].avgWait += s.wait_time_sec;
      map[s.lane_number].queueLen = Math.max(map[s.lane_number].queueLen, s.queue_length);
      if (s.is_peak) map[s.lane_number].isPeak = true;
    });
    return Object.entries(map).map(([lane, stats]) => ({
      lane: parseInt(lane),
      ...stats,
      avgWait: stats.count > 0 ? Math.round(stats.avgWait / stats.count / 60) : 0,
      flagRate: stats.count > 0 ? Math.round((stats.flagged / stats.count) * 100) : 0,
    })).sort((a, b) => a.lane - b.lane);
  }, [security]);

  // Flagged incidents
  const flaggedScreenings = security.filter(s => s.is_flagged).slice(0, 10);
  const detained = security.filter(s => s.is_detained);
  const secondaryCheck = security.filter(s => s.secondary_screening);

  const totalFlagged = security.filter(s => s.is_flagged).length;
  const avgWait = security.length > 0
    ? Math.round(security.reduce((a, s) => a + s.wait_time_sec, 0) / security.length / 60)
    : 0;

  const peakLanes = laneStats.filter(l => l.isPeak).length;

  // Wait time distribution
  const waitBuckets = useMemo(() => {
    const buckets = [
      { label: '0-2m', min: 0, max: 120 },
      { label: '2-5m', min: 120, max: 300 },
      { label: '5-10m', min: 300, max: 600 },
      { label: '10-20m', min: 600, max: 1200 },
      { label: '20m+', min: 1200, max: Infinity },
    ];
    return buckets.map(b => ({
      label: b.label,
      count: security.filter(s => s.wait_time_sec >= b.min && s.wait_time_sec < b.max).length,
    }));
  }, [security]);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1100px] flex flex-col gap-3 pointer-events-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard
          label="Total Screened"
          value={security.length.toLocaleString()}
          icon={<Shield size={14} />}
          color="blue"
        />
        <StatCard
          label="Flagged"
          value={totalFlagged}
          icon={<AlertTriangle size={14} />}
          color={totalFlagged > 20 ? 'red' : 'amber'}
          sub={`${((totalFlagged / Math.max(1, security.length)) * 100).toFixed(1)}% flag rate`}
        />
        <StatCard
          label="Avg Wait"
          value={`${avgWait}m`}
          icon={<Clock size={14} />}
          color={avgWait > 10 ? 'amber' : 'green'}
          sub={`${peakLanes} peak lanes`}
        />
        <StatCard
          label="Detained"
          value={detained.length}
          icon={<Users size={14} />}
          color={detained.length > 0 ? 'red' : 'green'}
          sub={`${secondaryCheck.length} secondary checks`}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">

        {/* Lane Status */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Security Lanes" subtitle={`${laneStats.length} lanes active`} icon={<Shield size={12} />} />
            <div className="space-y-2 mt-2 overflow-y-auto scroll-y max-h-[calc(100%-3rem)]">
              {laneStats.map((lane, i) => (
                <motion.div
                  key={lane.lane}
                  onClick={() => setSelectedLane(selectedLane === lane.lane ? null : lane.lane)}
                  whileHover={{ x: 3 }}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all',
                    selectedLane === lane.lane
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-white/4 border-white/6 hover:bg-white/6'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: LANE_COLORS[i % LANE_COLORS.length] }} />
                      <span className="text-xs font-bold text-white">Lane {lane.lane}</span>
                      {lane.isPeak && <Badge label="PEAK" variant="warning" size="sm" pulse />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {lane.flagged > 0 && (
                        <Badge label={`${lane.flagged} flags`} variant="danger" size="sm" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <ProgressBar
                      value={lane.queueLen}
                      max={30}
                      color={lane.queueLen > 20 ? '#ef4444' : lane.queueLen > 10 ? '#f59e0b' : '#10b981'}
                      label={`Queue: ${lane.queueLen} pax`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Avg wait: {lane.avgWait}m</span>
                      <span>{lane.count} processed</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Queue Chart */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader title="Wait Time Distribution" icon={<BarChart2 size={12} />} />
            <div className="h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitBuckets} barSize={32}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#060f2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" radius={4}>
                    {waitBuckets.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : i < 3 ? '#00d4ff' : i === 3 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lane queue bars */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-400 font-medium">Current Queue by Lane</p>
              {laneStats.map((lane, i) => (
                <div key={lane.lane} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-10">Lane {lane.lane}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (lane.queueLen / 30) * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: LANE_COLORS[i % LANE_COLORS.length] }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-6 text-right">{lane.queueLen}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Flagged Incidents */}
        <div className="col-span-4">
          <GlassCard className="h-full">
            <SectionHeader
              title="Security Incidents"
              subtitle={`${totalFlagged} flags`}
              icon={<AlertTriangle size={12} />}
            />
            <div className="space-y-2 overflow-y-auto scroll-y max-h-[calc(100%-3rem)]">
              {flaggedScreenings.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-xs text-slate-600">No flagged incidents</p>
                </div>
              ) : flaggedScreenings.map(s => (
                <motion.div
                  key={s.screening_id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-red-500/8 border border-red-500/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-red-300">{s.screening_id}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PNR: {s.pnr_code} · Lane {s.lane_number}</p>
                      {s.alert_reason && (
                        <p className="text-[10px] text-red-400 mt-1">{s.alert_reason}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Badge label={s.result || 'Flagged'} variant="danger" size="sm" pulse />
                      {s.secondary_screening && <Badge label="Secondary" variant="warning" size="sm" />}
                      {s.is_detained && <Badge label="Detained" variant="danger" size="sm" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
                    <span>Wait: {Math.round(s.wait_time_sec / 60)}m</span>
                    <span>Staff: {s.staff_id}</span>
                  </div>
                </motion.div>
              ))}
              {totalFlagged > 10 && (
                <p className="text-[10px] text-slate-600 text-center py-2">+{totalFlagged - 10} more incidents</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
      </div>
    </div>
  );
}
