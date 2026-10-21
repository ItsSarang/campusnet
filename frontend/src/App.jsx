import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Topology } from './pages/Topology';
import { SecurityCenter } from './pages/SecurityCenter';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [aclRules, setAclRules] = useState([]);

  const refreshAll = useCallback(async () => {
    try {
      const [s, d, dev, ev, acl] = await Promise.all([
        api.getStatus(),
        api.getDepartments(),
        api.getDevices(),
        api.getEvents(),
        api.getAclRules(),
      ]);
      setStatus(s);
      setDepartments(d || []);
      setDevices(dev || []);
      setEvents(ev || []);
      setAclRules(acl || []);
    } catch (e) {
      console.error('Error refreshing system data', e);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} status={status} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            status={status}
            departments={departments}
            devices={devices}
            events={events}
            onRefresh={refreshAll}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'topology' && <Topology />}
        {currentTab === 'security' && (
          <SecurityCenter
            devices={devices}
            aclRules={aclRules}
            onRefresh={refreshAll}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        CampusNet | Computer Networks College Project | Cisco Packet Tracer Engine Port 39000
      </footer>
    </div>
  );
}

export default App;
