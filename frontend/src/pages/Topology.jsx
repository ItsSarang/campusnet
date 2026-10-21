import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
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
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

const BuildingNode = ({ data }) => {
  const isCut = data.isCut;
  return (
    <div
      style={{
        width: data.width || 380,
        height: data.height || 400,
        borderColor: isCut ? '#ef4444' : data.color,
      }}
      className={`rounded-2xl border-2 transition-all duration-300 pointer-events-auto p-4 flex flex-col justify-between ${
        isCut
          ? 'bg-rose-950/20 shadow-2xl shadow-rose-950/30'
          : 'bg-slate-900/40 shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              {data.name}
            </h4>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-300">
                {data.subnet}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                VLAN {data.vlan}
              </span>
            </div>
          </div>
        </div>

        {data.departmentId !== 'core' && (
          <button
            onClick={() => data.onToggleLink(data.departmentId)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              isCut
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-950/50'
                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
            }`}
          >
            {isCut ? (
              <>
                <Wrench className="w-3.5 h-3.5" />
                <span>Repair Uplink</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut Uplink</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 pointer-events-none" />

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Subnet Domain</span>
        {isCut ? (
          <span className="text-rose-400 font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>LINK SEVERED (OUTAGE)</span>
          </span>
        ) : (
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Uplink Active (STP FWD)</span>
          </span>
        )}
      </div>
    </div>
  );
};

const RouterNode = ({ data }) => (
  <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-xl p-3 shadow-xl shadow-indigo-950/50 min-w-[150px]">
    <Handle type="target" position={Position.Top} className="!bg-indigo-400" />
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
        <Cpu className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-white">{data.label}</div>
        <div className="text-[10px] text-indigo-300">Core Router 2911</div>
      </div>
    </div>
    <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
      <span>Subnets: 4</span>
      <span className="text-emerald-400">Inter-VLAN SVI</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
  </div>
);

const SwitchNode = ({ data }) => (
  <div className="bg-slate-900 border-2 border-sky-500/80 rounded-xl p-3 shadow-xl shadow-sky-950/50 min-w-[140px]">
    <Handle type="target" position={Position.Top} className="!bg-sky-400" />
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
        <Server className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-white">{data.label}</div>
        <div className="text-[10px] text-sky-300">2960-24TT Switch</div>
      </div>
    </div>
    <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
      <span>Status: UP</span>
      <span className="text-sky-400">802.1Q Trunk</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-sky-400" />
  </div>
);

const HostNode = ({ data }) => (
  <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-xl p-3 shadow-xl shadow-emerald-950/50 min-w-[130px]">
    <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
        <Laptop className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-white">{data.label}</div>
        <div className="text-[10px] text-emerald-300">Workstation PC</div>
      </div>
    </div>
    <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
      <span>Fa0</span>
      <span className="text-emerald-400 font-mono">192.168.x.x</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
  </div>
);

const ServerNode = ({ data }) => (
  <div className="bg-slate-900 border-2 border-amber-500/80 rounded-xl p-3 shadow-xl shadow-amber-950/50 min-w-[140px]">
    <Handle type="target" position={Position.Top} className="!bg-amber-400" />
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
        <HardDrive className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-bold text-white">{data.label}</div>
        <div className="text-[10px] text-amber-300">Campus Server</div>
      </div>
    </div>
    <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
      <span>DNS / Web</span>
      <span className="text-amber-400 font-mono">.100.10</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
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
        },
      }));

      const deviceNodes = data.nodes || [];
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

  useEffect(() => {
    loadTopology();
    loadRoutes();
  }, [loadTopology, loadRoutes]);

  const onNodeClick = (_, node) => {
    if (node.type !== 'buildingNode') {
      setSelectedNode(node);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Campus Network Topology & Academic Blocks</span>
            {cutDepartments.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded-full animate-pulse flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3" />
                <span>{cutDepartments.length} Outage Active</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Interactive canvas with academic building zones and physical cable cut simulation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setRoutesDrawerOpen(true);
              loadRoutes();
            }}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-lg text-sm font-medium border border-indigo-800 transition"
          >
            <Table className="w-4 h-4 text-indigo-400" />
            <span>Routing Table</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-200 text-xs font-semibold">
              {routesData.routes.length}
            </span>
          </button>

          <button
            onClick={loadTopology}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Canvas</span>
          </button>
        </div>
      </div>

      {bannerAlert && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            bannerAlert.type === 'error'
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerAlert.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="font-semibold">{bannerAlert.message}</span>
          </div>

          <div className="flex items-center space-x-3">
            {bannerAlert.type === 'error' && (
              <button
                onClick={() => handleToggleLink(bannerAlert.departmentId)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center space-x-1"
              >
                <Wrench className="w-3 h-3" />
                <span>Repair Cable Now</span>
              </button>
            )}
            <button
              onClick={() => setBannerAlert(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 fill-slate-200" />
          <MiniMap
            className="!bg-slate-900 !border-slate-800 rounded-lg"
            nodeColor={(node) => {
              if (node.type === 'buildingNode') return 'transparent';
              if (node.type === 'routerNode') return '#818cf8';
              if (node.type === 'switchNode') return '#38bdf8';
              if (node.type === 'serverNode') return '#fbbf24';
              return '#34d399';
            }}
          />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-2xl z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">
                  {selectedNode.data?.label}
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Device Kind:</span>
                  <p className="font-semibold text-slate-200 capitalize">
                    {selectedNode.data?.kind}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Model:</span>
                  <p className="font-semibold text-slate-200">
                    {selectedNode.data?.model}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-semibold text-emerald-400">
                    Online in Packet Tracer
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Position Coordinates:</span>
                  <p className="font-mono text-slate-300">
                    X: {Math.round(selectedNode.position?.x || 0)}, Y:{' '}
                    {Math.round(selectedNode.position?.y || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-xs text-slate-400">
              Select or modify this device in the IP & Department Manager.
            </div>
          </div>
        )}

        {routesDrawerOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-[460px] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-2xl z-20 flex flex-col justify-between">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Campus-Core-Router Routing Table
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live Cisco IOS 15.1 (show ip route)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadRoutes}
                    disabled={routesLoading}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${routesLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => setRoutesDrawerOpen(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Active Routing Table ({routesData.routes.length})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Cisco IOS Synchronized
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Network Prefix</th>
                          <th className="px-3 py-2">Interface</th>
                          <th className="px-3 py-2">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {routesData.routes.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.code === 'C'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-sky-950 text-sky-400 border border-sky-800'
                                }`}
                              >
                                {r.code}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-semibold text-white">
                              {r.prefix}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-slate-400">
                              {r.target}
                            </td>
                            <td className="px-3 py-2 text-[10px] text-slate-400 font-sans">
                              {r.type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center space-x-3 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>C: Directly Connected</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>L: Local Interface IP</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Routing Table Event History</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Scroll to review
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {routesData.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${
                              h.event.includes('Dropped')
                                ? 'text-rose-400'
                                : h.event.includes('Restored')
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }`}
                          >
                            {h.event}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {h.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{h.detail}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                          <span>Active Routes: {h.route_count}</span>
                          <span className="text-indigo-400 font-mono">
                            show ip route
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Dynamic Inter-VLAN Routing Protocol: 802.1Q SVI</span>
              <button
                onClick={() => setRoutesDrawerOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
