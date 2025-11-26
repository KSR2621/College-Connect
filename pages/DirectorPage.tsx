
import React, { useState, useMemo } from 'react';
import { User, Post, Group, ReactionType, Course, Notice, UserTag, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { 
    BuildingIcon, UserPlusIcon, PlusIcon, CloseIcon, TrashIcon, UsersIcon, 
    ClockIcon, CheckCircleIcon, ChevronRightIcon, FileTextIcon, ChartPieIcon, 
    SettingsIcon, MenuIcon, XCircleIcon, MailIcon, LockIcon, CheckSquareIcon,
    ChartBarIcon, CalendarIcon, ArrowRightIcon
} from '../components/Icons';

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
    onEditCollegeDepartment: (collegeId: string, oldName, newName) => void;
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

// --- Helper Components ---

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

const CreateStaffModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
    departments: string[];
    roleLabel: string;
    roleTag: UserTag;
}> = ({ isOpen, onClose, onCreateUser, departments, roleLabel, roleTag }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState(departments[0] || '');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onCreateUser({
                name,
                email: email.toLowerCase(), // Normalize email
                department,
                tag: roleTag,
                isApproved: true, // Direct creation by Director is auto-approved
                isRegistered: false // Important: They must register themselves
            });
            setName(''); setEmail('');
            onClose();
            alert(`${roleLabel} invite created. Ask them to Sign Up with this email.`);
        } catch (e: any) {
            alert(`Failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Invite New {roleLabel}</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-muted-foreground"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Dr. Smith"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="email@college.edu"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                        <p><strong>Note:</strong> This will create an invite. The user must go to the "Sign Up" page and register with this email to set their password.</p>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {isLoading ? 'Creating Invite...' : 'Create Invite'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ... rest of DirectorPage.tsx (DirectorSetupView, ReportsView, Main Component) remains unchanged,
// just ensuring CreateStaffModal above replaces the existing one.

// --- Director Setup View (Initial) ---

const DirectorSetupView: React.FC<{ college: College; onSave: (collegeId: string, departments: string[]) => void; }> = ({ college, onSave }) => {
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

    return (
        <div className="bg-background min-h-screen flex items-center justify-center p-4">
             <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-xl border border-border">
                 <div className="text-center">
                     <BuildingIcon className="w-16 h-16 mx-auto text-primary mb-4"/>
                     <h1 className="text-3xl font-bold text-foreground">Welcome, Director!</h1>
                     <p className="text-muted-foreground mt-2">Let's set up your college, <span className="font-semibold">{college.name}</span>. Please add departments.</p>
                 </div>
                 <div className="mt-8 flex gap-2">
                     <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="e.g., Computer Science" className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary text-foreground" onKeyDown={e => e.key === 'Enter' && addDepartment()}/>
                     <button onClick={addDepartment} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add</button>
                 </div>
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar p-2 bg-muted/20 rounded-md">
                    {departments.map(dept => (
                        <div key={dept} className="flex justify-between items-center bg-card p-2 rounded-md border border-border">
                            <span className="font-medium text-foreground">{dept}</span>
                            <button onClick={() => removeDepartment(dept)} className="p-1 text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                    {departments.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No departments added yet.</p>}
                </div>
                <div className="mt-8">
                    <button onClick={() => onSave(college.id, departments)} disabled={departments.length === 0} className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">Save & Continue</button>
                </div>
             </div>
        </div>
    );
};

// --- Reports View Components ---

const DepartmentAttendanceChart: React.FC<{ data: { department: string; percentage: number }[] }> = ({ data }) => (
    <div className="space-y-3">
        {data.map((item, index) => (
            <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>{item.department}</span>
                    <span>{item.percentage}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${item.percentage >= 75 ? 'bg-emerald-500' : item.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${item.percentage}%` }}
                    ></div>
                </div>
            </div>
        ))}
    </div>
);

