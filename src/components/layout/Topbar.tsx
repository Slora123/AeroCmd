import { motion } from 'framer-motion';
import { Bell, Zap, Pause, Play, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAirportStore } from '../../stores/airportStore';
import { LiveDot } from '../ui';
import { cn } from '../../utils';

const VIEW_LABELS: Record<string, string> = {
  command: 'Command Center',
  flights: 'Flight Operations',
  gates: 'Gate Management',
  security: 'Security Operations',
  baggage: 'Baggage Control',
  maintenance: 'Maintenance Hub',
  staff: 'Staff Command',
  retail: 'Retail Intelligence',
  passengers: 'Passenger Journey',
};

export function Topbar() {
  const { activeView, kpis, simulation, setSimulation, liveEvents } = useAirportStore();
  const criticalEvents = liveEvents.filter(e => e.severity === 'critical');
  const now = simulation.currentTime;

  return (
    <div
      className="mx-4 mt-4 h-14 flex items-center px-5 gap-4 rounded-2xl pointer-events-auto shadow-2xl backdrop-blur-3xl bg-slate-950/40 border border-white/10 flex-shrink-0"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="text-slate-600">DEL</span>
        <ChevronRight size={10} />
        <span className="text-white font-medium">{VIEW_LABELS[activeView] ?? activeView}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Live Time */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6">
        <LiveDot active={simulation.isRunning} size="sm" />
        <span className="text-xs text-white tabular-nums font-mono">
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-xs text-slate-600">IST</span>
      </div>

      {/* Sim Speed Controls */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/4 border border-white/6">
        <button
          onClick={() => setSimulation({ isRunning: !simulation.isRunning })}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          {simulation.isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>
        {[1, 2, 5].map(speed => (
          <button
            key={speed}
            onClick={() => setSimulation({ speed, isRunning: true })}
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded transition-all',
              simulation.speed === speed && simulation.isRunning
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-600 hover:text-slate-300'
            )}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* KPI Chips */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/4 border border-white/6 text-xs">
          <span className="text-emerald-400 font-bold">{kpis.onTimeRate}%</span>
          <span className="text-slate-600">OTP</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/4 border border-white/6 text-xs">
          <span className={cn('font-bold', kpis.healthScore >= 80 ? 'text-emerald-400' : kpis.healthScore >= 60 ? 'text-amber-400' : 'text-red-400')}>
            {kpis.healthScore}
          </span>
          <span className="text-slate-600">Health</span>
        </div>
        {kpis.delayedFlights > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <AlertTriangle size={10} className="text-amber-400" />
            <span className="text-amber-400 font-bold">{kpis.delayedFlights}</span>
            <span className="text-amber-600">Delayed</span>
          </div>
        )}
      </div>

      {/* Alert Bell */}
      <button className="relative p-2 rounded-lg bg-white/4 border border-white/6 text-slate-400 hover:text-white transition-colors">
        <Bell size={14} />
        {criticalEvents.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[8px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center status-blink">
            {Math.min(9, criticalEvents.length)}
          </span>
        )}
      </button>
    </div>
  );
}
