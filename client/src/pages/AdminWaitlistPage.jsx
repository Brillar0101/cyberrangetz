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

  // Newsletter state
  const [nlSubject, setNlSubject]     = useState('');
  const [nlBody, setNlBody]           = useState('');
  const [nlSending, setNlSending]     = useState(false);
  const [nlResult, setNlResult]       = useState(null);
  const [nlPreview, setNlPreview]     = useState(false);

  // Resend state (tracks which row is currently resending)
  const [resendingId, setResendingId] = useState(null);

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
      if (!res.ok) { setError(`Server error (${res.status})`); setLoading(false); return; }
      const json = await res.json();
      console.log('[admin] API response:', JSON.stringify(json).slice(0, 500));
      // Ensure count is a number
      json.count = parseInt(json.count) || 0;
      // Ensure entries are safe to render
      if (Array.isArray(json.entries)) {
        json.entries = json.entries.map(e => ({
          ...e,
          position: String(e.position ?? ''),
          referral_count: String(e.referral_count ?? 0),
          first_name: String(e.first_name ?? ''),
          last_name: String(e.last_name ?? ''),
          email: String(e.email ?? ''),
          referral_code: String(e.referral_code ?? ''),
          referred_by_email: e.referred_by_email ? String(e.referred_by_email) : null,
          created_at: e.created_at ? String(e.created_at) : null,
        }));
      }
      setData(json);
      setAuthed(true);
    } catch (err) {
      console.error('[admin] Login error:', err);
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

  async function sendNewsletter() {
    if (!nlSubject.trim() || !nlBody.trim()) return;
    if (!window.confirm(`Send this newsletter to ALL ${data?.count || 0} subscribers?`)) return;
    setNlSending(true);
    setNlResult(null);
    try {
      const res = await fetch(`${API}/api/waitlist/admin/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          subject: nlSubject.trim(),
          bodyContent: nlBody.trim().replace(/\n/g, '<br />'),
        }),
      });
      if (res.status === 401) { setNlResult({ error: 'Unauthorized' }); setNlSending(false); return; }
      const json = await res.json();
      setNlResult(json);
    } catch (err) {
      setNlResult({ error: err.message || 'Failed to send' });
    }
    setNlSending(false);
  }

  async function resendEmail(row) {
    setResendingId(row.id);
    try {
      const res = await fetch(`${API}/api/waitlist/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Email resent to ${row.email}`);
        refresh();
      } else {
        alert(`Failed: ${json.error || 'Unknown error'}`);
      }
    } catch {
      alert('Failed to resend email.');
    } finally {
      setResendingId(null);
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

  // All hooks MUST be called before any early return (Rules of Hooks)
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

  if (!authed) {
    return (
      <div className="adm-root">
        <form className="adm-gate" onSubmit={login}>
          <div className="adm-gate-card">
            <div className="adm-gate-lock">&#128274;</div>
            <div className="adm-gate-title"><span>Cyber</span>Range TZ</div>
            <div className="adm-gate-subtitle">Admin Dashboard</div>
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
          </div>
        </form>
      </div>
    );
  }

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
        <div className="adm-header-actions">
          <button className="adm-logout" onClick={() => { refresh(); setTopReferrers(null); setTreeData(null); }}>↻ Refresh</button>
          <button className="adm-logout" onClick={() => { setAuthed(false); setData(null); }}>Sign out</button>
        </div>
      </div>

      <div className="adm-tabs">
        <button className={`adm-tab${tab === 'entries' ? ' active' : ''}`} onClick={() => switchTab('entries')}>All Entries</button>
        <button className={`adm-tab${tab === 'top-referrers' ? ' active' : ''}`} onClick={() => switchTab('top-referrers')}>Top Referrers</button>
        <button className={`adm-tab${tab === 'tree' ? ' active' : ''}`} onClick={() => switchTab('tree')}>Referral Tree</button>
        <button className={`adm-tab${tab === 'newsletter' ? ' active' : ''}`} onClick={() => switchTab('newsletter')}>Newsletter</button>
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
                    <th>Email Status</th>
                    <th>Actions</th>
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
                      <td className="td-email-status">
                        <span className={`adm-dot ${row.email_sent ? 'sent' : 'not-sent'}`} />
                        {row.email_sent ? 'Sent' : 'Not sent'}
                        {row.email_opened_at && (
                          <span className="adm-opened-badge">Opened</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="adm-resend-btn"
                          onClick={() => resendEmail(row)}
                          disabled={resendingId === row.id}
                        >
                          {resendingId === row.id ? '...' : 'Resend'}
                        </button>
                      </td>
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

      {tab === 'newsletter' && (
        <div className="adm-nl">
          <div className="adm-nl-grid">
            {/* Compose */}
            <div className="adm-nl-compose">
              <div className="adm-nl-section-title">Compose Newsletter</div>
              <div className="adm-nl-info">
                Sending to <strong>{data?.count || 0}</strong> subscribers. Each email is personalized with "Hi [FirstName]".
              </div>
              <label className="adm-nl-label">Subject</label>
              <input
                className="adm-nl-input"
                placeholder="e.g. Cybersecurity Tip #1 — Phishing Awareness"
                value={nlSubject}
                onChange={e => setNlSubject(e.target.value)}
              />
              <label className="adm-nl-label">Body <span className="adm-nl-hint">(plain text — line breaks become paragraphs)</span></label>
              <textarea
                className="adm-nl-textarea"
                placeholder="Write your newsletter content here..."
                rows={12}
                value={nlBody}
                onChange={e => setNlBody(e.target.value)}
              />
              <div className="adm-nl-actions">
                <button
                  className="adm-nl-preview-btn"
                  onClick={() => setNlPreview(!nlPreview)}
                  disabled={!nlBody.trim()}
                >
                  {nlPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  className="adm-nl-send-btn"
                  onClick={sendNewsletter}
                  disabled={nlSending || !nlSubject.trim() || !nlBody.trim()}
                >
                  {nlSending ? 'Sending...' : `Send to ${data?.count || 0} subscribers`}
                </button>
              </div>
              {nlResult && (
                <div className={`adm-nl-result ${nlResult.error ? 'error' : 'success'}`}>
                  {nlResult.error
                    ? `Error: ${nlResult.error}`
                    : `Sent ${nlResult.sent} of ${nlResult.total} emails${nlResult.failed > 0 ? ` (${nlResult.failed} failed)` : ''}.`}
                </div>
              )}
            </div>

            {/* Preview */}
            {nlPreview && nlBody.trim() && (
              <div className="adm-nl-preview">
                <div className="adm-nl-section-title">Preview</div>
                <div className="adm-nl-preview-card">
                  <div className="adm-nl-preview-logo">
                    <span style={{ color: 'var(--green)' }}>Cyber</span>Range TZ
                  </div>
                  <div className="adm-nl-preview-accent" />
                  <div className="adm-nl-preview-label">Newsletter</div>
                  <div className="adm-nl-preview-greeting">Hi FirstName,</div>
                  <div className="adm-nl-preview-body">
                    {nlBody.split('\n').map((line, i) => (
                      <p key={i} style={{ margin: '0 0 10px' }}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                  <div className="adm-nl-preview-tipbox">
                    <div className="adm-nl-preview-tipbox-title">Stay Connected</div>
                    <div className="adm-nl-preview-tipbox-text">Follow us for cybersecurity tips, industry news, and early access updates.</div>
                  </div>
                  <div className="adm-nl-preview-cta">Visit CyberRange TZ &rarr;</div>
                  <div className="adm-nl-preview-divider" />
                  <div className="adm-nl-preview-signoff">
                    <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.55)' }}>Best,</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>The CyberRange TZ Team</p>
                  </div>
                  <div className="adm-nl-preview-footer">
                    You received this because you joined the CyberRange TZ waitlist.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
