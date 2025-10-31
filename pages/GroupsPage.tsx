import React from 'react';
import Header from '../components/Header';
import type { User } from '../types';

interface GroupsPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Groups</h1>
        <p className="mt-4 text-text-secondary-dark">This is where clubs and communities will be displayed.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface-dark rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mt-3"></div>
          </div>
          <div className="bg-surface-dark rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mt-3"></div>
          </div>
          <div className="bg-surface-dark rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mt-3"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupsPage;