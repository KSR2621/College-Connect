
import React, { useState, useMemo } from 'react';
import type { User, College } from '../types';
import { BuildingIcon, MailIcon, PlusIcon, UsersIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, SearchIcon, TrashIcon, CloseIcon, ClockIcon } from '../components/Icons';
import Header from '../components/Header';
import { auth } from '../firebase';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';

interface SuperAdminPageProps {
  colleges: College[];
  users: { [key: string]: User };
  onCreateCollegeAdmin: (collegeName: string, email: string, password: string) => Promise<void>;
  onNavigate: (path: string) => void;
  currentUser: User;
  currentPath: string;
  onApproveDirector: (directorId: string, collegeName: string) => void;
  onDeleteUser: (userId: string) => void;
}

const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ colleges, users, onCreateCollegeAdmin, onNavigate, currentUser, currentPath, onApproveDirector, onDeleteUser }) => {
  const [collegeName, setCollegeName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onCreateCollegeAdmin(collegeName, adminEmail, ''); 
      setCollegeName('');
      setAdminEmail('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const pendingDirectors = useMemo(() => {
      const allUsers = Object.values(users || {}) as User[];
      return allUsers.filter(u => {
          // Robust check: Either explicitly tagged as Director & not approved, 
          // OR has a requestedCollegeName property (which implies a pending request).
          const isPending = !u.isApproved && (u.tag === 'Director' || !!u.requestedCollegeName);
          return isPending;
      });
  }, [users]);

  const filteredColleges = useMemo(() => {
      if (!searchTerm.trim()) return colleges;
      return colleges.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [colleges, searchTerm]);
  
  const stats = {
      active: colleges.length,
      pending: pendingDirectors.length
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-6xl">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Super Admin Panel</h1>
                <p className="text-muted-foreground">Manage system-wide colleges and approvals.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:w-40 bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Approved</span>
                </div>
                <div className="flex-1 md:w-40 bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${stats.pending > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{stats.pending}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Pending</span>
                </div>
            </div>
        </div>

        <div className="space-y-12">
            
            {/* SECTION 1: REQUESTED COLLEGES (Pending) */}
            {pendingDirectors.length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                            <ClockIcon className="w-6 h-6"/> 
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">College Requests (Pending)</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingDirectors.map(director => {
                            const displayCollegeName = director.requestedCollegeName || 'Unnamed College Request';
                            const isProcessing = approvingId === director.id;
                            return (
                                <div key={director.id} className="bg-card rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-lg overflow-hidden flex flex-col relative group">
                                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">
                                        Pending Approval
                                    </div>
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Request</p>
                                                <h3 className="text-2xl font-black text-foreground leading-tight">{displayCollegeName}</h3>
                                            </div>
                                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg mt-2">
                                                <BuildingIcon className="w-6 h-6 text-amber-600 dark:text-amber-400"/>
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Director Applicant</p>
                                            <div className="flex items-center gap-4">
                                                <Avatar src={director.avatarUrl} name={director.name} size="md" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-foreground text-base truncate">{director.name}</p>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <MailIcon className="w-3.5 h-3.5"/> 
                                                        <span className="truncate">{director.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/50 border-t border-border grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => {if(window.confirm('Reject and remove this request?')) onDeleteUser(director.id)}}
                                            disabled={isProcessing}
                                            className="py-2.5 px-4 rounded-xl font-bold text-sm border border-border bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircleIcon className="w-4 h-4"/> Reject
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                setApprovingId(director.id);
                                                let cName = director.requestedCollegeName;
                                                if (!cName) {
                                                    cName = prompt("Enter college name for this director:") || '';
                                                }
                                                if (cName) {
                                                    await onApproveDirector(director.id, cName);
                                                }
                                                setApprovingId(null);
                                            }}
                                            disabled={isProcessing}
                                            className="py-2.5 px-4 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                                    Processing
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircleIcon className="w-4 h-4"/> Approve
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* SECTION 2: ADDED COLLEGES (Existing) */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <BuildingIcon className="w-6 h-6"/> 
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Registered Colleges (Active)</h2>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Search colleges..."
                                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-foreground text-background px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md whitespace-nowrap"
                        >
                            <PlusIcon className="w-4 h-4"/> Add Manual
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredColleges.length > 0 ? filteredColleges.map(college => {
                        const adminUid = college.adminUids?.[0];
                        const adminUser = adminUid ? users[adminUid] : null;
                        const deptCount = college.departments?.length || 0;
                        const isInvitePending = adminUser && !adminUser.isRegistered;

                        return (
                            <div key={college.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all flex flex-col group h-full relative overflow-hidden">
                                <div className={`absolute top-0 right-0 text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wide ${isInvitePending ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {isInvitePending ? 'Invite Sent' : 'Approved'}
                                </div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                        <BuildingIcon className="w-8 h-8"/>
                                    </div>
                                    <div className="text-xs font-bold bg-muted px-2.5 py-1 rounded-md text-muted-foreground border border-border mt-1">
                                        {deptCount} Depts
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1" title={college.name}>{college.name}</h3>
                                
                                <div className="mt-auto pt-4 border-t border-border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Director / Admin</p>
                                    {adminUser ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar src={adminUser.avatarUrl} name={adminUser.name} size="sm"/>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-foreground truncate">{adminUser.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{adminUser.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">?</div>
                                            <span>No Admin Assigned</span>
                                        </div>
                                    )}
                                    {isInvitePending && (
                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-2 bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded text-center">
                                            Pending Registration
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="col-span-full text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                            <BuildingIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4"/>
                            <p className="text-muted-foreground font-medium text-lg">No colleges found.</p>
                            {searchTerm && <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>

      {/* Add College Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> Add College Manually
                    </h2>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">College Name</label>
                        <input
                            type="text"
                            value={collegeName}
                            onChange={(e) => setCollegeName(e.target.value)}
                            required
                            placeholder="Institute Name"
                            className="w-full px-4 py-2.5 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Director Email</label>
                        <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                            placeholder="director@institute.edu"
                            className="w-full px-4 py-2.5 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">An invite will be sent to this email. They must sign up to claim it.</p>
                    </div>
                    {error && <p className="text-sm text-center text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-md">
                            {isLoading ? 'Adding...' : 'Add & Approve'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default SuperAdminPage;
