
import React, { useState, useMemo } from 'react';
import { User, Course, Notice, DepartmentChat, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { 
    BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, 
    MessageIcon, UsersIcon, CheckSquareIcon, 
    UserPlusIcon, ClockIcon, BuildingIcon, ChartPieIcon, ChartBarIcon,
    FileTextIcon, CheckCircleIcon, SettingsIcon, MenuIcon, TrendingUpIcon, ClipboardListIcon, ArrowLeftIcon, EditIcon,
    TrashIcon
} from '../components/Icons';
import AddTeachersCsvModal from '../components/AddTeachersCsvModal';
import AddStudentsCsvModal from '../components/AddStudentsCsvModal';

interface HodPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  courses: Course[];
  onCreateCourse: (courseData: Omit<Course, 'id' | 'facultyId'>) => void;
  onUpdateCourse: (courseId: string, data: any) => void;
  notices: Notice[];
  users: { [key: string]: User };
  allUsers: User[];
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
  departmentChats: DepartmentChat[];
  onSendDepartmentMessage: (department: string, channel: string, text: string) => void;
  onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
  onCreateUsersBatch: (usersData: Omit<User, 'id'>[]) => Promise<{ successCount: number; errors: { email: string; reason: string }[] }>;
  onApproveTeacherRequest: (teacherId: string) => void;
  onDeclineTeacherRequest: (teacherId: string) => void;
  colleges: College[];
  onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
  onUpdateCollegeClasses: (collegeId: string, department: string, classes: { [year: number]: string[] }) => void;
}

