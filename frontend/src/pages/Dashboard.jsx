import React, { useState } from 'react';
import { Server, Laptop, Cpu, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const Dashboard = ({
  status,
  departments,
  devices,
  events,
  onRefresh,
  onNavigate,
}) => {
  const [editingCapacity, setEditingCapacity] = useState({});
  const [savingDept, setSavingDept] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const routerCount = devices.filter((d) => d.kind === 'router').length;
  const switchCount = devices.filter((d) => d.kind === 'switch').length;
  const hostCount = devices.filter((d) => d.kind === 'host' || d.model === 'PC-PT').length;
  const serverCount = devices.filter((d) => d.kind === 'server' || d.model === 'Server-PT').length;

  const handleCapacityChange = (deptId, val) => {
    setEditingCapacity((prev) => ({
      ...prev,
      [deptId]: val,
    }));
  };

  const handleSaveCapacity = async (dept) => {
    const minAllowed = dept.currentHosts || 0;
    const requested = parseInt(editingCapacity[dept.id] ?? dept.maxHosts ?? 30, 10);

    if (isNaN(requested)) {
      setErrorMsg(`Please enter a valid number for ${dept.name}`);
      return;
    }

    if (requested < minAllowed) {
      setErrorMsg(
        `Cannot reduce max PCs below current count of ${minAllowed} for ${dept.name}!`
      );
      setEditingCapacity((prev) => ({
        ...prev,
        [dept.id]: dept.maxHosts,
      }));
      return;
    }

    if (requested > 250) {
      setErrorMsg('Max capacity cannot exceed 250 PCs for a /24 campus block!');
      return;
    }

    setSavingDept(dept.id);
    setErrorMsg(null);
    try {
      const res = await api.updateDepartmentCapacity(dept.id, requested);
      if (res.success) {
        setSuccessMsg(
          `Updated ${dept.name} capacity to ${requested} PCs. Subnet recalculated to ${res.department.subnet} (Mask: ${res.department.mask}).`
        );
        onRefresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to update capacity');
      }
    } catch (e) {
      setErrorMsg(`Error updating capacity: ${e.message}`);
    } finally {
      setSavingDept(null);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Core & Dept Routers
            </span>
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{routerCount}</span>
            <span className="ml-2 text-xs text-emerald-400 font-medium">Bellman-Ford Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">1 Core + 4 Gateway Routers (2911)</p>
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
            <span className="ml-2 text-xs text-emerald-400 font-medium">DHCP & Static Pools</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Managed via Campus DHCP Server</p>
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
            <span className="ml-2 text-xs text-emerald-400 font-medium">DNS & DHCP Services Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">DNS (.100.10) & DHCP (.100.20)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Department Subnets & Capacity Planning</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic VLSM CIDR sizing, subnet mask computation, and pool utilization limits.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Refresh subnets"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {departments.map((dept) => {
              const currentHosts = dept.currentHosts ?? devices.filter((d) => d.department === dept.id).length;
              const maxHosts = dept.maxHosts ?? 30;
              const percent = Math.min(100, Math.round((currentHosts / maxHosts) * 100));
              const currentInput = editingCapacity[dept.id] ?? maxHosts;
              const isDirty = String(currentInput) !== String(maxHosts);

              let barColor = 'bg-emerald-500';
              if (percent >= 90) {
                barColor = 'bg-rose-500';
              } else if (percent >= 70) {
                barColor = 'bg-amber-500';
              }

              return (
                <div
                  key={dept.id}
                  className="p-5 bg-slate-800/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="font-bold text-white text-sm truncate">{dept.name}</span>
                      <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                        VLAN {dept.vlan}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                        {dept.subnet}
                      </span>
                      {dept.mask && (
                        <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-700">
                          Mask: {dept.mask}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400">
                    <div>Gateway: <span className="text-slate-200">{dept.gateway}</span></div>
                    <div>Switch: <span className="text-slate-200">{dept.switch}</span></div>
                    <div>Router: <span className="text-slate-200">{dept.router}</span></div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <label htmlFor={`cap-${dept.id}`} className="text-xs font-medium text-slate-300 whitespace-nowrap">
                        Max Capacity:
                      </label>
                      <input
                        id={`cap-${dept.id}`}
                        type="number"
                        min={currentHosts}
                        max={250}
                        value={currentInput}
                        onChange={(e) => handleCapacityChange(dept.id, e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                      <span className="text-[11px] text-slate-500 font-mono">
                        (min: {currentHosts})
                      </span>
                      {isDirty && (
                        <button
                          onClick={() => handleSaveCapacity(dept)}
                          disabled={savingDept === dept.id}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow-xs transition"
                        >
                          {savingDept === dept.id ? 'Saving...' : 'Apply Subnet'}
                        </button>
                      )}
                    </div>

                    <div className="text-xs font-mono text-right">
                      <span className="font-bold text-white">{currentHosts}</span>
                      <span className="text-slate-400"> / {maxHosts} PCs allocated </span>
                      <span className={`font-bold ${percent >= 90 ? 'text-rose-400' : percent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ({percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>{maxHosts - currentHosts} available IP slots remaining in {dept.subnet}</span>
                      <span>Total Usable: {dept.totalUsable || maxHosts} IPs</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Simulation Log</h2>
            <span className="text-xs text-slate-400">Live Feed</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
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
