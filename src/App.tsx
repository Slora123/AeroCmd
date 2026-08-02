import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandCenter } from './pages/CommandCenter';
import { FlightOperations } from './pages/FlightOperations';
import { GateManagement } from './pages/GateManagement';
import { SecurityOperations } from './pages/SecurityOperations';
import { BaggageControl } from './pages/BaggageControl';
import { MaintenanceHub } from './pages/MaintenanceHub';
import { StaffCommand } from './pages/StaffCommand';
import { RetailIntelligence } from './pages/RetailIntelligence';
import { PassengerJourney } from './pages/PassengerJourney';
import { useAirportStore } from './stores/airportStore';
import { loadAllData } from './lib/dataLoader';
import { useSimulation } from './hooks/useSimulation';

const CACHE_BUSTER = Date.now();

const PAGE_MAP: Record<string, React.ReactNode> = {
  command: <CommandCenter />,
  flights: <FlightOperations />,
  gates: <GateManagement />,
  security: <SecurityOperations />,
  baggage: <BaggageControl />,
  maintenance: <MaintenanceHub />,
  staff: <StaffCommand />,
  retail: <RetailIntelligence />,
  passengers: <PassengerJourney />,
};

function SimulationStarter() {
  useSimulation();
  return null;
}

export default function App() {
  const { activeView, hasStarted, isSimulationReady, setHasStarted, setAllData, setLoadError } = useAirportStore();
  const [loadProgress, setLoadProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const interval = setInterval(() => {
          setLoadProgress(prev => Math.min(prev + Math.random() * 15, 92));
        }, 300);
        const data = await loadAllData();
        clearInterval(interval);
        setLoadProgress(100);
        setTimeout(() => { setAllData(data); }, 600);
      } catch (err) {
        setLoadError(String(err));
      }
    }
    bootstrap();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SIMULATION_READY') {
        useAirportStore.getState().setSimulationReady(true);
      }
      if (event.data?.type === 'SIMULATION_STARTED') {
        useAirportStore.getState().setHasStarted(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Button click — runs in React, guaranteed to work
  const handleStart = () => {
    setHasStarted(true);
    // Tell iframe to switch to simulation mode
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (win && typeof win.triggerStart === 'function') {
        win.triggerStart();
      } else {
        // Fallback to postMessage
        iframeRef.current?.contentWindow?.postMessage({ type: 'START_SIMULATION' }, '*');
      }
    } catch (_) {}
  };

  const CurrentPage = PAGE_MAP[activeView] ?? <CommandCenter />;

  return (
    <>
      {/* Main Layout Container */}
      <div className="fixed inset-0 z-0 bg-[#060a10] pointer-events-none flex flex-col">
        {hasStarted && <Topbar />}
        <div className="flex-1 flex overflow-hidden relative">
          {hasStarted && <Sidebar />}
          
          <main className="flex-1 relative overflow-hidden pointer-events-none">
            {/* 3D background iframe — always present, but shrinks to fit this main area when dashboard opens */}
            <div 
              className="absolute inset-0 z-0 pointer-events-auto transition-opacity duration-300"
              style={{ 
                opacity: (!hasStarted || activeView === 'command') ? 1 : 0,
                pointerEvents: (!hasStarted || activeView === 'command') ? 'auto' : 'none'
              }}
            >
              <iframe
                ref={iframeRef}
                src={`/simulation/index.html?v=${CACHE_BUSTER}`}
                className="w-full h-full border-0"
                title="AeroCMD Ground Operations Simulation"
                style={{ display: 'block' }}
              />
            </div>
            
            {hasStarted && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full pointer-events-none"
                  >
                    {CurrentPage}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {hasStarted && <SimulationStarter />}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(2,8,24,0.7)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            fontSize: '12px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          },
        }}
      />
    </>
  );
}
