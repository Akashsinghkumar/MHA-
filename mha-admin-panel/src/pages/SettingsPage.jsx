import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch, getAdminUser, setAdminUser } from '../api.js';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const isDefaultSetup = searchParams.get('setup') === '1';
  const currentAdmin = getAdminUser();
  const isSuperAdmin = currentAdmin?.role === 'SUPER_ADMIN';

  const [profileForm, setProfileForm] = useState({
    username: currentAdmin?.username || '',
    email: currentAdmin?.email || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState('');
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [staffList, setStaffList] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
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
    setLoadErr('');
    setLoading(true);
    try {
      const reqs = [apiFetch('/admin/settings'), apiFetch('/admin/logs')];
      if (isSuperAdmin) reqs.push(apiFetch('/admin/staff'));
      const [sRes, lRes, stRes] = await Promise.all(reqs);
      setSettings(sRes.settings || {});
      setLogs(lRes.logs || []);
      if (stRes?.staff) setStaffList(stRes.staff);
    } catch (err) {
      setLoadErr(err.message || 'Could not load settings from server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      const res = await apiFetch('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      setAdminUser(res.admin);
      setProfileMsg(res.message);
      load();
    } catch (err) {
      setProfileErr(err.message);
    }
  }

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

  async function saveEditStaff(e) {
    e.preventDefault();
    if (!editingStaff) return;
    setStaffMsg('');
    setStaffErr('');
    try {
      const payload = {
        username: editingStaff.username,
        email: editingStaff.email,
        role: editingStaff.role,
        isActive: editingStaff.isActive,
        ...(editingStaff.password ? { password: editingStaff.password } : {}),
      };
      const res = await apiFetch(`/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setStaffMsg(res.message);
      setEditingStaff(null);
      load();
    } catch (err) {
      setStaffErr(err.message);
    }
  }

  async function deleteStaff(s) {
    if (!confirm(`Delete staff admin "${s.username}"?`)) return;
    setStaffMsg('');
    setStaffErr('');
    try {
      const res = await apiFetch(`/admin/staff/${s.id}`, { method: 'DELETE' });
      setStaffMsg(res.message);
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
      {loadErr && (
        <div className="err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <span>{loadErr}</span>
          <button type="button" className="btn sm" onClick={load}>Retry</button>
        </div>
      )}
      {loading && <p style={{ color: 'var(--mut)', fontSize: '13px' }}>Loading settings…</p>}
      {isDefaultSetup && (
        <div style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, fontSize: '13.5px' }}>
          Security Notice: You signed in with the default password. Please set your real Owner Gmail below and update your Admin Password!
        </div>
      )}
      {msg && <p style={{ color: 'var(--teal)', fontWeight: 700 }}>{msg}</p>}

      <h3>Owner Profile &amp; 2FA Email</h3>
      <form onSubmit={updateProfile} className="card-box">
        <div className="form-grid">
          <label>Admin Username
            <input
              required
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              placeholder="owner_admin"
            />
          </label>
          <label>Owner Email (for 2FA &amp; Password Reset OTP)
            <input
              type="email"
              required
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="yourname@gmail.com"
            />
          </label>
        </div>
        <button className="btn teal" style={{ marginTop: '12px' }} type="submit">Save Owner Profile</button>
        {profileMsg && <p style={{ color: 'var(--teal)', fontWeight: 700, marginTop: '10px' }}>{profileMsg}</p>}
        {profileErr && <p className="err">{profileErr}</p>}
      </form>

      <h3>Store Settings</h3>
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

          {editingStaff && (
            <form onSubmit={saveEditStaff} className="card-box" style={{ marginTop: '14px', borderColor: 'var(--teal)' }}>
              <h4 style={{ margin: '0 0 10px' }}>Edit Staff Admin: {editingStaff.username}</h4>
              <div className="form-grid">
                <label>Username
                  <input required value={editingStaff.username} onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })} />
                </label>
                <label>Email
                  <input type="email" required value={editingStaff.email} onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })} />
                </label>
                <label>Role
                  <select value={editingStaff.role} onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPPORT_STAFF">Support Staff</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </label>
                <label>Status
                  <select value={editingStaff.isActive ? 'true' : 'false'} onChange={(e) => setEditingStaff({ ...editingStaff, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
                <label>New Password (optional)
                  <input type="password" minLength={6} value={editingStaff.password || ''} onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn teal" type="submit">Save Changes</button>
                <button className="btn ghost" type="button" onClick={() => setEditingStaff(null)}>Cancel</button>
              </div>
            </form>
          )}

          <h3>Manage Admin Access Accounts ({staffList.length})</h3>
          <div className="table-wrap" style={{ marginBottom: '18px' }}>
            <table>
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.username}</b>{s.id === currentAdmin?.id ? ' (You)' : ''}</td>
                    <td>{s.email}</td>
                    <td><span className="badge">{s.role}</span></td>
                    <td>{s.isActive ? 'Active' : 'Disabled'}</td>
                    <td>{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="btn sm teal" onClick={() => setEditingStaff({ ...s, password: '' })}>Edit</button>
                      {s.id !== currentAdmin?.id && (
                        <button type="button" className="btn sm danger" onClick={() => deleteStaff(s)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
