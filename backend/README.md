# CampusNet — Backend

This directory contains the planned backend architecture for **CampusNet**.

> **Status:** Planned / Not yet implemented. No backend code, virtual environment, or database has been created yet.

---

## Planned Technology Stack

- **Runtime:** Python 3.10+
- **Framework:** [Flask](https://flask.palletsprojects.com/) / Flask-RESTful
- **Database:** [SQLite](https://www.sqlite.org/) (lightweight, zero-configuration relational database)
- **ORM / Query Builder:** SQLAlchemy or lightweight SQLite helper
- **Testing:** `pytest`

---

## Frontend-First Rationale

To ensure rapid iteration and clear interface contracts, CampusNet adheres to a strict **frontend-first development order**:

1. **Phase 1 (Current):** Project foundation, architecture documentation, AI agent collaboration standards.
2. **Phase 2:** Complete frontend development with realistic, strongly-typed mock data and client-side IPv4 validation.
3. **Phase 3:** Frontend review and integration testing across all four views.
4. **Phase 4 (Future):** Python Flask backend implementation and SQLite schema generation to replace mock data persistence.
5. **Phase 5 (Future Evaluation):** Assessment of Cisco Packet Tracer integration (via PT API or configuration export) if required for academic demonstration.

**Important:** Do not create dummy or stub backend services during the frontend phase. The frontend will be designed with a decoupled data layer so switching from mock data to Flask REST endpoints is seamless.

---

## Planned REST API Endpoints

When implemented, the backend will expose RESTful JSON endpoints:

### 1. Campus Structure & Topology
- `GET /api/v1/departments` — List departments and associated VLANs
- `GET /api/v1/departments/:id/labs` — List labs belonging to a department
- `GET /api/v1/topology` — Return nodes and links formatted for graph visualization

### 2. IP & Subnet Management
- `GET /api/v1/subnets` — List configured subnets and current IP pool utilization
- `POST /api/v1/ips/allocate` — Request dynamic (DHCP-style) or static IP allocation
- `POST /api/v1/ips/release` — Release an allocated IP address back to pool
- `POST /api/v1/ips/validate` — Validate IP uniqueness, subnet membership, and gateway conflicts

### 3. Communication & Security Evaluation
- `GET /api/v1/acl/rules` — List configured access-control rules
- `POST /api/v1/acl/rules` — Create or update ACL rule
- `POST /api/v1/simulate/test-connectivity` — Evaluate packet flow / ping test between source and destination endpoints
- `GET /api/v1/simulate/history` — Retrieve history of simulated connectivity tests

---

## Planned Setup & Execution Instructions

*(These instructions will apply once the backend is initialized in Phase 4.)*

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations / seed script
python seed_db.py

# Run development server
flask run --port=5000
```
