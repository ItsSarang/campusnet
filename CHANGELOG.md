# Changelog

All notable changes to the **CampusNet** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
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
