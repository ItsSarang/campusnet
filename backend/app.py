import os
import sys
import re
import datetime
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pt_client import PacketTracerClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campusnet_app")

app = Flask(__name__)
CORS(app)

pt = PacketTracerClient()
pt.start()

DEPARTMENTS = {
    "dept-cs": {
        "id": "dept-cs",
        "name": "Department of Computer Science",
        "block": "Academic Block A - Computer Science",
        "code": "CS",
        "vlan": 10,
        "subnet": "192.168.10.0/24",
        "gateway": "192.168.10.1",
        "switch": "SW-CS",
        "color": "#3b82f6",
    },
    "dept-lib": {
        "id": "dept-lib",
        "name": "University Library",
        "block": "Academic Block B - Central Library",
        "code": "LIB",
        "vlan": 20,
        "subnet": "192.168.20.0/24",
        "gateway": "192.168.20.1",
        "switch": "SW-LIB",
        "color": "#10b981",
    },
    "dept-admin": {
        "id": "dept-admin",
        "name": "Campus Administration",
        "block": "Academic Block C - Administration",
        "code": "ADMIN",
        "vlan": 30,
        "subnet": "192.168.30.0/24",
        "gateway": "192.168.30.1",
        "switch": "SW-ADMIN",
        "color": "#f59e0b",
    },
    "dept-dc": {
        "id": "dept-dc",
        "name": "Campus Data Center",
        "block": "Campus Data Center - Server Facility",
        "code": "DC",
        "vlan": 100,
        "subnet": "192.168.100.0/24",
        "gateway": "192.168.100.1",
        "switch": "SW-SERVERS",
        "color": "#8b5cf6",
    },
}

BUILDINGS = [
    {
        "id": "block-cs",
        "name": "Academic Block A - Computer Science",
        "departmentId": "dept-cs",
        "vlan": 10,
        "subnet": "192.168.10.0/24",
        "color": "#3b82f6",
        "x": 40,
        "y": 80,
        "width": 380,
        "height": 400,
    },
    {
        "id": "block-lib",
        "name": "Academic Block B - Central Library",
        "departmentId": "dept-lib",
        "vlan": 20,
        "subnet": "192.168.20.0/24",
        "color": "#10b981",
        "x": 40,
        "y": 520,
        "width": 380,
        "height": 400,
    },
    {
        "id": "block-admin",
        "name": "Academic Block C - Administration",
        "departmentId": "dept-admin",
        "vlan": 30,
        "subnet": "192.168.30.0/24",
        "color": "#f59e0b",
        "x": 960,
        "y": 80,
        "width": 380,
        "height": 400,
    },
    {
        "id": "block-dc",
        "name": "Campus Data Center - Server Facility",
        "departmentId": "dept-dc",
        "vlan": 100,
        "subnet": "192.168.100.0/24",
        "color": "#8b5cf6",
        "x": 960,
        "y": 520,
        "width": 380,
        "height": 400,
    },
    {
        "id": "block-core",
        "name": "Campus Core Distribution Hub",
        "departmentId": "core",
        "vlan": 1,
        "subnet": "802.1Q Backbone",
        "color": "#6366f1",
        "x": 460,
        "y": 120,
        "width": 460,
        "height": 460,
    },
]

CUT_DEPARTMENTS = set()

EVENT_LOGS = [
    {
        "id": 1,
        "timestamp": "12:00:00",
        "type": "SYSTEM",
        "message": "Campus backbone initialized with Cisco Packet Tracer.",
    }
]

ROUTING_HISTORY = [
    {
        "id": 1,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "event": "Initial Routing Table Synced",
        "detail": "Baseline Inter-VLAN sub-interfaces active on Campus-Core-Router",
        "route_count": 8,
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


def parse_routing_table(raw_output: str):
    routes = []
    for line in raw_output.splitlines():
        line = line.strip()
        m_def = re.match(
            r"^(S\*?)\s+([0-9\./]+)\s+\[[0-9/]+\]\s+via\s+(.+)$", line
        )
        if m_def:
            code, prefix, next_hop = m_def.groups()
            routes.append(
                {
                    "code": "S*",
                    "type": "Default Gateway (Internet)",
                    "prefix": prefix,
                    "target": next_hop,
                    "status": "Active",
                }
            )
            continue
        m_conn = re.match(
            r"^([A-Z*]+)\s+([0-9\./]+)\s+is directly connected,\s+(.+)$", line
        )
        if m_conn:
            code, prefix, iface = m_conn.groups()
            route_type = (
                "Directly Connected"
                if code == "C"
                else "Local Interface"
                if code == "L"
                else "Static"
            )
            routes.append(
                {
                    "code": code,
                    "type": route_type,
                    "prefix": prefix,
                    "target": iface,
                    "status": "Active",
                }
            )
            continue
        m_via = re.match(
            r"^([A-Z*]+)\s+([0-9\./]+)\s+\[[0-9/]+\]\s+via\s+(.+)$", line
        )
        if m_via:
            code, prefix, next_hop = m_via.groups()
            routes.append(
                {
                    "code": code,
                    "type": "Static Route" if "S" in code else "Dynamic (OSPF)",
                    "prefix": prefix,
                    "target": next_hop,
                    "status": "Active",
                }
            )
    return routes


@app.route("/api/status", methods=["GET"])
def get_status():
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
                "cutDepartments": list(CUT_DEPARTMENTS),
            }
        )
    except Exception as e:
        logger.error(f"Status error: {e}")
        return jsonify({"connected": False, "error": str(e)}), 200


