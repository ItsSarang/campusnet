# Changelog

All notable changes to the **CampusNet** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Topology Explorer Canvas & Inspector Enhancements:**
  - Added elevated double border and drop shadow to the canvas container to clearly separate the interactive network graph from the page background.
  - Standardized Device and Cable Inspector drawers to a strict fixed width (384px) across all device types to eliminate layout shifting.
  - Replaced nested inner cards within Device and Cable Inspectors with clean section dividers and generous vertical spacing.
  - Removed bottom close buttons, redundant carrier metadata, and Academic Zone rows to streamline inspector side panels.
  - Upgraded Campus Routing Tables from a floating modal into a docked full-height side panel matching the Device Inspector.
  - Removed dividers between router headers and route tables, and stripped colored badge boxes from the distance column for clean typographic display.
- **Controlled Communication & Policy Matrix (Visual Firewall):**
  - Interactive 3x4 department access control matrix in SecurityCenter allowing instant packet policy toggling (ALLOW / DENY) between CS, Library, Admin, and Data Center servers.
  - 1-Click Policy Enforcement compiling matrix state into Cisco IOS Extended Access-List commands (`CAMPUS-FIREWALL`) pushed live to `Campus-Core-Router` in Packet Tracer.
  - Automated 1-click verification presets testing ICMP ping reachability and HTTP portal responses.
- **Multi-Domain Campus Web Services & Internal Admin Server:**
  - Deployed dedicated `Admin-Portal-Server` (`Server-PT`) at `192.168.30.20` in Academic Block C (VLAN 30) serving confidential university administrative records.
  - Configured native DNS service on `Campus-DNS-Server` with `A` records for `student.mitwpu.edu`, `admin.mitwpu.edu`, and `library.mitwpu.edu`.
  - Configured HTTP servers with rich HTML portals for student course registration and executive administration.
- **Simulated Campus Web Browser Window:**
  - Styled the web test view to authentic desktop browser aesthetics with window control buttons, tab header, client workstation picker, address bar with lock icon, and bottom status bar.
  - Deployed clean academic intranet web pages for student.mitwpu.edu and admin.mitwpu.edu presenting Computer Networks Laboratory simulation context without clutter or dummy pills.
  - Implemented authentic browser network error view rendering diagnostic details when traffic is dropped by Core Router ACLs.
- **Streamlined Security Center View:**
  - Consolidated action buttons (`View IOS Script` and `Enforce Rules`) directly into the Communication Matrix card header.
  - Removed redundant top header card, card subtitles, and bottom legend bar from the matrix view to prioritize functional controls.
  - Refined workstation select dropdowns with generous padding and explicit icon placement to prevent text clipping.
  - Removed redundant 1-click presets card to reduce visual noise and prioritize the Visual Firewall Matrix and live verification browser.
- **Cisco IOS Script Preview Modal:**
  - Added dedicated syntax modal showing the exact compiled Cisco IOS Extended ACL configuration before and after router enforcement.
- **Global ASAG Offwhite Color Palette & Design System:**
  - Standardized the entire web application on the warm offwhite aesthetic from the ASAG project.
  - Base canvas background set to `#f7f4ed`, card and panel surfaces to `#fdfcf9` and `#faf8f4`, with `#dfd8c8` borders and `#1e1c19` typography.
  - Re-themed Dashboard metrics, department capacity sliders, progress bars, and simulation feed.
  - Re-themed Security & Ping Center, terminal stdout display, ACL evaluation table, and modal dialogs.
- **Streamlined Navbar:**
  - Removed the standalone CampusNet icon box.
  - Positioned the Packet Tracer 9.0 Live status pill badge immediately adjacent to the CampusNet brand name.
  - Applied segmented rounded pill tab container styling (`bg-[#e6e0d2] p-0.5 rounded-xl border border-[#d8d0bf]`).
- **Footer Removal:**
  - Removed the bottom footer element completely from `App.jsx` to achieve a clean full-viewport canvas and view presentation.
- **Central DHCP Server Service in Packet Tracer:**
  - Provisioned `Campus-DHCP-Server` (model: `Server-PT`) with static IP `192.168.100.20` in the Data Center block (`block-dc`).
  - Physically cabled to `SW-SERVERS` on port FastEthernet0/3 in Cisco Packet Tracer 9.0 and saved to `packet-tracer/campusnet_backbone.pkt`.
  - Configured native DHCP service with active IP pools for Computer Science (`Pool-CS`), Library (`Pool-LIB`), and Administration (`Pool-ADMIN`).
- **Dynamic VLSM Subnet Sizing & Capacity Planning:**
  - Configurable max PC capacity per department on Dashboard with strict validation preventing reduction below existing device counts.
  - Automatic dynamic recalculation of optimal CIDR prefixes (e.g., /28, /27, /26) and subnet masks based on target host capacity.
  - Department capacity progress bars with color-coded thresholds (emerald < 70%, amber 70-90%, rose > 90%).
  - Hard capacity enforcement in Topology Explorer preventing workstation additions when department limit is reached, with descriptive alert banners.
- **Dashboard Header Simplification:**
  - Fully removed the top card ("Campus Network Control Center") from Dashboard to maximize content visibility and streamline telemetry display.
- **3-Tab Navigation Architecture (Option A):**
  - Streamlined application navigation to 3 core pages: Dashboard, Topology Explorer, and Security & Ping Center.
  - Workstation provisioning, IP/subnet viewing, device de-provisioning, and link inspections are consolidated entirely into the spatial Topology canvas.
- **Canvas Controls Streamlining:**
  - Removed top card above the canvas containing redundant action buttons to maximize vertical screen space for the topology graph.
  - Added dedicated resync icon button directly inside the canvas Controls group placed directly above the zoom `+` button.
- **Packet Tracer Complete Cable Rewiring & Alignment:**
  - Physically connected all 4 department routers (`Router-CS`, `Router-LIB`, `Router-ADMIN`, `Router-DC`) in Cisco Packet Tracer 9.0 using straight and crossover cabling.
  - Wired department switches (`SW-CS`, `SW-LIB`, `SW-ADMIN`, `SW-SERVERS`) to router GigabitEthernet0/0 ports.
  - Wired lateral failover mesh links (`Router-CS <-> Router-LIB` and `Router-ADMIN <-> Router-DC`) on GigabitEthernet0/2 crossover ports.
  - Wired core distribution uplinks from each router GigabitEthernet0/1 to `Core-Dist-SW`.
  - Configured all router interfaces with `no shutdown` and cleanly repositioned all devices on the logical canvas.
  - Saved live network state to `packet-tracer/campusnet_backbone.pkt`.
- **Bellman-Ford Distance Vector Routing Algorithm:**
  - Implemented exact Bellman-Ford Distance Vector Routing (RFC 1058 RIP semantics) in `backend/app.py`.
  - Iterates relaxation $D_u(v) = \min_w \{ c(u, w) + D_w(v) \}$ with infinity threshold of 16 hops.
  - Displays dynamic 3-column routing table (`Destination Router`, `Distance`, `Next Hop`) in the Topology Explorer drawer.
- **Topology Canvas Streamlining:**
  - Removed redundant Cut Uplink button from building block headers; cable cutting is now unified exclusively via interactive cable clicks and the Cable Inspector side panel.
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
