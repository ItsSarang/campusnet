# CampusNet — Frontend

This directory contains the React + Vite frontend for **CampusNet**, a web application modeling and visualizing an enterprise university campus network.

> **Status:** Implemented in pure **React 18+ (JavaScript & JSX)** with **Vite** and **Tailwind CSS**.

---

## Technology Stack

- **Framework:** [React 18+](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** JavaScript (`.js` & `.jsx`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Topology Visualization:** [React Flow](https://reactflow.dev/) (`@xyflow/react`)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Application Pages

1. **Dashboard**
   - High-level telemetry synchronized live with Cisco Packet Tracer.
   - Core router, distribution switch, workstation, and server metrics.
   - Department subnet utilization bars (VLAN 10, 20, 30, 100).
   - Live network event feed.

2. **Topology Explorer**
   - Interactive, zoomable network canvas powered by `@xyflow/react`.
   - Node coordinates and links retrieved directly from Cisco Packet Tracer.
   - Custom node cards for Router, Switch, Host, and Server.
   - Node inspection drawer on click.

3. **Campus Structure & IP Manager**
   - Live workstation table.
   - "Add Workstation" modal that dynamically creates a `PC-PT` on the canvas, finds an open switch port, connects a straight-through cable, and sets IP/DHCP in Packet Tracer.
   - Device removal with one click.

4. **Communication & Security Center**
   - Interactive ICMP ping execution that runs the command prompt inside Packet Tracer and displays real terminal output.
   - Router Access Control List (ACL) configuration table.

---

## Setup & Execution

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build production bundle
npm run build
```

---

## Directory Layout

```text
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx        # Top navigation bar & PT status indicator
│   ├── pages/
│   │   ├── Dashboard.jsx     # Overview & subnet metrics
│   │   ├── Topology.jsx      # React Flow network canvas
│   │   ├── IPManager.jsx     # Workstation provisioning modal & table
│   │   └── SecurityCenter.jsx# Live ping test console & ACL manager
│   ├── services/
│   │   └── api.js            # Fetch calls to Flask REST endpoints
│   ├── App.jsx               # Main application component & auto-refresh
│   ├── main.jsx              # React DOM entry point
│   └── index.css             # Tailwind CSS & React Flow styles
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS theme configuration
├── postcss.config.js         # PostCSS plugins
└── vite.config.js            # Vite bundler & API proxy configuration
```
