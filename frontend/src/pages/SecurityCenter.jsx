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
      <div className="bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e1c19]">Communication & Security Policy Center</h2>
          <p className="text-sm text-[#706b63] mt-1">
            Execute real ICMP ping simulations in Packet Tracer and push Cisco IOS ACL security rules.
          </p>
        </div>
        <button
          onClick={() => setAclModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Router ACL</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 mb-4">
              <Play className="w-5 h-5" />
              <h3 className="font-bold text-[#1e1c19] text-base">Live Packet Tracer Ping Test</h3>
            </div>
            <p className="text-xs text-[#706b63] mb-6">
              Select a source PC in Packet Tracer and a destination IP to send 32-byte ICMP echo
              requests across the virtual switches and router.
            </p>

            <form onSubmit={handleRunPing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">
                  Source Device in Packet Tracer
                </label>
                {hostDevices.length === 0 ? (
                  <p className="text-xs text-rose-600 font-medium">
                    No workstations found. Please add a workstation in the Topology canvas first.
                  </p>
                ) : (
                  <select
                    value={sourceDevice}
                    onChange={(e) => setSourceDevice(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
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
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">
                  Target IPv4 Destination
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.100.10"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    className="flex-1 bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetIp('192.168.100.10')}
                    className="px-3 py-2 bg-[#eae4d8] text-xs text-[#554f45] font-mono rounded-xl border border-[#d8d0bf] hover:bg-[#dfd8c8] transition"
                  >
                    DNS Server
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetIp('192.168.10.1')}
                    className="px-3 py-2 bg-[#eae4d8] text-xs text-[#554f45] font-mono rounded-xl border border-[#d8d0bf] hover:bg-[#dfd8c8] transition"
                  >
                    Gateway
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pinging || hostDevices.length === 0}
                  className="w-full py-2.5 bg-[#1e1c19] hover:bg-[#33302b] disabled:opacity-50 text-[#f7f4ed] rounded-xl text-sm font-semibold shadow-xs transition flex items-center justify-center space-x-2"
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
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {pingResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {pingResult.success ? 'ICMP Reachable' : 'Packet Transfer Failed / Dropped'}
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

        <div className="bg-[#24211d] p-6 rounded-2xl border border-[#3d3730] shadow-md font-mono text-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#3d3730] text-[#a89f91] mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-[#f2eee5]">Packet Tracer Console Output</span>
            </div>
            <span className="text-[11px] text-[#8c8477]">Host Terminal stdout</span>
          </div>

          <div className="flex-1 bg-[#1a1815] p-4 rounded-xl border border-[#332e28] text-emerald-400 overflow-y-auto whitespace-pre font-mono text-xs min-h-[220px]">
            {pingResult
              ? pingResult.output
              : `Ready to execute. Select a host and click 'Transmit Ping Packets'.\nThe command prompt inside Packet Tracer will run: ping <target_ip>`}
          </div>
        </div>
      </div>

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] overflow-hidden shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
        <div className="px-6 py-4 border-b border-[#dfd8c8] bg-[#faf8f4] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-[#1e1c19] text-base">
              Core Router Access Control Lists (ACLs)
            </h3>
          </div>
          <span className="text-xs text-[#706b63] font-mono">Enforced at Campus-Core-Router G0/0</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1e1c19]">
            <thead className="bg-[#f2eee5] text-[#706b63] uppercase text-[11px] font-mono font-semibold tracking-wider border-b border-[#dfd8c8]">
              <tr>
                <th className="px-6 py-3">Rule Name</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Source Subnet</th>
                <th className="px-6 py-3">Destination Subnet</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfd8c8]">
              {aclRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#faf8f4] transition">
                  <td className="px-6 py-4 font-semibold text-[#1e1c19]">{rule.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                        rule.action === 'permit'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#554f45]">{rule.source}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[#554f45]">
                    {rule.destination}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#eae4d8] text-[#554f45] border border-[#dfd8c8]">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdfcf9] border border-[#dfd8c8] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#1e1c19] mb-1">
              Apply ACL Rule to Campus-Core-Router
            </h3>
            <p className="text-xs text-[#706b63] mb-4">
              Pushes a Cisco IOS extended access-list command to the router live in Packet Tracer.
            </p>

            <form onSubmit={handleApplyAcl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">Rule Name</label>
                <input
                  type="text"
                  required
                  value={aclName}
                  onChange={(e) => setAclName(e.target.value)}
                  className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] focus:outline-none focus:border-[#1e1c19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">Verdict</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAclAction('deny')}
                    className={`py-2 text-xs font-bold font-mono rounded-xl border text-center transition ${
                      aclAction === 'deny'
                        ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs'
                        : 'bg-[#faf8f4] text-[#706b63] border-[#dfd8c8] hover:bg-[#eae4d8]'
                    }`}
                  >
                    DENY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAclAction('permit')}
                    className={`py-2 text-xs font-bold font-mono rounded-xl border text-center transition ${
                      aclAction === 'permit'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-[#faf8f4] text-[#706b63] border-[#dfd8c8] hover:bg-[#eae4d8]'
                    }`}
                  >
                    PERMIT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">
                  Source Subnet (with Wildcard Mask)
                </label>
                <input
                  type="text"
                  required
                  value={sourceSubnet}
                  onChange={(e) => setSourceSubnet(e.target.value)}
                  placeholder="e.g. 192.168.10.0 0.0.0.255"
                  className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">
                  Destination Subnet (with Wildcard Mask)
                </label>
                <input
                  type="text"
                  required
                  value={destSubnet}
                  onChange={(e) => setDestSubnet(e.target.value)}
                  placeholder="e.g. 192.168.30.0 0.0.0.255"
                  className="w-full bg-[#faf8f4] border border-[#dfd8c8] rounded-xl px-3 py-2 text-sm text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAclModalOpen(false)}
                  className="px-4 py-2 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingAcl}
                  className="px-4 py-2 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-xl text-sm font-semibold transition shadow-xs"
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
