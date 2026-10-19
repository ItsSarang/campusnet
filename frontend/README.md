# CampusNet — Frontend

This directory contains the planned frontend for **CampusNet**, a web application modeling and visualizing a university campus network.

> **Status:** Planned / Initialization pending. Application pages have not been implemented yet.

---

## Planned Technology Stack

- **Framework:** [React 18+](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** TypeScript (`strict` mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Topology Visualization:** [React Flow](https://reactflow.dev/) (`@xyflow/react`)
- **Metrics & Charts:** [Recharts](https://recharts.org/) (used selectively on Dashboard/Analytics)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Four Planned Application Pages

1. **Dashboard (`/dashboard` or `/`)**
   - High-level metrics: departments, active subnets, total vs. assigned IP count, lab occupancy.
   - Quick network status indicators and simulated event feed.
   - Network utilization summary charts.

2. **Topology Explorer (`/topology`)**
   - Interactive, zoomable network diagram powered by React Flow.
   - Core router, distribution switches, department switches, lab workstations, and campus servers.
   - Node inspection panel (drawer/modal) displaying IP, MAC, VLAN, subnet mask, gateway, and status.
   - Filter by VLAN, department, or device type.

3. **Campus Structure & IP Manager (`/ip-manager`)**
   - Department and lab hierarchical tree.
   - IP address allocation table per subnet.
   - Dual allocation modes: DHCP-style automatic assignment vs. manually configured static IP.
   - Validation engine: prevents IP collision, subnet boundary overflow, gateway conflict, and broadcast address assignment.
   - Device de-provisioning with IP release back to available pool.

4. **Communication & Security Center (`/security`)**
   - Inter-department and inter-device communication policy evaluation.
   - Source-to-destination reachability testing (simulated ping / packet flow).
   - Access-Control List (ACL) rule table (Permit/Deny rules with priority order).
   - Diagnostic explanation on communication denial (e.g., "Denied by ACL Rule #3: Block Guest VLAN to Admin Server").
   - Test history log with status and timestamps.

---

## Architecture & Implementation Strategy

Development follows a **frontend-first approach**:
1. **Mock Data Layer:** Realistic, strongly-typed mock data (`src/data/mockNetwork.ts`) simulating campus departments, VLANs, subnets, devices, and ACL rules.
2. **In-Memory State & Storage:** React Context or state management store to allow interactive additions, IP allocations, and simulated rule evaluations.
3. **Networking Validation Utilities:** Client-side IPv4 subnet calculation utilities (`src/utils/networkUtils.ts`) that accurately calculate network address, broadcast address, prefix length, and usable host range.
4. **Simulation Boundary:** All network operations are explicitly treated and labeled as **models or simulations**. No claims of real packet capture or real DHCP daemon operation.

---

## Planned Setup & Execution Instructions

*(These commands will apply once the frontend project files are generated in the next development phase.)*

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## Code & Directory Conventions

Planned directory layout once initialized:

```text
frontend/
├── src/
│   ├── assets/          # Static assets (images, icons)
│   ├── components/      # Shared reusable UI components (Button, Modal, Card, Table)
│   ├── layout/          # App layout, Navbar, Sidebar
│   ├── pages/           # Page views (Dashboard, Topology, IPManager, SecurityCenter)
│   ├── types/           # TypeScript interfaces (network.ts, acl.ts, campus.ts)
│   ├── data/            # Mock dataset (departments, devices, subnets, rules)
│   ├── context/         # React Context for network state management
│   ├── utils/           # IP math, subnet parsing, ACL evaluation logic
│   ├── App.tsx          # Main routing & application component
│   └── main.tsx         # Vite application entry point
├── public/              # Public static assets
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite configuration
```
