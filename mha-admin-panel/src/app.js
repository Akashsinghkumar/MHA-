import './styles.css';
import { apiFetch, getAdminToken, getAdminUser, setAdminToken, setAdminUser } from './api.js';

const root = document.getElementById('admin-root');
let activeTab = 'dashboard';

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inr(n) {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}

function toast(msg) {
  let el = document.getElementById('adminToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.style.display = 'none'; }, 2500);
}

let authMode = 'login';
function renderLogin(errorMsg = '') {
  root.innerHTML = `
    <div class="login-wrap">
      <form id="adminAuthForm" class="login-card">
        <small>MHA RESTRICTED PORTAL</small>
        <h1>${authMode === 'login' ? 'Admin Sign In' : 'Register Admin'}</h1>
        <p>${authMode === 'login' ? 'Sign in with your admin account.' : 'Create a new admin staff account (requires invite code).'}</p>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <button type="button" class="btn ${authMode === 'login' ? '' : 'ghost'} sm" id="modeLoginBtn">Sign In</button>
          <button type="button" class="btn ${authMode === 'register' ? '' : 'ghost'} sm" id="modeRegBtn">Register Admin</button>
        </div>
        <label>Username<input name="username" required autocomplete="username" placeholder="admin" /></label>
        ${authMode === 'register' ? `
          <label>Email<input name="email" type="email" required placeholder="staff@mha-shop.com" /></label>
          <label>Role
            <select name="role">
              <option value="MANAGER">Manager</option>
              <option value="SUPPORT_STAFF">Support Staff</option>
              <option value="FINANCE">Finance</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </label>
          <label>Admin Invite Code<input name="inviteCode" required placeholder="MHA-ADMIN-2026" /></label>
        ` : ''}
        <label>Password<input name="password" type="password" required autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}" placeholder="••••••••" /></label>
        <button class="btn" style="width:100%;margin-top:16px" type="submit">${authMode === 'login' ? 'Sign In' : 'Create Admin Account'}</button>
        ${errorMsg ? `<div class="err">${esc(errorMsg)}</div>` : ''}
      </form>
    </div>
  `;
  document.getElementById('modeLoginBtn').onclick = () => { authMode = 'login'; renderLogin(); };
  document.getElementById('modeRegBtn').onclick = () => { authMode = 'register'; renderLogin(); };
  document.getElementById('adminAuthForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const endpoint = authMode === 'login' ? '/admin/login' : '/admin/register';
      const payload = authMode === 'login'
        ? { username: fd.get('username'), password: fd.get('password') }
        : {
            username: fd.get('username'),
            email: fd.get('email'),
            role: fd.get('role'),
            inviteCode: fd.get('inviteCode'),
            password: fd.get('password'),
          };
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAdminToken(data.token);
      setAdminUser(data.admin);
      toast(authMode === 'login' ? 'Signed in' : 'Admin account created');
      renderShell();
    } catch (err) {
      renderLogin(err.message);
    }
  };
}

const TABS = [
  ['dashboard', 'Dashboard & Reports'],
  ['users', 'Registered Users Data'],
  ['products', 'Product Management'],
  ['orders', 'Order Management'],
  ['offers', 'Offers Management'],
  ['payouts', 'Payouts & Closing'],
  ['settings', 'Settings & Logs'],
];

async function renderShell() {
  if (!getAdminToken()) {
    renderLogin();
    return;
  }
  const admin = getAdminUser();
  root.innerHTML = `
    <header class="topbar">
      <h1>MHA — Admin Panel</h1>
      <div class="topbar-right">
        <span>${esc(admin?.username || 'Admin')} (${esc(admin?.role || 'STAFF')})</span>
        <button class="btn ghost sm" id="adminLogoutBtn">Sign out</button>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <h2>Management</h2>
        ${TABS.map(([id, label]) => `<button class="${activeTab === id ? 'on' : ''}" data-tab="${id}">${esc(label)}</button>`).join('')}
      </aside>
      <main class="content" id="tabContent"><p>Loading live data…</p></main>
    </div>
  `;

  document.getElementById('adminLogoutBtn').onclick = () => {
    setAdminToken('');
    setAdminUser(null);
    renderLogin();
  };

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      renderShell();
    };
  });

  await loadTabContent();
}

