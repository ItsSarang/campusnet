import React from 'react';
import { Server, Laptop, Cpu, ShieldCheck, RefreshCw, ArrowUpRight } from 'lucide-react';

export const Dashboard = ({
  status,
  departments,
  devices,
  events,
  onRefresh,
  onNavigate,
}) => {
  const routerCount = devices.filter((d) => d.kind === 'router').length;
  const switchCount = devices.filter((d) => d.kind === 'switch').length;
  const hostCount = devices.filter((d) => d.kind === 'host' || d.model === 'PC-PT').length;
  const serverCount = devices.filter((d) => d.kind === 'server' || d.model === 'Server-PT').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Campus Network Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time synchronization with Cisco Packet Tracer engine{' '}
            <span className="font-mono text-sky-400">
              {status?.pt_version || '9.0'}
            </span>{' '}
            on <span className="font-mono text-slate-300">{status?.addr || '127.0.0.1:39000'}</span>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync with PT</span>
          </button>
          <button
            onClick={() => onNavigate('ipmanager')}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-sky-600/20 transition"
          >
            <span>Add Workstation</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Core Routers
            </span>
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{routerCount}</span>
            <span className="ml-2 text-xs text-emerald-400 font-medium">Inter-VLAN SVI Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Campus-Core-Router (2911)</p>
        </div>

        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Department Switches
            </span>
            <Server className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{switchCount}</span>
            <span className="ml-2 text-xs text-sky-400 font-medium">802.1Q Trunks Up</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">1 Distribution + 4 Department Switches</p>
        </div>

        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Workstations & Labs
            </span>
            <Laptop className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{hostCount}</span>
            <span className="ml-2 text-xs text-emerald-400 font-medium">Dynamic & Static</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Managed via DHCP / IP Allocator</p>
        </div>

        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Campus Servers
            </span>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{serverCount}</span>
            <span className="ml-2 text-xs text-emerald-400 font-medium">DNS & Gateway Up</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Campus DNS: 192.168.100.10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow">
          <h2 className="text-lg font-bold text-white mb-4">Department Subnets & VLANs</h2>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 bg-slate-800/40 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-semibold text-white">{dept.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700">
                      VLAN {dept.vlan}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-slate-300">{dept.subnet}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Gateway: {dept.gateway}</span>
                  <span>Switch: {dept.switch}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: dept.color,
                      width: `${Math.max(12, Math.min(100, (devices.filter((d) => d.department === dept.id).length + 2) * 15))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Simulation Log</h2>
            <span className="text-xs text-slate-400">Live Feed</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-1">
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">No events recorded yet.</p>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-slate-850 bg-slate-800/30 rounded-lg border border-slate-800/50 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-semibold text-sky-400">{evt.type}</span>
                    <span className="font-mono text-slate-500">{evt.timestamp}</span>
                  </div>
                  <p className="text-slate-300">{evt.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
