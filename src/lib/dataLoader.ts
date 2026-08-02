import Papa from 'papaparse';
import type {
  Flight, Passenger, Baggage, GateEvent,
  SecurityScreening, MaintenanceLog, StaffShift, RetailTransaction
} from '../types';

// Column name mappings — CSVs use numeric indices as headers
const FLIGHT_COLS = [
  'flight_id','airline_name','airline_code','origin','destination',
  'scheduled_dep','actual_dep','scheduled_arr','actual_arr',
  'aircraft_type','aircraft_reg','capacity','pax_count','status',
  'delay_minutes','delay_reason','terminal','gate','is_international',
  'fuel_cost','revenue','boarding_time','is_codeshare','delay_severity',
  'load_factor_pct','turnaround_minutes','risk_score','time_of_day',
  'day_of_week','is_holiday','season','route_type'
];

const PASSENGER_COLS = [
  'passenger_id','passport_number','pnr_code','first_name','last_name',
  'nationality','dob','gender','seat','cabin_class','flight_id',
  'check_in_time','boarding_time','gate','queue_time',
  'col15','col16','col17','col18','email','phone','col21','col22',
  'is_vip','wait_time_hrs','special_assistance','ticket_class','age','age_group'
];

const BAGGAGE_COLS = [
  'tag_number','passenger_id','flight_id','pnr_code','weight_kg',
  'dimensions','type','counter','check_in_datetime','load_datetime',
  'belt_number','status','is_oversize','transfer_count','handling_zone',
  'last_update','is_delayed','remarks'
];

const GATE_EVENT_COLS = [
  'event_id','flight_id','gate','terminal','event_type','event_time',
  'staff_id','duration_min','priority','is_emergency','notes',
  'created_at','updated_at','resolved_at'
];

const SECURITY_COLS = [
  'screening_id','pnr_code','passenger_id','lane_number',
  'screening_start','screening_end','alert_time','result','alert_reason',
  'is_flagged','staff_id','equipment_id','processing_time_sec',
  'secondary_screening','is_detained','shift_id','capacity','queue_length',
  'wait_time_sec','is_peak'
];

const MAINTENANCE_COLS = [
  'work_order','aircraft_reg','flight_id','work_type','staff_id',
  'start_time','end_time','priority','duration_hrs','defect_description',
  'resolution','severity','supervisor_id','is_aog','is_complete','notes'
];

const STAFF_COLS = [
  'staff_id','staff_name','department','role','shift_date',
  'shift_start','shift_end','terminal','gate','supervisor_id',
  'hours','is_overtime','break_time','certification_expiry','language'
];

const RETAIL_COLS = [
  'transaction_id','staff_id','store_type','category','pnr_code',
  'flight_id','transaction_time','product','quantity','price','cost',
  'payment_method','currency','discount','terminal','location','is_duty_free'
];

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  return val.trim().toLowerCase() === 'true';
}

function parseNum(val: string | undefined): number {
  if (!val || val.trim() === '') return 0;
  const n = parseFloat(val.trim());
  return isNaN(n) ? 0 : n;
}

function parseStr(val: string | undefined): string {
  return val?.trim() ?? '';
}

function remapRow(row: Record<string, string>, cols: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  cols.forEach((col, i) => {
    result[col] = row[String(i)] ?? '';
  });
  return result;
}

async function loadCSV(path: string): Promise<Record<string, string>[]> {
  const resp = await fetch(path);
  const text = await resp.text();
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err: Error) => reject(err),
    });
  });
}

export async function loadFlights(): Promise<Flight[]> {
  const raw = await loadCSV('/data/flights.csv');
  return raw.map((r) => {
    const row = remapRow(r, FLIGHT_COLS);
    return {
      flight_id: parseStr(row.flight_id),
      airline_name: parseStr(row.airline_name),
      airline_code: parseStr(row.airline_code),
      origin: parseStr(row.origin),
      destination: parseStr(row.destination),
      scheduled_dep: parseStr(row.scheduled_dep),
      actual_dep: parseStr(row.actual_dep),
      scheduled_arr: parseStr(row.scheduled_arr),
      actual_arr: parseStr(row.actual_arr),
      aircraft_type: parseStr(row.aircraft_type),
      aircraft_reg: parseStr(row.aircraft_reg),
      capacity: parseNum(row.capacity),
      pax_count: parseNum(row.pax_count),
      status: parseStr(row.status) as Flight['status'],
      delay_minutes: parseNum(row.delay_minutes),
      delay_reason: parseStr(row.delay_reason),
      terminal: parseStr(row.terminal),
      gate: parseStr(row.gate),
      is_international: parseBool(row.is_international),
      fuel_cost: parseNum(row.fuel_cost),
      revenue: parseNum(row.revenue),
      boarding_time: parseStr(row.boarding_time),
      is_codeshare: parseBool(row.is_codeshare),
      delay_severity: parseStr(row.delay_severity),
      load_factor_pct: parseNum(row.load_factor_pct),
      turnaround_minutes: parseNum(row.turnaround_minutes),
      risk_score: parseNum(row.risk_score),
      time_of_day: parseStr(row.time_of_day),
      day_of_week: parseStr(row.day_of_week),
      is_holiday: parseBool(row.is_holiday),
      season: parseStr(row.season),
      route_type: parseStr(row.route_type),
    } as Flight;
  });
}

