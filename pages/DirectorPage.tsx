import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Post, Group, ReactionType, Course, Notice, UserTag, AttendanceStatus, Feedback, Comment, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import ProfilePage from './ProfilePage';
import { auth } from '../firebase';
// FIX: Added PostIcon and StarIcon to the import list to resolve 'Cannot find name' errors.
import { BuildingIcon, UserPlusIcon, PlusIcon, CloseIcon, TrashIcon, UsersIcon, BookOpenIcon, HomeIcon, MailIcon, LockIcon, PostIcon, StarIcon } from '../components/Icons';

interface DirectorPageProps {
    currentUser: User;
    allUsers: User[];
    allPosts: Post[];
    allGroups: Group[];
    allCourses: Course[];
    usersMap: { [key: string]: User };
    notices: Notice[];
    colleges: College[];
    onNavigate: (path: string) => void;
    currentPath: string;
    onDeleteUser: (userId: string) => void;
    onDeletePost: (postId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onApproveHodRequest: (hodId: string) => void;
    onDeclineHodRequest: (hodId: string) => void;
    onApproveTeacherRequest: (teacherId: string) => void;
    onDeclineTeacherRequest: (teacherId: string) => void;
    onToggleFreezeUser: (userId: string) => void;
    onUpdateUserRole: (userId: string, updateData: { tag: UserTag, department: string }) => void;
    onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
    onDeleteNotice: (noticeId: string) => void;
    onCreateCourse: (courseData: Omit<Course, 'id' | 'facultyId'>) => void;
    onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
    onDeleteCourse: (courseId: string) => void;
    onUpdateCollegeDepartments: (collegeId: string, departments: string[]) => void;
    postCardProps: {
        onReaction: (postId: string, reaction: ReactionType) => void;
        onAddComment: (postId: string, text: string) => void;
        onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
        onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
        onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
        onToggleSavePost: (postId: string) => void;
        onDeletePost: (postId: string) => void;
        onDeleteComment: (postId: string, commentId: string) => void;
        groups: Group[];
    };
}

const DirectorSetupView: React.FC<{
    college: College;
    onSave: (collegeId: string, departments: string[]) => void;
}> = ({ college, onSave }) => {
    const [departments, setDepartments] = useState<string[]>([]);
    const [newDept, setNewDept] = useState('');

    const addDepartment = () => {
        if (newDept.trim() && !departments.find(d => d.toLowerCase() === newDept.trim().toLowerCase())) {
            setDepartments([...departments, newDept.trim()]);
            setNewDept('');
        }
    };

    const removeDepartment = (deptToRemove: string) => {
        setDepartments(departments.filter(d => d !== deptToRemove));
    };

    const handleSave = () => {
        if (departments.length === 0) {
            alert("Please add at least one department.");
            return;
        }
        onSave(college.id, departments);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
             <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8 flex items-center justify-center h-[calc(100vh-64px)]">
                 <div className="w-full max-w-2xl bg-card dark:bg-slate-800 p-8 rounded-lg shadow-xl border border-border dark:border-slate-700">
                     <div className="text-center">
                         <BuildingIcon className="w-16 h-16 mx-auto text-primary mb-4"/>
                         <h1 className="text-3xl font-bold text-foreground">Welcome, Director!</h1>
                         <p className="text-text-muted mt-2">Let's set up your college, <span className="font-semibold">{college.name}</span>. Please add the departments available at your institution to get started.</p>
                     </div>

                     <div className="mt-8">
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={newDept}
                                onChange={e => setNewDept(e.target.value)}
                                placeholder="e.g., Computer Science"
                                className="flex-1 px-4 py-2 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
                            />
                            <button onClick={addDepartment} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add</button>
                        </div>
                     </div>

                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                        {departments.length > 0 ? departments.map(dept => (
                            <div key={dept} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-md">
                                <span className="font-medium">{dept}</span>
                                <button onClick={() => removeDepartment(dept)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        )) : <p className="text-center text-sm text-text-muted p-4">No departments added yet.</p>}
                    </div>

                    <div className="mt-8">
                        <button onClick={handleSave} disabled={departments.length === 0} className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                            Save & Continue to Dashboard
                        </button>
                    </div>
                 </div>
             </main>
        </div>
    );
};

const ManageDepartmentsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    college: College;
    onSave: (collegeId: string, departments: string[]) => void;
}> = ({ isOpen, onClose, college, onSave }) => {
    const [departments, setDepartments] = useState<string[]>(college.departments || []);
    const [newDept, setNewDept] = useState('');

    if (!isOpen) return null;

    const addDepartment = () => {
        if (newDept.trim() && !departments.find(d => d.toLowerCase() === newDept.trim().toLowerCase())) {
            setDepartments([...departments, newDept.trim()]);
            setNewDept('');
        }
    };

    const removeDepartment = (deptToRemove: string) => {
        setDepartments(departments.filter(d => d !== deptToRemove));
    };
    
    const handleSave = () => {
        onSave(college.id, departments);
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Manage Departments</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted dark:hover:bg-slate-700"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="Add new department" className="flex-1 px-4 py-2 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }} />
                    <button onClick={addDepartment} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                     {departments.map(dept => (
                        <div key={dept} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-md">
                            <span className="font-medium">{dept}</span>
                            <button onClick={() => removeDepartment(dept)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="w-full sm:w-auto px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const CreateHodModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    college: College;
    onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
}> = ({ isOpen, onClose, college, onCreateUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // This effect now only runs when the modal is opened.
        // It resets the form to a clean state. By not including other dependencies,
        // it prevents the form from resetting while the user is typing, which was
        // happening on parent component re-renders.
        if (isOpen) {
            setName('');
            setEmail('');
            setDepartment(college.departments ? college.departments[0] : '');
            setGeneratedPassword('');
            setIsSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const generatePassword = () => {
        const password = Math.random().toString(36).slice(-8);
        setGeneratedPassword(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!generatedPassword) {
            alert("Please generate a password first.");
            return;
        }
        setIsLoading(true);
        const userData: Omit<User, 'id'> = {
            name,
            email,
            department,
            tag: 'HOD/Dean',
            isApproved: true,
        };
        try {
            await onCreateUser(userData, generatedPassword);
            setIsSuccess(true);
        } catch (error) {
            console.error("Failed to create HOD", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        const credentials = `Email: ${email}\nPassword: ${generatedPassword}`;
        navigator.clipboard.writeText(credentials).then(() => {
            alert("Credentials copied to clipboard!");
        });
    };

    const createMailtoLink = () => {
        const subject = `Your CampusConnect HOD Account Credentials`;
        const body = `Hello ${name},\n\nYour Head of Department account has been created for CampusConnect.\n\nYou can log in with the following email: ${email}\n\nFor security, please copy the password from the dashboard and paste it here.\n\n[PASTE PASSWORD HERE]\n\nIt is highly recommended that you change your password after your first login.\n\nBest,\nThe CampusConnect Administration`;
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (isSuccess) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-card dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Account Created!</h2>
                    <p className="text-text-muted mb-6">The account for {name} has been created. Please share these credentials securely with them.</p>
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-left space-y-2 mb-6 text-foreground">
                        <p><span className="font-semibold">Email:</span> {email}</p>
                        <p><span className="font-semibold">Password:</span> {generatedPassword}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                         <button onClick={copyToClipboard} className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Copy Credentials</button>
                         <a href={createMailtoLink()} className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
                            <MailIcon className="w-5 h-5"/>
                            Email Credentials
                         </a>
                    </div>
                     <button onClick={onClose} className="w-full mt-4 px-4 py-3 font-semibold text-text-muted hover:bg-muted/80">Done</button>
                </div>
            </div>
        );
    }
    
    const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-foreground mb-4">Appoint New HOD/Dean</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative"><UserPlusIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className={inputClasses} /></div>
                    <div className="relative"><MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className={inputClasses} /></div>
                    <div>
                        <label className="text-sm font-medium text-text-muted">Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} required className="w-full mt-1 px-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition">
                            {(college.departments || []).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted">Temporary Password</label>
                        <div className="flex gap-2">
                             <input type="text" value={generatedPassword} readOnly placeholder="Click generate" className="flex-1 px-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none" />
                             <button type="button" onClick={generatePassword} className="px-4 font-semibold text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20">Generate</button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                        <button type="submit" disabled={isLoading || !generatedPassword} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait">
                            {isLoading ? 'Creating...' : 'Create HOD Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.FC<any>; }> = ({ title, value, icon: Icon }) => (
    <div className="bg-card dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-border dark:border-slate-700">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-muted">{title}</p>
            <Icon className="w-6 h-6 text-primary"/>
        </div>
        <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
    </div>
);


const DirectorPage: React.FC<DirectorPageProps> = (props) => {
    const { currentUser, colleges, onUpdateCollegeDepartments, onNavigate, currentPath, allUsers, allPosts, allGroups, allCourses, onCreateUser } = props;
    
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isHodModalOpen, setIsHodModalOpen] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const college = colleges.find(c => c.id === currentUser.collegeId);
    
    if (college && (!college.departments || college.departments.length === 0)) {
        return <DirectorSetupView college={college} onSave={onUpdateCollegeDepartments} />;
    }

    if (!college) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p className="text-text-muted">Could not load college data. Please contact support.</p>
                </div>
            </div>
        );
    }

    const departments = college?.departments || [];
    const hods = allUsers.filter(u => u.tag === 'HOD/Dean' && u.collegeId === currentUser.collegeId);
    const departmentMemberCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        departments.forEach(dept => {
            counts[dept] = 0;
        });
        allUsers.forEach(user => {
            if (user.collegeId === currentUser.collegeId && user.department && counts[user.department] !== undefined) {
                counts[user.department]++;
            }
        });
        return counts;
    }, [allUsers, departments, currentUser.collegeId]);
    
    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
             <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
             <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <h1 className="text-3xl font-bold text-foreground">Welcome, {currentUser.name}</h1>
                <p className="text-text-muted mb-6">Here's an overview of your college, {college.name}.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Users" value={allUsers.length} icon={UsersIcon} />
                    <StatCard title="Total Courses" value={allCourses.length} icon={BookOpenIcon} />
                    <StatCard title="Total Posts" value={allPosts.length} icon={PostIcon} />
                    <StatCard title="Total Groups" value={allGroups.length} icon={StarIcon} />
                </div>
                
                <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700 mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex flex-col sm:flex-row items-start gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-lg"><BuildingIcon className="w-6 h-6"/></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground">Manage Departments</h3>
                                <p className="text-sm text-text-muted mt-1 mb-3">Add or remove departments for your college.</p>
                                <button onClick={() => setIsDeptModalOpen(true)} className="text-sm font-semibold bg-primary/20 text-primary px-3 py-1.5 rounded-md hover:bg-primary/30">Manage</button>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex flex-col sm:flex-row items-start gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-lg"><UserPlusIcon className="w-6 h-6"/></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground">Appoint HOD/Dean</h3>
                                <p className="text-sm text-text-muted mt-1 mb-3">Create an account for a Head of Department.</p>
                                <button onClick={() => setIsHodModalOpen(true)} className="text-sm font-semibold bg-primary/20 text-primary px-3 py-1.5 rounded-md hover:bg-primary/30">Appoint</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Departments List */}
                    <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Departments</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                            {departments.length > 0 ? departments.map(dept => (
                                <div key={dept} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex justify-between items-center">
                                    <span className="font-semibold text-foreground">{dept}</span>
                                    <div className="flex items-center text-sm text-text-muted">
                                        <UsersIcon className="w-4 h-4 mr-2" />
                                        <span>{departmentMemberCounts[dept] || 0} members</span>
                                    </div>
                                </div>
                            )) : <p className="text-center text-text-muted p-4">No departments created yet.</p>}
                        </div>
                    </div>

                    {/* HODs List */}
                    <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Heads of Department</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                            {hods.length > 0 ? hods.map(hod => (
                                <div key={hod.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center gap-4">
                                    <Avatar src={hod.avatarUrl} name={hod.name} size="md" />
                                    <div>
                                        <p className="font-bold text-foreground">{hod.name}</p>
                                        <p className="text-sm text-text-muted">{hod.department}</p>
                                    </div>
                                </div>
                            )) : <p className="text-center text-text-muted p-4">No HODs appointed yet.</p>}
                        </div>
                    </div>
                </div>

             </main>
             <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>

            <ManageDepartmentsModal 
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                college={college}
                onSave={onUpdateCollegeDepartments}
            />
             <CreateHodModal 
                isOpen={isHodModalOpen}
                onClose={() => setIsHodModalOpen(false)}
                college={college}
                onCreateUser={onCreateUser}
            />
        </div>
    );
};

export default DirectorPage;
