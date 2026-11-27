import React, { useEffect, useState } from 'react';
import { apiFetch, getAdminUser } from '../api.js';

export default function SettingsPage() {
  const currentAdmin = getAdminUser();
  const isSuperAdmin = currentAdmin?.role === 'SUPER_ADMIN';

  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState('');

  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    role: 'MANAGER',
    password: '',
  });
  const [staffMsg, setStaffMsg] = useState('');
  const [staffErr, setStaffErr] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

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

  async function createStaff(e) {
    e.preventDefault();
    setStaffMsg('');
    setStaffErr('');
    try {
      const res = await apiFetch('/admin/register', {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      setStaffMsg(`Staff account created: ${res.admin.username} (${res.admin.role})`);
      setStaffForm({ username: '', email: '', role: 'MANAGER', password: '' });
      load();
    } catch (err) {
      setStaffErr(err.message);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }
    try {
      const res = await apiFetch('/admin/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      setPwMsg(res.message);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      load();
    } catch (err) {
      setPwErr(err.message);
    }
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

      {isSuperAdmin && (
        <>
          <h3>Create Staff Admin (Super Admin Only)</h3>
          <form onSubmit={createStaff} className="card-box">
            <div className="form-grid">
              <label>Username
                <input
                  required
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  placeholder="e.g. rahul_manager"
                />
              </label>
              <label>Email
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="rahul@mha-shop.com"
                />
              </label>
              <label>Role
                <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                  <option value="MANAGER">Manager</option>
                  <option value="SUPPORT_STAFF">Support Staff</option>
                  <option value="FINANCE">Finance</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </label>
              <label>Password (min 6 chars)
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Set initial password"
                />
              </label>
            </div>
            <button className="btn" style={{ marginTop: '12px' }} type="submit">Create Staff Account</button>
            {staffMsg && <p style={{ color: 'var(--teal)', fontWeight: 700, marginTop: '10px' }}>{staffMsg}</p>}
            {staffErr && <p className="err">{staffErr}</p>}
          </form>
        </>
      )}

      <h3>Change My Admin Password</h3>
      <form onSubmit={changePassword} className="card-box">
        <div className="form-grid">
          <label>Current Password
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
          </label>
          <label>New Password (min 8 chars)
            <input
              type="password"
              required
              minLength={8}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
          </label>
          <label>Confirm New Password
            <input
              type="password"
              required
              minLength={8}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
            />
          </label>
        </div>
        <button className="btn" style={{ marginTop: '12px' }} type="submit">Update Admin Password</button>
        {pwMsg && <p style={{ color: 'var(--teal)', fontWeight: 700, marginTop: '10px' }}>{pwMsg}</p>}
        {pwErr && <p className="err">{pwErr}</p>}
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
