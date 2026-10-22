import os
import sys
import re
import datetime
import logging
from collections import deque
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


def calculate_subnet_for_capacity(vlan: int, max_hosts: int):
    needed = max_hosts + 3
    h = 3
    while (1 << h) < needed and h < 8:
        h += 1
    prefix = 32 - h
    host_count = (1 << h) - 2
    mask_bytes = [(0xFF << (8 - min(8, max(0, prefix - i * 8)))) & 0xFF for i in range(4)]
    mask_str = ".".join(str(b) for b in mask_bytes)
    subnet_cidr = f"192.168.{vlan}.0/{prefix}"
    return {
        "cidr": subnet_cidr,
        "prefix": prefix,
        "mask": mask_str,
        "totalUsable": host_count,
    }


def count_devices_per_department():
    counts = {
        "dept-cs": 0,
        "dept-lib": 0,
        "dept-admin": 0,
        "dept-dc": 0,
    }
    try:
        devices = pt.list_devices()
        for d in devices:
            kind = d.get("kind", "device")
            name = d.get("name", "")
            if kind == "power_distribution_device":
                continue
            if kind in ("pc", "host") or d.get("model") == "PC-PT":
                if "CS" in name or name.startswith("CS-") or name == "PC2":
                    counts["dept-cs"] += 1
                elif "LIB" in name or name.startswith("LIB-"):
                    counts["dept-lib"] += 1
                elif "ADMIN" in name or name.startswith("ADMIN-"):
                    counts["dept-admin"] += 1
                else:
                    counts["dept-cs"] += 1
            elif kind == "server" or d.get("model") == "Server-PT":
                if "ADMIN" in name or name.startswith("Admin-"):
                    counts["dept-admin"] += 1
                else:
                    counts["dept-dc"] += 1
    except Exception:
        pass
    return counts


DEPARTMENTS = {
    "dept-cs": {
        "id": "dept-cs",
        "name": "Department of Computer Science",
        "block": "Academic Block A - Computer Science",
        "code": "CS",
        "vlan": 10,
        "subnet": "192.168.10.0/27",
        "mask": "255.255.255.224",
        "maxHosts": 30,
        "currentHosts": 2,
        "totalUsable": 30,
        "gateway": "192.168.10.1",
        "router": "Router-CS",
        "switch": "SW-CS",
        "core_sw_port": "FastEthernet0/3",
        "color": "#3b82f6",
    },
    "dept-lib": {
        "id": "dept-lib",
        "name": "University Library",
        "block": "Academic Block B - Central Library",
        "code": "LIB",
        "vlan": 20,
        "subnet": "192.168.20.0/27",
        "mask": "255.255.255.224",
        "maxHosts": 20,
        "currentHosts": 1,
        "totalUsable": 30,
        "gateway": "192.168.20.1",
        "router": "Router-LIB",
        "switch": "SW-LIB",
        "core_sw_port": "FastEthernet0/2",
        "color": "#10b981",
    },
    "dept-admin": {
        "id": "dept-admin",
        "name": "Campus Administration",
        "block": "Academic Block C - Administration",
        "code": "ADMIN",
        "vlan": 30,
        "subnet": "192.168.30.0/28",
        "mask": "255.255.255.240",
        "maxHosts": 14,
        "currentHosts": 0,
        "totalUsable": 14,
        "gateway": "192.168.30.1",
        "router": "Router-ADMIN",
        "switch": "SW-ADMIN",
        "core_sw_port": "FastEthernet0/5",
        "color": "#f59e0b",
    },
    "dept-dc": {
        "id": "dept-dc",
        "name": "Campus Data Center",
        "block": "Campus Data Center - Server Facility",
        "code": "DC",
        "vlan": 100,
        "subnet": "192.168.100.0/28",
        "mask": "255.255.255.240",
        "maxHosts": 10,
        "currentHosts": 2,
        "totalUsable": 14,
        "gateway": "192.168.100.1",
        "router": "Router-DC",
        "switch": "SW-SERVERS",
        "core_sw_port": "FastEthernet0/4",
        "color": "#8b5cf6",
    },
}

ROUTER_CONFIGS = [
    {
        "name": "Router-CS",
        "department": "dept-cs",
        "role": "Academic Block A Gateway",
        "ip": "192.168.10.1",
        "subnet": "192.168.10.0/24",
    },
    {
        "name": "Router-LIB",
        "department": "dept-lib",
        "role": "Academic Block B Gateway",
        "ip": "192.168.20.1",
        "subnet": "192.168.20.0/24",
    },
    {
        "name": "Router-ADMIN",
        "department": "dept-admin",
        "role": "Academic Block C Gateway",
        "ip": "192.168.30.1",
        "subnet": "192.168.30.0/24",
    },
    {
        "name": "Router-DC",
        "department": "dept-dc",
        "role": "Campus Data Center Gateway",
        "ip": "192.168.100.1",
        "subnet": "192.168.100.0/24",
    },
    {
        "name": "Campus-Core-Router",
        "department": "core",
        "role": "Campus Core Distribution Hub",
        "ip": "10.0.0.1",
        "subnet": "10.0.0.0/24",
    },
    {
        "name": "ISP-Edge-Router",
        "department": "isp",
        "role": "External Internet Gateway (WAN)",
        "ip": "203.0.113.2 / 8.8.8.8",
        "subnet": "203.0.113.0/30",
    },
]

ROUTER_GRAPH_EDGES = [
    ("Router-CS", "Campus-Core-Router", "link-Router-CS-Core-Dist-SW"),
    ("Router-LIB", "Campus-Core-Router", "link-Router-LIB-Core-Dist-SW"),
    ("Router-ADMIN", "Campus-Core-Router", "link-Router-ADMIN-Core-Dist-SW"),
    ("Router-DC", "Campus-Core-Router", "link-Router-DC-Core-Dist-SW"),
    ("Router-CS", "Router-LIB", "link-Router-CS-Router-LIB"),
    ("Router-ADMIN", "Router-DC", "link-Router-ADMIN-Router-DC"),
    ("Campus-Core-Router", "ISP-Edge-Router", "link-Campus-Core-Router-ISP-Edge-Router"),
]

