const API_BASE = '/api';

export const api = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    return res.json();
  },

  async getTopology() {
    const res = await fetch(`${API_BASE}/topology`);
    return res.json();
  },

  async getDevices() {
    const res = await fetch(`${API_BASE}/devices`);
    return res.json();
  },

  async addDevice(params) {
    const res = await fetch(`${API_BASE}/devices/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async deleteDevice(name) {
    const res = await fetch(`${API_BASE}/devices/${name}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async simulatePing(source, target) {
    const res = await fetch(`${API_BASE}/simulate/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target }),
    });
    return res.json();
  },

  async getAclRules() {
    const res = await fetch(`${API_BASE}/acl/rules`);
    return res.json();
  },

  async applyAclRule(params) {
    const res = await fetch(`${API_BASE}/acl/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getEvents() {
    const res = await fetch(`${API_BASE}/events`);
    return res.json();
  },

  async getRouterRoutes() {
    const res = await fetch(`${API_BASE}/router/routes`);
    return res.json();
  },

  async toggleLink(departmentId, action) {
    const res = await fetch(`${API_BASE}/topology/link/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId, action }),
    });
    return res.json();
  },
};
