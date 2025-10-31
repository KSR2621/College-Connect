import React, { useState } from 'react';
import type { UserTag } from '../types';

export interface SignupFormFields {
  name: string;
  email: string;
  password: string;
  department: string;
  tag: UserTag;
}

interface SignupPageProps {
  onSignup: (formData: SignupFormFields) => Promise<void>;
  onNavigate: (path: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [tag, setTag] = useState<UserTag>('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !department) {
      setError('Please fill out all fields.');
      return;
    }
    if (!email.endsWith('.edu')) {
        setError('Please use a valid .edu college email address.');
        return;
    }
    
    setLoading(true);
    try {
        await onSignup({ name, email, password, department, tag });
    } catch (err: any) {
        setError(err.message || 'Failed to sign up. This email may already be in use.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-surface-dark p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-brand-secondary mb-2">CampusConnect</h1>
        <h2 className="text-xl font-bold text-center text-text-primary-dark mb-8">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary-dark">Full Name</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary-dark">College Email (.edu)</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-text-secondary-dark">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-text-secondary-dark">Department</label>
            <input id="department" type="text" required value={department} onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
          </div>
           <div>
            <label htmlFor="tag" className="block text-sm font-medium text-text-secondary-dark">I am a...</label>
            <select id="tag" value={tag} onChange={(e) => setTag(e.target.value as UserTag)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-text-primary-dark focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary">
              <option>Student</option>
              <option>Faculty</option>
              <option>Alumni</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-secondary hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-500">
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary-dark">
          Already have an account?{' '}
          <a 
            href="#/login" 
            onClick={(e) => { e.preventDefault(); onNavigate('#/login'); }}
            className="font-medium text-brand-secondary hover:text-blue-400 cursor-pointer">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
