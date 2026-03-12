import { useState, useEffect, useRef } from 'react';

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


const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Condensed:wght@700;800;900&family=Roboto+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; overflow: hidden; }

  :root {
    --green:  #1EB53A;
    --yellow: #FCD116;
    --blue:   #00A3DD;
    --border: rgba(255,255,255,0.09);
    --muted:  rgba(255,255,255,0.45);
    --font-display: 'Roboto Condensed', sans-serif;
    --font-ui:      'Roboto', sans-serif;
    --font-mono:    'Roboto Mono', monospace;

    /* ── Font sizes ── change these to restyle the whole page */
    --fs-hook-badge:    9px;                    /* "NEW" badge */
    --fs-hook-text:     16px;                   /* announcement bar text */
    --fs-hook-cta:      16px;                   /* "Secure your spot →" */
    --fs-nav-logo:      26px;                   /* CyberRange TZ logo */
    --fs-hero-h1:       clamp(48px, 6vw, 88px); /* main headline */
    --fs-pill-btn:      12px;                   /* JOIN WAITLIST button */
    --fs-email:         16px;                   /* email input, submit & count badge */
    --fs-success-title: 40px;                   /* YOU'RE IN */
    --fs-success-sub:   16px;                   /* success subtitle */
    --fs-ref-label:     13px;                   /* REFERRAL PROGRESS label */
    --fs-share-url:     13px;                   /* share URL display */
    --fs-copy-btn:      14px;                   /* Copy button */
    --fs-form-error:    11px;                   /* error message */
    --fs-cards-heading: clamp(36px, 3.5vw, 56px); /* Why CyberRange TZ */
    --fs-card-title:    26px;                   /* feature card title */
    --fs-card-desc:     16px;                   /* feature card description */
    --fs-learn-arr:     17px;                   /* bottom bar arrow */
    --fs-learn-label:   11px;                   /* bottom bar label */
  }

  .cr-root {
    font-family: var(--font-ui);
    background: #000;
    color: #fff;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ─────────────────────────────────────────
     HOOK BAR  (top announcement)
  ───────────────────────────────────────── */
  .cr-hook {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px 24px;
    background: #080808;
    border-bottom: 1px solid var(--border);
  }
  .cr-hook-badge {
    font-family: var(--font-mono);
    font-size: var(--fs-hook-badge);
    font-weight: 700;
    letter-spacing: 0.12em;
    background: rgba(30,181,58,0.12);
    color: var(--green);
    border: 1px solid rgba(30,181,58,0.3);
    border-radius: 3px;
    padding: 2px 7px;
    flex-shrink: 0;
  }
  .cr-hook-text {
    font-size: var(--fs-hook-text);
    color: rgba(255,255,255,0.5);
  }
  .cr-hook-cta {
    font-size: var(--fs-hook-cta);
    font-weight: 600;
    color: var(--green);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: opacity 0.2s;
    flex-shrink: 0;
  }
  .cr-hook-cta:hover { opacity: 0.7; }

  /* ─────────────────────────────────────────
     NAV  — exact Micron structure
  ───────────────────────────────────────── */
  .cr-nav {
    flex-shrink: 0;
    position: relative;
    z-index: 20;
    display: flex;
    align-items: stretch;
    height: 62px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  /* CENTER: logo */
  .cr-nav-logo-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cr-nav-logo {
    font-family: var(--font-display);
    font-size: var(--fs-nav-logo);
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .cr-nav-logo em { font-style: normal; color: var(--green); }

  /* RIGHT: icon buttons + CTA */
  .cr-nav-right {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }
  .cr-nav-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .cr-nav-icon-btn:hover { color: #fff; }
  .cr-nav-signin {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 22px;
    background: none;
    border: none;
    color: #fff;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .cr-nav-signin:hover { color: var(--green); }

  /* ─────────────────────────────────────────
     HERO
  ───────────────────────────────────────── */
  .cr-hero {
    position: relative;
    flex: 0 0 57vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-align: left;
  }
  .cr-video {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center calc(50% + 200px);
    opacity: 0.52;
  }
  .cr-video-fallback {
    position: absolute;
    inset: 0;
    background: #050505;
  }
  .cr-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.05) 40%,
      rgba(0,0,0,0.6) 100%
    );
  }
  .cr-hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: calc(100% - 160px);
    max-width: 1200px;
    text-align: left;
  }
  .cr-hero-h1 {
    font-family: var(--font-display);
    font-size: var(--fs-hero-h1);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: 0.01em;
    margin-bottom: 32px;
    max-width: 700px;
    animation: cr-fade-up 0.8s 0.05s both;
  }
  .cr-hero-h1 em {
    font-style: normal;
    color: var(--green);
    text-shadow: 0 0 90px rgba(30,181,58,0.4);
  }

  /* ── Micron-exact pill button ── */
  .cr-pill-btn {
    font-family: var(--font-ui);
    font-size: var(--fs-pill-btn);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.6);
    padding: 12px 44px;
    border-radius: 100px;
    cursor: pointer;
    transition: border-color 0.25s, color 0.25s, box-shadow 0.25s;
    animation: cr-fade-up 0.8s 0.2s both;
  }
  .cr-pill-btn:hover {
    border-color: var(--green);
    color: var(--green);
    box-shadow: 0 0 40px rgba(30,181,58,0.18);
  }

  /* ── Referral teaser pill ── */
  .cr-referral-teaser {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: rgba(255,255,255,0.42);
    background: rgba(252,209,22,0.05);
    border: 1px solid rgba(252,209,22,0.18);
    border-radius: 100px;
    padding: 7px 18px;
    backdrop-filter: blur(8px);
    animation: cr-fade-up 0.8s 0.3s both;
  }
  .cr-referral-reward { color: var(--yellow); font-weight: 700; }

  /* ── Multi-step form ── */
  .cr-step-wrap {
    display: flex; flex-direction: column; gap: 14px;
    width: 100%; max-width: 480px; animation: cr-fade-up 0.35s both;
  }
  .cr-step-indicator {
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(255,255,255,0.38);
  }
  .cr-step-indicator span { color: var(--green); }
  .cr-step-label {
    font-family: var(--font-display); font-size: clamp(22px, 3vw, 30px);
    font-weight: 800; color: #fff; line-height: 1.15;
  }
  .cr-step-input-row {
    display: flex;
    background: rgba(0,0,0,0.52);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 100px;
    padding: 5px 5px 5px 22px;
    backdrop-filter: blur(16px);
  }
  .cr-step-input-row:focus-within { border-color: rgba(255,255,255,0.30); }
  .cr-step-input-row, .cr-step-input-row *,
  .cr-email-input, .cr-email-submit {
    outline: none !important;
    -webkit-tap-highlight-color: transparent;
  }
  .cr-email-input {
    flex: 1; background: none; border: none; outline: none;
    color: #fff; font-family: var(--font-ui); font-size: var(--fs-email); min-width: 0;
  }
  .cr-email-input::placeholder { color: rgba(255,255,255,0.28); }
  .cr-email-submit {
    font-family: var(--font-ui); font-size: var(--fs-email); font-weight: 700;
    letter-spacing: 0.08em; background: var(--green); color: #000;
    border: none; border-radius: 100px; padding: 9px 22px;
    cursor: pointer; white-space: nowrap; transition: background 0.2s; flex-shrink: 0;
  }
  .cr-email-submit:hover { background: #22d644; }
  .cr-email-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .cr-form-error {
    font-family: var(--font-mono); font-size: var(--fs-form-error); color: #f87171; margin-top: -6px;
  }

  /* ── Confirm box ── */
  .cr-confirm-box {
    background: rgba(0,0,0,0.60); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px; padding: 24px 28px; width: 100%; max-width: 420px;
    backdrop-filter: blur(16px); animation: cr-fade-up 0.35s both;
    display: flex; flex-direction: column; gap: 14px;
  }
  .cr-confirm-title {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(255,255,255,0.38); margin-bottom: 2px;
  }
  .cr-confirm-row {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 10px;
  }
  .cr-confirm-row:last-of-type { border-bottom: none; padding-bottom: 0; }
  .cr-confirm-key {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(255,255,255,0.35);
  }
  .cr-confirm-val { font-size: 14px; font-weight: 600; color: #fff; }
  .cr-confirm-btns { display: flex; gap: 10px; margin-top: 4px; }
  .cr-confirm-submit {
    flex: 1; font-family: var(--font-ui); font-size: 13px; font-weight: 700;
    letter-spacing: 0.06em; background: var(--green); color: #000;
    border: none; border-radius: 100px; padding: 12px 20px;
    cursor: pointer; transition: background 0.2s;
  }
  .cr-confirm-submit:hover { background: #22d644; }
  .cr-confirm-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .cr-confirm-back {
    font-family: var(--font-ui); font-size: 13px; font-weight: 600;
    background: none; border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.55);
    border-radius: 100px; padding: 12px 20px; cursor: pointer; transition: border-color 0.2s, color 0.2s;
  }
  .cr-confirm-back:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

  /* ── Confetti ── */
  .cr-confetti-wrap {
    position: fixed; inset: 0; pointer-events: none; z-index: 999; overflow: hidden;
  }
  .cr-confetti-piece {
    position: absolute; top: -20px; width: 8px; height: 14px;
    border-radius: 2px; opacity: 0;
    animation: cr-fall linear forwards;
  }
  @keyframes cr-fall {
    0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
    100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
  }

  /* ── Celebrate box ── */
  .cr-celebrate-box {
    background: rgba(0,0,0,0.60); border: 2px solid var(--green);
    border-radius: 16px; padding: 28px 32px; text-align: center;
    max-width: 420px; width: 100%;
    backdrop-filter: blur(16px); animation: cr-fade-up 0.5s both;
  }
  .cr-celebrate-emoji { font-size: 48px; margin-bottom: 8px; }
  .cr-celebrate-title {
    font-family: var(--font-display); font-size: clamp(28px, 4vw, 40px); font-weight: 900;
    color: var(--green); margin-bottom: 6px; line-height: 1.1;
  }
  .cr-celebrate-sub { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px; line-height: 1.6; }

  /* ── CTA wrapper ── */
  .cr-cta-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }

  /* ── Count badge ── */
  .cr-count-badge {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 16px; background: rgba(0,0,0,0.42);
    border: 1px solid var(--border); border-radius: 100px;
    font-size: var(--fs-email); color: var(--muted);
    backdrop-filter: blur(8px); animation: cr-fade-up 0.8s 0.35s both;
  }
  .cr-count-num { color: #fff; font-weight: 700; font-size: var(--fs-email); margin-right: 3px; }

  /* ── Success box — glassmorphism ── */
  .cr-success-box {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border-radius: 16px; padding: 22px 26px; text-align: center;
    max-width: 420px; width: 100%;
    animation: cr-fade-up 0.5s both;
  }
  .cr-success-title {
    font-family: var(--font-display); font-size: var(--fs-success-title); font-weight: 900;
    color: var(--green); margin-bottom: 4px;
  }
  .cr-success-sub { color: var(--muted); font-size: var(--fs-success-sub); margin-bottom: 14px; }
  .cr-ref-label {
    display: flex; justify-content: space-between;
    font-family: var(--font-mono); font-size: var(--fs-ref-label); letter-spacing: 0.1em;
    color: #fff; margin-bottom: 6px;
  }
  .cr-ref-num { color: var(--yellow); }
  .cr-progress-bar {
    height: 2px; background: rgba(255,255,255,0.07);
    border-radius: 99px; overflow: hidden; margin-bottom: 12px;
  }
  .cr-progress-fill {
    height: 100%; background: linear-gradient(90deg, var(--green), var(--blue));
    border-radius: 99px; transition: width 0.9s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cr-share-row {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border-radius: 8px; padding: 10px 14px;
    overflow: hidden; max-width: 100%; min-width: 0;
  }
  .cr-share-url {
    font-family: var(--font-mono); font-size: var(--fs-share-url); color: #111;
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  }
  .cr-copy-btn {
    font-family: var(--font-mono); font-size: var(--fs-copy-btn); background: none; border: none;
    cursor: pointer; color: #555; transition: color 0.2s;
    flex-shrink: 0; padding: 0; font-weight: 700;
  }
  .cr-copy-btn:hover, .cr-copy-btn.copied { color: var(--green); }

  /* ─────────────────────────────────────────
     FEATURES SECTION
  ───────────────────────────────────────── */
  .cr-cards-section {
    background: #050505;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }
  .cr-cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    width: calc(100% - 160px);
    max-width: 1200px;
    align-items: start;
  }

  /* Left heading column */
  .cr-cards-heading {
    padding: 24px 48px 24px 0;
  }
  .cr-cards-heading-title {
    font-family: var(--font-display);
    font-size: var(--fs-cards-heading);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  /* Feature columns */
  .cr-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px 36px;
  }
  .cr-card-title {
    font-family: var(--font-ui);
    font-size: var(--fs-card-title);
    font-weight: 700;
    line-height: 1.3;
  }
  .cr-card-desc {
    font-size: var(--fs-card-desc);
    line-height: 1.75;
    color: var(--muted);
    font-weight: 300;
  }

  /* ─────────────────────────────────────────
     LEARN MORE BAR  — Micron bottom strip
  ───────────────────────────────────────── */
  .cr-learn-bar {
    flex-shrink: 0;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 11px 0;
    background: #000;
  }
  .cr-learn-arr {
    font-size: var(--fs-learn-arr);
    line-height: 1;
    color: var(--green);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }
  .cr-learn-arr:hover { color: #fff; }
  .cr-learn-label {
    font-size: var(--fs-learn-label);
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────
     ANIMATIONS
  ───────────────────────────────────────── */
  @keyframes cr-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ─────────────────────────────────────────
     MOBILE RESPONSIVE
  ───────────────────────────────────────── */
  /* ── Tablet ── */
  @media (max-width: 768px) {
    :root {
      --fs-nav-logo: 20px;
      --fs-hero-h1: clamp(32px, 8vw, 48px);
      --fs-cards-heading: clamp(28px, 6vw, 36px);
      --fs-card-title: 20px;
      --fs-success-title: 28px;
    }

    /* Unlock scrolling on mobile */
    html, body, #root { overflow: auto; height: auto; }
    .cr-root { height: auto; min-height: 100vh; overflow: auto; }
    .cr-hero { min-height: 80vh; height: auto; flex: none; }
    .cr-video { object-position: center center; }
    .cr-cards-section { padding: 40px 0; }

    .cr-hook-bar { padding: 8px 16px; gap: 8px; }
    .cr-nav { padding: 0 16px; }
    .cr-nav-inner { padding: 14px 0; }
    .cr-nav-icon-btn { width: 40px; }
    .cr-nav-signin { padding: 0 12px; font-size: 11px; }

    .cr-hero-content { width: calc(100% - 40px); padding: 0 20px; }
    .cr-hero-h1 { max-width: 100%; margin-bottom: 24px; }

    .cr-step-input-row { padding: 4px 4px 4px 16px; }
    .cr-email-submit { padding: 10px 18px; }

    .cr-cards-grid {
      grid-template-columns: 1fr;
      width: calc(100% - 40px);
      gap: 0;
    }
    .cr-cards-heading { padding: 24px 0; }
    .cr-card { padding: 16px 0; border-left: none; border-top: 1px solid var(--border); }

    .cr-success-box { padding: 20px 16px; max-width: calc(100% - 40px); overflow: hidden; }
    .cr-share-row { flex-direction: column; gap: 8px; }
    .cr-share-url-box { max-width: 100%; }

    .cr-learn-bar { gap: 12px; padding: 10px 16px; }
  }

  /* ── Phone ── */
  @media (max-width: 480px) {
    :root {
      --fs-hero-h1: clamp(26px, 7vw, 36px);
      --fs-email: 14px;
      --fs-pill-btn: 11px;
      --fs-hook-text: 13px;
      --fs-hook-cta: 13px;
    }

    .cr-hook-bar .cr-hook-cta { display: none; }
    .cr-nav-icon-btn { width: 36px; }
    .cr-nav-signin span { display: none; }

    .cr-hero-content { width: calc(100% - 32px); padding: 0 16px; }
    .cr-pill-btn { padding: 8px 16px; }

    .cr-cards-grid { width: calc(100% - 32px); }
    .cr-card { padding: 14px 0; }
  }
`;



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

  const shareUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : '';

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function showForm() {
    setStatus('step1');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

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
    <>
      <style>{CSS}</style>
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

        {/* ── NAV  (mirrors Micron exactly) ── */}
        <nav className="cr-nav">
          {/* Center: logo */}
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
                        <span className="cr-ref-num">{referrals} / 10</span>
                      </div>
                      <div className="cr-progress-bar">
                        <div className="cr-progress-fill" style={{ width: `${Math.min((referrals / 10) * 100, 100)}%` }} />
                      </div>
                      <div className="cr-share-row">
                        <span className="cr-share-url">{shareUrl}</span>
                        <button className={`cr-copy-btn${copied ? ' copied' : ''}`} onClick={copyLink}>
                          {copied ? '✓ Copied' : 'Copy'}
                        </button>
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
            {/* Left: section label */}
            <div className="cr-cards-heading">
              <div className="cr-cards-heading-title">
                Why<br />CyberRange<br /><span style={{ color: 'var(--green)' }}>TZ</span>
              </div>
            </div>

            {/* 3 feature columns */}
            {cards.map(card => (
              <div key={card.id} className="cr-card">
                <div className="cr-card-title">{card.title_short}</div>
                <div className="cr-card-desc">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
