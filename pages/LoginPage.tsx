
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { MailIcon, LockIcon } from '../components/Icons';

interface LoginPageProps {
    onNavigate: (path: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Safety net: If auth state drops to null while loading (e.g. App.tsx rejected the user due to missing profile), stop loading.
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            // If no user is present, but we are loading, it means login failed or was reverted by App.tsx
            if (!user && isLoading && isMounted.current) {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [isLoading]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        
        setError('');
        setIsLoading(true);
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Success: Do nothing. App.tsx handles navigation.
            
            // Safety timeout: If App.tsx doesn't handle it within 15s, reset loading state to let user retry
            // Increased to 15s to account for new user polling delay in App.tsx
            setTimeout(() => {
                if (isMounted.current && isLoading) {
                    setIsLoading(false);
                    setError('Login timed out. Please check your connection or try again.');
                }
            }, 15000);

        } catch (err: any) {
            if (isMounted.current) {
                setError(err.message);
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-background font-sans">
            {/* Left Side - Branding / Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-secondary opacity-90"></div>
                {/* Abstract Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-3xl animate-pulse"></div>
                    <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                <div className="relative z-10 p-12 text-primary-foreground max-w-lg">
                     <div className="mb-8 bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                     </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight drop-shadow-sm">Welcome to CampusConnect</h1>
                    <p className="text-xl font-light text-blue-50 leading-relaxed opacity-90">
                        Your digital campus hub. Connect with peers, access resources, and stay updated with everything happening at your university.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background dark:bg-slate-900 relative z-50">
                <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border/50 relative z-50">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Sign in</h2>
                        <p className="mt-2 text-sm text-text-muted">
                            Don't have an account?{' '}
                            <a onClick={() => onNavigate('#/signup')} className="font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors relative z-50">
                                Sign up for free
                            </a>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6 relative z-50" onSubmit={handleLogin}>
                        <div className="space-y-5 relative z-50">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                                    Email address
                                </label>
                                <div className="relative group z-50">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MailIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm relative z-50"
                                        placeholder="you@university.edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                                    Password
                                </label>
                                <div className="relative group z-50">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm relative z-50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-destructive/10 p-4 animate-fade-in border border-destructive/20 relative z-50">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-destructive">
                                            Login failed
                                        </h3>
                                        <div className="mt-1 text-sm text-destructive/90">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 relative z-50">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary/30 z-50 cursor-pointer"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <LockIcon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                                    </span>
                                )}
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
