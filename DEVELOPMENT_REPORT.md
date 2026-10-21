# CampusNet Development Report

## Last Updated
2026-10-21

---

## Current Project Status
**Phase 2 & Packet Tracer Engine Integration Completed.**
The system operates as a live **Software-Defined Network (SDN) Controller** where Cisco Packet Tracer 9.0 running locally on the user's Mac functions as the actual network data plane and simulation engine. The Python Flask REST backend communicates with Packet Tracer via native PTMP IPC over port 39000, and the React 18 + JavaScript (JSX) + Tailwind frontend renders the dashboard, interactive topology canvas, IP manager, and security console.

---

## Implemented Features

### 1. Cisco Packet Tracer 9.0 Live Engine Integration:
- Configured baseline campus network topology (`packet-tracer/campusnet_backbone.pkt`) with `Campus-Core-Router` (2911), `Core-Dist-SW` (2960), and 4 department access switches (`SW-CS`, `SW-LIB`, `SW-ADMIN`, `SW-SERVERS`).
- Configured Inter-VLAN routing (`dot1Q` sub-interfaces for VLAN 10, 20, 30, 100) and DHCP server pools on the Core Router.
- Built native IPC bridge (`backend/bin/pktctl`) connecting Python to Packet Tracer over local TCP port 39000.
- Verified two-way communication: live device discovery, port state inspection, Cisco IOS CLI execution, and host ICMP ping execution.

### 2. Python Flask REST Backend (`backend/`):
- `GET /api/status` — Live Packet Tracer connection state, PT version, device and link counts.
- `GET /api/topology` — React Flow formatted nodes (with PT canvas coordinates) and edges.
- `GET /api/departments` — Department VLANs, subnets, gateways, and switches.
- `GET /api/devices` — Active devices list from Packet Tracer.
- `POST /api/devices/add` — Spawns a PC-PT on canvas, automatically cables it to the department switch with a straight-through cable, and configures IP/DHCP.
- `DELETE /api/devices/<name>` — Removes a device from the Packet Tracer workspace.
- `POST /api/simulate/ping` — Executes live ping from a host's command prompt inside Packet Tracer and returns exact ICMP statistics.
- `POST /api/acl/apply` — Pushes Cisco IOS ACL rules to `Campus-Core-Router` in real time.
- `GET /api/events` — Live simulated network event logs.

### 3. React 18 + Vite Frontend (`frontend/` in JavaScript & JSX):
- **Dashboard:** Telemetry cards, department subnet utilization bars, live event log feed, and one-click Packet Tracer sync.
- **Topology Explorer:** Interactive canvas powered by `@xyflow/react` rendering custom Router, Switch, Host, and Server nodes, minimap, zoom controls, and device inspection drawer.
- **Campus Structure & IP Manager:** Real-time device table with "Spawn in Packet Tracer" modal supporting DHCP and static IP allocation, and instant de-provisioning.
- **Communication & Security Center:** Interactive ping console with live terminal output from Packet Tracer and router ACL configuration table.

---

## Architecture and Important Files

- `start.sh` — Self-bootstrapping 1-click startup script (macOS/Linux) handling venv & npm install.
- `start.bat` — Self-bootstrapping 1-click startup script (Windows) handling venv & npm install.
- `backend/app.py` — Flask REST API server interfacing with Packet Tracer.
- `backend/pt_client.py` — Native IPC bridge client managing JSON-RPC MCP calls to `pktctl`.
- `backend/bin/pktctl` — Precompiled Apple Silicon binary speaking PTMP to Packet Tracer.
- `packet-tracer/campusnet_backbone.pkt` — Baseline campus topology file.
- `frontend/src/App.jsx` — Main application component managing tabs and data synchronization.
- `frontend/src/services/api.js` — Frontend API client connecting to backend endpoints.
- `frontend/src/pages/Dashboard.jsx` — Overview metrics and subnet utilization.
- `frontend/src/pages/Topology.jsx` — React Flow network canvas.
- `frontend/src/pages/IPManager.jsx` — Workstation provisioning and IP management.
- `frontend/src/pages/SecurityCenter.jsx` — Live ping simulation and ACL rule manager.

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
- **Live ICMP Ping:** Verified `CS-PC-01` successfully pinged gateway `192.168.10.1` (4/4 received, 0% loss) and inter-VLAN pinged DNS Server `192.168.100.10` (3/4 received, 10ms avg round trip).
- **Frontend Production Build:** Verified `npm run build` compiled 1,748 modules with zero TypeScript or Vite errors.

---

## Next Recommended Tasks

1. Run `./start.sh` to launch both services side-by-side with Cisco Packet Tracer.
2. Add more workstations across Library (VLAN 20) and Administration (VLAN 30) from the web UI to demonstrate multi-department scalability.
3. Apply an ACL rule to block traffic between CS and Admin and verify that Packet Tracer drops the ping.
