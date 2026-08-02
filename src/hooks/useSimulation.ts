import { useEffect, useRef } from 'react';
import { useAirportStore } from '../stores/airportStore';
import type { LiveEvent } from '../types';

// Simulation engine — generates live events from the loaded CSV data
export function useSimulation() {
  const {
    flights, gateEvents, maintenance, security, baggage,
    simulation, pushLiveEvent, setSimulation,
  } = useAirportStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventIdx = useRef(0);

  useEffect(() => {
    if (!simulation.isRunning || flights.length === 0) return;

    const TICK_MS = Math.round(4000 / simulation.speed);

    function tick() {
      const now = new Date();
      const roll = Math.random();

      // Pick a random source for the live event
      const eventType = roll < 0.25 ? 'gate'
        : roll < 0.45 ? 'departure'
        : roll < 0.6 ? 'security'
        : roll < 0.72 ? 'baggage'
        : roll < 0.82 ? 'maintenance'
        : roll < 0.92 ? 'boarding'
        : 'retail';

      let event: LiveEvent | null = null;

      if (eventType === 'gate' && gateEvents.length > 0) {
        const ge = gateEvents[Math.floor(Math.random() * gateEvents.length)];
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'gate',
          severity: ge.is_emergency ? 'critical' : 'info',
          message: `Gate ${ge.gate}: ${ge.event_type} — Flight ${ge.flight_id}`,
          flightId: ge.flight_id,
          gateId: ge.gate,
          staffId: ge.staff_id,
        };
      } else if (eventType === 'departure' && flights.length > 0) {
        const f = flights[Math.floor(Math.random() * flights.length)];
        const delayed = f.delay_minutes > 30;
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'departure',
          severity: delayed ? 'warning' : 'success',
          message: delayed
            ? `⚠ ${f.flight_id} (${f.airline_name}) delayed ${f.delay_minutes}min — ${f.delay_reason}`
            : `✓ ${f.flight_id} departed on time → ${f.destination}`,
          flightId: f.flight_id,
        };
      } else if (eventType === 'security' && security.length > 0) {
        const s = security[Math.floor(Math.random() * security.length)];
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'security',
          severity: s.is_flagged ? 'critical' : s.is_peak ? 'warning' : 'info',
          message: s.is_flagged
            ? `🔴 SECURITY FLAG — Lane ${s.lane_number} | PNR: ${s.pnr_code} | ${s.alert_reason || 'Secondary check required'}`
            : `Security Lane ${s.lane_number}: Queue ${s.queue_length} | Wait ${Math.round(s.wait_time_sec / 60)}min`,
          staffId: s.staff_id,
        };
      } else if (eventType === 'baggage' && baggage.length > 0) {
        const b = baggage[Math.floor(Math.random() * baggage.length)];
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'baggage',
          severity: b.is_delayed ? 'warning' : 'info',
          message: b.is_delayed
            ? `⚠ Baggage delayed — Tag: ${b.tag_number} | Flight ${b.flight_id} | Zone: ${b.handling_zone}`
            : `Baggage ${b.tag_number} → ${b.status} | Belt ${b.belt_number} | ${b.handling_zone}`,
          flightId: b.flight_id,
        };
      } else if (eventType === 'maintenance' && maintenance.length > 0) {
        const m = maintenance[Math.floor(Math.random() * maintenance.length)];
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'maintenance',
          severity: m.is_aog ? 'critical' : m.severity >= 3 ? 'warning' : 'info',
          message: m.is_aog
            ? `🛑 AOG: ${m.aircraft_reg} — ${m.defect_description} | P${m.priority}`
            : `MX: ${m.aircraft_reg} — ${m.work_type} | ${m.defect_description}`,
          flightId: m.flight_id,
          staffId: m.staff_id,
        };
      } else if (flights.length > 0) {
        const f = flights[Math.floor(Math.random() * Math.min(50, flights.length))];
        event = {
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'boarding',
          severity: 'info',
          message: `Boarding: ${f.flight_id} | Gate ${f.gate} | ${f.pax_count}/${f.capacity} pax`,
          flightId: f.flight_id,
          gateId: f.gate,
        };
      }

      if (event) {
        pushLiveEvent(event);
      }

      setSimulation({ currentTime: now, eventIndex: eventIdx.current++ });
    }

    tickRef.current = setInterval(tick, TICK_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [simulation.isRunning, simulation.speed, flights.length]);
}
