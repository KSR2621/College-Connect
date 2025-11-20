
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Course, Notice, DepartmentChat, Message, AttendanceStatus, Feedback, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { 
    BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, 
    TrashIcon, MessageIcon, SendIcon, UsersIcon, CheckSquareIcon, StarIcon, 
    UserPlusIcon, ClockIcon, UploadIcon, BuildingIcon, ChartPieIcon, ChartBarIcon,
    FileTextIcon, CheckCircleIcon, SettingsIcon, MenuIcon, TrendingUpIcon, ClipboardListIcon
} from '../components/Icons';
import { yearOptions } from '../constants';
import AddTeachersCsvModal from '../components/AddTeachersCsvModal';
import AddStudentsCsvModal from '../components/AddStudentsCsvModal';

// --- PROPS ---
interface HodPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  courses: Course[];
  onCreateCourse: (courseData: Omit<Course, 'id' | 'facultyId'>) => void;
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

// --- HELPER COMPONENTS ---

const SidebarItem: React.FC<{ id: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean }> = ({ id, label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-text-muted hover:bg-white hover:text-primary'}`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
        {active && <ArrowRightIcon className="w-4 h-4 ml-auto opacity-50" />}
    </button>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ElementType; colorClass: string; trend?: 'up' | 'down' }> = ({ label, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-text-muted text-xs uppercase font-bold tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                {trend && (
                    <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
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

const SimpleLineChart: React.FC<{ data?: number[], color?: string }> = ({ data = [], color = "text-primary" }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-text-muted text-xs">Not enough data</div>;
    const max = Math.max(...data) || 100;
    const min = 0;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / (max - min || 1)) * 100;
        return `${x},${y}`;
    }).join(' ');
    return (
        <div className="relative h-32 w-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                 <polyline points={points} fill="none" stroke="currentColor" className={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                 {data.map((val, i) => {
                     const x = (i / (data.length - 1)) * 100;
                     const y = 100 - ((val - min) / (max - min || 1)) * 100;
                     return <circle key={i} cx={x} cy={y} r="3" className="fill-white stroke-current" strokeWidth="2" />
                 })}
            </svg>
        </div>
    );
}

