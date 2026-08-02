import { create } from 'zustand';
import type {
  Flight, Passenger, Baggage, GateEvent,
  SecurityScreening, MaintenanceLog, StaffShift, RetailTransaction,
  AirportKPIs, LiveEvent, SimulationState, GateOccupancy
} from '../types';

interface AirportStore {
  // Raw Data
  flights: Flight[];
  passengers: Passenger[];
  baggage: Baggage[];
  gateEvents: GateEvent[];
  security: SecurityScreening[];
  maintenance: MaintenanceLog[];
  staffShifts: StaffShift[];
  retail: RetailTransaction[];

  // Computed / Derived
  kpis: AirportKPIs;
  liveEvents: LiveEvent[];
  gateOccupancy: GateOccupancy[];

  // UI State
  isLoading: boolean;
  loadError: string | null;
  selectedFlightId: string | null;
  selectedGate: string | null;
  selectedPassengerId: string | null;
  activeView: string;
  globalSearch: string;
  sidebarCollapsed: boolean;
  hasStarted: boolean;
  isSimulationReady: boolean;

  // Simulation
  simulation: SimulationState;

  // Actions
  setAllData: (data: {
    flights: Flight[];
    passengers: Passenger[];
    baggage: Baggage[];
    gateEvents: GateEvent[];
    security: SecurityScreening[];
    maintenance: MaintenanceLog[];
    staffShifts: StaffShift[];
    retail: RetailTransaction[];
  }) => void;
  setSelectedFlight: (id: string | null) => void;
  setSelectedGate: (gate: string | null) => void;
  setSelectedPassenger: (id: string | null) => void;
  setActiveView: (view: string) => void;
  setGlobalSearch: (q: string) => void;
  toggleSidebar: () => void;
  setHasStarted: (val: boolean) => void;
  setSimulationReady: (val: boolean) => void;
  pushLiveEvent: (event: LiveEvent) => void;
  setSimulation: (sim: Partial<SimulationState>) => void;
  setLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
}

function computeKPIs(
  flights: Flight[],
  passengers: Passenger[],
  baggage: Baggage[],
  security: SecurityScreening[],
  maintenance: MaintenanceLog[],
  staffShifts: StaffShift[],
  gateEvents: GateEvent[],
  retail: RetailTransaction[]
): AirportKPIs {
  const totalFlights = flights.length;
  const delayedFlights = flights.filter(f => f.delay_minutes > 0).length;
  const cancelledFlights = flights.filter(f => f.status === 'Cancelled').length;
  const activeFlights = flights.filter(f => f.status === 'Boarding' || f.status === 'Departed').length;
  const onTimeRate = totalFlights > 0 ? Math.round(((totalFlights - delayedFlights) / totalFlights) * 100) : 0;

  const totalPassengers = passengers.length;
  const baggageInTransit = baggage.filter(b => b.status === 'In Transit' || b.status === 'Loading' || b.status === 'Loaded').length;
  const baggageDelayed = baggage.filter(b => b.is_delayed).length;

  const securityFlagged = security.filter(s => s.is_flagged).length;
  const avgSecurityWait = security.length > 0
    ? Math.round(security.reduce((sum, s) => sum + s.wait_time_sec, 0) / security.length)
    : 0;

  const activeMaintenanceAOG = maintenance.filter(m => m.is_aog && !m.is_complete).length;

  // Airport Health Score: weighted composite
  const delayPenalty = Math.min(50, delayedFlights / totalFlights * 50);
  const aogPenalty = Math.min(20, activeMaintenanceAOG * 5);
  const securityPenalty = Math.min(15, securityFlagged / Math.max(1, security.length) * 15);
  const baggagePenalty = Math.min(15, baggageDelayed / Math.max(1, baggage.length) * 15);
  const healthScore = Math.max(0, Math.round(100 - delayPenalty - aogPenalty - securityPenalty - baggagePenalty));

  const revenueToday = flights.reduce((sum, f) => sum + f.revenue, 0);
  const retailRevenue = retail.reduce((sum, r) => sum + r.price, 0);
  const staffOnDuty = staffShifts.length;

  // Count occupied gates
  const gatesOccupied = new Set(gateEvents.map(e => e.gate)).size;

  return {
    totalFlights,
    activeFlights,
    delayedFlights,
    cancelledFlights,
    onTimeRate,
    totalPassengers,
    baggageInTransit,
    baggageDelayed,
    securityFlagged,
    avgSecurityWait,
    activeMaintenanceAOG,
    healthScore,
    revenueToday,
    retailRevenue,
    staffOnDuty,
    gatesOccupied,
  };
}

