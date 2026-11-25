import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const [sRes, lRes] = await Promise.all([apiFetch('/admin/settings'), apiFetch('/admin/logs')]);
    setSettings(sRes.settings || {});
    setLogs(lRes.logs || []);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
    setMsg('Settings saved to database.');
    load();
  }

  return (
    <>
      <h2>Settings &amp; Audit Logs</h2>
      {msg && <p style={{ color: 'var(--teal)', fontWeight: 700 }}>{msg}</p>}
      <form onSubmit={save} className="card-box">
        <div className="form-grid">
          <label>Unit Value (₹)
            <input value={settings.unit_value || ''} onChange={(e) => setSettings({ ...settings, unit_value: e.target.value })} />
          </label>
          <label>Profit Share %
            <input value={settings.profit_share_percent || ''} onChange={(e) => setSettings({ ...settings, profit_share_percent: e.target.value })} />
          </label>
          <label>Payout Deduction %
            <input value={settings.payout_deduction_percent || ''} onChange={(e) => setSettings({ ...settings, payout_deduction_percent: e.target.value })} />
          </label>
          <label>Support Email
            <input value={settings.support_email || ''} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} />
          </label>
        </div>
        <button className="btn" style={{ marginTop: '12px' }} type="submit">Save Settings</button>
      </form>

      <h3>Recent Admin Logs</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.admin?.username}</td>
                <td><b>{l.action}</b></td>
                <td>{l.details || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
