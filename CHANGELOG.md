# Changelog

All notable changes to the **CampusNet** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Packet Tracer Router Hardware Synchronization:**
  - Instantiated and saved all four departmental gateway routers (`Router-CS`, `Router-LIB`, `Router-ADMIN`, `Router-DC` - Cisco 2911 model) into Cisco Packet Tracer 9.0 and committed them directly into `packet-tracer/campusnet_backbone.pkt`.
  - Department routers now exist synchronously across both the physical Packet Tracer simulation data plane and the interactive web topology canvas.
- **Three-Tier Failover vs Block Offline Reachability System:**
  - Implemented dynamic reachability engine evaluating full-graph BFS path connectivity from each department to external gateway (`ISP-Edge-Router`).
  - Blocks do not turn red when direct core transit links are cut if alternative lateral router routes remain viable (`Router-CS <-> Router-LIB` or `Router-ADMIN <-> Router-DC`).
  - Amber border (`#f59e0b`) and `[FAILOVER ACTIVE (via NextHop)]` status badge rendered when traffic is rerouted through an adjacent peer router, with block remaining online.
  - Red border (`#ef4444`), ring, and `[BLOCK OFFLINE (NO ROUTE TO OUTSIDE)]` status rendered only when all alternative egress routes or local gateway trunks are severed.
  - Updated notification banner to differentiate between failover rerouting (`type: warning`) and complete subnet isolation (`type: error`).

### Added
- **Universal Edge Cable Cut System & Cable Inspector:**
  - Interactive cable click detection on any connection across the campus network (Core Transit, Lateral Mesh, WAN Gateway, Switch Trunk, Access Patch Cord, and Server Uplink).
  - Dedicated Cable Inspector drawer displaying physical endpoints, port names, carrier state, topological impact analysis, and direct Cut/Repair toggle.
  - Interactive on-canvas `[SEVERED]` badge on cut cables with red dashed animation and carrier drop status.
  - Realistic Layer 1, Layer 2, and Layer 3 ping error diagnostics for severed cables (Physical link down, Gateway trunk down, WAN carrier severed, Server link down).
- **Multi-Router Campus Interconnect & Distance-Vector Routing Tables:**
  - Added dedicated Department Gateway Routers to each academic block (`Router-CS`, `Router-LIB`, `Router-ADMIN`, `Router-DC`) connecting downstream to department switches and upstream to `Campus-Core-Router`.
  - Added lateral campus mesh links (`Router-CS <-> Router-LIB` and `Router-ADMIN <-> Router-DC`) for path redundancy and rerouting.
  - Implemented dynamic shortest path routing computation generating clean 3-column distance-vector tables (`Destination Router`, `Distance`, `Next Hop`).
  - Redesigned Routing Tables drawer to render each router's current active table sequentially with zero historical log clutter.
  - Added dynamic active path highlighter (BFS) tracing packets from selected hosts through access switches, department routers, and campus core to the ISP edge.
- **Option B Multi-Router WAN Edge & Internet Gateway Integration:**
  - Added `ISP-Edge-Router` (Cisco 2911) representing an external Internet Service Provider on public subnet `203.0.113.0/30`.
  - Configured `Loopback0` on `ISP-Edge-Router` representing simulated public internet destination `8.8.8.8` (Google Public DNS).
  - Configured default static route `ip route 0.0.0.0 0.0.0.0 203.0.113.2` on `Campus-Core-Router` with real-time routing table parsing.
  - Verified live ICMP end-to-end ping from campus workstations to `8.8.8.8` across the campus core and WAN gateway link.
- **Topology Canvas Overhaul & ASAG Paper Theme:**
  - Canvas redesigned with warm off-white paper theme (`#f7f4ed`), clean CAD/Visio straight-line connections, and zero cable text clutter.
  - Authentic Cisco networking node symbols (Router, Switch, Workstation, Server) with centered connection handles.
  - Dynamic department block height resizing based on device count and row calculations.
  - Clean single-line block headers with inline status dot, VLAN tag, subnet badge, and direct `+ Add PC` and `Cut/Repair Link` buttons.
  - In-canvas workstation provisioning modal and side-panel device deletion button.
  - Full end-to-end active path highlighting tracing through access switch, distribution switch, core router, and ISP edge router.
- **Cisco Packet Tracer 9.0 Live Engine Integration:**
  - Integrated Cisco Packet Tracer 9.0 as the live network data plane via local PTMP IPC on port 39000.
  - Authored baseline campus topology in `packet-tracer/campusnet_backbone.pkt`.
  - Implemented `backend/pt_client.py` and precompiled macOS Apple Silicon bridge binary in `backend/bin/pktctl`.
  - Implemented Python Flask REST API server in `backend/app.py` with endpoints for status, topology, device provisioning, live ping testing, and router ACL application.
  - Implemented React 18 + Vite + TypeScript + Tailwind CSS frontend with:
    - **Dashboard:** Telemetry cards, subnet utilization progress bars, live event feed.
    - **Topology Explorer:** Interactive `@xyflow/react` canvas with custom Router, Switch, Host, and Server nodes and inspector drawer.
    - **IP & Department Manager:** Workstation provisioning modal (auto-cabling and IP assignment in Packet Tracer) and device removal.
    - **Communication & Security Center:** Live ping test console with raw Packet Tracer stdout output and router ACL configuration.
  - Frontend converted to clean, standard React + Vite in JavaScript/JSX (`.jsx`/`.js`) for maximum simplicity and accessibility.
  - Implemented 1-click self-bootstrapping startup scripts (`start.sh` for macOS/Linux and `start.bat` for Windows) with automatic Python virtual environment and `npm install` provisioning.
  - Added streamlined 2-step onboarding quick-start guide to `README.md` for seamless teammate collaboration.
  - Created unified startup script `start.sh` and `start.bat`.
