# Cisco Packet Tracer — Base Campus Backbone Setup Guide

This guide provides the exact device layout, port connections, and ready-to-paste Cisco IOS configurations to create your baseline campus network topology file (`campusnet_backbone.pkt`).

---

## 1. Devices to Place on Canvas

Open **Cisco Packet Tracer** on your Mac and drag the following devices onto the Logical Workspace:

| Device Type | Packet Tracer Model | Display Name / Hostname | Role in CampusNet |
|---|---|---|---|
| **Router** | **2911** (or 4321 / 4331) | `Campus-Core-Router` | Inter-VLAN Routing & ACL Security Gateway |
| **Switch** | **2960-24TT** | `Core-Dist-SW` | Distribution Switch (Aggregates VLAN Trunks) |
| **Switch** | **2960-24TT** | `SW-CS` | Access Switch: Computer Science Dept (VLAN 10) |
| **Switch** | **2960-24TT** | `SW-LIB` | Access Switch: University Library (VLAN 20) |
| **Switch** | **2960-24TT** | `SW-ADMIN` | Access Switch: Administration (VLAN 30) |
| **Switch** | **2960-24TT** | `SW-SERVERS` | Access Switch: Data Center / Campus Servers (VLAN 100) |
| **Server** | Generic Server | `Campus-DNS-Server` | Campus Server (IP: `192.168.100.10`) |

---

## 2. Cable Connections (Copper Straight-Through)

Use the **Copper Straight-Through cable** (solid black line icon) to connect:

```text
Campus-Core-Router [GigabitEthernet0/0]  <--->  Core-Dist-SW [GigabitEthernet0/1]

Core-Dist-SW [FastEthernet0/1]          <--->  SW-CS [FastEthernet0/24]
Core-Dist-SW [FastEthernet0/2]          <--->  SW-LIB [FastEthernet0/24]
Core-Dist-SW [FastEthernet0/3]          <--->  SW-ADMIN [FastEthernet0/24]
Core-Dist-SW [FastEthernet0/4]          <--->  SW-SERVERS [FastEthernet0/24]

SW-SERVERS [FastEthernet0/1]            <--->  Campus-DNS-Server [FastEthernet0]
```

---

## 3. Ready-to-Paste Cisco IOS Configurations

Click on each device in Packet Tracer, go to the **CLI tab**, press **Enter**, and paste the corresponding configuration block:

### A. `Campus-Core-Router` Configuration
*(Enables Inter-VLAN routing sub-interfaces and DHCP address pools)*

```cisco
enable
configure terminal
hostname Campus-Core-Router

! Enable the physical link
interface GigabitEthernet0/0
 no ip address
 no shutdown
 exit

! Sub-interface for Computer Science (VLAN 10)
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
 no shutdown
 exit

! Sub-interface for Library (VLAN 20)
interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
 no shutdown
 exit

! Sub-interface for Administration (VLAN 30)
interface GigabitEthernet0/0.30
 encapsulation dot1Q 30
 ip address 192.168.30.1 255.255.255.0
 no shutdown
 exit

! Sub-interface for Data Center / Servers (VLAN 100)
interface GigabitEthernet0/0.100
 encapsulation dot1Q 100
 ip address 192.168.100.1 255.255.255.0
 no shutdown
 exit

! Dynamic DHCP Pool for CS Dept (hosts .51 to .254)
ip dhcp excluded-address 192.168.10.1 192.168.10.50
ip dhcp pool POOL_CS
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.100.10
 exit

! Dynamic DHCP Pool for Library (hosts .51 to .254)
ip dhcp excluded-address 192.168.20.1 192.168.20.50
ip dhcp pool POOL_LIB
 network 192.168.20.0 255.255.255.0
 default-router 192.168.20.1
 dns-server 192.168.100.10
 exit

! Dynamic DHCP Pool for Admin (hosts .51 to .254)
ip dhcp excluded-address 192.168.30.1 192.168.30.50
ip dhcp pool POOL_ADMIN
 network 192.168.30.0 255.255.255.0
 default-router 192.168.30.1
 dns-server 192.168.100.10
 exit

end
write memory
```

---

### B. `Core-Dist-SW` Configuration
*(Carries 802.1Q trunk traffic between the router and all departments)*

```cisco
enable
configure terminal
hostname Core-Dist-SW

! Create campus VLANs
vlan 10
 name CS_Department
 exit
vlan 20
 name University_Library
 exit
vlan 30
 name Campus_Admin
 exit
vlan 100
 name Data_Center
 exit

! Configure Router Uplink as 802.1Q Trunk
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,100
 no shutdown
 exit

! Configure Downlink Trunks to Department Switches
interface range FastEthernet0/1 - 4
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,100
 no shutdown
 exit

end
write memory
```

---

### C. Department Access Switches

#### 1. `SW-CS` (Computer Science Dept — VLAN 10)
```cisco
enable
configure terminal
hostname SW-CS

vlan 10
 name CS_Department
 exit

! Trunk connection back to Core-Dist-SW
interface FastEthernet0/24
 switchport mode trunk
 no shutdown
 exit

! Access ports for CS lab workstations
interface range FastEthernet0/1 - 23
 switchport mode access
 switchport access vlan 10
 no shutdown
 exit

end
write memory
```

#### 2. `SW-LIB` (Library — VLAN 20)
```cisco
enable
configure terminal
hostname SW-LIB

vlan 20
 name University_Library
 exit

interface FastEthernet0/24
 switchport mode trunk
 no shutdown
 exit

interface range FastEthernet0/1 - 23
 switchport mode access
 switchport access vlan 20
 no shutdown
 exit

end
write memory
```

#### 3. `SW-ADMIN` (Administration — VLAN 30)
```cisco
enable
configure terminal
hostname SW-ADMIN

vlan 30
 name Campus_Admin
 exit

interface FastEthernet0/24
 switchport mode trunk
 no shutdown
 exit

interface range FastEthernet0/1 - 23
 switchport mode access
 switchport access vlan 30
 no shutdown
 exit

end
write memory
```

#### 4. `SW-SERVERS` (Data Center — VLAN 100)
```cisco
enable
configure terminal
hostname SW-SERVERS

vlan 100
 name Data_Center
 exit

interface FastEthernet0/24
 switchport mode trunk
 no shutdown
 exit

interface range FastEthernet0/1 - 23
 switchport mode access
 switchport access vlan 100
 no shutdown
 exit

end
write memory
```

---

### D. `Campus-DNS-Server` Configuration
Click on **`Campus-DNS-Server`** $\to$ **Desktop** tab $\to$ **IP Configuration**:
- **IP Address:** `192.168.100.10`
- **Subnet Mask:** `255.255.255.0`
- **Default Gateway:** `192.168.100.1`
- **DNS Server:** `192.168.100.10`

---

## 4. Save Your File
In Packet Tracer, click **File $\to$ Save As** and save it as:
`campusnet_backbone.pkt` inside the `packet-tracer/` folder of this project:
```text
campusnet/packet-tracer/campusnet_backbone.pkt
```