CUT_EDGES = set()
CUT_DEPARTMENTS = set()

def compute_router_tables(cut_edges=None):
    if cut_edges is None:
        cut_edges = CUT_EDGES
    else:
        cut_edges = set(cut_edges)

    router_names = [rc["name"] for rc in ROUTER_CONFIGS]
    inf = 16

    cost = {u: {v: inf for v in router_names} for u in router_names}
    for u in router_names:
        cost[u][u] = 0
    for u, v, edge_id in ROUTER_GRAPH_EDGES:
        is_cut = (
            edge_id in cut_edges
            or edge_id.replace("-Core-Dist-SW", "-Campus-Core-Router") in cut_edges
            or ("Campus-Core-Router" in (u, v) and "link-Campus-Core-Router-Core-Dist-SW" in cut_edges)
        )
        if not is_cut:
            cost[u][v] = 1
            cost[v][u] = 1

    dist_vector = {u: {v: inf for v in router_names} for u in router_names}
    next_hop = {u: {v: "None" for v in router_names} for u in router_names}

    for u in router_names:
        dist_vector[u][u] = 0
        next_hop[u][u] = "Direct"
        for v in router_names:
            if u != v and cost[u][v] < inf:
                dist_vector[u][v] = cost[u][v]
                next_hop[u][v] = v

    for _ in range(len(router_names) - 1):
        updated = False
        for u in router_names:
            for v in router_names:
                if u == v:
                    continue
                for nbr in router_names:
                    if cost[u][nbr] < inf and dist_vector[nbr][v] < inf:
                        new_cost = cost[u][nbr] + dist_vector[nbr][v]
                        if new_cost < dist_vector[u][v]:
                            dist_vector[u][v] = new_cost
                            next_hop[u][v] = nbr
                            updated = True
        if not updated:
            break

    result_tables = []
    for rc in ROUTER_CONFIGS:
        src = rc["name"]
        routes = []
        for dst_rc in ROUTER_CONFIGS:
            dst = dst_rc["name"]
            d = dist_vector[src][dst]
            routes.append(
                {
                    "destination": dst,
                    "distance": d if d < inf else "Unreachable",
                    "nextHop": next_hop[src][dst] if d < inf else "None",
                }
            )

        result_tables.append(
            {
                "router": src,
                "department": rc["department"],
                "role": rc["role"],
                "ip": rc["ip"],
                "subnet": rc["subnet"],
                "routes": routes,
                "algorithm": "Bellman-Ford Distance Vector Routing",
            }
        )

    return result_tables


def compute_building_reachability(cut_edges=None, cut_departments=None):
    if cut_edges is None:
        cut_edges = CUT_EDGES
    else:
        cut_edges = set(cut_edges)
    if cut_departments is None:
        cut_departments = CUT_DEPARTMENTS
    else:
        cut_departments = set(cut_departments)

    router_tables = compute_router_tables(cut_edges)
    tables_by_router = {t["router"]: t for t in router_tables}
    is_wan_cut = "link-Campus-Core-Router-ISP-Edge-Router" in cut_edges

    reachability = {}
    for dept_id, dept in DEPARTMENTS.items():
        r_name = dept["router"]
        transit_edge = f"link-{r_name}-Core-Dist-SW"
        trunk_edge = f"link-{r_name}-{dept['switch']}"

        is_transit_cut = (
            transit_edge in cut_edges
            or f"link-{r_name}-Campus-Core-Router" in cut_edges
            or dept_id in cut_departments
            or "link-Campus-Core-Router-Core-Dist-SW" in cut_edges
        )
        is_trunk_cut = trunk_edge in cut_edges

        tbl = tables_by_router.get(r_name, {})
        route_to_isp = next(
            (r for r in tbl.get("routes", []) if r["destination"] == "ISP-Edge-Router"),
            None,
        )
        can_reach_isp = (
            route_to_isp is not None
            and route_to_isp.get("distance") != "Unreachable"
            and not is_trunk_cut
        )

        if not can_reach_isp:
            reason = (
                "Gateway trunk severed"
                if is_trunk_cut
                else "Campus WAN gateway severed"
                if is_wan_cut
                else "All routes to external gateway severed"
            )
            reachability[dept_id] = {
                "name": dept["name"],
                "status": "offline",
                "isOffline": True,
                "isRerouted": False,
                "nextHop": "None",
                "reason": reason,
            }
        elif is_transit_cut:
            reachability[dept_id] = {
                "name": dept["name"],
                "status": "rerouted",
                "isOffline": False,
                "isRerouted": True,
                "nextHop": route_to_isp.get("nextHop", "Neighbor"),
                "reason": f"Direct link severed, failover routed via {route_to_isp.get('nextHop')}",
            }
        else:
            reachability[dept_id] = {
                "name": dept["name"],
                "status": "normal",
                "isOffline": False,
                "isRerouted": False,
                "nextHop": "Direct",
                "reason": "Direct uplink healthy",
            }

    reachability["core"] = {
        "name": "Campus Core Distribution Hub",
        "status": "offline" if is_wan_cut else "normal",
        "isOffline": is_wan_cut,
        "isRerouted": False,
        "nextHop": "ISP" if not is_wan_cut else "None",
        "reason": "Campus WAN gateway severed" if is_wan_cut else "Direct WAN link healthy",
    }
    return reachability

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

