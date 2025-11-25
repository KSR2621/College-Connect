
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Course, Notice, DepartmentChat, Message, AttendanceStatus, Feedback, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { 
    BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, 
    TrashIcon, MessageIcon, UsersIcon, CheckSquareIcon, StarIcon, UserPlusIcon, 
    ClockIcon, UploadIcon, ClipboardListIcon, CalendarIcon, FileTextIcon, 
    ChartBarIcon, SettingsIcon, MenuIcon, CheckCircleIcon, XCircleIcon, AwardIcon
} from '../components/Icons';
import { yearOptions } from '../constants';

interface AcademicsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  courses: Course[];
  onCreateCourse: (courseData: Omit<Course, 'id' | 'facultyId'>) => void;
  notices: Notice[];
  users: { [key: string]: User };
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
  onRequestToJoinCourse: (courseId: string) => void;
  departmentChats: DepartmentChat[];
  onSendDepartmentMessage: (department: string, channel: string, text: string) => void;
  onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
  onApproveTeacherRequest: (teacherId: string) => void;
  onDeclineTeacherRequest: (teacherId: string) => void;
  colleges: College[];
}

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
    <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
    </div>
);

const StatCard = ({ label, value, icon: Icon, colorClass, subText }: any) => (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex items-center justify-between">
        <div>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{label}</p>
            <div className="mt-1">
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                {subText && <p className="text-xs text-muted-foreground">{subText}</p>}
            </div>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const SidebarItem = ({ id, label, icon: Icon, onClick, active }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
        <span className={`font-medium text-sm ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const CreateCourseModal = ({ onClose, onAddCourse, departmentOptions }: any) => {
    const [subject, setSubject] = useState('');
    const [department, setDepartment] = useState(departmentOptions[0] || '');
    const [year, setYear] = useState(1);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddCourse({ subject, department, year });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Course</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-2 border rounded bg-input text-foreground" placeholder="Subject Name" value={subject} onChange={e => setSubject(e.target.value)} required />
                    <select className="w-full p-2 border rounded bg-input text-foreground" value={department} onChange={e => setDepartment(e.target.value)}>
                        {departmentOptions.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="w-full p-2 border rounded bg-input text-foreground" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateNoticeModal = ({ onClose, onCreateNotice, departmentOptions, availableYears }: any) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateNotice({ title, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Notice</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-2 border rounded bg-input text-foreground" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <textarea className="w-full p-2 border rounded bg-input text-foreground" placeholder="Content" value={content} onChange={e => setContent(e.target.value)} required rows={4} />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Post</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateStudentAccountModal = ({ isOpen, onClose, department, onCreateUser }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    
    if (!isOpen) return null;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreateUser({ name, email, department, tag: 'Student', isApproved: true, isRegistered: false });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Student</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-2 border rounded bg-input text-foreground" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                    <input className="w-full p-2 border rounded bg-input text-foreground" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Standalone Components for Dashboard ---

const StudentProgressView: React.FC<{ myCourses: Course[]; users: { [key: string]: User }; setIsCreateStudentModalOpen: (v: boolean) => void }> = ({ myCourses, users, setIsCreateStudentModalOpen }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const studentStats = useMemo(() => {
         const stats: Record<string, any> = {};
         myCourses.forEach(course => {
             (course.students || []).forEach(sid => {
                 if(!stats[sid]) stats[sid] = { name: users[sid]?.name, avatarUrl: users[sid]?.avatarUrl, totalClasses: 0, presentClasses: 0, courses: [] };
                 stats[sid].courses.push(course.subject);
             });
             course.attendanceRecords?.forEach(r => {
                 Object.entries(r.records).forEach(([sid, s]: any) => {
                     if(stats[sid]) {
                         stats[sid].totalClasses++;
                         if(s.status === 'present') stats[sid].presentClasses++;
                     }
                 })
             })
         });
         return Object.entries(stats).map(([id, s]) => ({
             id, ...s, attendancePercentage: s.totalClasses > 0 ? Math.round((s.presentClasses/s.totalClasses)*100) : 0
         }));
    }, [myCourses, users]);

    const filteredStats = useMemo(() => {
        if(!searchTerm.trim()) return studentStats;
        return studentStats.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [studentStats, searchTerm]);

    return (
         <div className="space-y-6 animate-fade-in">
            <SectionHeader 
                title="Student Progress" 
                subtitle="Track attendance and performance." 
                action={
                    <button onClick={() => setIsCreateStudentModalOpen(true)} className="bg-primary/10 text-primary font-bold py-2 px-4 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-primary/20 transition-colors">
                        <UserPlusIcon className="w-4 h-4" /> Add Student
                    </button>
                }
            />
            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Search students..." 
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border"><tr><th className="p-4">Student</th><th className="p-4">Attendance</th></tr></thead>
                        <tbody>
                            {filteredStats.map(s => (
                                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        <Avatar src={s.avatarUrl} name={s.name} size="sm"/>
                                        {s.name}
                                    </td>
                                    <td className="p-4"><span className={`font-bold ${s.attendancePercentage < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{s.attendancePercentage}%</span></td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No students found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
    );
};

const DashboardHome: React.FC<{ currentUser: User; myCourses: Course[]; pendingAttendanceCount: number; totalAssignments: number; totalStudents: number }> = ({ currentUser, myCourses, pendingAttendanceCount, totalAssignments, totalStudents }) => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex justify-between items-center">
            <div>
                <p className="text-blue-100 font-medium text-sm mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h2 className="text-3xl font-bold">Welcome Back, {currentUser.name}!</h2>
                <p className="mt-2 text-blue-50 opacity-90">You have {myCourses.length} active courses.</p>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Active Courses" value={myCourses.length} icon={BookOpenIcon} colorClass="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" />
            <StatCard label="Attendance Pending" value={pendingAttendanceCount} icon={CheckSquareIcon} colorClass="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300" subText="Classes today" />
            <StatCard label="Total Assignments" value={totalAssignments} icon={ClipboardListIcon} colorClass="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" />
            <StatCard label="Total Students" value={totalStudents} icon={UsersIcon} colorClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300" />
        </div>
    </div>
);

const AttendanceSelectionView: React.FC<{ myCourses: Course[]; onNavigate: (path: string) => void }> = ({ myCourses, onNavigate }) => (
    <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Take Attendance" subtitle="Select a course to record attendance for today." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map(course => (
                <div 
                    key={course.id} 
                    onClick={() => onNavigate(`#/academics/${course.id}/attendance`)}
                    className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <CheckSquareIcon className="w-6 h-6"/>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{course.subject}</h3>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground">Class {course.year} {course.division ? `- ${course.division}` : ''}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{course.department}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{course.students?.length || 0} Students</span>
                        <span className="text-primary">Tap to Open</span>
                    </div>
                </div>
            ))}
            {myCourses.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                    No active courses found. Create a course first.
                </div>
            )}
        </div>
    </div>
);