async function loadTabContent() {
  const box = document.getElementById('tabContent');
  try {
    if (activeTab === 'dashboard') {
      const { stats } = await apiFetch('/admin/dashboard');
      box.innerHTML = `
        <h2>Dashboard & Reports</h2>
        <p class="subtitle">Live figures directly from MHA Backend Database.</p>
        <div class="kpis">
          <div class="kpi"><span>Total Members</span><strong>${stats.totalMembers}</strong></div>
          <div class="kpi"><span>Orders Today</span><strong>${stats.ordersToday}</strong></div>
          <div class="kpi"><span>Total Orders</span><strong>${stats.totalOrders}</strong></div>
          <div class="kpi"><span>Total Revenue</span><strong>${inr(stats.totalRevenue)}</strong></div>
          <div class="kpi"><span>Pending KYC</span><strong>${stats.pendingKyc}</strong></div>
          <div class="kpi"><span>Pending Payouts</span><strong>${stats.pendingPayouts}</strong></div>
          <div class="kpi"><span>Low Stock Items</span><strong>${stats.lowStockProducts}</strong></div>
        </div>
      `;
    } else if (activeTab === 'products') {
      const [{ products }, { categories }] = await Promise.all([
        apiFetch('/products?limit=100'),
        apiFetch('/categories'),
      ]);
      box.innerHTML = `
        <h2>Product Management</h2>
        <p class="subtitle">${products.length} products in database.</p>
        <form id="addProductForm" class="card-box">
          <h3>Add New Product</h3>
          <div class="form-grid">
            <label>Name<input name="name" required /></label>
            <label>Category<select name="categoryId">${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>
            <label>Subcategory<input name="subcategory" required placeholder="Living Room / Audio / City Rider" /></label>
            <label>Brand<input name="brand" value="MHA" /></label>
            <label>Actual Price (₹)<input name="actualPrice" type="number" required /></label>
            <label>Offer Price (₹)<input name="offerPrice" type="number" required /></label>
            <label>Stock<input name="stock" type="number" value="50" /></label>
            <label>Image<input name="image" type="file" accept="image/*" /></label>
          </div>
          <label>Description<textarea name="description" rows="2"></textarea></label>
          <button class="btn" style="margin-top:12px" type="submit">Add Product</button>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Offer / Actual</th><th>Stock</th><th>Action</th></tr></thead>
            <tbody>
              ${products.map((p) => `
                <tr>
                  <td>#${p.id}</td>
                  <td>${esc(p.name)}</td>
                  <td>${esc(p.category?.name || '')} · ${esc(p.subcategory)}</td>
                  <td>${inr(p.offerPrice)} <small style="color:var(--mut);text-decoration:line-through">${inr(p.actualPrice)}</small></td>
                  <td>${p.stock}</td>
                  <td><button class="btn danger sm" data-del-prod="${p.id}">Remove</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('addProductForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await apiFetch('/admin/products', { method: 'POST', body: fd });
        toast('Product added to database');
        loadTabContent();
      };
      box.querySelectorAll('[data-del-prod]').forEach((b) => {
        b.onclick = async () => {
          if (!confirm('Deactivate this product?')) return;
          await apiFetch(`/admin/products/${b.dataset.delProd}`, { method: 'DELETE' });
          toast('Product removed');
          loadTabContent();
        };
      });
    } else if (activeTab === 'orders') {
      const { orders } = await apiFetch('/admin/orders');
      box.innerHTML = `
        <h2>Order Management</h2>
        <p class="subtitle">Manage all customer orders.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              ${orders.length ? orders.map((o) => `
                <tr>
                  <td><b>${esc(o.orderNumber)}</b></td>
                  <td>${esc(o.user?.name)} (${esc(o.user?.phone)})</td>
                  <td>${inr(o.total)}</td>
                  <td>${esc(o.paymentMethod)} · <span class="badge">${esc(o.paymentStatus)}</span></td>
                  <td>
                    <select data-order-status="${o.id}">
                      ${['Processing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'].map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5">No orders placed yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      box.querySelectorAll('[data-order-status]').forEach((sel) => {
        sel.onchange = async () => {
          await apiFetch(`/admin/orders/${sel.dataset.orderStatus}`, {
            method: 'PUT',
            body: JSON.stringify({ status: sel.value }),
          });
          toast('Order status updated');
        };
      });
    } else if (activeTab === 'users') {
      const searchQ = window.__adminUserSearch || '';
      const [{ users }, { queue }] = await Promise.all([
        apiFetch('/admin/users' + (searchQ ? `?q=${encodeURIComponent(searchQ)}` : '')),
        apiFetch('/admin/kyc'),
      ]);
      box.innerHTML = `
        <h2>Registered Users Data & KYC</h2>
        <p class="subtitle">All users registered on the Public Website are stored in the database and visible here.</p>
        <div class="card-box" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input id="userSearchInput" value="${esc(searchQ)}" placeholder="Search by name, phone, email or referral code…" style="flex:1;min-width:220px" />
          <button class="btn" id="userSearchBtn" type="button">Search Users</button>
          <button class="btn ghost" id="userClearBtn" type="button">Reset</button>
        </div>
        <div id="userDetailBox"></div>
        <h3>Registered Users (${users.length})</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Ref Code</th><th>Referred By</th><th>KYC</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              ${users.length ? users.map((u) => `
                <tr>
                  <td>#${u.id}</td>
                  <td><b>${esc(u.name)}</b></td>
                  <td>${esc(u.phone)}</td>
                  <td>${esc(u.email || '—')}</td>
                  <td><code>${esc(u.referralCode)}</code></td>
                  <td>${u.referredBy ? esc(u.referredBy.name + ' (' + u.referredBy.referralCode + ')') : '—'}</td>
                  <td><span class="badge">${esc(u.kycStatus)}</span></td>
                  <td>${u._count?.orders ?? 0}</td>
                  <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style="white-space:nowrap">
                    <button class="btn teal sm" data-view-user="${u.id}">View Data</button>
                    <button class="btn ghost sm" data-block="${u.id}|${!u.isBlocked}">${u.isBlocked ? 'Unblock' : 'Block'}</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="10">No registered users found yet.</td></tr>'}
            </tbody>
          </table>
        </div>
        <h3 style="margin-top:24px">KYC Verification Queue</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Member</th><th>PAN</th><th>Bank / UPI</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${queue.length ? queue.map((k) => `
                <tr>
                  <td>${esc(k.user?.name)} (${esc(k.user?.phone)})</td>
                  <td>${esc(k.panNumber)}</td>
                  <td>${esc(k.bankOrUpi)}</td>
                  <td><span class="badge">${esc(k.status)}</span></td>
                  <td>
                    <button class="btn teal sm" data-kyc="${k.userId}|Approved">Approve</button>
                    <button class="btn danger sm" data-kyc="${k.userId}|Rejected">Reject</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5">No KYC submissions yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('userSearchBtn').onclick = () => {
        window.__adminUserSearch = document.getElementById('userSearchInput').value.trim();
        loadTabContent();
      };
      document.getElementById('userClearBtn').onclick = () => {
        window.__adminUserSearch = '';
        loadTabContent();
      };
      box.querySelectorAll('[data-view-user]').forEach((b) => {
        b.onclick = async () => {
          const { user } = await apiFetch(`/admin/users/${b.dataset.viewUser}`);
          document.getElementById('userDetailBox').innerHTML = `
            <div class="card-box" style="border-color:var(--teal)">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0;color:var(--teal)">User #${user.id}: ${esc(user.name)}</h3>
                <button class="btn ghost sm" id="closeUserDetail">Close</button>
              </div>
              <p style="color:var(--mut);margin:8px 0">
                Phone: <b>${esc(user.phone)}</b> · Email: <b>${esc(user.email || '—')}</b> ·
                Referral Code: <b>${esc(user.referralCode)}</b> · KYC: <b>${esc(user.kycStatus)}</b> ·
                Carry Forward: <b>${inr(user.carryForward)}</b> · Units: <b>${user._count?.units ?? 0}</b>
              </p>
              <p style="margin:6px 0"><b>Addresses (${user.addresses?.length || 0}):</b> ${user.addresses?.length ? user.addresses.map((a) => esc(`${a.addressLine}, ${a.city}, ${a.state} - ${a.pincode}`)).join(' | ') : 'None saved'}</p>
              <p style="margin:6px 0"><b>Recent Orders (${user.orders?.length || 0}):</b> ${user.orders?.length ? user.orders.map((o) => esc(`${o.orderNumber} (${inr(o.total)} - ${o.status})`)).join(', ') : 'No orders yet'}</p>
            </div>
          `;
          document.getElementById('closeUserDetail').onclick = () => {
            document.getElementById('userDetailBox').innerHTML = '';
          };
        };
      });
      box.querySelectorAll('[data-kyc]').forEach((b) => {
        b.onclick = async () => {
          const [userId, status] = b.dataset.kyc.split('|');
          await apiFetch(`/admin/kyc/${userId}`, { method: 'PUT', body: JSON.stringify({ status }) });
          toast(`KYC ${status}`);
          loadTabContent();
        };
      });
      box.querySelectorAll('[data-block]').forEach((b) => {
        b.onclick = async () => {
          const [id, block] = b.dataset.block.split('|');
          await apiFetch(`/admin/users/${id}/block`, { method: 'PUT', body: JSON.stringify({ isBlocked: block === 'true' }) });
          toast('User status updated');
          loadTabContent();
        };
      });
    } else if (activeTab === 'offers') {
      const { offers } = await apiFetch('/offers');
      box.innerHTML = `
        <h2>Offers Management</h2>
        <p class="subtitle">Active offer sections on the public store.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Slug</th><th>Title</th><th>Promo Code</th><th>Products</th></tr></thead>
            <tbody>
              ${offers.map((o) => `
                <tr>
                  <td>${esc(o.slug)}</td>
                  <td><b>${esc(o.title)}</b></td>
                  <td>${esc(o.promoCode || '—')}</td>
                  <td>${o.products?.length || 0} items</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (activeTab === 'payouts') {
      const { payouts } = await apiFetch('/admin/payouts');
      box.innerHTML = `
        <h2>Closing & Payout Management</h2>
        <p class="subtitle">Run commission closing and approve member payouts.</p>
        <div class="card-box">
          <button class="btn teal" id="runDailyClosing">Run Daily Closing</button>
          <button class="btn" id="runMonthlyClosing" style="margin-left:8px">Run Monthly Closing</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Member</th><th>Requested</th><th>Net (after 10%)</th><th>Bank/UPI</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${payouts.length ? payouts.map((p) => `
                <tr>
                  <td>${esc(p.user?.name)}</td>
                  <td>${inr(p.requestedAmount)}</td>
                  <td>${inr(p.netAmount)}</td>
                  <td>${esc(p.bankOrUpi)}</td>
                  <td><span class="badge">${esc(p.status)}</span></td>
                  <td>
                    <button class="btn teal sm" data-pay="${p.id}|Successful">Mark Paid</button>
                    <button class="btn danger sm" data-pay="${p.id}|Rejected">Reject</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="6">No payout requests yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('runDailyClosing').onclick = async () => {
        await apiFetch('/admin/closing', { method: 'POST', body: JSON.stringify({ closingType: 'Daily' }) });
        toast('Daily closing completed');
      };
      document.getElementById('runMonthlyClosing').onclick = async () => {
        await apiFetch('/admin/closing', { method: 'POST', body: JSON.stringify({ closingType: 'Monthly' }) });
        toast('Monthly closing completed');
      };
      box.querySelectorAll('[data-pay]').forEach((b) => {
        b.onclick = async () => {
          const [id, status] = b.dataset.pay.split('|');
          await apiFetch(`/admin/payouts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
          toast(`Payout ${status}`);
          loadTabContent();
        };
      });
    } else if (activeTab === 'settings') {
      const [{ settings }, { logs }] = await Promise.all([
        apiFetch('/admin/settings'),
        apiFetch('/admin/logs'),
      ]);
      box.innerHTML = `
        <h2>Settings & Audit Logs</h2>
        <form id="settingsForm" class="card-box">
          <div class="form-grid">
            <label>Unit Value (₹)<input name="unit_value" value="${esc(settings.unit_value || '5000')}" /></label>
            <label>Profit Share %<input name="profit_share_percent" value="${esc(settings.profit_share_percent || '20')}" /></label>
            <label>Payout Deduction %<input name="payout_deduction_percent" value="${esc(settings.payout_deduction_percent || '10')}" /></label>
            <label>Support Email<input name="support_email" value="${esc(settings.support_email || '')}" /></label>
          </div>
          <button class="btn" style="margin-top:12px" type="submit">Save Settings</button>
        </form>
        <h3>Recent Admin Logs</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              ${logs.map((l) => `
                <tr>
                  <td>${new Date(l.createdAt).toLocaleString()}</td>
                  <td>${esc(l.admin?.username)}</td>
                  <td><b>${esc(l.action)}</b></td>
                  <td>${esc(l.details || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('settingsForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await apiFetch('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(Object.fromEntries(fd.entries())),
        });
        toast('Settings saved to database');
      };
    }
  } catch (err) {
    box.innerHTML = `<div class="err">Failed to load data: ${esc(err.message)}</div>`;
  }
}

renderShell();