@app.route("/api/departments", methods=["GET"])
def get_departments():
    return jsonify(list(DEPARTMENTS.values()))


@app.route("/api/topology", methods=["GET"])
def get_topology():
    try:
        devices = pt.list_devices()
        links = pt.list_links()

        dept_devices = {
            "dept-cs": [],
            "dept-lib": [],
            "dept-admin": [],
            "dept-dc": [],
        }

        non_pcs = []
        for d in devices:
            kind = d.get("kind", "device")
            name = d.get("name", "")
            if kind == "power_distribution_device":
                continue

            if kind in ("pc", "host") or d.get("model") == "PC-PT":
                if "CS" in name or name.startswith("CS-") or name == "PC2":
                    dept_devices["dept-cs"].append(d)
                elif "LIB" in name or name.startswith("LIB-"):
                    dept_devices["dept-lib"].append(d)
                elif "ADMIN" in name or name.startswith("ADMIN-"):
                    dept_devices["dept-admin"].append(d)
                else:
                    dept_devices["dept-cs"].append(d)
            elif kind == "server" or d.get("model") == "Server-PT":
                dept_devices["dept-dc"].append(d)
            else:
                non_pcs.append(d)

        height_cs = max(290, 190 + ((len(dept_devices["dept-cs"]) + 1) // 2) * 85)
        height_lib = max(290, 190 + ((len(dept_devices["dept-lib"]) + 1) // 2) * 85)
        height_admin = max(290, 190 + ((len(dept_devices["dept-admin"]) + 1) // 2) * 85)
        height_dc = max(290, 190 + ((len(dept_devices["dept-dc"]) + 1) // 2) * 85)

        cs_block_y = 60
        lib_block_y = cs_block_y + height_cs + 40

        admin_block_y = 60
        dc_block_y = admin_block_y + height_admin + 40

        buildings = [
            {
                "id": "block-isp",
                "name": "External Internet Gateway (Outside Campus)",
                "departmentId": "isp",
                "vlan": 0,
                "subnet": "203.0.113.0/30",
                "color": "#64748b",
                "x": 480,
                "y": -60,
                "width": 380,
                "height": 180,
            },
            {
                "id": "block-core",
                "name": "Campus Core Distribution Hub",
                "departmentId": "core",
                "vlan": 1,
                "subnet": "802.1Q Backbone",
                "color": "#6366f1",
                "x": 480,
                "y": 160,
                "width": 380,
                "height": 330,
            },
            {
                "id": "block-cs",
                "name": "Academic Block A - Computer Science",
                "departmentId": "dept-cs",
                "vlan": 10,
                "subnet": "192.168.10.0/24",
                "color": "#3b82f6",
                "x": 50,
                "y": cs_block_y,
                "width": 380,
                "height": height_cs,
            },
            {
                "id": "block-lib",
                "name": "Academic Block B - Central Library",
                "departmentId": "dept-lib",
                "vlan": 20,
                "subnet": "192.168.20.0/24",
                "color": "#10b981",
                "x": 50,
                "y": lib_block_y,
                "width": 380,
                "height": height_lib,
            },
            {
                "id": "block-admin",
                "name": "Academic Block C - Administration",
                "departmentId": "dept-admin",
                "vlan": 30,
                "subnet": "192.168.30.0/24",
                "color": "#f59e0b",
                "x": 910,
                "y": admin_block_y,
                "width": 380,
                "height": height_admin,
            },
            {
                "id": "block-dc",
                "name": "Campus Data Center - Server Facility",
                "departmentId": "dept-dc",
                "vlan": 100,
                "subnet": "192.168.100.0/24",
                "color": "#8b5cf6",
                "x": 910,
                "y": dc_block_y,
                "width": 380,
                "height": height_dc,
            },
        ]

        nodes = []

        for d in non_pcs:
            kind = d.get("kind", "device")
            model = d.get("model", "")
            name = d.get("name", "")

            dept_id = None
            if "CS" in name:
                dept_id = "dept-cs"
            elif "LIB" in name:
                dept_id = "dept-lib"
            elif "ADMIN" in name:
                dept_id = "dept-admin"
            elif "SERVER" in name or "DNS" in name:
                dept_id = "dept-dc"

            flow_type = "hostNode"
            if kind == "router":
                flow_type = "routerNode"
            elif kind == "switch":
                flow_type = "switchNode"
            elif kind == "server":
                flow_type = "serverNode"

            if name == "ISP-Edge-Router":
                pos = {"x": 640, "y": 0}
            elif name == "Campus-Core-Router":
                pos = {"x": 640, "y": 235}
            elif name == "Core-Dist-SW":
                pos = {"x": 640, "y": 365}
            elif name == "SW-CS":
                pos = {"x": 210, "y": cs_block_y + 75}
            elif name == "SW-LIB":
                pos = {"x": 210, "y": lib_block_y + 75}
            elif name == "SW-ADMIN":
                pos = {"x": 1070, "y": admin_block_y + 75}
            elif name == "SW-SERVERS":
                pos = {"x": 1070, "y": dc_block_y + 75}
            else:
                pos = {"x": d.get("x", 400.0) - 200, "y": d.get("y", 300.0) - 100}

            dept = DEPARTMENTS.get(dept_id)
            if name == "ISP-Edge-Router":
                ip_addr = "203.0.113.2 / 8.8.8.8"
                ip_mode = "Public WAN IP"
            elif name == "Campus-Core-Router":
                ip_addr = "192.168.10.1 / 20.1 / 30.1 / 100.1 / 203.0.113.1"
                ip_mode = "Layer 3 SVI & WAN Gateway"
            elif kind == "switch":
                ip_addr = "Layer 2 Transparent"
                ip_mode = "802.1Q Trunk / Access"
            else:
                ip_addr = "192.168.x.x"
                ip_mode = "Infrastructure"

            block_name = (
                "External Internet Gateway"
                if name == "ISP-Edge-Router"
                else dept["block"]
                if dept
                else "Campus Core Distribution Hub"
            )

            nodes.append(
                {
                    "id": name,
                    "type": flow_type,
                    "position": pos,
                    "draggable": False,
                    "data": {
                        "label": name,
                        "kind": kind,
                        "model": model,
                        "department": dept_id,
                        "departmentName": dept["name"] if dept else ("External ISP Gateway" if name == "ISP-Edge-Router" else "Campus Core Backbone"),
                        "block": block_name,
                        "ip": ip_addr,
                        "ipMode": ip_mode,
                        "vlan": dept["vlan"] if dept else ("WAN" if name == "ISP-Edge-Router" else "10, 20, 30, 100" if kind == "router" else 1),
                        "gateway": dept["gateway"] if dept else ("203.0.113.1" if name == "ISP-Edge-Router" else "192.168.10.1"),
                        "subnet": dept["subnet"] if dept else ("203.0.113.0/30" if name == "ISP-Edge-Router" else "802.1Q Backbone"),
                        "status": "online",
                    },
                }
            )

        dept_layout_info = {
            "dept-cs": (50, cs_block_y, DEPARTMENTS["dept-cs"]),
            "dept-lib": (50, lib_block_y, DEPARTMENTS["dept-lib"]),
            "dept-admin": (910, admin_block_y, DEPARTMENTS["dept-admin"]),
            "dept-dc": (910, dc_block_y, DEPARTMENTS["dept-dc"]),
        }

        for dept_id, d_list in dept_devices.items():
            base_x, base_y, dept = dept_layout_info[dept_id]
            for idx, d in enumerate(d_list):
                name = d.get("name", "")
                kind = d.get("kind", "host")
                model = d.get("model", "PC-PT")
                flow_type = "serverNode" if kind == "server" or model == "Server-PT" else "hostNode"

                if name == "Campus-DNS-Server":
                    pos_x = base_x + 160
                    pos_y = base_y + 185
                    ip_addr = "192.168.100.10"
                    ip_mode = "Static"
                else:
                    pos_x = base_x + 80 + (idx % 2) * 160
                    pos_y = base_y + 185 + (idx // 2) * 85
                    ip_addr = f"192.168.{dept['vlan']}.5{idx + 1}"
                    ip_mode = "DHCP Dynamic Pool"

                nodes.append(
                    {
                        "id": name,
                        "type": flow_type,
                        "position": {"x": pos_x, "y": pos_y},
                        "draggable": False,
                        "data": {
                            "label": name,
                            "kind": kind,
                            "model": model,
                            "department": dept_id,
                            "departmentName": dept["name"],
                            "block": dept["block"],
                            "ip": ip_addr,
                            "ipMode": ip_mode,
                            "vlan": dept["vlan"],
                            "gateway": dept["gateway"],
                            "subnet": dept["subnet"],
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

            link_dept = None
            for dept_key, dept_val in DEPARTMENTS.items():
                if dept_val["switch"] in (dev_a, dev_b):
                    link_dept = dept_key
                    break

            is_cut = link_dept in CUT_DEPARTMENTS

            edge_style = (
                {"stroke": "#ef4444", "strokeWidth": 3, "strokeDasharray": "6,6"}
                if is_cut
                else {"stroke": "#827666", "strokeWidth": 2}
            )

            label_text = "[LINK SEVERED]" if is_cut else None

            edges.append(
                {
                    "id": f"link-{idx}-{dev_a}-{dev_b}",
                    "source": dev_a,
                    "target": dev_b,
                    "label": label_text,
                    "animated": not is_cut,
                    "isCut": is_cut,
                    "departmentId": link_dept,
                    "portA": port_a,
                    "portB": port_b,
                    "style": edge_style,
                }
            )

        return jsonify(
            {
                "nodes": nodes,
                "edges": edges,
                "buildings": buildings,
                "cutDepartments": list(CUT_DEPARTMENTS),
            }
        )
    except Exception as e:
        logger.error(f"Topology error: {e}")
        return jsonify({"nodes": [], "edges": [], "buildings": [], "error": str(e)}), 500


@app.route("/api/topology/link/toggle", methods=["POST"])
def toggle_link():
    data = request.json or {}
    dept_id = data.get("departmentId")
    action = data.get("action", "toggle")

    dept = DEPARTMENTS.get(dept_id)
    if not dept:
        return jsonify({"error": "Invalid department ID"}), 400

    sub_iface = f"GigabitEthernet0/0.{dept['vlan']}"

    if action == "toggle":
        action = "restore" if dept_id in CUT_DEPARTMENTS else "cut"

    if action == "cut":
        cmd = f"configure terminal\ninterface {sub_iface}\nshutdown\nend\n"
        pt.run_cli("Campus-Core-Router", cmd)
        CUT_DEPARTMENTS.add(dept_id)
        log_event(
            "OUTAGE",
            f"Physical uplink severed for {dept['name']}. Subnet {dept['subnet']} unreachable.",
        )
    else:
        cmd = f"configure terminal\ninterface {sub_iface}\nno shutdown\nend\n"
        pt.run_cli("Campus-Core-Router", cmd)
        CUT_DEPARTMENTS.discard(dept_id)
        log_event(
            "RESTORED",
            f"Link restored for {dept['name']}. Subnet {dept['subnet']} reconnected.",
        )

    try:
        pt.call_tool("fast_forward")
    except Exception:
        pass

    raw_routes = pt.run_cli("Campus-Core-Router", "show ip route\n")
    routes = parse_routing_table(raw_routes)

    event_text = (
        f"Route Dropped: {dept['subnet']}"
        if action == "cut"
        else f"Route Restored: {dept['subnet']}"
    )
    detail_text = (
        f"{dept['name']} interface {sub_iface} shut down (Cable Cut)."
        if action == "cut"
        else f"{dept['name']} interface {sub_iface} restored (Cable Repaired)."
    )

    ROUTING_HISTORY.insert(
        0,
        {
            "id": len(ROUTING_HISTORY) + 1,
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "event": event_text,
            "detail": detail_text,
            "route_count": len(routes),
        },
    )

    return jsonify(
        {
            "success": True,
            "departmentId": dept_id,
            "action": action,
            "isCut": dept_id in CUT_DEPARTMENTS,
            "routes": routes,
            "history": ROUTING_HISTORY,
        }
    )


@app.route("/api/router/routes", methods=["GET"])
def get_router_routes():
    try:
        raw_routes = pt.run_cli("Campus-Core-Router", "show ip route\n")
        routes = parse_routing_table(raw_routes)
        return jsonify(
            {
                "routes": routes,
                "raw": raw_routes,
                "history": ROUTING_HISTORY,
                "cutDepartments": list(CUT_DEPARTMENTS),
            }
        )
    except Exception as e:
        logger.error(f"Routing table error: {e}")
        return jsonify(
            {
                "routes": [],
                "raw": "",
                "history": ROUTING_HISTORY,
                "cutDepartments": list(CUT_DEPARTMENTS),
                "error": str(e),
            }
        ), 200


@app.route("/api/devices", methods=["GET"])
def get_devices():
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
    ip = static_ip if not is_dhcp else None

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
    try:
        pt.remove_device(name)
        log_event("DEVICE", f"Removed device '{name}' from canvas.")
        return jsonify({"success": True, "name": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/simulate/ping", methods=["POST"])
def simulate_ping():
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
    return jsonify(ACL_RULES)


@app.route("/api/acl/apply", methods=["POST"])
def apply_acl_rule():
    data = request.json or {}
    action = data.get("action", "deny").lower()
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
    return jsonify(EVENT_LOGS)


if __name__ == "__main__":
    logger.info("Starting CampusNet Local API Server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