export async function loadPassengers(): Promise<Passenger[]> {
  const raw = await loadCSV('/data/passengers.csv');
  return raw.map((r) => {
    const row = remapRow(r, PASSENGER_COLS);
    return {
      passenger_id: parseStr(row.passenger_id),
      passport_number: parseStr(row.passport_number),
      pnr_code: parseStr(row.pnr_code),
      first_name: parseStr(row.first_name),
      last_name: parseStr(row.last_name),
      nationality: parseStr(row.nationality),
      dob: parseStr(row.dob),
      gender: parseStr(row.gender),
      seat: parseStr(row.seat),
      cabin_class: parseStr(row.cabin_class),
      flight_id: parseStr(row.flight_id),
      check_in_time: parseStr(row.check_in_time),
      boarding_time: parseStr(row.boarding_time),
      gate: parseStr(row.gate),
      queue_time: parseNum(row.queue_time),
      email: parseStr(row.email),
      phone: parseStr(row.phone),
      is_vip: parseBool(row.is_vip),
      wait_time_hrs: parseNum(row.wait_time_hrs),
      special_assistance: parseBool(row.special_assistance),
      ticket_class: parseStr(row.ticket_class),
      age: parseNum(row.age),
      age_group: parseStr(row.age_group),
    } as Passenger;
  });
}

export async function loadBaggage(): Promise<Baggage[]> {
  const raw = await loadCSV('/data/baggage.csv');
  return raw.map((r) => {
    const row = remapRow(r, BAGGAGE_COLS);
    return {
      tag_number: parseStr(row.tag_number),
      passenger_id: parseStr(row.passenger_id),
      flight_id: parseStr(row.flight_id),
      pnr_code: parseStr(row.pnr_code),
      weight_kg: parseNum(row.weight_kg),
      dimensions: parseStr(row.dimensions),
      type: parseStr(row.type),
      counter: parseStr(row.counter),
      check_in_datetime: parseStr(row.check_in_datetime),
      load_datetime: parseStr(row.load_datetime),
      belt_number: parseNum(row.belt_number),
      status: parseStr(row.status) as Baggage['status'],
      is_oversize: parseBool(row.is_oversize),
      transfer_count: parseNum(row.transfer_count),
      handling_zone: parseStr(row.handling_zone),
      last_update: parseStr(row.last_update),
      is_delayed: parseBool(row.is_delayed),
      remarks: parseStr(row.remarks),
    } as Baggage;
  });
}

export async function loadGateEvents(): Promise<GateEvent[]> {
  const raw = await loadCSV('/data/gate_events.csv');
  return raw.map((r) => {
    const row = remapRow(r, GATE_EVENT_COLS);
    return {
      event_id: parseStr(row.event_id),
      flight_id: parseStr(row.flight_id),
      gate: parseStr(row.gate),
      terminal: parseStr(row.terminal),
      event_type: parseStr(row.event_type) as GateEvent['event_type'],
      event_time: parseStr(row.event_time),
      staff_id: parseStr(row.staff_id),
      duration_min: parseNum(row.duration_min),
      priority: parseStr(row.priority),
      is_emergency: parseBool(row.is_emergency),
      notes: parseStr(row.notes),
      created_at: parseStr(row.created_at),
      updated_at: parseStr(row.updated_at),
      resolved_at: parseStr(row.resolved_at),
    } as GateEvent;
  });
}

