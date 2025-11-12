import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Post, Group, ReactionType, Course, Notice, UserTag, AttendanceStatus, Feedback } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import ProfilePage from './ProfilePage';
import PostCard from '../components/PostCard';
import GroupCard from '../components/GroupCard';
import { auth } from '../firebase';
import { TrashIcon, UsersIcon, PostIcon, StarIcon, UserPlusIcon, BookOpenIcon, BuildingIcon, MegaphoneIcon, CloseIcon, SearchIcon, PlusIcon, CheckSquareIcon, ClockIcon, ArrowRightIcon, ChartBarIcon, HomeIcon, ArrowLeftIcon, MessageIcon, SendIcon, NotebookIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import { departmentOptions, yearOptions } from '../constants';

interface DirectorPageProps {
    currentUser: User;
    allUsers: User[];
    allPosts: Post[];
    allGroups: Group[];
    allCourses: Course[];
    usersMap: { [key: string]: User };
    notices: Notice[];
    onNavigate: (path: string) => void;
    currentPath: string;
    onDeleteUser: (userId: string) => void;
    onDeletePost: (postId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onApproveHodRequest: (hodId: string) => void;
    onDeclineHodRequest: (hodId: string) => void;
    onApproveTeacherRequest: (teacherId: string) => void;
    onDeclineTeacherRequest: (teacherId: string) => void;
    onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
    onDeleteNotice: (noticeId: string) => void;
    onCreateCourse: (courseData: Omit<Course, 'id' | 'facultyId'>) => void;
    onCreateUser: (userData: Omit<User, 'id'>) => Promise<void>;
    onDeleteCourse: (courseId: string) => void;
    postCardProps: {
        onReaction: (postId: string, reaction: ReactionType) => void;
        onAddComment: (postId: string, text: string) => void;
        onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
        onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
        onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
        onToggleSavePost: (postId: string) => void;
        onDeletePost: (postId: string) => void;
        groups: Group[];
    };
}


// --- SHARED COMPONENTS ---
const StatCard: React.FC<{ title: string; value: number | string; icon: React.FC<any>; subtitle?: string; onClick?: () => void }> = ({ title, value, icon: Icon, subtitle, onClick }) => {
    const cardContent = (
        <>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-muted">{title}</p>
                <Icon className="w-6 h-6 text-primary"/>
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
        </>
    );

    if (onClick) {
        return (
            <button 
                onClick={onClick}
                className="bg-card dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left w-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/50"
            >
                {cardContent}
            </button>
        );
    }

    return (
        <div className="bg-card dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-border dark:border-slate-700">
            {cardContent}
        </div>
    );
};

const DirectorAttendanceSection: React.FC<DirectorPageProps & { onBack: () => void }> = (props) => {
    const { allCourses, usersMap, onBack } = props;
    const [path, setPath] = useState<{ department?: string, courseId?: string }>({});

    const goBack = () => {
        if (path.courseId) {
            setPath({ department: path.department });
        } else if (path.department) {
            setPath({});
        } else {
            onBack();
        }
    };

    const todayTimestamp = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
    }, []);

    const departmentAttendanceStats = useMemo(() => {
        return departmentOptions.map(dept => {
            let totalPresent = 0;
            let totalStudents = 0;
            const coursesInDept = allCourses.filter(c => c.department === dept);

            coursesInDept.forEach(course => {
                const todaysRecord = course.attendanceRecords?.find(r => {
                    const recordDate = new Date(r.date);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.getTime() === todayTimestamp;
                });

                if (todaysRecord) {
                    totalPresent += Object.values(todaysRecord.records).filter((rec: { status: AttendanceStatus }) => rec.status === 'present').length;
                    totalStudents += Object.keys(todaysRecord.records).length;
                }
            });
            
            const percentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : null;
            return { name: dept, percentage, totalPresent, totalStudents };
        });
    }, [allCourses, todayTimestamp]);

    const coursesWithTodayAttendance = useMemo(() => {
        if (!path.department) return [];
        
        return allCourses
            .filter(c => c.department === path.department)
            .map(course => {
                const todaysRecord = course.attendanceRecords?.find(r => {
                    const recordDate = new Date(r.date);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.getTime() === todayTimestamp;
                });
                if (!todaysRecord) return null;

                const present = Object.values(todaysRecord.records).filter((rec: { status: AttendanceStatus }) => rec.status === 'present').length;
                const total = Object.keys(todaysRecord.records).length;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                return { ...course, attendance: { present, total, percentage } };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null)
            .sort((a,b) => b.attendance.percentage - a.attendance.percentage);
    }, [allCourses, path.department, todayTimestamp]);
    
    const selectedCourseAttendance = useMemo(() => {
        if (!path.courseId) return null;
        const course = allCourses.find(c => c.id === path.courseId);
        if (!course) return null;

        const todaysRecord = course.attendanceRecords?.find(r => {
            const recordDate = new Date(r.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === todayTimestamp;
        });
        if (!todaysRecord) return null;
        
        const studentRecords = Object.entries(todaysRecord.records).map(([studentId, record]) => {
            const student = usersMap[studentId];
            return { student, record };
        }).filter(item => !!item.student) as { student: User, record: { status: AttendanceStatus, note: string } }[];

        return { course, studentRecords };
    }, [allCourses, usersMap, path.courseId, todayTimestamp]);

    const statusInfo: Record<AttendanceStatus, { icon: React.FC<any>, text: string, classes: string }> = {
        present: { icon: CheckCircleIcon, text: 'Present', classes: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400' },
        absent: { icon: XCircleIcon, text: 'Absent', classes: 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400' },
        late: { icon: ClockIcon, text: 'Late', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400' },
    };

    if (!path.department) {
        return (
            <div>
                <button onClick={goBack} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Dashboard</button>
                <h1 className="text-3xl font-bold text-foreground mb-6">Today's Attendance by Department</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentAttendanceStats.map(dept => (
                        <button key={dept.name} onClick={() => setPath({ department: dept.name })} className="p-4 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left hover:border-primary hover:text-primary transition-colors">
                            <p className="font-bold text-lg">{dept.name}</p>
                            {dept.percentage !== null ? (
                                <p className="text-3xl font-bold mt-2">{dept.percentage}%</p>
                            ) : (
                                <p className="text-lg text-text-muted mt-2">No Record</p>
                            )}
                            <p className="text-xs text-text-muted">{dept.totalPresent} / {dept.totalStudents} students</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (!path.courseId) {
        return (
            <div>
                <button onClick={goBack} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Departments</button>
                <h1 className="text-3xl font-bold text-foreground mb-6">Today's Attendance for <span className="text-primary">{path.department}</span></h1>
                <div className="space-y-3">
                    {coursesWithTodayAttendance.map(course => (
                        <button key={course.id} onClick={() => setPath({ ...path, courseId: course.id })} className="w-full p-4 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left hover:border-primary transition-colors flex justify-between items-center">
                            <div>
                                <p className="font-bold">{course.subject}</p>
                                <p className="text-sm text-text-muted">Faculty: {usersMap[course.facultyId]?.name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-2xl text-primary">{course.attendance.percentage}%</p>
                                <p className="text-xs text-text-muted">{course.attendance.present} / {course.attendance.total} students</p>
                            </div>
                        </button>
                    ))}
                    {coursesWithTodayAttendance.length === 0 && <p className="text-text-muted text-center p-8">No courses in this department had attendance taken today.</p>}
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <button onClick={goBack} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Courses</button>
            {selectedCourseAttendance ? (
                <>
                    <h1 className="text-3xl font-bold text-foreground mb-1">Attendance for <span className="text-primary">{selectedCourseAttendance.course.subject}</span></h1>
                    <p className="text-text-muted mb-6">As of {new Date(todayTimestamp).toLocaleDateString()}</p>
                    <div className="bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 p-4 space-y-2">
                        {selectedCourseAttendance.studentRecords.map(({ student, record }) => {
                            const { icon: Icon, text, classes } = statusInfo[record.status] || statusInfo.absent;
                            return (
                                <div key={student.id} className="p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3"><Avatar src={student.avatarUrl} name={student.name} size="md" /><p className="font-semibold">{student.name}</p></div>
                                        <div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${classes}`}><Icon className="w-4 h-4" /><span>{text}</span></div>
                                    </div>
                                    {record.note && <p className="mt-1 text-xs text-text-muted border-l-2 border-border dark:border-slate-600 ml-5 pl-2">Note: {record.note}</p>}
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (
                <p className="text-text-muted text-center p-8">Could not load attendance data for this course.</p>
            )}
        </div>
    );
};


const BarChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700 h-full flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
            <div className="flex-1 flex items-end gap-2 text-center">{data.map(({ label, value }) => (
                <div key={label} className="flex-1 flex flex-col items-center justify-end">
                    <div className="text-xs font-bold text-primary">{value}</div>
                    <div className="w-full h-32 bg-slate-100 dark:bg-slate-700 rounded-t-md overflow-hidden mt-1 group relative">
                        <div className="absolute bottom-0 w-full bg-primary transition-all duration-500" style={{ height: `${(value / maxValue) * 100}%` }}></div>
                    </div>
                    <div className="text-xs font-medium text-text-muted mt-1 truncate">{label}</div>
                </div>))}
            </div>
        </div>
    );
};
const NoticeCard: React.FC<{ notice: Notice; author: User | undefined; onDelete: (noticeId: string) => void; }> = ({ notice, author, onDelete }) => (
    <div className="bg-card dark:bg-slate-800 rounded-xl shadow-card border border-border dark:border-slate-700 flex overflow-hidden group">
        <div className="w-2 flex-shrink-0 bg-gradient-to-b from-primary to-blue-400"></div>
        <div className="flex-1 p-5">
            <div className="flex justify-between items-start gap-4"><h3 className="text-xl font-bold text-foreground flex-1">{notice.title}</h3><button onClick={() => onDelete(notice.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"><TrashIcon className="w-5 h-5"/></button></div>
            {author && <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-border/50 text-sm text-text-muted"><Avatar src={author.avatarUrl} name={author.name} size="sm" /><div><span className="font-semibold text-foreground">{author.name}</span><span className="mx-1">&bull;</span><span>{new Date(notice.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div></div>}
            <div className="prose prose-sm dark:prose-invert max-w-none mt-4 text-card-foreground" dangerouslySetInnerHTML={{ __html: notice.content }} />
        </div>
    </div>
);
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

// --- TAB SECTIONS ---
const DirectorOverviewSection: React.FC<DirectorPageProps & { onViewChange: (view: any, filter?: any) => void }> = (props) => {
    const { allUsers, allCourses, onApproveHodRequest, onDeclineHodRequest, onApproveTeacherRequest, onDeclineTeacherRequest, notices, onViewChange } = props;
     const analytics = useMemo(() => {
        const allStudents = allUsers.filter(u => u.tag === 'Student');
        const allTeachers = allUsers.filter(u => (u.tag === 'Teacher' || u.tag === 'HOD/Dean'));
        const studentCountByYear = allStudents.reduce((acc, student) => { const year = student.yearOfStudy || 1; acc[year] = (acc[year] || 0) + 1; return acc; }, {} as Record<number, number>);
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTimestamp = todayStart.getTime();

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayTimestamp = yesterdayStart.getTime();

        let todayPresent = 0;
        let todayTotal = 0;
        let yesterdayPresent = 0;
        let yesterdayTotal = 0;

        allCourses.forEach(course => {
            if (!course.attendanceRecords) return;
            course.attendanceRecords.forEach(record => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0, 0, 0, 0);
                const recordTimestamp = recordDate.getTime();
                
                const presentCount = Object.values(record.records).filter((r: { status: AttendanceStatus }) => r.status === 'present').length;
                const totalCount = Object.keys(record.records).length;

                if (recordTimestamp === todayTimestamp) {
                    todayPresent += presentCount;
                    todayTotal += totalCount;
                } else if (recordTimestamp === yesterdayTimestamp) {
                    yesterdayPresent += presentCount;
                    yesterdayTotal += totalCount;
                }
            });
        });

        const todayAttendancePercent = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;
        const yesterdayAttendancePercent = yesterdayTotal > 0 ? Math.round((yesterdayPresent / yesterdayTotal) * 100) : 0;
        
        return {
            totalStudents: allStudents.length,
            totalTeachers: allTeachers.filter(u => u.isApproved).length,
            totalCourses: allCourses.length,
            studentDistribution: Object.entries(studentCountByYear).map(([year, count]) => ({ label: `Year ${year}`, value: count as number })),
            pendingHods: allUsers.filter(u => u.tag === 'HOD/Dean' && !u.isApproved),
            pendingTeachers: allUsers.filter(u => u.tag === 'Teacher' && !u.isApproved),
            todayPresent,
            todayAttendancePercent,
            yesterdayPresent,
            yesterdayAttendancePercent
        };
    }, [allUsers, allCourses]);

    const recentNotices = useMemo(() => [...notices].sort((a,b) => b.timestamp - a.timestamp).slice(0, 3), [notices]);
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Students" value={analytics.totalStudents} icon={UsersIcon} onClick={() => onViewChange('users', 'Student')} />
                <StatCard title="Active Teachers" value={analytics.totalTeachers} icon={UsersIcon} onClick={() => onViewChange('users', 'Teacher')} />
                <StatCard title="Total Courses" value={analytics.totalCourses} icon={BookOpenIcon} onClick={() => onViewChange('academics')} />
                <StatCard title="Departments" value={departmentOptions.length} icon={BuildingIcon} onClick={() => onViewChange('departments')} />
                <StatCard title="Today's Attendance" value={`${analytics.todayAttendancePercent}%`} icon={CheckSquareIcon} subtitle={`${analytics.todayPresent} students present`} onClick={() => props.onViewChange('attendance')} />
                <StatCard title="Yesterday's Attendance" value={`${analytics.yesterdayAttendancePercent}%`} icon={ClockIcon} subtitle={`${analytics.yesterdayPresent} students present`} />
            </div>
            {(analytics.pendingHods.length > 0 || analytics.pendingTeachers.length > 0) && (
                <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-bold text-lg mb-3 text-blue-800 dark:text-blue-200">Pending Approvals</h3>
                    {analytics.pendingHods.map((hod: User) => (<div key={hod.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-md mb-2"><div><p className="font-bold">{hod.name} (HOD)</p><p className="text-xs">{hod.department}</p></div><div className="flex gap-2"><button onClick={() => onApproveHodRequest(hod.id)} className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Approve</button><button onClick={() => onDeclineHodRequest(hod.id)} className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Decline</button></div></div>))}
                    {analytics.pendingTeachers.map((teacher: User) => (<div key={teacher.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-md mb-2"><div><p className="font-bold">{teacher.name}</p><p className="text-xs">{teacher.department}</p></div><div className="flex gap-2"><button onClick={() => onApproveTeacherRequest(teacher.id)} className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Approve</button><button onClick={() => onDeclineTeacherRequest(teacher.id)} className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Decline</button></div></div>))}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2"><BarChart title="Student Distribution" data={analytics.studentDistribution} /></div>
                <div className="lg:col-span-3 bg-card dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-border dark:border-slate-700"><h3 className="text-lg font-bold text-foreground mb-4">Recent Announcements</h3><div className="space-y-4">{recentNotices.map(notice => <NoticeCard key={notice.id} notice={notice} author={props.usersMap[notice.authorId]} onDelete={props.onDeleteNotice} />)}</div></div>
            </div>
        </div>
    );
};

const DirectorDepartmentSection: React.FC<DirectorPageProps> = (props) => {
    const { allUsers, allCourses } = props;
    const departmentStats = useMemo(() => {
        return departmentOptions.map(dept => {
            const students = allUsers.filter(u => u.department === dept && u.tag === 'Student');
            const teachers = allUsers.filter(u => u.department === dept && (u.tag === 'Teacher' || u.tag === 'HOD/Dean'));
            const courses = allCourses.filter(c => c.department === dept);
            const feedbacks = courses.flatMap(c => c.feedback || []);
            const avgFeedback = feedbacks.length > 0 ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length : 0;
            return { name: dept, studentCount: students.length, teacherCount: teachers.length, courseCount: courses.length, avgFeedback };
        });
    }, [allUsers, allCourses]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-6">Department Management</h1>
            <div className="bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase bg-slate-50 dark:bg-slate-700"><tr><th className="px-6 py-3">Department</th><th className="px-6 py-3 text-center">Students</th><th className="px-6 py-3 text-center">Teachers</th><th className="px-6 py-3 text-center">Courses</th><th className="px-6 py-3 text-center">Avg. Feedback</th></tr></thead>
                    <tbody>{departmentStats.sort((a,b) => b.studentCount - a.studentCount).map((dept) => (
                        <tr key={dept.name} className="border-b dark:border-slate-700"><td className="px-6 py-4 font-medium">{dept.name}</td><td className="px-6 py-4 text-center">{dept.studentCount}</td><td className="px-6 py-4 text-center">{dept.teacherCount}</td><td className="px-6 py-4 text-center">{dept.courseCount}</td><td className="px-6 py-4 text-center font-semibold text-amber-600">{dept.avgFeedback > 0 ? `${dept.avgFeedback.toFixed(1)} ★` : 'N/A'}</td></tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
};

const DirectorUserManagementSection: React.FC<{
    allUsers: User[];
    onDeleteUser: (id: string) => void;
    onSetViewingUser: (id: string) => void;
    onBackToDashboard: () => void;
    initialRoleFilter: 'Student' | 'Teacher';
}> = ({ allUsers, onDeleteUser, onSetViewingUser, onBackToDashboard, initialRoleFilter }) => {
    const [path, setPath] = useState<{ department?: string, year?: number }>({});

    const goBack = () => {
        if (path.year) {
            setPath({ department: path.department });
        } else if (path.department) {
            setPath({});
        } else {
            onBackToDashboard();
        }
    };

    const departmentStats = useMemo(() => {
        const targetRoles: UserTag[] = initialRoleFilter === 'Student' ? ['Student'] : ['Teacher', 'HOD/Dean'];
        return departmentOptions.map(dept => {
            const usersInDept = allUsers.filter(u => u.department === dept && targetRoles.includes(u.tag));
            return { name: dept, count: usersInDept.length };
        });
    }, [allUsers, initialRoleFilter]);

    const yearStats = useMemo(() => {
        if (!path.department) return [];
        return yearOptions.map(year => {
            const usersInYear = allUsers.filter(u => u.department === path.department && u.yearOfStudy === year.val && u.tag === 'Student');
            return { name: year.label, value: year.val, count: usersInYear.length };
        });
    }, [allUsers, path.department]);

    const studentList = useMemo(() => {
        if (!path.department || !path.year) return [];
        return allUsers.filter(u => u.department === path.department && u.yearOfStudy === path.year && u.tag === 'Student');
    }, [allUsers, path.department, path.year]);

    const teacherList = useMemo(() => {
        if (!path.department || initialRoleFilter !== 'Teacher') return [];
        return allUsers.filter(u => u.department === path.department && (u.tag === 'Teacher' || u.tag === 'HOD/Dean'));
    }, [allUsers, path.department, initialRoleFilter]);

    if (!path.department) {
        return (
            <div>
                <button onClick={onBackToDashboard} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Dashboard</button>
                <h1 className="text-3xl font-bold text-foreground mb-6">Browse {initialRoleFilter}s by Department</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentStats.map(dept => (
                        <button key={dept.name} onClick={() => setPath({ department: dept.name })} className="p-6 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left font-bold text-lg hover:border-primary hover:text-primary transition-colors flex justify-between items-center">
                            <span>{dept.name}</span>
                            <span className="text-base font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{dept.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (initialRoleFilter === 'Student' && !path.year) {
        return (
            <div>
                 <button onClick={goBack} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Departments</button>
                 <h1 className="text-3xl font-bold text-foreground mb-6">Browse Students in <span className="text-primary">{path.department}</span></h1>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {yearStats.map(year => (
                         <button key={year.value} onClick={() => setPath({ ...path, year: year.value })} className="p-6 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left font-bold text-lg hover:border-primary hover:text-primary transition-colors flex justify-between items-center">
                             <span>{year.name}</span>
                              <span className="text-base font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{year.count}</span>
                         </button>
                     ))}
                 </div>
            </div>
        );
    }
    
    const usersToList = initialRoleFilter === 'Student' ? studentList : teacherList;
    return (
        <div>
            <button onClick={goBack} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to {initialRoleFilter === 'Student' ? 'Years' : 'Departments'}</button>
            <h1 className="text-3xl font-bold text-foreground mb-6">
                {initialRoleFilter}s in <span className="text-primary">{path.department}</span>
                {initialRoleFilter === 'Student' && path.year && ` - ${yearOptions.find(y => y.val === path.year)?.label}`}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usersToList.map(user => (
                    <div key={user.id} className="bg-card dark:bg-slate-800 p-3 rounded-lg border border-border dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3"><Avatar src={user.avatarUrl} name={user.name} size="md"/><div><p className="font-bold">{user.name}</p><p className="text-sm text-text-muted">{user.tag} &bull; {user.email}</p></div></div>
                        <div className="flex gap-2">
                            <button onClick={() => onSetViewingUser(user.id)} className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-foreground py-1.5 px-3 rounded-full">View</button>
                            {user.tag !== 'Director' && <button onClick={() => onDeleteUser(user.id)} className="text-xs font-semibold bg-red-100 text-red-800 px-3 py-1.5 rounded-full">Delete</button>}
                        </div>
                    </div>
                ))}
                {usersToList.length === 0 && <p className="text-text-muted md:col-span-2 text-center">No {initialRoleFilter.toLowerCase()}s found for this selection.</p>}
            </div>
        </div>
    );
};

const DirectorContentModerationSection: React.FC<DirectorPageProps> = (props) => {
    const { allPosts, allGroups, usersMap, onNavigate, ...handlers } = props;
    const [subTab, setSubTab] = useState<'posts' | 'groups'>('posts');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPosts = useMemo(() => allPosts.filter(p => p.content.toLowerCase().includes(searchTerm.toLowerCase())), [allPosts, searchTerm]);
    const filteredGroups = useMemo(() => allGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())), [allGroups, searchTerm]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
            <div className="flex border-b border-border"><button onClick={() => setSubTab('posts')} className={`px-4 py-2 font-semibold ${subTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}>Posts</button><button onClick={() => setSubTab('groups')} className={`px-4 py-2 font-semibold ${subTab === 'groups' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}>Groups</button></div>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Search ${subTab}...`} className="w-full p-3 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg"/>
            {subTab === 'posts' && <div className="space-y-4">{filteredPosts.map(post => <PostCard key={post.id} post={post} author={usersMap[post.authorId]} currentUser={props.currentUser} users={usersMap} onNavigate={onNavigate} {...props.postCardProps} />)}</div>}
            {subTab === 'groups' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredGroups.map(group => (<div key={group.id} className="bg-card dark:bg-slate-800 p-3 rounded-lg border border-border dark:border-slate-700 flex justify-between items-center"><div><p className="font-bold">{group.name}</p><p className="text-sm text-text-muted">{group.memberIds.length} members</p></div><div className="flex gap-2"><button onClick={() => onNavigate(`#/groups/${group.id}`)} className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-foreground py-1.5 px-3 rounded-full">View</button><button onClick={() => handlers.onDeleteGroup(group.id)} className="text-xs font-semibold bg-red-100 text-red-800 px-3 py-1.5 rounded-full">Delete</button></div></div>))}</div>}
        </div>
    );
};

const DirectorAnnouncementsSection: React.FC<{ notices: Notice[], usersMap: { [key: string]: User }, onCreateNotice: any, onDeleteNotice: any }> = ({ notices, usersMap, onCreateNotice, onDeleteNotice }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Campus Announcements</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/>Post New Notice</button>
            </div>
            {notices.map(notice => <NoticeCard key={notice.id} notice={notice} author={usersMap[notice.authorId]} onDelete={onDeleteNotice} />)}
            {notices.length === 0 && <p className="text-center text-text-muted py-8">No campus-wide notices have been posted yet.</p>}
            {isCreateModalOpen && <CreateNoticeModal onClose={() => setIsCreateModalOpen(false)} onCreateNotice={onCreateNotice} />}
        </div>
    );
};

// --- HOD DASHBOARD COMPONENTS (for Director's use) ---

const DepartmentDashboard: React.FC<DirectorPageProps & { department: string }> = (props) => {
    const { currentUser, allCourses: courses, allUsers: usersArray, onNavigate, onCreateCourse, onCreateUser, onApproveTeacherRequest, onDeclineTeacherRequest, department, ...rest } = props;
    const users = props.usersMap;
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'teachers' | 'students' | 'departmentChat' | 'noticeBoard'>('overview');
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [addUserModalState, setAddUserModalState] = useState<{ isOpen: boolean; role: 'Student' | 'Teacher' | null }>({ isOpen: false, role: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    const departmentAnalytics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        const allDepartmentCourses = courses.filter(c => c.department === department);
        const allUsersInDept = Object.values(users).filter((u: User) => u.department === department);
        const teacherLikeUsers = allUsersInDept.filter((u: User) => u.tag === 'Teacher' || u.tag === 'HOD/Dean');
        const pendingTeachers = teacherLikeUsers.filter((t: User) => t.isApproved === false);
        const allTeachersInDept = teacherLikeUsers.filter((t: User) => t.isApproved !== false);
        const teacherIds = new Set(allTeachersInDept.map((t: User) => t.id));
        
        const yearFilteredCourses = selectedYear === 'all'
            ? allDepartmentCourses
            : allDepartmentCourses.filter(c => c.year === selectedYear);

        const studentIds = new Set<string>();
        let totalPendingRequests = 0;
        const allFeedbacks: Feedback[] = [];
        yearFilteredCourses.forEach(course => {
            course.students?.forEach(sId => studentIds.add(sId));
            totalPendingRequests += course.pendingStudents?.length || 0;
            if (course.feedback) allFeedbacks.push(...course.feedback);
        });

        const allStudentsInDept = Array.from(studentIds).map(id => users[id]).filter(Boolean);
        return {
            totalCourses: yearFilteredCourses.length,
            totalStudents: studentIds.size,
            allStudentsInDept,
            totalPendingRequests,
            totalTeachers: teacherIds.size,
            allTeachersInDept,
            pendingTeachers,
        };
    }, [courses, department, users, selectedYear]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpenIcon },
        { id: 'courses', label: 'Courses', icon: BookOpenIcon },
        { id: 'teachers', label: 'Teachers', icon: UsersIcon },
        { id: 'students', label: 'Students', icon: UsersIcon },
        { id: 'departmentChat', label: 'Department Chat', icon: MessageIcon },
        { id: 'noticeBoard', label: 'Notice Board', icon: MegaphoneIcon },
    ];
    const yearFilters: (number | 'all')[] = ['all', 1, 2, 3, 4];
    
    return (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-foreground mb-4">{department} Department</h2>
             <div className="border-b border-border flex justify-center mb-6"><nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-shrink-0 flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}><tab.icon className="w-5 h-5"/><span>{tab.label}</span></button>
                ))}
            </nav></div>

            {activeTab !== 'departmentChat' && (
                <div className="my-6 p-2 bg-card rounded-lg border border-border flex flex-wrap items-center justify-center gap-2">
                    <span className="font-semibold text-sm mr-2 text-text-muted">Filter by Year:</span>
                    {yearFilters.map(year => (
                        <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${selectedYear === year ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-text-muted hover:bg-border'}`}>{year === 'all' ? 'All Years' : `${year}${['st','nd','rd','th'][year-1] || 'th'} Year`}</button>
                    ))}
                </div>
            )}
            
            <div className="animate-fade-in">
                {/* Content for tabs */}
            </div>
             {/* Modals */}
             <AddUserModal isOpen={addUserModalState.isOpen} onClose={() => setAddUserModalState({isOpen: false, role: null})} role={addUserModalState.role} department={department} onCreateUser={onCreateUser} />
        </div>
    );
};

const UserList: React.FC<{ users: User[]; onNavigate: (path: string) => void }> = ({ users, onNavigate }) => {
    if (users.length === 0) { return <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted"><p>No users found for the current filter.</p></div>; }
    return (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border"><div className="space-y-3">{users.map(user => (<div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => onNavigate(`#/profile/${user.id}`)}><div className="flex items-center space-x-3"><Avatar src={user.avatarUrl} name={user.name} size="md" /><div><p className="font-semibold text-card-foreground">{user.name}</p><p className="text-sm text-text-muted">{user.email}</p></div></div></div>))}</div></div>
    );
};

const DirectorAcademicsSection: React.FC<DirectorPageProps> = (props) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    if (!selectedDepartment) {
        return (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-foreground mb-6">Academics Management</h1>
                <p className="mb-4 text-text-muted">Select a department to view its detailed HOD dashboard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{departmentOptions.map(dept => (<button key={dept} onClick={() => setSelectedDepartment(dept)} className="p-6 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 text-left font-bold text-lg hover:border-primary hover:text-primary transition-colors flex justify-between items-center"><span>{dept}</span><ArrowRightIcon className="w-5 h-5" /></button>))}</div>
            </div>
        );
    }
    return (
        <div className="animate-fade-in">
            <button onClick={() => setSelectedDepartment(null)} className="flex items-center text-sm text-primary hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to All Departments</button>
            <DepartmentDashboard department={selectedDepartment} {...props} />
        </div>
    );
};

// --- MAIN DIRECTOR PAGE COMPONENT ---
const DirectorPage: React.FC<DirectorPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, allUsers, allPosts, allGroups, allCourses, usersMap, notices, ...handlers } = props;
    const [view, setView] = useState<'overview' | 'departments' | 'users' | 'content' | 'academics' | 'announcements' | 'attendance'>('overview');
    const [userManagementFilter, setUserManagementFilter] = useState<'Student' | 'Teacher' | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    
    const handleLogout = async () => { auth.signOut(); onNavigate('#/'); };
    
    const handleViewChange = (newView: any, filter?: any) => {
        setView(newView);
        if (newView === 'users' && filter) {
            setUserManagementFilter(filter);
        }
    };
    
    if (viewingUserId) { return <ProfilePage profileUserId={viewingUserId} currentUser={currentUser} users={usersMap} posts={allPosts} groups={allGroups} onNavigate={onNavigate} currentPath={currentPath} onDeletePost={handlers.onDeletePost} {...props.postCardProps} isAdminView={true} onBackToAdmin={() => setViewingUserId(null)} onAddPost={() => {}} onAddAchievement={() => {}} onAddInterest={() => {}} onUpdateProfile={() => {}} />; }
    
    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto pt-8 pb-20 md:pb-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <DirectorSidebar currentView={view} setView={setView} />
                    <div className="flex-1 min-w-0">
                        <div className="animate-fade-in">
                            {view === 'overview' && <DirectorOverviewSection onViewChange={handleViewChange} {...props} />}
                            {view === 'departments' && <DirectorDepartmentSection {...props} />}
                            {view === 'users' && userManagementFilter && <DirectorUserManagementSection allUsers={allUsers} onDeleteUser={handlers.onDeleteUser} onSetViewingUser={setViewingUserId} onBackToDashboard={() => setView('overview')} initialRoleFilter={userManagementFilter} />}
                            {view === 'content' && <DirectorContentModerationSection {...props} />}
                            {view === 'academics' && <DirectorAcademicsSection {...props} />}
                            {view === 'announcements' && <DirectorAnnouncementsSection notices={notices} usersMap={usersMap} onCreateNotice={handlers.onCreateNotice} onDeleteNotice={handlers.onDeleteNotice} />}
                            {view === 'attendance' && <DirectorAttendanceSection onBack={() => setView('overview')} {...props} />}
                        </div>
                    </div>
                </div>
            </main>
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

// --- NAVIGATION ---
const DirectorSidebar: React.FC<{ currentView: string; setView: (view: any) => void }> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: HomeIcon },
        { id: 'departments', label: 'Departments', icon: BuildingIcon },
        { id: 'users', label: 'User Management', icon: UsersIcon },
        { id: 'content', label: 'Content Moderation', icon: PostIcon },
        { id: 'academics', label: 'Academics', icon: BookOpenIcon },
        { id: 'announcements', label: 'Announcements', icon: MegaphoneIcon },
    ];
    return (
        <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 p-3">
                <h2 className="text-lg font-bold text-foreground px-3 mb-2">Command Center</h2>
                <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex-shrink-0 lg:flex-shrink flex items-center space-x-3 text-left p-3 rounded-md font-semibold text-sm transition-colors ${currentView === item.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted dark:hover:bg-slate-700'}`}>
                            <item.icon className="w-5 h-5"/>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
}

const CreateNoticeModal: React.FC<{
    onClose: () => void;
    onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
}> = ({ onClose, onCreateNotice }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
    const [targetYears, setTargetYears] = useState<number[]>([]);
    const editorRef = useRef<HTMLDivElement>(null);
    const handleInput = () => setContent(editorRef.current?.innerHTML || '');
    const applyStyle = (command: string) => { document.execCommand(command, false, undefined); editorRef.current?.focus(); };
    const handleDeptToggle = (dept: string) => setTargetDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    const handleYearToggle = (year: number) => setTargetYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
    const handleSubmit = () => {
        if (!title.trim() || !editorRef.current?.innerText.trim()) { alert("Title and content cannot be empty."); return; }
        onCreateNotice({ title, content, targetDepartments, targetYears });
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center"><h3 className="text-xl font-bold text-foreground">Post a New Notice</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button></div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice Title" className="w-full text-xl font-bold bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    <div className="border border-border rounded-lg">
                        <div className="p-2 border-b border-border flex items-center gap-2"><button onMouseDown={e => { e.preventDefault(); applyStyle('bold'); }} className="font-bold w-8 h-8 rounded hover:bg-muted">B</button><button onMouseDown={e => { e.preventDefault(); applyStyle('italic'); }} className="italic w-8 h-8 rounded hover:bg-muted">I</button><button onMouseDown={e => { e.preventDefault(); applyStyle('insertUnorderedList'); }} className="w-8 h-8 rounded hover:bg-muted">UL</button></div>
                        <div ref={editorRef} contentEditable onInput={handleInput} data-placeholder="Write your notice here..." className="w-full min-h-[150px] p-3 text-foreground bg-input focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Departments (optional)</h4>
                            <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto no-scrollbar">{departmentOptions.map(dept => (<label key={dept} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={targetDepartments.includes(dept)} onChange={() => handleDeptToggle(dept)} className="h-4 w-4 rounded text-primary focus:ring-primary"/><span>{dept}</span></label>))}</div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-muted mb-2">Target Years (optional)</h4>
                             <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto no-scrollbar">{yearOptions.map(year => (<label key={year.val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={targetYears.includes(year.val)} onChange={() => handleYearToggle(year.val)} className="h-4 w-4 rounded text-primary focus:ring-primary"/><span>{year.label}</span></label>))}</div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-muted/50 border-t border-border flex justify-end"><button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">Post Notice</button></div>
            </div>
        </div>
    );
};

export default DirectorPage;