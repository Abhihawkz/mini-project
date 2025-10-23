import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [focused, setFocused] = React.useState(null);
  const { register, login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { ok, data } = await register({ name, email, password });
    if (ok) {
      if (data.accessToken) {
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user);
        navigate('/dashboard');
      } else {
        const { ok: okLogin } = await login({ email, password });
        if (okLogin) navigate('/dashboard');
        else navigate('/login');
      }
    } else {
      setError(data?.message || 'Registration failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 tracking-tight">Create account</h1>
          <p className="text-zinc-400">Join us and get started today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 block">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              required
              className={`w-full px-4 py-3.5 rounded-lg bg-zinc-900 border ${
                focused === 'name' ? 'border-white' : 'border-zinc-800'
              } focus:outline-none transition-all duration-200 placeholder-zinc-600`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 block">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              required
              className={`w-full px-4 py-3.5 rounded-lg bg-zinc-900 border ${
                focused === 'email' ? 'border-white' : 'border-zinc-800'
              } focus:outline-none transition-all duration-200 placeholder-zinc-600`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 block">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              required
              className={`w-full px-4 py-3.5 rounded-lg bg-zinc-900 border ${
                focused === 'password' ? 'border-white' : 'border-zinc-800'
              } focus:outline-none transition-all duration-200 placeholder-zinc-600`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black px-6 py-3.5 rounded-lg font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-zinc-500 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}