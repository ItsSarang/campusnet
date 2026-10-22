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

  const routerCount = devices.filter((d) => d.kind === 'router').length || 6;
  const switchCount = devices.filter((d) => d.kind === 'switch').length || 5;
  const hostCount = devices.filter((d) => d.kind === 'host' || d.kind === 'pc' || d.model === 'PC-PT').length;
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
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#fdfcf9] p-5 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[#706b63] text-xs font-semibold uppercase tracking-wider font-mono">
              Core & Dept Routers
            </span>
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-[#1e1c19]">{routerCount}</span>
          </div>
          <p className="text-xs text-[#8c8477] mt-1 font-mono">1 Core + 4 Gateway Routers (2911)</p>
        </div>

        <div className="bg-[#fdfcf9] p-5 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[#706b63] text-xs font-semibold uppercase tracking-wider font-mono">
              Campus Switches
            </span>
            <Server className="w-5 h-5 text-sky-600" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-[#1e1c19]">{switchCount}</span>
          </div>
          <p className="text-xs text-[#8c8477] mt-1 font-mono">1 Distribution + 4 Department Switches</p>
        </div>

        <div className="bg-[#fdfcf9] p-5 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[#706b63] text-xs font-semibold uppercase tracking-wider font-mono">
              Workstations & Labs
            </span>
            <Laptop className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-[#1e1c19]">{hostCount}</span>
          </div>
          <p className="text-xs text-[#8c8477] mt-1 font-mono">Department Workstations & PCs</p>
        </div>

        <div className="bg-[#fdfcf9] p-5 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[#706b63] text-xs font-semibold uppercase tracking-wider font-mono">
              Campus Servers
            </span>
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-extrabold text-[#1e1c19]">{serverCount}</span>
          </div>
          <p className="text-xs text-[#8c8477] mt-1 font-mono">DNS, DHCP & Web ERP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1e1c19]">Department Subnets & Capacity Planning</h2>
              <p className="text-xs text-[#706b63] mt-0.5">
                Dynamic VLSM CIDR sizing, subnet mask computation, and pool utilization limits.
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 text-[#706b63] hover:text-[#1e1c19] rounded-lg hover:bg-[#eae4d8] border border-transparent hover:border-[#dfd8c8] transition"
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

              let barColor = 'bg-emerald-600';
              if (percent >= 90) {
                barColor = 'bg-rose-600';
              } else if (percent >= 70) {
                barColor = 'bg-amber-500';
              }

              return (
                <div
                  key={dept.id}
                  className="p-5 bg-[#faf8f4] rounded-xl border border-[#dfd8c8] hover:border-[#c8c0b0] transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dfd8c8] pb-2.5">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="font-bold text-[#1e1c19] text-sm truncate">{dept.name}</span>
                      <span className="px-2 py-0.5 text-xs bg-[#eae4d8] text-[#554f45] rounded-md border border-[#dfd8c8] font-mono">
                        VLAN {dept.vlan}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#e6e0d2] text-[#1e1c19] border border-[#d8d0bf] font-bold">
                        {dept.subnet}
                      </span>
                      {dept.mask && (
                        <span className="px-2 py-0.5 rounded-md bg-[#fdfcf9] text-[#706b63] border border-[#dfd8c8]">
                          Mask: {dept.mask}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-[#706b63]">
                    <div>Gateway: <span className="text-[#1e1c19] font-medium">{dept.gateway}</span></div>
                    <div>Switch: <span className="text-[#1e1c19] font-medium">{dept.switch}</span></div>
                    <div>Router: <span className="text-[#1e1c19] font-medium">{dept.router}</span></div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <label htmlFor={`cap-${dept.id}`} className="text-xs font-medium text-[#706b63] font-mono whitespace-nowrap">
                        Max Capacity:
                      </label>
                      <input
                        id={`cap-${dept.id}`}
                        type="number"
                        min={currentHosts}
                        max={250}
                        value={currentInput}
                        onChange={(e) => handleCapacityChange(dept.id, e.target.value)}
                        className="w-20 px-2 py-1 bg-[#fdfcf9] border border-[#dfd8c8] rounded-lg text-xs text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                      />
                      <span className="text-[11px] text-[#8c8477] font-mono">
                        (min: {currentHosts})
                      </span>
                      {isDirty && (
                        <button
                          onClick={() => handleSaveCapacity(dept)}
                          disabled={savingDept === dept.id}
                          className="px-2.5 py-1 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          {savingDept === dept.id ? 'Saving...' : 'Apply Subnet'}
                        </button>
                      )}
                    </div>

                    <div className="text-xs font-mono text-right">
                      <span className="font-bold text-[#1e1c19]">{currentHosts}</span>
                      <span className="text-[#706b63]"> / {maxHosts} PCs allocated </span>
                      <span className={`font-bold ${percent >= 90 ? 'text-rose-600' : percent >= 70 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        ({percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-[#eae4d8] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#dfd8c8]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#706b63] font-mono">
                      <span>{maxHosts - currentHosts} available IP slots remaining in {dept.subnet}</span>
                      <span>Total Usable: {dept.totalUsable || maxHosts} IPs</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-[#1e1c19]">Simulation Log</h2>
            <span className="text-xs text-[#706b63] font-mono">Live Feed</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {events.length === 0 ? (
              <p className="text-sm text-[#8c8477]">No events recorded yet.</p>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-[#faf8f4] rounded-xl border border-[#dfd8c8] text-xs"
                >
                  <div className="flex items-center justify-between text-[#706b63] mb-1">
                    <span className="font-semibold text-indigo-700 font-mono">{evt.type}</span>
                    <span className="font-mono text-[#8c8477]">{evt.timestamp}</span>
                  </div>
                  <p className="text-[#1e1c19]">{evt.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
