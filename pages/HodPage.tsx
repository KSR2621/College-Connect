
import React, { useState, useMemo, useEffect } from 'react';
import { User, Course, Notice, College, UserTag } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import CreateSingleUserModal from '../components/CreateSingleUserModal';
import AddStudentsCsvModal from '../components/AddStudentsCsvModal';
import AddTeachersCsvModal from '../components/AddTeachersCsvModal';
import { auth } from '../firebase';
import { 
    ChartPieIcon, UsersIcon, BookOpenIcon, MegaphoneIcon, ChartBarIcon, 
    SettingsIcon, PlusIcon, SearchIcon, FilterIcon, TrashIcon, 
    CheckCircleIcon, AlertTriangleIcon, ClockIcon, ArrowRightIcon,
    MenuIcon, CloseIcon, ChevronRightIcon, ChevronDownIcon, FileTextIcon,
    UserPlusIcon, EditIcon, LogOutIcon
} from '../components/Icons';

interface HodPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  courses: Course[];
  onCreateCourse: (courseData: Omit<Course, 'id'>) => void;
  onUpdateCourse: (courseId: string, data: any) => void;
  onDeleteCourse: (courseId: string) => void;
  notices: Notice[];
  users: { [key: string]: User };
  allUsers: User[];
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
  departmentChats: any[];
  onSendDepartmentMessage: (department: string, channel: string, text: string) => void;
  onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
  onCreateUsersBatch: (usersData: Omit<User, 'id'>[]) => Promise<{ successCount: number; errors: any[] }>;
  onApproveTeacherRequest: (teacherId: string) => void;
  onDeclineTeacherRequest: (teacherId: string) => void;
  colleges: College[];
  onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
  onUpdateCollegeClasses: (collegeId: string, department: string, classes: any) => void;
  onDeleteUser: (userId: string) => void;
  onToggleFreezeUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, updateData: { tag: UserTag, department: string }) => void;
}

const SidebarItem = ({ id, label, icon: Icon, onClick, active }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
        {active && <ChevronRightIcon className="w-4 h-4 ml-auto opacity-50" />}
    </button>
);

