import { useState, useEffect, useRef } from 'react';
import './WaitlistPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 50;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

const LS_KEY = 'cr_waitlist_v1';

export default function WaitlistPage() {
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [status, setStatus]         = useState('idle');
  const [referralCode, setRefCode]  = useState('');
  const [referrals, setReferrals]   = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [copied, setCopied]         = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [confetti, setConfetti]     = useState([]);
  const [tiers, setTiers]           = useState([]);
  const [emailSent, setEmailSent]       = useState(null);
  const [emailOpened, setEmailOpened]   = useState(false);
  const [resending, setResending]       = useState(false);
  const [resendMsg, setResendMsg]       = useState('');
  const inputRef = useRef();

  const refCode = new URLSearchParams(window.location.search).get('ref') || '';

  // Restore saved signup on page load
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const { email: e, referralCode: rc, referrals: rv } = JSON.parse(saved);
        setEmail(e);
        setRefCode(rc);
        setReferrals(rv || 0);
        setStatus('done');
      } catch { localStorage.removeItem(LS_KEY); }
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/api/waitlist/count`)
      .then(r => r.json())
      .then(d => setTotalCount(d.count))
      .catch(() => setTotalCount(0));
  }, []);

  // Fetch tier definitions
  useEffect(() => {
    fetch(`${API}/api/waitlist/tiers`)
      .then(r => r.json())
      .then(d => setTiers(d.tiers || []))
      .catch(() => setTiers([
        { name: 'Priority Access', required_referrals: 3 },
        { name: 'Early Beta', required_referrals: 5 },
        { name: 'Founding Member', required_referrals: 10 },
      ]));
  }, []);

  // Check email status when signed up
  useEffect(() => {
    if (status !== 'done' && status !== 'celebrate') return;
    if (!email) return;
    fetch(`${API}/api/waitlist/email-status/${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => {
        setEmailSent(d.emailSent || false);
        setEmailOpened(d.emailOpened || false);
      })
      .catch(() => {});
  }, [status, email]);

  // Poll referral count every 30s when signed up
  useEffect(() => {
    if (status !== 'done' || !referralCode) return;
    const poll = setInterval(() => {
      fetch(`${API}/api/waitlist/referrals/${referralCode}`)
        .then(r => r.json())
        .then(d => { if (d.referralCount !== undefined) setReferrals(d.referralCount); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(poll);
  }, [status, referralCode]);

  const animCount = useCountUp(totalCount);

  function goNext(e) {
    e.preventDefault();
    if (status === 'step1' && firstName.trim()) { setStatus('step2'); setTimeout(() => inputRef.current?.focus(), 60); }
    else if (status === 'step2' && lastName.trim()) { setStatus('step3'); setTimeout(() => inputRef.current?.focus(), 60); }
    else if (status === 'step3' && email.trim()) { setStatus('confirm'); }
  }

  function launchConfetti() {
    const colors = ['#1EB53A','#FCD116','#00A3DD','#fff','#f87171','#a78bfa'];
    const pieces = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.8 + Math.random() * 2,
      delay: Math.random() * 0.8,
      width: 6 + Math.random() * 8,
      height: 10 + Math.random() * 12,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 4000);
  }

  async function handleConfirm() {
    setStatus('loading');
    try {
      const res = await fetch(`${API}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, ref: refCode }),
      });
      const data = await res.json();
      if (data.success) {
        setRefCode(data.referralCode);
        setReferrals(data.referrals || 0);
        setTotalCount(data.count || 0);
        setStatus('celebrate');
        launchConfetti();
        localStorage.setItem(LS_KEY, JSON.stringify({
          email,
          referralCode: data.referralCode,
          referrals: data.referrals || 0,
          joinedAt: new Date().toISOString(),
        }));
        setTimeout(() => setStatus('done'), 3200);
      } else { setStatus('error'); }
    } catch { setStatus('error'); }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch(`${API}/api/waitlist/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setResendMsg('Email sent! Check your inbox.');
        setEmailSent(true);
      } else {
        setResendMsg(data.error || 'Failed to resend.');
      }
    } catch {
      setResendMsg('Failed to resend. Try again later.');
    }
    setResending(false);
  }

  const shareUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : '';

  function copyLink() {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function showForm() {
    setStatus('step1');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  const maxTier = tiers.length > 0 ? tiers[tiers.length - 1].required_referrals : 10;

  const cards = [
    {
      id: 'terminals',
      title_short: 'Real Linux Terminals',
      desc: 'A full Kali shell runs directly in your browser. No installs, no hardware, zero setup required.',
    },
    {
      id: 'attack',
      title_short: 'Attack & Defend',
      desc: 'Hack the lab first, then learn to defend it. Offense-first training builds real instincts.',
    },
    {
      id: 'africa',
      title_short: 'Built for East Africa',
      desc: 'Scenarios simulate M-Pesa fraud, SIM swap attacks, and telecom threats relevant to the region.',
    },
  ];

  return (
    <div className="cr-root">

      {/* ── HOOK BAR ── */}
      <div className="cr-hook">
        <span className="cr-hook-text">
          Tanzania's first browser-based cybersecurity lab is almost here
        </span>
        <button className="cr-hook-cta" onClick={showForm}>
          Secure your spot →
        </button>
      </div>

      {/* ── NAV ── */}
      <nav className="cr-nav">
        <div className="cr-nav-logo-wrap">
          <div className="cr-nav-logo">
            CyberRange&nbsp;<em>TZ</em>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="cr-hero">
        {!videoError ? (
          <video
            className="cr-video"
            autoPlay muted loop playsInline
            onError={() => setVideoError(true)}
          >
            <source src="https://res.cloudinary.com/dq97oiqri/video/upload/v1/hero_m1li33.mp4" type="video/mp4" />
            <source src="https://res.cloudinary.com/dq97oiqri/video/upload/v1/hero_m1li33.webm" type="video/webm" />
          </video>
        ) : (
          <div className="cr-video-fallback" />
        )}
        <div className="cr-hero-overlay" />

        <div className="cr-hero-content">
          <h1 className="cr-hero-h1">
            The Cyber Training Ground<br />
            <em>Built for Africa</em>
          </h1>

          <div className="cr-cta-area">

            {/* Confetti overlay */}
            {confetti.length > 0 && (
              <div className="cr-confetti-wrap">
                {confetti.map(p => (
                  <div key={p.id} className="cr-confetti-piece" style={{
                    left: `${p.left}%`,
                    backgroundColor: p.color,
                    width: p.width,
                    height: p.height,
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                  }} />
                ))}
              </div>
            )}

            {status === 'idle' && (
              <button className="cr-pill-btn" onClick={showForm}>
                JOIN WAITLIST
              </button>
            )}

            {(status === 'step1' || status === 'step2' || status === 'step3') && (
              <form className="cr-step-wrap" onSubmit={goNext}>
                <div className="cr-step-indicator">
                  Step <span>{status === 'step1' ? 1 : status === 'step2' ? 2 : 3}</span> / 3
                </div>
                <div className="cr-step-label">
                  {status === 'step1' && 'Enter your first name'}
                  {status === 'step2' && 'Enter your last name'}
                  {status === 'step3' && 'Enter your email address'}
                </div>
                <div className="cr-step-input-row">
                  {status === 'step1' && (
                    <input ref={inputRef} type="text" className="cr-email-input"
                      placeholder="First name" value={firstName}
                      onChange={e => setFirstName(e.target.value)} required autoFocus />
                  )}
                  {status === 'step2' && (
                    <input ref={inputRef} type="text" className="cr-email-input"
                      placeholder="Last name" value={lastName}
                      onChange={e => setLastName(e.target.value)} required autoFocus />
                  )}
                  {status === 'step3' && (
                    <input ref={inputRef} type="email" className="cr-email-input"
                      placeholder="Email address" value={email}
                      onChange={e => setEmail(e.target.value)} required autoFocus />
                  )}
                  <button type="submit" className="cr-email-submit">
                    {status === 'step3' ? 'Review →' : 'Next →'}
                  </button>
                </div>
              </form>
            )}

            {status === 'confirm' && (
              <div className="cr-confirm-box">
                <div className="cr-confirm-title">Confirm your details</div>
                <div className="cr-confirm-row">
                  <span className="cr-confirm-key">First name</span>
                  <span className="cr-confirm-val">{firstName}</span>
                </div>
                <div className="cr-confirm-row">
                  <span className="cr-confirm-key">Last name</span>
                  <span className="cr-confirm-val">{lastName}</span>
                </div>
                <div className="cr-confirm-row">
                  <span className="cr-confirm-key">Email</span>
                  <span className="cr-confirm-val">{email}</span>
                </div>
                <div className="cr-confirm-btns">
                  <button className="cr-confirm-back" onClick={() => setStatus('step1')}>Edit</button>
                  <button className="cr-confirm-submit" onClick={handleConfirm}>
                    Confirm & Join →
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="cr-step-wrap">
                <div className="cr-step-indicator"><span>Securing your spot...</span></div>
              </div>
            )}

            {(status === 'celebrate' || status === 'done') && (
              <>
                {status === 'celebrate' && (
                  <div className="cr-celebrate-box">
                    <div className="cr-celebrate-emoji">🎉</div>
                    <div className="cr-celebrate-title">CONGRATULATIONS!</div>
                    <div className="cr-celebrate-sub">
                      You've joined the CyberRange TZ waitlist.<br />
                      Check your email for confirmation.
                    </div>
                  </div>
                )}
                {status === 'done' && (
                  <div className="cr-success-box">
                    <div className="cr-success-title">YOU'RE IN.</div>
                    <p className="cr-success-sub">We'll notify you when the pilot launches.</p>
                    <div className="cr-ref-label">
                      <span>REFERRAL PROGRESS</span>
                      <span className="cr-ref-num">{referrals} / {maxTier}</span>
                    </div>
                    <div className="cr-progress-bar">
                      <div className="cr-progress-fill" style={{ width: `${Math.min((referrals / maxTier) * 100, 100)}%` }} />
                    </div>
                    <div className="cr-share-row">
                      <span className="cr-share-url">{shareUrl}</span>
                      <button className={`cr-copy-btn${copied ? ' copied' : ''}`} onClick={copyLink}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="cr-share-btns">
                      <a className="cr-share-btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`Join CyberRange TZ — Tanzania's first browser-based cybersecurity lab! ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Share on WhatsApp
                      </a>
                    </div>

                    {/* Email status */}
                    <div className="cr-email-status">
                      <div className="cr-email-status-row">
                        <span className={`cr-email-dot ${emailSent ? 'sent' : 'not-sent'}`} />
                        <span className="cr-email-status-text">
                          {emailSent === null ? 'Checking email status...' :
                           emailSent ? 'Confirmation email sent' : 'Email not sent yet'}
                        </span>
                      </div>
                      {emailOpened && (
                        <div className="cr-email-status-row">
                          <span className="cr-email-dot opened" />
                          <span className="cr-email-status-text">Email opened</span>
                        </div>
                      )}
                      {!emailSent && emailSent !== null && (
                        <button
                          className="cr-resend-btn"
                          onClick={handleResend}
                          disabled={resending}
                        >
                          {resending ? 'Sending...' : 'Resend Email'}
                        </button>
                      )}
                      {emailSent && (
                        <button
                          className="cr-resend-btn secondary"
                          onClick={handleResend}
                          disabled={resending}
                        >
                          {resending ? 'Sending...' : 'Resend Email'}
                        </button>
                      )}
                      {resendMsg && (
                        <p className={`cr-resend-msg ${resendMsg.includes('sent') ? 'success' : 'error'}`}>
                          {resendMsg}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {status === 'error' && (
              <>
                <button className="cr-pill-btn" onClick={() => setStatus('confirm')}>Try Again</button>
                <p className="cr-form-error">Something went wrong. Please try again.</p>
              </>
            )}

            {status !== 'done' && (
              <div className="cr-count-badge">
                <span>
                  <span className="cr-count-num">{animCount}</span>
                  {' '}people waiting
                </span>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="cr-cards-section">
        <div className="cr-cards-grid">
          <div className="cr-cards-heading">
            <div className="cr-cards-heading-title">
              Why CyberRange <span style={{ color: 'var(--green)' }}>TZ</span>
            </div>
          </div>
          {cards.map(card => (
            <div key={card.id} className="cr-card">
              <div className="cr-card-title">{card.title_short}</div>
              <div className="cr-card-desc">{card.desc}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
