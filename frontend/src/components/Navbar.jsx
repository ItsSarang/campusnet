import React from 'react';
import { Network, Activity, Shield, Radio } from 'lucide-react';

export const Navbar = ({ currentTab, onSelectTab, status }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'topology', label: 'Topology Explorer', icon: Network },
    { id: 'security', label: 'Security & Ping Center', icon: Shield },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
              <Network className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                CampusNet
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800 rounded-full">
                Packet Tracer 9.0 Live (React JS)
              </span>
            </div>
          </div>

          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                status?.connected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}
            >
              <Radio
                className={`w-3 h-3 mr-1.5 ${
                  status?.connected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
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
