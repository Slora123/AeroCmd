# AeroCmd — Airport Operations Control Center

> **Frontend Wars 2026 Grand Finale Entry**
> World-class Airport Operations Control Center for Indira Gandhi International Airport (DEL)

![AeroCmd](public/favicon.svg)

## Overview

AeroCmd is a mission-critical Airport Operations Control Center built to simulate real-world operations at Indira Gandhi International Airport (DEL). It provides a comprehensive, interconnected view of all airport operations — from flight management to security, baggage, maintenance, staff, and retail.

**Entirely frontend-only. No backend. No APIs. All data from the provided CSV datasets.**

---

## Features

### 🎛 Command Center
- Live Airport Digital Twin (3D React Three Fiber scene)
- Real-time KPI dashboard with 8 key metrics
- Airport Health Score (composite heuristic)
- Live Operations Event Feed (simulation from CSV data)
- Gate occupancy grid
- Airline distribution charts
- Top delayed flights tracker

### ✈️ Flight Operations
- Full searchable/sortable flight board (1000+ flights)
- Advanced filtering by status, delay, airline
- Load factor & risk score visualization
- Delay prediction (heuristic from data fields)
- Click-to-open detailed flight drawer with:
  - Full passenger manifest
  - Baggage tracking
  - Gate events timeline
  - Maintenance status
  - Revenue & fuel cost

### 🚪 Gate Management
- Interactive gate grid (toggle grid/list view)
- Real-time boarding indicators with pulsing animations
- Gate event timeline
- Status legend (Boarding / Occupied / Maintenance / Available)

### 🛡 Security Operations
- Per-lane queue monitoring
- Security alert & incident panel
- Wait time distribution chart
- Flagged passenger list with reasons
- Secondary screening & detention tracking

### 🧳 Baggage Control
- Status donut chart (Loaded / In Transit / Delayed / etc.)
- Handling zone breakdown
- Per-bag tracking with flight linkage
- Oversize & delayed bag identification

### 🔧 Maintenance Hub
- AOG (Aircraft On Ground) alert panel
- Work order type chart
- Common defect analysis
- Priority-based work order list
- Completion rate tracking

### 👨‍✈️ Staff Command
- Department coverage chart
- Role distribution
- Overtime tracking
- Full staff roster with gate assignments

### 🛍 Retail Intelligence
- Hourly revenue trend (area chart)
- Store type breakdown
- Top products by revenue
- Payment method analysis
- Duty-free vs. standard split

### 🧑‍🤝‍🧑 Passenger Journey
- Demographics (nationality, age group, cabin class)
- VIP & special assistance tracking
- Searchable passenger registry
- Full PNR → Flight → Security linkage

---

## Technical Architecture

### Tech Stack
| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| 3D | React Three Fiber + Three.js + @react-three/drei |
| State | Zustand |
| CSV Parsing | PapaParse |
| Charts | Recharts |
| Icons | Lucide React |
| Date Handling | date-fns |

### Data Architecture
All 8 CSV datasets are loaded on startup via `PapaParse` and cross-referenced via shared keys:
- `flight_id` links flights → passengers → baggage → gate_events → maintenance → retail
- `pnr_code` links passengers → security → retail
- `staff_id` links staff_shifts → gate_events → security → maintenance

### Simulation Engine
The `useSimulation` hook generates live events every 4 seconds (adjustable to 1x/2x/5x speed) by sampling randomly from the loaded CSV data. Events cover:
- Flight departures/delays
- Gate boarding events
- Security flags/queues
- Baggage status updates
- Maintenance alerts

### Design System
- Dark control room palette (navy-950 base)
- Glassmorphism panels with `backdrop-filter: blur()`
- Gradient borders with cyan-to-purple theme
- Animated status pulses for live indicators
- Grid background texture
- Premium typography (Inter + JetBrains Mono)

---

## Project Structure

```
src/
  types/         TypeScript interfaces for all entities
  lib/           CSV data loading & parsing
  stores/        Zustand state management + KPI computation
  hooks/         useSimulation — live event engine
  utils/         cn, formatters, color helpers, delay prediction
  components/
    ui/           GlassCard, StatCard, Badge, ProgressBar, LiveDot
    layout/       Sidebar, Topbar, LoadingScreen
    panels/       FlightDetailDrawer, LiveEventFeed
    3d/           Airport3D (React Three Fiber scene)
  pages/
    CommandCenter.tsx
    FlightOperations.tsx
    GateManagement.tsx
    SecurityOperations.tsx
    BaggageControl.tsx
    MaintenanceHub.tsx
    StaffCommand.tsx
    RetailIntelligence.tsx
    PassengerJourney.tsx
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Competition Compliance

| Rule | Status |
|------|--------|
| Frontend only | ✅ |
| No backend | ✅ |
| No external APIs | ✅ |
| No external databases | ✅ |
| Uses provided CSV datasets | ✅ |
| All data relationships built | ✅ |
| LocalStorage/sessionStorage only | ✅ |

---

## Data Sources

All data from `/public/data/`:
- `flights.csv` — 1001 flight records
- `passengers.csv` — 2501 passenger records
- `baggage.csv` — 2801 baggage items
- `gate_events.csv` — 1201 gate events
- `security_screening.csv` — 2501 security checks
- `maintenance_logs.csv` — 401 work orders
- `staff_shifts.csv` — 601 staff records
- `retail_transactions.csv` — 3001 retail transactions

**Total: ~13,000 interconnected data records**

---

*Built for Frontend Wars 2026 — crafted to win.*
