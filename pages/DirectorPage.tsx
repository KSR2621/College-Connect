






import React, { useState, useMemo, useEffect } from 'react';
import { User, Post, Group, ReactionType, Course, Notice, UserTag, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { 
    BuildingIcon, UserPlusIcon, PlusIcon, CloseIcon, TrashIcon, UsersIcon, BookOpenIcon, 
    MailIcon, LockIcon, ClockIcon, SearchIcon, CheckCircleIcon, ChevronRightIcon,
    FileTextIcon, ChartBarIcon, SettingsIcon, ChartPieIcon, EditIcon, XCircleIcon,
    BriefcaseIcon, CalendarIcon, MegaphoneIcon, StarIcon, MenuIcon
} from '../components/Icons';

// --- PROPS INTERFACE ---
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
    onApproveHodRequest: (teacherId: string) => void;
    onDeclineHodRequest: (teacherId: string) => void;
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
    onEditCollegeDepartment: (collegeId: string, oldName: string, newName: string) => void;
    onDeleteCollegeDepartment: (collegeId: string, deptName: string) => void;
    onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
    postCardProps: {
        onReaction: (postId: string, reaction: ReactionType) => void;
        onAddComment: (postId: string, text: string) => void;
        onDeletePost: (postId: string) => void;
        onDeleteComment: (postId: string, commentId: string) => void;
        onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
        onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
        onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
        onToggleSavePost: (postId: string) => void;
        groups: Group[];
    };
}

// #region Helper Components (Charts, Cards, Items)