const ReportsView: React.FC<{ courses: Course[]; departments: string[] }> = ({ courses, departments }) => {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterDept, setFilterDept] = useState('All');

    const stats = useMemo(() => {
        const selectedDate = new Date(filterDate);
        const isToday = selectedDate.toDateString() === new Date().toDateString();

        let totalPresent = 0;
        let totalStudents = 0;
        
        const deptStats: { [key: string]: { present: number, total: number } } = {};
        departments.forEach(d => deptStats[d] = { present: 0, total: 0 });

        const courseStats = courses.map(course => {
            if (filterDept !== 'All' && course.department !== filterDept) return null;

            // Find attendance record for the specific date
            const record = course.attendanceRecords?.find(r => new Date(r.date).toDateString() === selectedDate.toDateString());
            
            let presentCount = 0;
            const enrolledCount = course.students?.length || 0;

            if (record) {
                Object.values(record.records).forEach((status: any) => {
                    if (status.status === 'present') presentCount++;
                });
            }

            // Only count stats if attendance was taken OR we are looking at past dates (where 0 is valid if no class)
            // For simpler logic, we calculate based on enrolled students if a record exists
            if (record) {
                totalPresent += presentCount;
                totalStudents += enrolledCount;
                
                if (deptStats[course.department]) {
                    deptStats[course.department].present += presentCount;
                    deptStats[course.department].total += enrolledCount;
                }
            }

            return {
                id: course.id,
                name: course.subject,
                department: course.department,
                year: course.year,
                present: presentCount,
                total: enrolledCount,
                percentage: enrolledCount > 0 ? Math.round((presentCount / enrolledCount) * 100) : 0,
                recordExists: !!record
            };
        }).filter(Boolean) as any[];

        const deptChartData = Object.entries(deptStats).map(([dept, data]) => ({
            department: dept,
            percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage);

        const overallPercentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

        return { overallPercentage, deptChartData, courseStats };
    }, [courses, departments, filterDate, filterDept]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Attendance Reports</h2>
                <div className="flex gap-2">
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)} 
                        className="bg-card border border-border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none text-foreground"
                    />
                    <select 
                        value={filterDept} 
                        onChange={e => setFilterDept(e.target.value)} 
                        className="bg-card border border-border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none text-foreground"
                    >
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Stats */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Overall Attendance</h3>
                    <div className="relative h-32 w-32 flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-muted" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path className={`${stats.overallPercentage >= 75 ? 'text-emerald-500' : stats.overallPercentage >= 60 ? 'text-amber-500' : 'text-red-500'}`} strokeDasharray={`${stats.overallPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        </svg>
                        <span className="absolute text-3xl font-extrabold text-foreground">{stats.overallPercentage}%</span>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">{new Date(filterDate).toDateString()}</p>
                </div>

                {/* Dept Breakdown */}
                <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Department Wise</h3>
                    <DepartmentAttendanceChart data={stats.deptChartData} />
                </div>
            </div>

            {/* Detailed List */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/10">
                    <h3 className="font-bold text-foreground">Class Wise Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-bold border-b border-border">
                            <tr>
                                <th className="p-3">Class / Subject</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Year</th>
                                <th className="p-3 text-center">Present</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats.courseStats.length > 0 ? stats.courseStats.map(c => (
                                <tr key={c.id} className="hover:bg-muted/20">
                                    <td className="p-3 font-semibold text-foreground">{c.name}</td>
                                    <td className="p-3 text-muted-foreground">{c.department}</td>
                                    <td className="p-3 text-muted-foreground">{c.year}</td>
                                    <td className="p-3 text-center">
                                        {c.recordExists ? (
                                            <span className="font-bold text-foreground">{c.present} <span className="text-muted-foreground font-normal">/ {c.total}</span></span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {c.recordExists ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${c.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {c.percentage}%
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-muted text-muted-foreground">No Record</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No classes found for selected filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const DirectorPage: React.FC<DirectorPageProps> = (props) => {
    const { currentUser, allUsers, onNavigate, currentPath, colleges, onUpdateCollegeDepartments, onCreateUser, onApproveHodRequest, onDeclineHodRequest, onApproveTeacherRequest, onDeclineTeacherRequest, onToggleFreezeUser, onDeleteUser, allCourses } = props;
    const [activeSection, setActiveSection] = useState<'dashboard' | 'departments' | 'hods' | 'faculty' | 'students' | 'approvals' | 'reports' | 'settings'>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    
    // Staff Creation Modal State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [staffModalRole, setStaffModalRole] = useState<{label: string, tag: UserTag}>({label: 'HOD', tag: 'HOD/Dean'});

    // Department State
    const [newDeptName, setNewDeptName] = useState('');

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const college = colleges.find(c => c.id === currentUser.collegeId);

    if (currentUser.isApproved === false) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-10 max-w-lg text-center">
                    <ClockIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-4">Account Pending Approval</h1>
                    <p className="text-muted-foreground mb-8">Your Director account is currently under review by the Super Admin.</p>
                    <button onClick={handleLogout} className="w-full py-3 font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">Sign Out</button>
                </div>
            </div>
        );
    }

    if (!college) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!college.departments || college.departments.length === 0) return <DirectorSetupView college={college} onSave={onUpdateCollegeDepartments} />;

    // Data Filtering
    const hods = allUsers.filter(u => u.tag === 'HOD/Dean' && u.collegeId === college.id && u.isApproved);
    const faculty = allUsers.filter(u => u.tag === 'Teacher' && u.collegeId === college.id && u.isApproved);
    const students = allUsers.filter(u => u.tag === 'Student' && u.collegeId === college.id && u.isApproved);
    const pendingUsers = allUsers.filter(u => u.collegeId === college.id && !u.isApproved && u.isRegistered);
    const myCollegeCourses = allCourses.filter(c => c.collegeId === college.id);

    const stats = {
        deptCount: college.departments.length,
        hodCount: hods.length,
        facultyCount: faculty.length,
        studentCount: students.length,
        pendingApprovals: pendingUsers.length
    };

    const handleAddDepartment = () => {
        if (newDeptName.trim()) {
            const updatedDepts = [...(college.departments || []), newDeptName.trim()];
            onUpdateCollegeDepartments(college.id, updatedDepts);
            setNewDeptName('');
        }
    };

    const handleDeleteDepartment = (deptName: string) => {
        if (window.confirm(`Delete department "${deptName}"? This will not delete users, but they may lose department association.`)) {
            const updatedDepts = (college.departments || []).filter(d => d !== deptName);
            onUpdateCollegeDepartments(college.id, updatedDepts);
        }
    };

    const openCreateStaffModal = (role: 'HOD' | 'Faculty') => {
        setStaffModalRole(role === 'HOD' ? { label: 'HOD', tag: 'HOD/Dean' } : { label: 'Faculty', tag: 'Teacher' });
        setIsStaffModalOpen(true);
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center sticky top-16 z-30">
                <span className="font-bold text-lg capitalize text-foreground">{activeSection}</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-foreground"><MenuIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden w-full relative">
                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 md:hidden">
                            <h2 className="text-xl font-bold text-foreground">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-1">
                            <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => {setActiveSection('dashboard'); setMobileMenuOpen(false);}} active={activeSection === 'dashboard'} />
                            <SidebarItem id="departments" label="Departments" icon={BuildingIcon} onClick={() => {setActiveSection('departments'); setMobileMenuOpen(false);}} active={activeSection === 'departments'} />
                            <SidebarItem id="reports" label="Attendance Reports" icon={ChartBarIcon} onClick={() => {setActiveSection('reports'); setMobileMenuOpen(false);}} active={activeSection === 'reports'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Users</div>
                            <SidebarItem id="hods" label="HODs" icon={UserPlusIcon} onClick={() => {setActiveSection('hods'); setMobileMenuOpen(false);}} active={activeSection === 'hods'} />
                            <SidebarItem id="faculty" label="Faculty" icon={UsersIcon} onClick={() => {setActiveSection('faculty'); setMobileMenuOpen(false);}} active={activeSection === 'faculty'} />
                            <SidebarItem id="students" label="Students" icon={UsersIcon} onClick={() => {setActiveSection('students'); setMobileMenuOpen(false);}} active={activeSection === 'students'} />
                            <SidebarItem id="approvals" label="Approvals" icon={CheckCircleIcon} onClick={() => {setActiveSection('approvals'); setMobileMenuOpen(false);}} active={activeSection === 'approvals'} />
                        </div>
                    </div>
                </aside>
                
                {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)] bg-muted/10 pb-32 lg:pb-8">
                    
                    {activeSection === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-3xl font-bold text-foreground">Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Departments" value={stats.deptCount} icon={BuildingIcon} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
                                <StatCard label="HODs" value={stats.hodCount} icon={UserPlusIcon} colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
                                <StatCard label="Faculty" value={stats.facultyCount} icon={UsersIcon} colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
                                <StatCard label="Students" value={stats.studentCount} icon={UsersIcon} colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" trend="up" />
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                    <h3 className="font-bold text-lg mb-4">Pending Approvals</h3>
                                    {stats.pendingApprovals > 0 ? (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="text-amber-800 dark:text-amber-200 font-bold">{stats.pendingApprovals} Users Waiting</p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400">Review new registrations</p>
                                            </div>
                                            <button onClick={() => setActiveSection('approvals')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">Review</button>
                                        </div>
                                    ) : <p className="text-muted-foreground">No pending approvals.</p>}
                                </div>
                                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                    <h3 className="font-bold text-lg mb-4">System Health</h3>
                                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircleIcon className="w-6 h-6"/>
                                        <span className="font-medium">All Systems Operational</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <ReportsView courses={myCollegeCourses} departments={college.departments || []} />
                    )}

                    {activeSection === 'departments' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-foreground">Departments</h2>
                            </div>
                            
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="flex gap-2 mb-6">
                                    <input 
                                        type="text" 
                                        value={newDeptName} 
                                        onChange={e => setNewDeptName(e.target.value)} 
                                        placeholder="New Department Name" 
                                        className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        onKeyDown={e => e.key === 'Enter' && handleAddDepartment()}
                                    />
                                    <button onClick={handleAddDepartment} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90"><PlusIcon className="w-5 h-5"/></button>
                                </div>
                                <div className="space-y-2">
                                    {college.departments?.map(dept => (
                                        <div key={dept} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg border border-border">
                                            <span className="font-medium text-foreground">{dept}</span>
                                            <button onClick={() => handleDeleteDepartment(dept)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeSection === 'hods' || activeSection === 'faculty') && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-foreground">{activeSection === 'hods' ? 'Head of Departments' : 'Faculty Members'}</h2>
                                <button 
                                    onClick={() => openCreateStaffModal(activeSection === 'hods' ? 'HOD' : 'Faculty')} 
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90"
                                >
                                    <PlusIcon className="w-4 h-4"/> Invite {activeSection === 'hods' ? 'HOD' : 'Faculty'}
                                </button>
                            </div>
                            
                            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                                            <tr>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Email</th>
                                                <th className="p-4">Department</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(activeSection === 'hods' ? hods : faculty).map(user => (
                                                <tr key={user.id} className="hover:bg-muted/20">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                        <span className="font-semibold text-foreground">{user.name}</span>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                                    <td className="p-4"><span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">{user.department}</span></td>
                                                    <td className="p-4 text-right flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => onNavigate(`#/director/view/${user.id}`)} 
                                                            className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            View Dashboard
                                                        </button>
                                                        <button onClick={() => { if(window.confirm('Delete this user?')) onDeleteUser(user.id) }} className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(activeSection === 'hods' ? hods : faculty).length === 0 && (
                                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'students' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-foreground">Students Directory</h2>
                            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                                            <tr>
                                                <th className="p-4">Student</th>
                                                <th className="p-4">Department</th>
                                                <th className="p-4">Year</th>
                                                <th className="p-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {students.map(user => (
                                                <tr key={user.id} className="hover:bg-muted/20">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                        <div>
                                                            <p className="font-semibold text-foreground">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">{user.department}</td>
                                                    <td className="p-4">{user.yearOfStudy || 'N/A'}</td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => onToggleFreezeUser(user.id)} 
                                                            className={`px-3 py-1 rounded font-bold text-xs ${user.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                                                        >
                                                            {user.isFrozen ? 'Suspended' : 'Active'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {students.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No students found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'approvals' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-foreground">Pending Registrations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingUsers.map(user => {
                                    const isProcessing = approvingId === user.id;
                                    return (
                                        <div key={user.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                                                <div>
                                                    <h4 className="font-bold text-foreground">{user.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{user.tag} • {user.department}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <button 
                                                    onClick={async () => {
                                                        setApprovingId(user.id);
                                                        if (user.tag === 'HOD/Dean') {
                                                            await onApproveHodRequest(user.id);
                                                        } else {
                                                            await onApproveTeacherRequest(user.id);
                                                        }
                                                        setApprovingId(null);
                                                    }}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessing ? (
                                                        <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                                    ) : (
                                                        <><CheckCircleIcon className="w-3 h-3"/> Approve</>
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        setApprovingId(user.id);
                                                        if (user.tag === 'HOD/Dean') {
                                                            await onDeclineHodRequest(user.id);
                                                        } else {
                                                            await onDeclineTeacherRequest(user.id);
                                                        }
                                                        setApprovingId(null);
                                                    }}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircleIcon className="w-3 h-3"/> Reject
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                                {pendingUsers.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-50"/>
                                        <p>All caught up! No pending requests.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            <CreateStaffModal 
                isOpen={isStaffModalOpen} 
                onClose={() => setIsStaffModalOpen(false)} 
                onCreateUser={onCreateUser} 
                departments={college.departments || []} 
                roleLabel={staffModalRole.label} 
                roleTag={staffModalRole.tag}
            />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default DirectorPage;
