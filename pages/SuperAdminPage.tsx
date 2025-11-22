import React, { useState, useMemo } from 'react';
import type { User, College } from '../types';
import { BuildingIcon, MailIcon, LockIcon, PlusIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
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
  onApproveDirector: (directorId: string) => void;
  onDeleteUser: (userId: string) => void;
}

const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ colleges, users, onCreateCollegeAdmin, onNavigate, currentUser, currentPath, onApproveDirector, onDeleteUser }) => {
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
  
  const pendingDirectors = useMemo(() => {
      return (Object.values(users || {}) as User[]).filter(u => u.tag === 'Director' && !u.isApproved && u.isRegistered);
  }, [users]);
  
  const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
        <h1 className="text-4xl font-extrabold text-foreground mb-8">Super Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Requests Section */}
            <div className="lg:col-span-2 bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6 text-amber-500"/> 
                    Pending College Requests ({pendingDirectors.length})
                </h2>
                {pendingDirectors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingDirectors.map(director => {
                            // Safe access to colleges
                            const college = (colleges || []).find(c => c.id === director.collegeId);
                            return (
                                <div key={director.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-border dark:border-slate-600 flex flex-col">
                                    <h4 className="font-bold text-lg text-foreground mb-1">{college?.name || 'Unknown College'}</h4>
                                    <p className="text-sm text-muted-foreground mb-3">Director: {director.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-text-muted mb-4 bg-white dark:bg-slate-800 p-2 rounded">
                                        <MailIcon className="w-4 h-4"/> {director.email}
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button 
                                            onClick={() => onApproveDirector(director.id)}
                                            className="flex-1 bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <CheckCircleIcon className="w-4 h-4"/> Approve
                                        </button>
                                        <button 
                                            onClick={() => {if(window.confirm('Reject this request?')) onDeleteUser(director.id)}}
                                            className="flex-1 bg-red-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <XCircleIcon className="w-4 h-4"/> Reject
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-center text-text-muted py-8 bg-slate-50 dark:bg-slate-700/30 rounded-xl">No pending college registration requests.</p>
                )}
            </div>

            {/* Add College Form */}
            <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><PlusIcon className="w-6 h-6"/> Add New College Manually</h2>
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
                    {colleges && colleges.length > 0 ? colleges.map(college => {
                        // Safer access to adminUids
                        const adminUid = college.adminUids && college.adminUids.length > 0 ? college.adminUids[0] : null;
                        const adminUser = adminUid ? users[adminUid] : null;
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