function computeGateOccupancy(flights: Flight[], gateEvents: GateEvent[]): GateOccupancy[] {
  const gateSet = new Set<string>();
  flights.forEach(f => gateSet.add(f.gate));
  gateEvents.forEach(e => gateSet.add(e.gate));

  const result: GateOccupancy[] = [];

  gateSet.forEach(gate => {
    const gateFlight = flights.find(f => f.gate === gate);
    const gateEvs = gateEvents.filter(e => e.gate === gate);
    const hasMaint = gateEvs.some(e => e.is_emergency);

    let status: GateOccupancy['status'] = 'empty';
    if (hasMaint) status = 'maintenance';
    else if (gateFlight?.status === 'Boarding') status = 'boarding';
    else if (gateFlight) status = 'occupied';

    result.push({
      gate,
      terminal: gateFlight?.terminal ?? gateEvs[0]?.terminal ?? 'T3',
      currentFlight: gateFlight,
      status,
    });
  });

  return result;
}

export const useAirportStore = create<AirportStore>((set, get) => ({
  flights: [],
  passengers: [],
  baggage: [],
  gateEvents: [],
  security: [],
  maintenance: [],
  staffShifts: [],
  retail: [],

  kpis: {
    totalFlights: 0, activeFlights: 0, delayedFlights: 0, cancelledFlights: 0,
    onTimeRate: 0, totalPassengers: 0, baggageInTransit: 0, baggageDelayed: 0,
    securityFlagged: 0, avgSecurityWait: 0, activeMaintenanceAOG: 0, healthScore: 0,
    revenueToday: 0, retailRevenue: 0, staffOnDuty: 0, gatesOccupied: 0,
  },
  liveEvents: [],
  gateOccupancy: [],

  isLoading: true,
  loadError: null,
  selectedFlightId: null,
  selectedGate: null,
  selectedPassengerId: null,
  activeView: 'command',
  globalSearch: '',
  sidebarCollapsed: false,
  hasStarted: false,
  isSimulationReady: false,

  simulation: {
    isRunning: true,
    speed: 1,
    currentTime: new Date(),
    eventIndex: 0,
  },

  setAllData: (data) => {
    const kpis = computeKPIs(
      data.flights, data.passengers, data.baggage,
      data.security, data.maintenance, data.staffShifts,
      data.gateEvents, data.retail
    );
    const gateOccupancy = computeGateOccupancy(data.flights, data.gateEvents);
    set({ ...data, kpis, gateOccupancy, isLoading: false });
  },

  setSelectedFlight: (id) => set({ selectedFlightId: id }),
  setSelectedGate: (gate) => set({ selectedGate: gate }),
  setSelectedPassenger: (id) => set({ selectedPassengerId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setGlobalSearch: (q) => set({ globalSearch: q }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setHasStarted: (val) => set({ hasStarted: val }),
  setSimulationReady: (val) => set({ isSimulationReady: val }),

  pushLiveEvent: (event) => set(s => ({
    liveEvents: [event, ...s.liveEvents].slice(0, 100),
  })),

  setSimulation: (sim) => set(s => ({
    simulation: { ...s.simulation, ...sim },
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setLoadError: (error) => set({ loadError: error }),
}));
