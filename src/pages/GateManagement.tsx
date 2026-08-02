import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, Plane, Users, Clock, Activity, Grid } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, StatCard, SectionHeader, Badge, ProgressBar, LiveDot } from '../components/ui';
import { cn } from '../utils';
import { formatDate } from '../utils';

export function GateManagement() {
  const { gateOccupancy, flights, gateEvents, setSelectedFlight, selectedFlightId } = useAirportStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const occupiedCount = gateOccupancy.filter(g => g.status !== 'empty').length;
  const boardingCount = gateOccupancy.filter(g => g.status === 'boarding').length;
  const maintenanceCount = gateOccupancy.filter(g => g.status === 'maintenance').length;

  const gateEventsByGate = useMemo(() => {
    const map: Record<string, typeof gateEvents> = {};
    gateEvents.forEach(e => {
      if (!map[e.gate]) map[e.gate] = [];
      map[e.gate].push(e);
    });
    return map;
  }, [gateEvents]);

  const sortedGates = useMemo(() => {
    return [...gateOccupancy].sort((a, b) => {
      const order = { boarding: 0, maintenance: 1, occupied: 2, empty: 3, closed: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });
  }, [gateOccupancy]);

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      <div className="w-[1000px] flex flex-col gap-3 pointer-events-auto">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <StatCard label="Total Gates" value={gateOccupancy.length} icon={<DoorOpen size={14} />} color="blue" />
          <StatCard label="Occupied" value={occupiedCount} icon={<Plane size={14} />} color="blue"
            sub={`${gateOccupancy.length > 0 ? Math.round((occupiedCount / gateOccupancy.length) * 100) : 0}% utilization`}
          />
          <StatCard label="Boarding" value={boardingCount} icon={<Users size={14} />} color="green" />
          <StatCard label="Maintenance" value={maintenanceCount} icon={<Activity size={14} />} color={maintenanceCount > 0 ? 'red' : 'green'} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-3">
          {/* Gate Grid / List */}
        <div className="col-span-8">
          <GlassCard className="h-full" padding={false}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <SectionHeader title="Gate Map" subtitle={`${occupiedCount}/${gateOccupancy.length} occupied`} icon={<DoorOpen size={12} />} />
              <div className="flex gap-1">
                <button onClick={() => setViewMode('grid')}
                  className={cn('px-2 py-1 rounded text-xs border transition-all', viewMode === 'grid' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'text-slate-500 border-white/6')}>
                  Grid
                </button>
                <button onClick={() => setViewMode('list')}
                  className={cn('px-2 py-1 rounded text-xs border transition-all', viewMode === 'list' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'text-slate-500 border-white/6')}>
                  List
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-y p-4" style={{ maxHeight: 'calc(100% - 56px)' }}>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-5 gap-2">
                  {sortedGates.map(g => {
                    const flight = g.currentFlight;
                    return (
                      <motion.div
                        key={g.gate}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => flight && setSelectedFlight(flight.flight_id)}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden',
                          g.status === 'boarding'
                            ? 'bg-cyan-500/12 border-cyan-500/30 glow-blue'
                            : g.status === 'occupied'
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : g.status === 'maintenance'
                            ? 'bg-red-500/12 border-red-500/30'
                            : 'bg-white/3 border-white/6'
                        )}
                      >
                        {/* Boarding pulse */}
                        {g.status === 'boarding' && (
                          <div className="absolute inset-0 rounded-xl animate-pulse-glow opacity-20 bg-cyan-400" />
                        )}

                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-black text-white">{g.gate}</p>
                          {g.status === 'boarding' && <LiveDot size="sm" />}
                          {g.status === 'maintenance' && <span className="text-[10px] text-red-400 status-blink">MNT</span>}
                        </div>

                        {flight ? (
                          <>
                            <p className="text-[11px] font-bold text-cyan-300">{flight.flight_id}</p>
                            <p className="text-[9px] text-slate-500 truncate">{flight.airline_name?.split(' ')[0]}</p>
                            <p className="text-[9px] text-slate-400 mt-1">→ {flight.destination}</p>
                            <p className="text-[10px] font-bold mt-1"
                              style={{ color: g.status === 'boarding' ? '#00d4ff' : g.status === 'occupied' ? '#10b981' : '#64748b' }}>
                              {flight.status}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-slate-600 mt-2">Available</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sortedGates.map(g => {
                    const flight = g.currentFlight;
                    const events = gateEventsByGate[g.gate] ?? [];
                    return (
                      <motion.div
                        key={g.gate}
                        onClick={() => flight && setSelectedFlight(flight.flight_id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-white/4 transition-all',
                          g.status === 'boarding' ? 'border-cyan-500/30 bg-cyan-500/8' :
                          g.status === 'maintenance' ? 'border-red-500/30 bg-red-500/8' :
                          'border-white/6 bg-white/3'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm',
                          g.status === 'boarding' ? 'bg-cyan-500/20 text-cyan-300' :
                          g.status === 'occupied' ? 'bg-emerald-500/15 text-emerald-400' :
                          g.status === 'maintenance' ? 'bg-red-500/20 text-red-400' :
                          'bg-white/5 text-slate-500'
                        )}>
                          {g.gate}
                        </div>
                        <div className="flex-1 min-w-0">
                          {flight ? (
                            <>
                              <p className="text-sm font-bold text-white">{flight.flight_id}
                                <span className="text-slate-500 font-normal text-xs ml-2">{flight.airline_name}</span>
                              </p>
                              <p className="text-xs text-slate-400">{flight.origin} → {flight.destination} · {flight.aircraft_type}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Dep: {formatDate(flight.scheduled_dep)} · {flight.pax_count}/{flight.capacity} pax
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-600">Gate Available</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <Badge
                            label={g.status === 'boarding' ? 'Boarding' : g.status === 'occupied' ? 'Occupied' : g.status === 'maintenance' ? 'Maintenance' : 'Free'}
                            variant={g.status === 'boarding' ? 'info' : g.status === 'occupied' ? 'success' : g.status === 'maintenance' ? 'danger' : 'default'}
                            size="sm"
                            pulse={g.status === 'boarding'}
                          />
                          {events.length > 0 && (
                            <span className="text-[10px] text-slate-600">{events.length} events</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Gate Events & Legend */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Legend */}
          <GlassCard>
            <p className="text-xs text-slate-400 font-semibold mb-3">Status Legend</p>
            <div className="space-y-2">
              {[
                { color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300', label: 'Boarding', desc: 'Active boarding in progress' },
                { color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', label: 'Occupied', desc: 'Aircraft docked, not boarding' },
                { color: 'bg-red-500/20 border-red-500/30 text-red-400', label: 'Maintenance', desc: 'Under maintenance/inspection' },
                { color: 'bg-white/5 border-white/8 text-slate-500', label: 'Available', desc: 'Ready for assignment' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn('w-10 h-6 rounded border flex items-center justify-center text-[9px] font-bold', item.color)}>
                    B
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Gate Events */}
          <GlassCard className="flex-1" padding={false}>
            <div className="p-3 border-b border-white/6">
              <SectionHeader title="Recent Gate Events" icon={<Activity size={12} />} />
            </div>
            <div className="overflow-y-auto scroll-y p-2" style={{ maxHeight: 'calc(100% - 50px)' }}>
              {gateEvents.slice(0, 20).map((e, i) => (
                <div key={e.event_id} className="flex items-start gap-2 py-2 border-b border-white/4 text-xs">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0',
                    e.is_emergency ? 'bg-red-400 status-blink' : 'bg-cyan-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300">{e.event_type}</p>
                    <p className="text-[10px] text-slate-500">{e.flight_id} · Gate {e.gate}</p>
                    <p className="text-[9px] text-slate-600">{formatDate(e.event_time, 'HH:mm dd MMM')}</p>
                  </div>
                  {e.is_emergency && <Badge label="EMRG" variant="danger" size="sm" pulse />}
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
