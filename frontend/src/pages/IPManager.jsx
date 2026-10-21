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
      <div className="flex items-center justify-between bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
        <div>
          <h2 className="text-xl font-bold text-[#1e1c19]">Campus Structure & IP Manager</h2>
          <p className="text-sm text-[#706b63] mt-1">
            Provision, cable, and manage devices and IPv4 allocations live in Cisco Packet Tracer.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-xl text-sm font-semibold border border-[#d8d0bf] transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Devices</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workstation</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] overflow-hidden shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
        <div className="px-6 py-4 border-b border-[#dfd8c8] bg-[#faf8f4] flex items-center justify-between">
          <h3 className="font-bold text-[#1e1c19] text-base">Active Campus Devices ({devices.length})</h3>
          <span className="text-xs text-[#706b63] font-mono">Live in Cisco Packet Tracer</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1e1c19]">
            <thead className="bg-[#f2eee5] text-[#706b63] uppercase text-[11px] font-mono font-semibold tracking-wider border-b border-[#dfd8c8]">
              <tr>
                <th className="px-6 py-3">Device Name</th>
                <th className="px-6 py-3">Type / Model</th>
                <th className="px-6 py-3">VLAN / Subnet</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfd8c8]">
              {devices.map((device) => {
                const isHost = device.kind === 'host' || device.model === 'PC-PT';
                const isRouter = device.kind === 'router';
                const isServer = device.kind === 'server';

                return (
                  <tr key={device.name} className="hover:bg-[#faf8f4] transition">
                    <td className="px-6 py-4 font-semibold text-[#1e1c19] flex items-center space-x-3">
                      {isHost ? (
                        <Laptop className="w-4 h-4 text-emerald-600" />
                      ) : isRouter ? (
                        <Server className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Server className="w-4 h-4 text-amber-600" />
                      )}
                      <span>{device.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[#554f45]">
                      {device.model || device.kind}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8]">
                        {device.ip || 'DHCP Dynamic'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Online
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isHost && (
                        <button
                          onClick={() => handleDeleteDevice(device.name)}
                          disabled={loading}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition"
                          title="Delete device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdfcf9] border border-[#dfd8c8] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#1e1c19] mb-1">
              Add Campus Workstation (PC-PT)
            </h3>
            <p className="text-xs text-[#706b63] mb-4">
              Instantiates a new PC-PT in Cisco Packet Tracer and cables it to the department switch.
            </p>

            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-PC-02"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] focus:outline-none focus:border-[#1e1c19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">Department Zone</label>
                <select
                  value={departmentId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] focus:outline-none focus:border-[#1e1c19]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (VLAN {d.vlan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">IPv4 Allocation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocationType('DHCP')}
                    className={`py-2 text-xs font-bold font-mono rounded-xl border text-center transition ${
                      allocationType === 'DHCP'
                        ? 'bg-[#1e1c19] text-[#f7f4ed] border-[#1e1c19]'
                        : 'bg-[#faf8f4] text-[#706b63] border-[#dfd8c8] hover:bg-[#eae4d8]'
                    }`}
                  >
                    DHCP Dynamic
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationType('STATIC')}
                    className={`py-2 text-xs font-bold font-mono rounded-xl border text-center transition ${
                      allocationType === 'STATIC'
                        ? 'bg-[#1e1c19] text-[#f7f4ed] border-[#1e1c19]'
                        : 'bg-[#faf8f4] text-[#706b63] border-[#dfd8c8] hover:bg-[#eae4d8]'
                    }`}
                  >
                    Static IP
                  </button>
                </div>
              </div>

              {allocationType === 'STATIC' && (
                <div>
                  <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">Static IPv4 Address</label>
                  <input
                    type="text"
                    required
                    value={staticIp}
                    onChange={(e) => setStaticIp(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                  />
                  <p className="text-[11px] text-[#8c8477] mt-1 font-mono">
                    Usable range for {selectedDept?.subnet}: .2 through .50
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-xl text-sm font-semibold transition shadow-xs"
                >
                  {loading ? 'Creating in PT...' : 'Spawn & Cable PC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
