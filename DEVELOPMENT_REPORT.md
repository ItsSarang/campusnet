# CampusNet Development Report

## Last Updated
2026-10-21

---

## Current Project Status
**Phase 2 & Packet Tracer Engine Integration Completed.**
The system operates as a live **Software-Defined Network (SDN) Controller** where Cisco Packet Tracer 9.0 running locally on the user's Mac functions as the actual network data plane and simulation engine. The Python Flask REST backend communicates with Packet Tracer via native PTMP IPC over port 39000, and the React 18 + JavaScript (JSX) + Tailwind frontend renders the dashboard, interactive topology canvas, IP manager, and security console.

---

## Implemented Features

### 1. Universal Edge Cable Cut System & Cable Inspector:
- Universal edge-level interactivity allowing user to click any cable on the graph across all 6 network connection categories (Core Transit, Lateral Mesh, WAN Gateway, Gateway Trunk, Workstation Patch Cord, and Server Uplink).
- Dedicated side-panel Cable Inspector displaying connected device endpoints, physical port names, carrier state (Connected vs. Severed), topological impact explanation, and direct Cut Cable / Repair Cable action button.
- On-canvas visual feedback rendering severed cables with red dashed animations and interactive centered `[SEVERED]` badges.
- Realistic Layer 1, Layer 2, and Layer 3 ping diagnostics simulating physical link down, gateway trunk disconnection, WAN drop, and server link failures.

### 2. Multi-Router Campus Interconnect & 3-Column Distance-Vector Routing Tables:
- Configured dedicated Department Gateway Routers inside each academic block (`Router-CS`, `Router-LIB`, `Router-ADMIN`, `Router-DC`) connecting downstream to department access switches and upstream to `Campus-Core-Router`.
- Added lateral mesh links between adjacent blocks (`Router-CS <-> Router-LIB` and `Router-ADMIN <-> Router-DC`) for campus-level path redundancy.
- Implemented dynamic shortest path routing computation that generates current distance-vector tables with exactly 3 columns: `Destination Router`, `Distance`, `Next Hop`.
- Streamlined Routing Tables drawer to render each router's active table sequentially down the page with zero historical logs or past sync entries.
- Integrated active path BFS visualizer tracing packet flow from hosts through switches and routers to the ISP edge.

### 2. Option B Multi-Router WAN Edge & Internet Gateway Integration:
- Configured external `ISP-Edge-Router` (Cisco 2911) outside the campus boundary on WAN subnet `203.0.113.0/30`.
- Configured public destination `8.8.8.8` (Google Public DNS) on `ISP-Edge-Router` Loopback0.
- Configured default static route `ip route 0.0.0.0 0.0.0.0 203.0.113.2` on `Campus-Core-Router`.
- Live Cisco IOS routing table parser extracts Gateway of Last Resort and `S* 0.0.0.0/0` default route.
- Verified live end-to-end ping from academic PCs (e.g., `CS-PC-01`) through the campus core and WAN gateway to `8.8.8.8` (0% packet loss).

### 2. Topology Canvas Overhaul & ASAG Paper Theme:
- Styled topology canvas with ASAG warm off-white paper theme (`#f7f4ed`), subtle dots grid, and clean card styling.
- Authentic networking node symbols (Router, Switch, Workstation PC, Server) with centered port handles and clean straight-line CAD/Visio connections without cable text clutter.
- Dynamic department block height resizing based on host counts.
- Single-line department block headers with inline status dot, VLAN tag, subnet badge, and direct `+ Add PC` and `Cut/Repair Link` buttons.
- In-canvas modal for provisioning workstations directly into any department.
- Side-panel device inspector with workstation de-provisioning (`Delete Workstation`) and quick ping buttons for both intra-campus and external internet (`8.8.8.8`).
- End-to-end active path highlighting tracing from selected host through access switch, distribution switch, core router, to external ISP gateway.

### 3. Cisco Packet Tracer 9.0 Live Engine Integration:
- Configured baseline campus network topology (`packet-tracer/campusnet_backbone.pkt`) with `Campus-Core-Router` (2911), `Core-Dist-SW` (2960), and 4 department access switches (`SW-CS`, `SW-LIB`, `SW-ADMIN`, `SW-SERVERS`).
- Configured Inter-VLAN routing (`dot1Q` sub-interfaces for VLAN 10, 20, 30, 100) and DHCP server pools on the Core Router.
- Built native IPC bridge (`backend/bin/pktctl`) connecting Python to Packet Tracer over local TCP port 39000.
- Verified two-way communication: live device discovery, port state inspection, Cisco IOS CLI execution, and host ICMP ping execution.