COMMUNICATION_MATRIX = {
    "dept-cs": {
        "dept-cs": "local",
        "dept-lib": "allow",
        "dept-admin": "deny",
        "dept-dc": "allow",
    },
    "dept-lib": {
        "dept-cs": "allow",
        "dept-lib": "local",
        "dept-admin": "deny",
        "dept-dc": "allow",
    },
    "dept-admin": {
        "dept-cs": "allow",
        "dept-lib": "allow",
        "dept-admin": "local",
        "dept-dc": "allow",
    },
}

DEPARTMENT_SUBNETS = {
    "dept-cs": "192.168.10.0 0.0.0.255",
    "dept-lib": "192.168.20.0 0.0.0.255",
    "dept-admin": "192.168.30.0 0.0.0.255",
    "dept-dc": "192.168.100.0 0.0.0.255",
}


def compile_matrix_acl_script(matrix: dict):
    lines = [
        "enable",
        "configure terminal",
        "no ip access-list extended CAMPUS-FIREWALL",
        "ip access-list extended CAMPUS-FIREWALL",
        "remark Core Campus Department Firewall Matrix",
        "permit udp any host 192.168.100.10 eq 53",
        "permit udp any any eq bootps",
        "permit udp any any eq bootpc",
        "permit icmp any any echo-reply",
    ]
    compiled_rules = [
        {
            "id": "acl-dns",
            "number": 10,
            "name": "Permit Campus DNS Queries (UDP 53)",
            "action": "permit",
            "protocol": "udp",
            "source": "any",
            "destination": "192.168.100.10 eq 53",
            "enabled": True,
        },
        {
            "id": "acl-dhcp",
            "number": 20,
            "name": "Permit Dynamic DHCP Leases (UDP 67/68)",
            "action": "permit",
            "protocol": "udp",
            "source": "any",
            "destination": "any eq bootps",
            "enabled": True,
        },
    ]
    rule_num = 30
    for src_k, row in matrix.items():
        src_sub = DEPARTMENT_SUBNETS.get(src_k)
        src_name = DEPARTMENTS[src_k]["code"]
        for dst_k, verdict in row.items():
            if verdict == "deny":
                dst_sub = DEPARTMENT_SUBNETS.get(dst_k)
                dst_name = DEPARTMENTS[dst_k]["code"]
                lines.append(f"deny ip {src_sub} {dst_sub}")
                compiled_rules.append(
                    {
                        "id": f"acl-{rule_num}",
                        "number": rule_num,
                        "name": f"Firewall Rule: Block {src_name} to {dst_name}",
                        "action": "deny",
                        "protocol": "ip",
                        "source": src_sub,
                        "destination": dst_sub,
                        "enabled": True,
                    }
                )
                rule_num += 10
    lines.append("permit ip any any")
    compiled_rules.append(
        {
            "id": f"acl-{rule_num}",
            "number": rule_num,
            "name": "Default Permit Remaining Campus Inter-VLAN Traffic",
            "action": "permit",
            "protocol": "ip",
            "source": "any",
            "destination": "any",
            "enabled": True,
        }
    )
    lines.append("exit")
    lines.append("interface GigabitEthernet0/0")
    lines.append("ip access-group CAMPUS-FIREWALL in")
    lines.append("exit")
    lines.append("end")
    return "\n".join(lines), compiled_rules


_, ACL_RULES = compile_matrix_acl_script(COMMUNICATION_MATRIX)


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
    counts = count_devices_per_department()
    for dept_id, dept in DEPARTMENTS.items():
        curr = counts.get(dept_id, 0)
        dept["currentHosts"] = curr
        if dept.get("maxHosts", 0) < curr:
            dept["maxHosts"] = max(curr, 10)
        calc = calculate_subnet_for_capacity(dept["vlan"], dept["maxHosts"])
        dept["subnet"] = calc["cidr"]
        dept["mask"] = calc["mask"]
        dept["prefix"] = calc["prefix"]
        dept["totalUsable"] = calc["totalUsable"]
    return jsonify(list(DEPARTMENTS.values()))


