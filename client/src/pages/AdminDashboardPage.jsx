import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Layers, MessageSquare, Plus, Minus, Search, Calendar, Shield, LogOut } from 'lucide-react';

export default function AdminDashboardPage({ theme, onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [usages, setUsages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'payments' | 'usages'
  
  // Search/Filters
  const [searchUser, setSearchUser] = useState('');
  
  // Credit editing states
  const [editingUserId, setEditingUserId] = useState(null);
  const [editCreditVal, setEditCreditVal] = useState(0);

  const token = localStorage.getItem('repograph_auth_token');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPayments();
    fetchUsages();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsages = async () => {
    try {
      const res = await fetch('/api/admin/usages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjustCredits = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ credits: Number(editCreditVal) })
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update credits.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Growth Chart Calculations (using custom SVG mapping) ──
  const getGrowthChartData = () => {
    if (!stats || !stats.growth || stats.growth.length === 0) return [];
    return stats.growth.map((item) => ({
      label: item._id.substring(5), // MM-DD
      val: item.count
    }));
  };

  const growthPoints = getGrowthChartData();
  const maxGrowthVal = growthPoints.length > 0 ? Math.max(...growthPoints.map(p => p.val)) : 10;
  
  // Package stats map
  const starterCount = stats?.packageSales?.starter || 0;
  const popularCount = stats?.packageSales?.popular || 0;
  const proCount = stats?.packageSales?.pro || 0;
  const totalSales = starterCount + popularCount + proCount || 1;

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'var(--graph-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      overflowY: 'auto',
      padding: '40px 24px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .admin-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .admin-card {
          background: var(--card-bg-glass);
          border: 1px solid var(--border-glass);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.15);
        }
        .tab-btn {
          padding: 10px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
          box-shadow: 0 0 15px rgba(124,58,237,0.3);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th, .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-glass);
          font-size: 13px;
        }
        .admin-table th {
          background: rgba(255,255,255,0.02);
          font-weight: 700;
          color: var(--text-secondary);
        }
        .search-bar {
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.15);
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          padding: 0 14px;
          width: 320px;
        }
        .search-input {
          background: transparent;
          border: none;
          color: white;
          padding: 10px 0 10px 8px;
          outline: none;
          font-size: 13px;
          flex: 1;
        }
      `}</style>

      <div className="admin-grid">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
                RepoGraph Admin Console
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Monitor system metrics, user growth, packages, and credits.
              </p>
            </div>
          </div>

          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10,
            color: '#fca5a5', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            transition: 'opacity 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.opacity = 0.85} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            <LogOut size={14} /> Log Out
          </button>
        </div>

        {/* Aggregate KPI cards */}
        <div className="stats-row">
          <div className="admin-card">
            <div style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} style={{ color: '#06b6d4' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>${stats?.summary?.totalRevenue || 0}</div>
            </div>
          </div>

          <div className="admin-card">
            <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{(stats?.summary?.totalUsers || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="admin-card">
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} style={{ color: '#34d399' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repositories</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{(stats?.summary?.totalRepos || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="admin-card">
            <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} style={{ color: '#fb7185' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Queries</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{(stats?.summary?.totalChats || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>System Overview</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Payments Log</button>
          <button className={`tab-btn ${activeTab === 'usages' ? 'active' : ''}`} onClick={() => setActiveTab('usages')}>Usage Activity</button>
        </div>

        {/* Tab Contents: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 360px)', gap: 20 }}>
            {/* User Growth SVG line chart */}
            <div style={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>User Growth (Last 30 Days)</h3>
              {growthPoints.length === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No growth data for the last 30 days.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <svg viewBox="0 0 500 200" style={{ width: '100%', height: 200 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* SVG Line mapping */}
                    <path
                      d={`M 0,200 ${growthPoints.map((p, idx) => {
                        const x = (idx / (growthPoints.length - 1)) * 500;
                        const y = 200 - (p.val / maxGrowthVal) * 160;
                        return `L ${x},${y}`;
                      }).join(' ')} L 500,200 Z`}
                      fill="url(#growthGrad)"
                    />
                    <path
                      d={growthPoints.map((p, idx) => {
                        const x = (idx / (growthPoints.length - 1)) * 500;
                        const y = 200 - (p.val / maxGrowthVal) * 160;
                        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>{growthPoints[0].label}</span>
                    <span>{growthPoints[Math.floor(growthPoints.length / 2)]?.label}</span>
                    <span>{growthPoints[growthPoints.length - 1].label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Popular packages breakdown bar */}
            <div style={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Package Sales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Starter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Starter Pack ($5)</span>
                    <span style={{ color: 'var(--text-muted)' }}>{starterCount} sold</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(starterCount/totalSales)*100}%`, height: '100%', background: '#67e8f9' }} />
                  </div>
                </div>

                {/* Popular */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Popular Pack ($12)</span>
                    <span style={{ color: 'var(--text-muted)' }}>{popularCount} sold</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(popularCount/totalSales)*100}%`, height: '100%', background: '#a78bfa' }} />
                  </div>
                </div>

                {/* Pro */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Pro Pack ($35)</span>
                    <span style={{ color: 'var(--text-muted)' }}>{proCount} sold</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(proCount/totalSales)*100}%`, height: '100%', background: '#f472b6' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Users */}
        {activeTab === 'users' && (
          <div style={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Users Management</h3>
              <div className="search-bar">
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user email..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Registered</th>
                  <th>Role</th>
                  <th>Credits Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.email}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                        background: u.role === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                        color: u.role === 'admin' ? '#a78bfa' : 'var(--text-secondary)'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>⚡ {u.credits ?? 0}</td>
                    <td>
                      {editingUserId === u._id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number"
                            value={editCreditVal}
                            onChange={e => setEditCreditVal(e.target.value)}
                            style={{
                              width: 60, height: 24, background: 'rgba(0,0,0,0.3)',
                              border: '1px solid var(--border-glass)', borderRadius: 4,
                              color: 'white', fontSize: 11, padding: '0 4px', outline: 'none'
                            }}
                          />
                          <button onClick={() => handleAdjustCredits(u._id)} style={{
                            background: 'var(--color-secondary)', border: 'none',
                            color: '#080721', fontSize: 10, fontWeight: 'bold',
                            padding: '3px 8px', borderRadius: 4, cursor: 'pointer'
                          }}>
                            Save
                          </button>
                          <button onClick={() => setEditingUserId(null)} style={{
                            background: 'none', border: '1px solid var(--border-glass)',
                            color: 'var(--text-muted)', fontSize: 10,
                            padding: '2px 8px', borderRadius: 4, cursor: 'pointer'
                          }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => {
                          setEditingUserId(u._id);
                          setEditCreditVal(u.credits ?? 0);
                        }} style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                          color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                          padding: '4px 10px', borderRadius: 6, cursor: 'pointer'
                        }}>
                          Adjust Credits
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Contents: Payments */}
        {activeTab === 'payments' && (
          <div style={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>Stripe Transaction Log</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Amount</th>
                  <th>Credits Added</th>
                  <th>Product Tier</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No payments processed yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p.email}</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>${p.amount.toFixed(2)}</td>
                      <td>+{p.credits.toLocaleString()}</td>
                      <td>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: '#67e8f9', fontWeight: 700 }}>
                          {p.pack.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Contents: Usages */}
        {activeTab === 'usages' && (
          <div style={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>Recent Usage Actions</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Action Type</th>
                  <th>Credits Deducted</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {usages.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No usage logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  usages.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                          background: u.type === 'analyze' ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)',
                          color: u.type === 'analyze' ? '#34d399' : '#67e8f9'
                        }}>
                          {u.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: '#fb7185', fontWeight: 700 }}>−{u.creditsDeducted}</td>
                      <td>{u.details}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
