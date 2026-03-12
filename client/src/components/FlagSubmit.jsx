import { useState } from 'react';

export default function FlagSubmit({ labId, token, onSuccess }) {
  const [flag, setFlag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!flag.trim()) return;
    setError(''); setLoading(true);

    try {
      const res = await fetch(`/api/labs/${labId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flag: flag.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); onSuccess?.(); }
      else setError(data.error || 'Incorrect flag');
    } catch { setError('Failed to submit flag'); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="bg-tz-green/10 border border-tz-green/30 rounded-2xl p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tz-green/20 mb-2">
          <svg className="w-8 h-8 text-tz-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-tz-green">Lab Completed!</h3>
        <p className="text-cyber-muted text-sm">Great work! You've successfully completed this lab.</p>
        <div className="flex gap-1 justify-center pt-2">
          <div className="w-2 h-2 rounded-full bg-tz-green/50" />
          <div className="w-2 h-2 rounded-full bg-tz-yellow/50" />
          <div className="w-2 h-2 rounded-full bg-tz-blue/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-cyber-dark border border-tz-green/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-tz-green mb-1">Submit Your Flag</h3>
        <p className="text-cyber-muted text-sm mb-5">You've completed all the steps. Enter the flag you discovered.</p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input type="text" value={flag} onChange={e => setFlag(e.target.value)}
            placeholder="FLAG{...}"
            className="flex-1 bg-cyber-darker border border-cyber-border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-tz-green placeholder:text-gray-600" />
          <button type="submit" disabled={loading || !flag.trim()}
            className="bg-gradient-to-r from-tz-green to-tz-green-light text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-glow-green disabled:opacity-40">
            {loading ? '...' : 'Submit'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm mt-3 font-medium">{error}</p>}
      </div>
    </div>
  );
}
