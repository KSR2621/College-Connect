import React from 'react';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import type { User } from '../types';

interface OpportunitiesPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-bold">Opportunities Hub</h1>
        <p className="mt-4 text-text-secondary-dark">Find internships, jobs, competitions, and projects.</p>
        <div className="mt-8 space-y-4">
          <div className="bg-surface-dark rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mt-2"></div>
          </div>
          <div className="bg-surface-dark rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mt-2"></div>
          </div>
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/opportunities" />
    </div>
  );
};

export default OpportunitiesPage;
