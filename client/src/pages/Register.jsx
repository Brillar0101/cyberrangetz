import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', university: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      await register(form.name, form.email, form.university, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Kimaro', required: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'student@udsm.ac.tz', required: true },
    { key: 'university', label: 'University', type: 'text', placeholder: 'University of Dar es Salaam', required: false },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters', required: true },
    { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password', required: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="tz-stripe-bar" />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-tz-green">Cyber</span><span className="text-white">Range</span> <span className="text-tz-blue">TZ</span>
            </h1>
            <p className="text-cyber-muted mt-2 text-sm">Join Tanzania's cybersecurity training platform</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-5 shadow-lg">
            <h2 className="text-xl font-semibold text-center">Create Account</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm text-cyber-muted mb-1.5 font-medium">
                  {f.label} {!f.required && <span className="text-gray-600">(optional)</span>}
                </label>
                <input type={f.type} value={form[f.key]} onChange={update(f.key)} required={f.required}
                  className="w-full bg-cyber-darker border border-cyber-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-tz-green placeholder:text-gray-600"
                  placeholder={f.placeholder} />
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-tz-green to-tz-green-light text-white font-semibold py-3 rounded-xl hover:shadow-glow-green disabled:opacity-50 tracking-wide">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-cyber-muted text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-tz-green font-medium hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