export async function loadSecurityScreening(): Promise<SecurityScreening[]> {
  const raw = await loadCSV('/data/security_screening.csv');
  return raw.map((r) => {
    const row = remapRow(r, SECURITY_COLS);
    return {
      screening_id: parseStr(row.screening_id),
      pnr_code: parseStr(row.pnr_code),
      passenger_id: parseStr(row.passenger_id),
      lane_number: parseNum(row.lane_number),
      screening_start: parseStr(row.screening_start),
      screening_end: parseStr(row.screening_end),
      alert_time: parseStr(row.alert_time),
      result: parseStr(row.result),
      alert_reason: parseStr(row.alert_reason),
      is_flagged: parseBool(row.is_flagged),
      staff_id: parseStr(row.staff_id),
      equipment_id: parseStr(row.equipment_id),
      processing_time_sec: parseNum(row.processing_time_sec),
      secondary_screening: parseBool(row.secondary_screening),
      is_detained: parseBool(row.is_detained),
      shift_id: parseStr(row.shift_id),
      capacity: parseNum(row.capacity),
      queue_length: parseNum(row.queue_length),
      wait_time_sec: parseNum(row.wait_time_sec),
      is_peak: parseBool(row.is_peak),
    } as SecurityScreening;
  });
}

export async function loadMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const raw = await loadCSV('/data/maintenance_logs.csv');
  return raw.map((r) => {
    const row = remapRow(r, MAINTENANCE_COLS);
    return {
      work_order: parseStr(row.work_order),
      aircraft_reg: parseStr(row.aircraft_reg),
      flight_id: parseStr(row.flight_id),
      work_type: parseStr(row.work_type),
      staff_id: parseStr(row.staff_id),
      start_time: parseStr(row.start_time),
      end_time: parseStr(row.end_time),
      priority: parseNum(row.priority),
      duration_hrs: parseNum(row.duration_hrs),
      defect_description: parseStr(row.defect_description),
      resolution: parseStr(row.resolution),
      severity: parseNum(row.severity),
      supervisor_id: parseStr(row.supervisor_id),
      is_aog: parseBool(row.is_aog),
      is_complete: parseBool(row.is_complete),
      notes: parseStr(row.notes),
    } as MaintenanceLog;
  });
}

export async function loadStaffShifts(): Promise<StaffShift[]> {
  const raw = await loadCSV('/data/staff_shifts.csv');
  return raw.map((r) => {
    const row = remapRow(r, STAFF_COLS);
    return {
      staff_id: parseStr(row.staff_id),
      staff_name: parseStr(row.staff_name),
      department: parseStr(row.department),
      role: parseStr(row.role),
      shift_date: parseStr(row.shift_date),
      shift_start: parseStr(row.shift_start),
      shift_end: parseStr(row.shift_end),
      terminal: parseStr(row.terminal),
      gate: parseStr(row.gate),
      supervisor_id: parseStr(row.supervisor_id),
      hours: parseNum(row.hours),
      is_overtime: parseBool(row.is_overtime),
      break_time: parseStr(row.break_time),
      certification_expiry: parseStr(row.certification_expiry),
      language: parseStr(row.language),
    } as StaffShift;
  });
}

export async function loadRetailTransactions(): Promise<RetailTransaction[]> {
  const raw = await loadCSV('/data/retail_transactions.csv');
  return raw.map((r) => {
    const row = remapRow(r, RETAIL_COLS);
    return {
      transaction_id: parseStr(row.transaction_id),
      staff_id: parseStr(row.staff_id),
      store_type: parseStr(row.store_type),
      category: parseStr(row.category),
      pnr_code: parseStr(row.pnr_code),
      flight_id: parseStr(row.flight_id),
      transaction_time: parseStr(row.transaction_time),
      product: parseStr(row.product),
      quantity: parseNum(row.quantity),
      price: parseNum(row.price),
      cost: parseNum(row.cost),
      payment_method: parseStr(row.payment_method),
      currency: parseStr(row.currency),
      discount: parseStr(row.discount),
      terminal: parseStr(row.terminal),
      location: parseStr(row.location),
      is_duty_free: parseBool(row.is_duty_free),
    } as RetailTransaction;
  });
}

export async function loadAllData() {
  const [
    flights, passengers, baggage, gateEvents,
    security, maintenance, staffShifts, retail
  ] = await Promise.all([
    loadFlights(),
    loadPassengers(),
    loadBaggage(),
    loadGateEvents(),
    loadSecurityScreening(),
    loadMaintenanceLogs(),
    loadStaffShifts(),
    loadRetailTransactions(),
  ]);

  return { flights, passengers, baggage, gateEvents, security, maintenance, staffShifts, retail };
}
