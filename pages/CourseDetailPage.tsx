

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User, Course, Student, Note, Assignment, AttendanceStatus, AttendanceRecord, Message } from 'types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { ArrowLeftIcon, UploadIcon, ClipboardListIcon, CheckSquareIcon, CloseIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SearchIcon, ArrowRightIcon, PlusIcon, TrashIcon, UserPlusIcon, MessageIcon, SendIcon } from '../components/Icons';

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
            fileUrl: URL.createObjectURL(file),
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

    // FIX: Provide a full default object when spreading to ensure type safety, preventing errors when `prev[studentId]` is undefined.
    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || { status: 'present', note: '' }), status } }));
    };

    // FIX: Provide a full default object when spreading to ensure type safety, preventing errors when `prev[studentId]` is undefined.
    const handleNoteChange = (studentId: string, note: string) => {
        setAttendance(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || { status: 'present', note: '' }), note } }));
    };

    const markAllPresent = () => {
        setAttendance(prev => {
            const newAttendance = { ...prev };
            students.forEach(student => {
                const record = newAttendance[student.id] || { status: 'present', note: '' };
                newAttendance[student.id] = { ...record, status: 'present' };
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
                <div className="flex-1 overflow-y-auto p-2">
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
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotes = useMemo(() => {
        if (!searchTerm.trim()) return course.notes || [];
        const lowercasedSearch = searchTerm.toLowerCase();
        return (course.notes || []).filter(note => 
            note.title.toLowerCase().includes(lowercasedSearch) || 
            note.fileName.toLowerCase().includes(lowercasedSearch)
        );
    }, [course.notes, searchTerm]);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            {canUpload && <button onClick={onUpload} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><UploadIcon className="w-5 h-5"/>Upload Note</button>}
            {filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                    <div key={note.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                        <h4 className="font-bold">{note.title}</h4>
                        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{note.fileName}</a>
                        <p className="text-xs text-text-muted mt-1">Uploaded on {new Date(note.uploadedAt).toLocaleDateString()}</p>
                    </div>
                ))
            ) : <p className="text-center text-text-muted p-8">{searchTerm ? `No notes found for "${searchTerm}"` : "No notes have been uploaded yet."}</p>}
        </div>
    );
};


const AssignmentsTab: React.FC<{ course: Course; isFaculty: boolean; onUpload: () => void; }> = ({ course, isFaculty, onUpload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredAssignments = useMemo(() => {
        if (!searchTerm.trim()) return course.assignments || [];
        const lowercasedSearch = searchTerm.toLowerCase();
        return (course.assignments || []).filter(ass => 
            ass.title.toLowerCase().includes(lowercasedSearch) || 
            ass.fileName.toLowerCase().includes(lowercasedSearch)
        );
    }, [course.assignments, searchTerm]);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                    type="text" 
                    placeholder="Search assignments..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            {isFaculty && <button onClick={onUpload} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><ClipboardListIcon className="w-5 h-5" />Post Assignment</button>}
            {filteredAssignments.length > 0 ? (
                filteredAssignments.map(ass => (
                    <div key={ass.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                        <h4 className="font-bold">{ass.title}</h4>
                        <a href={ass.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{ass.fileName}</a>
                        <p className="text-xs text-text-muted mt-1">Due: <span className="font-semibold">{new Date(ass.dueDate).toLocaleString()}</span></p>
                    </div>
                ))
            ) : <p className="text-center text-text-muted p-8">{searchTerm ? `No assignments found for "${searchTerm}"` : "No assignments have been posted yet."}</p>}
        </div>
    );
};

const AttendanceTab: React.FC<{ course: Course; isFaculty: boolean; currentUser: User; students: Student[]; onTakeAttendance: () => void; }> = ({ course, isFaculty, currentUser, students, onTakeAttendance }) => {
    const [expandedDate, setExpandedDate] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const statusInfo: Record<AttendanceStatus, { icon: React.FC<any>, text: string, classes: string }> = {
        present: { icon: CheckCircleIcon, text: 'Present', classes: 'text-emerald-500 bg-emerald-50' },
        absent: { icon: XCircleIcon, text: 'Absent', classes: 'text-red-500 bg-red-50' },
        late: { icon: ClockIcon, text: 'Late', classes: 'text-amber-500 bg-amber-50' },
    };

    const handleToggleExpand = (date: number) => {
        setExpandedDate(expandedDate === date ? null : date);
    };

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        return students.filter(s => s.name.toLowerCase().includes(lowercasedSearch));
    }, [students, searchTerm]);

    const attendanceRecords = useMemo(() => (course.attendanceRecords || []).sort((a, b) => b.date - a.date), [course.attendanceRecords]);

    return (
        <div className="space-y-4 animate-fade-in">
            {isFaculty && <button onClick={onTakeAttendance} className="w-full bg-primary/10 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"><CheckSquareIcon className="w-5 h-5" />Take Today's Attendance</button>}
            
            {isFaculty && (
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search for a student to see their history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            )}

            {searchTerm ? (
                <div className="space-y-4">
                    {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div key={student.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                            <div className="flex items-center space-x-3 mb-3">
                                <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                <h4 className="font-bold text-lg">{student.name}</h4>
                            </div>
                            <div className="border-t border-border pt-3 space-y-2">
                                {attendanceRecords.map(rec => {
                                    const studentRecord = rec.records[student.id];
                                    if (!studentRecord) return null;
                                    const status = studentRecord.status;
                                    const note = studentRecord.note;
                                    const StatusIcon = statusInfo[status].icon;
                                    return (
                                        <div key={rec.date} className="text-sm">
                                            <div className="flex justify-between items-center">
                                                <p className="text-text-muted">{new Date(rec.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                <div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${statusInfo[status].classes}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    <span>{statusInfo[status].text}</span>
                                                </div>
                                            </div>
                                            {note && <p className="mt-1 pl-1 text-xs text-text-muted border-l-2 border-border ml-1 pl-2">Note: {note}</p>}
                                        </div>
                                    );
                                })}
                                {attendanceRecords.every(rec => !rec.records[student.id]) && (
                                     <p className="text-center text-text-muted p-4">No attendance records for this student.</p>
                                )}
                            </div>
                        </div>
                    )) : (
                         <p className="text-center text-text-muted p-8">No students found matching "{searchTerm}".</p>
                    )}
                </div>
            ) : (
                attendanceRecords.length > 0 ? (
                    attendanceRecords.map(rec => {
                        const total = Object.keys(rec.records).length;
                        const present = Object.values(rec.records).filter(s => s.status === 'present').length;
                        const userRecord = !isFaculty ? rec.records[currentUser.id] : undefined;
                        const isExpanded = expandedDate === rec.date;

                        return (
                            <div key={rec.date} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                                <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50" onClick={() => isFaculty && handleToggleExpand(rec.date)}>
                                    <div>
                                        <h4 className="font-bold">{new Date(rec.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</h4>
                                        {isFaculty && <p className="text-sm text-text-muted">{present} of {total} students present</p>}
                                    </div>
                                    {!isFaculty && userRecord && (() => {
                                        const StatusComponent = statusInfo[userRecord.status];
                                        const Icon = StatusComponent.icon;
                                        return (
                                            <div className="flex flex-col items-end">
                                                <div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${StatusComponent.classes}`}>
                                                    <Icon className="w-4 h-4" />
                                                    <span>{StatusComponent.text}</span>
                                                </div>
                                                {userRecord.note && <p className="text-xs text-text-muted mt-1">Note: {userRecord.note}</p>}
                                            </div>
                                        );
                                    })()}
                                    {isFaculty && (
                                        <ArrowRightIcon className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    )}
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-border p-4 bg-slate-50">
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {students.map(student => {
                                                const studentRecord = rec.records[student.id];
                                                if (!studentRecord) return null;
                                                const status = studentRecord.status;
                                                const note = studentRecord.note;
                                                const StatusIcon = statusInfo[status].icon;
                                                return (
                                                    <div key={student.id} className="p-2 rounded-md hover:bg-white">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar src={student.avatarUrl} name={student.name} size="sm" />
                                                                <p>{student.name}</p>
                                                            </div>
                                                            <div className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-md text-xs ${statusInfo[status].classes}`}>
                                                                <StatusIcon className="w-4 h-4" />
                                                                <span>{statusInfo[status].text}</span>
                                                            </div>
                                                        </div>
                                                        {note && <p className="mt-1 text-xs text-text-muted border-l-2 border-border ml-3 pl-2">Note: {note}</p>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : <p className="text-center text-text-muted p-8">No attendance has been recorded yet.</p>
            )}
        </div>
    );
};

const RosterTab: React.FC<{
    course: Course;
    allUsers: User[];
    onManageRequest: (studentId: string, action: 'approve' | 'decline') => void;
    onAddStudents: () => void;
    onRemoveStudent: (studentId: string) => void;
}> = ({ course, allUsers, onManageRequest, onAddStudents, onRemoveStudent }) => {
    const pendingStudents = useMemo(() => (course.pendingStudents || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[], [course.pendingStudents, allUsers]);
    const enrolledStudents = useMemo(() => (course.students || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[], [course.students, allUsers]);

    return (
        <div className="space-y-6 animate-fade-in">
            {pendingStudents.length > 0 && (
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                    <h4 className="font-bold text-lg mb-3">Pending Requests ({pendingStudents.length})</h4>
                    <div className="space-y-3">
                        {pendingStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50">
                                <div className="flex items-center space-x-3">
                                    <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                    <div>
                                        <p className="font-semibold">{student.name}</p>
                                        <p className="text-sm text-text-muted">{student.department}</p>
                                    </div>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => onManageRequest(student.id, 'approve')} className="bg-primary/20 text-primary font-semibold py-1 px-3 rounded-full text-xs hover:bg-primary/30">Approve</button>
                                    <button onClick={() => onManageRequest(student.id, 'decline')} className="bg-destructive/20 text-destructive font-semibold py-1 px-3 rounded-full text-xs hover:bg-destructive/30">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">Enrolled Students ({enrolledStudents.length})</h4>
                    <button onClick={onAddStudents} className="bg-primary text-primary-foreground font-bold py-1.5 px-3 rounded-full text-xs inline-flex items-center gap-1 hover:bg-primary/90"><UserPlusIcon className="w-4 h-4" />Add</button>
                </div>
                 <div className="space-y-3">
                    {enrolledStudents.map(student => (
                         <div key={student.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                            <div className="flex items-center space-x-3">
                                <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                <div>
                                    <p className="font-semibold">{student.name}</p>
                                </div>
                            </div>
                            <button onClick={() => onRemoveStudent(student.id)} className="text-destructive p-1 rounded-full hover:bg-destructive/10"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    ))}
                    {enrolledStudents.length === 0 && <p className="text-center text-text-muted py-4">No students are enrolled in this course.</p>}
                 </div>
            </div>
        </div>
    )
};

const CourseChatTab: React.FC<{
    course: Course;
    currentUser: User;
    allUsers: User[];
    onSendCourseMessage: (courseId: string, text: string) => void;
}> = ({ course, currentUser, allUsers, onSendCourseMessage }) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const usersMap = useMemo(() => Object.fromEntries(allUsers.map(u => [u.id, u])), [allUsers]);
    const messages = course.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSendCourseMessage(course.id, text.trim());
            setText('');
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border h-[70vh] flex flex-col animate-fade-in">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-center text-text-muted mt-8">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map(msg => {
                        const sender = usersMap[msg.senderId];
                        if (!sender) return null;
                        const isCurrentUser = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                {!isCurrentUser && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" />}
                                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    {!isCurrentUser && <p className="text-xs text-text-muted mb-1">{sender.name}</p>}
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-card-foreground'}`}>
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                    </div>
                                     <p className="text-xs text-text-muted mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-slate-50">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message to the class..."
                        className="flex-1 bg-white border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                    />
                    <button type="submit" className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!text.trim()}>
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const PersonalNoteTab: React.FC<{
    noteContent: string;
    onSave: (content: string) => void;
}> = ({ noteContent, onSave }) => {
    const [note, setNote] = useState(noteContent);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackText, setFeedbackText] = useState('Save Note');

    useEffect(() => {
        setNote(noteContent);
    }, [noteContent]);

    const handleSave = () => {
        setIsSaving(true);
        setFeedbackText('Saving...');
        onSave(note);
        setTimeout(() => {
            setFeedbackText('Saved!');
            setIsSaving(false);
            setTimeout(() => setFeedbackText('Save Note'), 2000);
        }, 1000);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border animate-fade-in">
            <h3 className="text-xl font-bold text-foreground mb-3">Private Note</h3>
            <p className="text-sm text-text-muted mb-4">This note is only visible to you. Use it to keep track of reminders, student progress, or ideas for this course.</p>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={10}
                className="w-full bg-input border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Start typing your private note..."
            />
            <div className="mt-4 text-right">
                <button
                    onClick={handleSave}
                    className={`px-6 py-2 font-bold text-primary-foreground rounded-lg transition-colors w-32 ${isSaving ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}
                    disabled={isSaving && feedbackText === 'Saving...'}
                >
                    {feedbackText}
                </button>
            </div>
        </div>
    );
};


const CourseDetailPage: React.FC<CourseDetailPageProps> = (props) => {
    const { course, currentUser, students, allUsers, onNavigate, currentPath, onAddNote, onAddAssignment, onTakeAttendance, onRequestToJoinCourse, onManageCourseRequest, onAddStudentsToCourse, onRemoveStudentFromCourse, onSendCourseMessage, onUpdateCoursePersonalNote } = props;
    
    const isFacultyOwner = currentUser.id === course.facultyId;
    const isEnrolledStudent = course.students?.includes(currentUser.id) ?? false;
    const isPendingStudent = course.pendingStudents?.includes(currentUser.id) ?? false;
    const canViewContent = isFacultyOwner || isEnrolledStudent;
    const canUploadContent = isFacultyOwner || isEnrolledStudent;

    const tabs = useMemo(() => {
        const baseTabs: { id: string, label: string }[] = [
            { id: 'notes', label: 'Notes' },
            { id: 'assignments', label: 'Assignments' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'chat', label: 'Chat' },
        ];
        if (isFacultyOwner) {
            baseTabs.push({ id: 'roster', label: 'Roster' });
        }
        if (isFacultyOwner || isEnrolledStudent) {
            baseTabs.push({ id: 'personal-note', label: 'Personal Note' });
        }
        return baseTabs;
    }, [isFacultyOwner, isEnrolledStudent]);

    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const [modal, setModal] = useState<'note' | 'assignment' | 'attendance' | 'addStudent' | null>(null);
    const [sliderStyle, setSliderStyle] = useState({});
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        const tabElement = tabsRef.current[tabIndex];
        if (tabElement) {
            tabElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    };

    useEffect(() => {
        const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
        const activeTabElement = tabsRef.current[activeTabIndex];
        if (activeTabElement) {
            setSliderStyle({
                left: activeTabElement.offsetLeft,
                width: activeTabElement.offsetWidth,
            });
        }
    }, [activeTab, tabs]);


    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };
    
    const handleSaveNote = (data: Omit<Note, 'id'>) => {
        onAddNote(course.id, { ...data, uploadedAt: Date.now() });
    };
    
    const handleSaveAssignment = (data: Omit<Assignment, 'id'>) => {
        onAddAssignment(course.id, { ...data, postedAt: Date.now() });
    };

    const handleSaveAttendance = (data: Omit<AttendanceRecord, 'date'>) => {
        onTakeAttendance(course.id, data);
    };
    
    const handleAddStudents = (studentIds: string[]) => {
        onAddStudentsToCourse(course.id, studentIds);
    };

    const handleRemoveStudent = (studentId: string) => {
        if (window.confirm("Are you sure you want to remove this student from the course?")) {
            onRemoveStudentFromCourse(course.id, studentId);
        }
    };


    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <button onClick={() => onNavigate('#/academics')} className="flex items-center text-sm text-primary mb-4 font-semibold">
                            <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                            Back to All Courses
                        </button>
                        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-foreground">{course.subject}</h1>
                                    <p className="text-md text-text-muted mt-1">{course.department}</p>
                                    {course.description && <p className="text-sm text-text-muted mt-2 max-w-2xl">{course.description}</p>}
                                </div>
                                {!canViewContent && currentUser.tag === 'Student' && (
                                    <div className="mt-4 sm:mt-0">
                                        {isPendingStudent ? (
                                            <button disabled className="w-full sm:w-auto bg-muted text-text-muted font-bold py-2.5 px-6 rounded-full cursor-not-allowed">Request Sent</button>
                                        ) : (
                                            <button onClick={() => onRequestToJoinCourse(course.id)} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105">Request to Join</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {canViewContent ? (
                        <>
                            {/* Sliding Tabs */}
                            <div className="mb-6">
                                <div className="border-b border-border">
                                    <nav className="relative flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                                        {tabs.map((tab, index) => (
                                             <button 
                                                key={tab.id}
                                                ref={el => { tabsRef.current[index] = el; }}
                                                onClick={() => handleTabClick(tab.id)} 
                                                className={`transition-colors duration-200 whitespace-nowrap py-4 px-2 font-medium text-sm z-10 ${activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-foreground'}`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                        <div 
                                            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
                                            style={sliderStyle}
                                        />
                                    </nav>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="mt-6">
                                {activeTab === 'notes' && <NotesTab course={course} canUpload={canUploadContent} onUpload={() => setModal('note')} />}
                                {activeTab === 'assignments' && <AssignmentsTab course={course} isFaculty={isFacultyOwner} onUpload={() => setModal('assignment')} />}
                                {activeTab === 'attendance' && <AttendanceTab course={course} isFaculty={isFacultyOwner} currentUser={currentUser} students={students} onTakeAttendance={() => setModal('attendance')} />}
                                {activeTab === 'chat' && <CourseChatTab course={course} currentUser={currentUser} allUsers={allUsers} onSendCourseMessage={onSendCourseMessage} />}
                                {activeTab === 'roster' && isFacultyOwner && <RosterTab course={course} allUsers={allUsers} onManageRequest={(studentId, action) => onManageCourseRequest(course.id, studentId, action)} onAddStudents={() => setModal('addStudent')} onRemoveStudent={handleRemoveStudent} />}
                                {activeTab === 'personal-note' && (isFacultyOwner || isEnrolledStudent) && <PersonalNoteTab noteContent={course.personalNotes?.[currentUser.id] || ''} onSave={(content) => onUpdateCoursePersonalNote(course.id, currentUser.id, content)} />}
                            </div>
                        </>
                    ) : (
                         <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                            <h3 className="text-lg font-semibold text-foreground">Request to join this course to view its content.</h3>
                        </div>
                    )}

                </div>
            </main>

            {modal === 'note' && canUploadContent && <UploadResourceModal course={course} onClose={() => setModal(null)} resourceType="Note" onSave={handleSaveNote} />}
            {isFacultyOwner && modal === 'assignment' && <UploadResourceModal course={course} onClose={() => setModal(null)} resourceType="Assignment" onSave={handleSaveAssignment} />}
            {isFacultyOwner && modal === 'attendance' && <TakeAttendanceModal course={course} students={students} onClose={() => setModal(null)} onSave={handleSaveAttendance} />}
            {isFacultyOwner && modal === 'addStudent' && <AddStudentModal allUsers={allUsers} course={course} onClose={() => setModal(null)} onAddStudents={handleAddStudents} />}

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default CourseDetailPage;