import { useState, useMemo } from 'react';
import './AdminWaitlistPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminWaitlistPage() {
  const [secret, setSecret]   = useState('');
  const [authed, setAuthed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [data, setData]       = useState(null);
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('position');
  const [sortDir, setSortDir] = useState('asc');
  const [tab, setTab]         = useState('entries');
  const [topReferrers, setTopReferrers] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [expanded, setExpanded] = useState({});

  async function login(e) {
    e.preventDefault();
    if (!secret) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/waitlist/admin`, {
        headers: { 'x-admin-secret': secret },
      });
      if (res.status === 401) { setError('Wrong secret.'); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError('Could not connect to server.');
    }
    setLoading(false);
  }

  async function refresh() {
    const res = await fetch(`${API}/api/waitlist/admin`, {
      headers: { 'x-admin-secret': secret },
    });
    const json = await res.json();
    setData(json);
  }

  async function loadTopReferrers() {
    if (topReferrers) return;
    try {
      const res = await fetch(`${API}/api/waitlist/admin/top-referrers`, {
        headers: { 'x-admin-secret': secret },
      });
      const json = await res.json();
      setTopReferrers(json.topReferrers || []);
    } catch {
      setTopReferrers([]);
    }
  }

  async function loadTree() {
    if (treeData) return;
    try {
      const res = await fetch(`${API}/api/waitlist/admin/referral-tree`, {
        headers: { 'x-admin-secret': secret },
      });
      const json = await res.json();
      setTreeData(json.tree || []);
    } catch {
      setTreeData([]);
    }
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'top-referrers') loadTopReferrers();
    if (t === 'tree') loadTree();
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (!authed) {
    return (
      <div className="adm-root">
        <form className="adm-gate" onSubmit={login}>
          <div className="adm-gate-title">CyberRange TZ — Admin</div>
          <input
            className="adm-gate-input"
            type="password"
            placeholder="Enter admin secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            autoFocus
          />
          {error && <div className="adm-gate-error">{error}</div>}
          <button className="adm-gate-btn" type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  const entries = data?.entries || [];

  const filtered = useMemo(() =>
    entries.filter(r =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code.includes(search) ||
      (r.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.referred_by_email || '').toLowerCase().includes(search.toLowerCase())
    ), [entries, search]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'referral_count') { av = parseInt(av) || 0; bv = parseInt(bv) || 0; }
      if (sortKey === 'position') { av = parseInt(av); bv = parseInt(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }), [filtered, sortKey, sortDir]);

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const treeRoots = useMemo(() =>
    treeData
      ? treeData.filter(n => n.referral_count > 0)
          .map(parent => ({
            ...parent,
            children: treeData.filter(c => c.referred_by === parent.id),
          }))
          .sort((a, b) => b.referral_count - a.referral_count)
      : []
  , [treeData]);

  return (
    <div className="adm-root">
      <div className="adm-header">
        <div>
          <div className="adm-title">Waitlist <span>Dashboard</span></div>
        </div>
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-num">{data.count}</div>
            <div className="adm-stat-label">Total signups</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-num">{entries.filter(r => r.referred_by_email).length}</div>
            <div className="adm-stat-label">Via referral</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-num">{entries.filter(r => parseInt(r.referral_count) > 0).length}</div>
            <div className="adm-stat-label">Active referrers</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="adm-logout" onClick={() => { refresh(); setTopReferrers(null); setTreeData(null); }}>↻ Refresh</button>
          <button className="adm-logout" onClick={() => { setAuthed(false); setData(null); }}>Sign out</button>
        </div>
      </div>

      <div className="adm-tabs">
        <button className={`adm-tab${tab === 'entries' ? ' active' : ''}`} onClick={() => switchTab('entries')}>All Entries</button>
        <button className={`adm-tab${tab === 'top-referrers' ? ' active' : ''}`} onClick={() => switchTab('top-referrers')}>Top Referrers</button>
        <button className={`adm-tab${tab === 'tree' ? ' active' : ''}`} onClick={() => switchTab('tree')}>Referral Tree</button>
      </div>

      {tab === 'entries' && (
        <>
          <div className="adm-toolbar">
            <input
              className="adm-search"
              placeholder="Search by name, email, referral code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="adm-count-pill">{filtered.length} of {entries.length} entries</div>
          </div>

          <div className="adm-table-wrap">
            {entries.length === 0 ? (
              <div className="adm-loading">No signups yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('position')}>#{ arrow('position')}</th>
                    <th onClick={() => toggleSort('first_name')}>Name{arrow('first_name')}</th>
                    <th onClick={() => toggleSort('email')}>Email{arrow('email')}</th>
                    <th onClick={() => toggleSort('referral_code')}>Referral Code{arrow('referral_code')}</th>
                    <th onClick={() => toggleSort('referral_count')}>Referrals{arrow('referral_count')}</th>
                    <th>Referred By</th>
                    <th onClick={() => toggleSort('created_at')}>Joined{arrow('created_at')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(row => (
                    <tr key={row.id}>
                      <td className="td-pos">{row.position}</td>
                      <td className="td-email">{row.first_name ? `${row.first_name} ${row.last_name}` : '—'}</td>
                      <td className="td-email">{row.email}</td>
                      <td className="td-code">{row.referral_code}</td>
                      <td className={parseInt(row.referral_count) > 0 ? 'td-refs' : 'td-refs-zero'}>
                        {row.referral_count || 0}
                      </td>
                      <td className={row.referred_by_email ? 'td-via' : 'td-via-none'}>
                        {row.referred_by_email || '—'}
                      </td>
                      <td className="td-date">{fmt(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'top-referrers' && (
        <>
          {!topReferrers ? (
            <div className="adm-loading">Loading top referrers...</div>
          ) : topReferrers.length === 0 ? (
            <div className="adm-loading">No referrers yet.</div>
          ) : (
            <div className="adm-referrer-grid">
              {topReferrers.map(ref => (
                <div key={ref.id} className="adm-referrer-card">
                  <div className="adm-referrer-header">
                    <div>
                      <div className="adm-referrer-name">{ref.first_name} {ref.last_name}</div>
                      <div className="adm-referrer-email">{ref.email}</div>
                      <div className="adm-referrer-code">Code: {ref.referral_code}</div>
                    </div>
                    <div className="adm-referrer-count">{ref.referral_count}</div>
                  </div>
                  {ref.referrals && ref.referrals.length > 0 && (
                    <div className="adm-referral-list">
                      {ref.referrals.map((r, i) => (
                        <div key={i} className="adm-referral-item">
                          <span>{r.first_name} {r.last_name} — {r.email}</span>
                          <span className="adm-referral-item-date">{fmt(r.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tree' && (
        <>
          {!treeData ? (
            <div className="adm-loading">Loading referral tree...</div>
          ) : treeRoots.length === 0 ? (
            <div className="adm-loading">No referral chains yet.</div>
          ) : (
            <div className="adm-tree-root">
              {treeRoots.map(parent => (
                <div key={parent.id}>
                  <div className={`adm-tree-node${parent.children.length > 0 ? ' has-children' : ''}`}>
                    <div>
                      <strong>{parent.first_name} {parent.last_name}</strong>
                      <span style={{ color: 'var(--muted)', marginLeft: 10, fontSize: 12 }}>{parent.email}</span>
                      <span className="td-code" style={{ marginLeft: 10 }}>{parent.referral_code}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="td-refs">{parent.referral_count} referrals</span>
                      {parent.children.length > 0 && (
                        <button className="adm-tree-toggle" onClick={() => toggleExpand(parent.id)}>
                          {expanded[parent.id] ? '▾ Hide' : '▸ Show'}
                        </button>
                      )}
                    </div>
                  </div>
                  {expanded[parent.id] && parent.children.length > 0 && (
                    <div className="adm-tree-children">
                      {parent.children.map(child => (
                        <div key={child.id} className="adm-tree-child">
                          <span>{child.first_name} {child.last_name} — <span style={{ color: 'var(--muted)' }}>{child.email}</span></span>
                          <span className="adm-referral-item-date">{fmt(child.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
