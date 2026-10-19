# CampusNet — University Campus Inter-Network Communication and Management System

CampusNet is a Computer Networks web application designed to model, visualize, and simulate a modern university campus network. It enables exploration of multi-tier network topologies, department and lab management, IPv4 address leasing (DHCP vs. static), and access-control list (ACL) policy evaluation between campus network segments.

> **Academic Project Notice:**  
> CampusNet is an academic Computer Networks project developed for the Computer Networks Laboratory (CNL) curriculum. It is strictly a networking simulation and management system, not a generic university ERP or student portal. All network operations, packet transfers, and IP leasing behaviors are educational **models and simulations**.

---

## Quick Links to Documentation

- **[Project Specification (`PROJECT_SPEC.md`)](PROJECT_SPEC.md)** — Authoritative functional requirements, entity relationships, and acceptance criteria.
- **[Development Report (`DEVELOPMENT_REPORT.md`)](DEVELOPMENT_REPORT.md)** — Persistent handoff report tracking current status, technical decisions, and next steps.
- **[Changelog (`CHANGELOG.md`)](CHANGELOG.md)** — Chronological log of notable additions and changes.
- **[AI Agent Guidelines (`AGENTS.md`)](AGENTS.md)** — Shared AI coding agent instructions and 4-person collaboration rules.
- **[Gemini Agent Guide (`GEMINI.md`)](GEMINI.md)** — Gemini-specific instructions and pre-flight checklist.
- **[Architecture & Network Design (`docs/`)](docs/)**
  - [System Architecture](docs/architecture.md)
  - [Campus Network Design & Addressing](docs/network-design.md)
  - [Data Model & TypeScript Interfaces](docs/data-model.md)
  - [Architecture Decision Records (ADRs)](docs/decisions/README.md)

---

## Problem Statement & Objectives

Managing and understanding modern enterprise campus networks is challenging due to the interplay of physical cabling, VLAN segmentation, subnet allocation, and security filtering. 

**CampusNet** solves this by providing:
1. **Interactive Visualization:** An intuitive visual representation of campus routers, switches, servers, and lab workstations.
2. **Subnet & IP Management:** A structured approach to allocating, validating, and releasing IPv4 addresses without collisions.
3. **Policy & Reachability Simulation:** A hands-on mechanism to verify access control list (ACL) rules and inspect permitted or blocked inter-department traffic.

---

## Planned Application Pages

| Page | Route | Description & Responsibilities |
|---|---|---|
| **Dashboard** | `/dashboard` | High-level campus metrics, active VLAN counts, subnet IP utilization bars, and simulated event feed. |
| **Topology Explorer** | `/topology` | Interactive React Flow canvas with custom nodes (Routers, Switches, PCs, Servers), links, and an inspector drawer. |
| **Campus Structure & IP Manager** | `/ip-manager` | Department and lab hierarchy tree, dynamic DHCP-style auto-allocation, static IP assignment, and RFC 1918 boundary validation. |
| **Communication & Security Center** | `/security` | End-to-end ping/traceroute simulation, packet flow visualization, ACL rule management table, and test history log. |

---

## Networking Concepts Demonstrated

- **IPv4 Addressing & Subnetting:** RFC 1918 address space, CIDR prefix calculations, network ID, directed broadcast address, usable host ranges.
- **VLAN Segmentation:** Departmental traffic isolation (e.g., VLAN 10 Computer Science, VLAN 20 Library, VLAN 30 Administration, VLAN 100 Data Center).
- **Hierarchical Switching & Routing:** Layer 2 access and trunk switching combined with Layer 3 Inter-VLAN routing at the Core Router.
- **IP Allocation Strategies:** Dynamic Host Configuration Protocol (DHCP) simulation vs. static IP configuration with collision prevention.
- **Access Control Lists (ACLs):** First-match priority packet filtering, protocol/port inspection (HTTP, HTTPS, SSH, DNS, ICMP), and explicit diagnostic logging.

---

## Planned Technology Stack

- **Frontend:** [React 18+](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript (`strict` mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Topology Canvas:** [React Flow](https://reactflow.dev/) (`@xyflow/react`)
- **Metrics & Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Future Backend (Phase 4):** Python Flask REST API
- **Future Database (Phase 4):** SQLite

---

## Current Project Status

**Phase 1 Complete:** Repository foundation, comprehensive architecture documentation, AI agent rules, team collaboration workflow, and git hygiene initialized.  
**Phase 2 Pending:** Frontend application initialization and realistic mock data layer.

*All application pages and networking features listed above are currently **planned** and will be implemented iteratively.*

---

## Repository Structure

```text
campusnet/
├── README.md                 # Central project documentation & entry point
├── GEMINI.md                 # Gemini-specific AI assistant instructions
├── AGENTS.md                 # Shared AI coding agent guidelines & team collaboration rules
├── PROJECT_SPEC.md           # Authoritative system requirements & specifications
├── CHANGELOG.md              # Project history and unreleased changes
├── DEVELOPMENT_REPORT.md     # Persistent development status & handoff log
├── .gitignore                # Git ignore rules (Node, Python, DB, OS, IDE)
├── .env.example              # Safe environment variable template
├── frontend/
│   └── README.md             # Frontend architecture & planned execution commands
├── backend/
│   └── README.md             # Backend architecture & planned REST API design
└── docs/
    ├── architecture.md       # Frontend component breakdown & data flow
    ├── network-design.md     # Campus topology, VLANs, subnets, & ACL rules
    ├── data-model.md         # Entity schemas, ER diagram, & TypeScript types
    └── decisions/
        └── README.md         # Architecture Decision Records (ADRs)
```

---

## Setup & Run Instructions

### Current Status (Phase 1)
At this stage, the repository contains the architecture, specification, and workflow documentation. No runtime code or package dependencies have been installed yet.

### Planned Frontend Setup (Phase 2)
*(These commands will become active once the React frontend is initialized in Phase 2)*

```bash
# Clone the repository
git clone https://github.com/YourOrg/campusnet.git
cd campusnet

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Build production bundle
npm run build
```

### Planned Future Backend Setup (Phase 4)
*(These commands will apply when the Python Flask backend is introduced in Phase 4)*

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask run --port=5000
```

---

## Team Contribution & Development Workflow

This project is developed by a four-person team using a feature-branch workflow:
1. Pull latest `main` before starting: `git pull origin main`.
2. Create a feature branch: `git checkout -b feature/dashboard` (or `feature/topology-explorer`, `feature/ip-manager`, `feature/security-center`).
3. Make small, atomic commits and run local checks (`npm run typecheck`, `npm run lint`) before opening a pull request.
4. **Mandatory Documentation Update:** Every pull request must update [`DEVELOPMENT_REPORT.md`](DEVELOPMENT_REPORT.md) and [`CHANGELOG.md`](CHANGELOG.md).
5. Never commit secrets, `.env` files, or build artifacts.

Detailed collaboration standards, coding rules, and conflict prevention practices are documented directly in [`AGENTS.md`](AGENTS.md) and [`GEMINI.md`](GEMINI.md).
