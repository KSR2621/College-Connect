import React, { useState } from 'react';
import { auth } from '../firebase';
import { MailIcon, LockIcon } from '../components/Icons';

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-xl border border-border animate-fade-in">
                <div className="text-center">
                    <span className="font-bold text-3xl text-primary">CampusConnect</span>
                    <h1 className="text-2xl font-bold text-foreground mt-2">Welcome Back!</h1>
                    <p className="text-text-muted">Log in to continue to your community.</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-text-muted">Email Address</label>
                        <div className="relative mt-2">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            />
                        </div>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-text-muted">Password</label>
                         <div className="relative mt-2">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-destructive">{error}</p>}
                    <div>
                        <button type="submit" className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105">
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