"""
CampusNet - Local Flask Backend Server
Interfaces with Cisco Packet Tracer via pt_client and exposes a RESTful API
for the React frontend.
"""

import os
import sys
import re
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure current directory is in path for module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pt_client import PacketTracerClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campusnet_app")

app = Flask(__name__)
CORS(app)

pt = PacketTracerClient()
pt.start()

# Baseline Departments metadata
DEPARTMENTS = {
    "dept-cs": {
        "id": "dept-cs",
        "name": "Department of Computer Science",
        "code": "CS",
        "vlan": 10,
        "subnet": "192.168.10.0/24",
        "gateway": "192.168.10.1",
        "switch": "SW-CS",
        "color": "#3b82f6",  # blue
    },
    "dept-lib": {
        "id": "dept-lib",
        "name": "University Library",
        "code": "LIB",
        "vlan": 20,
        "subnet": "192.168.20.0/24",
        "gateway": "192.168.20.1",
        "switch": "SW-LIB",
        "color": "#10b981",  # green
    },
    "dept-admin": {
        "id": "dept-admin",
        "name": "Campus Administration",
        "code": "ADMIN",
        "vlan": 30,
        "subnet": "192.168.30.0/24",
        "gateway": "192.168.30.1",
        "switch": "SW-ADMIN",
        "color": "#f59e0b",  # amber
    },
    "dept-dc": {
        "id": "dept-dc",
        "name": "Campus Data Center",
        "code": "DC",
        "vlan": 100,
        "subnet": "192.168.100.0/24",
        "gateway": "192.168.100.1",
        "switch": "SW-SERVERS",
        "color": "#8b5cf6",  # purple
    },
}

# In-memory test and event history
EVENT_LOGS = [
    {
        "id": 1,
        "timestamp": "12:00:00",
        "type": "SYSTEM",
        "message": "Campus backbone initialized with Cisco Packet Tracer.",
    }
]

ACL_RULES = [
    {
        "id": "acl-1",
        "number": 101,
        "name": "Allow DNS Queries to Campus Server",
        "action": "permit",
        "protocol": "udp",
        "source": "any",
        "destination": "host 192.168.100.10 eq 53",
        "enabled": True,
    },
    {
        "id": "acl-2",
        "number": 102,
        "name": "Block Admin Subnet from Student Devices",
        "action": "deny",
        "protocol": "ip",
        "source": "192.168.10.0 0.0.0.255",
        "destination": "192.168.30.0 0.0.0.255",
        "enabled": False,
    },
]


def log_event(event_type: str, message: str):
    import datetime

    EVENT_LOGS.insert(
        0,
        {
            "id": len(EVENT_LOGS) + 1,
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "type": event_type,
            "message": message,
        },
    )
    if len(EVENT_LOGS) > 50:
        EVENT_LOGS.pop()


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------


@app.route("/api/status", methods=["GET"])
def get_status():
    """Returns live connection status with Cisco Packet Tracer."""
    try:
        raw_status = pt.get_status()
        return jsonify(
            {
                "connected": raw_status.get("connected", False),
                "pt_version": raw_status.get("pt_version", "Unknown"),
                "addr": raw_status.get("addr", "127.0.0.1:39000"),
                "devices": raw_status.get("devices", 0),
                "links": raw_status.get("links", 0),
                "error": raw_status.get("error"),
            }
        )
    except Exception as e:
        logger.error(f"Status error: {e}")
        return jsonify({"connected": False, "error": str(e)}), 200


@app.route("/api/departments", methods=["GET"])
def get_departments():
    """Returns all campus departments and subnet parameters."""
    return jsonify(list(DEPARTMENTS.values()))


@app.route("/api/topology", methods=["GET"])
def get_topology():
    """Returns React Flow nodes and edges generated from live Packet Tracer devices."""
    try:
        devices = pt.list_devices()
        links = pt.list_links()

        nodes = []
        for d in devices:
            kind = d.get("kind", "device")
            model = d.get("model", "")
            name = d.get("name", "")

            # Filter internal power devices
            if kind == "power_distribution_device":
                continue

            # Determine department affinity
            dept_id = None
            if "CS" in name:
                dept_id = "dept-cs"
            elif "LIB" in name:
                dept_id = "dept-lib"
            elif "ADMIN" in name:
                dept_id = "dept-admin"
            elif "SERVER" in name or "DNS" in name:
                dept_id = "dept-dc"

            # Determine React Flow custom node type
            flow_type = "hostNode"
            if kind == "router":
                flow_type = "routerNode"
            elif kind == "switch":
                flow_type = "switchNode"
            elif kind == "server":
                flow_type = "serverNode"

            nodes.append(
                {
                    "id": name,
                    "type": flow_type,
                    "position": {
                        "x": d.get("x", 400.0) - 200,
                        "y": d.get("y", 300.0) - 100,
                    },
                    "data": {
                        "label": name,
                        "kind": kind,
                        "model": model,
                        "department": dept_id,
                        "status": "online",
                    },
                }
            )

        edges = []
        for idx, link in enumerate(links):
            dev_a = link.get("a", {}).get("device", "")
            port_a = link.get("a", {}).get("port", "")
            dev_b = link.get("b", {}).get("device", "")
            port_b = link.get("b", {}).get("port", "")

            edges.append(
                {
                    "id": f"link-{idx}-{dev_a}-{dev_b}",
                    "source": dev_a,
                    "target": dev_b,
                    "label": f"{port_a} ↔ {port_b}",
                    "animated": True,
                    "style": {"stroke": "#64748b", "strokeWidth": 2},
                }
            )

        return jsonify({"nodes": nodes, "edges": edges})
    except Exception as e:
        logger.error(f"Topology error: {e}")
        return jsonify({"nodes": [], "edges": [], "error": str(e)}), 500


