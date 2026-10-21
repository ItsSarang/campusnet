import React, { useState, useEffect } from 'react';
import {
  Shield,
  Play,
  Terminal,
  CheckCircle2,
  XCircle,
  Globe,
  RefreshCw,
  Code,
  Check,
  X,
  Lock,
  ArrowRight,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_MATRIX = {
  'dept-cs': {
    'dept-cs': 'local',
    'dept-lib': 'allow',
    'dept-admin': 'deny',
    'dept-dc': 'allow',
  },
  'dept-lib': {
    'dept-cs': 'allow',
    'dept-lib': 'local',
    'dept-admin': 'deny',
    'dept-dc': 'allow',
  },
  'dept-admin': {
    'dept-cs': 'allow',
    'dept-lib': 'allow',
    'dept-admin': 'local',
    'dept-dc': 'allow',
  },
};

const DEPARTMENTS_INFO = [
  { id: 'dept-cs', name: 'CS Dept (Students)', vlan: 10, subnet: '192.168.10.0/24' },
  { id: 'dept-lib', name: 'Library (General)', vlan: 20, subnet: '192.168.20.0/24' },
  { id: 'dept-admin', name: 'Admin Dept (Staff)', vlan: 30, subnet: '192.168.30.0/24' },
];

const DESTINATIONS_INFO = [
  { id: 'dept-cs', label: 'CS Dept (VLAN 10)' },
  { id: 'dept-lib', label: 'Library (VLAN 20)' },
  { id: 'dept-admin', label: 'Admin Dept (VLAN 30)' },
  { id: 'dept-dc', label: 'Servers (VLAN 100)' },
];

export const SecurityCenter = ({ devices, aclRules, onRefresh }) => {
  const hostDevices = devices.filter((d) => d.kind === 'host' || d.model === 'PC-PT');

  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [dirty, setDirty] = useState(false);
  const [enforcing, setEnforcing] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [compiledScript, setCompiledScript] = useState('');
  const [activeTab, setActiveTab] = useState('browser');

  const [sourceDevice, setSourceDevice] = useState(hostDevices[0]?.name || 'CS-PC-01');
  const [targetIp, setTargetIp] = useState('192.168.100.10');
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const [browserDevice, setBrowserDevice] = useState(hostDevices[0]?.name || 'CS-PC-01');
  const [browserUrl, setBrowserUrl] = useState('http://student.mitwpu.edu');
  const [browsing, setBrowsing] = useState(false);
  const [browserResult, setBrowserResult] = useState(null);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        const res = await api.getFirewallMatrix();
        if (res?.matrix) {
          setMatrix(res.matrix);
        }
      } catch (err) {
        console.error('Failed to load matrix', err);
      }
    };
    loadMatrix();
  }, []);

  const handleToggleCell = (srcId, dstId) => {
    if (srcId === dstId) return;
    setMatrix((prev) => {
      const current = prev[srcId]?.[dstId] || 'allow';
      const next = current === 'allow' ? 'deny' : 'allow';
      return {
        ...prev,
        [srcId]: {
          ...prev[srcId],
          [dstId]: next,
        },
      };
    });
    setDirty(true);
  };

  const handleEnforceRules = async () => {
    setEnforcing(true);
    try {
      const res = await api.updateFirewallMatrix(matrix);
      if (res.success) {
        setDirty(false);
        setCompiledScript(res.script || '');
        onRefresh();
      } else {
        alert(res.error || 'Failed to enforce rules');
      }
    } catch (err) {
      alert(`Error enforcing rules: ${err.message}`);
    } finally {
      setEnforcing(false);
    }
  };

  const handleRunPing = async (src, dst) => {
    const sDev = src || sourceDevice;
    const dIp = dst || targetIp;
    if (!sDev || !dIp) return;

    setActiveTab('terminal');
    setPinging(true);
    setPingResult(null);
    try {
      const res = await api.simulatePing(sDev, dIp);
      setPingResult(res);
      onRefresh();
    } catch (err) {
      setPingResult({
        source: sDev,
        target: dIp,
        output: `Error executing ping: ${err.message}`,
        success: false,
      });
    } finally {
      setPinging(false);
    }
  };

  const handleBrowseWeb = async (dev, url) => {
    const bDev = dev || browserDevice;
    const bUrl = url || browserUrl;
    if (!bDev || !bUrl) return;

    setActiveTab('browser');
    setBrowsing(true);
    setBrowserResult(null);
    try {
      const res = await api.browseWeb(bDev, bUrl);
      setBrowserResult(res);
      onRefresh();
    } catch (err) {
      setBrowserResult({
        success: false,
        status: '403 Forbidden / Connection Timed Out',
        statusCode: 403,
        url: bUrl,
        server: 'Filtered by Campus Core Firewall',
        error: `Error browsing: ${err.message}`,
        device: bDev,
      });
    } finally {
      setBrowsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#fdfcf9] p-6 rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e1c19]">
            Controlled Communication & Policy Matrix
          </h2>
          <p className="text-sm text-[#706b63] mt-1">
            Department-level visual firewall matrix, 1-click Cisco IOS Extended ACL compilation, and live verification.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setScriptModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-xl text-xs font-mono font-semibold border border-[#d8d0bf] transition"
          >
            <Code className="w-3.5 h-3.5" />
            <span>View IOS Script</span>
          </button>
          <button
            onClick={handleEnforceRules}
            disabled={enforcing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition ${
              dirty
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed]'
            }`}
          >
            <Shield className={`w-4 h-4 ${enforcing ? 'animate-spin' : ''}`} />
            <span>{enforcing ? 'Enforcing to Router...' : 'Enforce Rules (1-Click Push)'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] p-6 shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dfd8c8] pb-3">
          <div>
            <h3 className="font-bold text-[#1e1c19] text-base">
              Campus Department Communication Matrix (Visual Firewall)
            </h3>
            <p className="text-xs text-[#706b63] mt-0.5">
              Click any cell to toggle packet forwarding between departments. Intra-VLAN traffic stays local at Layer 2.
            </p>
          </div>
          {dirty && (
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
              Unapplied changes pending enforcement
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-[#dfd8c8] bg-[#f2eee5]">
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-[#554f45] uppercase tracking-wider">
                  From \ To
                </th>
                {DESTINATIONS_INFO.map((col) => (
                  <th
                    key={col.id}
                    className="px-4 py-3 text-xs font-mono font-bold text-[#554f45] uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfd8c8]">
              {DEPARTMENTS_INFO.map((row) => (
                <tr key={row.id} className="hover:bg-[#faf8f4] transition">
                  <td className="px-4 py-3.5 text-left">
                    <div className="font-bold text-sm text-[#1e1c19]">{row.name}</div>
                    <div className="text-[11px] font-mono text-[#706b63]">{row.subnet}</div>
                  </td>
                  {DESTINATIONS_INFO.map((col) => {
                    const isLocal = row.id === col.id;
                    const verdict = matrix[row.id]?.[col.id] || 'allow';

                    if (isLocal) {
                      return (
                        <td key={col.id} className="px-4 py-3.5">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-[#eae4d8] text-[#706b63] border border-[#dfd8c8] cursor-not-allowed">
                            LOCAL (L2)
                          </span>
                        </td>
                      );
                    }

                    const isAllow = verdict === 'allow';
                    return (
                      <td key={col.id} className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCell(row.id, col.id)}
                          className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wide border shadow-2xs transition-all cursor-pointer ${
                            isAllow
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {isAllow ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ALLOW</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>DENY</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-[#706b63] border-t border-[#dfd8c8]">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>ALLOW: Routed via Campus Core</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>DENY: Blocked by Extended ACL</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8c8477]" />
              <span>LOCAL L2: Switched inside VLAN</span>
            </span>
          </div>

          <span className="text-[11px] text-[#8c8477]">
            Active Cisco IOS ACL: CAMPUS-FIREWALL on Core-Router Gi0/0
          </span>
        </div>
      </div>

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] p-5 shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#706b63]">
            1-Click Immediate Verification Scenarios
          </span>
          <span className="text-[11px] font-mono text-[#8c8477]">
            Quick automated tests against Packet Tracer engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleRunPing('CS-PC-01', '192.168.30.20')}
            className="p-3 bg-[#faf8f4] hover:bg-[#f2eee5] border border-[#dfd8c8] rounded-xl text-left transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1e1c19]">
              <span>Ping: CS to Admin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                Expects: DENY
              </span>
            </div>
            <p className="text-[11px] text-[#706b63] font-mono mt-1">
              CS-PC-01 to 192.168.30.20 (Admin ERP)
            </p>
          </button>

          <button
            onClick={() => handleRunPing('CS-PC-01', '192.168.100.10')}
            className="p-3 bg-[#faf8f4] hover:bg-[#f2eee5] border border-[#dfd8c8] rounded-xl text-left transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1e1c19]">
              <span>Ping: CS to DNS Server</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Expects: ALLOW
              </span>
            </div>
            <p className="text-[11px] text-[#706b63] font-mono mt-1">
              CS-PC-01 to 192.168.100.10 (0% Loss)
            </p>
          </button>

          <button
            onClick={() => handleBrowseWeb('CS-PC-01', 'http://student.mitwpu.edu')}
            className="p-3 bg-[#faf8f4] hover:bg-[#f2eee5] border border-[#dfd8c8] rounded-xl text-left transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1e1c19]">
              <span>Browse: student.mitwpu.edu</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Expects: 200 OK
              </span>
            </div>
            <p className="text-[11px] text-[#706b63] font-mono mt-1">
              Data Center DMZ Student Portal
            </p>
          </button>

          <button
            onClick={() => handleBrowseWeb('CS-PC-01', 'http://admin.mitwpu.edu')}
            className="p-3 bg-[#faf8f4] hover:bg-[#f2eee5] border border-[#dfd8c8] rounded-xl text-left transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1e1c19]">
              <span>Browse: admin.mitwpu.edu</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                Expects: BLOCKED
              </span>
            </div>
            <p className="text-[11px] text-[#706b63] font-mono mt-1">
              VLAN 30 Restricted Intranet ERP
            </p>
          </button>
        </div>
      </div>

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)] overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[#dfd8c8] bg-[#faf8f4] flex items-center justify-between">
          <div className="inline-flex items-center bg-[#e6e0d2] p-0.5 rounded-xl border border-[#d8d0bf]">
            <button
              onClick={() => setActiveTab('browser')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                activeTab === 'browser'
                  ? 'bg-[#faf8f4] text-[#1e1c19] font-bold shadow-xs'
                  : 'text-[#706b63] hover:text-[#1e1c19]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Campus Web Browser (HTTP Test)</span>
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-[#faf8f4] text-[#1e1c19] font-bold shadow-xs'
                  : 'text-[#706b63] hover:text-[#1e1c19]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>ICMP Ping Console</span>
            </button>
          </div>

          <span className="text-xs font-mono text-[#706b63]">
            {activeTab === 'browser' ? 'DNS & HTTP Service Emulation' : 'Layer 3 Echo Simulation'}
          </span>
        </div>

        {activeTab === 'browser' && (
          <div className="p-6 space-y-4">
            <div className="bg-[#f2eee5] p-3 rounded-xl border border-[#dfd8c8] flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center space-x-2 shrink-0">
                <Laptop className="w-4 h-4 text-[#706b63]" />
                <span className="text-xs font-mono font-semibold text-[#554f45]">Client:</span>
                <select
                  value={browserDevice}
                  onChange={(e) => setBrowserDevice(e.target.value)}
                  className="bg-[#fdfcf9] border border-[#dfd8c8] rounded-lg px-2.5 py-1 text-xs text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                >
                  {hostDevices.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  <option value="Admin-Portal-Server">Admin-Portal-Server</option>
                </select>
              </div>

              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="http://student.mitwpu.edu"
                  className="flex-1 bg-[#fdfcf9] border border-[#dfd8c8] rounded-lg px-3 py-1 text-xs text-[#1e1c19] font-mono focus:outline-none focus:border-[#1e1c19]"
                />
                <button
                  onClick={() => handleBrowseWeb(browserDevice, browserUrl)}
                  disabled={browsing}
                  className="px-4 py-1 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-lg text-xs font-semibold font-mono transition shadow-xs flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${browsing ? 'animate-spin' : ''}`} />
                  <span>{browsing ? 'Navigating...' : 'Go'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 text-xs font-mono">
                <button
                  onClick={() => {
                    setBrowserUrl('http://student.mitwpu.edu');
                    handleBrowseWeb(browserDevice, 'http://student.mitwpu.edu');
                  }}
                  className="px-2 py-0.5 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-md border border-[#d8d0bf]"
                >
                  student.mitwpu.edu
                </button>
                <button
                  onClick={() => {
                    setBrowserUrl('http://admin.mitwpu.edu');
                    handleBrowseWeb(browserDevice, 'http://admin.mitwpu.edu');
                  }}
                  className="px-2 py-0.5 bg-[#eae4d8] hover:bg-[#dfd8c8] text-[#554f45] rounded-md border border-[#d8d0bf]"
                >
                  admin.mitwpu.edu
                </button>
              </div>
            </div>

            {browserResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  browserResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {browserResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    <strong>Status:</strong> {browserResult.status} |{' '}
                    <strong>Destination Server:</strong> {browserResult.server}
                  </span>
                </div>
                <span className="text-[11px] opacity-80">Client: {browserResult.device}</span>
              </div>
            )}

            <div className="bg-[#faf8f4] border border-[#dfd8c8] rounded-xl overflow-hidden min-h-[260px] p-4 flex flex-col justify-center">
              {browserResult ? (
                browserResult.success ? (
                  <div
                    className="w-full bg-[#fdfcf9] rounded-lg p-6 border border-[#dfd8c8] shadow-xs"
                    dangerouslySetInnerHTML={{ __html: browserResult.html }}
                  />
                ) : (
                  <div className="max-w-md mx-auto text-center space-y-3 py-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#1e1c19]">
                        This site cannot be reached
                      </h4>
                      <p className="text-xs text-[#706b63] font-mono mt-1">
                        {browserResult.url} took too long to respond.
                      </p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-left font-mono text-[11px] text-rose-900 space-y-1">
                      <p className="font-bold">Error: {browserResult.error}</p>
                      <p className="text-rose-700">
                        Firewall Action: Dropped at Campus-Core-Router GigabitEthernet0/0
                      </p>
                      <p className="text-rose-700">
                        Extended ACL Rule: Deny 192.168.10.0/24 to 192.168.30.0/24
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-xs font-mono text-[#8c8477] py-12">
                  Select a workstation and URL, then click &apos;Go&apos; to navigate via Cisco Packet Tracer DNS & HTTP engines.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#554f45] mb-1 font-mono">
                  Source Device in Packet Tracer
                </label>
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
                  <option value="Admin-Portal-Server">Admin-Portal-Server (VLAN 30)</option>
                </select>
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
                    className="px-2.5 py-1 bg-[#eae4d8] text-xs text-[#554f45] font-mono rounded-xl border border-[#d8d0bf] hover:bg-[#dfd8c8] transition"
                  >
                    DNS (.100.10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetIp('192.168.30.20')}
                    className="px-2.5 py-1 bg-[#eae4d8] text-xs text-[#554f45] font-mono rounded-xl border border-[#d8d0bf] hover:bg-[#dfd8c8] transition"
                  >
                    Admin (.30.20)
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleRunPing(sourceDevice, targetIp)}
                  disabled={pinging}
                  className="w-full py-2.5 bg-[#1e1c19] hover:bg-[#33302b] disabled:opacity-50 text-[#f7f4ed] rounded-xl text-sm font-semibold shadow-xs transition flex items-center justify-center space-x-2"
                >
                  <Play className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
                  <span>{pinging ? 'Transmitting Packets in Packet Tracer...' : 'Transmit Ping Packets'}</span>
                </button>
              </div>

              {pingResult && (
                <div
                  className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
                    pingResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  {pingResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {pingResult.success ? 'ICMP Echo Reply Received (0% Loss)' : 'Destination Host Administratively Prohibited'}
                    </span>
                    <p className="text-xs opacity-80 mt-0.5">
                      {pingResult.success
                        ? 'Packets permitted by Cisco Core Extended ACL rules.'
                        : 'Packets dropped by Campus-Core-Router CAMPUS-FIREWALL ACL.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#24211d] p-5 rounded-2xl border border-[#3d3730] shadow-md font-mono text-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#3d3730] text-[#a89f91] mb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-[#f2eee5]">Packet Tracer Host Console</span>
                </div>
                <span className="text-[11px] text-[#8c8477]">stdout</span>
              </div>

              <div className="flex-1 bg-[#1a1815] p-4 rounded-xl border border-[#332e28] text-emerald-400 overflow-y-auto whitespace-pre font-mono text-xs min-h-[200px]">
                {pingResult
                  ? pingResult.output
                  : `Ready to execute. Select a host and click 'Transmit Ping Packets'.\nThe command prompt inside Packet Tracer will run: ping <target_ip>`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#fdfcf9] rounded-2xl border border-[#dfd8c8] overflow-hidden shadow-[0_2px_12px_-2px_rgba(50,40,30,0.05)]">
        <div className="px-6 py-4 border-b border-[#dfd8c8] bg-[#faf8f4] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-[#1e1c19] text-base">
              Core Router Access Control Lists (ACLs)
            </h3>
          </div>
          <span className="text-xs text-[#706b63] font-mono">
            Enforced at Campus-Core-Router G0/0 (CAMPUS-FIREWALL)
          </span>
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

      {scriptModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdfcf9] border border-[#dfd8c8] rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#dfd8c8] pb-3">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-indigo-700" />
                <h3 className="text-lg font-bold text-[#1e1c19]">
                  Cisco IOS Extended ACL Script Preview
                </h3>
              </div>
              <button
                onClick={() => setScriptModalOpen(false)}
                className="text-[#706b63] hover:text-[#1e1c19]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#706b63]">
              This Cisco IOS CLI script is dynamically synthesized from the Visual Firewall Matrix and executed on Campus-Core-Router.
            </p>

            <div className="bg-[#1a1815] text-emerald-400 p-4 rounded-xl border border-[#332e28] font-mono text-xs overflow-y-auto max-h-[340px] whitespace-pre">
              {compiledScript ||
                `enable\nconfigure terminal\nno ip access-list extended CAMPUS-FIREWALL\nip access-list extended CAMPUS-FIREWALL\nremark Core Campus Department Firewall Matrix\npermit udp any host 192.168.100.10 eq 53\npermit udp any any eq bootps\npermit udp any any eq bootpc\npermit icmp any any echo-reply\ndeny ip 192.168.10.0 0.0.0.255 192.168.30.0 0.0.0.255\ndeny ip 192.168.20.0 0.0.0.255 192.168.30.0 0.0.0.255\npermit ip any any\nexit\ninterface GigabitEthernet0/0\n ip access-group CAMPUS-FIREWALL in\nexit\nend`}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setScriptModalOpen(false)}
                className="px-4 py-2 bg-[#1e1c19] hover:bg-[#33302b] text-[#f7f4ed] rounded-xl text-xs font-semibold font-mono transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
