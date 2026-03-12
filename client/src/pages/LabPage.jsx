import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api';
import Terminal from '../components/Terminal';
import StepPanel from '../components/StepPanel';
import FlagSubmit from '../components/FlagSubmit';

export default function LabPage() {
  const { labId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const api = authApi(token);

  const [lab, setLab] = useState(null);
  const [wsSessionId, setWsSessionId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [connected, setConnected] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showFlag, setShowFlag] = useState(() => {
    try {
      JSON.parse(localStorage.getItem(`lab-progress-${labId}`));
      return false;
    } catch { return false; }
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/labs').then(data => {
      // Search across all modules for this lab
      for (const mod of data.modules) {
        const found = mod.labs.find(l => l.id === labId);
        if (found) {
          found.moduleName = mod.module;
          setLab(found);
          return;
        }
      }
      setError('Lab not found');
    }).catch(err => setError(err.message));
  }, [labId, token]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(expiresAt) - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(interval); setWsSessionId(null); setConnected(false); }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function startLab() {
    setStarting(true); setError('');
    try {
      const data = await api(`/api/labs/${labId}/start`, { method: 'POST' });
      setWsSessionId(data.wsSessionId);
      setExpiresAt(data.expiresAt);
    } catch (err) { setError(err.message); }
    finally { setStarting(false); }
  }

  async function endSession() {
    try { await api(`/api/labs/${labId}/stop`, { method: 'POST' }); } catch {}
    setWsSessionId(null); setConnected(false);
  }

  function formatTime(ms) {
    if (!ms) return '--:--';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (error && !lab) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-red-400">{error}</div></div>;
  }
  if (!lab) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-tz-green animate-pulse">Loading lab...</div></div>;
  }

  const isRed = lab.type === 'red';
  const isBlue = lab.type === 'blue';
  const badgeBg = isRed
    ? 'bg-red-500/15 text-red-400 border-red-500/20'
    : isBlue
      ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
      : 'bg-tz-green/15 text-tz-green border-tz-green/20';

  const badgeLabel = isRed ? 'Red Team — Attack' : isBlue ? 'Blue Team — Defend' : 'Learn';

  const preStartDescription = isRed
    ? 'Use offensive tools to scan and enumerate a target network. Follow the guided steps and complete the challenge.'
    : isBlue
      ? 'Analyze system logs to detect an attacker and deploy defensive measures. Follow the guided steps and complete the challenge.'
      : 'Follow the guided steps to learn essential Linux commands hands-on in a live terminal. Complete each step to progress.';

  const startBtnClass = isRed
    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg'
    : isBlue
      ? 'bg-gradient-to-r from-tz-blue to-blue-600 hover:shadow-glow-blue'
      : 'bg-gradient-to-r from-tz-green to-emerald-600 hover:shadow-lg';

  // Pre-start screen
  if (!wsSessionId) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="tz-stripe-bar" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-lg mx-auto px-6">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${badgeBg}`}>
              {badgeLabel}
            </span>
            <h1 className="text-3xl font-bold tracking-tight">{lab.title}</h1>
            <p className="text-cyber-muted leading-relaxed">{preStartDescription}</p>

            <div className="flex items-center justify-center gap-6 text-sm text-cyber-muted">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-tz-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {lab.steps.length} steps
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-tz-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                60 min limit
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-tz-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Live terminal
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-border-light font-medium">
                Back
              </button>
              <button onClick={startLab} disabled={starting}
                className={`px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50 ${startBtnClass}`}>
                {starting ? 'Starting container...' : 'Start Lab'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active lab — split screen
  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className={`bg-cyber-darker border-b border-cyber-border px-4 py-2.5 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => { endSession(); navigate('/dashboard'); }}
            className="text-cyber-muted hover:text-white text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit
          </button>
          <div className="w-px h-4 bg-cyber-border" />
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${badgeBg}`}>{badgeLabel}</span>
          <span className="text-sm font-medium">{lab.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-sm font-mono tabular-nums ${timeLeft && timeLeft < 300000 ? 'text-red-400 animate-pulse' : 'text-cyber-muted'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-tz-green' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-xs text-cyber-muted">{connected ? 'Connected' : 'Connecting'}</span>
          </div>
          <button onClick={endSession}
            className="text-xs text-cyber-muted hover:text-red-400 border border-cyber-border px-3 py-1.5 rounded-lg hover:border-red-500/30">
            End Session
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel — Steps */}
        <div className="w-[40%] border-r border-cyber-border overflow-y-auto p-6 bg-cyber-darker/30">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{lab.title}</h2>
            <p className="text-cyber-muted text-sm mt-1">Module: {lab.moduleName}</p>
          </div>

          {!showFlag ? (
            <StepPanel steps={lab.steps} labType={lab.type} labId={labId} token={token}
              onAllComplete={() => setShowFlag(true)} />
          ) : (
            <FlagSubmit labId={labId} token={token} />
          )}
        </div>

        {/* Right panel — Terminal */}
        <div className="w-[60%] h-full min-h-0 bg-cyber-dark">
          <Terminal sessionId={wsSessionId} token={token} onConnected={setConnected} />
        </div>
      </div>
    </div>
  );
}
