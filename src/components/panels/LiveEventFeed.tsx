import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, XCircle, Plane, Shield, Briefcase, Wrench, DoorOpen, ShoppingBag } from 'lucide-react';
import { useAirportStore } from '../../stores/airportStore';
import type { LiveEvent } from '../../types';
import { cn } from '../../utils';

const EventIcon = ({ type }: { type: LiveEvent['type'] }) => {
  const icons: Record<LiveEvent['type'], React.ReactNode> = {
    boarding: <Plane size={10} />,
    departure: <Plane size={10} />,
    arrival: <Plane size={10} />,
    alert: <AlertTriangle size={10} />,
    maintenance: <Wrench size={10} />,
    security: <Shield size={10} />,
    baggage: <Briefcase size={10} />,
    gate: <DoorOpen size={10} />,
    retail: <ShoppingBag size={10} />,
  };
  return <>{icons[type]}</>;
};

function EventRow({ event }: { event: LiveEvent }) {
  const severityStyle = {
    info: { dot: 'bg-cyan-400', text: 'text-slate-300', bg: '' },
    warning: { dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-500/5' },
    critical: { dot: 'bg-red-400 status-blink', text: 'text-red-300', bg: 'bg-red-500/8' },
    success: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/5' },
  }[event.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex items-start gap-2 px-3 py-2 border-b border-white/4 hover:bg-white/3 transition-colors', severityStyle.bg)}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', severityStyle.dot)} />
        <span className={cn('text-slate-500', event.severity === 'critical' ? 'text-red-400' : '')}>
          <EventIcon type={event.type} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[11px] leading-tight', severityStyle.text)}>{event.message}</p>
        <p className="text-[9px] text-slate-600 mt-0.5 tabular-nums">
          {event.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export function LiveEventFeed({ maxItems = 20, className }: { maxItems?: number; className?: string }) {
  const { liveEvents } = useAirportStore();
  const visible = liveEvents.slice(0, maxItems);

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live Operations</span>
        </div>
        <span className="text-[10px] text-slate-600">{visible.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-y">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-600">
            Waiting for events...
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
