import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Course, Notice, DepartmentChat, Message, AttendanceStatus, Feedback, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, TrashIcon, MessageIcon, SendIcon, UsersIcon, CheckSquareIcon, StarIcon, UserPlusIcon, ClockIcon, UploadIcon } from '../components/Icons';
import { yearOptions } from '../constants';
import AddTeachersCsvModal from '../components/AddTeachersCsvModal';

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
}

// --- MODALS & SUB-COMPONENTS ---
const AddUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    role: 'Student' | 'Teacher' | null;
    department: string;
    onCreateUser: (userData: Omit<User, 'id'>) => Promise<void>;
}> = ({ isOpen, onClose, role, department, onCreateUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setYearOfStudy(1);
        }
    }, [isOpen]);

    if (!isOpen || !role) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData: Omit<User, 'id'> = {
            name,
            email,
            department,
            tag: role,
            bio: '',
            interests: [],
            achievements: [],
            personalNotes: [],
            isApproved: role === 'Student' || role === 'HOD/Dean',
        };
        if (role === 'Student') {
            userData.yearOfStudy = yearOfStudy;
        }
        onCreateUser(userData).then(() => {
            onClose();
        });
    };
    
    const inputClasses = "w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-foreground mb-4">Add New {role}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className={inputClasses} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className={inputClasses} />
                    {role === 'Student' && (
                        <select value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className={inputClasses}>
                            {yearOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                        </select>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Add {role}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateNoticeModal: React.FC<{
    onClose: () => void;
    onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
    departmentOptions: string[];
}> = ({ onClose, onCreateNotice, departmentOptions }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
    const [targetYears, setTargetYears] = useState<number[]>([]);
    const editorRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Post a New Notice</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice Title" className="w-full text-xl font-bold bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    <div className="border border-border rounded-lg">
                        <div className="p-2 border-b border-border flex items-center gap-2">
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('bold'); }} className="font-bold w-8 h-8 rounded hover:bg-muted">B</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('italic'); }} className="italic w-8 h-8 rounded hover:bg-muted">I</button>
                             <button onMouseDown={e => { e.preventDefault(); applyStyle('insertUnorderedList'); }} className="w-8 h-8 rounded hover:bg-muted">UL</button>
                        </div>
                        <div ref={editorRef} contentEditable onInput={handleInput} data-placeholder="Write your notice here..." className="w-full min-h-[150px] p-3 text-foreground bg-input focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Departments (optional)</h4>
                            <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto no-scrollbar">
                                {departmentOptions.map(dept => (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={targetDepartments.includes(dept)} onChange={() => handleDeptToggle(dept)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                        <span>{dept}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Years (optional)</h4>
                             <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto no-scrollbar">
                                {yearOptions.map(year => (
                                    <label key={year.val} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={targetYears.includes(year.val)} onChange={() => handleYearToggle(year.val)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                        <span>{year.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-text-muted">If no departments or years are selected, the notice will be visible to all students.</p>
                </div>
                 <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
                    <button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">Post Notice</button>
                </div>
            </div>
        </div>
    );
};

const UserList: React.FC<{ users: User[]; onNavigate: (path: string) => void }> = ({ users, onNavigate }) => {
    if (users.length === 0) {
        return <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted"><p>No users found for the current filter.</p></div>;
    }
    return (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="space-y-3">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                        <div className="flex items-center space-x-3">
                            <Avatar src={user.avatarUrl} name={user.name} size="md" />
                            <div>
                                <p className="font-semibold text-card-foreground">{user.name}</p>
                                <p className="text-sm text-text-muted">{user.email}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HodOverviewTab: React.FC<{ analytics: any, users: { [key:string]: User }, onApprove: (id: string) => void, onDecline: (id: string) => void }> = ({ analytics, users, onApprove, onDecline }) => {
    const StatCard: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
        <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-muted">{title}</p>
                <Icon className="w-6 h-6 text-primary"/>
            </div>
            <div className="text-3xl font-bold text-foreground mt-2 flex items-baseline">{children}</div>
        </div>
    );

    return (
        <div className="space-y-8">
            {analytics.pendingTeachers.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg shadow-md" role="alert">
                    <div className="flex items-center mb-3">
                        <UserPlusIcon className="w-6 h-6 text-blue-500 mr-3"/>
                        <p className="font-bold text-lg">Pending Teacher Approvals ({analytics.pendingTeachers.length})</p>
                    </div>
                    <div className="space-y-3">
                        {analytics.pendingTeachers.map((teacher: User) => (
                            <div key={teacher.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <Avatar src={teacher.avatarUrl} name={teacher.name} size="md" />
                                    <div>
                                        <p className="font-bold text-blue-900">{teacher.name}</p>
                                        <p className="text-sm text-blue-700">{teacher.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-end sm:self-center">
                                    <button onClick={() => onApprove(teacher.id)} className="bg-emerald-500/20 text-emerald-700 font-semibold py-1 px-3 rounded-full text-xs hover:bg-emerald-500/30">Approve</button>
                                    <button onClick={() => onDecline(teacher.id)} className="bg-red-500/20 text-red-700 font-semibold py-1 px-3 rounded-full text-xs hover:bg-red-500/30">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Total Courses" icon={BookOpenIcon}>{analytics.totalCourses}</StatCard>
                <StatCard title="Total Teachers" icon={UsersIcon}>{analytics.totalTeachers}</StatCard>
                <StatCard title="Total Students" icon={UsersIcon}>{analytics.totalStudents}</StatCard>
                <StatCard title="Today's Attendance" icon={CheckSquareIcon}>{analytics.overallAttendance}<span className="text-lg">%</span></StatCard>
                <StatCard title="Avg. Feedback" icon={StarIcon}>
                    {analytics.averageFeedback > 0 ? (
                        <div className="flex items-baseline gap-1">
                            {analytics.averageFeedback.toFixed(1)}
                            <StarIcon className="w-6 h-6 text-amber-400 fill-current -mt-1" />
                        </div>
                    ) : (
                        <span className="text-2xl">N/A</span>
                    )}
                </StatCard>
            </div>

            {analytics.totalPendingRequests > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg" role="alert">
                    <div className="flex">
                        <div className="py-1"><UserPlusIcon className="w-6 h-6 text-amber-500 mr-4"/></div>
                        <div>
                            <p className="font-bold">Action Required</p>
                            <p className="text-sm">There are {analytics.totalPendingRequests} pending student request(s) to join courses in your department.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                 <h3 className="text-xl font-bold text-foreground mb-4">Today's Class Attendance</h3>
                 <div className="space-y-3">
                    {analytics.coursesWithAttendance.length > 0 ? analytics.coursesWithAttendance.map((course: any) => {
                        const attendance = course.attendanceToday;
                        const percentage = attendance && attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0;
                        const teacher = users[course.facultyId];
                        return (
                             <div key={course.id} className="p-3 bg-slate-50 rounded-lg border border-border">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div>
                                        <p className="font-bold text-foreground">{course.subject}</p>
                                        <p className="text-sm text-text-muted">Taught by {teacher?.name || 'Unknown'}</p>
                                    </div>
                                    {attendance ? (
                                        <div className="w-full sm:w-48 mt-2 sm:mt-0">
                                             <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-semibold text-primary">{Math.round(percentage)}%</span>
                                                <span className="text-xs text-text-muted">{attendance.present} / {attendance.total} present</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-muted mt-2 sm:mt-0">No record for today</p>
                                    )}
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-sm text-text-muted text-center py-4">No attendance has been recorded for any course in this department today.</p>
                    )}
                 </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Top Enrolled Courses</h3>
                    <div className="space-y-3">
                        {analytics.topCourses.map((course: Course) => {
                            const teacher = users[course.facultyId];
                            return (
                                <div key={course.id} className="p-3 bg-slate-50 rounded-lg border border-border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-foreground">{course.subject}</p>
                                            <p className="text-sm text-text-muted">Taught by {teacher?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="text-center flex-shrink-0 ml-4">
                                            <p className="font-bold text-lg text-primary">{course.students?.length || 0}</p>
                                            <p className="text-xs text-text-muted">Students</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Teacher Workload</h3>
                    <div className="space-y-3">
                        {analytics.teacherWorkload.map(({ teacherId, courseCount }: { teacherId: string, courseCount: number }) => {
                            const teacher = users[teacherId];
                            if (!teacher) return null;
                            return (
                                <div key={teacherId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={teacher.avatarUrl} name={teacher.name} size="md" />
                                        <div>
                                            <p className="font-bold text-foreground">{teacher.name}</p>
                                        </div>
                                    </div>
                                     <div className="text-center flex-shrink-0 ml-4">
                                        <p className="font-bold text-lg text-primary">{courseCount}</p>
                                        <p className="text-xs text-text-muted">Course{courseCount !== 1 && 's'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
};

const HodDepartmentChat: React.FC<{
    currentUser: User;
    departmentChats: DepartmentChat[];
    users: { [key: string]: User };
    onSendDepartmentMessage: (department: string, channel: string, text: string) => void;
}> = ({ currentUser, departmentChats, users, onSendDepartmentMessage }) => {
    const channels = ['Teachers', '1st Year', '2nd Year', '3rd Year', '4th Year'];
    const [selectedChannel, setSelectedChannel] = useState(channels[0]);
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = useMemo(() => departmentChats.find(c => c.department === currentUser.department && c.channel === selectedChannel), [departmentChats, currentUser.department, selectedChannel]);
    const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSendDepartmentMessage(currentUser.department, selectedChannel, text.trim());
            setText('');
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border h-[75vh] flex animate-fade-in">
            <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <h3 className="font-bold text-foreground">Chat Channels</h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {channels.map(channel => (
                        <button
                            key={channel}
                            onClick={() => setSelectedChannel(channel)}
                            className={`w-full text-left p-3 font-semibold text-sm transition-colors ${selectedChannel === channel ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                        >
                            {channel}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-2/3 flex flex-col">
                <div className="p-4 border-b border-border">
                    <h3 className="font-bold text-foreground truncate">{selectedChannel} - {currentUser.department}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {messages.length > 0 ? messages.map(msg => {
                        const sender = users[msg.senderId];
                        if (!sender) return null;
                        const isCurrentUser = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                {!isCurrentUser && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" />}
                                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    {!isCurrentUser && <p className="text-xs text-text-muted mb-1">{sender.name}</p>}
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-card-foreground'}`}><p className="whitespace-pre-wrap break-words">{msg.text}</p></div>
                                    <p className="text-xs text-text-muted mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        );
                    }) : <p className="text-center text-text-muted mt-8">No messages in this channel yet.</p>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-border bg-slate-50">
                    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`Message ${selectedChannel}...`}
                            className="flex-1 bg-white border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                        />
                        <button type="submit" className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!text.trim()}>
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const CourseCard: React.FC<{ course: Course; onNavigate: (path: string) => void; }> = ({ course, onNavigate }) => {
    const yearLabel = yearOptions.find(y => y.val === course.year)?.label || `${course.year}th Year`;
    return (
        <div className="bg-card p-0.5 rounded-xl animated-border group cursor-pointer" onClick={() => onNavigate(`#/academics/${course.id}`)}>
            <div className="bg-card rounded-[10px] shadow-card hover:shadow-card-hover transition-all duration-300 border border-border flex flex-col h-full hover:-translate-y-1">
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-foreground">{course.subject}</h3>
                    <p className="text-sm font-semibold text-primary mt-1">{yearLabel} &bull; {course.department}</p>
                    {course.description && (<p className="text-sm text-text-muted mt-3 pt-3 border-t border-border/50 flex-grow">{course.description}</p>)}
                </div>
                <div className="bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300 p-3 mt-auto text-center font-semibold text-sm text-primary flex items-center justify-center gap-2">
                    View Details <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
};

const CourseGrid: React.FC<{ courses: Course[], onNavigate: (path: string) => void, emptyState?: { title: string, subtitle: string } }> = ({ courses, onNavigate, emptyState }) => {
    if (courses.length === 0) {
        if (!emptyState) return null;
        return (
             <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
                <p className="mt-2">{emptyState.subtitle}</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => <CourseCard key={course.id} course={course} onNavigate={onNavigate} />)}
        </div>
    )
};

const NoticeCard: React.FC<{ notice: Notice; author: User | undefined; currentUser: User; onDelete: (noticeId: string) => void; }> = ({ notice, author, currentUser, onDelete }) => {
    const canDelete = notice.authorId === currentUser.id || currentUser.tag === 'Director';
    const isTargeted = (notice.targetDepartments && notice.targetDepartments.length > 0) || (notice.targetYears && notice.targetYears.length > 0);

    return (
        <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-border flex overflow-hidden animate-fade-in group hover:-translate-y-1">
            <div className={`w-2 flex-shrink-0 bg-gradient-to-b ${isTargeted ? 'from-secondary to-accent' : 'from-primary to-blue-400'}`}></div>
            <div className="flex-1 p-5">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${isTargeted ? 'from-secondary to-accent' : 'from-primary to-blue-400'}`}>
                            <MegaphoneIcon className="w-6 h-6"/>
                        </div>
                        <h3 className="text-xl font-bold text-foreground flex-1">{notice.title}</h3>
                    </div>
                    {canDelete && 
                        <button onClick={() => onDelete(notice.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    }
                </div>

                {author && (
                    <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-border/50 text-sm text-text-muted">
                        <Avatar src={author.avatarUrl} name={author.name} size="sm" />
                        <div>
                            <span className="font-semibold text-foreground">{author.name}</span>
                            <span className="mx-1">&bull;</span>
                            <span>{new Date(notice.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                    </div>
                )}
                
                <div className="prose prose-sm max-w-none mt-4 text-card-foreground" dangerouslySetInnerHTML={{ __html: notice.content }} />
            
                {(notice.targetDepartments && notice.targetDepartments.length > 0 || notice.targetYears && notice.targetYears.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                        <h5 className="text-xs font-bold text-text-muted uppercase mb-2">TARGETED TO</h5>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {notice.targetDepartments?.map(d => <span key={d} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{d}</span>)}
                            {notice.targetYears?.map(y => <span key={y} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{yearOptions.find(yo => yo.val === y)?.label}</span>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN HOD DASHBOARD COMPONENT ---
const HodPage: React.FC<HodPageProps> = (props) => {
    const { currentUser, allUsers, users, courses, onNavigate, onCreateCourse, onCreateUser, onApproveTeacherRequest, onDeclineTeacherRequest, currentPath, onCreateUsersBatch } = props;
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'teachers' | 'students' | 'departmentChat' | 'noticeBoard'>('overview');
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [addUserModalState, setAddUserModalState] = useState<{ isOpen: boolean; role: 'Student' | 'Teacher' | null }>({ isOpen: false, role: null });
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

     const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const departmentAnalytics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        const allDepartmentCourses = courses.filter(c => c.department === currentUser.department);
        const allUsersInDept = allUsers.filter(u => u.department === currentUser.department);
        const teacherLikeUsers = allUsersInDept.filter(u => u.tag === 'Teacher' || u.tag === 'HOD/Dean');
        const pendingTeachers = teacherLikeUsers.filter(t => t.isApproved === false);
        const allTeachersInDept = teacherLikeUsers.filter(t => t.isApproved !== false);
        const teacherIds = new Set(allTeachersInDept.map(t => t.id));
        
        let teacherCourseCount: { [key: string]: number } = {};
        allTeachersInDept.forEach(t => teacherCourseCount[t.id] = 0);
        allDepartmentCourses.forEach(course => {
            if (teacherIds.has(course.facultyId)) {
                teacherCourseCount[course.facultyId] = (teacherCourseCount[course.facultyId] || 0) + 1;
            }
        });
        
        const teacherWorkload = Object.entries(teacherCourseCount)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([teacherId, courseCount]) => ({ teacherId, courseCount }));

        const yearFilteredCourses = selectedYear === 'all'
            ? allDepartmentCourses
            : allDepartmentCourses.filter(c => c.year === selectedYear);

        const studentIds = new Set<string>();
        let totalPresentToday = 0;
        let totalStudentsInClassToday = 0;
        let totalPendingRequests = 0;
        const allFeedbacks: Feedback[] = [];

        const coursesWithAttendance = yearFilteredCourses.map(course => {
            course.students?.forEach(sId => studentIds.add(sId));
            totalPendingRequests += course.pendingStudents?.length || 0;
            if (course.feedback) allFeedbacks.push(...course.feedback);

            const todaysRecord = course.attendanceRecords?.find(r => {
                const recordDate = new Date(r.date);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate.getTime() === todayTimestamp;
            });

            if (todaysRecord) {
                // FIX: Property 'status' does not exist on type 'unknown'. Explicitly type 'rec'.
                const presentCount = Object.values(todaysRecord.records).filter((rec: { status: AttendanceStatus }) => rec.status === 'present').length;
                const totalInClass = course.students?.length || 0;
                totalPresentToday += presentCount;
                totalStudentsInClassToday += totalInClass;
                return { ...course, attendanceToday: { present: presentCount, total: totalInClass }};
            }
            return { ...course, attendanceToday: null };
        });

        const overallAttendance = totalStudentsInClassToday > 0 ? (totalPresentToday / totalStudentsInClassToday) * 100 : 0;
        const allStudentsInDept = Array.from(studentIds).map(id => users[id]).filter(Boolean);
        const averageFeedback = allFeedbacks.length > 0 ? allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / allFeedbacks.length : 0;
        const topCourses = [...yearFilteredCourses].sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0)).slice(0, 5);

        return {
            totalCourses: yearFilteredCourses.length,
            totalStudents: studentIds.size,
            overallAttendance: Math.round(overallAttendance),
            coursesWithAttendance,
            allStudentsInDept,
            totalPendingRequests,
            averageFeedback,
            topCourses,
            totalTeachers: teacherIds.size,
            allTeachersInDept,
            teacherWorkload,
            pendingTeachers,
        };
    }, [courses, currentUser.department, users, allUsers, selectedYear]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpenIcon },
        { id: 'courses', label: 'Courses', icon: BookOpenIcon },
        { id: 'teachers', label: 'Teachers', icon: UsersIcon },
        { id: 'students', label: 'Students', icon: UsersIcon },
        { id: 'departmentChat', label: 'Department Chat', icon: MessageIcon },
        { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon },
    ];

    const yearFilters: (number | 'all')[] = ['all', 1, 2, 3, 4];
    
    const renderTabContent = () => {
        const lowercasedSearch = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'courses':
                const filteredCourses = departmentAnalytics.coursesWithAttendance.filter(c => c.subject.toLowerCase().includes(lowercasedSearch));
                return <CourseGrid courses={filteredCourses} onNavigate={onNavigate} emptyState={{ title: "No courses found", subtitle: "No courses match the current filters." }} />;
            case 'teachers':
                const filteredTeachers = departmentAnalytics.allTeachersInDept.filter(t => t.name.toLowerCase().includes(lowercasedSearch));
                return <>
                    {departmentAnalytics.pendingTeachers.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg shadow-md mb-8" role="alert">
                            <div className="flex items-center mb-3">
                                <UserPlusIcon className="w-6 h-6 text-blue-500 mr-3"/>
                                <p className="font-bold text-lg">Pending Teacher Approvals ({departmentAnalytics.pendingTeachers.length})</p>
                            </div>
                            <div className="space-y-3">
                                {departmentAnalytics.pendingTeachers.map((teacher: User) => (
                                    <div key={teacher.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white rounded-lg border border-blue-200">
                                        <div className="flex items-center space-x-3">
                                            <Avatar src={teacher.avatarUrl} name={teacher.name} size="md" />
                                            <div>
                                                <p className="font-bold text-blue-900">{teacher.name}</p>
                                                <p className="text-sm text-blue-700">{teacher.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-end sm:self-center">
                                            <button onClick={() => onApproveTeacherRequest(teacher.id)} className="bg-emerald-500/20 text-emerald-700 font-semibold py-1 px-3 rounded-full text-xs hover:bg-emerald-500/30">Approve</button>
                                            <button onClick={() => onDeclineTeacherRequest(teacher.id)} className="bg-red-500/20 text-red-700 font-semibold py-1 px-3 rounded-full text-xs hover:bg-red-500/30">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h2 className="text-xl font-bold">Approved Teachers ({departmentAnalytics.allTeachersInDept.length})</h2>
                        <div className="flex gap-2">
                             <button onClick={() => setIsCsvModalOpen(true)} className="bg-primary/10 text-primary font-bold py-2 px-4 rounded-full hover:bg-primary/20 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2 text-sm"><UploadIcon className="w-5 h-5"/>Add via CSV</button>
                            <button onClick={() => setAddUserModalState({ isOpen: true, role: 'Teacher' })} className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2 text-sm"><PlusIcon className="w-5 h-5"/>Add New Teacher</button>
                        </div>
                    </div>
                    <UserList users={filteredTeachers} onNavigate={onNavigate} />
                </>;
            case 'students':
                const filteredStudents = departmentAnalytics.allStudentsInDept.filter(s => s.name.toLowerCase().includes(lowercasedSearch));
                return <>
                    <button onClick={() => setAddUserModalState({ isOpen: true, role: 'Student' })} className="w-full sm:w-auto mb-4 bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Add New Student</button>
                    <UserList users={filteredStudents} onNavigate={onNavigate} />
                </>;
            case 'departmentChat':
                 return <HodDepartmentChat currentUser={currentUser} departmentChats={props.departmentChats} users={users} onSendDepartmentMessage={props.onSendDepartmentMessage} />;
            case 'noticeBoard':
                 const filteredNotices = props.notices.filter(n => n.title.toLowerCase().includes(lowercasedSearch) || n.content.toLowerCase().includes(lowercasedSearch));
                 return <div className="space-y-6">
                    <button onClick={() => setIsCreateNoticeModalOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Post New Notice</button>
                    {filteredNotices.map(notice => <NoticeCard key={notice.id} notice={notice} author={users[notice.authorId]} currentUser={currentUser} onDelete={props.onDeleteNotice} />)}
                 </div>;
            case 'overview':
            default: return <HodOverviewTab analytics={departmentAnalytics} users={users} onApprove={onApproveTeacherRequest} onDecline={onDeclineTeacherRequest} />;
        }
    };
    
    const collegeDepartments = useMemo(() => {
        const college = props.colleges.find(c => c.id === currentUser.collegeId);
        return college?.departments || [];
    }, [props.colleges, currentUser.collegeId]);

    return (
         <div className="bg-slate-50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <div className="animate-fade-in">
                    <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                                <BookOpenIcon className="w-8 h-8"/>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">HOD Dashboard</h1>
                            <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">Manage your department: {currentUser.department}.</p>
                        </div>
                    </div>
                    <div className="border-b border-border flex justify-center mb-6">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-shrink-0 flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}><tab.icon className="w-5 h-5"/><span>{tab.label}</span></button>
                        ))}
                        </nav>
                    </div>

                    {activeTab !== 'departmentChat' && (
                        <div className="my-6 p-2 bg-card rounded-lg border border-border flex flex-wrap items-center justify-center gap-2">
                            <span className="font-semibold text-sm mr-2 text-text-muted">Filter by Year:</span>
                            {yearFilters.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                                        selectedYear === year 
                                        ? 'bg-primary text-primary-foreground shadow' 
                                        : 'bg-muted text-text-muted hover:bg-border'
                                    }`}
                                >
                                    {year === 'all' ? 'All Years' : `${year}${['st','nd','rd','th'][year-1] || 'th'} Year`}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab !== 'overview' && activeTab !== 'departmentChat' && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                            <div className="relative w-full sm:flex-1 sm:max-w-md"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" /><input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/></div>
                            {activeTab === 'courses' && <button onClick={() => setIsAddCourseModalOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Add New Course</button>}
                        </div>
                    )}
                    
                    <div className="animate-fade-in">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>

            <AddUserModal isOpen={addUserModalState.isOpen} onClose={() => setAddUserModalState({isOpen: false, role: null})} role={addUserModalState.role} department={currentUser.department} onCreateUser={onCreateUser} />
            {isCsvModalOpen && (
                <AddTeachersCsvModal
                    isOpen={isCsvModalOpen}
                    onClose={() => setIsCsvModalOpen(false)}
                    department={currentUser.department}
                    onCreateUsersBatch={onCreateUsersBatch}
                />
            )}
            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={props.onCreateNotice} departmentOptions={collegeDepartments} />}
        </div>
    );
};

export default HodPage;