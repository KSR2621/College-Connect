import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: Add 'AttendanceStatus' type to resolve 'unknown' type error in filter.
import type { User, Course, Notice, DepartmentChat, Message, AttendanceStatus, Feedback, College } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, TrashIcon, FilterIcon, MessageIcon, SendIcon, UsersIcon, CheckSquareIcon, StarIcon, UserPlusIcon, ClockIcon } from '../components/Icons';
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
    
    const inputClasses = "w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Add New Course</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="courseYear" className="block text-sm font-medium text-text-muted mb-1">Year</label>
                        <select id="courseYear" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClasses}>
                            {yearOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="courseDept" className="block text-sm font-medium text-text-muted mb-1">Department</label>
                        <select id="courseDept" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClasses}>
                            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="courseSubject" className="block text-sm font-medium text-text-muted mb-1">Subject / Course Name</label>
                        <input id="courseSubject" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Introduction to Programming" required className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor="courseDesc" className="block text-sm font-medium text-text-muted mb-1">Description (Optional)</label>
                        <textarea id="courseDesc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe the course..." rows={3} className={`${inputClasses} resize-none`}/>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-transform transform hover:scale-105">
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

// --- PAGE COMPONENTS ---
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

const NoticeEmptyState: React.FC<{ message: string; subMessage: string; }> = ({ message, subMessage }) => (
    <div className="text-center bg-card rounded-xl border-2 border-dashed border-border p-12 text-text-muted animate-fade-in">
        <MegaphoneIcon className="mx-auto h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">{message}</h3>
        <p className="mt-1 text-sm text-gray-500">{subMessage}</p>
    </div>
);

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

const DiscoverCourseCard: React.FC<{
  course: Course;
  faculty: User | undefined;
  onRequestToJoin: (courseId: string) => void;
  hasRequested: boolean;
}> = ({ course, faculty, onRequestToJoin, hasRequested }) => {
    return (
        <div className="bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
                <h4 className="font-bold text-card-foreground">{course.subject}</h4>
                <p className="text-sm text-text-muted">{course.department} &bull; {yearOptions.find(y => y.val === course.year)?.label}</p>
                {faculty && (
                    <div className="flex items-center space-x-2 mt-2 text-sm">
                        <Avatar src={faculty.avatarUrl} name={faculty.name} size="sm" />
                        <span className="text-text-muted">with {faculty.name}</span>
                    </div>
                )}
            </div>
            <button
                onClick={() => onRequestToJoin(course.id)}
                disabled={hasRequested}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-muted bg-primary/10 text-primary hover:bg-primary/20"
            >
                {hasRequested ? 'Request Sent' : 'Request to Join'}
            </button>
        </div>
    );
};

const StudentAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, courses, notices, users, onRequestToJoinCourse, onDeleteNotice } = props;
    const [activeTab, setActiveTab] = useState<'myCourses' | 'availableCourses' | 'noticeBoard'>('myCourses');
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
    
    const TABS = [
        { id: 'myCourses', label: 'My Courses', icon: BookOpenIcon },
        { id: 'availableCourses', label: 'Available Courses', icon: SearchIcon },
        { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon }
    ];

    return (
        <div>
            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-shrink-0 flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                            }`}
                        >
                            <tab.icon className="w-5 h-5"/>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'myCourses' && (
                    <CourseGrid courses={enrolledCourses} onNavigate={onNavigate} emptyState={{title: "You aren't enrolled in any courses.", subtitle:"Explore available courses to find ones to join."}}/>
                )}

                {activeTab === 'availableCourses' && (
                    <div className="space-y-4">
                         <h3 className="text-xl font-bold text-foreground">Available Courses for Your Branch & Year</h3>
                         <p className="text-text-muted -mt-3">Here are the courses available for your department and year of study. Request to join any that you're interested in.</p>
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input type="text" placeholder="Search courses by name or faculty..." value={discoverSearch} onChange={(e) => setDiscoverSearch(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        {filteredDiscoverableCourses.map(course => (
                            <DiscoverCourseCard 
                                key={course.id} 
                                course={course}
                                faculty={users[course.facultyId]}
                                onRequestToJoin={onRequestToJoinCourse}
                                hasRequested={course.pendingStudents?.includes(currentUser.id) || false}
                            />
                        ))}
                        {filteredDiscoverableCourses.length === 0 && (
                            <div className="text-center text-text-muted bg-card p-8 rounded-lg border border-border"><p>No available courses match your branch and year right now. Check back later!</p></div>
                        )}
                    </div>
                )}

                {activeTab === 'noticeBoard' && (
                     <div className="space-y-6">
                         <div className="p-4 bg-card rounded-lg border border-border">
                            <h3 className="text-xl font-bold text-foreground">Notice Board</h3>
                            <p className="text-text-muted mt-1 mb-4">Stay informed with the latest announcements relevant to you.</p>
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                <input type="text" placeholder="Search notices..." value={noticeSearch} onChange={(e) => setNoticeSearch(e.target.value)} className="w-full bg-input border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                            </div>
                        </div>
                        {filteredNotices.length > 0 ? (
                            filteredNotices.map(notice => (
                                <NoticeCard key={notice.id} notice={notice} author={users[notice.authorId]} currentUser={currentUser} onDelete={onDeleteNotice} />
                            ))
                        ) : (
                           <NoticeEmptyState message="No relevant notices found" subMessage="It's all quiet on the announcement front for now." />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
};

const FacultyAcademicsDashboard: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, courses, onCreateCourse, notices, users, onCreateNotice, onDeleteNotice, departmentChats, onSendDepartmentMessage, colleges } = props;
    
    if ((currentUser.tag === 'Teacher' || currentUser.tag === 'HOD/Dean') && currentUser.isApproved === false) {
        return (
            <div className="text-center bg-card rounded-lg border-2 border-dashed border-amber-400 p-12 text-text-muted animate-fade-in">
                <ClockIcon className="mx-auto h-16 w-16 text-amber-500" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">Account Pending Approval</h3>
                <p className="mt-2 max-w-md mx-auto">
                    Your account has been created but is awaiting approval from the director. You will gain full access to the academics dashboard once your role is confirmed.
                </p>
            </div>
        );
    }

    const userRole = currentUser.tag;

    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [noticeSearch, setNoticeSearch] = useState('');
    
    const collegeDepartments = useMemo(() => {
        const college = colleges.find(c => c.id === currentUser.collegeId);
        return college?.departments || [];
    }, [colleges, currentUser.collegeId]);
    
    const myCourses = useMemo(() => courses.filter(c => c.facultyId === currentUser.id), [courses, currentUser]);

    const coursesToDisplay = useMemo(() => {
        const filtered = courseSearch 
            ? courses.filter(c => c.subject.toLowerCase().includes(courseSearch.toLowerCase()) || c.department.toLowerCase().includes(courseSearch.toLowerCase()))
            : courses;

        switch(userRole) {
            case 'Teacher':
            case 'HOD/Dean':
                 return myCourses.filter(c => filtered.some(fc => fc.id === c.id));
            case 'Director': return filtered;
            default: return [];
        }
    }, [userRole, myCourses, courses, courseSearch]);

    const filteredNotices = useMemo(() => {
        if (!noticeSearch) return notices;
        const lowerCaseSearch = noticeSearch.toLowerCase();
        return notices.filter(notice =>
            notice.title.toLowerCase().includes(lowerCaseSearch) ||
            notice.content.toLowerCase().includes(lowerCaseSearch) ||
            (users[notice.authorId]?.name.toLowerCase() || '').includes(lowerCaseSearch)
        );
    }, [notices, noticeSearch, users]);

    return (
        <div>
            <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50"></div>
                <div className="relative z-10 text-center"><div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4"><BookOpenIcon className="w-8 h-8"/></div><h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Academics Dashboard</h1><p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">Manage courses, post notices, and engage with students.</p></div>
            </div>
            
            <div className="animate-fade-in space-y-8">
                <h2 className="text-2xl font-bold">My Courses</h2>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:flex-1 sm:max-w-md"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" /><input type="text" placeholder="Search my courses..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/></div>
                    <button onClick={() => setIsAddCourseModalOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Add New Course</button>
                </div>
                {coursesToDisplay.length > 0 ? (
                    <CourseGrid courses={coursesToDisplay} onNavigate={onNavigate} />
                ) : (
                    <div className="text-center bg-card rounded-lg border-2 border-dashed border-border p-12 text-text-muted animate-fade-in">
                        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-semibold text-foreground">You aren't assigned to any courses yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setIsAddCourseModalOpen(true)}
                                className="bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5"/>
                                Create Your First Course
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isAddCourseModalOpen && <CreateCourseModal onClose={() => setIsAddCourseModalOpen(false)} onAddCourse={onCreateCourse} departmentOptions={collegeDepartments} />}
            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} departmentOptions={collegeDepartments} />}
        </div>
    );
};

const AcademicsPage: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath } = props;
    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };

    if (currentUser.tag === 'Student') {
        return (
             <div className="bg-muted/50 min-h-screen">
                <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
                <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                     <StudentAcademicsDashboard {...props} />
                </main>
                <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
            </div>
        );
    }
    
    // For Teacher, HOD, Director roles
    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <FacultyAcademicsDashboard {...props} />
            </main>
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default AcademicsPage;
