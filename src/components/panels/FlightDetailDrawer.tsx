import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Users, Briefcase, DoorOpen, Wrench, Activity, TrendingUp, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useAirportStore } from '../../stores/airportStore';
import { GlassCard, Badge, ProgressBar, SectionHeader } from '../ui';
import { formatDate, formatCurrency, getFlightStatusBadge, formatDelay, computeDelayPrediction, getAirlineColor } from '../../utils';

export function FlightDetailDrawer() {
  const {
    selectedFlightId, setSelectedFlight,
    flights, passengers, baggage, gateEvents, maintenance,
  } = useAirportStore();

  const flight = flights.find(f => f.flight_id === selectedFlightId);
  if (!flight) return null;

  const flightPassengers = passengers.filter(p => p.flight_id === selectedFlightId);
  const flightBaggage = baggage.filter(b => b.flight_id === selectedFlightId);
  const flightGateEvents = gateEvents.filter(e => e.flight_id === selectedFlightId);
  const flightMaintenance = maintenance.filter(m => m.flight_id === selectedFlightId);

  const delayPred = computeDelayPrediction(flight);
  const loadPct = flight.capacity > 0 ? (flight.pax_count / flight.capacity) * 100 : 0;
  const airlineColor = getAirlineColor(flight.airline_code);

  return (
    <AnimatePresence>
      <motion.div
        key="drawer"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-96 z-50 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(6,15,46,0.98) 0%, rgba(2,8,24,0.99) 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${airlineColor}20`, border: `1px solid ${airlineColor}40` }}>
                <Plane size={14} style={{ color: airlineColor }} className="rotate-45" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{flight.flight_id}</p>
                <p className="text-xs text-slate-500">{flight.airline_name}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFlight(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <X size={14} />
            </button>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 bg-white/4 rounded-xl p-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white tabular-nums">{flight.origin}</p>
              <p className="text-[10px] text-slate-500">{formatDate(flight.scheduled_dep)}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full border-t border-dashed border-slate-600 relative">
                <Plane size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 rotate-90" />
              </div>
              <p className="text-[9px] text-slate-600">{flight.route_type}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white tabular-nums">{flight.destination}</p>
              <p className="text-[10px] text-slate-500">{formatDate(flight.scheduled_arr)}</p>
            </div>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getFlightStatusBadge(flight.status)}`}>
              {flight.status}
            </span>
            {flight.delay_minutes > 0 && (
              <Badge label={formatDelay(flight.delay_minutes)} variant="warning" />
            )}
            <Badge label={`Gate ${flight.gate}`} variant="info" />
            <Badge label={flight.aircraft_type} variant="default" />
            {flight.is_international && <Badge label="INTL" variant="purple" />}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-y p-4 space-y-4">

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Passengers', value: `${flight.pax_count}/${flight.capacity}`, color: 'text-cyan-400' },
              { label: 'Load Factor', value: `${flight.load_factor_pct.toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'Delay', value: formatDelay(flight.delay_minutes), color: flight.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400' },
              { label: 'Risk Score', value: `${(flight.risk_score * 100).toFixed(0)}%`, color: flight.risk_score > 0.6 ? 'text-red-400' : 'text-green-400' },
              { label: 'Revenue', value: formatCurrency(flight.revenue, true), color: 'text-purple-400' },
              { label: 'Fuel Cost', value: formatCurrency(flight.fuel_cost, true), color: 'text-orange-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/4 rounded-lg p-3 border border-white/6">
                <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Load Bar */}
          <GlassCard>
            <p className="text-xs text-slate-400 mb-2">Passenger Load</p>
            <ProgressBar value={loadPct} color={loadPct > 90 ? '#f59e0b' : '#00d4ff'} label={`${flight.pax_count} of ${flight.capacity}`} />
          </GlassCard>

          {/* Delay Prediction */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Delay Risk</p>
              <Badge
                label={delayPred.label}
                variant={delayPred.probability > 60 ? 'danger' : delayPred.probability > 30 ? 'warning' : 'success'}
              />
            </div>
            <ProgressBar
              value={delayPred.probability}
              color={delayPred.probability > 60 ? '#ef4444' : delayPred.probability > 30 ? '#f59e0b' : '#10b981'}
              label={`${delayPred.probability}% probability`}
            />
            {flight.delay_reason && (
              <p className="text-xs text-slate-500 mt-2">
                Reason: <span className="text-slate-300">{flight.delay_reason}</span>
              </p>
            )}
          </GlassCard>

          {/* Details */}
          <GlassCard>
            <SectionHeader title="Flight Details" />
            <div className="space-y-1.5 text-xs">
              {[
                ['Aircraft', `${flight.aircraft_type} (${flight.aircraft_reg})`],
                ['Terminal', flight.terminal],
                ['Turnaround', `${flight.turnaround_minutes} min`],
                ['Time of Day', flight.time_of_day],
                ['Season', flight.season],
                ['Holiday', flight.is_holiday ? 'Yes' : 'No'],
                ['Codeshare', flight.is_codeshare ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-white/4">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Passengers */}
          <GlassCard>
            <SectionHeader
              title="Passengers"
              subtitle={`${flightPassengers.length} pax`}
              icon={<Users size={12} />}
            />
            {flightPassengers.length === 0 ? (
              <p className="text-xs text-slate-600">No passenger data</p>
            ) : (
              <div className="space-y-1.5">
                {flightPassengers.slice(0, 8).map(p => (
                  <div key={p.passenger_id} className="flex items-center gap-2 py-1 border-b border-white/4 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[10px] text-slate-300 font-bold flex-shrink-0">
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-slate-500">{p.seat} · {p.cabin_class}</p>
                    </div>
                    {p.is_vip && <Badge label="VIP" variant="purple" size="sm" />}
                    {p.special_assistance && <Badge label="ASST" variant="warning" size="sm" />}
                  </div>
                ))}
                {flightPassengers.length > 8 && (
                  <p className="text-xs text-slate-600 text-center pt-1">+{flightPassengers.length - 8} more</p>
                )}
              </div>
            )}
          </GlassCard>

          {/* Baggage */}
          <GlassCard>
            <SectionHeader
              title="Baggage"
              subtitle={`${flightBaggage.length} items`}
              icon={<Briefcase size={12} />}
            />
            {flightBaggage.length === 0 ? (
              <p className="text-xs text-slate-600">No baggage data</p>
            ) : (
              <div className="space-y-1.5">
                {flightBaggage.slice(0, 6).map(b => (
                  <div key={b.tag_number} className="flex items-center justify-between text-xs py-1 border-b border-white/4">
                    <div>
                      <p className="text-slate-300 font-mono">{b.tag_number}</p>
                      <p className="text-slate-500">{b.weight_kg.toFixed(1)}kg · Belt {b.belt_number}</p>
                    </div>
                    <Badge
                      label={b.status}
                      variant={b.is_delayed ? 'warning' : b.status === 'Loaded' ? 'success' : 'info'}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Gate Events */}
          {flightGateEvents.length > 0 && (
            <GlassCard>
              <SectionHeader title="Gate Events" icon={<DoorOpen size={12} />} />
              <div className="space-y-1.5">
                {flightGateEvents.slice(0, 5).map(e => (
                  <div key={e.event_id} className="flex items-center gap-2 text-xs py-1 border-b border-white/4">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.is_emergency ? 'bg-red-400' : 'bg-cyan-400'}`} />
                    <div className="flex-1">
                      <p className="text-slate-300">{e.event_type}</p>
                      <p className="text-slate-500">{formatDate(e.event_time, 'HH:mm dd MMM')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Maintenance */}
          {flightMaintenance.length > 0 && (
            <GlassCard glow={flightMaintenance.some(m => m.is_aog) ? 'red' : 'none'}>
              <SectionHeader title="Maintenance" icon={<Wrench size={12} />} />
              {flightMaintenance.map(m => (
                <div key={m.work_order} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{m.work_type}</span>
                    {m.is_aog && <Badge label="AOG" variant="danger" size="sm" pulse />}
                    {m.is_complete && <Badge label="Complete" variant="success" size="sm" />}
                  </div>
                  <p className="text-slate-500">{m.defect_description}</p>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
