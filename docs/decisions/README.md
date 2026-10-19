# Architecture Decision Records (ADRs)

This directory documents significant architectural, technical, and networking design decisions made during the lifecycle of the **CampusNet** project.

Recording decisions helps the four-person team and collaborating AI agents maintain consistency and understand the context, tradeoffs, and consequences behind key choices.

---

## ADR Format

Each Architecture Decision Record should follow this lightweight structure:

```markdown
# ADR-[NUMBER]: [Short Title]

## Status
[Proposed | Accepted | Superseded | Deprecated]

## Date
YYYY-MM-DD

## Context
What problem are we trying to solve? What are the constraints, requirements, and context?

## Decision
What is the chosen approach or solution?

## Alternatives Considered
1. Alternative A: Pros and Cons. Why was it not chosen?
2. Alternative B: Pros and Cons. Why was it not chosen?

## Consequences
- Positive impacts: What improves as a result?
- Negative impacts or trade-offs: What complexity or limitations are introduced?
```

---

## Decision Index

| ID | Title | Status | Date | Summary |
|---|---|---|---|---|
| [ADR-0001](#adr-0001-frontend-first-development-with-realistic-mock-data) | Frontend-First Development with Realistic Mock Data | Accepted | 2026-10-19 | Build frontend UI, simulation engine, and mock state before backend implementation. |
| [ADR-0002](#adr-0002-technology-stack-selection) | Technology Stack Selection | Accepted | 2026-10-19 | Adopt React + Vite + TypeScript + Tailwind + React Flow for frontend, and Python Flask + SQLite for future backend. |
| [ADR-0003](#adr-0003-network-modeling-and-simulation-terminology) | Network Modeling and Simulation Terminology | Accepted | 2026-10-19 | Explicitly label all networking features as simulated/modeled; do not claim real packet filtering or real DHCP daemon. |

---

## ADR-0001: Frontend-First Development with Realistic Mock Data

### Status
Accepted

### Date
2026-10-19

### Context
CampusNet is an academic Computer Networks project with four distinct interactive views: Dashboard, Topology Explorer, Campus Structure & IP Manager, and Communication & Security Center. Building a backend and database upfront before finalizing visual topology interactions, subnet validation UX, and security test workflows risks premature API churn and slower progress across a 4-person team.

### Decision
Implement the entire application frontend first using realistic, strongly-typed mock data and client-side IPv4 validation. Once the frontend user experience and data requirements are thoroughly validated, develop the Python Flask REST API and SQLite schema to match the established contracts.

### Alternatives Considered
1. **Full-stack concurrent development:** Backend and frontend developed simultaneously. Rejected due to the coordination bottleneck between four team members before API specs stabilize.
2. **Backend-first development:** Build Flask REST API and SQLite models first. Rejected because visual graph rendering (React Flow) and IP management UX dictate data requirements.

### Consequences
- **Positive:** Team members can immediately work on UI pages using shared TypeScript mock data; rapid iteration on visual components; no backend environment setup needed for early testing.
- **Negative:** Data changes in mock mode are in-memory (resets on page reload unless persisted to `localStorage`); transition to Flask backend will require replacing mock service calls with HTTP `fetch` requests.

---

## ADR-0002: Technology Stack Selection

### Status
Accepted

### Date
2026-10-19

### Context
The application needs high-performance interactive network topology visualization, responsive tabular IP management, clean metrics visualization, and clear separation of networking simulation logic.

### Decision
1. **Frontend:** React 18+ with Vite as build tool.
2. **Language:** TypeScript for type safety across networking data models (IPs, CIDRs, VLANs, ACLs).
3. **Styling:** Tailwind CSS for modular, consistent styling.
4. **Visualization:** React Flow (`@xyflow/react`) for network device and link topology.
5. **Charts:** Recharts for network metric charts on Dashboard.
6. **Future Backend:** Python Flask with SQLite for lightweight, academic-appropriate backend persistence.

### Alternatives Considered
1. **D3.js for topology:** Powerful but higher boilerplate and complexity compared to React Flow's node/edge component model.
2. **Vanilla JavaScript:** Lacks type safety for complex IPv4 CIDR and ACL rule structures; prone to runtime errors across team members.
3. **Django or FastAPI:** Heavier configuration than needed for a college project; Flask with SQLite provides clean, minimal REST service.

### Consequences
- **Positive:** Rapid component rendering; robust compile-time type safety; interactive node-based canvas with built-in zoom/pan; zero database installation friction for SQLite.
- **Negative:** React Flow requires learning node/edge data structures and custom node components.

---

## ADR-0003: Network Modeling and Simulation Terminology

### Status
Accepted

### Date
2026-10-19

### Context
Academic grading for computer networks projects requires complete integrity regarding what is actually running. The application models campus network devices, subnets, DHCP leasing, and ACL policy enforcement.

### Decision
Unless real network packet capture (e.g., Raw Sockets / Scapy) or Cisco Packet Tracer API integration is explicitly implemented and verified, all documentation, UI copy, and code comments must clearly describe the system as a **model** or **simulation**. We will not claim that frontend code filters real operating system network packets or runs an actual RFC 2131 DHCP server daemon.

### Alternatives Considered
1. **Ambiguous presentation:** Describing the app as a "network management and firewall system" without clarifying simulation scope. Rejected because it is misleading and academically inaccurate.

### Consequences
- **Positive:** Clear academic transparency, accurate expectations for grading, honest project documentation.
- **Negative:** None.
