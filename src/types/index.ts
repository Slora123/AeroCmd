// ============================================================
// FLIGHT TYPES
// ============================================================
export interface Flight {
  flight_id: string;
  airline_name: string;
  airline_code: string;
  origin: string;
  destination: string;
  scheduled_dep: string;
  actual_dep: string;
  scheduled_arr: string;
  actual_arr: string;
  aircraft_type: string;
  aircraft_reg: string;
  capacity: number;
  pax_count: number;
  status: FlightStatus;
  delay_minutes: number;
  delay_reason: string;
  terminal: string;
  gate: string;
  is_international: boolean;
  fuel_cost: number;
  revenue: number;
  boarding_time: string;
  is_codeshare: boolean;
  delay_severity: string;
  load_factor_pct: number;
  turnaround_minutes: number;
  risk_score: number;
  time_of_day: string;
  day_of_week: string;
  is_holiday: boolean;
  season: string;
  route_type: string;
}

export type FlightStatus = 'Departed' | 'Boarding' | 'Delayed' | 'Cancelled' | 'Scheduled' | 'On-Time' | 'Taxiing' | 'Arrived';

// ============================================================
// PASSENGER TYPES
// ============================================================
export interface Passenger {
  passenger_id: string;
  passport_number: string;
  pnr_code: string;
  first_name: string;
  last_name: string;
  nationality: string;
  dob: string;
  gender: string;
  seat: string;
  cabin_class: string;
  flight_id: string;
  check_in_time: string;
  boarding_time: string;
  gate: string;
  queue_time: number;
  col15?: string;
  col16?: string;
  col17?: string;
  col18?: string;
  email: string;
  phone: string;
  col21?: string;
  col22?: string;
  is_vip: boolean;
  wait_time_hrs: number;
  special_assistance: boolean;
  ticket_class: string;
  age: number;
  age_group: string;
}

// ============================================================
// BAGGAGE TYPES
// ============================================================
export interface Baggage {
  tag_number: string;
  passenger_id: string;
  flight_id: string;
  pnr_code: string;
  weight_kg: number;
  dimensions: string;
  type: string;
  counter: string;
  check_in_datetime: string;
  load_datetime: string;
  belt_number: number;
  status: BaggageStatus;
  is_oversize: boolean;
  transfer_count: number;
  handling_zone: string;
  last_update: string;
  is_delayed: boolean;
  remarks: string;
}

export type BaggageStatus = 'Loaded' | 'Loading' | 'In Transit' | 'Delayed' | 'Lost' | 'Delivered' | 'Pending';

// ============================================================
// GATE EVENT TYPES
// ============================================================
export interface GateEvent {
  event_id: string;
  flight_id: string;
  gate: string;
  terminal: string;
  event_type: GateEventType;
  event_time: string;
  staff_id: string;
  duration_min: number;
  priority: string;
  is_emergency: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  resolved_at: string;
}

export type GateEventType = 'Boarding Start' | 'Boarding End' | 'Gate Open' | 'Gate Close' | 'Aircraft Arrival' | 'Aircraft Departure' | 'Emergency' | 'Delay' | 'Pushback';

// ============================================================
// SECURITY TYPES
// ============================================================
export interface SecurityScreening {
  screening_id: string;
  pnr_code: string;
  passenger_id: string;
  lane_number: number;
  screening_start: string;
  screening_end: string;
  alert_time: string;
  result: string;
  alert_reason: string;
  is_flagged: boolean;
  staff_id: string;
  equipment_id: string;
  processing_time_sec: number;
  secondary_screening: boolean;
  is_detained: boolean;
  shift_id: string;
  capacity: number;
  queue_length: number;
  wait_time_sec: number;
  is_peak: boolean;
}

// ============================================================
// MAINTENANCE TYPES
// ============================================================
export interface MaintenanceLog {
  work_order: string;
  aircraft_reg: string;
  flight_id: string;
  work_type: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  priority: number;
  duration_hrs: number;
  defect_description: string;
  resolution: string;
  severity: number;
  supervisor_id: string;
  is_aog: boolean;
  is_complete: boolean;
  notes: string;
}

// ============================================================
// STAFF TYPES
// ============================================================
export interface StaffShift {
  staff_id: string;
  staff_name: string;
  department: string;
  role: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  terminal: string;
  gate: string;
  supervisor_id: string;
  hours: number;
  is_overtime: boolean;
  break_time: string;
  certification_expiry: string;
  language: string;
}

// ============================================================
// RETAIL TYPES
// ============================================================
export interface RetailTransaction {
  transaction_id: string;
  staff_id: string;
  store_type: string;
  category: string;
  pnr_code: string;
  flight_id: string;
  transaction_time: string;
  product: string;
  quantity: number;
  price: number;
  cost: number;
  payment_method: string;
  currency: string;
  discount: string;
  terminal: string;
  location: string;
  is_duty_free: boolean;
}

// ============================================================
// AIRPORT STATE & SIMULATION
// ============================================================
export interface AirportKPIs {
  totalFlights: number;
  activeFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  onTimeRate: number;
  totalPassengers: number;
  baggageInTransit: number;
  baggageDelayed: number;
  securityFlagged: number;
  avgSecurityWait: number;
  activeMaintenanceAOG: number;
  healthScore: number;
  revenueToday: number;
  retailRevenue: number;
  staffOnDuty: number;
  gatesOccupied: number;
}

export interface LiveEvent {
  id: string;
  timestamp: Date;
  type: 'boarding' | 'departure' | 'arrival' | 'alert' | 'maintenance' | 'security' | 'baggage' | 'gate' | 'retail';
  severity: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  flightId?: string;
  gateId?: string;
  staffId?: string;
}

export interface SimulationState {
  isRunning: boolean;
  speed: number; // 1x, 2x, 5x
  currentTime: Date;
  eventIndex: number;
}

export interface FlightWithRelations extends Flight {
  passengers?: Passenger[];
  baggage?: Baggage[];
  gateEvents?: GateEvent[];
  maintenanceLogs?: MaintenanceLog[];
  retailTransactions?: RetailTransaction[];
}

export interface GateOccupancy {
  gate: string;
  terminal: string;
  currentFlight?: Flight;
  status: 'empty' | 'boarding' | 'occupied' | 'maintenance' | 'closed';
  nextFlight?: Flight;
}