const SimpleBarChart: React.FC<{ data: number[], labels?: string[], color?: string }> = ({ data, labels, color = 'bg-primary' }) => (
    <div className="flex items-end justify-between h-32 gap-2 pt-4 pb-6">
        {data.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                <div className="w-full bg-slate-100 rounded-t-sm relative h-full overflow-hidden">
                     <div className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-1000 ${color}`} style={{ height: `${Math.max(h, 5)}%` }}></div>
                </div>
                 <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity z-10 whitespace-nowrap">{h}</div>
                 {labels && <p className="text-[10px] text-text-muted text-center mt-1 truncate w-full" title={labels[i]}>{labels[i]}</p>}
            </div>
        ))}
    </div>
);


// --- SUB-VIEWS ---

const DashboardHome: React.FC<{
    stats: any,
    chartData: any,
    quickActions: { label: string, icon: React.ElementType, onClick: () => void }[]
}> = ({ stats, chartData, quickActions }) => (
    <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Total Students" value={stats.students} icon={UsersIcon} colorClass="bg-blue-100 text-blue-600" trend="up"/>
            <StatCard label="Total Teachers" value={stats.teachers} icon={UserPlusIcon} colorClass="bg-purple-100 text-purple-600"/>
            <StatCard label="Total Classes" value={stats.classes} icon={BuildingIcon} colorClass="bg-orange-100 text-orange-600"/>
            <StatCard label="Attendance Today" value={`${stats.attendance}%`} icon={CheckSquareIcon} colorClass="bg-emerald-100 text-emerald-600" trend={stats.attendance > 75 ? 'up' : 'down'}/>
            <StatCard label="Pending Requests" value={stats.pending} icon={ClockIcon} colorClass="bg-red-100 text-red-600"/>
        </div>

        {/* Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-primary"/> Student Attendance Trend</h3>
                <SimpleLineChart data={chartData.attendanceTrend} color="text-blue-500" />
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-primary"/> Teacher Workload Distribution</h3>
                <SimpleBarChart data={chartData.workload} labels={chartData.teacherNames} color="bg-purple-500" />
            </div>
        </div>

        {/* Quick Actions */}
        <div>
             <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                 {quickActions.map((action, idx) => (
                     <button key={idx} onClick={action.onClick} className="flex flex-col items-center justify-center p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group">
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

const StudentManagementView: React.FC<{
    students: User[];
    onAddStudent: () => void;
    onAddCsv: () => void;
}> = ({ students, onAddStudent, onAddCsv }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Student Management</h2>
            <div className="flex gap-2">
                <button onClick={onAddCsv} className="bg-white border border-border text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50">Import CSV</button>
                <button onClick={onAddStudent} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Add Student</button>
            </div>
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-border">
                    <tr>
                        <th className="p-4 font-semibold text-foreground">Name</th>
                        <th className="p-4 font-semibold text-foreground">Email</th>
                        <th className="p-4 font-semibold text-foreground">Year</th>
                        <th className="p-4 font-semibold text-foreground text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length > 0 ? students.map(student => (
                        <tr key={student.id} className="border-b border-border last:border-0 hover:bg-slate-50/50">
                            <td className="p-4 flex items-center gap-3">
                                <Avatar src={student.avatarUrl} name={student.name} size="sm" />
                                <span className="font-medium">{student.name}</span>
                            </td>
                            <td className="p-4 text-text-muted">{student.email}</td>
                            <td className="p-4 text-text-muted">Year {student.yearOfStudy}</td>
                            <td className="p-4 text-right">
                                {!student.isRegistered ? (
                                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Invited</span>
                                ) : (
                                    <button className="text-primary hover:underline font-medium">View Profile</button>
                                )}
                            </td>
                        </tr>
                    )) : <tr><td colSpan={4} className="p-8 text-center text-text-muted">No students found.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const TeacherManagementView: React.FC<{
    teachers: User[];
    onAddTeacher: () => void;
    onAddCsv: () => void;
    onAssign: () => void;
}> = ({ teachers, onAddTeacher, onAddCsv, onAssign }) => (
     <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Teacher Management</h2>
            <div className="flex gap-2">
                 <button onClick={onAssign} className="bg-white border border-border text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50">Assign Classes</button>
                 <button onClick={onAddCsv} className="bg-white border border-border text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50">Import CSV</button>
                <button onClick={onAddTeacher} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Add Teacher</button>
            </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {teachers.map(teacher => (
                 <div key={teacher.id} className="bg-white p-4 rounded-xl border border-border flex items-center gap-4">
                     <Avatar src={teacher.avatarUrl} name={teacher.name} size="lg" />
                     <div>
                         <h4 className="font-bold text-foreground">{teacher.name}</h4>
                         <p className="text-xs text-text-muted">{teacher.email}</p>
                         <div className="flex gap-2 mt-2">
                             <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Faculty</span>
                             {!teacher.isRegistered ? (
                                 <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded">Invited</span>
                             ) : !teacher.isApproved && (
                                 <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded">Pending</span>
                             )}
                         </div>
                     </div>
                 </div>
             ))}
             {teachers.length === 0 && <p className="col-span-3 text-center text-text-muted py-8">No teachers found.</p>}
         </div>
    </div>
);

const ClassManagementView: React.FC<{
    classes: { year: number; division: string }[];
    onAddClass: () => void;
    onCreateCourse: (prefilledYear?: number, prefilledDivision?: string) => void;
}> = ({ classes, onAddClass, onCreateCourse }) => (
     <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Class & Batch Management</h2>
            <button onClick={onAddClass} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Create Class</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map(({ year, division }, idx) => (
                 <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-xl font-bold text-foreground">{yearOptions.find(y => y.val === year)?.label || `${year}th Year`}</h4>
                            <p className="text-sm text-text-muted">Division {division}</p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UsersIcon className="w-5 h-5"/></div>
                    </div>
                    <button 
                        onClick={() => onCreateCourse(year, division)}
                        className="mt-6 text-sm font-semibold text-primary bg-primary/5 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <BookOpenIcon className="w-4 h-4"/> Assign Subjects
                    </button>
                </div>
            ))}
             {classes.length === 0 && <div className="col-span-4 text-center p-8 border-2 border-dashed border-border rounded-xl text-text-muted">No classes created yet.</div>}
        </div>
    </div>
);

const AttendanceManagementView: React.FC<{ courses: Course[] }> = ({ courses }) => {
    const today = new Date();
    const recentAttendance = courses.flatMap(c => c.attendanceRecords || []).filter(r => new Date(r.date).toDateString() === today.toDateString());
    
    return (
         <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground">Attendance Management</h2>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                 <h3 className="font-bold text-lg mb-4">Today's Attendance Overview</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-slate-50 rounded-lg border border-border">
                         <p className="text-xs text-text-muted uppercase font-bold">Classes Conducted</p>
                         <p className="text-2xl font-bold text-foreground mt-1">{recentAttendance.length}</p>
                     </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-border">
                         <p className="text-xs text-text-muted uppercase font-bold">Present Students</p>
                         <p className="text-2xl font-bold text-emerald-600 mt-1">
                             {recentAttendance.reduce((acc, r) => acc + Object.values(r.records).filter(s => (s as any).status === 'present').length, 0)}
                         </p>
                     </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-border">
                         <p className="text-xs text-text-muted uppercase font-bold">Absent Students</p>
                         <p className="text-2xl font-bold text-red-600 mt-1">
                             {recentAttendance.reduce((acc, r) => acc + Object.values(r.records).filter(s => (s as any).status === 'absent').length, 0)}
                         </p>
                     </div>
                 </div>
            </div>
             <p className="text-sm text-text-muted">To mark attendance, please navigate to the specific Course in 'Academics' or 'Class Management'.</p>
        </div>
    )
}

// --- MODALS (Reused/Wrapped) ---

const AddClassModal: React.FC<{ isOpen: boolean; onClose: () => void; college: College; department: string; onSave: (collegeId: string, department: string, classes: { [year: number]: string[] }) => void; }> = ({ isOpen, onClose, college, department, onSave }) => {
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');
    if (!isOpen) return null;
    const handleSave = () => {
        const yearNum = parseInt(year.trim(), 10);
        if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) return alert("Invalid year");
        const divisionUpper = division.trim().toUpperCase();
        if (!divisionUpper) return alert("Invalid division");
        const currentClasses = college.classes?.[department] || {};
        const yearDivisions = currentClasses[yearNum] || [];
        if (yearDivisions.includes(divisionUpper)) return alert("Division exists");
        onSave(college.id, department, { ...currentClasses, [yearNum]: [...yearDivisions, divisionUpper].sort() });
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm space-y-4">
                <h3 className="font-bold text-lg">Add Class</h3>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Year (1-4)" className="w-full p-2 border rounded" />
                <input type="text" value={division} onChange={e => setDivision(e.target.value)} placeholder="Division (e.g. A)" className="w-full p-2 border rounded" />
                <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 rounded hover:bg-slate-100">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded">Save</button></div>
            </div>
        </div>
    );
}

const AddUserModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    role: 'Student' | 'Teacher' | null; 
    department: string; 
    onCreateUser: (userData: Omit<User, 'id'>) => Promise<void>;
    availableYears?: number[];
}> = ({ isOpen, onClose, role, department, onCreateUser, availableYears = [] }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [year, setYear] = useState(availableYears[0] || 1);
    
    useEffect(() => {
        if (availableYears.length > 0) {
            setYear(availableYears[0]);
        }
    }, [availableYears]);

    if (!isOpen || !role) return null;
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        // Set isApproved to false and isRegistered to false for invite-based flow
        onCreateUser({ 
            name, 
            email, 
            department, 
            tag: role, 
            isApproved: false, 
            isRegistered: false,
            yearOfStudy: role === 'Student' ? year : undefined 
        }).then(onClose); 
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Add {role}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="w-full p-2 border rounded" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 border rounded" />
                    {role === 'Student' && (
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-2 border rounded">
                            {availableYears.length > 0 ? (
                                availableYears.map(y => <option key={y} value={y}>{yearOptions.find(opt => opt.val === y)?.label || `Year ${y}`}</option>)
                            ) : (
                                <option value="" disabled>No years configured</option>
                            )}
                        </select>
                    )}
                    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 hover:bg-slate-100 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded">Add</button></div>
                </form>
            </div>
        </div>
    )
}

const AssignFacultyModal: React.FC<{ isOpen: boolean; onClose: () => void; courses: Course[]; teachers: User[]; onSave: (courseId: string, newFacultyId: string) => void; }> = ({ isOpen, onClose, courses, teachers, onSave }) => {
    const [changes, setChanges] = useState<{[id:string]: string}>({});
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <h3 className="font-bold text-lg mb-4">Assign Faculty</h3>
                <div className="flex-1 overflow-y-auto space-y-3 p-1">
                    {courses.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-2 border rounded">
                            <div><p className="font-semibold">{c.subject}</p><p className="text-xs text-muted">{c.year}th Year</p></div>
                            <select value={changes[c.id] || c.facultyId} onChange={e => setChanges({...changes, [c.id]: e.target.value})} className="border rounded p-1 text-sm w-40">
                                <option value="">Unassigned</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4"><button onClick={onClose} className="px-4 py-2 hover:bg-slate-100 rounded">Cancel</button><button onClick={() => { Object.entries(changes).forEach(([c, f]) => onSave(c, f)); onClose(); }} className="px-4 py-2 bg-primary text-white rounded">Save Changes</button></div>
            </div>
        </div>
    )
}

const CreateCourseModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreateCourse: (course: any) => void; department: string; prefilledYear?: number; prefilledDivision?: string }> = ({ isOpen, onClose, onCreateCourse, department, prefilledYear, prefilledDivision }) => {
    const [subject, setSubject] = useState('');
    const [year, setYear] = useState(prefilledYear || 1);
    if (!isOpen) return null;
    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
             <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
                 <h3 className="font-bold text-lg">Add Subject/Course</h3>
                 <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject Name" className="w-full p-2 border rounded" />
                 <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} disabled={!!prefilledYear} className="w-full p-2 border rounded" placeholder="Year" />
                 <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 hover:bg-slate-100 rounded">Cancel</button><button onClick={() => { onCreateCourse({ subject, year, department, division: prefilledDivision }); onClose(); }} className="px-4 py-2 bg-primary text-white rounded">Create</button></div>
             </div>
         </div>
    )
}

// Reusing/Defining CreateNoticeModal for HOD page consistency
const CreateNoticeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
    departmentOptions: string[];
    availableYears: number[];
}> = ({ isOpen, onClose, onCreateNotice, departmentOptions, availableYears }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
    const [targetYears, setTargetYears] = useState<number[]>([]);
    const editorRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleInput = () => setContent(editorRef.current?.innerHTML || '');
    const applyStyle = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
    };

    const handleDeptToggle = (dept: string) => {
        setTargetDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    };
    const handleYearToggle = (year: number) => {
        setTargetYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
    };

    const handleSubmit = () => {
        if (!title.trim() || !editorRef.current?.innerText.trim()) {
            alert("Title and content cannot be empty.");
            return;
        }
        onCreateNotice({ title, content, targetDepartments, targetYears });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-full max-h-[90vh] border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Post Announcement</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice Title" className="w-full text-xl font-bold bg-transparent border-b border-border py-2 focus:outline-none focus:border-primary placeholder:text-muted-foreground text-foreground"/>
                    
                    <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
                        <div className="p-2 border-b border-border bg-muted/50 flex items-center gap-2">
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('bold'); }} className="font-bold w-8 h-8 rounded hover:bg-muted text-foreground">B</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('italic'); }} className="italic w-8 h-8 rounded hover:bg-muted text-foreground">I</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('insertUnorderedList'); }} className="w-8 h-8 rounded hover:bg-muted text-foreground">UL</button>
                        </div>
                        <div ref={editorRef} contentEditable onInput={handleInput} data-placeholder="Type your message..." className="w-full min-h-[200px] p-4 text-foreground bg-input focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"/>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase mb-3">Target Audience (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground mb-2 block">Departments</span>
                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {departmentOptions.map(dept => (
                                        <label key={dept} className="flex items-center space-x-2 cursor-pointer group">
                                            <input type="checkbox" checked={targetDepartments.includes(dept)} onChange={() => handleDeptToggle(dept)} className="h-4 w-4 rounded text-primary focus:ring-primary border-border bg-input"/>
                                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">{dept}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground mb-2 block">Years</span>
                                 <div className="space-y-2">
                                    {availableYears.map(year => (
                                        <label key={year} className="flex items-center space-x-2 cursor-pointer group">
                                            <input type="checkbox" checked={targetYears.includes(year)} onChange={() => handleYearToggle(year)} className="h-4 w-4 rounded text-primary focus:ring-primary border-border bg-input"/>
                                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                                {yearOptions.find(y => y.val === year)?.label || `Year ${year}`}
                                            </span>
                                        </label>
                                    ))}
                                    {availableYears.length === 0 && <p className="text-xs text-muted-foreground">No years configured.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 font-semibold text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform transform hover:scale-105">
                        Publish Notice
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN HOD PAGE ---

const HodPage: React.FC<HodPageProps> = (props) => {
    const { currentUser, allUsers, courses, onNavigate, onCreateCourse, onCreateUser, onApproveTeacherRequest, onDeclineTeacherRequest, currentPath, onCreateUsersBatch, onUpdateCourseFaculty, colleges, onUpdateCollegeClasses, onCreateNotice, onDeleteNotice } = props;
    
    const [activeSection, setActiveSection] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Modals State
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    const [isAssignFacultyModalOpen, setIsAssignFacultyModalOpen] = useState(false);
    const [addUserModalState, setAddUserModalState] = useState<{ isOpen: boolean; role: 'Student' | 'Teacher' | null }>({ isOpen: false, role: null });
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isStudentCsvModalOpen, setIsStudentCsvModalOpen] = useState(false);
    const [courseCreationContext, setCourseCreationContext] = useState<{ isOpen: boolean; prefilledYear?: number; prefilledDivision?: string }>({ isOpen: false });
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);

    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };
    const college = colleges.find(c => c.id === currentUser.collegeId);
    
    const collegeClasses = college?.classes || {};
    const myDept = currentUser.department;

    // Years available in this HOD's department
    const myDeptYears = useMemo(() => {
        if (!collegeClasses[myDept]) return [];
        return Object.keys(collegeClasses[myDept]).map(Number).sort((a, b) => a - b);
    }, [collegeClasses, myDept]);

    // All years available across college (for notices)
    const allCollegeYears = useMemo(() => {
        const yearsSet = new Set<number>();
        Object.values(collegeClasses).forEach(deptClasses => {
            Object.keys(deptClasses).forEach(y => yearsSet.add(Number(y)));
        });
        return Array.from(yearsSet).sort((a, b) => a - b);
    }, [collegeClasses]);

    const deptStudents = allUsers.filter(u => u.tag === 'Student' && u.department === myDept);
    const deptTeachers = allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && u.department === myDept);
    const deptCourses = courses.filter(c => c.department === myDept);
    // Only show in pending if they have registered (signed up) but are not approved
    const pendingTeachers = deptTeachers.filter(u => !u.isApproved && u.isRegistered);
    const pendingStudents = deptStudents.filter(u => !u.isApproved && u.isRegistered);
    
    const deptClasses = useMemo(() => {
        if (!college?.classes || !college.classes[myDept]) return [];
        const classes: { year: number; division: string }[] = [];
        for (const yearStr in college.classes[myDept]) {
            const year = parseInt(yearStr, 10);
            college.classes[myDept][year].forEach(division => classes.push({ year, division }));
        }
        return classes.sort((a, b) => a.year - b.year || a.division.localeCompare(b.division));
    }, [college, myDept]);

    // Stats Calculation
    const stats = {
        students: deptStudents.length,
        teachers: deptTeachers.length,
        classes: deptClasses.length,
        attendance: 85, // Placeholder real calculation logic needed
        pending: pendingTeachers.length + pendingStudents.length
    };
    
    const chartData = {
        attendanceTrend: [78, 82, 80, 85, 84, 88, 85], // Mock data
        workload: deptTeachers.slice(0, 5).map(t => courses.filter(c => c.facultyId === t.id).length * 20),
        teacherNames: deptTeachers.slice(0, 5).map(t => t.name)
    };

    const quickActions = [
        { label: 'Add Student', icon: UserPlusIcon, onClick: () => setAddUserModalState({ isOpen: true, role: 'Student' }) },
        { label: 'Add Teacher', icon: UserPlusIcon, onClick: () => setAddUserModalState({ isOpen: true, role: 'Teacher' }) },
        { label: 'Create Class', icon: BuildingIcon, onClick: () => setIsAddClassModalOpen(true) },
        { label: 'Assign Faculty', icon: UsersIcon, onClick: () => setIsAssignFacultyModalOpen(true) },
        { label: 'Post Notice', icon: MegaphoneIcon, onClick: () => setIsCreateNoticeModalOpen(true) },
    ];

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
             <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
             
             {/* Mobile Header */}
             <div className="md:hidden bg-white border-b border-border p-4 flex justify-between items-center sticky top-16 z-30">
                <span className="font-bold text-lg capitalize text-foreground">{activeSection.replace('_', ' ')}</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-muted text-foreground"><MenuIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden w-full relative">
                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full overflow-y-auto">
                         <div className="flex justify-between items-center mb-6 md:hidden">
                            <h2 className="text-xl font-bold">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-1">
                            <SidebarItem id="dashboard" label="Dashboard" icon={ChartPieIcon} onClick={() => {setActiveSection('dashboard'); setMobileMenuOpen(false);}} active={activeSection === 'dashboard'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-text-muted uppercase tracking-wider">Management</div>
                            <SidebarItem id="students" label="Student Management" icon={UsersIcon} onClick={() => {setActiveSection('students'); setMobileMenuOpen(false);}} active={activeSection === 'students'} />
                            <SidebarItem id="teachers" label="Faculty Management" icon={UserPlusIcon} onClick={() => {setActiveSection('teachers'); setMobileMenuOpen(false);}} active={activeSection === 'teachers'} />
                            <SidebarItem id="classes" label="Class & Batch" icon={BuildingIcon} onClick={() => {setActiveSection('classes'); setMobileMenuOpen(false);}} active={activeSection === 'classes'} />
                            <SidebarItem id="attendance" label="Attendance" icon={CheckSquareIcon} onClick={() => {setActiveSection('attendance'); setMobileMenuOpen(false);}} active={activeSection === 'attendance'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-text-muted uppercase tracking-wider">Academics</div>
                            <SidebarItem id="academics" label="Academics & Courses" icon={BookOpenIcon} onClick={() => {setActiveSection('academics'); setMobileMenuOpen(false);}} active={activeSection === 'academics'} />
                            <SidebarItem id="exams" label="Exams & Results" icon={ClipboardListIcon} onClick={() => {setActiveSection('exams'); setMobileMenuOpen(false);}} active={activeSection === 'exams'} />
                            <SidebarItem id="reports" label="Department Reports" icon={FileTextIcon} onClick={() => {setActiveSection('reports'); setMobileMenuOpen(false);}} active={activeSection === 'reports'} />
                            <div className="pt-4 pb-2 text-xs font-bold text-text-muted uppercase tracking-wider">System</div>
                            <SidebarItem id="approvals" label="Approvals" icon={CheckCircleIcon} onClick={() => {setActiveSection('approvals'); setMobileMenuOpen(false);}} active={activeSection === 'approvals'} />
                            <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => {setActiveSection('settings'); setMobileMenuOpen(false);}} active={activeSection === 'settings'} />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-112px)] md:h-[calc(100vh-64px)]">
                    {activeSection === 'dashboard' && <DashboardHome stats={stats} chartData={chartData} quickActions={quickActions} />}
                    {activeSection === 'students' && <StudentManagementView students={deptStudents} onAddStudent={() => setAddUserModalState({isOpen: true, role: 'Student'})} onAddCsv={() => setIsStudentCsvModalOpen(true)} />}
                    {activeSection === 'teachers' && <TeacherManagementView teachers={deptTeachers} onAddTeacher={() => setAddUserModalState({isOpen: true, role: 'Teacher'})} onAddCsv={() => setIsCsvModalOpen(true)} onAssign={() => setIsAssignFacultyModalOpen(true)} />}
                    {activeSection === 'classes' && <ClassManagementView classes={deptClasses} onAddClass={() => setIsAddClassModalOpen(true)} onCreateCourse={(y, d) => setCourseCreationContext({ isOpen: true, prefilledYear: y, prefilledDivision: d })} />}
                    {activeSection === 'attendance' && <AttendanceManagementView courses={deptCourses} />}
                    {activeSection === 'academics' && (
                         <div className="space-y-6 animate-fade-in">
                             <div className="flex justify-between">
                                 <h2 className="text-2xl font-bold">Academics</h2>
                                 <button onClick={() => setCourseCreationContext({isOpen: true})} className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Add Subject</button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {deptCourses.map(c => (
                                     <div key={c.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                         <h4 className="font-bold text-lg">{c.subject}</h4>
                                         <p className="text-sm text-muted">Year {c.year} {c.division ? `(Div ${c.division})` : ''}</p>
                                         <p className="text-xs mt-2 bg-slate-100 inline-block px-2 py-1 rounded">{deptTeachers.find(t => t.id === c.facultyId)?.name || 'Unassigned'}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                    {activeSection === 'approvals' && (
                        <div className="space-y-8 animate-fade-in">
                             <div className="flex items-center gap-3 mb-6">
                                 <div className="p-2 bg-primary/10 rounded-lg text-primary"><CheckCircleIcon className="w-6 h-6" /></div>
                                 <h2 className="text-2xl font-bold text-foreground">Pending Approvals</h2>
                             </div>

                             {/* Faculty Approvals */}
                             <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                                 <h3 className="text-lg font-bold text-foreground mb-4 flex justify-between items-center">
                                     Faculty Requests
                                     <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{pendingTeachers.length}</span>
                                 </h3>
                                 {pendingTeachers.length > 0 ? (
                                     <div className="grid grid-cols-1 gap-3">
                                         {pendingTeachers.map(t => (
                                             <div key={t.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 rounded-xl border border-border gap-4">
                                                 <div className="flex items-center gap-4 w-full sm:w-auto">
                                                     <Avatar src={t.avatarUrl} name={t.name} size="md" />
                                                     <div>
                                                         <p className="font-bold text-foreground">{t.name}</p>
                                                         <p className="text-xs text-muted-foreground">{t.email} • {t.tag}</p>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-2 w-full sm:w-auto">
                                                     <button onClick={() => onApproveTeacherRequest(t.id)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">Approve</button>
                                                     <button onClick={() => onDeclineTeacherRequest(t.id)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">Decline</button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : <p className="text-muted-foreground text-sm py-2 italic">No pending faculty requests.</p>}
                             </div>

                             {/* Student Approvals */}
                             <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                                 <h3 className="text-lg font-bold text-foreground mb-4 flex justify-between items-center">
                                     Student Requests
                                     <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{pendingStudents.length}</span>
                                 </h3>
                                 {pendingStudents.length > 0 ? (
                                     <div className="grid grid-cols-1 gap-3">
                                         {pendingStudents.map(s => (
                                             <div key={s.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 rounded-xl border border-border gap-4">
                                                 <div className="flex items-center gap-4 w-full sm:w-auto">
                                                     <Avatar src={s.avatarUrl} name={s.name} size="md" />
                                                     <div>
                                                         <p className="font-bold text-foreground">{s.name}</p>
                                                         <p className="text-xs text-muted-foreground">{s.email}</p>
                                                         <div className="flex gap-2 mt-1">
                                                             <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Year {s.yearOfStudy}</span>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-2 w-full sm:w-auto">
                                                     <button onClick={() => onApproveTeacherRequest(s.id)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">Approve</button>
                                                     <button onClick={() => onDeclineTeacherRequest(s.id)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">Decline</button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : <p className="text-muted-foreground text-sm py-2 italic">No pending student requests.</p>}
                             </div>
                        </div>
                    )}
                     {/* Placeholders for other sections */}
                    {['exams', 'reports', 'settings'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <SettingsIcon className="w-12 h-12 text-muted mb-4" />
                            <h3 className="text-xl font-bold">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h3>
                            <p className="text-muted">This module is under development.</p>
                        </div>
                    )}
                </main>
            </div>
            
            {/* Modals */}
             {college && <AddClassModal isOpen={isAddClassModalOpen} onClose={() => setIsAddClassModalOpen(false)} college={college} department={myDept} onSave={onUpdateCollegeClasses} />}
            <AddUserModal isOpen={addUserModalState.isOpen} onClose={() => setAddUserModalState({isOpen: false, role: null})} role={addUserModalState.role} department={myDept} onCreateUser={onCreateUser as any} availableYears={myDeptYears} />
            <AddTeachersCsvModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} department={myDept} onCreateUsersBatch={onCreateUsersBatch} />
            <AddStudentsCsvModal isOpen={isStudentCsvModalOpen} onClose={() => setIsStudentCsvModalOpen(false)} department={myDept} onCreateUsersBatch={onCreateUsersBatch} />
            <CreateCourseModal isOpen={courseCreationContext.isOpen} onClose={() => setCourseCreationContext({ isOpen: false })} onCreateCourse={onCreateCourse} department={myDept} prefilledYear={courseCreationContext.prefilledYear} prefilledDivision={courseCreationContext.prefilledDivision} />
            <AssignFacultyModal isOpen={isAssignFacultyModalOpen} onClose={() => setIsAssignFacultyModalOpen(false)} courses={deptCourses} teachers={deptTeachers} onSave={onUpdateCourseFaculty} />
            <CreateNoticeModal isOpen={isCreateNoticeModalOpen} onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} departmentOptions={college?.departments || []} availableYears={allCollegeYears} />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HodPage;
