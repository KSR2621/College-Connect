import React from 'react';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import BottomNavBar from '../components/BottomNavBar';
import type { User } from '../types';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="bg-surface-dark rounded-lg shadow-lg overflow-hidden">
          <div className="h-32 bg-brand-secondary"></div>
          <div className="p-6 sm:p-8">
            <div className="flex items-end -mt-20">
              <Avatar src={user.avatarUrl} alt={user.name} size="lg" />
              <div className="ml-4">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full mt-1 inline-block ${
                    user.tag === 'Faculty' ? 'bg-red-500 text-white' : 
                    user.tag === 'Alumni' ? 'bg-green-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}
                >
                  {user.tag}
                </span>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-700 pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-text-secondary-dark">Email</dt>
                  <dd className="mt-1 text-sm text-text-primary-dark">{user.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-text-secondary-dark">Department</dt>
                  <dd className="mt-1 text-sm text-text-primary-dark">{user.department}</dd>
                </div>
                {user.year && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-text-secondary-dark">Year</dt>
                    <dd className="mt-1 text-sm text-text-primary-dark">{user.year}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-8">
            <h2 className="text-xl font-bold">My Posts</h2>
            <div className="mt-4 bg-surface-dark rounded-lg p-6 text-center text-text-secondary-dark">
                <p>You haven't posted anything yet.</p>
            </div>
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/profile" />
    </div>
  );
};

export default ProfilePage;
