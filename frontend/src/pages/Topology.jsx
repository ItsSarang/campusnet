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
} from 'lucide-react';
import { api } from '../services/api';

const BuildingNode = ({ data }) => {
  const isCut = data.isCut;
  return (
    <div
      style={{
        width: data.width || 360,
        height: data.height || 260,
        borderColor: isCut ? '#ef4444' : '#dfd8c8',
        backgroundColor: isCut ? 'rgba(254, 242, 242, 0.75)' : 'rgba(255, 255, 255, 0.5)',
      }}
      className={`rounded-2xl border-2 border-dashed transition-all duration-300 pointer-events-auto p-4 flex flex-col justify-between ${
        isCut ? 'shadow-md shadow-rose-100 ring-2 ring-rose-300' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#dfd8c8]/80">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <div>
            <h4 className="text-xs font-bold text-[#1e1c19] tracking-tight">
              {data.name}
            </h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-[#706b63]">
                {data.subnet}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8] font-semibold">
                VLAN {data.vlan}
              </span>
            </div>
          </div>
        </div>

        {data.departmentId !== 'core' && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => data.onOpenAddModal(data.departmentId)}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 border border-[#dfd8c8] hover:border-sky-300 text-[11px] font-semibold shadow-xs transition"
              title="Add Workstation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PC</span>
            </button>

            <button
              onClick={() => data.onToggleLink(data.departmentId)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-semibold border transition ${
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

const RouterNode = ({ data, selected }) => (
  <div className="flex flex-col items-center group cursor-pointer">
    <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-2 !h-2" />
    <div
      className={`relative w-14 h-14 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${
        selected
          ? 'border-indigo-600 ring-4 ring-indigo-500/20 shadow-md scale-105'
          : 'border-indigo-500 hover:border-indigo-600 hover:shadow-md'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
        <Cpu className="w-6 h-6" />
      </div>
      <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
    </div>

    <div className="mt-1.5 text-center pointer-events-none">
      <div className="text-[11px] font-bold text-[#1e1c19] tracking-tight whitespace-nowrap">
        {data.label}
      </div>
      <div className="text-[9px] font-mono text-indigo-700 font-medium">
        Core Router 2911
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-2 !h-2" />
  </div>
);

const SwitchNode = ({ data, selected }) => (
  <div className="flex flex-col items-center group cursor-pointer">
    <Handle type="target" position={Position.Top} className="!bg-sky-600 !w-2 !h-2" />
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
    <Handle type="source" position={Position.Bottom} className="!bg-sky-600 !w-2 !h-2" />
  </div>
);

const HostNode = ({ data, selected }) => (
  <div className="flex flex-col items-center group cursor-pointer">
    <Handle type="target" position={Position.Top} className="!bg-emerald-600 !w-2 !h-2" />
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
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-600 !w-2 !h-2" />
  </div>
);

const ServerNode = ({ data, selected }) => (
  <div className="flex flex-col items-center group cursor-pointer">
    <Handle type="target" position={Position.Top} className="!bg-amber-600 !w-2 !h-2" />
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
    <Handle type="source" position={Position.Bottom} className="!bg-amber-600 !w-2 !h-2" />
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
  const [routesData, setRoutesData] = useState({ routes: [], history: [], raw: '' });
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

  const handleQuickPing = async (sourceName) => {
    setPingRunning(true);
    setPingResult(null);
    try {
      const res = await api.simulatePing(sourceName, '192.168.100.10');
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

    edges.forEach((e) => {
      if (e.source === selId || e.target === selId) {
        paths.add(e.id);
        const nextDev = e.source === selId ? e.target : e.source;
        edges.forEach((e2) => {
          if (
            (e2.source === nextDev && e2.target === 'Core-Dist-SW') ||
            (e2.target === nextDev && e2.source === 'Core-Dist-SW')
          ) {
            paths.add(e2.id);
          }
        });
      }
      if (
        (e.source === 'Core-Dist-SW' && e.target === 'Campus-Core-Router') ||
        (e.target === 'Core-Dist-SW' && e.source === 'Campus-Core-Router')
      ) {
        paths.add(e.id);
      }
    });

    return paths;
  }, [selectedNode, edges]);

  const styledEdges = useMemo(() => {
    return edges.map((e) => {
      const isHighlighted = activePathEdges.has(e.id);
      if (e.isCut) {
        return {
          ...e,
          label: '[SEVERED]',
          style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '6,6' },
        };
      }

      if (selectedNode) {
        if (isHighlighted) {
          return {
            ...e,
            label: null,
            style: { stroke: '#4f46e5', strokeWidth: 3.5 },
            animated: true,
          };
        }
        return {
          ...e,
          label: null,
          style: { stroke: '#d6cfc4', strokeWidth: 1.5, opacity: 0.6 },
          animated: false,
        };
      }

      return {
        ...e,
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
            <span>Campus Network Topology</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8] font-mono">
              Academic Blocks
            </span>
            {cutDepartments.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 rounded-full flex items-center space-x-1 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{cutDepartments.length} Link Severed</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-[#706b63]">
            Physical building zones and clean interconnects synchronized live with Cisco Packet Tracer.
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
            <span>Routing Table</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-xs font-semibold font-mono">
              {routesData.routes.length}
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
          <aside className="w-80 min-w-80 bg-[#f4f0e8] border-l border-[#dfd8c8] p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-lg">
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
                      DIAGNOSTIC TEST
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#dfd8c8] space-y-2">
                      <button
                        onClick={() => handleQuickPing(selectedNode.data?.label)}
                        disabled={pingRunning}
                        className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <Play className={`w-3.5 h-3.5 ${pingRunning ? 'animate-spin' : ''}`} />
                        <span>{pingRunning ? 'Pinging DNS Server...' : 'Ping DNS Server (.100.10)'}</span>
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
                <span className="text-[11px] text-[#706b63] font-mono">Protected Device</span>
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
          <div className="absolute right-4 top-4 bottom-4 w-[460px] bg-[#f4f0e8] border border-[#dfd8c8] rounded-xl p-5 shadow-2xl z-20 flex flex-col justify-between">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd8c8]">
                <div className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-bold text-[#1e1c19] text-base">
                      Campus-Core-Router Routing Table
                    </h3>
                    <p className="text-[11px] text-[#706b63] font-mono">
                      Live Cisco IOS 15.1 (show ip route)
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

              <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1 font-mono">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1e1c19] uppercase tracking-wider">
                      Active Routing Table ({routesData.routes.length})
                    </span>
                    <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                      Cisco IOS Synchronized
                    </span>
                  </div>

                  <div className="border border-[#dfd8c8] rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-xs text-[#1e1c19]">
                      <thead className="bg-[#eae4d8] text-[#554f45] text-[10px] uppercase font-semibold border-b border-[#dfd8c8]">
                        <tr>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Network Prefix</th>
                          <th className="px-3 py-2">Interface</th>
                          <th className="px-3 py-2">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dfd8c8] font-mono">
                        {routesData.routes.map((r, i) => (
                          <tr key={i} className="hover:bg-[#f7f4ed]">
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.code === 'C'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                                }`}
                              >
                                {r.code}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-semibold text-[#1e1c19]">
                              {r.prefix}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-[#706b63]">
                              {r.target}
                            </td>
                            <td className="px-3 py-2 text-[10px] text-[#706b63] font-sans">
                              {r.type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center space-x-3 text-[10px] text-[#706b63]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>C: Directly Connected</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-sky-600" />
                      <span>L: Local Interface IP</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1e1c19] uppercase tracking-wider flex items-center space-x-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Routing Table Event History</span>
                    </span>
                    <span className="text-[10px] text-[#706b63]">
                      Scroll to review
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {routesData.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 bg-white rounded-lg border border-[#dfd8c8] text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${
                              h.event.includes('Dropped')
                                ? 'text-rose-700'
                                : h.event.includes('Restored')
                                ? 'text-emerald-700'
                                : 'text-indigo-700'
                            }`}
                          >
                            {h.event}
                          </span>
                          <span className="text-[10px] font-mono text-[#706b63]">
                            {h.timestamp}
                          </span>
                        </div>
                        <p className="text-[#1e1c19] text-[11px] font-sans">{h.detail}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#706b63] border-t border-[#dfd8c8] pt-1 font-mono">
                          <span>Active Routes: {h.route_count}</span>
                          <span className="text-indigo-800">
                            show ip route
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dfd8c8] text-[11px] text-[#706b63] flex justify-between items-center font-mono">
              <span>802.1Q SVI Protocol</span>
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