const SidebarItem: React.FC<{ id: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean }> = ({ id, label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
        {active && <ArrowRightIcon className="w-4 h-4 ml-auto opacity-50" />}
    </button>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ElementType; colorClass: string; trend?: 'up' | 'down' }> = ({ label, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
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

const DashboardHome: React.FC<{
    stats: any,
    quickActions: { label: string, icon: React.ElementType, onClick: () => void }[]
}> = ({ stats, quickActions }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Total Students" value={stats.students} icon={UsersIcon} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" trend="up"/>
            <StatCard label="Total Teachers" value={stats.teachers} icon={UserPlusIcon} colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"/>
            <StatCard label="Total Classes" value={stats.classes} icon={BuildingIcon} colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"/>
            <StatCard label="Attendance" value={`${stats.attendance}%`} icon={CheckSquareIcon} colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" trend={stats.attendance > 75 ? 'up' : 'down'}/>
            <StatCard label="Pending" value={stats.pending} icon={ClockIcon} colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"/>
        </div>

        <div>
             <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                 {quickActions.map((action, idx) => (
                     <button key={idx} onClick={action.onClick} className="flex flex-col items-center justify-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group">
                         <div className="p-3 bg-primary/10 text-primary rounded-full mb-2 group-hover:scale-110 transition-transform">
                             <action.icon className="w-6 h-6" />
                         </div>
                         <span className="text-sm font-semibold text-foreground">{action.label}</span>
                     </button>
                 ))}
             </div>
        </div>
    </div>
);

const HodPage: React.FC<HodPageProps> = (props) => {
    const { currentUser, allUsers, courses, onNavigate, onCreateCourse, onCreateUser, onApproveTeacherRequest, onDeclineTeacherRequest, currentPath, onCreateUsersBatch, onUpdateCourseFaculty, colleges, onUpdateCollegeClasses, onCreateNotice, onDeleteNotice, onUpdateCourse } = props;
    
    const [activeSection, setActiveSection] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isStudentCsvModalOpen, setIsStudentCsvModalOpen] = useState(false);

    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };

    const college = colleges.find(c => c.id === currentUser.collegeId);
    const myDept = currentUser.department;

    const deptStudents = allUsers.filter(u => u.tag === 'Student' && u.department === myDept);
    const deptTeachers = allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && u.department === myDept);
    
    // Only show in pending if they have registered (signed up) but are not approved
    const pendingTeachers = deptTeachers.filter(u => !u.isApproved && u.isRegistered);
    const pendingStudents = deptStudents.filter(u => !u.isApproved && u.isRegistered);
    
    const stats = {
        students: deptStudents.length,
        teachers: deptTeachers.length,
        classes: 0, // simplified
        attendance: 85, 
        pending: pendingTeachers.length + pendingStudents.length
    };
    
    const quickActions = [
        { label: 'Add Student', icon: UserPlusIcon, onClick: () => setIsStudentCsvModalOpen(true) },
        { label: 'Add Teacher', icon: UserPlusIcon, onClick: () => setIsCsvModalOpen(true) },
        { label: 'Create Class', icon: BuildingIcon, onClick: () => alert("Please use the sidebar for full class management") },
        { label: 'Assign Faculty', icon: UsersIcon, onClick: () => setActiveSection('teachers') },
        { label: 'Post Notice', icon: MegaphoneIcon, onClick: () => alert("Feature in Notice Board") },
    ];

    return (
        <div className="bg-background min-h-screen flex flex-col">
             <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
             
             <div className="md:hidden bg-card border-b border-border p-4 flex justify-between items-center sticky top-16 z-30">
                <span className="font-bold text-lg capitalize text-foreground">{activeSection.replace('_', ' ')}</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-foreground"><MenuIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden w-full relative">
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full overflow-y-auto">
                         <div className="flex justify-between items-center mb-6 md:hidden">
                            <h2 className="text-xl font-bold text-foreground">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-1">
                            <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => {setActiveSection('dashboard'); setMobileMenuOpen(false);}} active={activeSection === 'dashboard'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Management</div>
                            <SidebarItem id="students" label="Student Management" icon={UsersIcon} onClick={() => {setActiveSection('students'); setMobileMenuOpen(false);}} active={activeSection === 'students'} />
                            <SidebarItem id="teachers" label="Faculty Management" icon={UserPlusIcon} onClick={() => {setActiveSection('teachers'); setMobileMenuOpen(false);}} active={activeSection === 'teachers'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Academics</div>
                            <SidebarItem id="academics" label="Academics & Courses" icon={BookOpenIcon} onClick={() => {setActiveSection('academics'); setMobileMenuOpen(false);}} active={activeSection === 'academics'} />
                            <SidebarItem id="reports" label="Department Reports" icon={FileTextIcon} onClick={() => {setActiveSection('reports'); setMobileMenuOpen(false);}} active={activeSection === 'reports'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">System</div>
                            <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => {setActiveSection('settings'); setMobileMenuOpen(false);}} active={activeSection === 'settings'} />
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)] bg-muted/10 pb-32 lg:pb-8">
                    {activeSection === 'dashboard' && <DashboardHome stats={stats} quickActions={quickActions} />}
                    
                    {activeSection === 'students' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between">
                                <h2 className="text-2xl font-bold text-foreground">Students</h2>
                                <button onClick={() => setIsStudentCsvModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold text-sm">Import CSV</button>
                            </div>
                            <div className="bg-card rounded-xl border border-border p-4">
                                {deptStudents.length > 0 ? (
                                    <ul className="space-y-2">
                                        {deptStudents.map(s => <li key={s.id} className="p-2 border-b border-border last:border-0">{s.name} - {s.email}</li>)}
                                    </ul>
                                ) : <p className="text-muted-foreground">No students found.</p>}
                            </div>
                        </div>
                    )}

                    {activeSection === 'teachers' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between">
                                <h2 className="text-2xl font-bold text-foreground">Faculty</h2>
                                <button onClick={() => setIsCsvModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold text-sm">Import CSV</button>
                            </div>
                            <div className="bg-card rounded-xl border border-border p-4">
                                {deptTeachers.length > 0 ? (
                                    <ul className="space-y-2">
                                        {deptTeachers.map(t => <li key={t.id} className="p-2 border-b border-border last:border-0">{t.name} - {t.email}</li>)}
                                    </ul>
                                ) : <p className="text-muted-foreground">No faculty found.</p>}
                            </div>
                        </div>
                    )}

                    {['academics', 'reports', 'settings'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <SettingsIcon className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-bold text-foreground">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h3>
                            <p className="text-muted-foreground">This module is under development.</p>
                        </div>
                    )}
                </main>
            </div>
            
            <AddTeachersCsvModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} department={myDept} onCreateUsersBatch={onCreateUsersBatch} />
            <AddStudentsCsvModal isOpen={isStudentCsvModalOpen} onClose={() => setIsStudentCsvModalOpen(false)} department={myDept} onCreateUsersBatch={onCreateUsersBatch} />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HodPage;
