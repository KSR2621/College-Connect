import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User, Course, Student, Note, Assignment, AttendanceStatus, AttendanceRecord, Message, Feedback } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { ArrowLeftIcon, UploadIcon, ClipboardListIcon, CheckSquareIcon, CloseIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SearchIcon, ArrowRightIcon, PlusIcon, TrashIcon, UserPlusIcon, MessageIcon, SendIcon, NotebookIcon, StarIcon } from '../components/Icons';
import { yearOptions } from '../constants';

// --- PROPS ---
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
}

// --- MODALS --- (Scoped to this page for simplicity)
const UploadResourceModal: React.FC<{ course: Course; onClose: () => void; resourceType: 'Note' | 'Assignment', onSave: (data: any) => void }> = ({ course, onClose, resourceType, onSave }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [dueDate, setDueDate] = useState('');

    const handleSave = () => {
        if (!title || !file) {
            alert('Please provide a title and select a file.');
            return;
        }
        
        let dataToSave: any = {
            title,
            fileUrl: URL.createObjectURL(file), // Note: This creates a temporary blob URL. For persistence, you'd upload to storage.
            fileName: file.name,
        };

        if (resourceType === 'Assignment') {
             if(!dueDate) {
                alert('Please select a due date for the assignment.');
                return;
             }
             dataToSave.dueDate = new Date(dueDate).getTime();
        }

        onSave(dataToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-foreground mb-4">Upload {resourceType}</h3>
                <p className="text-sm text-text-muted mb-4">For: <span className="font-semibold">{course.subject}</span></p>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={`${resourceType} Title`} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    {resourceType === 'Assignment' && (
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    )}
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Upload</button>
                </div>
            </div>
        </div>
    );
};

const TakeAttendanceModal: React.FC<{ course: Course; students: Student[]; onClose: () => void; onSave: (data: Omit<AttendanceRecord, 'date'>) => void; }> = ({ course, students, onClose, onSave }) => {
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const initialAttendance = students.reduce((acc, student) => {
            acc[student.id] = { status: 'present', note: '' };
            return acc;
        }, {} as Record<string, { status: AttendanceStatus; note: string }>);
        setAttendance(initialAttendance);
    }, [students]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { status: 'present', note: '' }),
                status: status,
            },
        }));
    };

    const handleNoteChange = (studentId: string, note: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { status: 'present', note: '' }),
                note: note,
            },
        }));
    };

    const markAllPresent = () => {
        setAttendance(prev => {
            const newAttendance = { ...prev };
            students.forEach(student => {
                newAttendance[student.id] = {
                    ...(newAttendance[student.id] || { status: 'present', note: '' }),
                    status: 'present',
                };
            });
            return newAttendance;
        });
    };

    const handleSubmit = () => {
        onSave({ records: attendance });
        setSubmitted(true);
        setTimeout(() => onClose(), 1500);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md text-center animate-fade-in" >
                    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-foreground mt-4">Attendance Submitted!</h3>
                </div>
            </div>
        );
    }
    
    const statusOptions: { status: AttendanceStatus, label: string, color: string, icon: React.FC<any> }[] = [
        { status: 'present', label: 'Present', color: 'emerald', icon: CheckCircleIcon },
        { status: 'absent', label: 'Absent', color: 'red', icon: XCircleIcon },
        { status: 'late', label: 'Late', color: 'amber', icon: ClockIcon },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
             <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border text-center relative">
                    <h3 className="text-xl font-bold text-foreground">Take Attendance</h3>
                    <p className="text-sm text-text-muted">{course.subject} - {new Date().toLocaleDateString()}</p>
                     <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button>
                </div>
                 <div className="p-4 border-b border-border">
                    <button onClick={markAllPresent} className="w-full bg-emerald-500/10 text-emerald-600 font-bold py-2 px-4 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm">Mark All as Present</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3">
                    {students.map(student => (
                        <div key={student.id} className="p-3 bg-slate-50 rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Avatar src={student.avatarUrl} name={student.name} size="md"/>
                                    <span className="font-semibold text-foreground">{student.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {statusOptions.map(opt => {
                                        const Icon = opt.icon;
                                        return (
                                            <button 
                                                key={opt.status}
                                                title={opt.label}
                                                onClick={() => handleStatusChange(student.id, opt.status)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    attendance[student.id]?.status === opt.status
                                                    ? `bg-${opt.color}-500 text-white shadow-md`
                                                    : `bg-slate-200 text-slate-500 hover:bg-${opt.color}-100`
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="Add an optional note..."
                                    value={attendance[student.id]?.note || ''}
                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                    className="w-full text-sm bg-white border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-muted/50 border-t border-border">
                    <button onClick={handleSubmit} className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">
                        Submit Attendance
                    </button>
                </div>
             </div>
        </div>
    );
};

const AddStudentModal: React.FC<{
    allUsers: User[];
    course: Course;
    onClose: () => void;
    onAddStudents: (studentIds: string[]) => void;
}> = ({ allUsers, course, onClose, onAddStudents }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const availableStudents = useMemo(() => {
        const enrolledIds = new Set([...(course.students || []), ...(course.pendingStudents || [])]);
        const lowercasedSearch = searchTerm.toLowerCase();
        
        return allUsers.filter(user => 
            user.tag === 'Student' &&
            !enrolledIds.has(user.id) &&
            (user.name.toLowerCase().includes(lowercasedSearch) || user.email.toLowerCase().includes(lowercasedSearch))
        );
    }, [allUsers, course, searchTerm]);

    const handleToggleSelection = (studentId: string) => {
        setSelectedStudents(prev => 
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleAdd = () => {
        onAddStudents(selectedStudents);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col h-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border">
                    <h3 className="text-xl font-bold text-foreground">Add Students to {course.subject}</h3>
                    <div className="relative mt-2">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search students by name or email..." className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    {availableStudents.map(student => {
                        const isSelected = selectedStudents.includes(student.id);
                        return (
                            <div key={student.id} onClick={() => handleToggleSelection(student.id)} className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-primary/20' : 'hover:bg-muted'}`}>
                                <Avatar src={student.avatarUrl} name={student.name} size="md"/>
                                <div className="ml-3">
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-text-muted">{student.email}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
                    <button onClick={handleAdd} disabled={selectedStudents.length === 0} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
                        Add {selectedStudents.length > 0 ? selectedStudents.length : ''} Student{selectedStudents.length !== 1 && 's'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- TABS CONTENT ---

const NotesTab: React.FC<{ course: Course; canUpload: boolean; onUpload: () => void; }> = ({ course, canUpload, onUpload }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            {canUpload && <button onClick={onUpload} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><UploadIcon className="w-5 h-5"/>Upload Note</button>}
            {(course.notes || []).length > 0 ? (
                (course.notes || []).map(note => (
                    <div key={note.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                        <h4 className="font-bold">{note.title}</h4>
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{note.fileName}</a>
                        <p className="text-xs text-text-muted mt-1">Uploaded on {new Date(note.uploadedAt).toLocaleDateString()}</p>
                    </div>
                ))
            ) : <div className="text-center text-text-muted bg-card p-8 rounded-lg border border-border"><p>No notes have been uploaded yet.</p></div>}
        </div>
    );
};


const AssignmentsTab: React.FC<{ course: Course; isFaculty: boolean; onUpload: () => void; }> = ({ course, isFaculty, onUpload }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            {isFaculty && <button onClick={onUpload} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><ClipboardListIcon className="w-5 h-5" />Post Assignment</button>}
            {(course.assignments || []).length > 0 ? (
                (course.assignments || []).map(ass => (
                    <div key={ass.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                        <h4 className="font-bold">{ass.title}</h4>
                        <a href={ass.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{ass.fileName}</a>
                        <p className="text-xs text-text-muted mt-1">Due: <span className="font-semibold">{new Date(ass.dueDate).toLocaleString()}</span></p>
                    </div>
                ))
            ) : <div className="text-center text-text-muted bg-card p-8 rounded-lg border border-border"><p>No assignments have been posted yet.</p></div>}
        </div>
    );
};

const AttendanceTab: React.FC<{ course: Course; isFaculty: boolean; currentUser: User; students: Student[]; onTakeAttendance: () => void; }> = ({ course, isFaculty, currentUser, students, onTakeAttendance }) => {
    const [expandedDate, setExpandedDate] = useState<number | null>(null);

    const statusInfo: Record<AttendanceStatus, { icon: React.FC<any>, text: string, classes: string }> = {
        present: { icon: CheckCircleIcon, text: 'Present', classes: 'text-emerald-500 bg-emerald-50' },
        absent: { icon: XCircleIcon, text: 'Absent', classes: 'text-red-500 bg-red-50' },
        late: { icon: ClockIcon, text: 'Late', classes: 'text-amber-500 bg-amber-50' },
    };

    const attendanceRecords = useMemo(() => (course.attendanceRecords || []).sort((a, b) => b.date - a.date), [course.attendanceRecords]);

    return (
        <div className="space-y-4 animate-fade-in">
            {isFaculty && <button onClick={onTakeAttendance} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><CheckSquareIcon className="w-5 h-5" />Take Today's Attendance</button>}
            
            {attendanceRecords.length > 0 ? (
                attendanceRecords.map((rec: AttendanceRecord) => {
                    const total = Object.keys(rec.records).length;
                    const present = Object.values(rec.records).filter(s => s.status === 'present').length;
                    const userRecord = !isFaculty ? rec.records[currentUser.id] : undefined;
                    const isExpanded = expandedDate === rec.date;

                    return (
                        <div key={rec.date} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50" onClick={() => isFaculty && setExpandedDate(isExpanded ? null : rec.date)}>
                                <div>
                                    <h4 className="font-bold">{new Date(rec.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</h4>
                                    {isFaculty && <p className="text-sm text-text-muted">{present} of {total} students present</p>}
                                </div>
                                {!isFaculty && userRecord && (() => {
                                    const { icon: Icon, text, classes } = statusInfo[userRecord.status];
                                    return (
                                        <div className="flex flex-col items-end"><div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${classes}`}><Icon className="w-4 h-4" /><span>{text}</span></div>{userRecord.note && <p className="text-xs text-text-muted mt-1">Note: {userRecord.note}</p>}</div>
                                    );
                                })()}
                                {isFaculty && <ArrowRightIcon className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                            </div>
                            {isExpanded && (
                                <div className="border-t border-border p-4 bg-slate-50"><div className="space-y-2 max-h-96 overflow-y-auto">
                                    {students.map(student => {
                                        const studentRecord = rec.records[student.id];
                                        if (!studentRecord) return null;
                                        const { icon: Icon, text, classes } = statusInfo[studentRecord.status];
                                        return (
                                            <div key={student.id} className="p-2 rounded-md hover:bg-white">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center space-x-3"><Avatar src={student.avatarUrl} name={student.name} size="sm" /><p>{student.name}</p></div>
                                                    <div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${classes}`}><Icon className="w-4 h-4" /><span>{text}</span></div>
                                                </div>
                                                {studentRecord.note && <p className="mt-1 text-xs text-text-muted border-l-2 border-border ml-3 pl-2">Note: {studentRecord.note}</p>}
                                            </div>
                                        );
                                    })}
                                </div></div>
                            )}
                        </div>
                    )
                })
            ) : <div className="text-center text-text-muted bg-card p-8 rounded-lg border border-border"><p>No attendance has been recorded yet.</p></div>}
        </div>
    );
};

const RosterTab: React.FC<{
    course: Course; allUsers: User[]; onManageRequest: (studentId: string, action: 'approve' | 'decline') => void; onAddStudents: () => void; onRemoveStudent: (studentId: string) => void;
}> = ({ course, allUsers, onManageRequest, onAddStudents, onRemoveStudent }) => {
    const pendingStudents = useMemo(() => (course.pendingStudents || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[], [course.pendingStudents, allUsers]);
    const enrolledStudents = useMemo(() => (course.students || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[], [course.students, allUsers]);

    return (
        <div className="space-y-6 animate-fade-in">
            {pendingStudents.length > 0 && (
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                    <h4 className="font-bold text-lg mb-3">Pending Requests ({pendingStudents.length})</h4>
                    <div className="space-y-3">{pendingStudents.map(student => (
                        <div key={student.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50">
                            <div className="flex items-center space-x-3"><Avatar src={student.avatarUrl} name={student.name} size="md" /><div><p className="font-semibold">{student.name}</p><p className="text-sm text-text-muted">{student.department}</p></div></div>
                            <div className="space-x-2"><button onClick={() => onManageRequest(student.id, 'approve')} className="bg-primary/20 text-primary font-semibold py-1 px-3 rounded-full text-xs hover:bg-primary/30">Approve</button><button onClick={() => onManageRequest(student.id, 'decline')} className="bg-destructive/20 text-destructive font-semibold py-1 px-3 rounded-full text-xs hover:bg-destructive/30">Decline</button></div>
                        </div>
                    ))}</div>
                </div>
            )}
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-lg">Enrolled Students ({enrolledStudents.length})</h4><button onClick={onAddStudents} className="bg-primary text-primary-foreground font-bold py-1.5 px-3 rounded-full text-xs inline-flex items-center gap-1 hover:bg-primary/90"><UserPlusIcon className="w-4 h-4" />Add</button></div>
                 <div className="space-y-3">
                    {enrolledStudents.length > 0 ? enrolledStudents.map(student => (
                         <div key={student.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                            <div className="flex items-center space-x-3"><Avatar src={student.avatarUrl} name={student.name} size="md" /><div><p className="font-semibold">{student.name}</p></div></div>
                            <button onClick={() => onRemoveStudent(student.id)} className="text-destructive p-1 rounded-full hover:bg-destructive/10"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    )) : <p className="text-center text-text-muted py-4">No students are enrolled in this course.</p>}
                 </div>
            </div>
        </div>
    )
};

const CourseChatTab: React.FC<{ course: Course; currentUser: User; allUsers: User[]; onSendCourseMessage: (courseId: string, text: string) => void; }> = ({ course, currentUser, allUsers, onSendCourseMessage }) => {
    const [text, setText] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef((course.messages || []).length);
    const usersMap = useMemo(() => Object.fromEntries(allUsers.map(u => [u.id, u])), [allUsers]);
    const messages = course.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        prevMessagesLength.current = messages.length;
    }, [course.id]);
    
    useEffect(() => {
        const currentMessagesLength = messages.length;
        if (currentMessagesLength > prevMessagesLength.current) {
            const container = messagesContainerRef.current;
            if (container) {
                const lastMessage = messages[currentMessagesLength - 1];
                const isFromCurrentUser = lastMessage.senderId === currentUser.id;
                const scrollThreshold = 150;
                const isScrolledNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + scrollThreshold;

                if (isFromCurrentUser || isScrolledNearBottom) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
        prevMessagesLength.current = currentMessagesLength;
    }, [messages, currentUser.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) { onSendCourseMessage(course.id, text.trim()); setText(''); }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border h-[70vh] flex flex-col animate-fade-in">
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.length === 0 ? <p className="text-center text-text-muted mt-8">No messages yet. Start the conversation!</p> : messages.map(msg => {
                    const sender = usersMap[msg.senderId];
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
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-slate-50"><form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message to the class..." className="flex-1 bg-white border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"/>
                <button type="submit" className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!text.trim()}><SendIcon className="w-5 h-5" /></button>
            </form></div>
        </div>
    );
};

const PersonalNoteTab: React.FC<{ noteContent: string; onSave: (content: string) => void; }> = ({ noteContent, onSave }) => {
    const [note, setNote] = useState(noteContent);
    const [feedback, setFeedback] = useState('Save Note');

    useEffect(() => { setNote(noteContent); }, [noteContent]);

    const handleSave = () => {
        setFeedback('Saving...');
        onSave(note);
        setTimeout(() => { setFeedback('Saved!'); setTimeout(() => setFeedback('Save Note'), 2000); }, 1000);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border animate-fade-in">
            <h3 className="text-xl font-bold text-foreground mb-3">Private Note</h3>
            <p className="text-sm text-text-muted mb-4">This note is only visible to you. Use it to keep track of reminders, student progress, or any other thoughts related to this course.</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={10} className="w-full bg-input border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Start typing your private note..."/>
            <div className="mt-4 flex justify-end">
                <button onClick={handleSave} disabled={feedback !== 'Save Note'} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all">{feedback}</button>
            </div>
        </div>
    );
};

const FeedbackTab: React.FC<{
    course: Course;
    currentUser: User;
    isStudent: boolean;
    isFaculty: boolean;
    onSaveFeedback: (feedbackData: { rating: number; comment: string; }) => void;
}> = ({ course, currentUser, isStudent, isFaculty, onSaveFeedback }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    
    const existingFeedback = useMemo(() => course.feedback?.find(f => f.studentId === currentUser.id), [course.feedback, currentUser.id]);
    
    const handleSubmit = () => {
        if (rating > 0 && comment.trim()) {
            onSaveFeedback({ rating, comment });
        } else {
            alert("Please provide a rating and a comment.");
        }
    };

    if (isFaculty) {
        const feedbacks = course.feedback || [];
        return (
            <div className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-foreground">Course Feedback</h3>
                {feedbacks.length > 0 ? (
                    feedbacks.map((fb, index) => (
                        <div key={index} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                            <div className="flex items-center gap-2">
                                {Array.from({length: 5}).map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < fb.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />)}
                            </div>
                            <p className="mt-2 text-card-foreground">{fb.comment}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-text-muted bg-card p-8 rounded-lg border border-border"><p>No feedback has been submitted for this course yet.</p></div>
                )}
            </div>
        )
    }
    
    if (isStudent) {
        if (existingFeedback) {
             return (
                <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-foreground mb-4">Your Feedback</h3>
                    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                        <p className="text-sm text-text-muted">You have already submitted feedback for this course. Thank you!</p>
                         <div className="flex items-center gap-2 mt-4">
                            {Array.from({length: 5}).map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < existingFeedback.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />)}
                        </div>
                        <p className="mt-2 text-card-foreground italic">"{existingFeedback.comment}"</p>
                    </div>
                </div>
            )
        }
        return (
            <div className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-foreground">Submit Feedback</h3>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
                    <div>
                        <label className="font-semibold text-text-muted">Rating</label>
                        <div className="flex items-center gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <StarIcon
                                    key={star}
                                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-semibold text-text-muted">Comments</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            placeholder="Share your thoughts about the course..."
                            className="w-full mt-2 bg-input border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">Submit</button>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};

// --- MAIN COMPONENT ---
export const CourseDetailPage: React.FC<CourseDetailPageProps> = (props) => {
    const { course, currentUser, allUsers, students, onNavigate, currentPath, onAddNote, onAddAssignment, onTakeAttendance, onRequestToJoinCourse, onManageCourseRequest, onAddStudentsToCourse, onRemoveStudentFromCourse, onSendCourseMessage, onUpdateCoursePersonalNote, onSaveFeedback, onDeleteCourse, onUpdateCourseFaculty } = props;
    
    const [activeTab, setActiveTab] = useState('notes');
    const [isModalOpen, setIsModalOpen] = useState<'note' | 'assignment' | 'attendance' | 'addStudent' | null>(null);

    const handleLogout = async () => { await auth.signOut(); onNavigate('#/'); };

    const isInstructorRole = currentUser.tag === 'Teacher' || currentUser.tag === 'HOD/Dean' || currentUser.tag === 'Director';
    const isFaculty = isInstructorRole && course.facultyId === currentUser.id;
    const isStudent = currentUser.tag === 'Student' && (course.students || []).includes(currentUser.id);
    const hasRequested = (course.pendingStudents || []).includes(currentUser.id);
    const facultyUser = useMemo(() => allUsers.find(u => u.id === course.facultyId), [allUsers, course.facultyId]);

    const isHodOfDepartment = currentUser.tag === 'HOD/Dean' && currentUser.department === course.department;
    const canDeleteCourse = isFaculty || currentUser.tag === 'Director';

    const departmentTeachers = useMemo(() => {
        if (!isHodOfDepartment) return [];
        return allUsers.filter(u => u.department === course.department && (u.tag === 'Teacher' || u.tag === 'HOD/Dean') && u.isApproved);
    }, [allUsers, course.department, isHodOfDepartment]);

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this course? This is permanent and cannot be undone.")) {
            onDeleteCourse(course.id);
            onNavigate('#/academics');
        }
    };

    const handleSaveResource = (data: any) => {
        if (isModalOpen === 'note') { onAddNote(course.id, { ...data, uploadedAt: Date.now() }); } 
        else if (isModalOpen === 'assignment') { onAddAssignment(course.id, { ...data, postedAt: Date.now() }); }
    };
    
    const TABS = useMemo(() => {
        let tabs = [
            { id: 'notes', label: 'Notes', icon: UploadIcon },
            { id: 'assignments', label: 'Assignments', icon: ClipboardListIcon },
        ];
        if (isStudent || isFaculty) { tabs.push({ id: 'attendance', label: 'Attendance', icon: CheckSquareIcon }); }
        if (isFaculty || isHodOfDepartment) { tabs.push({ id: 'roster', label: 'Roster', icon: UserPlusIcon }); }
        if (isStudent || isFaculty || isHodOfDepartment) {
            tabs.push({ id: 'chat', label: 'Class Chat', icon: MessageIcon });
            tabs.push({ id: 'personalNote', label: 'My Note', icon: NotebookIcon });
            tabs.push({ id: 'feedback', label: 'Feedback', icon: StarIcon });
        }
        return tabs;
    }, [isStudent, isFaculty, isHodOfDepartment]);
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'assignments': return <AssignmentsTab course={course} isFaculty={isFaculty} onUpload={() => setIsModalOpen('assignment')} />;
            case 'attendance': return <AttendanceTab course={course} isFaculty={isFaculty} currentUser={currentUser} students={students} onTakeAttendance={() => setIsModalOpen('attendance')} />;
            case 'roster': return <RosterTab course={course} allUsers={allUsers} onManageRequest={(studentId, action) => onManageCourseRequest(course.id, studentId, action)} onAddStudents={() => setIsModalOpen('addStudent')} onRemoveStudent={(studentId) => onRemoveStudentFromCourse(course.id, studentId)} />;
            case 'chat': return <CourseChatTab course={course} currentUser={currentUser} allUsers={allUsers} onSendCourseMessage={onSendCourseMessage} />;
            case 'personalNote': return <PersonalNoteTab noteContent={course.personalNotes?.[currentUser.id] || ''} onSave={(content) => onUpdateCoursePersonalNote(course.id, currentUser.id, content)} />;
            case 'feedback': return <FeedbackTab course={course} currentUser={currentUser} isStudent={isStudent} isFaculty={isFaculty} onSaveFeedback={(data) => onSaveFeedback(course.id, data)} />;
            case 'notes': default: return <NotesTab course={course} canUpload={isFaculty} onUpload={() => setIsModalOpen('note')} />;
        }
    };

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <button onClick={() => onNavigate('#/academics')} className="flex items-center text-sm text-primary mb-4 hover:underline"><ArrowLeftIcon className="w-4 h-4 mr-2"/>Back to Academics</button>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{course.subject}</h1>
                            <p className="text-md text-text-muted mt-1">{course.department} &bull; {yearOptions.find(y => y.val === course.year)?.label}</p>
                            {facultyUser && <div className="flex items-center space-x-2 mt-3 text-sm"><Avatar src={facultyUser.avatarUrl} name={facultyUser.name} size="sm"/><span className="text-text-muted">Taught by <span className="font-semibold text-foreground">{facultyUser.name}</span></span></div>}
                        </div>
                         <div className="flex items-center gap-2 mt-4 sm:mt-0">
                            {!isStudent && !isFaculty && !hasRequested && currentUser.tag === 'Student' && (<button onClick={() => onRequestToJoinCourse(course.id)} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105">Request to Join</button>)}
                            {!isStudent && !isFaculty && hasRequested && (<button disabled className="bg-muted text-text-muted font-semibold py-2 px-6 rounded-full cursor-not-allowed">Request Sent</button>)}
                            {canDeleteCourse && (
                                <button onClick={handleDelete} className="bg-destructive/10 text-destructive font-semibold py-2 px-4 rounded-lg text-sm hover:bg-destructive/20 transition-colors flex items-center gap-2">
                                    <TrashIcon className="w-4 h-4" /> Delete Course
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isHodOfDepartment && (
                    <div className="bg-card p-4 rounded-lg shadow-sm border border-border mb-8">
                        <h3 className="font-bold text-lg mb-2 text-foreground">HOD Controls</h3>
                        <div className="flex items-center gap-2">
                            <label htmlFor="faculty-assign" className="text-sm font-medium text-text-muted">Assign Faculty:</label>
                            <select
                                id="faculty-assign"
                                value={course.facultyId}
                                onChange={(e) => onUpdateCourseFaculty(course.id, e.target.value)}
                                className="w-full max-w-xs bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {departmentTeachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                
                 <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 lg:flex-shrink-0">
                        <div className="lg:sticky top-24">
                            <nav className="flex flex-row lg:flex-col gap-1 bg-card p-2 rounded-lg border border-border overflow-x-auto no-scrollbar lg:overflow-visible">
                                {TABS.map(tab => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`w-full flex-shrink-0 lg:flex-shrink flex items-center space-x-3 text-left p-3 rounded-md font-semibold text-sm transition-colors ${
                                            activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <tab.icon className="w-5 h-5"/>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                    <div className="flex-1 min-w-0">
                        {renderTabContent()}
                    </div>
                </div>

            </main>
            {(isModalOpen === 'note' || isModalOpen === 'assignment') && (<UploadResourceModal course={course} onClose={() => setIsModalOpen(null)} resourceType={isModalOpen === 'note' ? 'Note' : 'Assignment'} onSave={handleSaveResource} />)}
            {isModalOpen === 'attendance' && (<TakeAttendanceModal course={course} students={students} onClose={() => setIsModalOpen(null)} onSave={(data) => onTakeAttendance(course.id, data)} />)}
            {isModalOpen === 'addStudent' && (<AddStudentModal course={course} allUsers={allUsers} onClose={() => setIsModalOpen(null)} onAddStudents={(studentIds) => onAddStudentsToCourse(course.id, studentIds)} />)}
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};