const SimpleBarChart: React.FC<{ data: number[], labels?: string[], color?: string }> = ({ data, labels, color = 'bg-primary' }) => (
    <div className="flex items-end justify-between h-32 gap-2 pt-4 pb-6">
        {data.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                <div className="w-full bg-muted/30 rounded-t-sm relative h-full overflow-hidden">
                     <div 
                        className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-1000 ${color}`} 
                        style={{ height: `${Math.max(h || 0, 5)}%` }} // Min height for visibility, safeguard undefined
                    ></div>
                </div>
                 <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md pointer-events-none transition-opacity z-10 whitespace-nowrap border border-border">
                    {h} {labels ? `- ${labels[i]}` : ''}
                 </div>
                 {labels && <p className="text-[10px] text-muted-foreground text-center mt-1 truncate w-full" title={labels[i]}>{labels[i]}</p>}
            </div>
        ))}
    </div>
);

const SimpleLineChart: React.FC<{ data?: number[], color?: string }> = ({ data = [], color = "text-primary" }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">Not enough data for trend</div>;
    
    const max = Math.max(...data) || 100;
    const min = 0;
    const range = max - min;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / (range || 1)) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative h-32 w-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                 <polyline points={points} fill="none" stroke="currentColor" className={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                 {data.map((val, i) => {
                     const x = (i / (data.length - 1)) * 100;
                     const y = 100 - ((val - min) / (range || 1)) * 100;
                     return <circle key={i} cx={x} cy={y} r="3" className="fill-card stroke-current" strokeWidth="2" />
                 })}
            </svg>
        </div>
    );
}

const SidebarItem: React.FC<{ id: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean }> = ({ id, label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
        {active && <ChevronRightIcon className="w-4 h-4 ml-auto opacity-50" />}
    </button>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ElementType; colorClass: string; trend?: 'up' | 'down' }> = ({ label, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-extrabold text-card-foreground">{value}</p>
                {trend && (
                    <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trend === 'up' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const GraphCard: React.FC<{ title: string; children: React.ReactNode; onViewDetails?: () => void; className?: string }> = ({ title, children, onViewDetails, className = '' }) => (
    <div className={`bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col ${className}`}>
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-card-foreground text-lg">{title}</h3>
            {onViewDetails && <button onClick={onViewDetails} className="text-xs text-primary hover:underline font-semibold">View Details</button>}
        </div>
        <div className="flex-1 w-full">{children}</div>
    </div>
);

// #endregion

// #region Sub-Views

const DashboardHome: React.FC<{ 
    stats: any, 
    setActiveSection: (section: any) => void,
    openDeptModal: () => void,
    openHodModal: () => void
}> = ({ stats, setActiveSection, openDeptModal, openHodModal }) => (
    <div className="space-y-8 animate-fade-in">
         {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Total Depts" value={stats.deptCount} icon={BuildingIcon} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
            <StatCard label="Total HODs" value={stats.hodCount} icon={UserPlusIcon} colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
            <StatCard label="Total Faculty" value={stats.facultyCount} icon={UsersIcon} colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
            <StatCard label="Total Students" value={stats.studentCount} icon={UsersIcon} colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" trend="up" />
            <StatCard label="Pending" value={stats.pendingApprovals} icon={ClockIcon} colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
        </div>

        {/* Quick Actions */}
        <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={openDeptModal} className="flex items-center justify-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all group">
                    <PlusIcon className="w-5 h-5 text-primary mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-card-foreground">Add Department</span>
                </button>
                <button onClick={openHodModal} className="flex items-center justify-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all group">
                    <UserPlusIcon className="w-5 h-5 text-primary mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-card-foreground">Add HOD</span>
                </button>
                <button onClick={() => setActiveSection('reports')} className="flex items-center justify-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all group">
                    <FileTextIcon className="w-5 h-5 text-primary mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-card-foreground">View Reports</span>
                </button>
                 <button onClick={() => setActiveSection('approvals')} className="flex items-center justify-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all group">
                    <CheckCircleIcon className="w-5 h-5 text-primary mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-card-foreground">Approvals ({stats.pendingApprovals})</span>
                </button>
            </div>
        </div>
    </div>
);

const DepartmentsView: React.FC<{
    departments: string[];
    openAddModal: () => void;
    onEdit: (dept: string) => void;
    onDelete: (dept: string) => void;
}> = ({ departments, openAddModal, onEdit, onDelete }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Department Management</h2>
            <button onClick={openAddModal} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90">
                <PlusIcon className="w-4 h-4" /> Add Department
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departments.map(dept => (
                 <div key={dept} className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col group hover:shadow-md transition-all">
                    <h4 className="font-bold text-lg text-card-foreground mb-1">{dept}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Department</p>
                    <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                        <button onClick={() => onEdit(dept)} className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors">Edit</button>
                        <button onClick={() => onDelete(dept)} className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors">Delete</button>
                    </div>
                 </div>
            ))}
        </div>
    </div>
);

const HodsView: React.FC<{
    departments: string[];
    hodsMap: Record<string, User>;
    openAddModal: (dept?: string) => void;
    onRemove: (userId: string) => void;
    onViewDashboard: (userId: string) => void;
}> = ({ departments, hodsMap, openAddModal, onRemove, onViewDashboard }) => (
    <div className="space-y-6 animate-fade-in">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">HOD Management</h2>
            <button onClick={() => openAddModal()} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90">
                <UserPlusIcon className="w-4 h-4" /> Add HOD
            </button>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
             {departments.map(dept => {
                 const hod = hodsMap[dept];
                 return (
                     <div key={dept} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-card-foreground">{dept}</h4>
                            {!hod && <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded">Vacant</span>}
                         </div>
                         {hod ? (
                             <div>
                                 <div className="flex items-center gap-3 mb-3">
                                     <Avatar src={hod.avatarUrl} name={hod.name} size="md" />
                                     <div>
                                         <p className="font-semibold text-sm text-card-foreground">{hod.name}</p>
                                         <p className="text-xs text-muted-foreground">{hod.email}</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => onViewDashboard(hod.id)} className="flex-1 text-xs font-semibold text-primary bg-primary/10 py-2 rounded hover:bg-primary/20">View Dashboard</button>
                                     <button onClick={() => onRemove(hod.id)} className="flex-1 text-xs font-semibold text-destructive bg-destructive/10 py-2 rounded hover:bg-destructive/20">Remove</button>
                                 </div>
                             </div>
                         ) : (
                             <button onClick={() => openAddModal(dept)} className="w-full text-sm font-bold text-primary border border-primary rounded py-2 mt-2 hover:bg-primary/10">Assign HOD</button>
                         )}
                     </div>
                 )
             })}
        </div>

         {/* Desktop Table View */}
         <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="p-4 font-semibold text-foreground">Name</th>
                        <th className="p-4 font-semibold text-foreground">Department</th>
                        <th className="p-4 font-semibold text-foreground">Email</th>
                        <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(dept => {
                        const hod = hodsMap[dept];
                        return (
                            <tr key={dept} className="border-b border-border last:border-0 hover:bg-muted/30">
                                <td className="p-4">
                                    {hod ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar src={hod.avatarUrl} name={hod.name} size="sm" />
                                            <span className="font-medium text-card-foreground">{hod.name}</span>
                                        </div>
                                    ) : <span className="text-muted-foreground italic">Vacant</span>}
                                </td>
                                <td className="p-4 font-medium text-card-foreground">{dept}</td>
                                <td className="p-4 text-muted-foreground">{hod?.email || '-'}</td>
                                <td className="p-4 text-right">
                                    {hod ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => onViewDashboard(hod.id)} className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors">View Dashboard</button>
                                            <button onClick={() => onRemove(hod.id)} className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded hover:bg-destructive/20 transition-colors">Remove</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => openAddModal(dept)} className="text-xs font-bold text-primary hover:underline">Assign</button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
         </div>
    </div>
);

const FacultyView: React.FC<{
    facultyList: User[];
    onViewDashboard: (userId: string) => void;
}> = ({ facultyList, onViewDashboard }) => {
    const [search, setSearch] = useState('');
    const filtered = facultyList.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.department.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Faculty & Staff Overview</h2>
                <div className="relative w-full sm:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search faculty..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full sm:w-64 pl-10 pr-4 py-2 bg-input border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(faculty => (
                        <div key={faculty.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-sm transition-all">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <Avatar src={faculty.avatarUrl} name={faculty.name} size="md" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-card-foreground truncate">{faculty.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{faculty.department}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onViewDashboard(faculty.id)} 
                                className="ml-2 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/10 rounded-md hover:bg-primary/20 transition-all"
                            >
                                View
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No faculty members found.</p>
            )}
        </div>
    );
}

const StudentsView: React.FC<{
    allUsers: User[];
    onDeleteUser: (userId: string) => void;
}> = ({ allUsers, onDeleteUser }) => {
    const [search, setSearch] = useState('');
    
    const students = useMemo(() => 
        allUsers.filter(u => u.tag === 'Student')
                .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name)),
    [allUsers, search]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Students Overview</h2>
                <div className="relative w-full sm:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full sm:w-64 pl-10 pr-4 py-2 bg-input border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                </div>
            </div>
            
            {/* Mobile Card View */}
             <div className="md:hidden space-y-3">
                 {students.length > 0 ? students.map(student => (
                     <div key={student.id} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                         <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-3">
                                 <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                 <div>
                                     <p className="font-bold text-sm text-card-foreground">{student.name}</p>
                                     <p className="text-xs text-muted-foreground">{student.email}</p>
                                 </div>
                             </div>
                             <span className="text-xs font-semibold bg-muted px-2 py-1 rounded text-muted-foreground">Year {student.yearOfStudy}</span>
                         </div>
                         <div className="flex justify-between items-end mt-2">
                             <p className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">{student.department}</p>
                             <button onClick={() => { if(window.confirm(`Delete student ${student.name}?`)) onDeleteUser(student.id); }} className="text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1.5 rounded hover:bg-destructive/20">Remove</button>
                         </div>
                     </div>
                 )) : <p className="text-center text-muted-foreground py-4">No students found.</p>}
             </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-foreground">Name</th>
                                <th className="p-4 font-semibold text-foreground">Email</th>
                                <th className="p-4 font-semibold text-foreground">Department</th>
                                <th className="p-4 font-semibold text-foreground">Year</th>
                                <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? students.map(student => (
                                <tr key={student.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={student.avatarUrl} name={student.name} size="sm" />
                                            <span className="font-medium text-card-foreground">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{student.email}</td>
                                    <td className="p-4 text-muted-foreground">{student.department}</td>
                                    <td className="p-4 text-muted-foreground">{student.yearOfStudy}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { if(window.confirm(`Delete student ${student.name}?`)) onDeleteUser(student.id); }} className="text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1 rounded hover:bg-destructive/20 transition-colors">Remove</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No students found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ApprovalsView: React.FC<{
    allUsers: User[];
    onApprove: (id: string, type: 'teacher' | 'hod') => void;
    onDecline: (id: string, type: 'teacher' | 'hod') => void;
}> = ({ allUsers, onApprove, onDecline }) => {
    // Filter to show only users who have signed up (isRegistered) but not approved
    const pendingUsers = useMemo(() => allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && !u.isApproved && u.isRegistered), [allUsers]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground">Pending Approvals</h2>
            {pendingUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center space-x-3 w-full">
                                <Avatar src={user.avatarUrl} name={user.name} size="md" />
                                <div>
                                    <p className="font-bold text-card-foreground">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.department} &bull; {user.tag}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onApprove(user.id, user.tag === 'HOD/Dean' ? 'hod' : 'teacher'); }}
                                    className="flex-1 sm:flex-none bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-emerald-600 shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                    <CheckCircleIcon className="w-4 h-4" /> Approve
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Reject this request?')) onDecline(user.id, user.tag === 'HOD/Dean' ? 'hod' : 'teacher'); }}
                                    className="flex-1 sm:flex-none bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg text-sm hover:bg-destructive/90 shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                    <XCircleIcon className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-xl border border-border">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full mb-3">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
                    <p className="text-muted-foreground">There are no pending requests at the moment.</p>
                </div>
            )}
        </div>
    );
};

const AnalyticsDashboard: React.FC<{
    allUsers: User[];
    allCourses: Course[];
    colleges: College[];
    currentUser: User;
}> = ({ allUsers, allCourses, colleges, currentUser }) => {
    const [activeTab, setActiveTab] = useState('attendance');
    
    const college = colleges.find(c => c.id === currentUser.collegeId);
    const departments = college?.departments || [];

    // --- AGGREGATE REAL DATA ---
    const {
        totalStudents,
        totalFaculty,
        pendingApprovals,
        avgAttendance,
        riskCount,
        deptStats,
        atRiskStudents,
        facultyLoad
    } = useMemo(() => {
        const students = allUsers.filter(u => u.tag === 'Student');
        const faculty = allUsers.filter(u => u.tag === 'Teacher' || u.tag === 'HOD/Dean');
        const pending = allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && !u.isApproved && u.isRegistered).length;

        // Calculate Attendance Stats
        let totalPossibleAttendance = 0;
        let totalPresent = 0;
        const riskStudentsSet = new Set<string>();
        
        const studentAttendanceMap: Record<string, { present: number, total: number, name: string, dept: string }> = {};

        allCourses.forEach(course => {
            if (!course.attendanceRecords) return;
            course.attendanceRecords.forEach(record => {
                const records = record.records;
                Object.entries(records).forEach(([studentId, statusData]) => {
                    const isPresent = (statusData as any).status === 'present';
                    totalPossibleAttendance++;
                    if (isPresent) totalPresent++;

                    if (!studentAttendanceMap[studentId]) {
                         const student = students.find(s => s.id === studentId);
                         studentAttendanceMap[studentId] = { present: 0, total: 0, name: student?.name || 'Unknown', dept: student?.department || 'Unknown' };
                    }
                    studentAttendanceMap[studentId].total++;
                    if (isPresent) studentAttendanceMap[studentId].present++;
                });
            });
        });

        // Find At Risk Students (< 60% attendance)
        Object.entries(studentAttendanceMap).forEach(([id, data]) => {
            if (data.total > 0 && (data.present / data.total) < 0.6) {
                riskStudentsSet.add(id);
            }
        });
        
        const atRiskList = Object.entries(studentAttendanceMap)
            .filter(([id, data]) => data.total > 5 && (data.present / data.total) < 0.6) // Min 5 classes to record risk
            .map(([id, data]) => ({ id, ...data, percentage: Math.round((data.present / data.total) * 100) }))
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 10);

        const globalAvgAttendance = totalPossibleAttendance > 0 ? Math.round((totalPresent / totalPossibleAttendance) * 100) : 0;

        // Department Stats
        const deptStatsData = departments.map(dept => {
            const deptStudents = students.filter(s => s.department === dept).length;
            const deptFaculty = faculty.filter(f => f.department === dept).length;
            const courses = allCourses.filter(c => c.department === dept);
            
            // Calculate Dept Attendance
            let dPossible = 0;
            let dPresent = 0;
            courses.forEach(c => {
                c.attendanceRecords?.forEach(r => {
                    Object.values(r.records).forEach(stat => {
                        dPossible++;
                        if ((stat as any).status === 'present') dPresent++;
                    });
                });
            });
            
            const deptAvgAtt = dPossible > 0 ? Math.round((dPresent / dPossible) * 100) : 0;
            return { label: dept, students: deptStudents, faculty: deptFaculty, attendance: deptAvgAtt, courses: courses.length };
        });

        // Faculty Load
        const facultyWorkload = faculty.map(f => {
             const coursesCount = allCourses.filter(c => c.facultyId === f.id).length;
             return { name: f.name, department: f.department, courses: coursesCount };
        }).sort((a, b) => b.courses - a.courses).slice(0, 10);


        return {
            totalStudents: students.length,
            totalFaculty: faculty.length,
            pendingApprovals: pending,
            avgAttendance: globalAvgAttendance,
            riskCount: riskStudentsSet.size,
            deptStats: deptStatsData,
            atRiskStudents: atRiskList,
            facultyLoad: facultyWorkload
        };
    }, [allUsers, allCourses, departments]);

    const tabs = [
        { id: 'attendance', label: 'Attendance' },
        { id: 'courses', label: 'Course Stats' },
        { id: 'strength', label: 'Dept Strength' },
        { id: 'faculty', label: 'Faculty' },
        { id: 'admin', label: 'Admin & Ops' },
        { id: 'alerts', label: 'Alerts & Risks' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Summary Dashboard (Instant Overview) */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Dashboard Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
                    <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-md">
                         <p className="text-blue-100 text-xs font-bold uppercase">Total Students</p>
                         <p className="text-3xl font-extrabold mt-1">{totalStudents}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 bg-card rounded-xl p-4 border border-border shadow-sm">
                         <p className="text-muted-foreground text-xs font-bold uppercase">Total Faculty</p>
                         <p className="text-3xl font-extrabold text-foreground mt-1">{totalFaculty}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 bg-card rounded-xl p-4 border border-border shadow-sm">
                         <p className="text-muted-foreground text-xs font-bold uppercase">Departments</p>
                         <p className="text-3xl font-extrabold text-foreground mt-1">{departments.length}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 bg-card rounded-xl p-4 border border-border shadow-sm">
                         <p className="text-muted-foreground text-xs font-bold uppercase">Avg Attendance</p>
                         <div className="flex items-baseline gap-1 mt-1">
                            <p className={`text-3xl font-extrabold ${avgAttendance >= 75 ? 'text-emerald-600' : 'text-amber-500'}`}>{avgAttendance}%</p>
                         </div>
                    </div>
                     <div className="col-span-1 sm:col-span-2 bg-card rounded-xl p-4 border border-border shadow-sm">
                         <p className="text-muted-foreground text-xs font-bold uppercase">Pending Staff</p>
                         <p className="text-3xl font-extrabold text-amber-500 mt-1">{pendingApprovals}</p>
                    </div>
                     <div className="col-span-1 sm:col-span-2 bg-destructive/10 rounded-xl p-4 border border-destructive/20 shadow-sm">
                         <p className="text-destructive text-xs font-bold uppercase">At Risk (Att &lt; 60%)</p>
                         <p className="text-3xl font-extrabold text-destructive mt-1">{riskCount}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border overflow-x-auto no-scrollbar">
                <nav className="flex space-x-6 min-w-max pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-md"></span>}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* 1. Attendance Reports */}
                {activeTab === 'attendance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GraphCard title="Department-Level Attendance (%)">
                            <SimpleBarChart data={deptStats.map(d => d.attendance)} labels={deptStats.map(d => d.label)} color="bg-blue-500" />
                        </GraphCard>
                        
                        <GraphCard title="Lowest Attendance Students" className="lg:col-span-2">
                             {atRiskStudents.length > 0 ? (
                                 <div className="space-y-3">
                                    {atRiskStudents.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center text-destructive font-bold text-xs">{i+1}</div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{s.name}</p>
                                                    <p className="text-xs text-muted-foreground">{s.dept}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-destructive">{s.percentage}%</span>
                                        </div>
                                    ))}
                                 </div>
                             ) : <p className="text-center text-muted-foreground py-4">No students currently flagged at critical risk.</p>}
                        </GraphCard>
                    </div>
                )}

                {/* 2. Course Stats */}
                {activeTab === 'courses' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <GraphCard title="Courses per Department">
                             <SimpleBarChart data={deptStats.map(d => d.courses)} labels={deptStats.map(d => d.label)} color="bg-emerald-500" />
                         </GraphCard>
                         <GraphCard title="Assignment Distribution">
                             <div className="space-y-4">
                                {deptStats.map((d, i) => {
                                    const deptCourses = allCourses.filter(c => c.department === d.label);
                                    const totalAssignments = deptCourses.reduce((acc, c) => acc + (c.assignments?.length || 0), 0);
                                    if (totalAssignments === 0) return null;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-foreground">{d.label}</span>
                                                <span className="font-bold text-primary">{totalAssignments} Assignments</span>
                                            </div>
                                            <div className="w-full bg-muted/30 rounded-full h-2">
                                                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((totalAssignments / 20) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {allCourses.every(c => !c.assignments || c.assignments.length === 0) && <p className="text-center text-muted-foreground">No assignments created yet.</p>}
                             </div>
                         </GraphCard>
                    </div>
                )}

                {/* 3. Dept Strength */}
                {activeTab === 'strength' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GraphCard title="Student Distribution by Year">
                             <div className="flex justify-center py-6">
                                 <div className="relative w-32 h-32 rounded-full bg-muted/20 flex items-center justify-center border border-border">
                                     {/* Placeholder for donut chart visualization */}
                                     <span className="text-xs font-bold text-muted-foreground">No Data</span>
                                 </div>
                             </div>
                        </GraphCard>
                        <GraphCard title="Department Wise Student Strength">
                             <div className="space-y-3">
                                 {deptStats.map((d, i) => (
                                     <div key={d.label}>
                                         <div className="flex justify-between text-sm mb-1">
                                             <span className="font-medium text-foreground">{d.label}</span>
                                             <span className="text-muted-foreground">{d.students} Students</span>
                                         </div>
                                         <div className="w-full bg-muted/30 rounded-full h-2">
                                             <div className="bg-primary h-2 rounded-full" style={{ width: `${(d.students / (Math.max(...deptStats.map(x=>x.students)) || 1)) * 100}%` }}></div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </GraphCard>
                     </div>
                )}

                {/* 4. Faculty Reports */}
                {activeTab === 'faculty' && (
                    <div className="grid grid-cols-1 gap-6">
                        <GraphCard title="Faculty Course Load (Top 10)">
                             <div className="space-y-4">
                                 {facultyLoad.length > 0 ? facultyLoad.map((f, i) => (
                                     <div key={i} className="flex items-center gap-4">
                                         <div className="w-48 text-sm font-semibold text-foreground truncate">{f.name} <span className="text-xs text-muted-foreground font-normal">({f.department})</span></div>
                                         <div className="flex-1">
                                             <div className="w-full bg-muted/30 rounded-full h-3">
                                                 <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(f.courses * 20, 100)}%` }}></div>
                                             </div>
                                         </div>
                                         <div className="w-16 text-right text-xs text-muted-foreground">{f.courses} Courses</div>
                                     </div>
                                 )) : <p className="text-center text-muted-foreground">No faculty assigned to courses yet.</p>}
                             </div>
                        </GraphCard>
                        
                        <GraphCard title="Faculty Count by Department">
                            <SimpleBarChart data={deptStats.map(d => d.faculty)} labels={deptStats.map(d => d.label)} color="bg-purple-500" />
                        </GraphCard>
                    </div>
                )}

                {/* 6. Admin & Operational */}
                {activeTab === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GraphCard title="Pending Approvals">
                             <div className="space-y-3">
                                 <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                                     <span className="text-foreground">Teacher Approvals</span>
                                     <span className="font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 rounded">{allUsers.filter(u => u.tag === 'Teacher' && !u.isApproved && u.isRegistered).length}</span>
                                 </div>
                                  <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                                     <span className="text-foreground">HOD Approvals</span>
                                     <span className="font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 rounded">{allUsers.filter(u => u.tag === 'HOD/Dean' && !u.isApproved && u.isRegistered).length}</span>
                                 </div>
                             </div>
                        </GraphCard>
                    </div>
                )}

                {/* 9. Alerts & Risks */}
                {activeTab === 'alerts' && (
                     <div className="space-y-4">
                        {riskCount > 0 ? (
                             <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                                 <XCircleIcon className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5"/>
                                 <div>
                                     <h4 className="font-bold text-destructive">Critical Attendance Alert</h4>
                                     <p className="text-sm text-destructive mt-1">{riskCount} Students have attendance below 60%.</p>
                                 </div>
                             </div>
                        ) : <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold"><CheckCircleIcon className="w-6 h-6"/> No critical attendance risks found.</div>}
                        
                        {facultyLoad.some(f => f.courses > 5) && (
                             <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex items-start gap-3">
                                 <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"/>
                                 <div>
                                     <h4 className="font-bold text-amber-700 dark:text-amber-400">High Faculty Workload</h4>
                                     <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{facultyLoad.filter(f => f.courses > 5).length} Faculty members are assigned more than 5 courses.</p>
                                 </div>
                             </div>
                        )}
                     </div>
                )}

            </div>
        </div>
    );
};

