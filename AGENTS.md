# CampusNet — AI Coding Agent Guidelines

This file defines the operating principles, quality standards, four-person team collaboration workflow, and verification rules for all **AI coding assistants** (e.g., Claude, GitHub Copilot, Cursor, Gemini, Aider) working on the **CampusNet** repository.

> **Crucial Tool Notice:**  
> AI tools do not automatically discover or read repository files unless specifically configured, prompted, or natively supported. Team members must verify that their chosen AI tool recognizes this file or explicitly provide its contents at the beginning of each session.

---

## 1. Project Context & Purpose

**CampusNet** is a Computer Networks college laboratory project. Its purpose is to model, visualize, and simulate an enterprise-scale university campus inter-network, covering:
- IPv4 addressing, CIDR subnet calculation, and host range enforcement.
- VLAN segmentation and departmental broadcast domain isolation.
- Layer 2 switching and Layer 3 Inter-VLAN routing via default gateways.
- Dynamic Host Configuration Protocol (DHCP) simulation vs. static IP configuration.
- Access-Control List (ACL) priority-ordered packet filtering and reachability simulation.

**Academic Integrity Constraint:** This application models and simulates networking behavior. AI agents must **never** claim that the application runs a real operating system packet sniffer (raw sockets) or an actual RFC 2131 DHCP server daemon on the host machine.

---

## 2. Mandatory Reading List

Before executing any code modification, feature addition, or refactoring, an AI agent **must read**:
1. [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — Authoritative requirements, page specifications, and acceptance criteria.
2. [`DEVELOPMENT_REPORT.md`](DEVELOPMENT_REPORT.md) — The latest persistent status, active phase, known limitations, and handoff notes.
3. [`CHANGELOG.md`](CHANGELOG.md) — Recent project changes and unreleased items.
4. Relevant documents in [`docs/`](docs/) (`architecture.md`, `network-design.md`, `data-model.md`, `decisions/README.md`).

---

## 3. Four-Person Team Collaboration Workflow

CampusNet is actively developed by a **four-person student team**. Every AI agent and human contributor must follow these collaboration practices:

### A. Proposed Team Work Split
| Team Member | Focus Area | Planned Deliverables |
|---|---|---|
| **Member 1** | **Shared Foundation & Dashboard** | App shell, navigation, global routing, state context setup, common types, Dashboard metrics, and subnet utilization widgets. |
| **Member 2** | **Topology Explorer** | React Flow canvas integration, custom node components (Router, Switch, Host, Server), minimap, node inspector drawer, and VLAN filter controls. |
| **Member 3** | **Campus Structure & IP Manager** | Department/Lab hierarchy tree view, IP allocation tables, DHCP-style auto-assign engine, static IP allocation modal, and subnet validation rules. |
| **Member 4** | **Communication & Security Center** | ACL rule management table, packet transmission simulation engine, ping test UI, hop-by-hop packet path visualizer, and test history log. |

### B. Git Branching Strategy
- **`main` is protected:** Direct commits or pushes to `main` are prohibited. `main` must remain stable, buildable, and working at all times.
- **Feature Branches:** All work must occur on dedicated branches created from an up-to-date `main`:
  - `feature/dashboard`
  - `feature/topology-explorer`
  - `feature/ip-manager`
  - `feature/security-center`
  - `fix/<issue-name>` for bug fixes
  - `docs/<topic>` for documentation changes
- **Pull Requests (PRs):** All merges into `main` require a PR, review by at least one teammate, and passing local verification checks.

### C. Shared Code Coordination & Conflict Prevention
1. **Shared Types (`src/types/network.ts`):** Coordinate data model extensions with teammates before modifying shared entity schemas.
2. **Shared Mock Dataset (`src/data/mockNetwork.ts`):** Append new records rather than restructuring existing keys.
3. **Dedicated Page Directories:** Keep view-specific components inside their respective folders (`src/pages/Topology/`, `src/pages/IPManager/`, etc.) to prevent cross-teammate conflicts.
4. **Preserve Teammate Work:** **Never** reset, overwrite, truncate, or delete a teammate's existing work, components, or files to make your task simpler.
5. **Conflict Resolution:** If merge conflicts arise, resolve them cooperatively without discarding another member's contributions.

---

## 4. Core Development Rules

### Rule 1: Respect the Frontend-First Sequence
Development follows a strict phase order:
1. **Phase 1 (Complete):** Foundation & Documentation.
2. **Phase 2:** Complete React frontend with realistic mock data (`src/data/mockNetwork.ts`).
3. **Phase 3:** Integration & validation across all four pages.
4. **Phase 4:** Python Flask REST backend & SQLite database.
5. **Phase 5:** Evaluation of Cisco Packet Tracer integration.

**Do NOT:**
- Create backend endpoints, Python scripts, database models, or authentication flows during Phase 2.
- Introduce extraneous packages without clear justification.

### Rule 2: Coding Standards & TypeScript Discipline
- **Strict TypeScript:** No `any`. Define and reuse explicit types in `src/types/`.
- **Pure React 18+:** Functional components, modular hooks, clean separation of concerns. Do not mix `.js`/`.jsx` files into the TypeScript codebase.
- **Tailwind CSS:** Use standard utility classes; avoid ad-hoc inline styles.

### Rule 3: Maintain Networking Correctness
- All IP address math (network ID, broadcast, subnet mask, usable host range) must strictly follow IPv4 standards ([RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918)).
- Always prevent IP collisions, gateway conflicts (`.1`), and out-of-subnet assignments.
- ACL evaluation must adhere to deterministic priority-ordered first-match logic.

### Rule 4: Verify Honestly & Report Actual Results
- Run appropriate checks for the files you change (e.g., `npm run typecheck`, `npm run lint`, `npm run build`).
- **Never fabricate test results.** State exactly which commands succeeded, which failed with exact error logs, and which were not run.

### Rule 5: Mandatory Documentation Handoff
After completing any meaningful code change, the agent must update:
1. **`DEVELOPMENT_REPORT.md`:** Document what changed, files touched, current status, checks run, known bugs, and the recommended next task.
2. **`CHANGELOG.md`:** Add an entry under `[Unreleased]` for user-visible features or fixes.
3. **`PROJECT_SPEC.md` / `docs/`:** Update if requirements or architectural contracts changed.

### Rule 6: Never Commit Secrets or Sensitive Data
- Never commit `.env` files, API keys, passwords, or personal credentials.
- Ensure all environment configurations use safe placeholders in `.env.example`.
- Use fictional, representative campus data; do not use real sensitive university data.

### Rule 7: Do Not Fabricate Completed State
- Never claim a feature, page, or integration is complete or working unless you have verified it.
- Mark all unfinished or future features as **planned** or **in progress**.
