import React, { useState } from 'react';
import type { User, College } from '../types';
import { BuildingIcon, MailIcon, LockIcon, PlusIcon, UsersIcon } from '../components/Icons';
import Header from '../components/Header';
import { auth } from '../firebase';
import BottomNavBar from '../components/BottomNavBar';

interface SuperAdminPageProps {
  colleges: College[];
  users: { [key: string]: User };
  onCreateCollegeAdmin: (collegeName: string, email: string, password: string) => Promise<void>;
  onNavigate: (path: string) => void;
  currentUser: User;
  currentPath: string;
}

const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ colleges, users, onCreateCollegeAdmin, onNavigate, currentUser, currentPath }) => {
  const [collegeName, setCollegeName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onCreateCollegeAdmin(collegeName, adminEmail, adminPassword);
      setCollegeName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
        <h1 className="text-4xl font-extrabold text-foreground mb-8">Super Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add College Form */}
            <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><PlusIcon className="w-6 h-6"/> Add New College</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-muted">College Name</label>
                        <div className="relative mt-1">
                            <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="text"
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                required
                                placeholder="e.g., Institute of Technology"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-text-muted">Admin (Director/Principal) Email</label>
                        <div className="relative mt-1">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                placeholder="director@example.edu"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-text-muted">Initial Password</label>
                        <div className="relative mt-1">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                required
                                placeholder="Must be at least 6 characters"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-destructive">{error}</p>}
                     <button type="submit" disabled={isLoading} className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait">
                        {isLoading ? 'Creating...' : 'Create College & Admin'}
                    </button>
                </form>
            </div>
            
            {/* Existing Colleges List */}
            <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><UsersIcon className="w-6 h-6"/> Existing Colleges</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                    {colleges.length > 0 ? colleges.map(college => {
                        const adminUser = users[college.adminUids[0]];
                        return (
                            <div key={college.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-border dark:border-slate-700">
                                <p className="font-bold text-foreground">{college.name}</p>
                                <p className="text-sm text-text-muted">Admin: {adminUser ? adminUser.email : 'N/A'}</p>
                            </div>
                        )
                    }) : (
                        <p className="text-center text-text-muted py-8">No colleges have been added yet.</p>
                    )}
                </div>
            </div>
        </div>
      </main>
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default SuperAdminPage;