// #endregion

// #region Modals
// (DirectorSetupView, ManageDepartmentsModal, EditDepartmentModal, CreateHodModal code remains same as provided in prompt but included here for completeness and to ensure imports match)

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
        <div className="bg-background min-h-screen">
             <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8 flex items-center justify-center h-[calc(100vh-64px)]">
                 <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-xl border border-border">
                     <div className="text-center">
                         <BuildingIcon className="w-16 h-16 mx-auto text-primary mb-4"/>
                         <h1 className="text-3xl font-bold text-foreground">Welcome, Director!</h1>
                         <p className="text-muted-foreground mt-2">Let's set up your college, <span className="font-semibold">{college.name}</span>. Please add the departments available at your institution to get started.</p>
                     </div>

                     <div className="mt-8">
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={newDept}
                                onChange={e => setNewDept(e.target.value)}
                                placeholder="e.g., Computer Science"
                                className="flex-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
                            />
                            <button onClick={addDepartment} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add</button>
                        </div>
                     </div>

                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar p-2 bg-muted/20 rounded-md">
                        {departments.length > 0 ? departments.map(dept => (
                            <div key={dept} className="flex justify-between items-center bg-card p-2 rounded-md border border-border">
                                <span className="font-medium text-foreground">{dept}</span>
                                <button onClick={() => removeDepartment(dept)} className="p-1 text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        )) : <p className="text-center text-sm text-muted-foreground p-4">No departments added yet.</p>}
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

    useEffect(() => {
        if (isOpen) {
            setDepartments(college.departments || []);
        }
    }, [isOpen, college.departments]);

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
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Manage Departments</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="Add new department" className="flex-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }} />
                    <button onClick={addDepartment} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar p-2 bg-muted/20 rounded-md">
                     {departments.map(dept => (
                        <div key={dept} className="flex justify-between items-center bg-card p-2 rounded-md border border-border">
                            <span className="font-medium text-foreground">{dept}</span>
                            <button onClick={() => removeDepartment(dept)} className="p-1 text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
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

const EditDepartmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    collegeId: string;
    oldName: string;
    onSave: (collegeId: string, oldName: string, newName: string) => void;
}> = ({ isOpen, onClose, collegeId, oldName, onSave }) => {
    const [newName, setNewName] = useState(oldName);

    useEffect(() => {
        if (isOpen) {
            setNewName(oldName);
        }
    }, [isOpen, oldName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newName !== oldName) {
            onSave(collegeId, oldName, newName.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-foreground mb-4">Edit Department</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Department Name</label>
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CreateHodModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    college: College;
    onCreateUser: (userData: Omit<User, 'id'>) => Promise<void>;
    defaultDepartment?: string;
}> = ({ isOpen, onClose, college, onCreateUser, defaultDepartment }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState(defaultDepartment || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setDepartment(defaultDepartment || (college.departments ? college.departments[0] : ''));
            setIsLoading(false);
        }
    }, [isOpen, college.departments, defaultDepartment]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const userData: Omit<User, 'id'> = {
            name,
            email,
            department,
            tag: 'HOD/Dean',
            isApproved: false, // Requires director to approve after signup (or implicit approval logic if we change it)
            isRegistered: false, // Invite flow
        };
        try {
            // Pass without password to trigger invite logic in App.tsx
            await onCreateUser(userData);
            alert(`Invitation sent to ${email}. They need to sign up to activate their account.`);
            onClose();
        } catch (error) {
            console.error("Failed to invite HOD", error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Appoint New HOD/Dean</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">This will create an invite for the HOD. They will need to sign up with this email address to access the dashboard.</p>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative"><UserPlusIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className={inputClasses} /></div>
                    <div className="relative"><MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className={inputClasses} /></div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} required className="w-full mt-1 px-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition">
                            {(college.departments || []).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait">
                            {isLoading ? 'Inviting...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// #endregion

// --- MAIN DIRECTOR PAGE COMPONENT ---

const DirectorPage: React.FC<DirectorPageProps> = (props) => {
    const { currentUser, allUsers, allCourses, onNavigate, currentPath, colleges, onUpdateCollegeDepartments, onCreateUser, onDeleteUser, onEditCollegeDepartment, onDeleteCollegeDepartment, onApproveTeacherRequest, onDeclineTeacherRequest, onApproveHodRequest, onDeclineHodRequest } = props;
    
    const [activeSection, setActiveSection] = useState<'dashboard' | 'departments' | 'hods' | 'faculty' | 'students' | 'reports' | 'approvals' | 'settings'>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [hodModalState, setHodModalState] = useState<{ isOpen: boolean; department?: string }>({ isOpen: false });
    const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
    const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    // PENDING APPROVAL VIEW
    if (currentUser.isApproved === false) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-10 max-w-lg text-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <ClockIcon className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">Account Pending Approval</h1>
                    <p className="text-muted-foreground mb-8">
                        Your Director account for <span className="font-semibold text-foreground">{colleges.find(c => c.id === currentUser.collegeId)?.name || "your college"}</span> has been created and is currently under review by the Super Admin.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">You will gain full access to the dashboard once approved.</p>
                    <button 
                        onClick={handleLogout} 
                        className="w-full py-3 font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    const college = useMemo(() => colleges.find(c => c.id === currentUser.collegeId), [colleges, currentUser.collegeId]);

    if (!college) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
    if (!college.departments || college.departments.length === 0) return <DirectorSetupView college={college} onSave={onUpdateCollegeDepartments} />;
    
    // -- Data Aggregation --
    const stats = useMemo(() => {
        const hods = allUsers.filter(u => u.tag === 'HOD/Dean');
        const faculty = allUsers.filter(u => u.tag === 'Teacher');
        const students = allUsers.filter(u => u.tag === 'Student');
        // Count approvals only for those who have registered
        const pendingFaculty = allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && !u.isApproved && u.isRegistered);
        
        return {
            deptCount: college.departments?.length || 0,
            hodCount: hods.length,
            facultyCount: faculty.length,
            studentCount: students.length,
            pendingApprovals: pendingFaculty.length
        };
    }, [allUsers, college.departments]);

    const hodsMap = useMemo(() => {
        const map: Record<string, User> = {};
        // Filter only approved HODs for the map display to prevent flickering
        allUsers.forEach(u => {
            if (u.tag === 'HOD/Dean' && u.department && u.isApproved) {
                map[u.department] = u;
            }
        });
        return map;
    }, [allUsers]);
    
    // -- Handlers for child components --
    const handleApproval = async (id: string, type: 'teacher' | 'hod') => {
        try {
            if (type === 'hod') onApproveHodRequest(id);
            else onApproveTeacherRequest(id);
        } catch (e) {
            console.error("Failed to approve request", e);
        }
    };

    const handleDecline = async (id: string, type: 'teacher' | 'hod') => {
         try {
            if (type === 'hod') onDeclineHodRequest(id);
            else onDeclineTeacherRequest(id);
         } catch (e) {
             console.error("Failed to decline request", e);
         }
    };

    const handleEditDept = (dept: string) => {
        setEditingDepartment(dept);
        setIsEditDeptModalOpen(true);
    };

    const handleDeleteDept = (dept: string) => {
        if(window.confirm(`Are you sure you want to delete ${dept}?`)) {
            onDeleteCollegeDepartment(college.id, dept);
        }
    };
    
    const handleViewDashboard = (userId: string) => {
        onNavigate(`#/director/view/${userId}`);
    };

    const handleSectionChange = (section: typeof activeSection) => {
        setActiveSection(section);
        setMobileMenuOpen(false);
    }


    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
             {/* Mobile Sub-header */}
            <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center sticky top-16 z-30">
                <span className="font-bold text-lg capitalize text-foreground">{activeSection}</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-foreground">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden w-full relative">
                {/* Sidebar (Desktop) */}
                <aside className="hidden md:block w-64 p-6 border-r border-border overflow-y-auto h-[calc(100vh-64px)] sticky top-0 flex-shrink-0 bg-card">
                    <div className="space-y-1">
                        <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => setActiveSection('dashboard')} active={activeSection === 'dashboard'} />
                        <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Management</div>
                        <SidebarItem id="departments" label="Departments" icon={BuildingIcon} onClick={() => setActiveSection('departments')} active={activeSection === 'departments'} />
                        <SidebarItem id="hods" label="HODs" icon={UserPlusIcon} onClick={() => setActiveSection('hods')} active={activeSection === 'hods'} />
                        <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">People</div>
                        <SidebarItem id="faculty" label="Faculty & Staff" icon={UsersIcon} onClick={() => setActiveSection('faculty')} active={activeSection === 'faculty'} />
                        <SidebarItem id="students" label="Students" icon={UsersIcon} onClick={() => setActiveSection('students')} active={activeSection === 'students'} />
                        <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Analysis</div>
                        <SidebarItem id="reports" label="Reports & Analytics" icon={FileTextIcon} onClick={() => setActiveSection('reports')} active={activeSection === 'reports'} />
                        <SidebarItem id="approvals" label="Approvals" icon={CheckCircleIcon} onClick={() => setActiveSection('approvals')} active={activeSection === 'approvals'} />
                        <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">System</div>
                        <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => setActiveSection('settings')} active={activeSection === 'settings'} />
                    </div>
                </aside>

                {/* Mobile Sidebar Drawer */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
                        <aside className="w-64 bg-card h-full p-6 overflow-y-auto shadow-2xl animate-slide-in-left" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Menu</h2>
                                <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6 text-muted-foreground" /></button>
                            </div>
                            <div className="space-y-1">
                                <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => handleSectionChange('dashboard')} active={activeSection === 'dashboard'} />
                                <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Management</div>
                                <SidebarItem id="departments" label="Departments" icon={BuildingIcon} onClick={() => handleSectionChange('departments')} active={activeSection === 'departments'} />
                                <SidebarItem id="hods" label="HODs" icon={UserPlusIcon} onClick={() => handleSectionChange('hods')} active={activeSection === 'hods'} />
                                <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">People</div>
                                <SidebarItem id="faculty" label="Faculty & Staff" icon={UsersIcon} onClick={() => handleSectionChange('faculty')} active={activeSection === 'faculty'} />
                                <SidebarItem id="students" label="Students" icon={UsersIcon} onClick={() => handleSectionChange('students')} active={activeSection === 'students'} />
                                <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Analysis</div>
                                <SidebarItem id="reports" label="Reports & Analytics" icon={FileTextIcon} onClick={() => handleSectionChange('reports')} active={activeSection === 'reports'} />
                                <SidebarItem id="approvals" label="Approvals" icon={CheckCircleIcon} onClick={() => handleSectionChange('approvals')} active={activeSection === 'approvals'} />
                                <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">System</div>
                                <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => handleSectionChange('settings')} active={activeSection === 'settings'} />
                            </div>
                        </aside>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)] bg-muted/10">
                    {activeSection === 'dashboard' && (
                        <DashboardHome 
                            stats={stats} 
                            setActiveSection={handleSectionChange}
                            openDeptModal={() => setIsDeptModalOpen(true)}
                            openHodModal={() => setHodModalState({ isOpen: true })}
                        />
                    )}
                    {activeSection === 'departments' && (
                        <DepartmentsView 
                            departments={college.departments || []}
                            openAddModal={() => setIsDeptModalOpen(true)}
                            onEdit={handleEditDept}
                            onDelete={handleDeleteDept}
                        />
                    )}
                    {activeSection === 'hods' && (
                        <HodsView 
                            departments={college.departments || []}
                            hodsMap={hodsMap}
                            openAddModal={(dept) => setHodModalState({ isOpen: true, department: dept })}
                            onRemove={onDeleteUser}
                            onViewDashboard={handleViewDashboard}
                        />
                    )}
                    {activeSection === 'faculty' && (
                        <FacultyView 
                            facultyList={allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && u.isApproved)}
                            onViewDashboard={handleViewDashboard}
                        />
                    )}
                    {activeSection === 'students' && (
                        <StudentsView 
                            allUsers={allUsers}
                            onDeleteUser={onDeleteUser}
                        />
                    )}
                    {activeSection === 'reports' && (
                        <AnalyticsDashboard
                            allUsers={allUsers}
                            allCourses={allCourses}
                            colleges={colleges}
                            currentUser={currentUser}
                        />
                    )}
                    {activeSection === 'approvals' && (
                        <ApprovalsView 
                            allUsers={allUsers}
                            onApprove={handleApproval}
                            onDecline={handleDecline}
                        />
                    )}
                    {activeSection === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-xl border border-border">
                             <SettingsIcon className="w-12 h-12 text-muted-foreground mb-4" />
                             <h3 className="text-lg font-bold text-foreground">Settings</h3>
                             <p className="text-muted-foreground">System configuration is under development.</p>
                        </div>
                    )}
                </main>
            </div>
            
             {/* Modals */}
            <ManageDepartmentsModal 
                isOpen={isDeptModalOpen} 
                onClose={() => setIsDeptModalOpen(false)} 
                college={college} 
                onSave={onUpdateCollegeDepartments} 
            />
            
            <CreateHodModal 
                isOpen={hodModalState.isOpen} 
                onClose={() => setHodModalState({ isOpen: false })} 
                college={college} 
                onCreateUser={onCreateUser as any} 
                defaultDepartment={hodModalState.department} 
            />

            {editingDepartment && (
                <EditDepartmentModal
                    isOpen={isEditDeptModalOpen}
                    onClose={() => { setIsEditDeptModalOpen(false); setEditingDepartment(null); }}
                    collegeId={college.id}
                    oldName={editingDepartment}
                    onSave={onEditCollegeDepartment}
                />
            )}

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default DirectorPage;
