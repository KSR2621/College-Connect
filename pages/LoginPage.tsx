import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (path: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
      <div className="max-w-md w-full bg-surface-dark p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-brand-secondary mb-2">CampusConnect</h1>
        <h2 className="text-xl font-bold text-center text-text-primary-dark mb-8">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary-dark">
              College Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark placeholder-gray-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"
              placeholder="e.g., alice.j@university.edu"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-text-secondary-dark">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark placeholder-gray-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-secondary hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-500"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary-dark">
          Don't have an account?{' '}
          <a 
            href="#/signup" 
            onClick={(e) => { e.preventDefault(); onNavigate('#/signup'); }}
            className="inline-block font-medium text-brand-secondary hover:text-blue-400 border border-brand-secondary hover:border-blue-400 rounded px-2 py-0.5 ml-2 transition-colors cursor-pointer">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
