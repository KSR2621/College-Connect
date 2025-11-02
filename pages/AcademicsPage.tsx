import React, { useState, useMemo, useRef } from 'react';
import type { User, Course, Notice } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { BookOpenIcon, CloseIcon, PlusIcon, ArrowRightIcon, SearchIcon, MegaphoneIcon, TrashIcon } from '../components/Icons';

// --- TYPES & CONSTANTS ---
const departmentOptions = ["Computer Science", "Mechanical Eng.", "Literature", "Mathematics", "Electrical Eng.", "Civil Eng."];
const yearOptions = [{ val: 1, label: "1st Year" }, { val: 2, label: "2nd Year" }, { val: 3, label: "3rd Year" }, { val: 4, label: "4th Year" }, { val: 5, label: "Graduate" }];

interface AcademicsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  courses: Course[];
  onCreateCourse: (course: Omit<Course, 'id' | 'facultyId'>) => void;
  notices: Notice[];
  users: { [key: string]: User };
  onCreateNotice: (noticeData: { title: string; content: string }) => void;
  onDeleteNotice: (noticeId: string) => void;
}

// --- MODALS & SUB-COMPONENTS ---
const CreateCourseModal: React.FC<{ onClose: () => void; onAddCourse: (course: Omit<Course, 'id' | 'facultyId'>) => void; }> = ({ onClose, onAddCourse }) => {
    const [year, setYear] = useState(yearOptions[0].val);
    const [department, setDepartment] = useState(departmentOptions[0]);
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

const CreateNoticeModal: React.FC<{ onClose: () => void; onCreateNotice: (noticeData: { title: string; content: string }) => void; }> = ({ onClose, onCreateNotice }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = () => setContent(editorRef.current?.innerHTML || '');
    const applyStyle = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
    };

    const handleSubmit = () => {
        if (!title.trim() || !editorRef.current?.innerText.trim()) {
            alert("Title and content cannot be empty.");
            return;
        }
        onCreateNotice({ title, content });
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
                        <div ref={editorRef} contentEditable onInput={handleInput} data-placeholder="Write your notice here..." className="w-full min-h-[250px] p-3 text-foreground bg-input focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted"/>
                    </div>
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

const NoticeBoard: React.FC<Pick<AcademicsPageProps, 'currentUser' | 'notices' | 'users' | 'onCreateNotice' | 'onDeleteNotice'>> = 
({ currentUser, notices, users, onCreateNotice, onDeleteNotice }) => {
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([]);
    
    const isFaculty = currentUser.tag === 'Faculty';
    
    const handleDeptToggle = (dept: string) => setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    const handleYearToggle = (year: number) => setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
    const clearFilters = () => { setSelectedDepartments([]); setSelectedYears([]); };

    const filteredNotices = useMemo(() => {
        const selectedYearLabels = yearOptions
            .filter(yo => selectedYears.includes(yo.val))
            .map(yo => yo.label.toLowerCase());

        return notices.filter(notice => {
            const combinedText = (notice.title + ' ' + notice.content).toLowerCase();

            const deptMatch = selectedDepartments.length === 0 || selectedDepartments.some(d => combinedText.includes(d.toLowerCase()));
            const yearMatch = selectedYearLabels.length === 0 || selectedYearLabels.some(label => combinedText.includes(label));
            
            return deptMatch && yearMatch;
        });
    }, [notices, selectedDepartments, selectedYears]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-foreground">Filter Notices</h3>
                    {(selectedDepartments.length > 0 || selectedYears.length > 0) && (
                        <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">Clear All</button>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-text-muted text-sm mb-2">By Department</h4>
                        <div className="flex flex-wrap gap-2">{departmentOptions.map(dept => (<button key={dept} onClick={() => handleDeptToggle(dept)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${selectedDepartments.includes(dept) ? 'bg-primary text-primary-foreground' : 'bg-muted text-text-muted hover:bg-border'}`}>{dept}</button>))}</div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-muted text-sm mb-2">By Year</h4>
                        <div className="flex flex-wrap gap-2">{yearOptions.map(year => (<button key={year.val} onClick={() => handleYearToggle(year.val)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${selectedYears.includes(year.val) ? 'bg-primary text-primary-foreground' : 'bg-muted text-text-muted hover:bg-border'}`}>{year.label}</button>))}</div>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                {isFaculty && <button onClick={() => setIsCreateNoticeModalOpen(true)} className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Post New Notice</button>}
                {filteredNotices.length > 0 ? (
                    filteredNotices.map(notice => (<NoticeCard key={notice.id} notice={notice} author={users[notice.authorId]} currentUser={currentUser} onDelete={onDeleteNotice} />))
                ) : (
                    <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                      <h3 className="text-lg font-semibold text-foreground">No notices found</h3>
                      <p className="mt-2">Try adjusting your filters or check back later.</p>
                    </div>
                )}
            </div>
            {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onCreateNotice={onCreateNotice} />}
        </div>
    );
};

const NoticeCard: React.FC<{ notice: Notice; author: User | undefined; currentUser: User; onDelete: (noticeId: string) => void; }> = ({ notice, author, currentUser, onDelete }) => {
    const canDelete = notice.authorId === currentUser.id || currentUser.isAdmin;
    return (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden animate-fade-in">
            <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold text-foreground flex-1">{notice.title}</h3>
                    {canDelete && <button onClick={() => onDelete(notice.id)} className="text-destructive/70 hover:text-destructive"><TrashIcon className="w-5 h-5"/></button>}
                </div>
                {author && (
                    <div className="flex items-center space-x-2 mt-2 text-sm text-text-muted">
                        <Avatar src={author.avatarUrl} name={author.name} size="sm" />
                        <span>{author.name}</span>
                        <span>&bull;</span>
                        <span>{new Date(notice.timestamp).toLocaleDateString()}</span>
                    </div>
                )}
                <div className="prose prose-sm max-w-none mt-4 text-card-foreground" dangerouslySetInnerHTML={{ __html: notice.content }} />
            </div>
        </div>
    );
};


const AcademicsPage: React.FC<AcademicsPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, courses, onCreateCourse } = props;
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };
    const userRole = currentUser.tag;

    // --- Student-specific state and logic ---
    const [studentActiveTab, setStudentActiveTab] = useState<'myCourses' | 'discover' | 'noticeBoard'>('myCourses');
    const { enrolledCourses, discoverableCourses } = useMemo(() => {
        if (userRole !== 'Student') return { enrolledCourses: [], discoverableCourses: [] };
        const enrolled = courses.filter(c => c.students?.includes(currentUser.id));
        const discoverable = courses.filter(c => !c.students?.includes(currentUser.id) && !c.pendingStudents?.includes(currentUser.id));
        const filteredDiscoverable = discoverable.filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || c.department.toLowerCase().includes(searchTerm.toLowerCase()));
        return { enrolledCourses: enrolled, discoverableCourses: filteredDiscoverable };
    }, [courses, currentUser, searchTerm, userRole]);

    // --- Faculty-specific state and logic ---
    const [facultyActiveTab, setFacultyActiveTab] = useState<'courses' | 'noticeBoard'>('courses');
    const { myCourses, otherCourses } = useMemo(() => {
        if (userRole !== 'Faculty') return { myCourses: [], otherCourses: [] };
        const filtered = courses.filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || c.department.toLowerCase().includes(searchTerm.toLowerCase()));
        const my = filtered.filter(c => c.facultyId === currentUser.id);
        const others = filtered.filter(c => c.facultyId !== currentUser.id);
        return { myCourses: my, otherCourses: others };
    }, [courses, currentUser, searchTerm, userRole]);
    
    // --- Generic course list for others (Alumni) ---
    const browsableCourses = useMemo(() => {
        if (userRole === 'Student' || userRole === 'Faculty') return [];
        return courses.filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || c.department.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [courses, searchTerm, userRole]);
     const [otherUserActiveTab, setOtherUserActiveTab] = useState<'courses' | 'noticeBoard'>('courses');

    const renderTabs = (tabs: {id: string, label: string, icon: React.FC<any>}[], activeTab: string, setActiveTab: (id: string) => void) => (
        <div className="border-b border-border flex justify-center mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                        <tab.icon className="w-5 h-5"/><span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
    
    const renderCourseGrid = (courseList: Course[], emptyMessage: {title: string, subtitle: string}) => (
        courseList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseList.map(course => <CourseCard key={course.id} course={course} onNavigate={onNavigate} />)}
            </div>
        ) : (
            <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                <h3 className="text-lg font-semibold text-foreground">{emptyMessage.title}</h3>
                <p className="mt-2">{emptyMessage.subtitle}</p>
            </div>
        )
    );

    const renderHeader = () => (
         <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50"></div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4"><BookOpenIcon className="w-8 h-8"/></div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Academics Portal</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                    {userRole === 'Faculty' ? "Manage courses, post notices, and engage with students." : "Access materials, view notices, and stay informed."}
                </p>
            </div>
        </div>
    );

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                {renderHeader()}

                {/* STUDENT VIEW */}
                {userRole === 'Student' && (
                    <>
                        {renderTabs([
                            { id: 'myCourses', label: 'My Courses', icon: BookOpenIcon },
                            { id: 'discover', label: 'Discover', icon: SearchIcon },
                            { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon }
                        ], studentActiveTab, (id) => setStudentActiveTab(id as any))}

                        {studentActiveTab === 'myCourses' && renderCourseGrid(enrolledCourses, { title: "You are not enrolled in any courses.", subtitle: "Go to the Discover tab to find courses to join." })}
                        
                        {studentActiveTab === 'discover' && (
                             <div className="animate-fade-in">
                                <div className="relative w-full max-w-md mx-auto mb-6">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input type="text" placeholder="Search for new courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                                </div>
                                {renderCourseGrid(discoverableCourses, { title: "No other courses available.", subtitle: "Check back later for new offerings." })}
                            </div>
                        )}

                        {studentActiveTab === 'noticeBoard' && <NoticeBoard {...props} />}
                    </>
                )}

                {/* FACULTY VIEW */}
                {userRole === 'Faculty' && (
                    <>
                        {renderTabs([
                            { id: 'courses', label: 'Courses', icon: BookOpenIcon },
                            { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon }
                        ], facultyActiveTab, (id) => setFacultyActiveTab(id as any))}
                        
                        {facultyActiveTab === 'courses' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="relative w-full sm:flex-1 sm:max-w-md">
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                        <input type="text" placeholder="Search all courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                                    </div>
                                    <button onClick={() => setIsAddCourseModalOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Add New Course</button>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">My Courses</h2>
                                    {renderCourseGrid(myCourses, { title: "You haven't created any courses yet.", subtitle: "Click 'Add New Course' to get started."})}
                                </div>
                                 <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">Browse Other Courses</h2>
                                    {renderCourseGrid(otherCourses, { title: "No other faculty members have created courses.", subtitle: ""})}
                                </div>
                            </div>
                        )}
                        {facultyActiveTab === 'noticeBoard' && <NoticeBoard {...props} />}
                    </>
                )}
                
                {/* GENERIC/ALUMNI VIEW */}
                {(userRole !== 'Student' && userRole !== 'Faculty') && (
                     <>
                        {renderTabs([
                            { id: 'courses', label: 'Browse Courses', icon: BookOpenIcon },
                            { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon }
                        ], otherUserActiveTab, (id) => setOtherUserActiveTab(id as any))}

                        {otherUserActiveTab === 'courses' && (
                             <div className="animate-fade-in">
                                <div className="relative w-full max-w-md mx-auto mb-6">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input type="text" placeholder="Search all courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                                </div>
                                {renderCourseGrid(browsableCourses, { title: "No courses found.", subtitle: "There are currently no courses to display." })}
                            </div>
                        )}
                         {otherUserActiveTab === 'noticeBoard' && <NoticeBoard {...props} />}
                    </>
                )}

            </main>

            {isAddCourseModalOpen && <CreateCourseModal onClose={() => setIsAddCourseModalOpen(false)} onAddCourse={onCreateCourse} />}
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default AcademicsPage;