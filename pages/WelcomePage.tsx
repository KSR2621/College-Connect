import React from 'react';

interface WelcomePageProps {
  onNavigate: (path: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-5xl font-bold text-brand-secondary mb-4">
          CampusConnect
        </h1>
        <p className="text-lg text-text-secondary-dark mb-12">
          Your private, interactive digital campus. Connect, collaborate, and build your community.
        </p>
        <div className="space-y-4">
          <a
            href="#/login"
            onClick={(e) => { e.preventDefault(); onNavigate('#/login'); }}
            className="w-full block py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-secondary hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            Log In
          </a>
          <a
            href="#/signup"
            onClick={(e) => { e.preventDefault(); onNavigate('#/signup'); }}
            className="w-full block py-3 px-4 border border-brand-secondary rounded-md shadow-sm text-lg font-medium text-brand-secondary bg-transparent hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors cursor-pointer"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;