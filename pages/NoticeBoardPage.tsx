import React, { useState, useMemo, useRef } from 'react';
import type { User, Notice } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { MegaphoneIcon, PlusIcon, CloseIcon, ChevronDownIcon, TrashIcon, CheckSquareIcon } from '../components/Icons';

// Constants for filters and creation
const departmentOptions = ["Computer Science", "Mechanical Eng.", "Literature", "Mathematics", "Electrical Eng.", "Civil Eng."];
const yearOptions = [{ val: 1, label: "1st Year" }, { val: 2, label: "2nd Year" }, { val: 3, label: "3rd Year" }, { val: 4, label: "4th Year" }, { val: 5, label: "Graduate" }];

// --- PROPS ---
interface NoticeBoardPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  notices: Notice[];
  users: { [key: string]: User };
  onCreateNotice: (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => void;
  onDeleteNotice: (noticeId: string) => void;
}

// --- MODAL & SUB-COMPONENTS ---
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
                            <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto">
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
                             <div className="space-y-2 p-3 bg-input rounded-lg border border-border max-h-40 overflow-y-auto">
                                {yearOptions.map(year => (
                                    <label key={year.val} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={targetYears.includes(year.val)} onChange={() => handleYearToggle(year.val)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                        <span>{year.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
                    <button onClick={handleSubmit} className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">Post Notice</button>
                </div>
            </div>
        </div>
    );
};

const NoticeCard: React.FC<{
    notice: Notice;
    author: User | undefined;
    currentUser: User;
    onDelete: (noticeId: string) => void;
}> = ({ notice, author, currentUser, onDelete }) => {
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
            {/* FIX: Add safe access to optional properties `targetDepartments` and `targetYears` to prevent runtime errors. */}
            {(notice.targetDepartments && notice.targetDepartments.length > 0 || notice.targetYears && notice.targetYears.length > 0) && (
                <div className="bg-muted/50 px-5 py-2 border-t border-border flex flex-wrap gap-2 text-xs">
                    {notice.targetDepartments?.map(d => <span key={d} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{d}</span>)}
                    {notice.targetYears?.map(y => <span key={y} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{yearOptions.find(yo => yo.val === y)?.label}</span>)}
                </div>
            )}
        </div>
    );
};

// --- MAIN PAGE ---
const NoticeBoardPage: React.FC<NoticeBoardPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, notices, users, onCreateNotice, onDeleteNotice } = props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([]);

    const handleLogout = async () => { auth.signOut(); onNavigate('#/'); };
    const isFaculty = currentUser.tag === 'Faculty';
    
    const handleDeptToggle = (dept: string) => setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    const handleYearToggle = (year: number) => setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);

    const filteredNotices = useMemo(() => {
        return notices.filter(notice => {
            // FIX: Safely access optional properties by providing default empty arrays.
            const noticeDepts = notice.targetDepartments || [];
            const noticeYears = notice.targetYears || [];
            const deptMatch = selectedDepartments.length === 0 || noticeDepts.length === 0 || noticeDepts.some(d => selectedDepartments.includes(d));
            const yearMatch = selectedYears.length === 0 || noticeYears.length === 0 || noticeYears.some(y => selectedYears.includes(y));
            return deptMatch && yearMatch;
        });
    }, [notices, selectedDepartments, selectedYears]);
    
    const clearFilters = () => {
        setSelectedDepartments([]);
        setSelectedYears([]);
    }

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-8 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/10 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4"><MegaphoneIcon className="w-8 h-8"/></div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Notice Board</h1>
                        <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">Official announcements and updates from faculty.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 bg-card p-4 rounded-lg shadow-sm border border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Filters</h3>
                                <button onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">Clear All</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-text-muted mb-2">By Department</h4>
                                    <div className="space-y-2">
                                        {departmentOptions.map(dept => (
                                            <label key={dept} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selectedDepartments.includes(dept)} onChange={() => handleDeptToggle(dept)} className="h-4 w-4 rounded text-primary focus:ring-primary"/><span>{dept}</span></label>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-text-muted mb-2">By Year</h4>
                                    <div className="space-y-2">
                                        {yearOptions.map(year => (
                                            <label key={year.val} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selectedYears.includes(year.val)} onChange={() => handleYearToggle(year.val)} className="h-4 w-4 rounded text-primary focus:ring-primary"/><span>{year.label}</span></label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Notices */}
                    <div className="lg:col-span-3 space-y-6">
                         {isFaculty && <button onClick={() => setIsCreateModalOpen(true)} className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5"/>Post New Notice</button>}
                        {filteredNotices.length > 0 ? (
                            filteredNotices.map(notice => (
                                <NoticeCard key={notice.id} notice={notice} author={users[notice.authorId]} currentUser={currentUser} onDelete={onDeleteNotice} />
                            ))
                        ) : (
                            <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                                <h3 className="text-lg font-semibold text-foreground">No notices found</h3>
                                <p className="mt-2">Try adjusting your filters or check back later.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {isCreateModalOpen && <CreateNoticeModal onClose={() => setIsCreateModalOpen(false)} onCreateNotice={onCreateNotice} />}
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default NoticeBoardPage;