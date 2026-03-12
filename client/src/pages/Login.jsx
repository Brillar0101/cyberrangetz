import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="tz-stripe-bar" />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-tz-green to-tz-blue mb-4 shadow-glow-green">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-tz-green">Cyber</span><span className="text-white">Range</span> <span className="text-tz-blue">TZ</span>
            </h1>
            <p className="text-cyber-muted mt-2 text-sm tracking-wide">Cybersecurity Training for Tanzania</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-semibold text-center">Welcome back</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-cyber-muted mb-1.5 font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-cyber-darker border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tz-green placeholder:text-gray-600"
                placeholder="student@university.ac.tz" />
            </div>

            <div>
              <label className="block text-sm text-cyber-muted mb-1.5 font-medium">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-cyber-darker border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tz-green placeholder:text-gray-600"
                placeholder="Enter your password" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-tz-green to-tz-green-light text-white font-semibold py-3 rounded-xl hover:shadow-glow-green disabled:opacity-50 tracking-wide">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-cyber-muted text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-tz-green font-medium hover:underline">Create one</Link>
            </p>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-tz-green/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-tz-yellow/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-tz-blue/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
