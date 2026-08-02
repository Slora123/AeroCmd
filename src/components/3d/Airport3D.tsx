import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { useAirportStore } from '../../stores/airportStore';
import {
  LightingManager,
  WeatherManager,
  AirportLayoutManager,
  AircraftManager,
  VehicleManager,
  FlyingAircraftManager
} from './Airport3DComponents';

type TimePreset = 'Morning' | 'Afternoon' | 'Sunset' | 'Night';
type WeatherPreset = 'Clear' | 'Cloudy' | 'Light Rain' | 'Foggy Morning';

// Main Orchestrated Scene Component
function AirportScene({
  timePreset = 'Night',
  weatherPreset = 'Clear'
}: {
  timePreset?: TimePreset;
  weatherPreset?: WeatherPreset;
}) {
  const { flights, selectedFlightId, hasStarted } = useAirportStore();
  const cameraRef = useRef<any>(null);

  // Dynamic Gate Locations read from Dataset
  const dynamicGateLayout = useMemo(() => {
    const gateSet = Array.from(new Set(flights.map(f => f.gate).filter(Boolean)));
    const gates = gateSet.length > 0 ? gateSet : ['B3', 'B7', 'B11', 'B12', 'B17', 'B27', 'B29', 'B32', 'B36', 'B50'];

    return gates.slice(0, 10).map((gate, i) => ({
      gate,
      position: [(i - 4.5) * 16, 0, 12] as [number, number, number],
      jetwayPos: [(i - 4.5) * 16, 0, 8] as [number, number, number],
    }));
  }, [flights]);

  // CameraManager: Smooth Flight & Gate Tracking
  useEffect(() => {
    if (!hasStarted) return;
    
    if (selectedFlightId && cameraRef.current) {
      const flight = flights.find(f => f.flight_id === selectedFlightId);
      if (flight) {
        const targetGate = dynamicGateLayout.find(g => g.gate === flight.gate);
        if (targetGate) {
          const [gx, gy, gz] = targetGate.position;
          cameraRef.current.setLookAt(gx, 12, gz + 22, gx, gy, gz, true);
        }
      }
    } else if (cameraRef.current) {
      cameraRef.current.setLookAt(0, 35, 300, 0, 12, 0, true);
    }
  }, [selectedFlightId, flights, dynamicGateLayout, hasStarted]);

  // Sky color mirrors the LightingManager background for WeatherManager fog match
  const skyColor = timePreset === 'Morning' ? '#162040'
    : timePreset === 'Afternoon' ? '#0a1628'
      : timePreset === 'Sunset' ? '#1e1035'
        : '#060d1e';

  return (
    <>
      {/* 1. Lighting Manager */}
      <LightingManager timePreset={timePreset} />

      {/* 2. Weather Manager */}
      <WeatherManager weatherPreset={weatherPreset} skyColor={skyColor} />

      <group scale={2.5}>
        {/* 3. Airport Layout Manager (includes buildings & terrain) */}
        <Suspense fallback={null}>
          <AirportLayoutManager isNight={timePreset === 'Night'} isRain={weatherPreset === 'Light Rain'} />
        </Suspense>

        {/* 4. Aircraft & Jetway Manager */}
        <Suspense fallback={null}>
          <AircraftManager dynamicGateLayout={dynamicGateLayout} />
        </Suspense>

        {/* 5. Vehicle & Passenger Manager */}
        <Suspense fallback={null}>
          <VehicleManager />
        </Suspense>

        {/* 6. Flying Ambient Aircraft */}
        <Suspense fallback={null}>
          <FlyingAircraftManager />
        </Suspense>
      </group>

      <IntroCinematicManager cameraRef={cameraRef} hasStarted={hasStarted} />

      {/* 6. Camera Manager */}
      <CameraControls
        ref={cameraRef}
        minDistance={10}
        maxDistance={600}
        maxPolarAngle={Math.PI / 2.05}
        dollySpeed={0.7}
        smoothTime={0.45}
        draggingSmoothTime={0.08}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro Sequence Camera Manager
// ─────────────────────────────────────────────────────────────────────────────
function IntroCinematicManager({ cameraRef, hasStarted }: { cameraRef: React.RefObject<any>, hasStarted: boolean }) {
  useFrame(({ clock }) => {
    if (hasStarted || !cameraRef.current) return;
    
    const t = Math.min(clock.elapsedTime / 10, 1.0);
    // Smoothstep easing
    const ease = t * t * (3 - 2 * t);
    
    const startPos = [-150, 200, 900];
    const endPos = [0, 120, 600];
    
    const startLook = [0, 0, 0];
    const endLook = [0, 12, 0];
    
    const curP = [
      startPos[0] + (endPos[0] - startPos[0]) * ease,
      startPos[1] + (endPos[1] - startPos[1]) * ease,
      startPos[2] + (endPos[2] - startPos[2]) * ease,
    ];
    
    const curL = [
      startLook[0] + (endLook[0] - startLook[0]) * ease,
      startLook[1] + (endLook[1] - startLook[1]) * ease,
      startLook[2] + (endLook[2] - startLook[2]) * ease,
    ];
    
    cameraRef.current.setLookAt(...curP, ...curL, false);
  });
  return null;
}

// Main Component Export
export function Airport3D({ className }: { className?: string }) {
  const { hasStarted } = useAirportStore();
  const [timePreset, setTimePreset] = useState<TimePreset>('Morning');
  const [weatherPreset, setWeatherPreset] = useState<WeatherPreset>('Clear');

  return (
    <div className={`relative ${className}`}>
      {hasStarted && (
        <div className="absolute top-14 left-52 z-30 flex gap-1.5 pointer-events-auto
                        bg-black/40 backdrop-blur-xl px-2 py-1.5 rounded-xl
                        border border-white/8 shadow-lg">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider self-center pr-1">Time</span>
          {(['Morning', 'Afternoon', 'Sunset', 'Night'] as TimePreset[]).map(t => (
            <button
              key={t}
              onClick={() => setTimePreset(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${timePreset === t
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/50'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-white/5'
                }`}
            >
              {t}
            </button>
          ))}
          <div className="w-px bg-white/10 mx-1" />
          <span className="text-[9px] text-slate-500 uppercase tracking-wider self-center pr-1">Wx</span>
          {(['Clear', 'Cloudy', 'Light Rain', 'Foggy Morning'] as WeatherPreset[]).map(w => (
            <button
              key={w}
              onClick={() => setWeatherPreset(w)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${weatherPreset === w
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
                }`}
            >
              {w === 'Foggy Morning' ? 'Fog' : w === 'Light Rain' ? 'Rain' : w}
            </button>
          ))}
        </div>
      )}

      <Canvas
        camera={{ position: [-150, 200, 900], fov: 65 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: '#060d1e' }}
      >
        <AirportScene timePreset={timePreset} weatherPreset={weatherPreset} />
      </Canvas>
    </div>
  );
}
