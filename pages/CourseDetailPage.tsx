
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Course, Student, Note, Assignment, AttendanceRecord, AttendanceStatus } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { ArrowLeftIcon, UploadIcon, ClipboardListIcon, CheckSquareIcon, CloseIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SearchIcon, ArrowRightIcon, PlusIcon, TrashIcon, UserPlusIcon, MessageIcon, SendIcon, NotebookIcon, StarIcon, FileTextIcon, CalendarIcon, UsersIcon } from '../components/Icons';

interface CourseDetailPageProps {
  course: Course;
  currentUser: User;
  allUsers: User[];
  students: Student[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddNote: (courseId: string, noteData: Omit<Note, 'id'>) => void;
  onAddAssignment: (courseId: string, assignmentData: Omit<Assignment, 'id'>) => void;
  onTakeAttendance: (courseId: string, attendanceData: Omit<AttendanceRecord, 'date'>) => void;
  onRequestToJoinCourse: (courseId: string) => void;
  onManageCourseRequest: (courseId: string, studentId: string, action: 'approve' | 'decline') => void;
  onAddStudentsToCourse: (courseId: string, studentIds: string[]) => void;
  onRemoveStudentFromCourse: (courseId: string, studentId: string) => void;
  onSendCourseMessage: (courseId: string, text: string) => void;
  onUpdateCoursePersonalNote: (courseId: string, userId: string, content: string) => void;
  onSaveFeedback: (courseId: string, feedbackData: { rating: number; comment: string; }) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
  initialTab?: string;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = (props) => {
    const { course, currentUser, allUsers, students, onNavigate, currentPath, onAddNote, onAddAssignment, onTakeAttendance, onRequestToJoinCourse, onManageCourseRequest, onAddStudentsToCourse, onRemoveStudentFromCourse, onSendCourseMessage, onUpdateCoursePersonalNote, onSaveFeedback, onDeleteCourse, onUpdateCourseFaculty, initialTab } = props;
    
    const [activeTab, setActiveTab] = useState(initialTab || 'notes');
    const [isModalOpen, setIsModalOpen] = useState<'note' | 'assignment' | 'attendance' | 'addStudent' | null>(null);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };

    const isFaculty = currentUser.tag === 'Teacher' && course.facultyId === currentUser.id;
    const isStudent = currentUser.tag === 'Student' && (course.students || []).includes(currentUser.id);
    const hasRequested = (course.pendingStudents || []).includes(currentUser.id);
    const facultyUser = useMemo(() => allUsers.find(u => u.id === course.facultyId), [allUsers, course.facultyId]);

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-6 pb-32 md:pb-8">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-8 rounded-3xl mb-8 shadow-lg relative overflow-hidden animate-fade-in">
                    <div className="relative z-10">
                        <button onClick={() => onNavigate('#/academics')} className="text-blue-100 hover:text-white flex items-center gap-2 text-sm mb-6 transition-colors font-medium">
                            <ArrowLeftIcon className="w-4 h-4"/> Back to Academics
                        </button>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{course.subject}</h1>
                                <div className="flex flex-wrap gap-3 items-center text-sm font-semibold text-blue-50">
                                    <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full">{course.department}</span>
                                    <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full">Year {course.year}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3">
                                {facultyUser && (
                                    <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 pr-4">
                                        <Avatar src={facultyUser.avatarUrl} name={facultyUser.name} size="md" className="border-2 border-white/50"/>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Instructor</p>
                                            <p className="font-bold text-sm">{facultyUser.name}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-2">
                                    {!isStudent && !isFaculty && !hasRequested && currentUser.tag === 'Student' && (
                                        <button onClick={() => onRequestToJoinCourse(course.id)} className="bg-white text-primary font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-50">
                                            Request to Join
                                        </button>
                                    )}
                                    {!isStudent && !isFaculty && hasRequested && (
                                        <button disabled className="bg-white/20 text-blue-100 font-bold py-2 px-5 rounded-lg cursor-not-allowed border border-white/10">
                                            Request Sent
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24">
                        <nav className="space-y-2 bg-card p-2 rounded-2xl border border-border shadow-sm">
                            <button onClick={() => setActiveTab('notes')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${activeTab === 'notes' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                                <FileTextIcon className="w-5 h-5"/><span>Notes</span>
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${activeTab === 'assignments' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                                <ClipboardListIcon className="w-5 h-5"/><span>Assignments</span>
                            </button>
                            {(isStudent || isFaculty) && (
                                <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${activeTab === 'chat' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                                    <MessageIcon className="w-5 h-5"/><span>Chat</span>
                                </button>
                            )}
                        </nav>
                    </aside>

                    <div className="flex-1 min-w-0 w-full bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border min-h-[500px]">
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                {isFaculty && <button onClick={() => setIsModalOpen('note')} className="w-full bg-muted/30 border-2 border-dashed border-border text-muted-foreground font-bold py-4 rounded-2xl hover:border-primary hover:text-primary flex flex-col items-center justify-center gap-2"><UploadIcon className="w-6 h-6"/><span>Upload Note</span></button>}
                                {(course.notes || []).map(note => (
                                    <div key={note.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-foreground">{note.title}</h4>
                                            <p className="text-xs text-muted-foreground">{note.fileName}</p>
                                        </div>
                                        <a href={note.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold bg-muted text-foreground px-3 py-1.5 rounded-full">Download</a>
                                    </div>
                                ))}
                                {(course.notes || []).length === 0 && <p className="text-center text-muted-foreground">No notes available.</p>}
                            </div>
                        )}
                        {activeTab === 'assignments' && (
                            <div className="space-y-6">
                                {isFaculty && <button onClick={() => setIsModalOpen('assignment')} className="w-full bg-muted/30 border-2 border-dashed border-border text-muted-foreground font-bold py-4 rounded-2xl hover:border-primary hover:text-primary flex flex-col items-center justify-center gap-2"><ClipboardListIcon className="w-6 h-6"/><span>Post Assignment</span></button>}
                                {(course.assignments || []).map(ass => (
                                    <div key={ass.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-foreground">{ass.title}</h4>
                                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <a href={ass.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline mt-2 inline-block">View File</a>
                                    </div>
                                ))}
                                {(course.assignments || []).length === 0 && <p className="text-center text-muted-foreground">No assignments posted.</p>}
                            </div>
                        )}
                        {activeTab === 'chat' && (
                            <div className="text-center text-muted-foreground py-12">
                                <MessageIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                                <p>Class chat feature coming soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* Modals would go here */}
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};
