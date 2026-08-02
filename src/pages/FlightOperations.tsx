import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, Plane, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAirportStore } from '../stores/airportStore';
import { GlassCard, Badge, SectionHeader, ProgressBar } from '../components/ui';
import { FlightDetailDrawer } from '../components/panels/FlightDetailDrawer';
import { formatDate, getFlightStatusBadge, formatDelay, getAirlineColor, computeDelayPrediction, cn } from '../utils';
import type { Flight } from '../types';

type SortKey = 'flight_id' | 'airline_name' | 'destination' | 'scheduled_dep' | 'delay_minutes' | 'status';

const STATUS_FILTERS = ['All', 'Departed', 'Boarding', 'Delayed', 'Cancelled', 'Scheduled'];

export function FlightOperations() {
  const { flights, globalSearch, setSelectedFlight, selectedFlightId } = useAirportStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('scheduled_dep');
  const [sortAsc, setSortAsc] = useState(true);
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);

  const q = (search || globalSearch).toLowerCase();

  const filtered = useMemo(() => {
    return flights
      .filter(f => {
        if (statusFilter !== 'All' && f.status !== statusFilter) return false;
        if (showDelayedOnly && f.delay_minutes === 0) return false;
        if (q && !(
          f.flight_id.toLowerCase().includes(q) ||
          f.airline_name.toLowerCase().includes(q) ||
          f.destination.toLowerCase().includes(q) ||
          f.origin.toLowerCase().includes(q) ||
          f.gate.toLowerCase().includes(q) ||
          f.aircraft_reg.toLowerCase().includes(q)
        )) return false;
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey] ?? '';
        let vb = b[sortKey] ?? '';
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
      });
  }, [flights, statusFilter, q, sortKey, sortAsc, showDelayedOnly]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : null
  );

  return (
    <div className="h-full flex pointer-events-none p-4 justify-center">
      {/* Right HUD Panel */}
      <div className="w-[950px] flex flex-col pointer-events-auto">
        <div className="flex-shrink-0 pb-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search flights, routes, aircraft..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
          </div>
          <button
            onClick={() => setShowDelayedOnly(!showDelayedOnly)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
              showDelayedOnly
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-white/4 text-slate-400 border-white/8'
            )}
          >
            <AlertTriangle size={12} />
            Delayed Only
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all border',
                statusFilter === s
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : 'text-slate-500 border-white/6 hover:text-slate-200 hover:bg-white/4'
              )}
            >
              {s}
              {s !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {flights.filter(f => f.status === s).length}
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600 self-center">{filtered.length} flights</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-4 pb-4 relative">
        <GlassCard padding={false} className="h-full flex flex-col">
          {/* Column Headers */}
          <div className="grid gap-2 px-4 py-2.5 border-b border-white/6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0"
            style={{ gridTemplateColumns: '110px 130px 80px 80px 90px 80px 70px 60px 80px 60px' }}>
            {[
              ['flight_id', 'Flight'],
              ['airline_name', 'Airline'],
              [null, 'Route'],
              ['scheduled_dep', 'STD'],
              ['status', 'Status'],
              ['gate', 'Gate'],
              ['delay_minutes', 'Delay'],
              [null, 'Load'],
              [null, 'Risk'],
              [null, 'Aircraft'],
            ].map(([key, label]) => (
              <button
                key={String(label)}
                onClick={() => key && handleSort(key as SortKey)}
                className={cn('text-left flex items-center gap-1', key && 'hover:text-slate-200 cursor-pointer')}
              >
                {label}
                {key && <SortIcon k={key as SortKey} />}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto scroll-y">
            <AnimatePresence>
              {filtered.map((flight, idx) => (
                <FlightRow
                  key={flight.flight_id}
                  flight={flight}
                  idx={idx}
                  isSelected={selectedFlightId === flight.flight_id}
                  onClick={() => setSelectedFlight(selectedFlightId === flight.flight_id ? null : flight.flight_id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Detail Drawer */}
        {selectedFlightId && (
          <div className="absolute inset-y-0 right-0 z-20">
            <FlightDetailDrawer />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function FlightRow({ flight, idx, isSelected, onClick }: {
  flight: Flight; idx: number; isSelected: boolean; onClick: () => void;
}) {
  const pred = computeDelayPrediction(flight);
  const airlineColor = getAirlineColor(flight.airline_code);
  const loadPct = flight.capacity > 0 ? (flight.pax_count / flight.capacity) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(idx * 0.01, 0.3) }}
      onClick={onClick}
      className={cn(
        'grid gap-2 px-4 py-3 border-b border-white/4 cursor-pointer hover:bg-white/3 transition-all group',
        isSelected && 'bg-cyan-500/8 border-cyan-500/20'
      )}
      style={{ gridTemplateColumns: '110px 130px 80px 80px 90px 80px 70px 60px 80px 60px' }}
    >
      {/* Flight ID */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: `${airlineColor}20`, border: `1px solid ${airlineColor}40` }}>
          <Plane size={8} style={{ color: airlineColor }} />
        </div>
        <span className="text-xs font-bold text-white">{flight.flight_id}</span>
      </div>

      {/* Airline */}
      <span className="text-xs text-slate-400 truncate self-center">{flight.airline_name}</span>

      {/* Route */}
      <div className="self-center">
        <p className="text-xs text-slate-200">{flight.origin}→{flight.destination}</p>
      </div>

      {/* STD */}
      <span className="text-xs text-slate-400 self-center tabular-nums">{formatDate(flight.scheduled_dep)}</span>

      {/* Status */}
      <div className="self-center">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getFlightStatusBadge(flight.status)}`}>
          {flight.status}
        </span>
      </div>

      {/* Gate */}
      <span className="text-xs text-cyan-400 self-center font-mono">{flight.gate}</span>

      {/* Delay */}
      <span className={cn(
        'text-xs font-bold self-center tabular-nums',
        flight.delay_minutes > 60 ? 'text-red-400' :
        flight.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'
      )}>
        {formatDelay(flight.delay_minutes)}
      </span>

      {/* Load */}
      <div className="self-center w-full">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${loadPct}%`,
              background: loadPct > 90 ? '#f59e0b' : '#00d4ff',
            }}
          />
        </div>
        <p className="text-[9px] text-slate-600 mt-0.5">{loadPct.toFixed(0)}%</p>
      </div>

      {/* Risk */}
      <div className="self-center">
        <div className={cn(
          'text-[10px] px-1 py-0.5 rounded font-bold',
          pred.probability > 60 ? 'text-red-400 bg-red-500/10' :
          pred.probability > 30 ? 'text-amber-400 bg-amber-500/10' :
          'text-emerald-400 bg-emerald-500/10'
        )}>
          {pred.probability}%
        </div>
      </div>

      {/* Aircraft */}
      <span className="text-[10px] text-slate-600 self-center">{flight.aircraft_type}</span>
    </motion.div>
  );
}
