
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User, Course, Student, Note, Assignment, AttendanceStatus, AttendanceRecord, Message, Feedback } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { ArrowLeftIcon, UploadIcon, ClipboardListIcon, CheckSquareIcon, CloseIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SearchIcon, ArrowRightIcon, PlusIcon, TrashIcon, UserPlusIcon, MessageIcon, SendIcon, NotebookIcon, StarIcon, FileTextIcon, CalendarIcon, UsersIcon } from '../components/Icons';
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
  initialTab?: string;
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100 animate-fade-in border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground">Upload {resourceType}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Adding content to <span className="font-semibold text-foreground">{course.subject}</span></p>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={`${resourceType} Title`} className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"/>
                    </div>
                    
                    {resourceType === 'Assignment' && (
                        <div>
                             <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Due Date</label>
                             <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"/>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">File</label>
                        <div className="relative group">
                             <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-border rounded-xl p-2 bg-input transition-colors"/>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 font-bold text-muted-foreground bg-muted rounded-xl hover:bg-border transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform transform hover:scale-105">Upload</button>
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-card rounded-2xl shadow-xl p-10 w-full max-w-md text-center animate-scale-in border border-border" >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Attendance Submitted!</h3>
                </div>
            </div>
        );
    }
    
    const statusOptions: { status: AttendanceStatus, label: string, color: string, icon: React.ElementType }[] = [
        { status: 'present', label: 'Present', color: 'emerald', icon: CheckCircleIcon },
        { status: 'absent', label: 'Absent', color: 'red', icon: XCircleIcon },
        { status: 'late', label: 'Late', color: 'amber', icon: ClockIcon },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
             <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-full max-h-[85vh] overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Take Attendance</h3>
                        <p className="text-sm text-muted-foreground font-medium">{course.subject} &bull; {new Date().toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-6 h-6"/></button>
                </div>
                 <div className="p-4 bg-card border-b border-border flex justify-end">
                    <button onClick={markAllPresent} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold py-2 px-4 rounded-xl hover:bg-emerald-500/20 transition-colors text-xs flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4"/> Mark All Present
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3 bg-muted/10">
                    {students.map(student => (
                        <div key={student.id} className="p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <Avatar src={student.avatarUrl} name={student.name} size="md"/>
                                    <span className="font-bold text-foreground">{student.name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                                    {statusOptions.map(opt => {
                                        const Icon = opt.icon;
                                        const isSelected = attendance[student.id]?.status === opt.status;
                                        return (
                                            <button 
                                                key={opt.status}
                                                title={opt.label}
                                                onClick={() => handleStatusChange(student.id, opt.status)}
                                                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-2 text-xs font-bold ${
                                                    isSelected
                                                    ? `bg-${opt.color}-500 text-white shadow-sm transform scale-105`
                                                    : `text-muted-foreground hover:text-foreground hover:bg-card`
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className={isSelected ? 'inline' : 'hidden sm:inline'}>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-3">
                                <input
                                    type="text"
                                    placeholder="Add an optional note..."
                                    value={attendance[student.id]?.note || ''}
                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                    className="w-full text-xs bg-input border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground placeholder-muted-foreground"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-card border-t border-border">
                    <button onClick={handleSubmit} className="w-full px-6 py-3.5 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform transform hover:scale-[1.02]">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-full max-h-[80vh] border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-foreground">Add Students</h3>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2">
                    {availableStudents.length > 0 ? availableStudents.map(student => {
                        const isSelected = selectedStudents.includes(student.id);
                        return (
                            <div key={student.id} onClick={() => handleToggleSelection(student.id)} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-transparent hover:bg-muted'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                    {isSelected && <CheckCircleIcon className="w-4 h-4"/>}
                                </div>
                                <Avatar src={student.avatarUrl} name={student.name} size="md"/>
                                <div className="ml-3">
                                    <p className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-center text-muted-foreground py-8">No matching students found.</p>
                    )}
                </div>
                <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <button onClick={handleAdd} disabled={selectedStudents.length === 0} className="px-6 py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all">
                        Add {selectedStudents.length > 0 ? `${selectedStudents.length} Students` : 'Selected'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- TABS CONTENT ---

const NotesTab: React.FC<{ course: Course; canUpload: boolean; onUpload: () => void; }> = ({ course, canUpload, onUpload }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {canUpload && (
                <button onClick={onUpload} className="w-full bg-muted/30 border-2 border-dashed border-border text-muted-foreground font-bold py-4 rounded-2xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group">
                    <div className="p-2 bg-card rounded-full shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                        <UploadIcon className="w-6 h-6"/>
                    </div>
                    <span>Upload New Note</span>
                </button>
            )}
            {(course.notes || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(course.notes || []).map(note => (
                        <div key={note.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border hover:border-primary/30 hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-muted to-card rounded-bl-full -mr-10 -mt-10 z-0 group-hover:from-primary/5 group-hover:to-card transition-colors"></div>
                            <div className="relative z-10 flex items-start justify-between mb-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                                    <FileTextIcon className="w-6 h-6" />
                                </div>
                                <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-muted text-muted-foreground px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                                    Download
                                </a>
                            </div>
                            <h4 className="font-bold text-foreground text-lg mb-1 line-clamp-1 relative z-10">{note.title}</h4>
                            <p className="text-xs text-muted-foreground relative z-10">{note.fileName}</p>
                            <div className="mt-auto pt-4 text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <ClockIcon className="w-3 h-3"/>
                                {new Date(note.uploadedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <div className="text-center text-muted-foreground bg-muted/30 p-12 rounded-2xl border border-border"><p>No notes have been uploaded yet.</p></div>}
        </div>
    );
};


const AssignmentsTab: React.FC<{ course: Course; isFaculty: boolean; onUpload: () => void; }> = ({ course, isFaculty, onUpload }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {isFaculty && (
                <button onClick={onUpload} className="w-full bg-muted/30 border-2 border-dashed border-border text-muted-foreground font-bold py-4 rounded-2xl hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50/10 transition-all flex flex-col items-center justify-center gap-2 group">
                    <div className="p-2 bg-card rounded-full shadow-sm text-muted-foreground group-hover:text-purple-500 transition-colors">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <span>Post New Assignment</span>
                </button>
            )}
            {(course.assignments || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(course.assignments || []).map(ass => {
                         const isDue = new Date(ass.dueDate) < new Date();
                         return (
                            <div key={ass.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border hover:border-purple-500/30 hover:shadow-md transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                                        <ClipboardListIcon className="w-6 h-6"/>
                                    </div>
                                    {isDue ? (
                                        <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">Closed</span>
                                    ) : (
                                        <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">Active</span>
                                    )}
                                </div>
                                <h4 className="font-bold text-foreground text-lg mb-1">{ass.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-4 bg-muted p-2 rounded-lg self-start">
                                    <CalendarIcon className="w-3 h-3"/> Due: {new Date(ass.dueDate).toLocaleDateString()}
                                </div>
                                <a href={ass.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-auto w-full text-center text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                                    View Details
                                </a>
                            </div>
                         )
                    })}
                </div>
            ) : <div className="text-center text-muted-foreground bg-muted/30 p-12 rounded-2xl border border-border"><p>No assignments have been posted yet.</p></div>}
        </div>
    );
};

const AttendanceTab: React.FC<{ course: Course; isFaculty: boolean; currentUser: User; students: Student[]; onTakeAttendance: () => void; }> = ({ course, isFaculty, currentUser, students, onTakeAttendance }) => {
    const [expandedDate, setExpandedDate] = useState<number | null>(null);

    const statusInfo: Record<AttendanceStatus, { icon: React.ElementType, text: string, classes: string }> = {
        present: { icon: CheckCircleIcon, text: 'Present', classes: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
        absent: { icon: XCircleIcon, text: 'Absent', classes: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
        late: { icon: ClockIcon, text: 'Late', classes: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' },
    };

    const attendanceRecords = useMemo(() => (course.attendanceRecords || []).sort((a, b) => b.date - a.date), [course.attendanceRecords]);

    return (
        <div className="space-y-6 animate-fade-in">
            {isFaculty && (
                <button onClick={onTakeAttendance} className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.01]">
                    <CheckSquareIcon className="w-5 h-5" /> Take Today's Attendance
                </button>
            )}
            
            {attendanceRecords.length > 0 ? (
                <div className="space-y-3">
                    {attendanceRecords.map((rec: AttendanceRecord) => {
                        const total = Object.keys(rec.records).length;
                        const present = Object.values(rec.records).filter(s => s.status === 'present').length;
                        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                        const userRecord = !isFaculty ? rec.records[currentUser.id] : undefined;
                        const isExpanded = expandedDate === rec.date;

                        return (
                            <div key={rec.date} className={`bg-card rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-primary/30 shadow-md' : 'border-border shadow-sm hover:border-primary/20'}`}>
                                <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => isFaculty && setExpandedDate(isExpanded ? null : rec.date)}>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-muted p-2 rounded-lg text-center min-w-[60px]">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">{new Date(rec.date).toLocaleString('default', { month: 'short' })}</p>
                                            <p className="text-xl font-extrabold text-foreground">{new Date(rec.date).getDate()}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{new Date(rec.date).toLocaleString([], { weekday: 'long' })}</h4>
                                            <p className="text-xs text-muted-foreground">{new Date(rec.date).toLocaleTimeString([], {timeStyle: 'short'})}</p>
                                        </div>
                                    </div>
                                    
                                    {isFaculty ? (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-muted-foreground uppercase">Attendance</p>
                                                <p className={`font-bold ${percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>{percentage}% Present</p>
                                            </div>
                                            <div className={`p-2 rounded-full bg-muted text-muted-foreground transition-transform ${isExpanded ? 'rotate-90 text-primary bg-primary/10' : ''}`}>
                                                <ArrowRightIcon className="w-4 h-4"/>
                                            </div>
                                        </div>
                                    ) : userRecord && (() => {
                                        const { icon: Icon, text, classes } = statusInfo[userRecord.status];
                                        return (
                                            <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg text-xs border ${classes}`}>
                                                <Icon className="w-4 h-4" /><span>{text}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-border bg-muted/30 p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                                            {students.map(student => {
                                                const studentRecord = rec.records[student.id];
                                                if (!studentRecord) return null;
                                                const { icon: Icon, text, classes } = statusInfo[studentRecord.status];
                                                return (
                                                    <div key={student.id} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar src={student.avatarUrl} name={student.name} size="sm" className="w-8 h-8 text-xs" />
                                                            <span className="text-sm font-semibold text-foreground">{student.name}</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1 font-bold px-2 py-1 rounded text-[10px] border ${classes}`}>
                                                            <Icon className="w-3 h-3" /> {text}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : <div className="text-center text-muted-foreground bg-muted/30 p-12 rounded-2xl border border-border"><p>No attendance records yet.</p></div>}
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
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2"><ClockIcon className="w-5 h-5"/> Pending Requests ({pendingStudents.length})</h4>
                    <div className="space-y-2">
                        {pendingStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center p-3 rounded-xl bg-card border border-border shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                    <div>
                                        <p className="font-bold text-foreground">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onManageRequest(student.id, 'approve')} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">Approve</button>
                                    <button onClick={() => onManageRequest(student.id, 'decline')} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2"><UsersIcon className="w-5 h-5 text-muted-foreground"/> Class Roster <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">{enrolledStudents.length}</span></h4>
                    <button onClick={onAddStudents} className="bg-primary/10 text-primary font-bold py-2 px-4 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-primary/20 transition-colors">
                        <UserPlusIcon className="w-4 h-4" /> Add Student
                    </button>
                </div>
                 <div className="divide-y divide-border">
                    {enrolledStudents.length > 0 ? enrolledStudents.map(student => (
                         <div key={student.id} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center space-x-4">
                                <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                <div>
                                    <p className="font-bold text-foreground">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                            <button onClick={() => {if(window.confirm(`Remove ${student.name}?`)) onRemoveStudent(student.id)}} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                         </div>
                    )) : <p className="text-center text-muted-foreground py-8">No students enrolled yet.</p>}
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
        <div className="bg-muted/30 rounded-2xl border border-border h-[600px] flex flex-col overflow-hidden animate-fade-in relative">
            {/* Chat Pattern Background */}
            <div className="absolute inset-0 opacity-5 pattern-dots pointer-events-none"></div>
            
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative z-10">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageIcon className="w-12 h-12 mb-2 opacity-50"/>
                        <p>Start the discussion!</p>
                    </div>
                ) : messages.map(msg => {
                    const sender = usersMap[msg.senderId];
                    if (!sender) return null;
                    const isCurrentUser = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-bubble-in`}>
                            {!isCurrentUser && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" className="mb-1 shadow-sm"/>}
                            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                {!isCurrentUser && <p className="text-[10px] text-muted-foreground mb-1 ml-1 font-bold">{sender.name}</p>}
                                <div className={`p-3.5 rounded-2xl text-sm shadow-sm ${isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none border border-border'}`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 mx-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-card border-t border-border relative z-20">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input 
                        type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="Type a message to the class..." 
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
                    />
                    <button type="submit" className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:scale-100 transition-transform transform hover:scale-105 shadow-lg shadow-primary/20" disabled={!text.trim()}>
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
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
        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-8 rounded-2xl border border-amber-100 dark:border-amber-900/30 animate-fade-in relative">
            <div className="absolute top-6 right-6 text-amber-300 dark:text-amber-800">
                <NotebookIcon className="w-12 h-12 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">My Private Notes</h3>
            <p className="text-sm text-amber-700/70 dark:text-amber-300/70 mb-6 max-w-lg">Keep track of lesson plans, student progress reminders, or personal to-dos for this course. Only visible to you.</p>
            
            <textarea 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                rows={12} 
                className="w-full bg-white dark:bg-black/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                placeholder="Start typing your private note..."
            />
            
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={feedback !== 'Save Note'} className="px-8 py-3 font-bold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-900 rounded-xl hover:bg-amber-300 dark:hover:bg-amber-800 disabled:opacity-50 transition-all shadow-sm">
                    {feedback}
                </button>
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
        const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
        
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold">Course Feedback</h3>
                        <p className="text-slate-400 text-sm mt-1">Student reviews and ratings</p>
                    </div>
                    <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <div className="text-3xl font-extrabold text-amber-400 flex items-center gap-1">
                            {avgRating} <StarIcon className="w-6 h-6 fill-current"/>
                        </div>
                        <p className="text-xs text-slate-300 font-medium uppercase tracking-wider mt-1">{feedbacks.length} Reviews</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbacks.length > 0 ? (
                        feedbacks.map((fb, index) => (
                            <div key={index} className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({length: 5}).map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < fb.rating ? 'text-amber-400 fill-current' : 'text-muted'}`} />)}
                                </div>
                                <p className="text-foreground italic">"{fb.comment}"</p>
                                <p className="text-xs text-muted-foreground mt-3 font-medium text-right">{new Date(fb.timestamp).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-muted-foreground py-12 bg-muted/30 rounded-2xl border border-border"><p>No feedback has been submitted for this course yet.</p></div>
                    )}
                </div>
            </div>
        )
    }
    
    if (isStudent) {
        if (existingFeedback) {
             return (
                <div className="animate-fade-in max-w-2xl mx-auto">
                    <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Feedback Submitted</h3>
                        <p className="text-muted-foreground mb-6">Thank you for sharing your thoughts!</p>
                        
                         <div className="bg-muted/30 p-6 rounded-xl inline-block text-left w-full">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                {Array.from({length: 5}).map((_, i) => <StarIcon key={i} className={`w-6 h-6 ${i < existingFeedback.rating ? 'text-amber-400 fill-current' : 'text-muted'}`} />)}
                            </div>
                            <p className="text-foreground italic text-center">"{existingFeedback.comment}"</p>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
                    <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Rate this Course</h3>
                    
                    <div className="flex justify-center gap-3 mb-8">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon
                                key={star}
                                className={`w-10 h-10 cursor-pointer transition-all transform hover:scale-110 ${star <= (hoverRating || rating) ? 'text-amber-400 fill-current drop-shadow-sm' : 'text-muted'}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="font-bold text-foreground ml-1">Your Comments</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={5}
                            placeholder="What did you like? What could be improved?"
                            className="w-full bg-input border border-border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                        />
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                        <button onClick={handleSubmit} disabled={!rating || !comment.trim()} className="w-full sm:w-auto px-8 py-3.5 font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all">
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};

// --- MAIN COMPONENT ---
export const CourseDetailPage: React.FC<CourseDetailPageProps> = (props) => {
    const { course, currentUser, allUsers, students, onNavigate, currentPath, onAddNote, onAddAssignment, onTakeAttendance, onRequestToJoinCourse, onManageCourseRequest, onAddStudentsToCourse, onRemoveStudentFromCourse, onSendCourseMessage, onUpdateCoursePersonalNote, onSaveFeedback, onDeleteCourse, onUpdateCourseFaculty, initialTab } = props;
    
    const [activeTab, setActiveTab] = useState(initialTab || 'notes');
    const [isModalOpen, setIsModalOpen] = useState<'note' | 'assignment' | 'attendance' | 'addStudent' | null>(null);

    // Sync activeTab if initialTab changes (e.g., when navigating between courses via direct link)
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

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
            { id: 'notes', label: 'Notes', icon: FileTextIcon },
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
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-6 pb-20 md:pb-8">
                
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-8 rounded-3xl mb-8 shadow-lg relative overflow-hidden animate-fade-in">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <button onClick={() => onNavigate('#/academics')} className="text-blue-100 hover:text-white flex items-center gap-2 text-sm mb-6 transition-colors font-medium">
                            <ArrowLeftIcon className="w-4 h-4"/> Back to Academics
                        </button>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{course.subject}</h1>
                                <div className="flex flex-wrap gap-3 items-center text-sm font-semibold text-blue-50">
                                    <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{course.department}</span>
                                    <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Year {course.year}</span>
                                    {course.division && <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Div {course.division}</span>}
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
                                        <button onClick={() => onRequestToJoinCourse(course.id)} className="bg-white text-primary font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-50 transition-transform transform hover:scale-105">
                                            Request to Join
                                        </button>
                                    )}
                                    {!isStudent && !isFaculty && hasRequested && (
                                        <button disabled className="bg-white/20 text-blue-100 font-bold py-2 px-5 rounded-lg cursor-not-allowed border border-white/10">
                                            Request Sent
                                        </button>
                                    )}
                                    {canDeleteCourse && (
                                        <button onClick={handleDelete} className="bg-red-500/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-md">
                                            <TrashIcon className="w-4 h-4" /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isHodOfDepartment && (
                    <div className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-8 flex items-center gap-4 animate-fade-in">
                        <div className="p-2 bg-muted rounded-lg"><UsersIcon className="w-5 h-5 text-muted-foreground"/></div>
                        <div className="flex-1 flex items-center gap-4">
                            <span className="font-bold text-foreground text-sm whitespace-nowrap">HOD Control: Assign Faculty</span>
                            <select
                                id="faculty-assign"
                                value={course.facultyId}
                                onChange={(e) => onUpdateCourseFaculty(course.id, e.target.value)}
                                className="flex-1 max-w-xs bg-input border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {departmentTeachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                
                 <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24">
                        <nav className="space-y-2 bg-card p-2 rounded-2xl border border-border shadow-sm">
                            {TABS.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
                                        activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`}/>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 w-full bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border min-h-[500px]">
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