@app.route("/api/devices", methods=["GET"])
def get_devices():
    """Returns detailed devices list."""
    try:
        devices = pt.list_devices()
        filtered = [
            d for d in devices if d.get("kind") != "power_distribution_device"
        ]
        return jsonify(filtered)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/devices/add", methods=["POST"])
def add_device():
    """
    Creates a new PC, connects it to the department switch,
    and configures its IP live in Packet Tracer.
    """
    data = request.json or {}
    name = data.get("name")
    dept_id = data.get("departmentId", "dept-cs")
    alloc_type = data.get("allocationType", "DHCP")
    static_ip = data.get("ipAddress")

    if not name:
        return jsonify({"error": "Device name is required"}), 400

    dept = DEPARTMENTS.get(dept_id)
    if not dept:
        return jsonify({"error": "Invalid department ID"}), 400

    switch_name = dept["switch"]
    gateway = dept["gateway"]
    is_dhcp = alloc_type == "DHCP"

    # Default IP if DHCP
    ip = static_ip if not is_dhcp else None

    # Calculate coordinates near the department switch
    base_x = 450.0
    base_y = 450.0
    if dept_id == "dept-cs":
        base_x, base_y = 380.0, 420.0
    elif dept_id == "dept-lib":
        base_x, base_y = 450.0, 580.0
    elif dept_id == "dept-admin":
        base_x, base_y = 880.0, 420.0
    elif dept_id == "dept-dc":
        base_x, base_y = 800.0, 580.0

    try:
        res = pt.add_workstation(
            name=name,
            department_switch=switch_name,
            ip=ip,
            subnet_mask="255.255.255.0",
            gateway=gateway,
            is_dhcp=is_dhcp,
            x=base_x,
            y=base_y,
        )
        log_event(
            "DEVICE",
            f"Added workstation '{name}' to {dept['name']} (VLAN {dept['vlan']})",
        )
        return jsonify({"success": True, "device": res})
    except Exception as e:
        logger.error(f"Error adding device: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/devices/<name>", methods=["DELETE"])
def delete_device(name: str):
    """Deletes a device from Packet Tracer."""
    try:
        pt.remove_device(name)
        log_event("DEVICE", f"Removed device '{name}' from canvas.")
        return jsonify({"success": True, "name": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/simulate/ping", methods=["POST"])
def simulate_ping():
    """Executes a live ping from a PC inside Packet Tracer."""
    data = request.json or {}
    source = data.get("source")
    target = data.get("target")

    if not source or not target:
        return jsonify({"error": "source and target are required"}), 400

    try:
        result = pt.run_ping(source, target)
        log_event(
            "PING",
            f"Ping test from '{source}' to '{target}' - Result: {'SUCCESS' if result['success'] else 'FAILED'}",
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/acl/rules", methods=["GET"])
def get_acl_rules():
    """Returns currently modeled ACL rules."""
    return jsonify(ACL_RULES)


@app.route("/api/acl/apply", methods=["POST"])
def apply_acl_rule():
    """Pushes a new ACL rule directly into the Campus-Core-Router CLI."""
    data = request.json or {}
    action = data.get("action", "deny").lower()  # permit / deny
    source_subnet = data.get("sourceSubnet", "192.168.10.0 0.0.0.255")
    dest_subnet = data.get("destSubnet", "192.168.30.0 0.0.0.255")
    rule_name = data.get(
        "name", f"Rule-{action.upper()} {source_subnet} -> {dest_subnet}"
    )

    cmd_block = (
        f"configure terminal\n"
        f"access-list 150 {action} ip {source_subnet} {dest_subnet}\n"
        f"interface GigabitEthernet0/0\n"
        f"ip access-group 150 in\n"
        f"end\n"
    )

    try:
        output = pt.run_cli("Campus-Core-Router", cmd_block)
        rule_obj = {
            "id": f"acl-{len(ACL_RULES) + 1}",
            "number": 150,
            "name": rule_name,
            "action": action,
            "protocol": "ip",
            "source": source_subnet,
            "destination": dest_subnet,
            "enabled": True,
        }
        ACL_RULES.append(rule_obj)
        log_event(
            "ACL", f"Applied ACL rule '{rule_name}' to Campus-Core-Router."
        )
        return jsonify({"success": True, "output": output, "rule": rule_obj})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/events", methods=["GET"])
def get_events():
    """Returns recent network event log."""
    return jsonify(EVENT_LOGS)


# -----------------------------------------------------------------------------
# Main Runner
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting CampusNet Local API Server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