### 2. Python Flask REST Backend (`backend/`):
- `GET /api/status` - Live Packet Tracer connection state, PT version, device and link counts.
- `GET /api/topology` - React Flow formatted nodes (with PT canvas coordinates) and edges.
- `GET /api/departments` - Department VLANs, subnets, gateways, and switches.
- `GET /api/devices` - Active devices list from Packet Tracer.
- `POST /api/devices/add` - Spawns a PC-PT on canvas, automatically cables it to the department switch with a straight-through cable, and configures IP/DHCP.
- `DELETE /api/devices/<name>` - Removes a device from the Packet Tracer workspace.
- `POST /api/simulate/ping` - Executes live ping from a host's command prompt inside Packet Tracer and returns exact ICMP statistics.
- `POST /api/acl/apply` - Pushes Cisco IOS ACL rules to `Campus-Core-Router` in real time.
- `GET /api/events` - Live simulated network event logs.

### 3. React 18 + Vite Frontend (`frontend/` in JavaScript & JSX):
- **Dashboard:** Telemetry cards, department subnet utilization bars, live event log feed, and one-click Packet Tracer sync.
- **Topology Explorer:** Interactive canvas powered by `@xyflow/react` rendering custom Router, Switch, Host, and Server nodes, minimap, zoom controls, and device inspection drawer.
- **Campus Structure & IP Manager:** Real-time device table with "Spawn in Packet Tracer" modal supporting DHCP and static IP allocation, and instant de-provisioning.
- **Communication & Security Center:** Interactive ping console with live terminal output from Packet Tracer and router ACL configuration table.

---

## Architecture and Important Files

- `start.sh` - Self-bootstrapping 1-click startup script (macOS/Linux) handling venv & npm install.
- `start.bat` - Self-bootstrapping 1-click startup script (Windows) handling venv & npm install.
- `backend/app.py` - Flask REST API server interfacing with Packet Tracer.
- `backend/pt_client.py` - Native IPC bridge client managing JSON-RPC MCP calls to `pktctl`.
- `backend/bin/pktctl` - Precompiled Apple Silicon binary speaking PTMP to Packet Tracer.
- `packet-tracer/campusnet_backbone.pkt` - Baseline campus topology file.
- `frontend/src/App.jsx` - Main application component managing tabs and data synchronization.
- `frontend/src/services/api.js` - Frontend API client connecting to backend endpoints.
- `frontend/src/pages/Dashboard.jsx` - Overview metrics and subnet utilization.
- `frontend/src/pages/Topology.jsx` - React Flow network canvas.
- `frontend/src/pages/IPManager.jsx` - Workstation provisioning and IP management.
- `frontend/src/pages/SecurityCenter.jsx` - Live ping simulation and ACL rule manager.

---

## Technical Decisions

1. **Packet Tracer as Live Data Plane:** Instead of simulated browser-only logic, the system bridges to Cisco Packet Tracer 9.0 over PTMP IPC (port 39000), delivering 100% genuine Cisco IOS behavior.
2. **Local Dual-Service Architecture:** Python Flask handles the low-level desktop socket bridge, while React + Vite handles responsive UI presentation.
3. **Automated Port Discovery:** When a workstation is spawned from the UI, the backend scans department switch ports and automatically wires the cable to the next available physical FastEthernet access port.

---

## Verification and Test Results

- **PTMP Socket Connection:** Verified `status` returns `connected: true`, `addr: 127.0.0.1:39000`, `pt_version: 9.0.0.0810`.
- **Cisco IOS CLI Execution:** Verified `show ip interface brief` executed on `Campus-Core-Router` returning sub-interface states `up/up`.
- **Workstation Provisioning:** Verified `POST /api/devices/add` dynamically spawned `CS-PC-01` in Packet Tracer and cabled it to `SW-CS:FastEthernet0/2`.
- **Live ICMP Ping:** Verified `CS-PC-01` successfully pinged gateway `192.168.10.1` (4/4 received, 0% loss), inter-VLAN pinged DNS Server `192.168.100.10` (4/4 received), and pinged simulated outside internet gateway `8.8.8.8` through `ISP-Edge-Router` (4/4 received, 0% loss).
- **Routing Table Sync:** Verified `Campus-Core-Router` live routing table reflects default static route `S* 0.0.0.0/0 via 203.0.113.2` and Gateway of Last Resort.
- **Frontend Production Build:** Verified `npm run build` compiled 1,748 modules with zero errors.

---

## Next Recommended Tasks

1. Run `./start.sh` to launch both services side-by-side with Cisco Packet Tracer.
2. Add more workstations across Library (VLAN 20) and Administration (VLAN 30) from the web UI to demonstrate multi-department scalability.
3. Apply an ACL rule to block traffic between CS and Admin and verify that Packet Tracer drops the ping.
