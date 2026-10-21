import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
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
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { api } from '../services/api';

const BuildingNode = ({ data }) => {
  const isCut = data.isCut;
  return (
    <div
      style={{
        width: data.width || 380,
        height: data.height || 280,
        borderColor: isCut ? '#ef4444' : '#dfd8c8',
        backgroundColor: isCut ? 'rgba(254, 242, 242, 0.75)' : 'rgba(255, 255, 255, 0.5)',
      }}
      className={`rounded-2xl border-2 border-dashed transition-all duration-300 pointer-events-auto p-4 flex flex-col justify-between ${
        isCut ? 'shadow-md shadow-rose-100 ring-2 ring-rose-300' : 'shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#dfd8c8]/80 whitespace-nowrap">
        <div className="flex items-center space-x-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <h4 className="text-xs font-bold text-[#1e1c19] tracking-tight truncate">
            {data.name}
          </h4>
          <span className="text-[10px] font-mono text-[#706b63]">
            {data.subnet}
          </span>
          {data.vlan > 0 && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8] font-semibold">
              VLAN {data.vlan}
            </span>
          )}
        </div>

        {data.departmentId !== 'core' && data.departmentId !== 'isp' && (
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => data.onOpenAddModal(data.departmentId)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 border border-[#dfd8c8] hover:border-sky-300 text-[11px] font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PC</span>
            </button>

            <button
              onClick={() => data.onToggleLink(data.departmentId)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                isCut
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-white hover:bg-rose-50 text-[#706b63] hover:text-rose-600 border-[#dfd8c8] hover:border-rose-300'
              }`}
            >
              {isCut ? (
                <>
                  <Wrench className="w-3 h-3" />
                  <span>Repair</span>
                </>
              ) : (
                <>
                  <Scissors className="w-3 h-3" />
                  <span>Cut</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 pointer-events-none" />

      {isCut && (
        <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-[10px] text-rose-600 font-bold">
          <span className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>LINK SEVERED (OUTAGE)</span>
          </span>
          <span>Packets Dropped</span>
        </div>
      )}
    </div>
  );
};

const RouterNode = ({ data, selected }) => {
  const isIsp = data.label === 'ISP-Edge-Router';
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
        <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
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

const SwitchNode = ({ data, selected }) => (
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex space-x-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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

const HostNode = ({ data, selected }) => (
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
      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
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

const ServerNode = ({ data, selected }) => (
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
        <span className="w-1 h-1 rounded-full bg-emerald-500" />
        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
      </div>
    </div>

    <div className="mt-1.5 text-center pointer-events-none">
      <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
        {data.label}
      </div>
      <div className="text-[9px] font-mono text-amber-700 font-medium">
        .100.10 DNS
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="!top-1/2 !left-1/2 !transform -translate-x-1/2 -translate-y-1/2 !w-1 !h-1 !opacity-0 !pointer-events-none"
    />
  </div>
);

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
  const [loading, setLoading] = useState(false);
  const [cutDepartments, setCutDepartments] = useState([]);
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
      setCutDepartments(cutList);

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
          setBannerAlert({
            type: 'error',
            message: `Physical uplink severed for ${departmentId.toUpperCase()}! Subnet isolated from Inter-VLAN routing.`,
            departmentId,
          });
        } else {
          setBannerAlert({
            type: 'success',
            message: `Physical uplink restored for ${departmentId.toUpperCase()}. Inter-VLAN routing re-established.`,
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
        alert(res.error || 'Failed to create device');
      }
    } catch (err) {
      alert(`Error creating device: ${err.message}`);
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (name) => {
    if (!confirm(`Are you sure you want to remove '${name}' from Cisco Packet Tracer?`)) return;

    setDeletingDevice(true);
    try {
      const res = await api.deleteDevice(name);
      if (res.success) {
        setSelectedNode(null);
        await loadTopology();
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
      setSelectedNode(node);
      setPingResult(null);
    }
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
      const isHighlighted = activePathEdges.has(e.id);
      if (e.isCut) {
        return {
          ...e,
          type: 'straight',
          label: '[SEVERED]',
          style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '6,6' },
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
  }, [edges, selectedNode, activePathEdges]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between bg-[#f4f0e8] p-4 rounded-xl border border-[#dfd8c8] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#1e1c19] flex items-center space-x-2">
            <span>Enterprise Campus Network Interconnect</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8] font-mono">
              3-Tier Architecture
            </span>
            {cutDepartments.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 rounded-full flex items-center space-x-1 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{cutDepartments.length} Link Severed</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-[#706b63]">
            Multi-building topology, external ISP transit gateway, and Cisco Packet Tracer live synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setRoutesDrawerOpen(true);
              loadRoutes();
            }}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-[#eae4d8] text-[#1e1c19] rounded-lg text-sm font-medium border border-[#dfd8c8] shadow-xs transition"
          >
            <Table className="w-4 h-4 text-indigo-600" />
            <span>Campus Routing Tables</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-xs font-semibold font-mono">
              {(routesData.tables || []).length || 6} Routers
            </span>
          </button>

          <button
            onClick={loadTopology}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-[#eae4d8] text-[#1e1c19] rounded-lg text-sm font-medium border border-[#dfd8c8] shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 text-[#706b63] ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {bannerAlert && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${
            bannerAlert.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-2 font-medium">
            {bannerAlert.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{bannerAlert.message}</span>
          </div>

          <div className="flex items-center space-x-3">
            {bannerAlert.type === 'error' && (
              <button
                onClick={() => handleToggleLink(bannerAlert.departmentId)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center space-x-1 shadow-xs"
              >
                <Wrench className="w-3 h-3" />
                <span>Repair Cable</span>
              </button>
            )}
            <button
              onClick={() => setBannerAlert(null)}
              className="text-[#706b63] hover:text-[#1e1c19]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-[#f7f4ed] rounded-xl border border-[#dfd8c8] overflow-hidden shadow-xs flex">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#f7f4ed]"
          >
            <Background color="#827666" gap={24} size={1.2} />
            <Controls
              showInteractive={false}
              className="!bg-white !border-[#dfd8c8] !text-[#1e1c19] fill-[#1e1c19] !shadow-sm"
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <aside className="w-84 min-w-84 bg-[#f4f0e8] border-l border-[#dfd8c8] p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-lg">
            <div>
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
                  className="text-[#706b63] hover:text-[#1e1c19] p-1 rounded hover:bg-[#eae4d8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold mb-1">
                    HARDWARE SPECIFICATION
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#dfd8c8] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#706b63]">Device Role</span>
                      <span className="text-[#1e1c19] font-bold capitalize">
                        {selectedNode.data?.kind}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#706b63]">Cisco Model</span>
                      <span className="text-[#1e1c19] font-semibold">
                        {selectedNode.data?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#706b63]">Academic Zone</span>
                      <span className="text-[#1e1c19]">
                        {selectedNode.data?.block || 'Campus Core'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold mb-1">
                    IPV4 CONFIGURATION
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#dfd8c8] space-y-1.5">
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
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                        VLAN {selectedNode.data?.vlan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#706b63]">Allocation</span>
                      <span className="text-[#1e1c19]">
                        {selectedNode.data?.ipMode}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedNode.data?.kind === 'host' && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#7a7266] font-semibold mb-1">
                      DIAGNOSTIC CONNECTIVITY TESTS
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#dfd8c8] space-y-2">
                      <button
                        onClick={() => handleQuickPing(selectedNode.data?.label, '192.168.100.10')}
                        disabled={pingRunning}
                        className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <Play className={`w-3.5 h-3.5 ${pingRunning ? 'animate-spin' : ''}`} />
                        <span>Ping Campus Server (.100.10)</span>
                      </button>

                      <button
                        onClick={() => handleQuickPing(selectedNode.data?.label, '8.8.8.8')}
                        disabled={pingRunning}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
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
                )}

                {selectedNode.data?.kind === 'router' && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setRoutesDrawerOpen(true);
                        loadRoutes();
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>View Campus Routing Tables</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#dfd8c8] flex items-center justify-between">
              {selectedNode.data?.kind === 'host' ? (
                <button
                  onClick={() => handleDeleteDevice(selectedNode.data?.label)}
                  disabled={deletingDevice}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold border border-rose-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingDevice ? 'Deleting...' : 'Delete PC'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-[#706b63] font-mono">Infrastructure Node</span>
              )}

              <button
                onClick={() => setSelectedNode(null)}
                className="px-3 py-1.5 bg-white hover:bg-[#eae4d8] border border-[#dfd8c8] text-[#1e1c19] rounded text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </aside>
        )}

        {routesDrawerOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-[520px] bg-[#f4f0e8] border border-[#dfd8c8] rounded-xl p-5 shadow-2xl z-20 flex flex-col justify-between">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8]">
                <div className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-bold text-[#1e1c19] text-base">
                      Campus Routing Tables
                    </h3>
                    <p className="text-[11px] text-[#706b63] font-mono">
                      Distance-Vector Forwarding State
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
                    className="text-[#706b63] hover:text-[#1e1c19] p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 font-mono">
                {(routesData.tables || []).map((tbl) => (
                  <div
                    key={tbl.router}
                    className="bg-white border border-[#dfd8c8] rounded-xl p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#dfd8c8] pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <h4 className="font-bold text-sm text-[#1e1c19] tracking-tight">
                          {tbl.router}
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#706b63] font-sans">
                        {tbl.role}
                      </span>
                    </div>

                    <div className="border border-[#dfd8c8] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs text-[#1e1c19]">
                        <thead className="bg-[#eae4d8] text-[#554f45] text-[10px] uppercase font-semibold border-b border-[#dfd8c8]">
                          <tr>
                            <th className="px-3 py-2 font-mono">Destination Router</th>
                            <th className="px-3 py-2 text-center font-mono">Distance</th>
                            <th className="px-3 py-2 font-mono">Next Hop</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dfd8c8] font-mono">
                          {tbl.routes.map((r, i) => (
                            <tr key={i} className="hover:bg-[#f7f4ed]">
                              <td className="px-3 py-2 font-semibold text-[#1e1c19]">
                                {r.destination}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.distance === 0
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : r.distance === 1
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                      : r.distance === 'Unreachable'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  {r.distance}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-[#554f45]">
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

            <div className="pt-3 border-t border-[#dfd8c8] text-[11px] text-[#706b63] flex justify-between items-center font-mono">
              <span>Dynamic Routing Engine Active</span>
              <button
                onClick={() => setRoutesDrawerOpen(false)}
                className="px-3 py-1 bg-white hover:bg-[#eae4d8] border border-[#dfd8c8] text-[#1e1c19] rounded text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

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
                  <label className="block text-xs font-semibold text-[#1e1c19] mb-1 font-mono">
                    Department Zone
                  </label>
                  <input
                    type="text"
                    disabled
                    value={targetDeptId.toUpperCase()}
                    className="w-full bg-[#eae4d8] border border-[#dfd8c8] rounded-lg px-3 py-2 text-sm text-[#554f45] font-mono"
                  />
                  <p className="text-[11px] text-[#706b63] mt-1 font-mono">
                    Auto-wires to department switch with DHCP IP lease.
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