const ClassesView: React.FC<{ myCourses: Course[]; setIsAddCourseModalOpen: (v: boolean) => void; onNavigate: (path: string) => void }> = ({ myCourses, setIsAddCourseModalOpen, onNavigate }) => (
     <div className="space-y-6 animate-fade-in">
         <SectionHeader 
            title="My Classes" 
            subtitle="Manage your active courses."
            action={<button onClick={() => setIsAddCourseModalOpen(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-transform transform hover:scale-105"><PlusIcon className="w-4 h-4"/> Add Class</button>}
         />
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map(c => (
                <div key={c.id} className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all cursor-pointer group" onClick={() => onNavigate(`#/academics/${c.id}`)}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <BookOpenIcon className="w-5 h-5"/>
                        </div>
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Class {c.year}-{c.division || 'A'}</span>
                    </div>
                    <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{c.subject}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{c.department}</p>
                </div>
            ))}
         </div>
    </div>
);

const StudentAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, courses, onNavigate, notices } = props;
    const myCourses = courses.filter(c => c.students?.includes(currentUser.id));

    return (
        <div className="flex flex-col h-screen bg-background">
             <Header currentUser={currentUser} onLogout={() => auth.signOut().then(() => onNavigate('#/'))} onNavigate={onNavigate} currentPath={props.currentPath} />
             <main className="flex-1 p-4 overflow-y-auto container mx-auto max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">My Academics</h1>
                
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-primary"/> Enrolled Courses</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {myCourses.map(c => (
                            <div key={c.id} onClick={() => onNavigate(`#/academics/${c.id}`)} className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{c.subject}</h3>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">Class {c.year}-{c.division || 'A'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{c.department}</p>
                            </div>
                        ))}
                        {myCourses.length === 0 && <p className="text-muted-foreground italic">You are not enrolled in any courses yet.</p>}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MegaphoneIcon className="w-5 h-5 text-amber-500"/> Notices</h2>
                    <div className="space-y-4">
                        {notices.map(n => (
                            <div key={n.id} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <h3 className="font-bold">{n.title}</h3>
                                <div className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{__html: n.content}}></div>
                                <p className="text-xs text-muted-foreground mt-2">{new Date(n.timestamp).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {notices.length === 0 && <p className="text-muted-foreground italic">No notices.</p>}
                    </div>
                </div>
             </main>
             <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={props.currentPath}/>
        </div>
    );
};

const FacultyAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, courses, onCreateCourse, notices, users, onCreateNotice, onDeleteNotice, departmentChats, onSendDepartmentMessage, colleges, onCreateUser, currentPath } = props;
    
    const [activeSection, setActiveSection] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    if ((currentUser.tag === 'Teacher' || currentUser.tag === 'HOD/Dean') && currentUser.isApproved === false) {
        return (
            <div className="text-center bg-card rounded-lg border-2 border-dashed border-amber-400 p-12 text-muted-foreground animate-fade-in mt-8">
                <ClockIcon className="mx-auto h-16 w-16 text-amber-500" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">Account Pending Approval</h3>
                <p className="mt-2 max-w-md mx-auto">
                    Your account has been created but is awaiting approval from the director/HOD. You will gain full access to the academics dashboard once your role is confirmed.
                </p>
            </div>
        );
    }

    const userRole = currentUser.tag;
    const college = colleges.find(c => c.id === currentUser.collegeId);
    const collegeDepartments = useMemo(() => college?.departments || [], [college]);
    const collegeClasses = college?.classes || {};
    
    const myDepartmentYears = useMemo(() => {
        if (!currentUser.department || !collegeClasses[currentUser.department]) return [];
        return Object.keys(collegeClasses[currentUser.department]).map(Number).sort((a, b) => a - b);
    }, [collegeClasses, currentUser.department]);

    const allCollegeYears = useMemo(() => {
        const yearsSet = new Set<number>();
        Object.values(collegeClasses).forEach(deptClasses => {
            Object.keys(deptClasses).forEach(y => yearsSet.add(Number(y)));
        });
        return Array.from(yearsSet).sort((a, b) => a - b);
    }, [collegeClasses]);

    const myCourses = useMemo(() => courses.filter(c => c.facultyId === currentUser.id), [courses, currentUser]);
    
    // Stats Calculation
    const today = new Date();
    const pendingAttendanceCount = myCourses.filter(c => {
        const todayRecord = c.attendanceRecords?.find(r => new Date(r.date).toDateString() === today.toDateString());
        return !todayRecord; 
    }).length;
    
    const totalAssignments = myCourses.reduce((acc, c) => acc + (c.assignments?.length || 0), 0);
    const totalStudents = myCourses.reduce((acc, c) => acc + (c.students?.length || 0), 0);

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        setMobileMenuOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
             <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
             
             <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
                {/* Mobile Sub-header */}
                <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center flex-shrink-0">
                    <span className="font-bold text-lg capitalize text-foreground">{activeSection.replace(/_/g, ' ')}</span>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center mb-8 md:hidden">
                            <h2 className="text-xl font-bold text-foreground">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6 text-muted-foreground" /></button>
                        </div>
                        
                        <div className="space-y-1.5 flex-1">
                            <SidebarItem id="dashboard" label="Dashboard" icon={ChartBarIcon} onClick={() => handleSectionChange('dashboard')} active={activeSection === 'dashboard'} />
                            
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Teaching</p>
                            <SidebarItem id="classes" label="My Classes" icon={BookOpenIcon} onClick={() => handleSectionChange('classes')} active={activeSection === 'classes'} />
                            <SidebarItem id="students" label="Student Progress" icon={UsersIcon} onClick={() => handleSectionChange('students')} active={activeSection === 'students'} />
                            <SidebarItem id="attendance" label="Attendance" icon={CheckSquareIcon} onClick={() => handleSectionChange('attendance')} active={activeSection === 'attendance'} />
                            <SidebarItem id="assignments" label="Assignments" icon={ClipboardListIcon} onClick={() => handleSectionChange('assignments')} active={activeSection === 'assignments'} />
                            
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Community</p>
                            <SidebarItem id="notices" label="Notices" icon={MegaphoneIcon} onClick={() => handleSectionChange('notices')} active={activeSection === 'notices'} />
                            
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Personal</p>
                            <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => handleSectionChange('settings')} active={activeSection === 'settings'} />
                        </div>
                    </div>
                </aside>
                
                {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-32 lg:pb-8 md:px-10 lg:px-12 bg-background/50">
                    {activeSection === 'dashboard' && (
                        <DashboardHome 
                            currentUser={currentUser} 
                            myCourses={myCourses} 
                            pendingAttendanceCount={pendingAttendanceCount} 
                            totalAssignments={totalAssignments} 
                            totalStudents={totalStudents} 
                        />
                    )}
                    {activeSection === 'classes' && (
                        <ClassesView 
                            myCourses={myCourses} 
                            setIsAddCourseModalOpen={setIsAddCourseModalOpen} 
                            onNavigate={onNavigate} 
                        />
                    )}
                    {activeSection === 'students' && (
                        <StudentProgressView 
                            myCourses={myCourses} 
                            users={users} 
                            setIsCreateStudentModalOpen={setIsCreateStudentModalOpen} 
                        />
                    )}
                    {activeSection === 'attendance' && (
                        <AttendanceSelectionView 
                            myCourses={myCourses} 
                            onNavigate={onNavigate} 
                        />
                    )}
                    
                    {['assignments', 'notices', 'settings'].includes(activeSection) && (
                         <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                            <div className="p-6 bg-card rounded-full shadow-sm border border-border mb-4">
                                <SettingsIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h2>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                {activeSection === 'notices' ? 'Use the Notice Board page to post announcements.' : 'Please select a specific course from "My Classes" to manage this.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isAddCourseModalOpen && <CreateCourseModal onClose={() => setIsAddCourseModalOpen(false)} onAddCourse={onCreateCourse} departmentOptions={collegeDepartments} />}
            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} departmentOptions={collegeDepartments} availableYears={allCollegeYears} />}
            {isCreateStudentModalOpen && <CreateStudentAccountModal isOpen={isCreateStudentModalOpen} onClose={() => setIsCreateStudentModalOpen(false)} department={currentUser.department} onCreateUser={onCreateUser} availableYears={myDepartmentYears} />}
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

const AcademicsPage: React.FC<AcademicsPageProps> = (props) => {
    return props.currentUser.tag === 'Student' 
        ? <StudentAcademicsDashboard {...props} /> 
        : <FacultyAcademicsDashboard {...props} />;
};

export default AcademicsPage;
