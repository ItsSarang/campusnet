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
    <div className="min-h-screen bg-[#f7f4ed] text-[#1e1c19] flex flex-col font-sans">
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
    </div>
  );
}

export default App;
