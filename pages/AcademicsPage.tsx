
import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: Changed from 'import type' to a regular import to fix "'College' only refers to a type" error.
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

// --- PROPS ---
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

// --- HELPER COMPONENTS ---

const SidebarItem: React.FC<{ id: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean }> = ({ id, label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            active 
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
            : 'text-muted-foreground hover:bg-muted hover:text-primary'
        }`}
    >
        <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
        <span className={`text-sm font-medium ${active ? '' : ''}`}>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />}
    </button>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ElementType; colorClass: string; subText?: string; trend?: 'up' | 'down' }> = ({ label, value, icon: Icon, colorClass, subText, trend }) => (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                {trend && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trend === 'up' ? '↑' : '↓'}
                    </span>
                )}
            </div>
            {subText && <p className="text-xs text-muted-foreground mt-1 font-medium">{subText}</p>}
        </div>
        <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
            {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
        {action}
    </div>
);

// --- MODALS ---
const CreateCourseModal: React.FC<{ onClose: () => void; onAddCourse: (course: Omit<Course, 'id' | 'facultyId'>) => void; departmentOptions: string[] }> = ({ onClose, onAddCourse, departmentOptions }) => {
    const [year, setYear] = useState(yearOptions[0].val);
    const [department, setDepartment] = useState(departmentOptions[0] || '');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim()) {
            alert('Please enter a subject name.');
            return;
        }
        onAddCourse({ year, department, subject, description });
        onClose();
    };
    
    const inputClasses = "w-full px-4 py-2.5 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-scale-in border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Create New Course</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Year</label>
                            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClasses}>
                                {yearOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Department</label>
                            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClasses}>
                                {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Subject Name</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Advanced Algorithms" required className={inputClasses}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Course objectives..." rows={3} className={`${inputClasses} resize-none`}/>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" className="w-full py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02]">
                            Create Course
                        </button>
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
    availableYears: number[];
}> = ({ onClose, onCreateNotice, departmentOptions, availableYears }) => {
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

const CreateStudentAccountModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    department: string; 
    onCreateUser: (userData: Omit<User, 'id'>) => Promise<void>;
    availableYears: number[];
}> = ({ isOpen, onClose, department, onCreateUser, availableYears }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [year, setYear] = useState(availableYears[0] || 1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (availableYears.length > 0) {
            setYear(availableYears[0]);
        }
    }, [availableYears]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
             await onCreateUser({
                name,
                email,
                department,
                tag: 'Student',
                isApproved: false, // HOD approval required
                isRegistered: false, // Needs to sign up
                yearOfStudy: year
            });
            setName(''); setEmail('');
            if (availableYears.length > 0) setYear(availableYears[0]);
            onClose();
            alert('Student added to invite list! They need to sign up to be approved.');
        } catch (e) {
            console.error(e);
            alert('Failed to add student.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-foreground">Add New Student</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-muted-foreground"/></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Create a new student account. They will need to sign up to activate it.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all" required placeholder="e.g. Jane Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all" required placeholder="student@college.edu" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Year of Study</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all">
                            {availableYears.length > 0 ? (
                                availableYears.map(y => <option key={y} value={y}>{yearOptions.find(opt => opt.val === y)?.label || `Year ${y}`}</option>)
                            ) : (
                                <option value="" disabled>No years configured</option>
                            )}
                        </select>
                        {availableYears.length === 0 && <p className="text-xs text-red-500 mt-1">No classes configured for this department.</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-muted text-foreground font-medium transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading || availableYears.length === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-bold shadow-lg shadow-primary/20 transition-all">
                            {isLoading ? 'Adding...' : 'Invite Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- PAGE COMPONENTS ---
const CourseCard: React.FC<{ course: Course; onNavigate: (path: string) => void; isFaculty?: boolean; }> = ({ course, onNavigate, isFaculty }) => {
    const yearLabel = yearOptions.find(y => y.val === course.year)?.label || `${course.year}th Year`;
    
    return (
        <div className="bg-card p-0.5 rounded-xl animated-border group cursor-pointer" onClick={() => onNavigate(`#/academics/${course.id}`)}>
            <div className="bg-card rounded-[10px] shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col h-full hover:-translate-y-1">
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                             <h3 className="text-lg font-bold text-foreground line-clamp-1" title={course.subject}>{course.subject}</h3>
                             <p className="text-sm font-medium text-primary mt-1">{course.department}</p>
                        </div>
                        <div className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-md">{yearLabel}</span>
                        {course.division && <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-md">Div {course.division}</span>}
                    </div>
                    {course.description && (<p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 flex-grow line-clamp-2">{course.description}</p>)}
                    
                    {/* Stats for Faculty */}
                    {isFaculty && (
                         <div className="mt-3 pt-2 flex justify-between items-center text-xs font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> {course.students?.length || 0}</span>
                            <span className="flex items-center gap-1"><ClipboardListIcon className="w-3 h-3"/> {course.assignments?.length || 0}</span>
                            <span className="flex items-center gap-1"><FileTextIcon className="w-3 h-3"/> {course.notes?.length || 0}</span>
                         </div>
                    )}
                </div>
                
                <div className="bg-muted/30 group-hover:bg-primary/5 transition-colors duration-300 p-3 mt-auto flex items-center justify-around gap-2 rounded-b-[10px] border-t border-border">
                     {isFaculty ? (
                         <>
                            <button onClick={(e) => {e.stopPropagation(); onNavigate(`#/academics/${course.id}/roster`)}} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors" title="Add Students"><UserPlusIcon className="w-4 h-4"/></button>
                            <button onClick={(e) => {e.stopPropagation(); onNavigate(`#/academics/${course.id}/assignments`)}} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors" title="Assignments"><ClipboardListIcon className="w-4 h-4"/></button>
                            <button onClick={(e) => {e.stopPropagation(); onNavigate(`#/academics/${course.id}/attendance`)}} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors" title="Attendance"><CheckSquareIcon className="w-4 h-4"/></button>
                         </>
                     ) : (
                         <span className="text-xs font-bold text-primary flex items-center gap-1">Go to Class <ArrowRightIcon className="w-3 h-3"/></span>
                     )}
                </div>
            </div>
        </div>
    );
};

const NoticeCard: React.FC<{ notice: Notice; author: User | undefined; currentUser: User; onDelete: (noticeId: string) => void; }> = ({ notice, author, currentUser, onDelete }) => {
    const canDelete = notice.authorId === currentUser.id || currentUser.tag === 'Director';
    const isTargeted = (notice.targetDepartments && notice.targetDepartments.length > 0) || (notice.targetYears && notice.targetYears.length > 0);

    return (
        <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border flex overflow-hidden animate-fade-in group hover:-translate-y-0.5">
            <div className={`w-1.5 flex-shrink-0 bg-gradient-to-b ${isTargeted ? 'from-secondary to-accent' : 'from-primary to-blue-400'}`}></div>
            <div className="flex-1 p-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${isTargeted ? 'from-secondary to-accent' : 'from-primary to-blue-400'}`}>
                            <MegaphoneIcon className="w-4 h-4"/>
                        </div>
                        <h3 className="text-base font-bold text-foreground flex-1 line-clamp-1">{notice.title}</h3>
                    </div>
                    {canDelete && 
                        <button onClick={() => onDelete(notice.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive p-1 rounded hover:bg-destructive/10">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    }
                </div>

                <div className="flex items-center space-x-2 mt-3 text-xs text-muted-foreground">
                    {author && <span className="font-semibold text-foreground">{author.name}</span>}
                    <span>&bull;</span>
                    <span>{new Date(notice.timestamp).toLocaleDateString()}</span>
                </div>
                
                <div className="prose prose-sm prose-invert max-w-none mt-2 text-card-foreground line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: notice.content }} />
            
                {(notice.targetDepartments && notice.targetDepartments.length > 0 || notice.targetYears && notice.targetYears.length > 0) && (
                    <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                        {notice.targetDepartments?.map(d => <span key={d} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">{d}</span>)}
                        {notice.targetYears?.map(y => <span key={y} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Year {y}</span>)}
                    </div>
                )}
            </div>
        </div>
    );
};

const NoticeEmptyState: React.FC<{ message: string; subMessage: string; }> = ({ message, subMessage }) => (
    <div className="text-center bg-card rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground animate-fade-in">
        <MegaphoneIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-3 text-base font-semibold text-foreground">{message}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subMessage}</p>
    </div>
);

const CourseGrid: React.FC<{ courses: Course[], onNavigate: (path: string) => void, emptyState?: { title: string, subtitle: string }, isFaculty?: boolean }> = ({ courses, onNavigate, emptyState, isFaculty }) => {
    if (courses.length === 0) {
        if (!emptyState) return null;
        return (
             <div className="text-center bg-card rounded-xl border border-border p-12 text-muted-foreground shadow-sm">
                 <BookOpenIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4"/>
                <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
                <p className="mt-2 text-sm">{emptyState.subtitle}</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map(course => <CourseCard key={course.id} course={course} onNavigate={onNavigate} isFaculty={isFaculty} />)}
        </div>
    )
};

const DiscoverCourseCard: React.FC<{
  course: Course;
  faculty: User | undefined;
  onRequestToJoin: (courseId: string) => void;
  hasRequested: boolean;
}> = ({ course, faculty, onRequestToJoin, hasRequested }) => {
    return (
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded">{course.department}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Year {course.year}</span>
                </div>
                <h4 className="font-bold text-card-foreground text-lg">{course.subject}</h4>
                {faculty && (
                    <div className="flex items-center space-x-2 mt-2 text-sm">
                        <Avatar src={faculty.avatarUrl} name={faculty.name} size="sm" className="w-6 h-6 text-xs" />
                        <span className="text-muted-foreground font-medium">{faculty.name}</span>
                    </div>
                )}
            </div>
            <button
                onClick={() => onRequestToJoin(course.id)}
                disabled={hasRequested}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
                {hasRequested ? 'Request Sent' : 'Request to Join'}
            </button>
        </div>
    );
};

const StudentAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, courses, notices, users, onRequestToJoinCourse, onDeleteNotice } = props;
    const [activeSection, setActiveSection] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [discoverSearch, setDiscoverSearch] = useState('');
    const [noticeSearch, setNoticeSearch] = useState('');

    const { enrolledCourses, discoverableCourses } = useMemo(() => {
        const enrolled: Course[] = [];
        const discoverable: Course[] = [];

        courses.forEach(course => {
            if (course.students?.includes(currentUser.id)) {
                enrolled.push(course);
            } else if (
                course.department === currentUser.department &&
                course.year === currentUser.yearOfStudy
            ) {
                discoverable.push(course);
            }
        });
        return { enrolledCourses: enrolled, discoverableCourses: discoverable };
    }, [courses, currentUser]);

    const filteredDiscoverableCourses = useMemo(() => {
        const lowercasedSearch = discoverSearch.toLowerCase();
        return discoverableCourses.filter(c => 
            c.subject.toLowerCase().includes(lowercasedSearch) ||
            users[c.facultyId]?.name.toLowerCase().includes(lowercasedSearch)
        );
    }, [discoverableCourses, discoverSearch, users]);
    
    const filteredNotices = useMemo(() => {
        const relevantNotices = notices.filter(notice => {
            const isGlobal = !(notice.targetDepartments?.length) && !(notice.targetYears?.length);
            const deptMatch = notice.targetDepartments?.includes(currentUser.department);
            const yearMatch = notice.targetYears?.includes(currentUser.yearOfStudy || 0);
            return isGlobal || deptMatch || yearMatch;
        });

        if (!noticeSearch.trim()) return relevantNotices;
        const lowerCaseSearch = noticeSearch.toLowerCase();
        return relevantNotices.filter(notice =>
            notice.title.toLowerCase().includes(lowerCaseSearch) ||
            notice.content.toLowerCase().includes(lowerCaseSearch) ||
            users[notice.authorId]?.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [notices, noticeSearch, currentUser, users]);

    // --- Student Sub-Views ---

    const StudentAttendanceView = () => {
        return (
            <div className="space-y-6 animate-fade-in">
                <SectionHeader title="My Attendance" subtitle="Track your presence across all subjects." />
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-muted/50 border-b border-border">
                                 <tr>
                                     <th className="p-4 font-bold text-muted-foreground">Course</th>
                                     <th className="p-4 font-bold text-muted-foreground text-center">Classes</th>
                                     <th className="p-4 font-bold text-muted-foreground text-center">Present</th>
                                     <th className="p-4 font-bold text-muted-foreground">Progress</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-border">
                                 {enrolledCourses.map(course => {
                                     let total = 0;
                                     let present = 0;
                                     course.attendanceRecords?.forEach(rec => {
                                         const status = rec.records[currentUser.id]?.status;
                                         if (status) {
                                             total++;
                                             if (status === 'present') present++;
                                         }
                                     });
                                     const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                                     
                                     return (
                                         <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                                             <td className="p-4 font-bold text-foreground">{course.subject}</td>
                                             <td className="p-4 text-center">{total}</td>
                                             <td className="p-4 text-center">{present}</td>
                                             <td className="p-4">
                                                 <div className="flex items-center gap-3">
                                                     <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[150px]">
                                                         <div className={`h-full rounded-full ${percentage >= 75 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
                                                     </div>
                                                     <span className={`text-xs font-bold ${percentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</span>
                                                 </div>
                                             </td>
                                         </tr>
                                     )
                                 })}
                                 {enrolledCourses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No courses enrolled.</td></tr>}
                             </tbody>
                         </table>
                     </div>
                </div>
            </div>
        );
    };

    const StudentAssignmentsView = () => {
        const allAssignments = useMemo(() => {
            const list: any[] = [];
            enrolledCourses.forEach(c => {
                (c.assignments || []).forEach(a => {
                    list.push({ ...a, courseName: c.subject, courseId: c.id });
                });
            });
            return list.sort((a, b) => a.dueDate - b.dueDate);
        }, [enrolledCourses]);

        return (
            <div className="space-y-6 animate-fade-in">
                <SectionHeader title="My Assignments" subtitle="Pending homework and projects." />
                {allAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allAssignments.map(ass => {
                             const isOverdue = new Date(ass.dueDate) < new Date();
                             return (
                                <div key={ass.id} className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">{ass.courseName}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {isOverdue ? 'Overdue' : 'Active'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-foreground text-lg">{ass.title}</h4>
                                    <div className="flex items-center gap-2 mt-4 text-xs font-medium text-muted-foreground">
                                        <CalendarIcon className="w-4 h-4"/> Due: {new Date(ass.dueDate).toLocaleDateString()}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                                        <a href={ass.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                            View Details <ArrowRightIcon className="w-3 h-3"/>
                                        </a>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
                        <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                        <p>No pending assignments.</p>
                    </div>
                )}
            </div>
        );
    };

    const StudentDashboardHome = () => {
        const pendingAssignmentsCount = enrolledCourses.reduce((acc, c) => acc + (c.assignments?.filter(a => new Date(a.dueDate) > new Date()).length || 0), 0);
        
        // Simplified Avg Attendance Calc
        let totalClasses = 0;
        let totalPresent = 0;
        enrolledCourses.forEach(c => {
            c.attendanceRecords?.forEach(r => {
                if (r.records[currentUser.id]) {
                    totalClasses++;
                    if (r.records[currentUser.id].status === 'present') totalPresent++;
                }
            })
        });
        const avgAtt = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

        return (
            <div className="space-y-8 animate-fade-in">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 font-semibold text-sm mb-1 uppercase tracking-wide">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <h2 className="text-3xl md:text-4xl font-extrabold">Hello, {currentUser.name.split(' ')[0]}! 👋</h2>
                        <p className="mt-2 text-indigo-100 max-w-xl text-lg">You have {enrolledCourses.length} active courses this semester.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard label="Avg Attendance" value={`${avgAtt}%`} icon={CheckSquareIcon} colorClass={avgAtt >= 75 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"} trend={avgAtt >= 75 ? 'up' : 'down'} />
                    <StatCard label="Pending Tasks" value={pendingAssignmentsCount} icon={ClipboardListIcon} colorClass="bg-purple-100 text-purple-600" />
                    <StatCard label="Enrolled Courses" value={enrolledCourses.length} icon={BookOpenIcon} colorClass="bg-blue-100 text-blue-600" />
                    <StatCard label="Notices" value={filteredNotices.length} icon={MegaphoneIcon} colorClass="bg-amber-100 text-amber-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-foreground">My Courses</h3>
                                <button onClick={() => handleSectionChange('courses')} className="text-sm text-primary font-semibold hover:underline">View All</button>
                            </div>
                            {enrolledCourses.length > 0 ? (
                                <div className="space-y-3">
                                    {enrolledCourses.slice(0, 3).map(course => (
                                        <div key={course.id} onClick={() => onNavigate(`#/academics/${course.id}`)} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-lg">
                                                    {course.subject.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{course.subject}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium">{course.department}</p>
                                                </div>
                                            </div>
                                            <ArrowRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground text-center py-8">No courses enrolled.</p>}
                        </div>
                    </div>

                    {/* Right: Notices/Deadlines */}
                    <div className="space-y-6">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                             <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Deadlines</h3>
                             {pendingAssignmentsCount > 0 ? (
                                 <div className="space-y-4">
                                     {enrolledCourses.flatMap(c => c.assignments || []).filter(a => new Date(a.dueDate) > new Date()).sort((a, b) => a.dueDate - b.dueDate).slice(0, 3).map((ass, i) => (
                                         <div key={i} className="flex items-start gap-3">
                                             <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                                             <div>
                                                 <p className="text-sm font-bold text-foreground line-clamp-1">{ass.title}</p>
                                                 <p className="text-xs text-muted-foreground">Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : <p className="text-sm text-muted-foreground">No upcoming deadlines. Great job!</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        setMobileMenuOpen(false);
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-background">
             {/* Mobile Sub-header */}
            <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
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
                        
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Academics</p>
                        <SidebarItem id="courses" label="My Courses" icon={BookOpenIcon} onClick={() => handleSectionChange('courses')} active={activeSection === 'courses'} />
                        <SidebarItem id="attendance" label="Attendance" icon={CheckSquareIcon} onClick={() => handleSectionChange('attendance')} active={activeSection === 'attendance'} />
                        <SidebarItem id="assignments" label="Assignments" icon={ClipboardListIcon} onClick={() => handleSectionChange('assignments')} active={activeSection === 'assignments'} />
                        <SidebarItem id="exams" label="Exams & Results" icon={AwardIcon} onClick={() => handleSectionChange('exams')} active={activeSection === 'exams'} />
                        <SidebarItem id="timetable" label="Timetable" icon={CalendarIcon} onClick={() => handleSectionChange('timetable')} active={activeSection === 'timetable'} />
                        
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Community</p>
                        <SidebarItem id="notices" label="Notices" icon={MegaphoneIcon} onClick={() => handleSectionChange('notices')} active={activeSection === 'notices'} />
                        <SidebarItem id="discover" label="Discover Courses" icon={SearchIcon} onClick={() => handleSectionChange('discover')} active={activeSection === 'discover'} />
                        
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Personal</p>
                        <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => handleSectionChange('settings')} active={activeSection === 'settings'} />
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-border px-4">
                        <div className="flex items-center gap-3">
                            <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="sm" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{currentUser.department}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
            
            {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 md:px-10 lg:px-12 bg-background/50">
                {activeSection === 'dashboard' && <StudentDashboardHome />}
                
                {activeSection === 'courses' && (
                    <div className="animate-fade-in space-y-6">
                        <SectionHeader title="My Courses" subtitle="Access your enrolled subjects and materials." />
                        <CourseGrid courses={enrolledCourses} onNavigate={onNavigate} emptyState={{title: "No courses yet", subtitle:"Head over to the Discover tab to join your first course."}}/>
                    </div>
                )}
                
                {activeSection === 'attendance' && <StudentAttendanceView />}
                {activeSection === 'assignments' && <StudentAssignmentsView />}
                
                {activeSection === 'discover' && (
                     <div className="space-y-6 animate-fade-in">
                        <SectionHeader title="Discover Courses" subtitle={`Available for ${currentUser.department}, Year ${currentUser.yearOfStudy}`} />
                        <div className="relative w-full max-w-md mb-6">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" placeholder="Search subjects..." value={discoverSearch} onChange={(e) => setDiscoverSearch(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                        </div>
                        <div className="space-y-3">
                            {filteredDiscoverableCourses.length > 0 ? filteredDiscoverableCourses.map(course => (
                                <DiscoverCourseCard 
                                    key={course.id} 
                                    course={course}
                                    faculty={users[course.facultyId]}
                                    onRequestToJoin={onRequestToJoinCourse}
                                    hasRequested={course.pendingStudents?.includes(currentUser.id) || false}
                                />
                            )) : (
                                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                                    <SearchIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3"/>
                                    <p className="text-muted-foreground font-medium">No courses found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {activeSection === 'notices' && (
                     <div className="space-y-6 animate-fade-in">
                         <SectionHeader title="Notice Board" subtitle="Important announcements." />
                         <div className="relative w-full max-w-md mb-6">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" placeholder="Search notices..." value={noticeSearch} onChange={(e) => setNoticeSearch(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredNotices.length > 0 ? (
                                filteredNotices.map(notice => (
                                    <NoticeCard key={notice.id} notice={notice} author={users[notice.authorId]} currentUser={currentUser} onDelete={onDeleteNotice} />
                                ))
                            ) : (
                               <div className="col-span-2"><NoticeEmptyState message="No relevant notices found" subMessage="It's all quiet on the announcement front for now." /></div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Placeholders */}
                {(activeSection === 'exams' || activeSection === 'timetable' || activeSection === 'settings') && (
                     <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                        <div className="p-6 bg-card rounded-full shadow-sm border border-border mb-4">
                            <SettingsIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Module</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">This section is currently under development.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FacultyAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, courses, onCreateCourse, notices, users, onCreateNotice, onDeleteNotice, departmentChats, onSendDepartmentMessage, colleges, onCreateUser } = props;
    
    const [activeSection, setActiveSection] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);

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
    
    // Years available in user's department (for adding students)
    const myDepartmentYears = useMemo(() => {
        if (!currentUser.department || !collegeClasses[currentUser.department]) return [];
        return Object.keys(collegeClasses[currentUser.department]).map(Number).sort((a, b) => a - b);
    }, [collegeClasses, currentUser.department]);

    // All years in the college (for global notices)
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

    // --- Sub-Views for Faculty ---

    const StudentProgressView = () => {
        const [searchTerm, setSearchTerm] = useState('');

        const studentStats = useMemo(() => {
            const stats: Record<string, { name: string, avatarUrl?: string, totalClasses: number, presentClasses: number, courses: string[] }> = {};

            myCourses.forEach(course => {
                const courseName = course.subject;
                
                // Initialize stats for enrolled students
                (course.students || []).forEach(studentId => {
                    if (!stats[studentId]) {
                        const u = users[studentId];
                        if (u) {
                            stats[studentId] = { name: u.name, avatarUrl: u.avatarUrl, totalClasses: 0, presentClasses: 0, courses: [] };
                        }
                    }
                    if (stats[studentId]) {
                        if (!stats[studentId].courses.includes(courseName)) {
                             stats[studentId].courses.push(courseName);
                        }
                    }
                });

                // Calculate attendance
                if (course.attendanceRecords) {
                    course.attendanceRecords.forEach(record => {
                        Object.entries(record.records).forEach(([sid, statusData]) => {
                            if (stats[sid]) {
                                stats[sid].totalClasses++;
                                if ((statusData as any).status === 'present') {
                                    stats[sid].presentClasses++;
                                }
                            }
                        });
                    });
                }
            });

            return Object.entries(stats).map(([id, data]) => ({
                id,
                ...data,
                attendancePercentage: data.totalClasses > 0 ? Math.round((data.presentClasses / data.totalClasses) * 100) : 0
            }));
        }, [myCourses, users]);

        const filteredStudents = studentStats.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const atRisk = studentStats.filter(s => s.totalClasses > 5 && s.attendancePercentage < 60);

        return (
             <div className="space-y-6 animate-fade-in">
                <SectionHeader 
                    title="Student Progress" 
                    subtitle="Track attendance and performance across your courses." 
                    action={
                        <button onClick={() => setIsCreateStudentModalOpen(true)} className="bg-primary/10 text-primary font-bold py-2 px-4 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-primary/20 transition-colors">
                            <UserPlusIcon className="w-4 h-4" /> Add New Student
                        </button>
                    }
                />
                
                {/* Risk Alert */}
                {atRisk.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                             <XCircleIcon className="w-5 h-5"/> Attention Needed ({atRisk.length})
                        </h4>
                        <p className="text-sm text-red-600 mb-3">The following students have attendance below 60%.</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {atRisk.map(s => (
                                <div key={s.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-red-100 shadow-sm min-w-[200px]">
                                    <Avatar src={s.avatarUrl} name={s.name} size="sm" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{s.name}</p>
                                        <p className="text-xs font-bold text-red-600">{s.attendancePercentage}% Att.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main List */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg text-foreground">All Students ({studentStats.length})</h3>
                        <div className="relative">
                             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                             <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                             />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="p-4 font-semibold text-muted-foreground">Student</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Courses</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Attendance</th>
                                    <th className="p-4 font-semibold text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <Avatar src={student.avatarUrl} name={student.name} size="md"/>
                                            <span className="font-bold text-foreground">{student.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {student.courses.map(c => <span key={c} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md font-medium">{c}</span>)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${student.attendancePercentage >= 75 ? 'bg-emerald-500' : student.attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${student.attendancePercentage}%`}}></div>
                                                </div>
                                                <span className="text-xs font-bold text-foreground">{student.attendancePercentage}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => onNavigate(`#/profile/${student.id}`)} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                                                <MessageIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No students found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )
    }

    const DashboardHome = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex justify-between items-center">
                <div>
                    <p className="text-blue-100 font-medium text-sm mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <h2 className="text-3xl font-bold">Welcome Back, {currentUser.name}!</h2>
                    <p className="mt-2 text-blue-50 opacity-90">You have {myCourses.length} classes today.</p>
                </div>
                <div className="hidden sm:block">
                    <div className="bg-white/20 p-3 rounded-full">
                        <ClockIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Active Courses" value={myCourses.length} icon={BookOpenIcon} colorClass="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" />
                <StatCard label="Attendance Pending" value={pendingAttendanceCount} icon={CheckSquareIcon} colorClass="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300" subText="Classes today" />
                <StatCard label="Total Assignments" value={totalAssignments} icon={ClipboardListIcon} colorClass="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" />
                <StatCard label="Total Students" value={totalStudents} icon={UsersIcon} colorClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Schedule & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-foreground">Today's Schedule</h3>
                            <button onClick={() => setActiveSection('classes')} className="text-sm text-primary font-semibold hover:underline">View All</button>
                        </div>
                         {myCourses.length > 0 ? (
                            <div className="space-y-3">
                                {myCourses.map(course => (
                                    <div key={course.id} onClick={() => onNavigate(`#/academics/${course.id}`)} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {course.subject.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{course.subject}</h4>
                                                <p className="text-xs text-muted-foreground font-medium">{course.department} • Year {course.year}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <ArrowRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <p className="text-muted-foreground text-center py-8">No classes scheduled.</p>
                         )}
                    </div>
                </div>
                
                {/* Right Column: Quick Actions & Notices */}
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                         <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setActiveSection('attendance')} className="p-4 bg-muted/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-xl text-center transition-colors group border border-transparent hover:border-emerald-200">
                                 <CheckSquareIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-emerald-500"/>
                                 <span className="text-xs font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">Attendance</span>
                             </button>
                             <button onClick={() => setActiveSection('assignments')} className="p-4 bg-muted/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 rounded-xl text-center transition-colors group border border-transparent hover:border-purple-200">
                                 <ClipboardListIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-purple-500"/>
                                 <span className="text-xs font-bold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300">Assignment</span>
                             </button>
                             <button onClick={() => setIsCreateStudentModalOpen(true)} className="p-4 bg-muted/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded-xl text-center transition-colors group border border-transparent hover:border-blue-200">
                                 <UserPlusIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-blue-500"/>
                                 <span className="text-xs font-bold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">Add Student</span>
                             </button>
                             <button onClick={() => setIsCreateNoticeModalOpen(true)} className="p-4 bg-muted/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded-xl text-center transition-colors group border border-transparent hover:border-amber-200">
                                 <MegaphoneIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-amber-500"/>
                                 <span className="text-xs font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300">Notice</span>
                             </button>
                         </div>
                    </div>

                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-foreground">Notice Board</h3>
                        </div>
                        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                            {notices.slice(0, 3).map(notice => (
                                <div key={notice.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                                    <h4 className="font-bold text-sm text-foreground line-clamp-1">{notice.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(notice.timestamp).toLocaleDateString()}</p>
                                </div>
                            ))}
                             {notices.length === 0 && <p className="text-xs text-muted-foreground text-center">No notices yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const ClassesView = () => (
         <div className="space-y-6 animate-fade-in">
             <SectionHeader 
                title="Classes & Timetable" 
                subtitle="Manage your active courses and view student details."
                action={<button onClick={() => setIsAddCourseModalOpen(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-transform transform hover:scale-105"><PlusIcon className="w-4 h-4"/> Add Class</button>}
             />
            
            {myCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCourses.map(course => (
                         <div key={course.id} className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{course.subject}</h4>
                                    <p className="text-sm text-muted-foreground font-medium mt-1">{course.department}</p>
                                </div>
                                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <BookOpenIcon className="w-5 h-5"/>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mb-6">
                                <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold">Year {course.year}</span>
                                {course.division && <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold">Div {course.division}</span>}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                                <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                    <UsersIcon className="w-4 h-4 mr-1.5"/>
                                    {course.students?.length || 0} Students
                                </div>
                                <button onClick={() => onNavigate(`#/academics/${course.id}`)} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                    Manage <ArrowRightIcon className="w-3 h-3"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center bg-card rounded-2xl border-2 border-dashed border-border p-16 text-muted-foreground">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-bold text-foreground">No Classes Assigned</h3>
                    <p className="mt-2 text-sm">Start by creating a new course to manage.</p>
                </div>
            )}
        </div>
    );

    const AttendanceView = () => (
        <div className="space-y-6 animate-fade-in">
             <SectionHeader title="Attendance Management" subtitle="Track and mark daily attendance for your classes."/>
             <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                 <table className="w-full text-left">
                     <thead className="bg-muted/50 border-b border-border text-xs font-bold uppercase text-muted-foreground tracking-wider">
                         <tr>
                             <th className="p-5">Course</th>
                             <th className="p-5">Class Details</th>
                             <th className="p-5">Today's Status</th>
                             <th className="p-5 text-right">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-border text-sm">
                         {myCourses.map(course => {
                             const isTakenToday = course.attendanceRecords?.some(r => new Date(r.date).toDateString() === new Date().toDateString());
                             return (
                                 <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                                     <td className="p-5 font-bold text-foreground">{course.subject}</td>
                                     <td className="p-5 text-muted-foreground">Year {course.year} • {course.department}</td>
                                     <td className="p-5">
                                         {isTakenToday ? (
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                 <CheckCircleIcon className="w-3 h-3 mr-1.5"/> Marked
                                             </span>
                                         ) : (
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                 <ClockIcon className="w-3 h-3 mr-1.5"/> Pending
                                             </span>
                                         )}
                                     </td>
                                     <td className="p-5 text-right">
                                         <button 
                                            onClick={() => onNavigate(`#/academics/${course.id}/attendance`)}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${isTakenToday ? 'bg-muted text-muted-foreground hover:bg-border' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                                         >
                                             {isTakenToday ? 'View Report' : 'Mark Now'}
                                         </button>
                                     </td>
                                 </tr>
                             )
                         })}
                         {myCourses.length === 0 && (
                             <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No courses available.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </div>
    );

    const AssignmentsView = () => (
        <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Assignments & Homework" subtitle="Manage ongoing tasks and grading."/>
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                 {myCourses.some(c => c.assignments && c.assignments.length > 0) ? (
                     <div className="space-y-6">
                        {myCourses.map(course => (
                            (course.assignments && course.assignments.length > 0) && (
                                <div key={course.id}>
                                    <h4 className="font-bold text-foreground mb-3 flex items-center justify-between">
                                        <span>{course.subject}</span>
                                        <button onClick={() => onNavigate(`#/academics/${course.id}/assignments`)} className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary/10">+ New</button>
                                    </h4>
                                    <div className="space-y-3">
                                        {course.assignments.map(ass => (
                                            <div key={ass.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-muted/30">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-card rounded-lg border border-border text-primary">
                                                        <ClipboardListIcon className="w-5 h-5"/>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-foreground text-sm">{ass.title}</h5>
                                                        <p className="text-xs text-muted-foreground mt-1">Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300">Active</span>
                                                    <a href={ass.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-muted-foreground hover:text-primary underline">View File</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                     </div>
                 ) : (
                    <div className="text-center py-12">
                        <ClipboardListIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3"/>
                        <p className="text-muted-foreground">No active assignments.</p>
                        <p className="text-sm text-muted-foreground mt-1">Select a course to create one.</p>
                    </div>
                 )}
            </div>
        </div>
    );

    const ResourcesView = () => (
         <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Study Material" subtitle="Upload notes and resources for your students."/>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCourses.map(course => (
                     <div key={course.id} className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col">
                         <div className="flex justify-between items-start mb-4">
                             <h4 className="font-bold text-lg text-foreground">{course.subject}</h4>
                             <button onClick={() => onNavigate(`#/academics/${course.id}/notes`)} className="bg-primary/5 text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                                 <UploadIcon className="w-5 h-5"/>
                             </button>
                         </div>
                         <div className="space-y-3 flex-1">
                             {(course.notes || []).slice(0, 3).map(note => (
                                 <a key={note.id} href={note.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                                     <div className="p-2 bg-muted/50 rounded text-muted-foreground group-hover:text-primary transition-colors"><FileTextIcon className="w-4 h-4"/></div>
                                     <span className="text-sm font-medium text-foreground group-hover:text-primary truncate flex-1">{note.title}</span>
                                 </a>
                             ))}
                             {(course.notes || []).length === 0 && <div className="h-20 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">Empty Folder</div>}
                         </div>
                         <div className="pt-4 mt-4 border-t border-border text-center">
                             <button onClick={() => onNavigate(`#/academics/${course.id}/notes`)} className="text-xs font-bold text-muted-foreground hover:text-primary">View All Files</button>
                         </div>
                     </div>
                ))}
             </div>
         </div>
    );

    // Placeholder Views for unimplemented features
    const PlaceholderView = ({ title, icon: Icon, message }: any) => (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
            <div className="p-6 bg-card rounded-full shadow-sm border border-border mb-4">
                <Icon className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground mt-2 max-w-md">{message || "This module is under development."}</p>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-background">
             {/* Mobile Sub-header */}
            <div className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
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
                        <SidebarItem id="classes" label="Classes & Timetable" icon={CalendarIcon} onClick={() => handleSectionChange('classes')} active={activeSection === 'classes'} />
                        <SidebarItem id="attendance" label="Attendance" icon={CheckSquareIcon} onClick={() => handleSectionChange('attendance')} active={activeSection === 'attendance'} />
                        <SidebarItem id="assignments" label="Assignments" icon={ClipboardListIcon} onClick={() => handleSectionChange('assignments')} active={activeSection === 'assignments'} />
                        <SidebarItem id="materials" label="Study Material" icon={UploadIcon} onClick={() => handleSectionChange('materials')} active={activeSection === 'materials'} />
                        
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Analysis & Ops</p>
                        <SidebarItem id="exams" label="Exams & Evaluation" icon={FileTextIcon} onClick={() => handleSectionChange('exams')} active={activeSection === 'exams'} />
                        <SidebarItem id="students" label="Student Progress" icon={UsersIcon} onClick={() => handleSectionChange('students')} active={activeSection === 'students'} />
                        <SidebarItem id="communication" label="Communication" icon={MessageIcon} onClick={() => handleSectionChange('communication')} active={activeSection === 'communication'} />
                        
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-4">Personal</p>
                        <SidebarItem id="leave" label="Leave Status" icon={ClockIcon} onClick={() => handleSectionChange('leave')} active={activeSection === 'leave'} />
                        <SidebarItem id="settings" label="Settings" icon={SettingsIcon} onClick={() => handleSectionChange('settings')} active={activeSection === 'settings'} />
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-border px-4">
                        <div className="flex items-center gap-3">
                            <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="sm" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{currentUser.department}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
            
            {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 md:px-10 lg:px-12 bg-background/50">
                {activeSection === 'dashboard' && <DashboardHome />}
                {activeSection === 'classes' && <ClassesView />}
                {activeSection === 'attendance' && <AttendanceView />}
                {activeSection === 'assignments' && <AssignmentsView />}
                {activeSection === 'materials' && <ResourcesView />}
                {activeSection === 'exams' && <PlaceholderView title="Exams & Evaluation" icon={FileTextIcon} />}
                {activeSection === 'students' && <StudentProgressView />}
                {activeSection === 'communication' && (
                    <div className="space-y-6 animate-fade-in">
                        <SectionHeader title="Communication" subtitle="Manage announcements and messages." />
                        <div className="bg-card p-8 rounded-2xl text-center border border-border shadow-sm">
                             <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MegaphoneIcon className="w-10 h-10 text-primary"/>
                             </div>
                             <h3 className="text-lg font-bold text-foreground">Post an Announcement</h3>
                             <p className="text-muted-foreground mb-6 max-w-md mx-auto">Send notifications to your classes or departments to keep everyone in the loop.</p>
                             <button onClick={() => setIsCreateNoticeModalOpen(true)} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform hover:scale-105">Create Notice</button>
                        </div>
                        
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="font-bold text-foreground mb-4">Previous Notices</h3>
                            {notices.filter(n => n.authorId === currentUser.id).length > 0 ? (
                                <div className="space-y-2">
                                    {notices.filter(n => n.authorId === currentUser.id).map(n => (
                                        <div key={n.id} className="p-4 bg-muted/30 rounded-xl border border-border flex justify-between items-center hover:bg-card hover:shadow-md transition-all">
                                            <div>
                                                <h5 className="font-bold text-foreground">{n.title}</h5>
                                                <p className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={() => onDeleteNotice(n.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground text-sm text-center py-4">No notices sent yet.</p>}
                        </div>
                    </div>
                )}
                {activeSection === 'leave' && <PlaceholderView title="Leave Management" icon={ClockIcon} message="Apply for leave and view your attendance record here." />}
                {activeSection === 'settings' && <PlaceholderView title="Settings" icon={SettingsIcon} message="Manage your profile and account preferences." />}
            </div>

            {isAddCourseModalOpen && <CreateCourseModal onClose={() => setIsAddCourseModalOpen(false)} onAddCourse={onCreateCourse} departmentOptions={collegeDepartments} />}
            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} departmentOptions={collegeDepartments} availableYears={allCollegeYears} />}
            {isCreateStudentModalOpen && <CreateStudentAccountModal isOpen={isCreateStudentModalOpen} onClose={() => setIsCreateStudentModalOpen(false)} department={currentUser.department} onCreateUser={onCreateUser} availableYears={myDepartmentYears} />}

        </div>
    );
};

const AcademicsPage: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath } = props;
    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };

    if (currentUser.tag === 'Student') {
        return (
             <div className="bg-background min-h-screen flex flex-col">
                <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
                <div className="flex-1">
                    <StudentAcademicsDashboard {...props} />
                </div>
            </div>
        );
    }
    
    // For Teacher, HOD, Director roles (Using the new layout, ignoring HOD specifics here as HOD has their own page, but fallback works)
    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <div className="flex-1">
                <FacultyAcademicsDashboard {...props} />
            </div>
        </div>
    );
};

export default AcademicsPage;
