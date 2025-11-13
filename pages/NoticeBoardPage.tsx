import React, { useState, useMemo, useRef } from 'react';
import type { User, Notice } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { MegaphoneIcon, PlusIcon, CloseIcon, ChevronDownIcon, TrashIcon, CheckSquareIcon } from '../components/Icons';
// FIX: Centralize constants by importing from constants.ts to remove local definitions.
// FIX: `departmentOptions` is not in constants.ts; it is college-specific. Importing `yearOptions` only and defining a placeholder for departments.
import { yearOptions } from '../constants';

const departmentOptions = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration'];

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
                                    </
