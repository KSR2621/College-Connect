import React from 'react';

interface WelcomePageProps {
    onNavigate: (path: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"></div>

            <div className="container relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Text Content */}
                    <div className="text-center md:text-left animate-fade-in">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight">
                            Your Campus, <br />
                            <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                                Connected.
                            </span>
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-text-muted max-w-lg mx-auto md:mx-0">
                           A private social network to connect with peers, find opportunities, and stay updated with everything happening at your university.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                            <button
                                onClick={() => onNavigate('#/login')}
                                className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-105"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => onNavigate('#/signup')}
                                className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-primary bg-card dark:bg-slate-800 border-2 border-primary rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-105"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Abstract Shapes */}
                    <div className="hidden md:block relative h-96">
                        <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary rounded-full opacity-20 animate-pulse"></div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-72 h-72 bg-card dark:bg-slate-800 rounded-2xl shadow-xl border border-border dark:border-slate-700 transform rotate-12">
                                <div className="p-4">
                                    <div className="w-12 h-12 rounded-full bg-input dark:bg-slate-700"></div>
                                    <div className="w-48 h-4 rounded-md bg-input dark:bg-slate-700 mt-4"></div>
                                    <div className="w-32 h-4 rounded-md bg-input dark:bg-slate-700 mt-2"></div>
                                </div>
                            </div>
                            <div className="w-64 h-64 bg-card dark:bg-slate-800 rounded-2xl shadow-xl border border-border dark:border-slate-700 transform -rotate-12 absolute -bottom-16 -right-16">
                                <div className="p-4">
                                     <div className="w-32 h-4 rounded-md bg-input dark:bg-slate-700 mt-2"></div>
                                     <div className="w-48 h-4 rounded-md bg-input dark:bg-slate-700 mt-4"></div>
                                     <div className="w-12 h-12 rounded-full bg-input dark:bg-slate-700 mt-4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;