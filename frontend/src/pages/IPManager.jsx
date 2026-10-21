import React, { useState } from 'react';
import { Plus, Trash2, Laptop, Server, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const IPManager = ({ departments, devices, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-cs');
  const [allocationType, setAllocationType] = useState('DHCP');
  const [staticIp, setStaticIp] = useState('192.168.10.55');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedDept = departments.find((d) => d.id === departmentId) || departments[0];

  const handleDeptChange = (deptId) => {
    setDepartmentId(deptId);
    const d = departments.find((dep) => dep.id === deptId);
    if (d) {
      setStaticIp(`192.168.${d.vlan}.55`);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.addDevice({
        name: deviceName.trim(),
        departmentId,
        allocationType,
        ipAddress: allocationType === 'STATIC' ? staticIp : undefined,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Device '${deviceName}' successfully spawned and cabled in Cisco Packet Tracer!`,
        });
        setDeviceName('');
        setModalOpen(false);
        onRefresh();
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to create device in Packet Tracer.',
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error communicating with backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (name) => {
    if (!confirm(`Are you sure you want to remove '${name}' from Cisco Packet Tracer?`)) return;

    setLoading(true);
    try {
      const res = await api.deleteDevice(name);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Device '${name}' removed from Packet Tracer canvas.`,
        });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to delete device.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error deleting device.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">
        <div>
          <h2 className="text-xl font-bold text-white">Campus Structure & IP Manager</h2>
          <p className="text-sm text-slate-400 mt-1">
            Provision, cable, and manage devices and IPv4 allocations live in Cisco Packet Tracer.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Devices</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workstation</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/60 text-rose-300 border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Devices Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Active Campus Devices ({devices.length})</h3>
          <span className="text-xs text-slate-400">Live in Cisco Packet Tracer</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Device Name</th>
                <th className="px-6 py-3">Type / Model</th>
                <th className="px-6 py-3">VLAN / Subnet</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {devices.map((device) => {
                const isHost = device.kind === 'host' || device.model === 'PC-PT';
                const isRouter = device.kind === 'router';
                const isServer = device.kind === 'server';

                return (
                  <tr key={device.name} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                      {isHost ? (
                        <Laptop className="w-4 h-4 text-emerald-400" />
                      ) : isServer ? (
                        <Server className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Server className="w-4 h-4 text-sky-400" />
                      )}
                      <span>{device.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700">
                        {device.model}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {device.department ? (
                        <span className="text-sky-300 font-mono text-xs">
                          {departments.find((d) => d.id === device.department)?.subnet || 'Trunk'}
                        </span>
                      ) : isRouter ? (
                        <span className="text-indigo-400 text-xs font-semibold">
                          Inter-VLAN Gateway
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Campus Backbone</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Live in PT
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isHost ? (
                        <button
                          onClick={() => handleDeleteDevice(device.name)}
                          disabled={loading}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/40 transition"
                          title="Delete from Packet Tracer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Workstation to Packet Tracer</h3>
            <p className="text-xs text-slate-400 mb-4">
              Spawns a PC-PT, connects a straight-through cable to the department switch, and
              configures IP.
            </p>

            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Device Name / Hostname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS-LAB1-PC01"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Campus Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (VLAN {d.vlan} • {d.subnet})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  IP Allocation Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocationType('DHCP')}
                    className={`py-2 text-xs font-medium rounded-lg border text-center transition ${
                      allocationType === 'DHCP'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    DHCP (Automatic)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationType('STATIC')}
                    className={`py-2 text-xs font-medium rounded-lg border text-center transition ${
                      allocationType === 'STATIC'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Static IP
                  </button>
                </div>
              </div>

              {allocationType === 'STATIC' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Static IP Address ({selectedDept?.subnet})
                  </label>
                  <input
                    type="text"
                    required
                    value={staticIp}
                    onChange={(e) => setStaticIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default Gateway: {selectedDept?.gateway}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-600/20"
                >
                  {loading ? 'Spawning in PT...' : 'Spawn in Packet Tracer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
