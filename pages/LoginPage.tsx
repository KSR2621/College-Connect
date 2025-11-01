import React, { useState } from 'react';
import { auth } from '../firebase';

interface LoginPageProps {
    onNavigate: (path: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await auth.signInWithEmailAndPassword(email, password);
            onNavigate('#/home');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-xl border border-border animate-fade-in">
                <h1 className="text-3xl font-bold text-center text-foreground">Welcome Back!</h1>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {error && <p className="text-sm text-center text-destructive">{error}</p>}
                    <div>
                        <button type="submit" className="w-full px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Log In
                        </button>
                    </div>
                </form>

                <p className="text-sm text-center text-text-muted">
                    Don't have an account?{' '}
                    <a onClick={() => onNavigate('#/signup')} className="font-medium text-primary hover:underline cursor-pointer">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;