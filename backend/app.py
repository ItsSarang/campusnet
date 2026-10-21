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

DEPARTMENTS = {
    "dept-cs": {
        "id": "dept-cs",
        "name": "Department of Computer Science",
        "block": "Academic Block A - Computer Science",
        "code": "CS",
        "vlan": 10,
        "subnet": "192.168.10.0/24",
        "gateway": "192.168.10.1",
        "router": "Router-CS",
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
        "router": "Router-LIB",
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
        "router": "Router-ADMIN",
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
        "router": "Router-DC",
        "switch": "SW-SERVERS",
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
        "ip": "192.168.10.1 / 20.1 / 30.1 / 100.1 / 203.0.113.1",
        "subnet": "802.1Q Backbone",
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
    ("Router-CS", "Campus-Core-Router", "link-Router-CS-Campus-Core-Router"),
    ("Router-LIB", "Campus-Core-Router", "link-Router-LIB-Campus-Core-Router"),
    ("Router-ADMIN", "Campus-Core-Router", "link-Router-ADMIN-Campus-Core-Router"),
    ("Router-DC", "Campus-Core-Router", "link-Router-DC-Campus-Core-Router"),
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
    adj = {r: [] for r in router_names}
    for u, v, edge_id in ROUTER_GRAPH_EDGES:
        if edge_id in cut_edges:
            continue
        adj[u].append(v)
        adj[v].append(u)

    result_tables = []
    for rc in ROUTER_CONFIGS:
        src = rc["name"]
        routes = []
        for dst_rc in ROUTER_CONFIGS:
            dst = dst_rc["name"]
            if src == dst:
                routes.append(
                    {
                        "destination": dst,
                        "distance": 0,
                        "nextHop": "Direct",
                    }
                )
                continue

            q = deque([[src]])
            visited = {src}
            found_path = None
            while q:
                path = q.popleft()
                curr = path[-1]
                if curr == dst:
                    found_path = path
                    break
                for nxt in adj.get(curr, []):
                    if nxt not in visited:
                        visited.add(nxt)
                        q.append(path + [nxt])

            if found_path:
                routes.append(
                    {
                        "destination": dst,
                        "distance": len(found_path) - 1,
                        "nextHop": found_path[1],
                    }
                )
            else:
                routes.append(
                    {
                        "destination": dst,
                        "distance": "Unreachable",
                        "nextHop": "None",
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
        transit_edge = f"link-{r_name}-Campus-Core-Router"
        trunk_edge = f"link-{r_name}-{dept['switch']}"

        is_transit_cut = transit_edge in cut_edges or dept_id in cut_departments
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

        height_cs = max(340, 245 + ((len(dept_devices["dept-cs"]) + 1) // 2) * 85 + 30)
        height_lib = max(340, 245 + ((len(dept_devices["dept-lib"]) + 1) // 2) * 85 + 30)
        height_admin = max(340, 245 + ((len(dept_devices["dept-admin"]) + 1) // 2) * 85 + 30)
        height_dc = max(340, 245 + ((len(dept_devices["dept-dc"]) + 1) // 2) * 85 + 30)

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
                "height": 260,
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

        reachability = compute_building_reachability(CUT_EDGES, CUT_DEPARTMENTS)
        for b in buildings:
            dept_id = b.get("departmentId")
            reach = reachability.get(dept_id, {})
            b["status"] = reach.get("status", "normal")
            b["isOffline"] = reach.get("isOffline", False)
            b["isRerouted"] = reach.get("isRerouted", False)
            b["nextHop"] = reach.get("nextHop", "Direct")
            b["reason"] = reach.get("reason", "")

        nodes = []

        nodes.append(
            {
                "id": "ISP-Edge-Router",
                "type": "routerNode",
                "position": {"x": 640, "y": 0},
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
                    "status": "online",
                },
            }
        )

        nodes.append(
            {
                "id": "Campus-Core-Router",
                "type": "routerNode",
                "position": {"x": 640, "y": 245},
                "draggable": False,
                "data": {
                    "label": "Campus-Core-Router",
                    "kind": "router",
                    "model": "2911",
                    "department": None,
                    "departmentName": "Campus Core Backbone",
                    "block": "Campus Core Distribution Hub",
                    "ip": "192.168.10.1 / 20.1 / 30.1 / 100.1 / 203.0.113.1",
                    "ipMode": "Campus Core Backbone Router",
                    "vlan": "10, 20, 30, 100",
                    "gateway": "192.168.10.1",
                    "subnet": "802.1Q Backbone",
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

        for dept_id, (base_x, base_y, dept) in dept_layout_info.items():
            nodes.append(
                {
                    "id": dept["router"],
                    "type": "routerNode",
                    "position": {"x": base_x + 160, "y": base_y + 65},
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
                        "status": "online",
                    },
                }
            )

            nodes.append(
                {
                    "id": dept["switch"],
                    "type": "switchNode",
                    "position": {"x": base_x + 160, "y": base_y + 155},
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
                        "status": "online",
                    },
                }
            )

        for dept_id, d_list in dept_devices.items():
            base_x, base_y, dept = dept_layout_info[dept_id]
            for idx, d in enumerate(d_list):
                name = d.get("name", "")
                kind = d.get("kind", "host")
                model = d.get("model", "PC-PT")
                flow_type = "serverNode" if kind == "server" or model == "Server-PT" else "hostNode"

                if name == "Campus-DNS-Server":
                    pos_x = base_x + 160
                    pos_y = base_y + 245
                    ip_addr = "192.168.100.10"
                    ip_mode = "Static"
                else:
                    pos_x = base_x + 80 + (idx % 2) * 160
                    pos_y = base_y + 245 + (idx // 2) * 85
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

        is_wan_cut = "link-Campus-Core-Router-ISP-Edge-Router" in CUT_EDGES
        edges.append(
            {
                "id": "link-Campus-Core-Router-ISP-Edge-Router",
                "source": "Campus-Core-Router",
                "target": "ISP-Edge-Router",
                "category": "wan_gateway",
                "categoryLabel": "Campus Internet WAN Gateway (8.8.8.8)",
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

        for dept_id, (_, _, dept) in dept_layout_info.items():
            transit_id = f"link-{dept['router']}-Campus-Core-Router"
            is_transit_cut = transit_id in CUT_EDGES or dept_id in CUT_DEPARTMENTS

            edges.append(
                {
                    "id": transit_id,
                    "source": dept["router"],
                    "target": "Campus-Core-Router",
                    "category": "core_transit",
                    "categoryLabel": f"{dept['name']} Core Transit Link",
                    "impact": f"Severing forces Layer 3 traffic for {dept['name']} to reroute via lateral neighbor.",
                    "label": "[SEVERED]" if is_transit_cut else None,
                    "animated": not is_transit_cut,
                    "isCut": is_transit_cut,
                    "departmentId": dept_id,
                    "portA": "GigabitEthernet0/1",
                    "portB": f"GigabitEthernet0/0.{dept['vlan']}",
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
                    "categoryLabel": f"{dept['name']} Gateway Trunk (192.168.{dept['vlan']}.1)",
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
                is_server = dev_name == "Campus-DNS-Server"
                host_edge_id = f"link-{dept['switch']}-{dev_name}"
                is_host_cut = host_edge_id in CUT_EDGES

                edges.append(
                    {
                        "id": host_edge_id,
                        "source": dept["switch"],
                        "target": dev_name,
                        "category": "server_uplink" if is_server else "access_port",
                        "categoryLabel": (
                            "Campus DNS & Web Server Infrastructure Link"
                            if is_server
                            else f"Workstation Access Patch Cord ({dev_name})"
                        ),
                        "impact": (
                            "Severing takes central DNS and intranet server offline network-wide."
                            if is_server
                            else f"Severing disconnects {dev_name} from network (Physical link down)."
                        ),
                        "label": "[SEVERED]" if is_host_cut else None,
                        "animated": not is_host_cut,
                        "isCut": is_host_cut,
                        "departmentId": dept_id,
                        "portA": f"FastEthernet0/{host_idx + 2}",
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
            edge_id = f"link-{dept['router']}-Campus-Core-Router"

    if not edge_id:
        return jsonify({"error": "edgeId or departmentId required"}), 400

    if action == "toggle":
        action = "restore" if (edge_id in CUT_EDGES or (dept_id and dept_id in CUT_DEPARTMENTS)) else "cut"

    if action == "cut":
        CUT_EDGES.add(edge_id)
        if dept_id:
            CUT_DEPARTMENTS.add(dept_id)
        for dept_k, dept_v in DEPARTMENTS.items():
            if edge_id == f"link-{dept_v['router']}-Campus-Core-Router":
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
            if edge_id == f"link-{dept_v['router']}-Campus-Core-Router":
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
