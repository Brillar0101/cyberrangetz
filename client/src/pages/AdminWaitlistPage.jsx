import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Roboto+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green:  #1EB53A;
    --yellow: #FCD116;
    --blue:   #00A3DD;
    --red:    #f87171;
    --border: rgba(255,255,255,0.09);
    --muted:  rgba(255,255,255,0.45);
    --bg:     #050505;
    --surface:#0d0d0d;
  }

  .adm-root {
    font-family: 'Roboto', sans-serif;
    background: var(--bg);
    color: #fff;
    min-height: 100vh;
    padding: 40px 60px;
  }

  /* ── Login gate ── */
  .adm-gate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
  }
  .adm-gate-title {
    font-family: 'Roboto', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--green);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .adm-gate-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 18px;
    color: #fff;
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    width: 320px;
    outline: none;
  }
  .adm-gate-input:focus { border-color: var(--green); }
  .adm-gate-btn {
    background: var(--green);
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    width: 320px;
    transition: background 0.2s;
  }
  .adm-gate-btn:hover { background: #22d644; }
  .adm-gate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-gate-error { color: var(--red); font-size: 13px; }

  /* ── Dashboard header ── */
  .adm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .adm-title {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .adm-title span { color: var(--green); }
  .adm-stats {
    display: flex;
    gap: 32px;
  }
  .adm-stat {
    text-align: right;
  }
  .adm-stat-num {
    font-size: 32px;
    font-weight: 700;
    color: var(--green);
    line-height: 1;
  }
  .adm-stat-label {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .adm-logout {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }
  .adm-logout:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

  /* ── Search / filter bar ── */
  .adm-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .adm-search {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    color: #fff;
    font-size: 14px;
    outline: none;
    max-width: 380px;
  }
  .adm-search:focus { border-color: var(--green); }
  .adm-search::placeholder { color: var(--muted); }
  .adm-count-pill {
    font-size: 12px;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 6px 14px;
  }

  /* ── Table ── */
  .adm-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  thead tr {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  th {
    text-align: left;
    padding: 12px 16px;
    font-family: 'Roboto Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  th:hover { color: #fff; }
  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.03); }
  td {
    padding: 12px 16px;
    color: rgba(255,255,255,0.85);
    white-space: nowrap;
  }
  .td-pos {
    font-family: 'Roboto Mono', monospace;
    color: var(--muted);
    font-size: 12px;
  }
  .td-email {
    font-weight: 500;
  }
  .td-code {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    color: var(--blue);
  }
  .td-refs {
    font-weight: 700;
    color: var(--green);
  }
  .td-refs-zero { color: var(--muted); font-weight: 400; }
  .td-date {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    color: var(--muted);
  }
  .td-via {
    font-size: 12px;
    color: var(--yellow);
  }
  .td-via-none { color: var(--muted); font-size: 12px; }

  /* ── Loading / empty ── */
  .adm-loading {
    text-align: center;
    padding: 60px;
    color: var(--muted);
    font-size: 14px;
  }
`;

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

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (!authed) {
    return (
      <>
        <style>{CSS}</style>
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
      </>
    );
  }

  const entries = data?.entries || [];

  const filtered = entries.filter(r =>
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.referral_code.includes(search) ||
    (r.referred_by_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'referral_count') { av = parseInt(av) || 0; bv = parseInt(bv) || 0; }
    if (sortKey === 'position') { av = parseInt(av); bv = parseInt(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <>
      <style>{CSS}</style>
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
            <button className="adm-logout" onClick={refresh}>↻ Refresh</button>
            <button className="adm-logout" onClick={() => { setAuthed(false); setData(null); }}>Sign out</button>
          </div>
        </div>

        <div className="adm-toolbar">
          <input
            className="adm-search"
            placeholder="Search by email, referral code..."
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
      </div>
    </>
  );
}
