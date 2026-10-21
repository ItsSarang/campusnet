"""
CampusNet - Cisco Packet Tracer Bridge Client
Communicates with Packet Tracer 9.0 over local PTMP socket (port 39000)
using the pktctl MCP binary.
"""

import os
import json
import subprocess
import threading
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("pt_client")
logging.basicConfig(level=logging.INFO)

PKTCTL_BIN = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "bin", "pktctl")
)
PT_APP_DIR = "/Applications/Cisco Packet Tracer 9.0.0/Cisco Packet Tracer 9.0.app/Contents"
FRAMEWORKS_DIR = os.path.join(PT_APP_DIR, "Frameworks")


class PacketTracerClient:
    def __init__(
        self,
        app_id: str = "dev.campusnet",
        secret: str = "campusnet_secret_key_123456789",
    ):
        self.app_id = app_id
        self.secret = secret
        self.proc: Optional[subprocess.Popen] = None
        self.req_id = 0
        self.lock = threading.Lock()
        self._is_connected = False

    def start(self):
        """Starts the pktctl child process and completes MCP handshake."""
        with self.lock:
            if self.proc and self.proc.poll() is None:
                return

            if not os.path.isfile(PKTCTL_BIN):
                logger.warning(f"pktctl bridge binary not found at {PKTCTL_BIN}")
                return

            try:
                env = os.environ.copy()
                env["PKTCTL_APP_ID"] = self.app_id
                env["PKTCTL_SECRET"] = self.secret
                env["PKTCTL_SETUP_DIR"] = os.path.expanduser("~/.config/pktctl")
                if os.path.exists(FRAMEWORKS_DIR):
                    env["DYLD_LIBRARY_PATH"] = FRAMEWORKS_DIR

                self.proc = subprocess.Popen(
                    [PKTCTL_BIN],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env,
                )

                # MCP Initialize
                init_res = self._raw_send(
                    {
                        "jsonrpc": "2.0",
                        "id": self._next_id(),
                        "method": "initialize",
                        "params": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {},
                            "clientInfo": {"name": "campusnet-backend", "version": "1.0"},
                        },
                    }
                )

                # Send initialized notification
                if self.proc and self.proc.stdin:
                    self.proc.stdin.write(
                        json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"})
                        + "\n"
                    )
                    self.proc.stdin.flush()
                self._is_connected = True
                logger.info("Connected to pktctl bridge.")
            except Exception as e:
                logger.warning(f"Packet Tracer bridge initialization pending: {e}")
                if self.proc:
                    try:
                        self.proc.kill()
                    except Exception:
                        pass
                    self.proc = None
                self._is_connected = False

    def stop(self):
        """Terminates the bridge process."""
        with self.lock:
            if self.proc:
                try:
                    self.proc.terminate()
                    self.proc.wait(timeout=2)
                except Exception:
                    self.proc.kill()
                self.proc = None
                self._is_connected = False

    def _next_id(self) -> int:
        self.req_id += 1
        return self.req_id

    def _raw_send(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.proc or self.proc.poll() is not None:
            raise RuntimeError("pktctl bridge is not running")

        line = json.dumps(payload) + "\n"
        self.proc.stdin.write(line)
        self.proc.stdin.flush()

        res_line = self.proc.stdout.readline()
        if not res_line:
            return None
        return json.loads(res_line)

    def call_tool(self, name: str, arguments: Dict[str, Any] = None) -> Any:
        """Executes a tool on Packet Tracer."""
        if arguments is None:
            arguments = {}

        with self.lock:
            if not self.proc or self.proc.poll() is not None:
                self.start()

            req = {
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "tools/call",
                "params": {"name": name, "arguments": arguments},
            }

            resp = self._raw_send(req)
            if not resp:
                raise RuntimeError("No response from Packet Tracer bridge")

            if "error" in resp:
                raise RuntimeError(resp["error"].get("message", "Tool error"))

            result = resp.get("result", {})
            if result.get("isError"):
                content = result.get("content", [{}])
                msg = content[0].get("text", "Error executing Packet Tracer tool")
                raise RuntimeError(msg)

            # Return structured or parsed JSON content
            if "structuredContent" in result:
                return result["structuredContent"]

            content = result.get("content", [])
            if content and "text" in content[0]:
                try:
                    return json.loads(content[0]["text"])
                except Exception:
                    return content[0]["text"]

            return result

    # -------------------------------------------------------------------------
    # Convenience Networking Methods
    # -------------------------------------------------------------------------

    def get_status(self) -> Dict[str, Any]:
        """Returns Packet Tracer connectivity and basic stats."""
        try:
            return self.call_tool("status")
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def list_devices(self) -> List[Dict[str, Any]]:
        """Returns all devices in the Packet Tracer canvas."""
        data = self.call_tool("list_devices")
        return data.get("devices", [])

    def list_links(self) -> List[Dict[str, Any]]:
        """Returns all cable connections between devices."""
        data = self.call_tool("list_links")
        return data.get("links", [])

    def list_ports(self, device: str) -> List[Dict[str, Any]]:
        """Returns all ports and their link states on a device."""
        data = self.call_tool("list_ports", {"device": device})
        return data.get("ports", [])

    def run_cli(self, device: str, command: str) -> str:
        """Runs a Cisco IOS command on a router or switch."""
        data = self.call_tool("run_cli", {"device": device, "command": command})
        return data.get("output", "") if isinstance(data, dict) else str(data)

    def run_ping(self, source_pc: str, target_ip: str) -> Dict[str, Any]:
        """Runs a ping test from a host PC inside Packet Tracer."""
        cmd = f"ping {target_ip}"
        data = self.call_tool(
            "run_host_command", {"device": source_pc, "command": cmd}
        )
        output = data.get("output", "") if isinstance(data, dict) else str(data)

        # Basic parse of ping output
        success = "Received = 0" not in output and "Reply from" in output
        return {
            "source": source_pc,
            "target": target_ip,
            "output": output,
            "success": success,
        }

    def add_workstation(
        self,
        name: str,
        department_switch: str,
        ip: str,
        subnet_mask: str = "255.255.255.0",
        gateway: str = "192.168.10.1",
        is_dhcp: bool = False,
        x: Optional[float] = None,
        y: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Spawns a PC, finds a free switch port, cables it, and configures IP/DHCP.
        """
        # 1. Add PC device
        args = {"model": "PC-PT", "name": name}
        if x is not None and y is not None:
            args["x"] = int(x)
            args["y"] = int(y)
        self.call_tool("add_device", args)

        # 2. Find first free access port on department switch (Fa0/2 - Fa0/23)
        links = self.list_links()
        used_ports = set()
        for l in links:
            if l.get("a", {}).get("device") == department_switch:
                used_ports.add(l.get("a", {}).get("port"))
            if l.get("b", {}).get("device") == department_switch:
                used_ports.add(l.get("b", {}).get("port"))

        ports = self.list_ports(department_switch)
        free_port = None
        for p in ports:
            port_name = p.get("name", "")
            if not port_name.startswith("FastEthernet0/"):
                continue
            if port_name in used_ports or port_name in ("FastEthernet0/1", "FastEthernet0/24"):
                continue
            free_port = port_name
            break

        if not free_port:
            free_port = "FastEthernet0/5"

        # 3. Cable PC to Switch
        self.call_tool(
            "connect",
            {
                "device_a": name,
                "port_a": "FastEthernet0",
                "device_b": department_switch,
                "port_b": free_port,
                "cable": "straight",
            },
        )

        # 4. Configure IP / DHCP
        host_args = {"device": name, "dhcp": is_dhcp}
        if not is_dhcp and ip:
            host_args["ip"] = ip
            host_args["mask"] = subnet_mask
            host_args["gateway"] = gateway
            host_args["dns"] = "192.168.100.10"
        self.call_tool("configure_host", host_args)

        # 5. Fast forward spanning tree / ARP
        try:
            self.call_tool("fast_forward")
        except Exception:
            pass

        return {
            "name": name,
            "switch": department_switch,
            "port": free_port,
            "ip": ip,
            "is_dhcp": is_dhcp,
        }

    def remove_device(self, name: str) -> bool:
        """Removes a device from the Packet Tracer canvas."""
        self.call_tool("remove_device", {"name": name})
        return True

    def configure_host_ip(
        self,
        name: str,
        ip: str,
        subnet_mask: str = "255.255.255.0",
        gateway: str = "192.168.10.1",
        is_dhcp: bool = False,
    ) -> Dict[str, Any]:
        """Updates IP settings on an existing PC."""
        host_args = {"device": name, "dhcp": is_dhcp}
        if not is_dhcp and ip:
            host_args["ip"] = ip
            host_args["mask"] = subnet_mask
            host_args["gateway"] = gateway
            host_args["dns"] = "192.168.100.10"
        self.call_tool("configure_host", host_args)
        return {"name": name, "ip": ip, "is_dhcp": is_dhcp}
