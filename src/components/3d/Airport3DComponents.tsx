/**
 * Airport3DComponents.tsx
 * Scene Manager Modules — every uploaded GLB asset is used here.
 * No placeholder cubes for any element that has an equivalent GLB.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text, Billboard, Sky, Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useAirportStore } from '../../stores/airportStore';

// ─── Preload ALL 22 GLB assets at module-init for instant streaming ───────────
const GLB = {
  airport:         '/assets/glb/airport.glb',
  airportTerminal: '/assets/glb/airport_terminal.glb',
  controlTower:    '/assets/glb/control_tower.glb',
  jetway:          '/assets/glb/jetway.glb',
  jetway2:         '/assets/glb/jetway2.glb',
  airplane1:       '/assets/glb/airplane1.glb',
  airplane2:       '/assets/glb/airplane2.glb',
  airplane3:       '/assets/glb/airplane3.glb',
  airplane4:       '/assets/glb/airplane4.glb',
  airplane5:       '/assets/glb/airplane5.glb',
  airplane6:       '/assets/glb/airplane6.glb',
  airplane7:       '/assets/glb/airplane7.glb',
  baggageCart:     '/assets/glb/airport_baggage_cart.glb',
  fuelTruck:       '/assets/glb/airport_fuel_truck.glb',
  passengerBus:    '/assets/glb/airport_passenger_bus.glb',
  tug:             '/assets/glb/airport_tug.glb',
  pushback:        '/assets/glb/pushback.glb',
  cargoContainer:  '/assets/glb/cargo_container.glb',
  streetLight:     '/assets/glb/street_light.glb',
  barrier:         '/assets/glb/barrier.glb',
  trafficCone:     '/assets/glb/traffic_cone.glb',
  roadCone:        '/assets/glb/road_cone.glb',
} as const;

// Preload all
Object.values(GLB).forEach(p => useGLTF.preload(p));

// Fleet: 7 aircraft GLBs rotate across flights
const AIRCRAFT_PATHS = [
  GLB.airplane1, GLB.airplane2, GLB.airplane3, GLB.airplane4,
  GLB.airplane5, GLB.airplane6, GLB.airplane7,
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. LightingManager
// ─────────────────────────────────────────────────────────────────────────────
export function LightingManager({ timePreset }: {
  timePreset: 'Morning' | 'Afternoon' | 'Sunset' | 'Night';
}) {
  const cfg = useMemo(() => {
    switch (timePreset) {
      case 'Morning':   return { ambient:1.2, main:2.0, pos:[50,60,30]   as [number,number,number], sky:'#162040', col:'#fde68a' };
      case 'Afternoon': return { ambient:1.5, main:2.5, pos:[10,100,20]  as [number,number,number], sky:'#0a1628', col:'#ffffff' };
      case 'Sunset':    return { ambient:0.9, main:1.8, pos:[-60,30,40]  as [number,number,number], sky:'#1e1035', col:'#f97316' };
      default:          return { ambient:1.2, main:1.5, pos:[20,50,-30]  as [number,number,number], sky:'#060d1e', col:'#60a5fa' };
    }
  }, [timePreset]);

  return (
    <>
      <color attach="background" args={[cfg.sky]} />
      <ambientLight intensity={cfg.ambient} color="#c8d8ff" />
      <directionalLight
        position={cfg.pos} intensity={cfg.main} color={cfg.col}
        castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={0.5} shadow-camera-far={800}
        shadow-camera-left={-300} shadow-camera-right={300}
        shadow-camera-top={300}  shadow-camera-bottom={-300}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WeatherManager
// ─────────────────────────────────────────────────────────────────────────────
export function WeatherManager({ weatherPreset, skyColor = '#060d1e' }: {
  weatherPreset: 'Clear' | 'Cloudy' | 'Light Rain' | 'Foggy Morning';
  skyColor?: string;
}) {
  const isMorning = skyColor === '#162040';
  const isAfternoon = skyColor === '#0a1628';
  const isSunset = skyColor === '#1e1035';
  
  const sunPosition: [number, number, number] = isMorning ? [50, 20, 100] 
                                              : isSunset ? [-100, 10, 50]
                                              : [10, 100, 20];
                                              
  const [near, far] = weatherPreset === 'Foggy Morning' ? [50, 200] : [200, 700];

  return (
    <>
      <fog attach="fog" args={[skyColor, near, far]} />
      {/* ── Volumetric Sky & Clouds ── */}
      <Sky 
        sunPosition={sunPosition} 
        turbidity={isSunset ? 8 : 3} 
        rayleigh={isSunset ? 3 : 1.5} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8} 
      />
      
      {weatherPreset !== 'Clear' && (
        <Clouds material={THREE.MeshBasicMaterial}>
          <Cloud segments={40} bounds={[100, 10, 100]} volume={50} color={isSunset ? '#fca5a5' : '#ffffff'} position={[0, 80, 0]} />
        </Clouds>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AirportLayoutManager — buildings, runways, taxiways, street furniture
// ─────────────────────────────────────────────────────────────────────────────
export function AirportLayoutManager({ isNight = false, isRain = false }: {
  isNight?: boolean;
  isRain?: boolean;
}) {
  // ── Primary buildings ──────────────────────────────────────────────────────
  const { scene: airportRaw }   = useGLTF(GLB.airport);
  const { scene: termRaw }      = useGLTF(GLB.airportTerminal);
  const { scene: towerRaw }     = useGLTF(GLB.controlTower);
  const { scene: cargoRaw }     = useGLTF(GLB.cargoContainer);
  const { scene: lightRaw }     = useGLTF(GLB.streetLight);
  const { scene: barrierRaw }   = useGLTF(GLB.barrier);
  const { scene: coneRaw }      = useGLTF(GLB.trafficCone);
  const { scene: roadConeRaw }  = useGLTF(GLB.roadCone);

  const airport  = useMemo(() => airportRaw.clone(),  [airportRaw]);
  const terminal = useMemo(() => termRaw.clone(),      [termRaw]);
  const tower    = useMemo(() => towerRaw.clone(),     [towerRaw]);

  // Pre-clone arrays so no hook is called inside .map()
  const cargoClones      = useMemo(() => Array.from({ length: 6 },  () => cargoRaw.clone()),     [cargoRaw]);
  const streetLightMain  = useMemo(() => Array.from({ length: 12 }, () => lightRaw.clone()),     [lightRaw]);
  const streetLightRwy   = useMemo(() => Array.from({ length: 8 },  () => lightRaw.clone()),     [lightRaw]);
  const barrierClones    = useMemo(() => Array.from({ length: 10 }, () => barrierRaw.clone()),   [barrierRaw]);
  const coneClones       = useMemo(() => Array.from({ length: 8 },  () => coneRaw.clone()),      [coneRaw]);
  const roadConeClones   = useMemo(() => Array.from({ length: 6 },  () => roadConeRaw.clone()),  [roadConeRaw]);
  const edgeLights       = useMemo(() => Array.from({ length: 14 }, (_, i) => i),                []);

  const radarRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (radarRef.current) radarRef.current.rotation.y += delta * 1.4;
  });

  const emN = isNight ? 1.3 : 0.4;
  const rwRough = isRain ? 0.35 : 0.88;

  return (
    <group>
      {/* ── Ground tarmac ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 750]} />
        <meshStandardMaterial color="#0c1627" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* ══ Terminal Area Lights (Scaled with Group) ══ */}
      {isNight && (
        <group>
          <pointLight position={[0, 22, 5]}   color="#4ab8ff" intensity={1.5} distance={150} />
          <pointLight position={[-45,14,-12]} color="#f59e0b" intensity={1.0} distance={100} />
          <pointLight position={[45, 14,-12]} color="#4ab8ff" intensity={0.8} distance={100} />
        </group>
      )}

      {/* ══ Main terminal (airport.glb) — central passenger terminal ══ */}
      <primitive object={airport} position={[0, 0, -12]} scale={0.045} castShadow receiveShadow />

      {/* ══ Satellite terminal (airport_terminal.glb) — east concourse ══ */}
      <primitive object={terminal} position={[120, 0, -18]} scale={0.038} castShadow receiveShadow />

      {/* ══ ATC Tower (control_tower.glb) + rotating radar ══ */}
      <group position={[72, 0, -42]}>
        <primitive object={tower} scale={0.032} castShadow receiveShadow />
        <group ref={radarRef} position={[0, 22, 0]}>
          <mesh position={[1.0, 0, 0]}>
            <boxGeometry args={[2.0, 0.22, 0.09]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.9} />
          </mesh>
        </group>
        <pointLight position={[0, 24, 0]} color="#ef4444" intensity={isNight ? 4 : 1.2} distance={40} />
      </group>

      {/* ══ Cargo Area (cargo_container.glb × 6) — west freight apron ══ */}
      {cargoClones.map((c, i) => (
        <primitive key={`cargo-${i}`}
          object={c}
          position={[-130 + (i % 3) * 22, 0, -55 + Math.floor(i / 3) * 18]}
          rotation={[0, i % 2 === 0 ? 0 : Math.PI / 2, 0]}
          scale={0.05} castShadow receiveShadow
        />
      ))}

      {/* ══ Runways ══ */}
      {/* Runway 09L/27R */}
      <mesh position={[0, 0.02, -110]} receiveShadow>
        <boxGeometry args={[30, 0.06, 400]} />
        <meshStandardMaterial color="#111827" roughness={rwRough} metalness={isRain ? 0.3 : 0.04} />
      </mesh>
      {/* Runway 09R/27L (parallel) */}
      <mesh position={[0, 0.02, 110]} receiveShadow>
        <boxGeometry args={[30, 0.06, 400]} />
        <meshStandardMaterial color="#111827" roughness={rwRough} metalness={isRain ? 0.3 : 0.04} />
      </mesh>

      {/* Runway 09L centreline yellow dashes */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`dash-${i}`} position={[0, 0.04, -310 + i * 26]}>
          <boxGeometry args={[0.4, 0.01, 11]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={emN * 0.5} />
        </mesh>
      ))}
      {/* Runway 09R centreline */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`dash2-${i}`} position={[0, 0.04, -90 + i * 26]}>
          <boxGeometry args={[0.4, 0.01, 11]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={emN * 0.4} />
        </mesh>
      ))}

      {/* Runway threshold bars — 09L */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map(x => (
        <mesh key={`thr-${x}`} position={[x * 7, 0.04, -310]}>
          <boxGeometry args={[2, 0.01, 9]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#fff" emissiveIntensity={emN * 0.4} />
        </mesh>
      ))}

      {/* ══ Runway edge lights (09L) ══ */}
      {edgeLights.map((_, i) => (
        <group key={`el-${i}`}>
          <pointLight position={[-15.5, 0.4, -310 + i * 30]} color="#ffffff" intensity={isNight ? 2 : 0} distance={12} />
          <pointLight position={[15.5,  0.4, -310 + i * 30]} color="#ffffff" intensity={isNight ? 2 : 0} distance={12} />
        </group>
      ))}

      {/* ══ Taxiways ══ */}
      {/* TWY Alpha */}
      <mesh position={[38, 0.015, 0]} receiveShadow>
        <boxGeometry args={[20, 0.04, 380]} />
        <meshStandardMaterial color="#192236" roughness={0.90} />
      </mesh>
      <mesh position={[38, 0.036, 0]}>
        <boxGeometry args={[0.35, 0.01, 380]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={emN} />
      </mesh>
      {/* TWY Bravo */}
      <mesh position={[-52, 0.012, 0]} receiveShadow>
        <boxGeometry args={[12, 0.03, 320]} />
        <meshStandardMaterial color="#1c2840" roughness={0.93} />
      </mesh>
      <mesh position={[-52, 0.032, 0]}>
        <boxGeometry args={[0.3, 0.01, 320]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={emN * 0.7} />
      </mesh>

      {/* ══ Apron / ramp ══ */}
      <mesh position={[0, 0.01, 18]} receiveShadow>
        <boxGeometry args={[210, 0.03, 26]} />
        <meshStandardMaterial color="#111827" roughness={0.80} />
      </mesh>
      {/* Hold-short line */}
      <mesh position={[0, 0.033, 32]}>
        <boxGeometry args={[210, 0.01, 0.35]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#fff" emissiveIntensity={0.3} />
      </mesh>

      {/* ══ Street Lights — perimeter road & terminal entrance ══ */}
      {streetLightMain.map((sl, i) => (
        <primitive key={`sl-${i}`} object={sl} position={[-110 + i * 20, 0, 45]} scale={0.8} />
      ))}
      {/* Runway perimeter lights */}
      {streetLightRwy.map((sl2, i) => (
        <primitive key={`sl2-${i}`} object={sl2} position={[-70 + i * 20, 0, -55]} scale={0.8} />
      ))}

      {/* ══ Security barriers — restricted apron boundary ══ */}
      {barrierClones.map((b, i) => (
        <primitive key={`bar-${i}`} object={b} position={[-90 + i * 18, 0.1, 36]} scale={1.2} />
      ))}

      {/* ══ Traffic cones — work zone / aircraft parking guidance ══ */}
      {coneClones.map((tc, i) => (
        <primitive key={`tc-${i}`} object={tc} position={[-60 + i * 16, 0, 36]} scale={1.5} />
      ))}

      {/* ══ Road cones — maintenance zone on cargo apron ══ */}
      {roadConeClones.map((rc, i) => (
        <primitive key={`rc-${i}`} object={rc} position={[-125 + i * 8, 0, -28]} scale={1.2} />
      ))}

      {/* ══ Distant scale horizon ══ */}
      <mesh position={[0, -14, -450]}>
        <cylinderGeometry args={[600, 650, 50, 32, 1, true]} />
        <meshStandardMaterial color="#08102a" side={THREE.BackSide} roughness={1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AircraftManager — 7-model fleet + jetway1/jetway2 + gate labels
// ─────────────────────────────────────────────────────────────────────────────
export function AircraftManager({ dynamicGateLayout }: {
  dynamicGateLayout: Array<{ gate: string; position: [number,number,number]; jetwayPos: [number,number,number] }>;
}) {
  const { flights, gateOccupancy, selectedFlightId, setSelectedFlight } = useAirportStore();

  // Load all 7 aircraft + both jetway models
  const { scene: ap1 } = useGLTF(GLB.airplane1);
  const { scene: ap2 } = useGLTF(GLB.airplane2);
  const { scene: ap3 } = useGLTF(GLB.airplane3);
  const { scene: ap4 } = useGLTF(GLB.airplane4);
  const { scene: ap5 } = useGLTF(GLB.airplane5);
  const { scene: ap6 } = useGLTF(GLB.airplane6);
  const { scene: ap7 } = useGLTF(GLB.airplane7);
  const { scene: jw1 } = useGLTF(GLB.jetway);
  const { scene: jw2 } = useGLTF(GLB.jetway2);

  const basePlanes = useMemo(() => [ap1, ap2, ap3, ap4, ap5, ap6, ap7], [ap1,ap2,ap3,ap4,ap5,ap6,ap7]);
  const baseJw1    = useMemo(() => jw1.clone(), [jw1]);
  const baseJw2    = useMemo(() => jw2.clone(), [jw2]);

  // Per-gate stable clones (aircraft + jetway)
  const perGate = useMemo(() => dynamicGateLayout.map((_, idx) => ({
    aircraft: basePlanes[idx % 7].clone(),
    jetway:   idx % 2 === 0 ? baseJw1.clone() : baseJw2.clone(),
  })), [dynamicGateLayout.length]); // eslint-disable-line

  return (
    <group>
      {dynamicGateLayout.map(({ gate, position, jetwayPos }, idx) => {
        const occ      = gateOccupancy.find(g => g.gate === gate);
        const flight   = flights.find(f => f.gate === gate);
        const isParked = idx < 8;
        const isSelected = selectedFlightId === flight?.flight_id;
        const models   = perGate[idx];
        if (!models) return null;

        const isBoarding = occ?.status === 'boarding' || flight?.status === 'Boarding';

        return (
          <group key={gate}>
            {/* Jetway (jetway.glb or jetway2.glb alternating per gate) */}
            <primitive
              object={models.jetway}
              position={jetwayPos}
              scale={idx % 2 === 0 ? 0.05 : 0.04}
              castShadow
            />

            {/* Parked aircraft from fleet */}
            {isParked && (
              <group position={[position[0], 0.4, position[2] + 6]} rotation={[0, Math.PI, 0]}>
                <primitive object={models.aircraft} scale={0.016} castShadow receiveShadow />
                {/* FAA Nav lights */}
                <pointLight position={[2.4, 0.6, -0.5]}  color="#00ff88" intensity={isSelected ? 2.5 : 0.9} distance={7} />
                <pointLight position={[-2.4, 0.6, -0.5]} color="#ff3333" intensity={isSelected ? 2.5 : 0.9} distance={7} />
                {/* Selection ring */}
                {isSelected && (
                  <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[3.0, 3.3, 48]} />
                    <meshBasicMaterial color="#00d4ff" side={THREE.DoubleSide} transparent opacity={0.8} />
                  </mesh>
                )}
              </group>
            )}

            {/* Gate pad indicator */}
            <group
              position={position}
              onClick={() => flight ? setSelectedFlight(flight.flight_id) : setSelectedFlight(null)}
            >
              <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.5, 32]} />
                <meshStandardMaterial
                  color={isBoarding ? '#0ea5e9' : flight ? '#10b981' : '#1e3a5f'}
                  emissive={isBoarding ? '#0ea5e9' : flight ? '#10b981' : '#1e3a5f'}
                  emissiveIntensity={0.65}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <Billboard>
                <Text position={[0, 2.2, 0]} fontSize={0.42} color="#f8fafc" anchorX="center" anchorY="middle"
                  outlineColor="#000" outlineWidth={0.04}>
                  {gate}
                </Text>
                {flight && (
                  <Text position={[0, 1.64, 0]} fontSize={0.28} color="#38bdf8" anchorX="center" anchorY="middle">
                    {flight.flight_id}
                  </Text>
                )}
              </Billboard>
            </group>
          </group>
        );
      })}

      {/* ── Active-traffic aircraft (taxiing + runway line-up) ── */}
      <TaxiingAircraft basePlanes={basePlanes} />
    </group>
  );
}

// Aircraft animating along taxiway and runway
function TaxiingAircraft({ basePlanes }: { basePlanes: THREE.Group[] }) {
  const taxi1Ref = useRef<THREE.Group>(null);
  const taxi2Ref = useRef<THREE.Group>(null);
  const taxi1Model = useMemo(() => basePlanes[0].clone(), [basePlanes]);
  const taxi2Model = useMemo(() => basePlanes[3].clone(), [basePlanes]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Taxiway circuit — aircraft slowly moves along TWY-A
    if (taxi1Ref.current) {
      taxi1Ref.current.position.z = 80 - ((t * 4) % 180);
    }
    // Hold short then line up on runway
    if (taxi2Ref.current) {
      const cycle = (t * 2) % 60;
      taxi2Ref.current.position.z = cycle < 30 ? -260 + cycle * 2 : -200 + (cycle - 30) * 3;
    }
  });

  return (
    <>
      <group ref={taxi1Ref} position={[38, 0.4, 80]} rotation={[0, Math.PI, 0]}>
        <primitive object={taxi1Model} scale={0.016} castShadow receiveShadow />
        <pointLight position={[2.4, 0.6, -0.5]}  color="#00ff88" intensity={0.7} distance={6} />
        <pointLight position={[-2.4, 0.6, -0.5]} color="#ff3333" intensity={0.7} distance={6} />
      </group>
      <group ref={taxi2Ref} position={[0, 0.4, -260]} rotation={[0, 0, 0]}>
        <primitive object={taxi2Model} scale={0.016} castShadow receiveShadow />
      </group>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VehicleManager — all ground support vehicles + passenger silhouettes
// ─────────────────────────────────────────────────────────────────────────────
export function VehicleManager() {
  const { scene: baggageRaw  } = useGLTF(GLB.baggageCart);
  const { scene: fuelRaw     } = useGLTF(GLB.fuelTruck);
  const { scene: busRaw      } = useGLTF(GLB.passengerBus);
  const { scene: tugRaw      } = useGLTF(GLB.tug);
  const { scene: pushbackRaw } = useGLTF(GLB.pushback);

  // Base clones (one each per vehicle type — additional clones per placement)
  const fuel     = useMemo(() => fuelRaw.clone(),     [fuelRaw]);
  const pushback = useMemo(() => pushbackRaw.clone(),  [pushbackRaw]);

  // Animated references
  const busRef    = useRef<THREE.Group>(null);
  const bagRef1   = useRef<THREE.Group>(null);
  const bagRef2   = useRef<THREE.Group>(null);
  const tugRef    = useRef<THREE.Group>(null);

  const busModel  = useMemo(() => busRaw.clone(),     [busRaw]);
  const bag1Model = useMemo(() => baggageRaw.clone(), [baggageRaw]);
  const bag2Model = useMemo(() => baggageRaw.clone(), [baggageRaw]);
  const tug1Model = useMemo(() => tugRaw.clone(),     [tugRaw]);

  // Stationary clones
  const baggageLeft   = useMemo(() => baggageRaw.clone(), [baggageRaw]);
  const baggageRight  = useMemo(() => baggageRaw.clone(), [baggageRaw]);
  const stationaryTug = useMemo(() => tugRaw.clone(),     [tugRaw]);
  const secondaryFuel = useMemo(() => fuelRaw.clone(),    [fuelRaw]);
  const remoteBus     = useMemo(() => busRaw.clone(),     [busRaw]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Bus: shuttle loop between terminal and remote stand
    if (busRef.current) {
      const cycle = (t * 5) % 120;
      busRef.current.position.x = -80 + cycle;
      busRef.current.rotation.y = cycle > 60 ? 0 : Math.PI;
    }
    // Baggage cart 1: service loop near gates
    if (bagRef1.current) {
      bagRef1.current.position.z = 14 + Math.sin(t * 0.8) * 18;
    }
    // Baggage cart 2: cargo apron circuit
    if (bagRef2.current) {
      bagRef2.current.position.x = -110 + Math.sin(t * 0.5) * 20;
    }
    // Tug: slow cargo movement
    if (tugRef.current) {
      tugRef.current.position.x = -130 + ((t * 3) % 60);
    }
  });

  const paxRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!paxRef.current) return;
    paxRef.current.children.forEach((p, i) => {
      p.position.x += Math.sin(state.clock.elapsedTime * 0.9 + i * 1.4) * 0.016;
    });
  });

  return (
    <group>
      {/* ── Passenger silhouettes — terminal apron ── */}
      <group ref={paxRef} position={[0, 0.45, -3]}>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={`pax-${i}`} position={[(i - 12) * 1.8, 0, (i % 5) * 1.1]}>
            <capsuleGeometry args={[0.12, 0.50, 4, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── Fuel truck parked at gate wing ── */}
      <primitive object={fuel} position={[-32, 0.22, 16]} rotation={[0, Math.PI / 6, 0]} scale={0.028} castShadow />

      {/* ── Pushback tug at departing gate ── */}
      <primitive object={pushback} position={[-18, 0.22, 22]} scale={0.038} castShadow />

      {/* ── Animated passenger bus (airport_passenger_bus.glb) ── */}
      <group ref={busRef} position={[-80, 0.22, 40]}>
        <primitive object={busModel} scale={0.040} castShadow receiveShadow />
      </group>

      {/* ── Animated baggage cart 1 near gates ── */}
      <group ref={bagRef1} position={[12, 0.22, 14]}>
        <primitive object={bag1Model} scale={0.045} castShadow />
      </group>

      {/* ── Animated baggage cart 2 near cargo ── */}
      <group ref={bagRef2} position={[-110, 0.22, -30]}>
        <primitive object={bag2Model} scale={0.045} castShadow />
      </group>

      {/* ── Stationary baggage carts (extra instances) ── */}
      <primitive object={baggageLeft} position={[-28, 0.22, 18]} rotation={[0, Math.PI / 2, 0]} scale={0.045} castShadow />
      <primitive object={baggageRight} position={[20, 0.22, 18]}  rotation={[0, -Math.PI / 2, 0]} scale={0.045} castShadow />

      {/* ── Animated tug (cargo movement) ── */}
      <group ref={tugRef} position={[-130, 0.22, -40]}>
        <primitive object={tug1Model} scale={0.030} castShadow />
      </group>

      {/* ── Stationary tugs ── */}
      <primitive object={stationaryTug} position={[100, 0.22, -28]} rotation={[0, Math.PI / 3, 0]} scale={0.030} castShadow />

      {/* ── Second fuel truck at satellite terminal ── */}
      <primitive object={secondaryFuel} position={[115, 0.22, -20]} rotation={[0, -Math.PI / 4, 0]} scale={0.028} castShadow />

      {/* ── Extra buses at remote stands ── */}
      <primitive object={remoteBus} position={[80, 0.22, 42]} rotation={[0, Math.PI, 0]} scale={0.040} castShadow receiveShadow />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FlyingAircraftManager — Realistic aircraft with correct heading & curved paths
// ─────────────────────────────────────────────────────────────────────────────

/** Evaluate a cubic Bézier at t ∈ [0,1] */
function bezier3(
  p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3,
  t: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  const u = 1 - t;
  return out.set(
    u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
    u*u*u*p0.z + 3*u*u*t*p1.z + 3*u*t*t*p2.z + t*t*t*p3.z,
  );
}

/** Evaluate the tangent (derivative) of the cubic Bézier at t */
function bezier3Tangent(
  p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3,
  t: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  const u = 1 - t;
  return out.set(
    3*(u*u*(p1.x-p0.x) + 2*u*t*(p2.x-p1.x) + t*t*(p3.x-p2.x)),
    3*(u*u*(p1.y-p0.y) + 2*u*t*(p2.y-p1.y) + t*t*(p3.y-p2.y)),
    3*(u*u*(p1.z-p0.z) + 2*u*t*(p2.z-p1.z) + t*t*(p3.z-p2.z)),
  );
}

/** Smooth ease-in-out (smoothstep) */
function smoothstep(t: number) { return t * t * (3 - 2 * t); }

export function FlyingAircraftManager() {
  const { scene } = useGLTF(GLB.airplane1);
  const { scene: scene2 } = useGLTF(GLB.airplane7);

  const aircraft1 = useRef<THREE.Group>(null);
  const aircraft2 = useRef<THREE.Group>(null);

  const clone1 = useMemo(() => scene.clone(), [scene]);
  const clone2 = useMemo(() => scene2.clone(), [scene2]);

  // ── Aircraft 1: Final-approach path (right-to-left, descending) ──────────────
  // Kept well above Y=140 at the midpoint so it clearly passes ABOVE the 3D scene
  // "card region" in view-space. Starts high, gentle glideslope.
  const A1_P0 = useMemo(() => new THREE.Vector3( 700, 280,  220), []);
  const A1_P1 = useMemo(() => new THREE.Vector3( 350, 230,  -40), []);
  const A1_P2 = useMemo(() => new THREE.Vector3(   0, 170, -160), []);
  const A1_P3 = useMemo(() => new THREE.Vector3(-550,  90, -220), []);

  // ── Aircraft 2: Wide sweeping arc (left-to-right, climbing departure) ─────────
  const A2_P0 = useMemo(() => new THREE.Vector3(-600,  80,  200), []);
  const A2_P1 = useMemo(() => new THREE.Vector3(-200, 160,  -80), []);
  const A2_P2 = useMemo(() => new THREE.Vector3( 200, 230,  -80), []);
  const A2_P3 = useMemo(() => new THREE.Vector3( 650, 280,  160), []);

  const _pos  = useMemo(() => new THREE.Vector3(), []);
  const _tan  = useMemo(() => new THREE.Vector3(), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _up   = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;

    // ── Aircraft 1 – 24-second loop ──
    {
      const rawT = (elapsed % 24) / 24;           // repeats every 24s
      const t    = smoothstep(Math.min(rawT * 1.08, 1)); // slight ease-in/out, clamp
      bezier3(A1_P0, A1_P1, A1_P2, A1_P3, t, _pos);
      bezier3Tangent(A1_P0, A1_P1, A1_P2, A1_P3, t, _tan);

      if (aircraft1.current && _tan.lengthSq() > 0.001) {
        _tan.normalize();
        aircraft1.current.position.copy(_pos);

        // Yaw – nose toward tangent projected on XZ plane
        const yaw = Math.atan2(_tan.x, _tan.z);
        // Pitch – nose-down angle
        const pitch = Math.asin(THREE.MathUtils.clamp(_tan.y, -1, 1));
        // Bank – proportional to how much we're turning in the XZ plane
        const xzLen = Math.sqrt(_tan.x * _tan.x + _tan.z * _tan.z);
        const bank  = xzLen > 0.01 ? THREE.MathUtils.clamp(-_tan.x / xzLen * 0.45, -0.55, 0.55) : 0;

        aircraft1.current.rotation.order = 'YXZ';
        aircraft1.current.rotation.set(pitch, yaw, bank);
      }
    }

    // ── Aircraft 2 – 30-second loop, offset phase ──
    {
      const rawT = ((elapsed + 14) % 30) / 30;
      const t    = smoothstep(Math.min(rawT * 1.08, 1));
      bezier3(A2_P0, A2_P1, A2_P2, A2_P3, t, _pos);
      bezier3Tangent(A2_P0, A2_P1, A2_P2, A2_P3, t, _tan);

      if (aircraft2.current && _tan.lengthSq() > 0.001) {
        _tan.normalize();
        aircraft2.current.position.copy(_pos);

        const yaw  = Math.atan2(_tan.x, _tan.z);
        const pitch = Math.asin(THREE.MathUtils.clamp(_tan.y, -1, 1));
        const xzLen = Math.sqrt(_tan.x * _tan.x + _tan.z * _tan.z);
        const bank  = xzLen > 0.01 ? THREE.MathUtils.clamp(-_tan.x / xzLen * 0.4, -0.5, 0.5) : 0;

        aircraft2.current.rotation.order = 'YXZ';
        aircraft2.current.rotation.set(pitch, yaw, bank);
      }
    }
  });

  return (
    <group>
      {/* scale tuned so aircraft appear large but not gigantic in the wide view */}
      <primitive ref={aircraft1} object={clone1} scale={0.06} />
      <primitive ref={aircraft2} object={clone2} scale={0.055} />
    </group>
  );
}
