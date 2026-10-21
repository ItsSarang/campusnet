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
import { Cpu, Server, Laptop, HardDrive, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

// Custom Nodes in plain JSX
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

  const loadTopology = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTopology();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (e) {
      console.error('Failed to load topology', e);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Live Cisco Packet Tracer Topology</h2>
          <p className="text-xs text-slate-400">
            Interactive canvas synchronized directly with device coordinates from Packet Tracer.
          </p>
        </div>
        <button
          onClick={loadTopology}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Canvas</span>
        </button>
      </div>

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
              if (node.type === 'routerNode') return '#818cf8';
              if (node.type === 'switchNode') return '#38bdf8';
              if (node.type === 'serverNode') return '#fbbf24';
              return '#34d399';
            }}
          />
        </ReactFlow>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-2xl z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">{selectedNode.data?.label}</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
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
                  <p className="font-semibold text-slate-200">{selectedNode.data?.model}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-semibold text-emerald-400">Online in Packet Tracer</p>
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
      </div>
    </div>
  );
};
