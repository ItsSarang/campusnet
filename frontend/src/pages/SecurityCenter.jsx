import React, { useState } from 'react';
import { Shield, Play, Terminal, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';

export const SecurityCenter = ({ devices, aclRules, onRefresh }) => {
  const hostDevices = devices.filter((d) => d.kind === 'host' || d.model === 'PC-PT');

  const [sourceDevice, setSourceDevice] = useState(hostDevices[0]?.name || 'CS-PC-01');
  const [targetIp, setTargetIp] = useState('192.168.100.10');
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const [aclModalOpen, setAclModalOpen] = useState(false);
  const [aclName, setAclName] = useState('Block CS to Admin Subnet');
  const [aclAction, setAclAction] = useState('deny');
  const [sourceSubnet, setSourceSubnet] = useState('192.168.10.0 0.0.0.255');
  const [destSubnet, setDestSubnet] = useState('192.168.30.0 0.0.0.255');
  const [applyingAcl, setApplyingAcl] = useState(false);

  const handleRunPing = async (e) => {
    e.preventDefault();
    if (!sourceDevice || !targetIp) return;

    setPinging(true);
    setPingResult(null);
    try {
      const res = await api.simulatePing(sourceDevice, targetIp);
      setPingResult(res);
      onRefresh();
    } catch (err) {
      setPingResult({
        source: sourceDevice,
        target: targetIp,
        output: `Error executing ping: ${err.message}`,
        success: false,
      });
    } finally {
      setPinging(false);
    }
  };

  const handleApplyAcl = async (e) => {
    e.preventDefault();
    setApplyingAcl(true);
    try {
      const res = await api.applyAclRule({
        name: aclName,
        action: aclAction,
        sourceSubnet,
        destSubnet,
      });

      if (res.success) {
        setAclModalOpen(false);
        onRefresh();
      } else {
        alert(res.error || 'Failed to apply ACL rule');
      }
    } catch (err) {
      alert(`Error applying ACL: ${err.message}`);
    } finally {
      setApplyingAcl(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Communication & Security Policy Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            Execute real ICMP ping simulations in Packet Tracer and push Cisco IOS ACL security rules.
          </p>
        </div>
        <button
          onClick={() => setAclModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Router ACL</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 mb-4">
              <Play className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Live Packet Tracer Ping Test</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Select a source PC in Packet Tracer and a destination IP to send 32-byte ICMP echo
              requests across the virtual switches and router.
            </p>

            <form onSubmit={handleRunPing} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Device in Packet Tracer
                </label>
                {hostDevices.length === 0 ? (
                  <p className="text-xs text-rose-400">
                    No workstations found. Please add a workstation in the IP Manager first.
                  </p>
                ) : (
                  <select
                    value={sourceDevice}
                    onChange={(e) => setSourceDevice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {hostDevices.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.model})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target IPv4 Destination
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.100.10"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetIp('192.168.100.10')}
                    className="px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700"
                  >
                    DNS Server
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetIp('192.168.10.1')}
                    className="px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700"
                  >
                    Gateway
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pinging || hostDevices.length === 0}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-sky-600/20 transition flex items-center justify-center space-x-2"
                >
                  <Play className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
                  <span>{pinging ? 'Executing in Packet Tracer...' : 'Transmit Ping Packets'}</span>
                </button>
              </div>
            </form>
          </div>

          {pingResult && (
            <div
              className={`mt-6 p-4 rounded-xl border flex items-center space-x-3 text-sm ${
                pingResult.success
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border-rose-800'
              }`}
            >
              {pingResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {pingResult.success ? 'ICMP Reachable!' : 'Packet Transfer Failed / Dropped'}
                </span>
                <p className="text-xs opacity-80 mt-0.5">
                  {pingResult.success
                    ? 'Packets successfully routed through virtual switches and Core Router.'
                    : 'Packets timed out or were blocked by Access-Control Lists.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow font-mono text-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">Packet Tracer Console Output</span>
            </div>
            <span className="text-[11px] text-slate-500">Host Terminal stdout</span>
          </div>

          <div className="flex-1 bg-black/50 p-4 rounded-lg border border-slate-900 text-emerald-400 overflow-y-auto whitespace-pre font-mono text-xs min-h-[220px]">
            {pingResult
              ? pingResult.output
              : `Ready to execute. Select a host and click 'Transmit Ping Packets'.\nThe command prompt inside Packet Tracer will run: ping <target_ip>`}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Core Router Access Control Lists (ACLs)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Enforced at Campus-Core-Router G0/0</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Rule Name</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Source Subnet</th>
                <th className="px-6 py-3">Destination Subnet</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {aclRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">{rule.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        rule.action === 'permit'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">{rule.source}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">
                    {rule.destination}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {aclModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Apply ACL Rule to Campus-Core-Router
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pushes a Cisco IOS extended access-list command to the router live in Packet Tracer.
            </p>

            <form onSubmit={handleApplyAcl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={aclName}
                  onChange={(e) => setAclName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verdict</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAclAction('deny')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition ${
                      aclAction === 'deny'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    DENY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAclAction('permit')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition ${
                      aclAction === 'permit'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    PERMIT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Subnet (with Wildcard Mask)
                </label>
                <input
                  type="text"
                  required
                  value={sourceSubnet}
                  onChange={(e) => setSourceSubnet(e.target.value)}
                  placeholder="e.g. 192.168.10.0 0.0.0.255"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Destination Subnet (with Wildcard Mask)
                </label>
                <input
                  type="text"
                  required
                  value={destSubnet}
                  onChange={(e) => setDestSubnet(e.target.value)}
                  placeholder="e.g. 192.168.30.0 0.0.0.255"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAclModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingAcl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20"
                >
                  {applyingAcl ? 'Configuring Router...' : 'Apply to Packet Tracer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
