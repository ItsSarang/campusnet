import React from 'react';
import { Activity, Network, Shield, Radio } from 'lucide-react';

export const Navbar = ({ currentTab, onSelectTab, status }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'topology', label: 'Topology Explorer', icon: Network },
    { id: 'security', label: 'Security & Ping Center', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f2eee5]/95 backdrop-blur-md border-b border-[#dfd8c8] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-bold text-[#1e1c19] text-[16px] tracking-tight">
              CampusNet
            </span>
            <span className="text-[11px] font-mono text-[#706b63] bg-[#e6e0d2] px-2.5 py-0.5 rounded-full border border-[#d8d0bf] font-medium">
              Packet Tracer 9.0 Live
            </span>
          </div>

          <nav className="flex items-center shrink-0">
            <div className="inline-flex items-center bg-[#e6e0d2] p-0.5 rounded-xl border border-[#d8d0bf]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[12px] font-mono tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#faf8f4] text-[#1e1c19] font-semibold shadow-xs'
                        : 'text-[#706b63] hover:text-[#1e1c19] font-normal'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                status?.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <Radio
                className={`w-3 h-3 mr-1.5 ${
                  status?.connected ? 'text-emerald-600 animate-pulse' : 'text-rose-600'
                }`}
              />
              {status?.connected ? 'PT Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