const StatCard = ({ label, value, icon: Icon, colorClass, subText }: any) => (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-extrabold text-card-foreground">{value}</p>
                {subText && <p className="text-xs text-muted-foreground">{subText}</p>}
            </div>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const CreateClassModal = ({ onClose, onCreateClass }: any) => {
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(year && division) {
            onCreateClass({ year: parseInt(year), division });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Create New Class</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Year / Standard</label>
                        <input type="number" min="1" max="5" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. 2" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Division</label>
                        <input type="text" value={division} onChange={e => setDivision(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. A" required/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Create Class</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddSubjectModal = ({ onClose, onAddSubject, year, division, faculty }: any) => {
    const [subjectName, setSubjectName] = useState('');
    const [facultyId, setFacultyId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(subjectName) {
            onAddSubject({ subject: subjectName, facultyId, year, division });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Add Subject to Class {year}-{division}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Subject Name</label>
                        <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" placeholder="e.g. Mathematics" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Assign Faculty (Optional)</label>
                        <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            <option value="">Select Faculty</option>
                            {faculty.map((f: User) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} {f.tag !== 'Teacher' ? `(${f.tag === 'HOD/Dean' ? 'HOD' : f.tag})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Add Subject</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditSubjectModal = ({ onClose, onUpdate, course, faculty }: any) => {
    const [subjectName, setSubjectName] = useState(course.subject);
    const [facultyId, setFacultyId] = useState(course.facultyId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(subjectName) {
            onUpdate(course.id, { subject: subjectName, facultyId });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Subject Name</label>
                        <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground">Assign Faculty</label>
                        <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1">
                            <option value="">Unassigned</option>
                            {faculty.map((f: User) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} {f.tag !== 'Teacher' ? `(${f.tag === 'HOD/Dean' ? 'HOD' : f.tag})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateNoticeModal = ({ onClose, onCreateNotice }: any) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateNotice({ title, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-xl shadow-xl w-full max-w-md border border-border">
                <h2 className="text-xl font-bold mb-4">Create Department Notice</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-2 border border-border rounded bg-input text-foreground" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <textarea className="w-full p-2 border border-border rounded bg-input text-foreground" placeholder="Content" value={content} onChange={e => setContent(e.target.value)} required rows={4} />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground font-bold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Post</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DashboardHome = ({ stats, recentActivity, alerts }: any) => (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Students" value={stats.studentCount} icon={UsersIcon} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
            <StatCard label="Total Faculty" value={stats.facultyCount} icon={UserPlusIcon} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
            <StatCard label="Active Classes" value={stats.classCount} icon={BookOpenIcon} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
            <StatCard label="Avg Attendance" value={`${stats.avgAttendance}%`} icon={ChartPieIcon} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-muted-foreground"/> Recent Activity</h3>
                <div className="space-y-4">
                    {recentActivity.map((act: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                            <div className={`p-2 rounded-full ${act.type === 'notice' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {act.type === 'notice' ? <MegaphoneIcon className="w-4 h-4"/> : <BookOpenIcon className="w-4 h-4"/>}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{act.title}</p>
                                <p className="text-xs text-muted-foreground">{act.time}</p>
                            </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && <p className="text-muted-foreground text-sm">No recent activity.</p>}
                </div>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5 text-red-500"/> Alerts</h3>
                <div className="space-y-3">
                    {alerts.map((alert: any, i: number) => (
                        <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg text-sm text-red-800 dark:text-red-300">
                            {alert}
                        </div>
                    ))}
                    {alerts.length === 0 && <p className="text-muted-foreground text-sm">No alerts. Good job!</p>}
                </div>
            </div>
        </div>
    </div>
);

const UserDirectory = ({ 
    users, 
    type, 
    onCreateUser, 
    onCreateUsersBatch, 
    department, 
    activeCourses 
}: { 
    users: User[], 
    type: 'Student' | 'Teacher', 
    onCreateUser: any, 
    onCreateUsersBatch: any, 
    department: string,
    activeCourses: Course[] 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeYears = useMemo(() => {
        const years = new Set<number>();
        activeCourses.forEach(c => years.add(c.year));
        return Array.from(years).sort((a, b) => a - b);
    }, [activeCourses]);

    const groupedStudents = useMemo(() => {
        if (type !== 'Student') return {};
        const groups: { [key: number]: User[] } = {};
        
        activeYears.forEach(y => groups[y] = []);
        groups[0] = []; 

        filteredUsers.forEach(u => {
            const y = u.yearOfStudy || 0;
            if (!groups[y]) groups[y] = [];
            groups[y].push(u);
        });

        Object.keys(groups).forEach(key => {
            groups[parseInt(key)].sort((a, b) => {
                const rollA = parseInt(a.rollNo || '0') || 0;
                const rollB = parseInt(b.rollNo || '0') || 0;
                return rollA - rollB;
            });
        });

        return groups;
    }, [filteredUsers, type, activeYears]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder={`Search ${type}s...`} 
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 sm:flex-none bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <FileTextIcon className="w-4 h-4"/> Bulk Upload
                    </button>
                    <button onClick={() => setIsSingleModalOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                        <PlusIcon className="w-4 h-4"/> Add {type}
                    </button>
                </div>
            </div>

            {type === 'Student' ? (
                <div className="space-y-8">
                    {activeYears.length === 0 && groupedStudents[0]?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                            No students or classes found. Create classes first to group students.
                        </div>
                    )}
                    
                    {activeYears.map(year => (
                        <div key={year} className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="bg-muted/30 px-6 py-3 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-foreground">Year {year}</h3>
                                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    {groupedStudents[year]?.length || 0} Students
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/10 text-muted-foreground font-semibold border-b border-border">
                                        <tr>
                                            <th className="p-4 w-24">Roll No</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Division</th>
                                            <th className="p-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {groupedStudents[year]?.map((user: User) => (
                                            <tr key={user.id} className="hover:bg-muted/20">
                                                <td className="p-4 font-mono text-xs">{user.rollNo || '-'}</td>
                                                <td className="p-4 flex items-center gap-3">
                                                    <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                    <span className="font-medium">{user.name}</span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{user.email}</td>
                                                <td className="p-4">{user.division || '-'}</td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {user.isFrozen ? 'Suspended' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!groupedStudents[year] || groupedStudents[year].length === 0) && (
                                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No students in this year yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    
                    {/* Unassigned Students */}
                    {groupedStudents[0]?.length > 0 && (
                        <div className="bg-card rounded-xl border border-border overflow-hidden mt-8">
                            <div className="bg-muted/30 px-6 py-3 border-b border-border">
                                <h3 className="font-bold text-foreground">Unassigned / Other</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-border">
                                    {groupedStudents[0].map((user: User) => (
                                        <tr key={user.id} className="hover:bg-muted/20">
                                            <td className="p-4 font-mono text-xs">{user.rollNo || '-'}</td>
                                            <td className="p-4 flex items-center gap-3">
                                                <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                <span className="font-medium">{user.name}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4">{user.division || '-'}</td>
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.isFrozen ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Assigned Classes</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(user => {
                                const assignedCourses = activeCourses.filter(c => c.facultyId === user.id);
                                const isExpanded = expandedFacultyId === user.id;
                                return (
                                    <React.Fragment key={user.id}>
                                        <tr className={`hover:bg-muted/20 cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`} onClick={() => setExpandedFacultyId(isExpanded ? null : user.id)}>
                                            <td className="p-4 flex items-center gap-3">
                                                <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                <span className="font-semibold">{user.name}</span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4">
                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                                                    {assignedCourses.length} Courses
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <ChevronDownIcon className={`w-4 h-4 inline-block transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-muted/5">
                                                <td colSpan={4} className="p-4">
                                                    <div className="pl-12">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Teaching Schedule</p>
                                                        {assignedCourses.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {assignedCourses.map(c => (
                                                                    <div key={c.id} className="bg-card border border-border p-2 rounded-lg text-xs flex justify-between">
                                                                        <span className="font-bold">{c.subject}</span>
                                                                        <span className="text-muted-foreground">Class {c.year}-{c.division}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No active courses assigned.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isSingleModalOpen && <CreateSingleUserModal isOpen={isSingleModalOpen} onClose={() => setIsSingleModalOpen(false)} department={department} role={type} onCreateUser={onCreateUser} />}
            {isBulkModalOpen && type === 'Student' && <AddStudentsCsvModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} department={department} onCreateUsersBatch={onCreateUsersBatch} />}
            {isBulkModalOpen && type === 'Teacher' && <AddTeachersCsvModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} department={department} onCreateUsersBatch={onCreateUsersBatch} />}
        </div>
    );
};

const AcademicsView = ({ 
    activeClasses, 
    deptCourses, 
    deptStudents,
    onCreateClass, 
    onAddSubject, 
    onDeleteCourse, 
    faculty,
    onUpdateCourse
}: any) => {
    const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
    const [yearFilter, setYearFilter] = useState<number | 'All'>('All');
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const filteredClasses = yearFilter === 'All' 
        ? activeClasses 
        : activeClasses.filter((cls: any) => cls.year === yearFilter);

    if (selectedClass) {
        const classCourses = deptCourses.filter((c: Course) => c.year === selectedClass.year && c.division === selectedClass.division);
        
        const classStudents = deptStudents.filter((s: User) => s.yearOfStudy === selectedClass.year && s.division === selectedClass.division)
            .sort((a: User, b: User) => (parseInt(a.rollNo || '0') || 0) - (parseInt(b.rollNo || '0') || 0));

        return (
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedClass(null)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRightIcon className="w-5 h-5 rotate-180"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Class {selectedClass.year}-{selectedClass.division}</h2>
                        <p className="text-sm text-muted-foreground">{classCourses.length} Subjects • {classStudents.length} Students</p>
                    </div>
                    <button 
                        onClick={() => setIsAddSubjectModalOpen(true)} 
                        className="ml-auto bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90"
                    >
                        <PlusIcon className="w-4 h-4"/> Add Subject
                    </button>
                </div>

                {/* Subjects Grid */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-blue-500"/> Subjects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classCourses.map((course: Course) => {
                            const assignedFaculty = faculty.find((f: User) => f.id === course.facultyId);
                            return (
                                <div key={course.id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-foreground">{course.subject}</h4>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingCourse(course)} className="text-muted-foreground hover:text-primary p-1">
                                                <EditIcon className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => { if(window.confirm('Delete this subject?')) onDeleteCourse(course.id) }} className="text-muted-foreground hover:text-destructive p-1">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-border">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Faculty</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {assignedFaculty ? (
                                                <>
                                                    <Avatar src={assignedFaculty.avatarUrl} name={assignedFaculty.name} size="xs"/>
                                                    <span className="text-sm font-medium">{assignedFaculty.name} {assignedFaculty.tag !== 'Teacher' ? `(${assignedFaculty.tag === 'HOD/Dean' ? 'HOD' : assignedFaculty.tag})` : ''}</span>
                                                </>
                                            ) : <span className="text-sm text-muted-foreground italic">Unassigned</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {classCourses.length === 0 && (
                            <div className="col-span-full text-center py-8 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                                No subjects added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Students List */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-emerald-500"/>
                        <h3 className="font-bold text-lg text-foreground">Students ({classStudents.length})</h3>
                    </div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground font-bold border-b border-border">
                                <tr>
                                    <th className="p-4 w-24">Roll No</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {classStudents.map((s: User) => (
                                    <tr key={s.id} className="hover:bg-muted/10">
                                        <td className="p-4 font-mono">{s.rollNo || '-'}</td>
                                        <td className="p-4 flex items-center gap-3">
                                            <Avatar src={s.avatarUrl} name={s.name} size="sm"/>
                                            <span className="font-medium">{s.name}</span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{s.email}</td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${s.isFrozen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {s.isFrozen ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {classStudents.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No students assigned to this class div.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isAddSubjectModalOpen && <AddSubjectModal onClose={() => setIsAddSubjectModalOpen(false)} onAddSubject={onAddSubject} year={selectedClass.year} division={selectedClass.division} faculty={faculty} />}
                {editingCourse && <EditSubjectModal onClose={() => setEditingCourse(null)} onUpdate={onUpdateCourse} course={editingCourse} faculty={faculty} />}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-foreground">Class Management</h2>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="All">All Years</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => setIsCreateClassModalOpen(true)} 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="w-4 h-4"/> Create Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls: any, idx: number) => {
                    const studentCount = deptStudents.filter((s: User) => s.yearOfStudy === cls.year && s.division === cls.division).length;
                    const subjectCount = deptCourses.filter((c: Course) => c.year === cls.year && c.division === cls.division).length;

                    return (
                        <div 
                            key={`${cls.year}-${cls.division}-${idx}`} 
                            className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                            onClick={() => setSelectedClass(cls)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <BookOpenIcon className="w-6 h-6"/>
                                </div>
                                <div className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                                    {subjectCount} Subjects
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Class {cls.year}-{cls.division}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{studentCount} Students Enrolled</p>
                            
                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-xs font-bold text-primary group-hover:underline">Manage Subjects & Students</span>
                                <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                            </div>
                        </div>
                    )
                })}
                {filteredClasses.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border border-dashed">
                        <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                        <p className="text-lg font-medium">No classes found.</p>
                        <p className="text-sm">Create a class to start managing subjects.</p>
                    </div>
                )}
            </div>

            {isCreateClassModalOpen && <CreateClassModal onClose={() => setIsCreateClassModalOpen(false)} onCreateClass={onCreateClass} />}
        </div>
    );
};

const HodPage: React.FC<HodPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, courses, onCreateCourse, notices, users, allUsers, onCreateNotice, onDeleteNotice, onCreateUser, onCreateUsersBatch, onUpdateCourseFaculty, colleges, onUpdateCollegeClasses, onDeleteCourse, onUpdateCourse } = props;
    
    const [activeSection, setActiveSection] = useState<'dashboard' | 'academics' | 'faculty' | 'students' | 'timetable' | 'notices' | 'approvals'>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Hooks moved to top
    const college = useMemo(() => colleges.find(c => c.id === currentUser.collegeId), [colleges, currentUser.collegeId]);
    const myDept = currentUser.department;

    const deptCourses = useMemo(() => {
        if (!college) return [];
        return courses.filter(c => c.department === myDept && c.collegeId === college.id);
    }, [courses, myDept, college]);

    const deptFaculty = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u => u.tag === 'Teacher' && u.department === myDept && u.collegeId === college.id);
    }, [allUsers, myDept, college]);

    const deptStudents = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u => u.tag === 'Student' && u.department === myDept && u.collegeId === college.id);
    }, [allUsers, myDept, college]);

    const teachingStaff = useMemo(() => {
        if (!college) return [];
        return allUsers.filter(u => 
            u.collegeId === college.id && (
                (u.tag === 'Teacher' && u.department === myDept) ||
                (u.tag === 'HOD/Dean' && u.department === myDept) ||
                (u.tag === 'Director')
            )
        );
    }, [allUsers, college, myDept]);

    const activeClasses = useMemo(() => {
        if (!college) return [];
        const deptClassesRaw = college.classes?.[myDept] || {};
        const classes: { year: number; division: string }[] = [];
        Object.entries(deptClassesRaw).forEach(([year, divs]) => {
            (divs as string[]).forEach(div => classes.push({ year: parseInt(year), division: div }));
        });
        return classes;
    }, [college, myDept]);

    const stats = {
        studentCount: deptStudents.length,
        facultyCount: deptFaculty.length,
        classCount: activeClasses.length,
        avgAttendance: 85 // Placeholder
    };

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleCreateClass = (data: { year: number; division: string }) => {
        if (!college) return;
        const currentClasses = college.classes?.[myDept] || {};
        const yearClasses = currentClasses[data.year] || [];
        if (!yearClasses.includes(data.division)) {
            const updatedClasses = {
                ...currentClasses,
                [data.year]: [...yearClasses, data.division].sort()
            };
            onUpdateCollegeClasses(college.id, myDept, updatedClasses);
        } else {
            alert("Class already exists!");
        }
    };

    const handleAddSubject = (data: { subject: string; facultyId: string; year: number; division: string }) => {
        if (!college) return;
        onCreateCourse({
            subject: data.subject,
            department: myDept,
            year: data.year,
            division: data.division,
            collegeId: college.id,
            facultyId: data.facultyId || '' 
        });
    };

    // Timeout for loading
    useEffect(() => {
        if (currentUser.collegeId && !college) {
            const timer = setTimeout(() => setLoadingTimeout(true), 8000); // 8 seconds timeout
            return () => clearTimeout(timer);
        } else {
            setLoadingTimeout(false);
        }
    }, [college, currentUser.collegeId]);

    // --- Render Logic ---

    if (!currentUser.collegeId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-destructive/30 p-10 max-w-md text-center">
                    <AlertTriangleIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Account Configuration Error</h1>
                    <p className="text-muted-foreground mb-6">
                        Your account is not associated with any college. This usually happens if the invite was not set up correctly.
                    </p>
                    <button onClick={handleLogout} className="w-full py-3 font-bold text-primary-foreground bg-destructive rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2">
                        <LogOutIcon className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (currentUser.isApproved === false) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-10 max-w-lg text-center">
                    <ClockIcon className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-bold text-foreground mb-4">Approval Pending</h1>
                    <p className="text-muted-foreground mb-8">Your HOD account is currently under review by the Director. You will receive access once approved.</p>
                    <button onClick={handleLogout} className="w-full py-3 font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">Sign Out</button>
                </div>
            </div>
        );
    }

    if (!college) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                {loadingTimeout ? (
                    <div className="bg-card p-8 rounded-2xl border border-border shadow-lg text-center max-w-md">
                        <AlertTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold text-foreground mb-2">College Data Not Found</h3>
                        <p className="text-muted-foreground mb-6">
                            We couldn't load your college data. This might be due to a network issue or if the college has been deleted.
                        </p>
                        <button onClick={handleLogout} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
                        <p className="text-muted-foreground font-medium">Loading dashboard resources...</p>
                        <button onClick={handleLogout} className="text-sm text-primary hover:underline font-bold mt-4">
                            Taking too long? Sign Out
                        </button>
                    </>
                )}
            </div>
        );
    }

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
                            <SidebarItem id="academics" label="Academics & Classes" icon={BookOpenIcon} onClick={() => {setActiveSection('academics'); setMobileMenuOpen(false);}} active={activeSection === 'academics'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">People</div>
                            <SidebarItem id="faculty" label="Faculty" icon={UserPlusIcon} onClick={() => {setActiveSection('faculty'); setMobileMenuOpen(false);}} active={activeSection === 'faculty'} />
                            <SidebarItem id="students" label="Students" icon={UsersIcon} onClick={() => {setActiveSection('students'); setMobileMenuOpen(false);}} active={activeSection === 'students'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Communication</div>
                            <SidebarItem id="notices" label="Notices" icon={MegaphoneIcon} onClick={() => {setActiveSection('notices'); setMobileMenuOpen(false);}} active={activeSection === 'notices'} />
                        </div>
                    </div>
                </aside>
                
                {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)] bg-muted/10 pb-32 lg:pb-8">
                    
                    {activeSection === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-black text-foreground mb-1">{myDept}</h1>
                                    <p className="text-muted-foreground font-medium">Department Overview</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-primary">{college.name}</p>
                                </div>
                            </div>

                            <DashboardHome stats={stats} recentActivity={[]} alerts={[]} />
                        </div>
                    )}

                    {activeSection === 'academics' && (
                        <AcademicsView 
                            activeClasses={activeClasses} 
                            deptCourses={deptCourses} 
                            deptStudents={deptStudents}
                            onCreateClass={handleCreateClass}
                            onAddSubject={handleAddSubject}
                            onDeleteCourse={onDeleteCourse}
                            faculty={teachingStaff}
                            onUpdateCourse={onUpdateCourse}
                        />
                    )}

                    {activeSection === 'faculty' && (
                        <UserDirectory 
                            type="Teacher" 
                            users={deptFaculty} 
                            onCreateUser={onCreateUser} 
                            onCreateUsersBatch={onCreateUsersBatch} 
                            department={myDept}
                            activeCourses={deptCourses}
                        />
                    )}

                    {activeSection === 'students' && (
                        <UserDirectory 
                            type="Student" 
                            users={deptStudents} 
                            onCreateUser={onCreateUser} 
                            onCreateUsersBatch={onCreateUsersBatch} 
                            department={myDept}
                            activeCourses={deptCourses}
                        />
                    )}

                    {activeSection === 'notices' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-foreground">Department Notices</h2>
                                <button onClick={() => setIsCreateNoticeModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                    <PlusIcon className="w-4 h-4"/> New Notice
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {notices.filter(n => !n.collegeId || n.collegeId === college.id).map(notice => ( // Basic filter, improve later
                                    <div key={notice.id} className="bg-card p-5 rounded-xl border border-border shadow-sm relative group">
                                        <button onClick={() => onDeleteNotice(notice.id)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                        <h3 className="font-bold text-lg text-foreground mb-2">{notice.title}</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{notice.content}</p>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3"/> {new Date(notice.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                                {notices.length === 0 && <p className="text-muted-foreground text-center py-8">No notices found.</p>}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} />}
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HodPage;
