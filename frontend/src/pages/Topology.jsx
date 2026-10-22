import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Cpu,
  Server,
  Laptop,
  HardDrive,
  RefreshCw,
  X,
  Scissors,
  Wrench,
  Table,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Play,
  Globe,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';

const BuildingNode = ({ data }) => {
  const isOffline = Boolean(data.isOffline);
  const isRerouted = !isOffline && Boolean(data.isRerouted);
  const isCut = Boolean(data.isCut);

  let borderColor = '#dfd8c8';
  let bgColor = 'rgba(255, 255, 255, 0.5)';
  let ringClasses = 'shadow-xs';

  if (isOffline) {
    borderColor = '#ef4444';
    bgColor = 'rgba(254, 242, 242, 0.75)';
    ringClasses = 'shadow-md shadow-rose-100 ring-2 ring-rose-400';
  } else if (isRerouted) {
    borderColor = '#f59e0b';
    bgColor = 'rgba(254, 243, 199, 0.35)';
    ringClasses = 'shadow-sm ring-2 ring-amber-300';
  }

  const getCleanName = () => {
    if (data.departmentId === 'dept-cs' || data.id === 'block-cs') return 'Computer Science';
    if (data.departmentId === 'dept-lib' || data.id === 'block-lib') return 'Library';
    if (data.departmentId === 'dept-admin' || data.id === 'block-admin') return 'Administration';
    if (data.departmentId === 'dept-dc' || data.id === 'block-dc') return 'Data Center';
    if (data.departmentId === 'core' || data.id === 'block-core') return 'Campus Core';
    if (data.departmentId === 'isp' || data.id === 'block-isp') return 'External Internet';
    return data.name;
  };

  return (
    <div
      style={{
        width: data.width || 480,
        height: data.height || 280,
        borderColor: borderColor,
        backgroundColor: bgColor,
      }}
      className={`rounded-2xl border-2 border-dashed transition-all duration-300 pointer-events-auto p-4 flex flex-col justify-between ${ringClasses}`}
    >
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#dfd8c8]/80">
        <div className="flex items-center space-x-2.5 min-w-0 flex-wrap gap-y-1">
          <h4 className="text-sm font-bold text-[#1e1c19] tracking-tight">
            {getCleanName()}
          </h4>
          {data.vlan > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8] font-mono font-semibold">
              VLAN {data.vlan}
            </span>
          )}
          {data.maxHosts && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-[#554f45] border border-[#dfd8c8] font-mono font-semibold">
              {data.currentHosts || 0}/{data.maxHosts} PCs
            </span>
          )}
          {isRerouted && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase tracking-tight">
              Failover: {data.nextHop}
            </span>
          )}
          {isOffline && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold uppercase tracking-tight">
              Offline
            </span>
          )}
        </div>

        {data.departmentId !== 'core' && data.departmentId !== 'isp' && (
          <div className="flex items-center shrink-0">
            <button
              onClick={() => data.onOpenAddModal(data.departmentId)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 border border-[#dfd8c8] hover:border-sky-300 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PC</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 pointer-events-none" />

      {isOffline ? (
        <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-[10px] text-rose-600 font-bold">
          <span className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>BLOCK OFFLINE (NO ROUTE TO OUTSIDE)</span>
          </span>
          <span className="font-mono">Packets Dropped</span>
        </div>
      ) : isRerouted ? (
        <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[10px] text-amber-800 font-semibold">
          <span className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-amber-600" />
            <span>FAILOVER ACTIVE (REROUTED VIA {String(data.nextHop).toUpperCase()})</span>
          </span>
          <span className="font-mono text-emerald-700 font-bold">Online via Failover</span>
        </div>
      ) : null}
    </div>
  );
};

const RouterNode = ({ data, selected }) => {
  const isIsp = data.label === 'ISP-Edge-Router';
  const isConnected = data.status !== 'offline';
  return (
    <div className="flex flex-col items-center group cursor-pointer relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
      <div
        className={`relative w-14 h-14 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${
          selected
            ? isIsp
              ? 'border-slate-800 ring-4 ring-slate-400/20 shadow-md scale-105'
              : 'border-indigo-600 ring-4 ring-indigo-500/20 shadow-md scale-105'
            : isIsp
            ? 'border-slate-600 hover:border-slate-800 hover:shadow-md'
            : 'border-indigo-500 hover:border-indigo-600 hover:shadow-md'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isIsp ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {isIsp ? <Globe className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
        </div>
        <span
          className={`absolute top-0 right-0 w-3 h-3 rounded-full ring-2 ring-white transition-colors duration-200 ${
            isConnected ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
          title={isConnected ? 'Connected to Main Router' : 'Disconnected: No connection to Main Router'}
        />
      </div>

      <div className="mt-1.5 text-center pointer-events-none">
        <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
          {data.label}
        </div>
        <div
          className={`text-[9px] font-mono font-medium ${
            isIsp ? 'text-slate-600' : 'text-indigo-700'
          }`}
        >
          {isIsp ? 'Outside Internet Gateway' : 'Core Router 2911'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
    </div>
  );
};

const SwitchNode = ({ data, selected }) => {
  const isConnected = data.status !== 'offline';
  return (
    <div className="flex flex-col items-center group cursor-pointer relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
      <div
        className={`relative w-16 h-11 rounded-lg bg-white border-2 flex items-center justify-between px-2 transition-all duration-200 shadow-sm ${
          selected
            ? 'border-sky-600 ring-4 ring-sky-500/20 shadow-md scale-105'
            : 'border-sky-500 hover:border-sky-600 hover:shadow-md'
        }`}
      >
        <div className="flex items-center space-x-1 text-sky-600">
          <Server className="w-5 h-5" />
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex space-x-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
          </div>
          <div className="flex space-x-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      <div className="mt-1.5 text-center pointer-events-none">
        <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
          {data.label}
        </div>
        <div className="text-[9px] font-mono text-sky-700 font-medium">
          2960-24TT Switch
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
    </div>
  );
};

const HostNode = ({ data, selected }) => {
  const isConnected = data.status !== 'offline';
  return (
    <div className="flex flex-col items-center group cursor-pointer relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
      <div
        className={`relative w-12 h-12 rounded-xl bg-white border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${
          selected
            ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md scale-105'
            : 'border-emerald-500 hover:border-emerald-600 hover:shadow-md'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Laptop className="w-5 h-5" />
        </div>
        <span
          className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-1 ring-white transition-colors duration-200 ${
            isConnected ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
          title={isConnected ? 'Connected to Main Router' : 'Disconnected: No connection to Main Router'}
        />
      </div>

      <div className="mt-1.5 text-center pointer-events-none">
        <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
          {data.label}
        </div>
        <div className="text-[9px] font-mono text-emerald-700 font-medium">
          {data.ip || 'DHCP Host'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
    </div>
  );
};

const ServerNode = ({ data, selected }) => {
  const isConnected = data.status !== 'offline';
  return (
    <div className="flex flex-col items-center group cursor-pointer relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
      <div
        className={`relative w-12 h-14 rounded-xl bg-white border-2 flex flex-col items-center justify-center transition-all duration-200 shadow-sm ${
          selected
            ? 'border-amber-600 ring-4 ring-amber-500/20 shadow-md scale-105'
            : 'border-amber-500 hover:border-amber-600 hover:shadow-md'
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-0.5">
          <HardDrive className="w-4 h-4" />
        </div>
        <div className="flex space-x-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
        </div>
      </div>

      <div className="mt-1.5 text-center pointer-events-none">
        <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
          {data.label}
        </div>
        <div className="text-[9px] font-mono text-amber-700 font-medium">
          {data.label === 'Campus-DHCP-Server'
            ? '.100.20 DHCP'
            : data.label === 'Admin-Portal-Server'
            ? '.30.20 Web ERP'
            : '.100.10 DNS'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
      />
    </div>
  );
};

const nodeTypes = {
  buildingNode: BuildingNode,
  routerNode: RouterNode,
  switchNode: SwitchNode,
  hostNode: HostNode,
  serverNode: ServerNode,
};

export const Topology = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cutDepartments, setCutDepartments] = useState([]);
  const [cutEdges, setCutEdges] = useState([]);
  const [routesDrawerOpen, setRoutesDrawerOpen] = useState(false);
  const [routesData, setRoutesData] = useState({ tables: [], routes: [], history: [], raw: '' });
  const [routesLoading, setRoutesLoading] = useState(false);
  const [bannerAlert, setBannerAlert] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState('dept-cs');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const [deletingDevice, setDeletingDevice] = useState(false);

  const handleOpenAddModal = (deptId) => {
    const blockNode = nodes.find(
      (n) => n.id === (deptId.startsWith('block-') ? deptId : deptId.replace('dept-', 'block-'))
    );
    const curr = blockNode?.data?.currentHosts || 0;
    const maxH = blockNode?.data?.maxHosts || 30;

    if (curr >= maxH) {
      setBannerAlert({
        type: 'error',
        message: `[CAPACITY EXCEEDED] Cannot add workstation to ${blockNode?.data?.name || deptId}! Subnet limit reached (${curr}/${maxH} PCs max). Increase capacity in Dashboard to allocate more hosts.`,
      });
      return;
    }

    setTargetDeptId(deptId);
    const prefix = deptId === 'dept-cs' ? 'CS-PC' : deptId === 'dept-lib' ? 'LIB-PC' : 'ADMIN-PC';
    setNewDeviceName(`${prefix}-0${Math.floor(Math.random() * 80) + 10}`);
    setAddModalOpen(true);
  };

  const loadTopology = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTopology();
      const cutList = data.cutDepartments || [];
      const edgeCutList = data.cutEdges || [];
      setCutDepartments(cutList);
      setCutEdges(edgeCutList);

      const buildingNodes = (data.buildings || []).map((b) => ({
        id: b.id,
        type: 'buildingNode',
        position: { x: b.x, y: b.y },
        selectable: false,
        draggable: false,
        zIndex: -1,
        data: {
          ...b,
          isCut: cutList.includes(b.departmentId),
          onToggleLink: handleToggleLink,
          onOpenAddModal: handleOpenAddModal,
        },
      }));

      const deviceNodes = (data.nodes || []).map((n) => ({
        ...n,
        draggable: false,
      }));

      setNodes([...buildingNodes, ...deviceNodes]);
      setEdges(data.edges || []);
    } catch (e) {
      console.error('Failed to load topology', e);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true);
    try {
      const res = await api.getRouterRoutes();
      setRoutesData(res);
    } catch (e) {
      console.error('Failed to load routes', e);
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  const handleToggleLink = async (departmentId) => {
    try {
      const res = await api.toggleLink(departmentId);
      if (res.success) {
        if (res.isCut) {
          const reach = res.reachability?.[departmentId];
          if (reach?.isOffline) {
            setBannerAlert({
              type: 'error',
              message: `[BLOCK OFFLINE] Physical uplink severed for ${reach?.name || departmentId.toUpperCase()}. No route to external gateway exists, block is completely isolated!`,
              departmentId,
            });
          } else if (reach?.isRerouted) {
            setBannerAlert({
              type: 'warning',
              message: `[FAILOVER ACTIVE] Direct uplink severed for ${reach?.name || departmentId.toUpperCase()}. Traffic rerouted to external gateway via ${reach.nextHop}. Block remains online.`,
              departmentId,
            });
          } else {
            setBannerAlert({
              type: 'warning',
              message: `Physical uplink severed for ${departmentId.toUpperCase()}. Link is DOWN.`,
              departmentId,
            });
          }
        } else {
          setBannerAlert({
            type: 'success',
            message: `Physical uplink restored for ${departmentId.toUpperCase()}. Direct core routing re-established.`,
            departmentId,
          });
        }
        await loadTopology();
        await loadRoutes();
      }
    } catch (e) {
      console.error('Failed to toggle link', e);
    }
  };

  const handleToggleEdge = async (edgeId) => {
    try {
      const edge = edges.find((e) => e.id === edgeId) || selectedEdge;
      const res = await api.toggleLink({ edgeId });
      if (res.success) {
        const isNowCut = res.isCut;
        if (isNowCut) {
          const reach = res.reachability || {};
          const offlineBlocks = Object.entries(reach).filter(
            ([k, v]) => v.isOffline && k !== 'isp'
          );
          const reroutedBlocks = Object.entries(reach).filter(
            ([k, v]) => v.isRerouted
          );

          if (edgeId === 'link-Campus-Core-Router-ISP-Edge-Router') {
            setBannerAlert({
              type: 'error',
              message: '[CAMPUS WAN OUTAGE] External ISP internet gateway severed. All campus blocks are offline from the outside world!',
            });
          } else if (offlineBlocks.length > 0) {
            const firstOffline = offlineBlocks[0][1];
            setBannerAlert({
              type: 'error',
              message: `[BLOCK OFFLINE] ${firstOffline.name} has lost all reachability to the outside world (${firstOffline.reason})!`,
            });
          } else if (reroutedBlocks.length > 0) {
            const firstRerouted = reroutedBlocks[0][1];
            setBannerAlert({
              type: 'warning',
              message: `[FAILOVER ACTIVE] Direct link cut. Traffic for ${firstRerouted.name} rerouted to external gateway via ${firstRerouted.nextHop}. Block remains online.`,
            });
          } else {
            setBannerAlert({
              type: 'warning',
              message: `Physical carrier severed: ${edge?.categoryLabel || edgeId}. Link is DOWN.`,
            });
          }
        } else {
          setBannerAlert({
            type: 'success',
            message: `Physical carrier restored: ${edge?.categoryLabel || edgeId}. Link is UP.`,
          });
        }
        await loadTopology();
        await loadRoutes();
        if (selectedEdge && selectedEdge.id === edgeId) {
          setSelectedEdge((prev) => (prev ? { ...prev, isCut: isNowCut } : null));
        }
      }
    } catch (e) {
      console.error('Failed to toggle edge', e);
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setAddingDevice(true);
    try {
      const res = await api.addDevice({
        name: newDeviceName.trim(),
        departmentId: targetDeptId,
        allocationType: 'DHCP',
      });
      if (res.success) {
        setAddModalOpen(false);
        setNewDeviceName('');
        await loadTopology();
      } else {
        setBannerAlert({
          type: 'error',
          message: res.error || 'Failed to create device',
        });
        setAddModalOpen(false);
      }
    } catch (err) {
      setBannerAlert({
        type: 'error',
        message: `Error creating device: ${err.message}`,
      });
      setAddModalOpen(false);
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (name) => {
    if (!window.confirm(`Are you sure you want to remove workstation '${name}' from Cisco Packet Tracer?`)) return;

    setDeletingDevice(true);
    try {
      const res = await api.deleteDevice(name);
      if (res.success) {
        setSelectedNode(null);
        await loadTopology();
        setBannerAlert({
          type: 'success',
          message: `Workstation '${name}' successfully removed from Cisco Packet Tracer canvas.`,
        });
      } else {
        alert(res.error || 'Failed to delete device');
      }
    } catch (err) {
      alert(`Error deleting device: ${err.message}`);
    } finally {
      setDeletingDevice(false);
    }
  };

  const handleQuickPing = async (sourceName, targetIp) => {
    setPingRunning(true);
    setPingResult(null);
    try {
      const res = await api.simulatePing(sourceName, targetIp);
      setPingResult(res);
    } catch (err) {
      setPingResult({ success: false, output: err.message });
    } finally {
      setPingRunning(false);
    }
  };

  useEffect(() => {
    loadTopology();
    loadRoutes();
  }, [loadTopology, loadRoutes]);

  const onNodeClick = (_, node) => {
    if (node.type !== 'buildingNode') {
      setRoutesDrawerOpen(false);
      setSelectedEdge(null);
      setSelectedNode(node);
      setPingResult(null);
    }
  };

  const onEdgeClick = (_, edge) => {
    setRoutesDrawerOpen(false);
    setSelectedNode(null);
    setSelectedEdge(edge);
    setPingResult(null);
  };

  const onPaneClick = () => {
    setRoutesDrawerOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const activePathEdges = useMemo(() => {
    if (!selectedNode) return new Set();
    const selId = selectedNode.id;
    const paths = new Set();

    const adj = new Map();
    edges.forEach((e) => {
      if (e.isCut) return;
      if (!adj.has(e.source)) adj.set(e.source, []);
      if (!adj.has(e.target)) adj.set(e.target, []);
      adj.get(e.source).push({ next: e.target, edgeId: e.id });
      adj.get(e.target).push({ next: e.source, edgeId: e.id });
    });

    const queue = [[selId, []]];
    const visited = new Set([selId]);
    let targetEdgeIds = null;

    while (queue.length > 0) {
      const [curr, edgeIds] = queue.shift();
      if (curr === 'ISP-Edge-Router') {
        targetEdgeIds = edgeIds;
        break;
      }
      const neighbors = adj.get(curr) || [];
      for (const { next, edgeId } of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([next, [...edgeIds, edgeId]]);
        }
      }
    }

    if (targetEdgeIds && targetEdgeIds.length > 0) {
      targetEdgeIds.forEach((id) => paths.add(id));
    } else {
      edges.forEach((e) => {
        if (e.source === selId || e.target === selId) paths.add(e.id);
      });
    }

    return paths;
  }, [selectedNode, edges]);

  const styledEdges = useMemo(() => {
    return edges.map((e) => {
      const isSelected = selectedEdge && selectedEdge.id === e.id;
      const isHighlighted = activePathEdges.has(e.id);

      if (e.isCut) {
        return {
          ...e,
          type: 'straight',
          label: '[SEVERED]',
          labelStyle: { fill: '#b91c1c', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#fee2e2', stroke: '#fca5a5', strokeWidth: 1, rx: 4, ry: 4 },
          labelBgPadding: [6, 2],
          style: isSelected
            ? { stroke: '#ef4444', strokeWidth: 4, strokeDasharray: '6,6' }
            : { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '6,6' },
        };
      }

      if (isSelected) {
        return {
          ...e,
          type: 'straight',
          label: null,
          style: { stroke: '#6366f1', strokeWidth: 4 },
          animated: true,
        };
      }

      if (selectedNode) {
        if (isHighlighted) {
          return {
            ...e,
            type: 'straight',
            label: null,
            style: { stroke: '#4f46e5', strokeWidth: 3.5 },
            animated: true,
          };
        }
        return {
          ...e,
          type: 'straight',
          label: null,
          style: { stroke: '#d6cfc4', strokeWidth: 1.5, opacity: 0.5 },
          animated: false,
        };
      }

      return {
        ...e,
        type: 'straight',
        label: null,
        style: { stroke: '#827666', strokeWidth: 2 },
        animated: false,
      };
    });
  }, [edges, selectedNode, selectedEdge, activePathEdges]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-3">
      {bannerAlert && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${
            bannerAlert.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : bannerAlert.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-2 font-medium">
            {bannerAlert.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : bannerAlert.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{bannerAlert.message}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setBannerAlert(null)}
              className="text-[#706b63] hover:text-[#1e1c19]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-[#fdfcf9] rounded-2xl border-2 border-[#cfc6b6] shadow-[0_12px_40px_-8px_rgba(40,32,24,0.18),0_2px_8px_rgba(40,32,24,0.06)] overflow-hidden flex">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#fcfbfa]"
          >
            <Background color="#827666" gap={24} size={1.2} />
            <Controls
              showInteractive={false}
              className="!bg-white !border-[#dfd8c8] !text-[#1e1c19] fill-[#1e1c19] !shadow-sm"
            >
              <ControlButton
                onClick={loadTopology}
                disabled={loading}
                title="Resync with Packet Tracer"
                className="!order-first !flex !items-center !justify-center hover:!bg-[#eae4d8]"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#1e1c19] ${loading ? 'animate-spin' : ''}`} />
              </ControlButton>
            </Controls>
          </ReactFlow>
        </div>

        {routesDrawerOpen ? (
          <aside className="w-96 min-w-96 max-w-96 shrink-0 bg-[#f4f0e8] border-l border-[#dfd8c8] p-5 flex flex-col justify-between overflow-hidden z-10 shadow-lg">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8]">
                <div className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-bold text-[#1e1c19] text-base">
                      Campus Routing Tables
                    </h3>
                    <p className="text-[11px] text-[#706b63] font-mono">
                      Bellman-Ford Distance Vector Algorithm
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadRoutes}
                    disabled={routesLoading}
                    className="p-1.5 text-[#706b63] hover:text-[#1e1c19] rounded hover:bg-[#eae4d8] transition"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${routesLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => setRoutesDrawerOpen(false)}
                    className="text-[#706b63] hover:text-[#1e1c19] p-1 rounded hover:bg-[#eae4d8] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1 font-mono">
                {(routesData.tables || []).map((tbl) => (
                  <div key={tbl.router} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <h4 className="font-bold text-sm text-[#1e1c19] tracking-tight">
                        {tbl.router}
                      </h4>
                    </div>

                    <div className="border border-[#dfd8c8] rounded-lg overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left text-xs text-[#1e1c19]">
                        <thead className="bg-[#eae4d8] text-[#554f45] text-[10px] uppercase font-semibold border-b border-[#dfd8c8]">
                          <tr>
                            <th className="px-2.5 py-2 font-mono">Destination</th>
                            <th className="px-2 py-2 text-center font-mono">Distance</th>
                            <th className="px-2.5 py-2 font-mono">Next Hop</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dfd8c8] font-mono">
                          {tbl.routes.map((r, i) => (
                            <tr key={i} className="hover:bg-[#f7f4ed]">
                              <td className="px-2.5 py-2 font-semibold text-[#1e1c19] text-[11px] truncate">
                                {r.destination}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-[#1e1c19] text-xs">
                                {r.distance}
                              </td>
                              <td className="px-2.5 py-2 text-[11px] text-[#554f45] truncate">
                                {r.nextHop}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : selectedNode ? (
          <aside className="w-96 min-w-96 max-w-96 shrink-0 bg-[#f4f0e8] border-l border-[#dfd8c8] p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-lg">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7266] font-semibold">
                    DEVICE INSPECTOR
                  </span>
                  <h3 className="text-xl font-bold text-[#1e1c19] tracking-tight mt-0.5">
                    {selectedNode.data?.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[#706b63] hover:text-[#1e1c19] p-1 rounded hover:bg-[#eae4d8] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5 text-xs font-mono">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                    HARDWARE SPECIFICATION
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Device Role</span>
                      <span className="text-[#1e1c19] font-bold capitalize">
                        {selectedNode.data?.kind}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Cisco Model</span>
                      <span className="text-[#1e1c19] font-semibold">
                        {selectedNode.data?.model}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#dfd8c8]" />

                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                    IPV4 CONFIGURATION
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">IP Address</span>
                      <span className="text-indigo-800 font-bold">
                        {selectedNode.data?.ip}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Subnet Mask</span>
                      <span className="text-[#1e1c19]">
                        {selectedNode.data?.subnet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Default Gateway</span>
                      <span className="text-[#1e1c19]">
                        {selectedNode.data?.gateway}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">VLAN ID</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                        VLAN {selectedNode.data?.vlan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Allocation</span>
                      <span className="text-[#1e1c19]">
                        {selectedNode.data?.ipMode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Link Status</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          selectedNode.data?.status !== 'offline'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {selectedNode.data?.status !== 'offline' ? 'ONLINE (ACTIVE)' : 'OFFLINE (NO ROUTE)'}
                      </span>
                    </div>
                  </div>
                </div>

                {(selectedNode.data?.kind === 'host' || selectedNode.data?.kind === 'pc' || selectedNode.type === 'hostNode') && (
                  <>
                    <div className="border-t border-[#dfd8c8]" />
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                        DIAGNOSTIC CONNECTIVITY TESTS
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleQuickPing(selectedNode.data?.label, '192.168.100.10')}
                          disabled={pingRunning}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                        >
                          <Play className={`w-3.5 h-3.5 ${pingRunning ? 'animate-spin' : ''}`} />
                          <span>Ping Campus Server (.100.10)</span>
                        </button>

                        <button
                          onClick={() => handleQuickPing(selectedNode.data?.label, '8.8.8.8')}
                          disabled={pingRunning}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                        >
                          <Globe className={`w-3.5 h-3.5 ${pingRunning ? 'animate-spin' : ''}`} />
                          <span>Ping Outside Internet (8.8.8.8)</span>
                        </button>

                        {pingResult && (
                          <div
                            className={`p-2 rounded text-[11px] font-mono border ${
                              pingResult.success
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <span className="font-bold">
                              {pingResult.success ? 'ICMP Success (0% Loss)' : 'Ping Failed (Dropped)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {selectedNode.data?.kind === 'router' && (
                  <>
                    <div className="border-t border-[#dfd8c8]" />
                    <div>
                      <button
                        onClick={() => {
                          setRoutesDrawerOpen(true);
                          loadRoutes();
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>View Campus Routing Tables</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {(selectedNode.data?.kind === 'host' || selectedNode.data?.kind === 'pc' || selectedNode.type === 'hostNode') && (
              <div className="pt-4 border-t border-[#dfd8c8]">
                <button
                  onClick={() => handleDeleteDevice(selectedNode.data?.label)}
                  disabled={deletingDevice}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-300 transition shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingDevice ? 'Deleting...' : 'Delete Workstation'}</span>
                </button>
              </div>
            )}
          </aside>
        ) : selectedEdge ? (
          <aside className="w-96 min-w-96 max-w-96 shrink-0 bg-[#f4f0e8] border-l border-[#dfd8c8] p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-lg">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7266] font-semibold">
                    CABLE INSPECTOR
                  </span>
                  <h3 className="text-sm font-bold text-[#1e1c19] tracking-tight mt-0.5 truncate">
                    {selectedEdge.categoryLabel || selectedEdge.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-[#706b63] hover:text-[#1e1c19] p-1 rounded hover:bg-[#eae4d8] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5 text-xs font-mono">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                    LINK ENDPOINTS
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#706b63]">Endpoint A</span>
                      <span className="text-[#1e1c19] font-bold">{selectedEdge.source}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#706b63]">
                      <span>Port</span>
                      <span className="text-indigo-800 font-semibold">{selectedEdge.portA || 'Auto'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#706b63]">Endpoint B</span>
                      <span className="text-[#1e1c19] font-bold">{selectedEdge.target}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#706b63]">
                      <span>Port</span>
                      <span className="text-indigo-800 font-semibold">{selectedEdge.portB || 'Auto'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#dfd8c8]" />

                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                    PHYSICAL CARRIER STATE
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Status</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedEdge.isCut
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {selectedEdge.isCut ? 'SEVERED (NO CARRIER)' : 'ACTIVE (CONNECTED)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Category</span>
                      <span className="text-[#1e1c19] capitalize font-sans text-[11px]">
                        {selectedEdge.category ? selectedEdge.category.replace('_', ' ') : 'Network Link'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEdge.impact && (
                  <>
                    <div className="border-t border-[#dfd8c8]" />
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold">
                        TOPOLOGICAL IMPACT
                      </div>
                      <div className="text-[11px] text-[#554f45] font-sans leading-relaxed">
                        {selectedEdge.impact}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  {selectedEdge.isCut ? (
                    <button
                      onClick={() => handleToggleEdge(selectedEdge.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xs"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Repair Cable (Restore Carrier)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleEdge(selectedEdge.id)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <Scissors className="w-4 h-4" />
                      <span>Cut Cable (Sever Link)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        ) : null}

        {addModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-[#f4f0e8] border border-[#dfd8c8] rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8] mb-4">
                <h3 className="font-bold text-[#1e1c19] text-base">
                  Spawn Workstation PC
                </h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="text-[#706b63] hover:text-[#1e1c19]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1e1c19] mb-1 font-mono">
                    Device Hostname
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full bg-white border border-[#dfd8c8] rounded-lg px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. CS-PC-02"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1e1c19] font-mono">
                      Department Zone
                    </label>
                    {(() => {
                      const b = nodes.find(
                        (n) => n.id === (targetDeptId.startsWith('block-') ? targetDeptId : targetDeptId.replace('dept-', 'block-'))
                      );
                      const curr = b?.data?.currentHosts || 0;
                      const maxH = b?.data?.maxHosts || 30;
                      return (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#eae4d8] text-[#554f45]">
                          {curr} / {maxH} PCs
                        </span>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    disabled
                    value={targetDeptId.toUpperCase()}
                    className="w-full bg-[#eae4d8] border border-[#dfd8c8] rounded-lg px-3 py-2 text-sm text-[#554f45] font-mono"
                  />
                  <p className="text-[11px] text-[#706b63] mt-1 font-mono">
                    Auto-wires to department switch with dynamic DHCP lease from Campus-DHCP-Server.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-3 py-1.5 bg-white border border-[#dfd8c8] text-[#1e1c19] rounded-lg text-xs font-medium hover:bg-[#eae4d8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingDevice}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    {addingDevice ? 'Spawning in Packet Tracer...' : 'Spawn PC'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
