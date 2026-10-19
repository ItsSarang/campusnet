# CampusNet — Gemini Agent Instructions

This document provides tailored operating instructions for Google Gemini models and Gemini-based development workflows (such as Google Antigravity / Gemini CLI) working on **CampusNet**.

> **Note on Shared Rules:**  
> CampusNet maintains tool-neutral AI agent guidelines and full four-person collaboration rules in [`AGENTS.md`](AGENTS.md). Gemini agents must adhere to all shared rules defined in `AGENTS.md` alongside the directives below.

---

## 1. Project Context & Objectives

**CampusNet** is a Computer Networks college laboratory project. Its goal is to create a web application that models and visualizes a multi-department university campus network, providing:
1. **Dashboard:** High-level metrics, VLAN counts, IP pool consumption, and simulated alerts.
2. **Topology Explorer:** Interactive network graph (React Flow) rendering routers, switches, and hosts with deep node inspection.
3. **Campus Structure & IP Manager:** Department/lab hierarchy and dual dynamic (DHCP) / static IP allocation with strict RFC 1918 validation.
4. **Communication & Security Center:** Interactive ping/traceroute simulation and priority-ordered Access Control List (ACL) evaluation.

**Crucial Academic Constraint:** All networking functionality is an educational **model / simulation**. Never state or imply that the system intercepts real operating system network packets (raw sockets) or runs a real RFC 2131 DHCP server daemon on the host.

---

## 2. Mandatory Pre-Flight Checklist

Before writing code, proposing edits, or answering architectural queries, you **must**:
1. Read [`DEVELOPMENT_REPORT.md`](DEVELOPMENT_REPORT.md) to inspect the current project phase, active handoff notes, and known limitations.
2. Read [`PROJECT_SPEC.md`](PROJECT_SPEC.md) for authoritative functional requirements and acceptance criteria.
3. Read [`AGENTS.md`](AGENTS.md) for full AI agent guidelines and coding standards.
4. Read [`CHANGELOG.md`](CHANGELOG.md) for recent project history and unreleased changes.

---

## 3. Four-Person Team Collaboration Guidelines

You are paired with a member of a **four-person student development team**. You must actively uphold clean collaboration hygiene:

### A. Team Task Boundaries
- **Member 1:** Shared Application Shell, Navigation, Global State Context, and Dashboard.
- **Member 2:** Topology Explorer (React Flow canvas, custom nodes, inspection drawer).
- **Member 3:** Campus Structure & IP Manager (departments/labs tree, IP allocation & validation engine).
- **Member 4:** Communication & Security Center (ACL policy engine, ping simulation, packet trace visualizer).

### B. Feature Branches & Pull Requests
- Never propose direct commits to `main`.
- Always work on dedicated feature branches: `feature/dashboard`, `feature/topology-explorer`, `feature/ip-manager`, `feature/security-center`, `fix/<name>`, `docs/<name>`.
- Open small, well-documented pull requests targeting `main`.
- Require review and verification from at least one teammate before merging.

### C. Shared File Coordination & Anti-Clobbering Rules
- **Coordinate Shared Types:** Shared interfaces live in `src/types/network.ts` (derived from [`docs/data-model.md`](docs/data-model.md)). Coordinate schema additions with teammates before modifying.
- **Coordinate Shared Mock Data:** Additions to `src/data/mockNetwork.ts` should append new entries without modifying or removing existing entities.
- **Preserve Teammate Work:** **Never** reset, overwrite, truncate, or delete a teammate's existing work or page components to make your task simpler.
- **Conflict Resolution:** If a merge conflict occurs, resolve it by preserving both teammates' features. Never force-push (`git push --force`) or hard-reset shared branches (`git reset --hard`).

---

## 4. Technology Stack & Coding Standards

- **Frontend:** React 18+ bootstrapped with Vite.
- **Language:** TypeScript in strict mode. Use explicit types; strictly avoid `any`.
- **Styling:** Tailwind CSS. Use utility classes; avoid ad-hoc inline styles.
- **Topology:** React Flow (`@xyflow/react`).
- **Charts:** Recharts (used selectively on Dashboard).
- **Future Backend (Phase 4 only):** Python 3.10+ Flask and SQLite.
- **Do NOT introduce:** Backend code, database setup, authentication flows, or Packet Tracer configurations during the frontend phase.

---

## 5. Networking Correctness & Validation

- All subnet math must be mathematically correct:
  - Total hosts = $2^{(32 - \text{prefix})} - 2$.
  - Network address has all host bits set to 0.
  - Directed broadcast address has all host bits set to 1.
  - Default gateway is reserved at `.1` for each department subnet.
  - Dynamic DHCP pool is reserved from `.51` through `.254`.
  - Static pool is reserved from `.2` through `.50`.
- ACL rules must follow deterministic first-match evaluation semantics based on numerical priority.

---

## 6. Verification & Honest Reporting

- Run available checks relevant to changed files:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Report exact results honestly: state what passed, what failed (with logs), and what could not be run.
- **Never fabricate test output, fake passing grades, or claim backend features exist when they do not.**

---

## 7. Mandatory Handoff Protocol

After completing any non-trivial code or documentation modification:
1. Update `DEVELOPMENT_REPORT.md` with:
   - What was modified.
   - Files affected.
   - Current status of the feature.
   - Exact checks performed and results.
   - Known limitations or bugs.
   - Next recommended action.
2. Update `CHANGELOG.md` under `[Unreleased]` for any user-visible feature or fix.
3. Summarize the handoff clearly for the user and teammates.
