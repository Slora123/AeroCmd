import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plane, DoorOpen, Shield, Briefcase,
  Wrench, Users, ShoppingBag, User, Search, X, ChevronLeft,
  Activity, Bell, Settings, Zap, Menu, Clock,
} from 'lucide-react';
import { useAirportStore } from '../../stores/airportStore';
import { cn } from '../../utils';
import { LiveDot } from '../ui';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'command', icon: LayoutDashboard, label: 'Command Center', badge: null },
  { id: 'flights', icon: Plane, label: 'Flight Operations', badge: null },
  { id: 'gates', icon: DoorOpen, label: 'Gate Management', badge: null },
  { id: 'security', icon: Shield, label: 'Security Ops', badge: null },
  { id: 'baggage', icon: Briefcase, label: 'Baggage Control', badge: null },
  { id: 'maintenance', icon: Wrench, label: 'Maintenance Hub', badge: null },
  { id: 'staff', icon: Users, label: 'Staff Command', badge: null },
  { id: 'retail', icon: ShoppingBag, label: 'Retail Intel', badge: null },
  { id: 'passengers', icon: User, label: 'Passenger Journey', badge: null },
];

export function Sidebar() {
  const {
    activeView, setActiveView, sidebarCollapsed, toggleSidebar,
    globalSearch, setGlobalSearch, kpis, liveEvents, simulation,
  } = useAirportStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const alerts = liveEvents.filter(e => e.severity === 'critical').length;
  
  const isExpanded = !sidebarCollapsed || isHovered;

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="m-4 rounded-2xl pointer-events-auto flex-shrink-0 flex flex-col relative overflow-hidden shadow-2xl backdrop-blur-3xl bg-slate-950/40 border border-white/10 z-50"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-50" />

      {/* Logo / Header */}
      <div className="px-3 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: 'linear-gradient(135deg, #00d4ff20 0%, #7c3aed20 100%)', border: '1px solid rgba(0,212,255,0.3)' }}>
          <Plane size={16} className="text-cyan-400 rotate-45" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <img src="/assets/aerocmd_logo.png" alt="AeroCMD" className="h-5 object-contain" />
              <div className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">OP-CENTER</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className={cn('ml-auto text-slate-500 hover:text-white transition-colors', sidebarCollapsed && 'mx-auto')}
        >
          {sidebarCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 mb-3"
          >
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
              searchFocused
                ? 'bg-white/8 border border-cyan-500/30'
                : 'bg-white/4 border border-white/6'
            )}>
              <Search size={12} className="text-slate-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search flights, gates..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none min-w-0"
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch('')}>
                  <X size={10} className="text-slate-500" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <nav className="flex-1 px-2 overflow-y-auto space-y-0.5 scroll-y">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          // Dynamic badge counts
          const badgeCount = item.id === 'security' && kpis.securityFlagged > 0 ? kpis.securityFlagged
            : item.id === 'maintenance' && kpis.activeMaintenanceAOG > 0 ? kpis.activeMaintenanceAOG
            : item.id === 'flights' && kpis.delayedFlights > 0 ? kpis.delayedFlights
            : 0;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative group',
                isActive
                  ? 'bg-cyan-500/12 text-cyan-300'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/4'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-cyan-400"
                />
              )}
              <Icon size={15} className={cn('flex-shrink-0', isActive ? 'text-cyan-400' : '')} />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium flex-1 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isExpanded && badgeCount > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {isExpanded && badgeCount > 0 && (
                <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1 py-0.5">
                  {badgeCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/5">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Simulation Status */}
              <div className="flex items-center gap-2 text-[10px]">
                <LiveDot active={simulation.isRunning} />
                <span className="text-slate-500">
                  {simulation.isRunning ? `Live ${simulation.speed}x` : 'Paused'}
                </span>
                <span className="ml-auto text-slate-600 tabular-nums">
                  <Clock size={9} className="inline mr-0.5" />
                  {simulation.currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Airport Health */}
              <div className="flex items-center gap-2">
                <Activity size={10} className={cn(
                  kpis.healthScore >= 80 ? 'text-emerald-400' : kpis.healthScore >= 60 ? 'text-amber-400' : 'text-red-400'
                )} />
                <span className="text-[10px] text-slate-500">Airport Health</span>
                <span className={cn(
                  'ml-auto text-[10px] font-bold tabular-nums',
                  kpis.healthScore >= 80 ? 'text-emerald-400' : kpis.healthScore >= 60 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {kpis.healthScore}%
                </span>
              </div>

              {alerts > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                  <Bell size={10} className="text-red-400 status-blink" />
                  <span className="text-[10px] text-red-400 font-medium">{alerts} Critical Alert{alerts > 1 ? 's' : ''}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
