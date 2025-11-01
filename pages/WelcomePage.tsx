import React from 'react';

interface WelcomePageProps {
    onNavigate: (path: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-extrabold text-foreground">
                    Welcome to <span className="text-primary">CampusConnect</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-text-muted">
                    Your university's private social network. Connect with peers, join groups, find opportunities, and stay updated with campus events.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => onNavigate('#/login')}
                        className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => onNavigate('#/signup')}
                        className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-primary bg-primary/10 border-2 border-primary rounded-lg hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;