@app.route("/api/departments/capacity", methods=["POST"])
def update_department_capacity():
    data = request.json or {}
    dept_id = data.get("departmentId")
    max_hosts = data.get("maxHosts")

    if not dept_id or dept_id not in DEPARTMENTS:
        return jsonify({"error": "Invalid departmentId"}), 400

    dept = DEPARTMENTS[dept_id]
    counts = count_devices_per_department()
    current_count = counts.get(dept_id, 0)
    dept["currentHosts"] = current_count

    try:
        max_hosts = int(max_hosts)
    except (ValueError, TypeError):
        return jsonify({"error": "maxHosts must be a valid integer"}), 400

    if max_hosts < current_count:
        return jsonify(
            {
                "error": f"Cannot reduce max PCs below current count of {current_count}!"
            }
        ), 400

    if max_hosts > 250:
        return jsonify(
            {
                "error": "Max capacity cannot exceed 250 PCs for a /24 campus block!"
            }
        ), 400

    calc = calculate_subnet_for_capacity(dept["vlan"], max_hosts)
    dept["maxHosts"] = max_hosts
    dept["subnet"] = calc["cidr"]
    dept["mask"] = calc["mask"]
    dept["prefix"] = calc["prefix"]
    dept["totalUsable"] = calc["totalUsable"]

    log_event(
        "CONFIG",
        f"Updated {dept['name']} capacity to {max_hosts} PCs. Recalculated subnet to {dept['subnet']} (Mask: {dept['mask']})",
    )

    return jsonify(
        {
            "success": True,
            "department": dept,
            "departments": list(DEPARTMENTS.values()),
        }
    )


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
                if "ADMIN" in name or name.startswith("Admin-"):
                    dept_devices["dept-admin"].append(d)
                else:
                    dept_devices["dept-dc"].append(d)
            else:
                non_pcs.append(d)

        height_cs = max(460, 345 + ((len(dept_devices["dept-cs"]) + 1) // 2) * 105 + 45)
        height_lib = max(460, 345 + ((len(dept_devices["dept-lib"]) + 1) // 2) * 105 + 45)
        height_admin = max(460, 345 + ((len(dept_devices["dept-admin"]) + 1) // 2) * 105 + 45)
        height_dc = max(460, 345 + ((len(dept_devices["dept-dc"]) + 1) // 2) * 105 + 45)

        cs_block_y = 60
        lib_block_y = cs_block_y + height_cs + 60

        admin_block_y = 60
        dc_block_y = admin_block_y + height_admin + 60

        buildings = [
            {
                "id": "block-isp",
                "name": "External Internet",
                "departmentId": "isp",
                "vlan": 0,
                "subnet": "203.0.113.0/30",
                "color": "#64748b",
                "x": 580,
                "y": -60,
                "width": 440,
                "height": 180,
            },
            {
                "id": "block-core",
                "name": "Campus Core",
                "departmentId": "core",
                "vlan": 1,
                "subnet": "10.0.0.0/24",
                "color": "#6366f1",
                "x": 580,
                "y": 180,
                "width": 440,
                "height": 330,
            },
            {
                "id": "block-cs",
                "name": "Computer Science",
                "departmentId": "dept-cs",
                "vlan": 10,
                "subnet": DEPARTMENTS["dept-cs"]["subnet"],
                "mask": DEPARTMENTS["dept-cs"]["mask"],
                "maxHosts": DEPARTMENTS["dept-cs"]["maxHosts"],
                "currentHosts": DEPARTMENTS["dept-cs"]["currentHosts"],
                "color": "#3b82f6",
                "x": 40,
                "y": cs_block_y,
                "width": 480,
                "height": height_cs,
            },
            {
                "id": "block-lib",
                "name": "Library",
                "departmentId": "dept-lib",
                "vlan": 20,
                "subnet": DEPARTMENTS["dept-lib"]["subnet"],
                "mask": DEPARTMENTS["dept-lib"]["mask"],
                "maxHosts": DEPARTMENTS["dept-lib"]["maxHosts"],
                "currentHosts": DEPARTMENTS["dept-lib"]["currentHosts"],
                "color": "#10b981",
                "x": 40,
                "y": lib_block_y,
                "width": 480,
                "height": height_lib,
            },
            {
                "id": "block-admin",
                "name": "Administration",
                "departmentId": "dept-admin",
                "vlan": 30,
                "subnet": DEPARTMENTS["dept-admin"]["subnet"],
                "mask": DEPARTMENTS["dept-admin"]["mask"],
                "maxHosts": DEPARTMENTS["dept-admin"]["maxHosts"],
                "currentHosts": DEPARTMENTS["dept-admin"]["currentHosts"],
                "color": "#f59e0b",
                "x": 1080,
                "y": admin_block_y,
                "width": 480,
                "height": height_admin,
            },
            {
                "id": "block-dc",
                "name": "Data Center",
                "departmentId": "dept-dc",
                "vlan": 100,
                "subnet": DEPARTMENTS["dept-dc"]["subnet"],
                "mask": DEPARTMENTS["dept-dc"]["mask"],
                "maxHosts": DEPARTMENTS["dept-dc"]["maxHosts"],
                "currentHosts": DEPARTMENTS["dept-dc"]["currentHosts"],
                "color": "#8b5cf6",
                "x": 1080,
                "y": dc_block_y,
                "width": 480,
                "height": height_dc,
            },
        ]

        reachability = compute_building_reachability(CUT_EDGES, CUT_DEPARTMENTS)
        for b in buildings:
            dept_id = b.get("departmentId")
            reach = reachability.get(dept_id, {})
            b["status"] = reach.get("status", "normal")
            b["isOffline"] = reach.get("isOffline", False)
            b["isRerouted"] = reach.get("isRerouted", False)
            b["nextHop"] = reach.get("nextHop", "Direct")
            b["reason"] = reach.get("reason", "")

        router_tables = compute_router_tables(CUT_EDGES)
        tables_by_router = {t["router"]: t for t in router_tables}
        is_wan_cut = "link-Campus-Core-Router-ISP-Edge-Router" in CUT_EDGES

        nodes = []

        nodes.append(
            {
                "id": "ISP-Edge-Router",
                "type": "routerNode",
                "position": {"x": 770, "y": 0},
                "draggable": False,
                "data": {
                    "label": "ISP-Edge-Router",
                    "kind": "router",
                    "model": "2911",
                    "department": None,
                    "departmentName": "External ISP Gateway",
                    "block": "External Internet Gateway",
                    "ip": "203.0.113.2 / 8.8.8.8",
                    "ipMode": "Public WAN IP",
                    "vlan": "WAN",
                    "gateway": "203.0.113.1",
                    "subnet": "203.0.113.0/30",
                    "status": "offline" if is_wan_cut else "online",
                },
            }
        )

        nodes.append(
            {
                "id": "Campus-Core-Router",
                "type": "routerNode",
                "position": {"x": 770, "y": 240},
                "draggable": False,
                "data": {
                    "label": "Campus-Core-Router",
                    "kind": "router",
                    "model": "2911",
                    "department": None,
                    "departmentName": "Campus Core Backbone",
                    "block": "Campus Core Distribution Hub",
                    "ip": "10.0.0.1",
                    "ipMode": "Campus Core Backbone Router",
                    "vlan": "1 (Backbone)",
                    "gateway": "203.0.113.1",
                    "subnet": "10.0.0.0/24",
                    "status": "online",
                },
            }
        )

        is_core_trunk_cut = "link-Campus-Core-Router-Core-Dist-SW" in CUT_EDGES
        nodes.append(
            {
                "id": "Core-Dist-SW",
                "type": "switchNode",
                "position": {"x": 770, "y": 380},
                "draggable": False,
                "data": {
                    "label": "Core-Dist-SW",
                    "kind": "switch",
                    "model": "2960-24TT",
                    "department": "core",
                    "departmentName": "Campus Core Distribution",
                    "block": "Campus Core Distribution Hub",
                    "ip": "Layer 2 Transparent",
                    "ipMode": "802.1Q Core Trunking",
                    "vlan": "1, 10, 20, 30, 100",
                    "gateway": "10.0.0.1",
                    "subnet": "10.0.0.0/24",
                    "status": "offline" if is_core_trunk_cut else "online",
                },
            }
        )

        dept_layout_info = {
            "dept-cs": (40, cs_block_y, DEPARTMENTS["dept-cs"]),
            "dept-lib": (40, lib_block_y, DEPARTMENTS["dept-lib"]),
            "dept-admin": (1080, admin_block_y, DEPARTMENTS["dept-admin"]),
            "dept-dc": (1080, dc_block_y, DEPARTMENTS["dept-dc"]),
        }

        dept_router_reach = {}
        dept_switch_reach = {}

        for dept_id, (base_x, base_y, dept) in dept_layout_info.items():
            r_name = dept["router"]
            r_tbl = tables_by_router.get(r_name, {})
            route_to_core = next(
                (r for r in r_tbl.get("routes", []) if r["destination"] == "Campus-Core-Router"),
                None,
            )
            r_connected = (
                route_to_core is not None
                and route_to_core.get("distance") != "Unreachable"
                and dept_id not in CUT_DEPARTMENTS
            )
            dept_router_reach[dept_id] = r_connected

            trunk_edge = f"link-{r_name}-{dept['switch']}"
            sw_connected = r_connected and (trunk_edge not in CUT_EDGES)
            dept_switch_reach[dept_id] = sw_connected

            nodes.append(
                {
                    "id": dept["router"],
                    "type": "routerNode",
                    "position": {"x": base_x + 210, "y": base_y + 65},
                    "draggable": False,
                    "data": {
                        "label": dept["router"],
                        "kind": "router",
                        "model": "2911",
                        "department": dept_id,
                        "departmentName": dept["name"],
                        "block": dept["block"],
                        "ip": dept["gateway"],
                        "ipMode": "Department Gateway Router",
                        "vlan": dept["vlan"],
                        "gateway": dept["gateway"],
                        "subnet": dept["subnet"],
                        "status": "online" if r_connected else "offline",
                    },
                }
            )

            nodes.append(
                {
                    "id": dept["switch"],
                    "type": "switchNode",
                    "position": {"x": base_x + 210, "y": base_y + 205},
                    "draggable": False,
                    "data": {
                        "label": dept["switch"],
                        "kind": "switch",
                        "model": "2960-24TT",
                        "department": dept_id,
                        "departmentName": dept["name"],
                        "block": dept["block"],
                        "ip": "Layer 2 Transparent",
                        "ipMode": "802.1Q Trunk / Access",
                        "vlan": dept["vlan"],
                        "gateway": dept["gateway"],
                        "subnet": dept["subnet"],
                        "status": "online" if sw_connected else "offline",
                    },
                }
            )

        for dept_id, d_list in dept_devices.items():
            base_x, base_y, dept = dept_layout_info[dept_id]
            sw_connected = dept_switch_reach.get(dept_id, False)

            for idx, d in enumerate(d_list):
                name = d.get("name", "")
                raw_kind = d.get("kind", "host")
                model = d.get("model", "PC-PT")
                is_server_device = raw_kind == "server" or model == "Server-PT"
                flow_type = "serverNode" if is_server_device else "hostNode"
                normalized_kind = "server" if is_server_device else "host"

                host_edge_id = f"link-{dept['switch']}-{name}"
                is_host_cut = host_edge_id in CUT_EDGES
                host_connected = sw_connected and (not is_host_cut)
                host_status = "online" if host_connected else "offline"

                if name == "Campus-DNS-Server":
                    pos_x = base_x + 110
                    pos_y = base_y + 345
                    ip_addr = "192.168.100.10"
                    ip_mode = "Static (DNS Service: Active)"
                elif name == "Campus-DHCP-Server":
                    pos_x = base_x + 310
                    pos_y = base_y + 345
                    ip_addr = "192.168.100.20"
                    ip_mode = "Static (DHCP Service: Active)"
                elif name == "Admin-Portal-Server":
                    pos_x = base_x + 110
                    pos_y = base_y + 345
                    ip_addr = "192.168.30.20"
                    ip_mode = "Static (Admin Web ERP)"
                else:
                    pos_x = base_x + 110 + (idx % 2) * 200
                    pos_y = base_y + 345 + (idx // 2) * 105
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
                            "kind": normalized_kind,
                            "model": model,
                            "department": dept_id,
                            "departmentName": dept["name"],
                            "block": dept["block"],
                            "ip": ip_addr,
                            "ipMode": ip_mode,
                            "vlan": dept["vlan"],
                            "gateway": dept["gateway"],
                            "subnet": dept["subnet"],
                            "status": host_status,
                        },
                    }
                )

        edges = []

        is_wan_cut = "link-Campus-Core-Router-ISP-Edge-Router" in CUT_EDGES
        edges.append(
            {
                "id": "link-Campus-Core-Router-ISP-Edge-Router",
                "source": "Campus-Core-Router",
                "target": "ISP-Edge-Router",
                "category": "wan_gateway",
                "categoryLabel": "Campus Internet WAN Gateway",
                "impact": "Severing cuts external internet access (8.8.8.8) campus-wide.",
                "label": "[SEVERED]" if is_wan_cut else None,
                "animated": not is_wan_cut,
                "isCut": is_wan_cut,
                "departmentId": None,
                "portA": "GigabitEthernet0/1",
                "portB": "GigabitEthernet0/0",
                "style": (
                    {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                    if is_wan_cut
                    else {"stroke": "#827666", "strokeWidth": 2}
                ),
            }
        )

        is_core_trunk_cut = "link-Campus-Core-Router-Core-Dist-SW" in CUT_EDGES
        edges.append(
            {
                "id": "link-Campus-Core-Router-Core-Dist-SW",
                "source": "Campus-Core-Router",
                "target": "Core-Dist-SW",
                "category": "core_trunk",
                "categoryLabel": "Campus Core 802.1Q Distribution Trunk",
                "impact": "Core distribution trunk linking Campus-Core-Router to Core-Dist-SW.",
                "label": "[SEVERED]" if is_core_trunk_cut else None,
                "animated": not is_core_trunk_cut,
                "isCut": is_core_trunk_cut,
                "departmentId": "core",
                "portA": "GigabitEthernet0/0",
                "portB": "FastEthernet0/1",
                "style": (
                    {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                    if is_core_trunk_cut
                    else {"stroke": "#827666", "strokeWidth": 2.5}
                ),
            }
        )

        for dept_id, (_, _, dept) in dept_layout_info.items():
            transit_id = f"link-{dept['router']}-Core-Dist-SW"
            is_transit_cut = (
                transit_id in CUT_EDGES
                or f"link-{dept['router']}-Campus-Core-Router" in CUT_EDGES
                or dept_id in CUT_DEPARTMENTS
                or is_core_trunk_cut
            )

            edges.append(
                {
                    "id": transit_id,
                    "source": dept["router"],
                    "target": "Core-Dist-SW",
                    "category": "core_transit",
                    "categoryLabel": f"{dept['name']} Core Transit Link",
                    "impact": f"Severing forces Layer 3 traffic for {dept['name']} to reroute via lateral neighbor.",
                    "label": "[SEVERED]" if is_transit_cut else None,
                    "animated": not is_transit_cut,
                    "isCut": is_transit_cut,
                    "departmentId": dept_id,
                    "portA": "GigabitEthernet0/1",
                    "portB": dept.get("core_sw_port", "FastEthernet0/2"),
                    "style": (
                        {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                        if is_transit_cut
                        else {"stroke": "#827666", "strokeWidth": 2}
                    ),
                }
            )

            gw_id = f"link-{dept['router']}-{dept['switch']}"
            is_gw_cut = gw_id in CUT_EDGES
            edges.append(
                {
                    "id": gw_id,
                    "source": dept["router"],
                    "target": dept["switch"],
                    "category": "gateway_uplink",
                    "categoryLabel": f"{dept['name']} Gateway Trunk",
                    "impact": f"Severing isolates {dept['name']} workstations from router gateway and Inter-VLAN routing.",
                    "label": "[SEVERED]" if is_gw_cut else None,
                    "animated": not is_gw_cut,
                    "isCut": is_gw_cut,
                    "departmentId": dept_id,
                    "portA": "GigabitEthernet0/0",
                    "portB": "FastEthernet0/1",
                    "style": (
                        {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                        if is_gw_cut
                        else {"stroke": "#827666", "strokeWidth": 2}
                    ),
                }
            )

        is_cs_lib_cut = "link-Router-CS-Router-LIB" in CUT_EDGES
        edges.append(
            {
                "id": "link-Router-CS-Router-LIB",
                "source": "Router-CS",
                "target": "Router-LIB",
                "category": "lateral_mesh",
                "categoryLabel": "Academic Block A - B Lateral Redundancy Link",
                "impact": "Severing removes the direct failover bypass between CS and Library.",
                "label": "[SEVERED]" if is_cs_lib_cut else None,
                "animated": not is_cs_lib_cut,
                "isCut": is_cs_lib_cut,
                "departmentId": None,
                "portA": "GigabitEthernet0/2",
                "portB": "GigabitEthernet0/2",
                "style": (
                    {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                    if is_cs_lib_cut
                    else {"stroke": "#827666", "strokeWidth": 2}
                ),
            }
        )

        is_admin_dc_cut = "link-Router-ADMIN-Router-DC" in CUT_EDGES
        edges.append(
            {
                "id": "link-Router-ADMIN-Router-DC",
                "source": "Router-ADMIN",
                "target": "Router-DC",
                "category": "lateral_mesh",
                "categoryLabel": "Academic Block C - Data Center Lateral Redundancy Link",
                "impact": "Severing removes the direct failover bypass between Admin and Data Center.",
                "label": "[SEVERED]" if is_admin_dc_cut else None,
                "animated": not is_admin_dc_cut,
                "isCut": is_admin_dc_cut,
                "departmentId": None,
                "portA": "GigabitEthernet0/2",
                "portB": "GigabitEthernet0/2",
                "style": (
                    {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                    if is_admin_dc_cut
                    else {"stroke": "#827666", "strokeWidth": 2}
                ),
            }
        )

        for dept_id, d_list in dept_devices.items():
            dept = DEPARTMENTS[dept_id]
            for host_idx, d in enumerate(d_list):
                dev_name = d.get("name", "")
                is_server = dev_name in ("Campus-DNS-Server", "Campus-DHCP-Server", "Admin-Portal-Server")
                is_dhcp_server = dev_name == "Campus-DHCP-Server"
                is_admin_server = dev_name == "Admin-Portal-Server"
                host_edge_id = f"link-{dept['switch']}-{dev_name}"
                is_host_cut = host_edge_id in CUT_EDGES

                port_a = (
                    "FastEthernet0/2"
                    if dev_name in ("Campus-DNS-Server", "Admin-Portal-Server")
                    else "FastEthernet0/3"
                    if is_dhcp_server
                    else f"FastEthernet0/{host_idx + 2}"
                )
                category_label = (
                    "Campus Administration Web ERP Infrastructure Link"
                    if is_admin_server
                    else "Campus Central DHCP Server Infrastructure Link"
                    if is_dhcp_server
                    else "Campus DNS & Web Server Infrastructure Link"
                    if is_server
                    else f"Workstation Access Patch Cord ({dev_name})"
                )
                impact_text = (
                    "Severing takes administrative intranet and payroll portal offline."
                    if is_admin_server
                    else "Severing takes central DHCP service offline. Automatic dynamic IP lease provisioning fails campus-wide."
                    if is_dhcp_server
                    else "Severing takes central DNS and intranet server offline network-wide."
                    if is_server
                    else f"Severing disconnects {dev_name} from network (Physical link down)."
                )

                edges.append(
                    {
                        "id": host_edge_id,
                        "source": dept["switch"],
                        "target": dev_name,
                        "category": "server_uplink" if is_server else "access_port",
                        "categoryLabel": category_label,
                        "impact": impact_text,
                        "label": "[SEVERED]" if is_host_cut else None,
                        "animated": not is_host_cut,
                        "isCut": is_host_cut,
                        "departmentId": dept_id,
                        "portA": port_a,
                        "portB": "FastEthernet0",
                        "style": (
                            {"stroke": "#ef4444", "strokeWidth": 3.5, "strokeDasharray": "6,6"}
                            if is_host_cut
                            else {"stroke": "#827666", "strokeWidth": 2}
                        ),
                    }
                )

        return jsonify(
            {
                "nodes": nodes,
                "edges": edges,
                "buildings": buildings,
                "cutEdges": list(CUT_EDGES),
                "cutDepartments": list(CUT_DEPARTMENTS),
            }
        )
    except Exception as e:
        logger.error(f"Topology error: {e}")
        return jsonify({"nodes": [], "edges": [], "buildings": [], "error": str(e)}), 500


@app.route("/api/topology/link/toggle", methods=["POST"])
def toggle_link():
    data = request.json or {}
    edge_id = data.get("edgeId")
    dept_id = data.get("departmentId")
    action = data.get("action", "toggle")

    if dept_id and not edge_id:
        dept = DEPARTMENTS.get(dept_id)
        if dept:
            edge_id = f"link-{dept['router']}-Core-Dist-SW"

    if not edge_id:
        return jsonify({"error": "edgeId or departmentId required"}), 400

    if action == "toggle":
        action = "restore" if (edge_id in CUT_EDGES or (dept_id and dept_id in CUT_DEPARTMENTS)) else "cut"

    if action == "cut":
        CUT_EDGES.add(edge_id)
        if dept_id:
            CUT_DEPARTMENTS.add(dept_id)
        for dept_k, dept_v in DEPARTMENTS.items():
            if edge_id in (f"link-{dept_v['router']}-Core-Dist-SW", f"link-{dept_v['router']}-Campus-Core-Router"):
                CUT_DEPARTMENTS.add(dept_k)
                sub_iface = f"GigabitEthernet0/0.{dept_v['vlan']}"
                try:
                    pt.run_cli("Campus-Core-Router", f"configure terminal\ninterface {sub_iface}\nshutdown\nend\n")
                except Exception:
                    pass
                break
        if edge_id == "link-Campus-Core-Router-ISP-Edge-Router":
            try:
                pt.run_cli("Campus-Core-Router", "configure terminal\ninterface GigabitEthernet0/1\nshutdown\nend\n")
            except Exception:
                pass
        log_event("OUTAGE", f"Physical carrier severed on cable: {edge_id}")
    else:
        CUT_EDGES.discard(edge_id)
        if dept_id:
            CUT_DEPARTMENTS.discard(dept_id)
        for dept_k, dept_v in DEPARTMENTS.items():
            if edge_id in (f"link-{dept_v['router']}-Core-Dist-SW", f"link-{dept_v['router']}-Campus-Core-Router"):
                CUT_DEPARTMENTS.discard(dept_k)
                sub_iface = f"GigabitEthernet0/0.{dept_v['vlan']}"
                try:
                    pt.run_cli("Campus-Core-Router", f"configure terminal\ninterface {sub_iface}\nno shutdown\nend\n")
                except Exception:
                    pass
                break
        if edge_id == "link-Campus-Core-Router-ISP-Edge-Router":
            try:
                pt.run_cli("Campus-Core-Router", "configure terminal\ninterface GigabitEthernet0/1\nno shutdown\nend\n")
            except Exception:
                pass
        log_event("RESTORED", f"Physical carrier restored on cable: {edge_id}")

    try:
        pt.call_tool("fast_forward")
    except Exception:
        pass

    tables = compute_router_tables(CUT_EDGES)
    reachability = compute_building_reachability(CUT_EDGES, CUT_DEPARTMENTS)

    return jsonify(
        {
            "success": True,
            "edgeId": edge_id,
            "departmentId": dept_id,
            "action": action,
            "isCut": edge_id in CUT_EDGES,
            "cutEdges": list(CUT_EDGES),
            "cutDepartments": list(CUT_DEPARTMENTS),
            "tables": tables,
            "reachability": reachability,
        }
    )


@app.route("/api/router/routes", methods=["GET"])
def get_router_routes():
    try:
        tables = compute_router_tables(CUT_EDGES)
        return jsonify(
            {
                "tables": tables,
                "cutEdges": list(CUT_EDGES),
                "cutDepartments": list(CUT_DEPARTMENTS),
            }
        )
    except Exception as e:
        logger.error(f"Routing table error: {e}")
        tables = compute_router_tables(CUT_EDGES)
        return jsonify(
            {
                "tables": tables,
                "cutEdges": list(CUT_EDGES),
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

    counts = count_devices_per_department()
    current_count = counts.get(dept_id, 0)
    max_hosts = dept.get("maxHosts", 30)

    if current_count >= max_hosts:
        return jsonify(
            {
                "success": False,
                "error": f"Subnet capacity exceeded for {dept['name']}! Currently at maximum capacity of {current_count}/{max_hosts} PCs. Increase capacity in Dashboard to allocate more hosts.",
            }
        ), 400

    switch_name = dept["switch"]
    gateway = dept["gateway"]
    is_dhcp = alloc_type == "DHCP"
    ip = static_ip if not is_dhcp else None
    subnet_mask = dept.get("mask", "255.255.255.0")

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
            subnet_mask=subnet_mask,
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

    if any(source in cut_id for cut_id in CUT_EDGES):
        err_msg = (
            f"\nPinging {target} with 32 bytes of data:\n\n"
            f"Hardware Error: Physical Link Down (Cable Severed).\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n\n"
            f"Ping statistics for {target}:\n"
            f"    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)\n"
        )
        log_event("PING", f"Ping test from '{source}' to '{target}' - Result: FAILED (Cable Severed)")
        return jsonify({"source": source, "target": target, "success": False, "output": err_msg})

    if target in ("8.8.8.8", "203.0.113.2") and "link-Campus-Core-Router-ISP-Edge-Router" in CUT_EDGES:
        err_msg = (
            f"\nPinging {target} with 32 bytes of data:\n\n"
            f"Request timed out.\n"
            f"Request timed out.\n"
            f"Request timed out.\n"
            f"Request timed out.\n\n"
            f"Ping statistics for {target}:\n"
            f"    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)\n"
            f"Campus Core Gateway reports: External WAN carrier link severed.\n"
        )
        log_event("PING", f"Ping test from '{source}' to '{target}' - Result: FAILED (WAN Down)")
        return jsonify({"source": source, "target": target, "success": False, "output": err_msg})

    if target in ("192.168.100.10", "Campus-DNS-Server") and "link-SW-SERVERS-Campus-DNS-Server" in CUT_EDGES:
        err_msg = (
            f"\nPinging {target} with 32 bytes of data:\n\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n\n"
            f"Ping statistics for {target}:\n"
            f"    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)\n"
            f"Data Center Access Switch reports: Server link down.\n"
        )
        log_event("PING", f"Ping test from '{source}' to '{target}' - Result: FAILED (Server Link Down)")
        return jsonify({"source": source, "target": target, "success": False, "output": err_msg})

    dept_id = None
    for d_k, d_v in DEPARTMENTS.items():
        if d_v["code"] in source:
            dept_id = d_k
            break
    if dept_id and f"link-{DEPARTMENTS[dept_id]['router']}-{DEPARTMENTS[dept_id]['switch']}" in CUT_EDGES:
        err_msg = (
            f"\nPinging {target} with 32 bytes of data:\n\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n"
            f"Destination host unreachable.\n\n"
            f"Ping statistics for {target}:\n"
            f"    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)\n"
            f"Department Switch reports: Default Gateway trunk interface down.\n"
        )
        log_event("PING", f"Ping test from '{source}' to '{target}' - Result: FAILED (Gateway Trunk Down)")
        return jsonify({"source": source, "target": target, "success": False, "output": err_msg})

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


@app.route("/api/acl/matrix", methods=["GET"])
def get_acl_matrix():
    global COMMUNICATION_MATRIX, ACL_RULES
    _, compiled_rules = compile_matrix_acl_script(COMMUNICATION_MATRIX)
    if not ACL_RULES or len(ACL_RULES) <= 2:
        ACL_RULES = compiled_rules
    return jsonify({
        "matrix": COMMUNICATION_MATRIX,
        "rules": ACL_RULES,
    })


@app.route("/api/acl/matrix", methods=["POST"])
def update_acl_matrix():
    global COMMUNICATION_MATRIX, ACL_RULES
    data = request.json or {}
    new_matrix = data.get("matrix")
    if not new_matrix or not isinstance(new_matrix, dict):
        return jsonify({"error": "Invalid matrix payload"}), 400

    COMMUNICATION_MATRIX = new_matrix
    script, compiled_rules = compile_matrix_acl_script(COMMUNICATION_MATRIX)
    ACL_RULES = compiled_rules

    output = ""
    try:
        output = pt.run_cli("Campus-Core-Router", script)
        pt.call_tool("save_network", {})
    except Exception as e:
        logger.warning(f"Error pushing matrix to Packet Tracer: {e}")

    deny_count = sum(
        1 for row in COMMUNICATION_MATRIX.values() for v in row.values() if v == "deny"
    )
    log_event(
        "FIREWALL",
        f"Visual Firewall Matrix enforced: {deny_count} DENY policy rules pushed to Campus-Core-Router.",
    )

    return jsonify({
        "success": True,
        "matrix": COMMUNICATION_MATRIX,
        "script": script,
        "output": output,
        "rules": ACL_RULES,
    })


@app.route("/api/web/browse", methods=["POST"])
def browse_web_portal():
    data = request.json or {}
    device = data.get("device", "CS-PC-01")
    url = data.get("url", "http://student.mitwpu.edu")

    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"http://{url}"

    try:
        res = pt.call_tool(
            "browse_web",
            {"device": device, "url": url, "timeout_secs": 4},
        )
        html = res.get("html", "")
        server_ip = res.get("server", "")
        log_event(
            "HTTP",
            f"HTTP GET {url} from '{device}' -> 200 OK (Served by {server_ip})",
        )
        return jsonify(
            {
                "success": True,
                "status": "200 OK",
                "statusCode": 200,
                "url": url,
                "server": server_ip,
                "html": html,
                "text": res.get("text", ""),
                "device": device,
            }
        )
    except Exception as e:
        log_event(
            "HTTP",
            f"HTTP GET {url} from '{device}' -> 403 Forbidden / Timed Out (Firewall Blocked)",
        )
        return jsonify(
            {
                "success": False,
                "status": "403 Forbidden / Connection Timed Out",
                "statusCode": 403,
                "url": url,
                "server": "Filtered by Campus Core Firewall",
                "error": "Destination Host Administratively Prohibited: Request dropped by Campus-Core-Router Extended ACL (CAMPUS-FIREWALL).",
                "device": device,
            }
        )


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
