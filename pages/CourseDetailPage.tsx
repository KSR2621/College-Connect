
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Course, AttendanceStatus, Message, Assignment, Note, AttendanceRecord } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import AddStudentToCourseModal from '../components/AddStudentToCourseModal';
import { 
    BookOpenIcon, UsersIcon, CalendarIcon, MessageIcon, SettingsIcon, 
    CheckSquareIcon, ClipboardListIcon, FileTextIcon, PlusIcon, 
    SearchIcon, ArrowLeftIcon, SendIcon, TrashIcon, CheckCircleIcon, 
    ClockIcon, ChevronRightIcon, DownloadIcon, UploadIcon
} from '../components/Icons';
import { auth, storage } from '../firebase';

// 50MB Limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface CourseDetailPageProps {
  course: Course;
  currentUser: User;
  allUsers: User[];
  students: { id: string, name: string, avatarUrl?: string, rollNo?: string }[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddNote: (courseId: string, note: { title: string, fileUrl: string, fileName: string }) => void;
  onAddAssignment: (courseId: string, assignment: { title: string, fileUrl: string, fileName: string, dueDate: number }) => void;
  onTakeAttendance: (courseId: string, record: AttendanceRecord) => void;
  onRequestToJoinCourse: (courseId: string) => void;
  onManageCourseRequest: (courseId: string, studentId: string, action: 'approve' | 'reject') => void;
  onAddStudentsToCourse: (courseId: string, studentIds: string[]) => void;
  onRemoveStudentFromCourse: (courseId: string, studentId: string) => void;
  onSendCourseMessage: (courseId: string, text: string) => void;
  onUpdateCoursePersonalNote: (courseId: string, note: string) => void;
  onSaveFeedback: (courseId: string, rating: number, comment: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateCourseFaculty: (courseId: string, newFacultyId: string) => void;
  initialTab?: string;
}

const AddAssignmentModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (data: any) => void }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [link, setLink] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'success'>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [inputType, setInputType] = useState<'file' | 'link'>('file');
    const uploadTaskRef = useRef<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > MAX_FILE_SIZE) {
                alert("File size exceeds 50MB limit. Please choose a smaller file.");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleClose = () => {
        if (status === 'uploading' && uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
        }
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;

        if (inputType === 'file' && file) {
            setStatus('uploading');
            setUploadProgress(0);
            
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`assignments/${Date.now()}_${file.name}`);
            const uploadTask = fileRef.put(file);
            uploadTaskRef.current = uploadTask;

            uploadTask.on('state_changed', 
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error: any) => {
                    console.error("Upload failed", error);
                    alert("Failed to upload file. Please try again.");
                    setStatus('idle');
                }, 
                async () => {
                    setStatus('saving');
                    const url = await uploadTask.snapshot.ref.getDownloadURL();
                    onAdd({
                        title,
                        dueDate: new Date(date).getTime(),
                        fileUrl: url,
                        fileName: file.name
                    });
                    setStatus('success');
                    onClose();
                }
            );
        } else {
            setStatus('saving');
            onAdd({
                title,
                dueDate: new Date(date).getTime(),
                fileUrl: link,
                fileName: link ? 'External Link' : ''
            });
            setStatus('success');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4 text-foreground">Add Assignment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Title</label>
                        <input className="w-full p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" placeholder="e.g., Unit 1 Homework" value={title} onChange={e => setTitle(e.target.value)} required disabled={status !== 'idle'} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Due Date</label>
                        <input className="w-full p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={status !== 'idle'} />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Attachment Type</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={inputType === 'file'} onChange={() => setInputType('file')} className="text-primary focus:ring-primary" disabled={status !== 'idle'}/>
                                <span className="text-sm text-foreground">File Upload</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={inputType === 'link'} onChange={() => setInputType('link')} className="text-primary focus:ring-primary" disabled={status !== 'idle'}/>
                                <span className="text-sm text-foreground">Link</span>
                            </label>
                        </div>

                        {inputType === 'file' ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/30 transition-colors relative">
                                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" disabled={status !== 'idle'} />
                                <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">{file ? file.name : "Click to upload PDF or File (Max 50MB)"}</p>
                                {status === 'uploading' && (
                                    <div className="mt-3 w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <input className="w-full p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} disabled={status !== 'idle'} />
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={status !== 'idle' || !title || !date} className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait">
                            {status === 'uploading' ? `Uploading ${Math.round(uploadProgress)}%` : status === 'saving' ? 'Finalizing...' : 'Add Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddMaterialModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (data: any) => void }) => {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'success'>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [inputType, setInputType] = useState<'file' | 'link'>('file');
    const uploadTaskRef = useRef<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > MAX_FILE_SIZE) {
                alert("File size exceeds 50MB limit.");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleClose = () => {
        if (status === 'uploading' && uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
        }
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (inputType === 'file' && file) {
            setStatus('uploading');
            setUploadProgress(0);
            
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`materials/${Date.now()}_${file.name}`);
            const uploadTask = fileRef.put(file);
            uploadTaskRef.current = uploadTask;

            uploadTask.on('state_changed', 
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error: any) => {
                    console.error("Upload failed", error);
                    alert("Failed to upload file.");
                    setStatus('idle');
                }, 
                async () => {
                    setStatus('saving');
                    const url = await uploadTask.snapshot.ref.getDownloadURL();
                    onAdd({
                        title,
                        fileUrl: url,
                        fileName: file.name
                    });
                    setStatus('success');
                    onClose();
                }
            );
        } else if (link) {
            setStatus('saving');
            onAdd({
                title,
                fileUrl: link,
                fileName: 'External Link'
            });
            setStatus('success');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
                <h2 className="text-xl font-bold mb-4 text-foreground">Upload Material</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Title</label>
                        <input className="w-full p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" placeholder="e.g., Lecture 1 Notes" value={title} onChange={e => setTitle(e.target.value)} required disabled={status !== 'idle'}/>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Attachment Type</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={inputType === 'file'} onChange={() => setInputType('file')} className="text-primary focus:ring-primary" disabled={status !== 'idle'}/>
                                <span className="text-sm text-foreground">File Upload</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={inputType === 'link'} onChange={() => setInputType('link')} className="text-primary focus:ring-primary" disabled={status !== 'idle'}/>
                                <span className="text-sm text-foreground">Link</span>
                            </label>
                        </div>

                        {inputType === 'file' ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/30 transition-colors relative">
                                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" disabled={status !== 'idle'} />
                                <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">{file ? file.name : "Click to upload PDF or File (Max 50MB)"}</p>
                                {status === 'uploading' && (
                                    <div className="mt-3 w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <input className="w-full p-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} disabled={status !== 'idle'} />
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={status !== 'idle' || !title} className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait">
                            {status === 'uploading' ? `Uploading ${Math.round(uploadProgress)}%` : status === 'saving' ? 'Finalizing...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CourseDetailPage: React.FC<CourseDetailPageProps> = (props) => {
    const { 
        course, currentUser, allUsers, students, onNavigate, currentPath,
        onTakeAttendance, onAddStudentsToCourse, onRemoveStudentFromCourse,
        onSendCourseMessage, onDeleteCourse, onAddAssignment, onAddNote, initialTab
    } = props;

    const [activeTab, setActiveTab] = useState(initialTab || 'attendance');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
    const [attendanceSaved, setAttendanceSaved] = useState(false);
    const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'history'>('daily');
    
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
    const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

    const [rosterSearch, setRosterSearch] = useState('');
    const [attendanceSearch, setAttendanceSearch] = useState('');

    const isFaculty = currentUser.tag === 'Teacher' || currentUser.tag === 'HOD/Dean' || currentUser.tag === 'Director';
    const isCourseFaculty = course.facultyId === currentUser.id;
    const canEdit = isFaculty && (isCourseFaculty || currentUser.tag === 'HOD/Dean' || currentUser.tag === 'Director');

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    // --- Attendance Logic ---
    useEffect(() => {
        // Reset attendance state when date changes
        const record = course.attendanceRecords?.find(r => new Date(r.date).toDateString() === new Date(attendanceDate).toDateString());
        if (record) {
            const state: Record<string, AttendanceStatus> = {};
            Object.entries(record.records).forEach(([sid, data]) => {
                state[sid] = (data as any).status;
            });
            setAttendanceState(state);
            setAttendanceSaved(true);
        } else {
            const state: Record<string, AttendanceStatus> = {};
            students.forEach(s => state[s.id] = 'present');
            setAttendanceState(state);
            setAttendanceSaved(false);
        }
    }, [attendanceDate, course.attendanceRecords, students]);

    const handleAttendanceToggle = (studentId: string, status: AttendanceStatus) => {
        setAttendanceState(prev => ({ ...prev, [studentId]: status }));
        setAttendanceSaved(false);
    };

    const handleBulkAttendance = (status: AttendanceStatus) => {
        const newState: Record<string, AttendanceStatus> = {};
        students.forEach(s => newState[s.id] = status);
        setAttendanceState(newState);
        setAttendanceSaved(false);
    };

    const saveAttendance = () => {
        const records: Record<string, { status: AttendanceStatus }> = {};
        Object.entries(attendanceState).forEach(([sid, status]) => {
            records[sid] = { status: status as AttendanceStatus };
        });
        
        // We use the selected date but current time to ensure uniqueness if multiple records per day were allowed (though currently logic assumes 1 per day)
        const timestamp = new Date(attendanceDate).setHours(12, 0, 0, 0); 

        onTakeAttendance(course.id, {
            date: timestamp,
            records: records
        });
        setAttendanceSaved(true);
        alert("Attendance saved successfully!");
    };

    // --- Chat Logic ---
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onSendCourseMessage(course.id, chatInput.trim());
            setChatInput('');
        }
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTab, course.messages]);

    // --- Memoized Data ---
    // Moved to top level to satisfy Rules of Hooks
    const sortedFilteredStudents = useMemo(() => {
        return students
            .filter(s => s.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
            .sort((a, b) => {
                // Normalize roll numbers
                const rollAStr = a.rollNo ? String(a.rollNo).trim() : '';
                const rollBStr = b.rollNo ? String(b.rollNo).trim() : '';
                
                const rollA = parseInt(rollAStr, 10);
                const rollB = parseInt(rollBStr, 10);

                // 1. Numeric Sort (if both are strictly numbers)
                if (!isNaN(rollA) && !isNaN(rollB)) {
                    return rollA - rollB;
                }
                
                // 2. Numeric vs Non-Numeric (Numeric comes first)
                if (!isNaN(rollA) && isNaN(rollB)) return -1;
                if (isNaN(rollA) && !isNaN(rollB)) return 1;

                // 3. Alphanumeric/String Roll No Sort (e.g. "CS-1", "CS-2")
                if (rollAStr && rollBStr) {
                    return rollAStr.localeCompare(rollBStr, undefined, { numeric: true, sensitivity: 'base' });
                }

                // 4. Existence Check (Has Roll No vs No Roll No)
                if (rollAStr && !rollBStr) return -1;
                if (!rollAStr && rollBStr) return 1;

                // 5. Fallback to Name Alphabetical
                return a.name.localeCompare(b.name);
            });
    }, [students, attendanceSearch]);

    // --- Render Helpers ---

    const renderAttendanceView = () => {
        if (!canEdit) {
            // Student View
            const myRecords = course.attendanceRecords || [];
            const totalClasses = myRecords.length;
            const myPresent = myRecords.filter(r => r.records[currentUser.id]?.status === 'present').length;
            const percentage = totalClasses > 0 ? Math.round((myPresent / totalClasses) * 100) : 0;

            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
                        <h3 className="text-lg font-bold text-foreground mb-2">My Attendance</h3>
                        <div className="relative h-40 w-40 mx-auto flex items-center justify-center">
                             <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-muted" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className={`${percentage >= 75 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`} strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black text-foreground">{percentage}%</span>
                                <span className="text-xs text-muted-foreground font-medium">{myPresent}/{totalClasses} Present</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-foreground px-1">History</h4>
                        {myRecords.sort((a,b) => b.date - a.date).map((record, i) => {
                            const status = record.records[currentUser.id]?.status || 'absent'; 
                            return (
                                <div key={i} className="flex justify-between items-center p-4 bg-card border border-border rounded-xl">
                                    <span className="font-medium text-foreground">{new Date(record.date).toLocaleDateString()}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {status}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            );
        }

        // Faculty View
        if (attendanceViewMode === 'history') {
            const historyRecords = (course.attendanceRecords || []).sort((a, b) => b.date - a.date);
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Attendance History</h3>
                        <button onClick={() => setAttendanceViewMode('daily')} className="text-sm font-bold text-primary hover:underline">Back to Daily View</button>
                    </div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Present</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyRecords.map((r, i) => {
                                    const presentCount = Object.values(r.records).filter((s:any) => s.status === 'present').length;
                                    const total = Object.keys(r.records).length;
                                    return (
                                        <tr key={i} className="border-b border-border hover:bg-muted/20">
                                            <td className="p-4 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="p-4">{presentCount} / {total}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => { setAttendanceDate(new Date(r.date).toISOString().split('T')[0]); setAttendanceViewMode('daily'); }}
                                                    className="text-primary font-bold text-xs hover:underline"
                                                >
                                                    View / Edit
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {historyRecords.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No records yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // Daily View
        const stats = {
            present: Object.values(attendanceState).filter(s => s === 'present').length,
            absent: Object.values(attendanceState).filter(s => s === 'absent').length,
            late: Object.values(attendanceState).filter(s => s === 'late').length,
        };

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Controls Card */}
                <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <input 
                                type="date" 
                                value={attendanceDate} 
                                onChange={e => setAttendanceDate(e.target.value)} 
                                className="bg-muted border-transparent rounded-lg px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
                            />
                            <button onClick={() => setAttendanceViewMode('history')} className="text-primary text-sm font-bold hover:underline whitespace-nowrap px-2">
                                View History
                            </button>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <input 
                                    type="text" 
                                    placeholder="Find student..." 
                                    value={attendanceSearch}
                                    onChange={e => setAttendanceSearch(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 items-center justify-between border-t border-border pt-4">
                        <div className="flex gap-4 text-sm font-bold">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Present: {stats.present}</span>
                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Absent: {stats.absent}</span>
                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">Late: {stats.late}</span>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleBulkAttendance('present')} className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors">Mark All Present</button>
                            <button type="button" onClick={() => handleBulkAttendance('absent')} className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">Mark All Absent</button>
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedFilteredStudents.map(student => (
                        <div key={student.id} className="bg-card p-3 rounded-xl border border-border shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-muted-foreground w-8 text-center bg-muted/50 rounded py-1 mr-2">
                                    {student.rollNo || '#'}
                                </span>
                                <Avatar src={student.avatarUrl} name={student.name} size="md" />
                                <div>
                                    <p className="font-bold text-sm text-foreground">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">ID: {student.id.substring(0, 6)}...</p>
                                </div>
                            </div>
                            
                            <div className="flex bg-muted rounded-lg p-1">
                                {(['present', 'absent', 'late'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleAttendanceToggle(student.id, status)}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                                            attendanceState[student.id] === status
                                            ? status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-background'
                                        }`}
                                    >
                                        {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {sortedFilteredStudents.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                            No students found in this class.
                        </div>
                    )}
                </div>

                {/* Floating Save Button */}
                <div className="sticky bottom-20 md:bottom-8 flex justify-center z-20 pointer-events-none">
                    <button 
                        type="button"
                        onClick={saveAttendance} 
                        disabled={attendanceSaved}
                        className={`pointer-events-auto px-8 py-3 rounded-full font-bold shadow-xl transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                            attendanceSaved ? 'bg-emerald-500 text-white cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                    >
                        {attendanceSaved ? <CheckCircleIcon className="w-5 h-5"/> : <CheckSquareIcon className="w-5 h-5"/>}
                        {attendanceSaved ? 'Saved' : 'Save Attendance'}
                    </button>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'attendance':
                return renderAttendanceView();
            case 'assignments':
                const assignments = course.assignments || [];
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-foreground">Assignments</h3>
                            {canEdit && (
                                <button onClick={() => setIsAddAssignmentModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90">
                                    <PlusIcon className="w-4 h-4"/> Add Assignment
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4">
                            {assignments.map((assign, i) => (
                                <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="font-bold text-foreground">{assign.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Due: {new Date(assign.dueDate).toLocaleDateString()}</p>
                                        <p className="text-xs text-muted-foreground">{assign.fileName}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {assign.fileUrl && (
                                            <a href={assign.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 flex items-center gap-1">
                                                <DownloadIcon className="w-3 h-3"/> Download
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {assignments.length === 0 && <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No assignments yet.</div>}
                        </div>
                    </div>
                );
            case 'materials':
                const materials = course.notes || [];
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-foreground">Study Materials</h3>
                            {canEdit && (
                                <button onClick={() => setIsAddMaterialModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90">
                                    <PlusIcon className="w-4 h-4"/> Upload Material
                                </button>
                            )}
                        </div>
                        <div className="grid gap-4">
                            {materials.map((mat, i) => (
                                <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <FileTextIcon className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{mat.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Uploaded {new Date(mat.uploadedAt).toLocaleDateString()}</p>
                                            {mat.fileName && <p className="text-xs text-muted-foreground italic">{mat.fileName}</p>}
                                        </div>
                                    </div>
                                    {mat.fileUrl && (
                                        <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg">
                                            <DownloadIcon className="w-5 h-5"/>
                                        </a>
                                    )}
                                </div>
                            ))}
                            {materials.length === 0 && <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No materials uploaded.</div>}
                        </div>
                    </div>
                );
            case 'roster':
                // Sort Roster students too using same logic as attendance
                const sortedRosterStudents = students
                    .filter(s => s.name.toLowerCase().includes(rosterSearch.toLowerCase()))
                    .sort((a, b) => {
                        const rollAStr = a.rollNo ? String(a.rollNo).trim() : '';
                        const rollBStr = b.rollNo ? String(b.rollNo).trim() : '';
                        const rollA = parseInt(rollAStr, 10);
                        const rollB = parseInt(rollBStr, 10);

                        if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
                        if (!isNaN(rollA) && isNaN(rollB)) return -1;
                        if (isNaN(rollA) && !isNaN(rollB)) return 1;
                        if (rollAStr && rollBStr) return rollAStr.localeCompare(rollBStr, undefined, { numeric: true, sensitivity: 'base' });
                        if (rollAStr && !rollBStr) return -1;
                        if (!rollAStr && rollBStr) return 1;
                        return a.name.localeCompare(b.name);
                    });

                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div className="relative w-full md:w-64">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <input 
                                    type="text" 
                                    placeholder="Search roster..." 
                                    value={rosterSearch}
                                    onChange={e => setRosterSearch(e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            {canEdit && (
                                <button onClick={() => setIsAddStudentModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all">
                                    <PlusIcon className="w-4 h-4"/> Add Student
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedRosterStudents.map(s => (
                                <div key={s.id} className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3" onClick={() => onNavigate(`#/profile/${s.id}`)}>
                                        <span className="font-mono text-xs font-bold text-muted-foreground w-8 text-center bg-muted/50 rounded py-1">
                                            {s.rollNo || '#'}
                                        </span>
                                        <Avatar src={s.avatarUrl} name={s.name} size="md"/>
                                        <div>
                                            <p className="font-bold text-sm text-foreground cursor-pointer hover:underline">{s.name}</p>
                                            <p className="text-xs text-muted-foreground">Student</p>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <button onClick={() => { if(window.confirm('Remove student from course?')) onRemoveStudentFromCourse(course.id, s.id) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {students.length === 0 && <div className="col-span-full text-center p-8 text-muted-foreground">No students enrolled.</div>}
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className="h-[calc(100vh-280px)] flex flex-col animate-fade-in bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {(course.messages || []).map((msg, idx) => {
                                const isMe = msg.senderId === currentUser.id;
                                const sender = allUsers.find(u => u.id === msg.senderId);
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {!isMe && <Avatar src={sender?.avatarUrl} name={sender?.name || 'User'} size="xs" />}
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                            <span className="text-[10px] text-muted-foreground mb-1 ml-1">{sender?.name}</span>
                                            <div className={`px-4 py-2 text-sm rounded-2xl shadow-sm break-words ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-foreground border border-border rounded-tl-sm'}`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-muted-foreground mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 bg-card border-t border-border">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input 
                                    className="flex-1 bg-muted/50 border-transparent focus:border-primary border rounded-full px-4 py-2.5 text-sm focus:outline-none"
                                    placeholder="Message class..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                />
                                <button type="submit" disabled={!chatInput.trim()} className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 shadow-md">
                                    <SendIcon className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                );
            case 'settings':
                if (!canEdit) return <div className="p-12 text-center text-muted-foreground">Access Denied</div>;
                return (
                    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm animate-fade-in">
                        <h3 className="text-lg font-bold mb-4 text-destructive flex items-center gap-2"><TrashIcon className="w-5 h-5"/> Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">Deleting a course will remove all attendance records, assignments, and messages associated with it. This action cannot be undone.</p>
                        <button 
                            onClick={() => { if(window.confirm("Delete this course permanently?")) { onDeleteCourse(course.id); onNavigate('#/academics'); } }}
                            className="bg-destructive text-destructive-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        >
                            Delete Course
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-background min-h-screen flex flex-col">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-6 pb-24 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <button onClick={() => onNavigate('#/academics')} className="text-xs font-bold text-muted-foreground hover:text-primary mb-2 flex items-center gap-1">
                            <ArrowLeftIcon className="w-3 h-3"/> Back to Academics
                        </button>
                        <h1 className="text-3xl font-black text-foreground">{course.subject}</h1>
                        <p className="text-muted-foreground font-medium">{course.department} • Year {course.year}</p>
                    </div>
                    {isFaculty && (
                        <div className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/10">
                            Faculty Access
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-1 border-b border-border">
                    {[
                        { id: 'attendance', label: 'Attendance', icon: CheckSquareIcon },
                        { id: 'assignments', label: 'Assignments', icon: ClipboardListIcon },
                        { id: 'materials', label: 'Materials', icon: FileTextIcon },
                        { id: 'roster', label: 'Roster', icon: UsersIcon },
                        { id: 'chat', label: 'Chat', icon: MessageIcon },
                        ...(canEdit ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                            <tab.icon className="w-4 h-4"/> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {renderTabContent()}
                </div>
            </main>

            <AddStudentToCourseModal 
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                onAddStudents={(ids) => onAddStudentsToCourse(course.id, ids)}
                availableStudents={allUsers.filter(u => u.tag === 'Student' && !course.students?.includes(u.id))}
            />
            
            <AddAssignmentModal 
                isOpen={isAddAssignmentModalOpen}
                onClose={() => setIsAddAssignmentModalOpen(false)}
                onAdd={(data) => onAddAssignment(course.id, data)}
            />

            <AddMaterialModal 
                isOpen={isAddMaterialModalOpen}
                onClose={() => setIsAddMaterialModalOpen(false)}
                onAdd={(data) => onAddNote(course.id, data)}
            />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default CourseDetailPage;
