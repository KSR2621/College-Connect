import React, { useState, useMemo, useRef } from 'react';
import type { User, PersonalNote } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { NotebookIcon, PlusIcon, SearchIcon, TrashIcon, ArrowLeftIcon } from '../components/Icons';

interface PersonalNotesPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
  onCreateNote: (title: string, content: string) => void;
  onUpdateNote: (noteId: string, title: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NoteEditor: React.FC<{
    note: PersonalNote | { title: string, content: string };
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
    isNew: boolean;
}> = ({ note, onSave, onCancel, isNew }) => {
    const [title, setTitle] = useState(note.title);
    const editorRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
        const content = editorRef.current?.innerHTML || '';
        if (!title.trim()) {
            alert("Please enter a title for your note.");
            return;
        }
        onSave(title, content);
    };
    
    const applyStyle = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border flex flex-col h-full animate-fade-in">
            <div className="p-4 border-b border-border">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full text-2xl font-bold bg-transparent focus:outline-none text-foreground"
                />
            </div>
            <div className="p-2 border-b border-border flex items-center gap-2">
                 <button onMouseDown={e => { e.preventDefault(); applyStyle('bold'); }} className="font-bold w-8 h-8 rounded hover:bg-muted">B</button>
                 <button onMouseDown={e => { e.preventDefault(); applyStyle('italic'); }} className="italic w-8 h-8 rounded hover:bg-muted">I</button>
                 <button onMouseDown={e => { e.preventDefault(); applyStyle('underline'); }} className="underline w-8 h-8 rounded hover:bg-muted">U</button>
                 <button onMouseDown={e => { e.preventDefault(); applyStyle('insertUnorderedList'); }} className="w-8 h-8 rounded hover:bg-muted">UL</button>
                 <button onMouseDown={e => { e.preventDefault(); applyStyle('insertOrderedList'); }} className="w-8 h-8 rounded hover:bg-muted">OL</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                dangerouslySetInnerHTML={{ __html: note.content }}
                className="flex-1 p-4 focus:outline-none overflow-y-auto no-scrollbar"
                data-placeholder="Start writing your note here..."
            />
            <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Save Note</button>
            </div>
        </div>
    );
};

const PersonalNotesPage: React.FC<PersonalNotesPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, onCreateNote, onUpdateNote, onDeleteNote } = props;
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const notes = useMemo(() => (currentUser.personalNotes || []).sort((a, b) => b.timestamp - a.timestamp), [currentUser.personalNotes]);

    const filteredNotes = useMemo(() => {
        if (!searchTerm.trim()) return notes;
        const lowercasedSearch = searchTerm.toLowerCase();
        return notes.filter(note => 
            note.title.toLowerCase().includes(lowercasedSearch) ||
            note.content.toLowerCase().includes(lowercasedSearch)
        );
    }, [notes, searchTerm]);
    
    const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleSaveNewNote = (title: string, content: string) => {
        onCreateNote(title, content);
        setIsCreating(false);
    };

    const handleUpdateNote = (title: string, content: string) => {
        if (selectedNoteId) {
            onUpdateNote(selectedNoteId, title, content);
            setSelectedNoteId(null);
        }
    };
    
    const handleDelete = (noteId: string) => {
        if(window.confirm("Are you sure you want to delete this note?")) {
            onDeleteNote(noteId);
            if (selectedNoteId === noteId) {
                setSelectedNoteId(null);
            }
        }
    }
    
    const viewToShow = isCreating || selectedNoteId;

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto pt-8 pb-20 md:pb-8 h-[calc(100vh-64px-32px)]">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                    {/* Note List (Sidebar) */}
                    <div className={`md:flex flex-col ${viewToShow ? 'hidden md:flex' : 'flex'}`}>
                        <div className="flex justify-between items-center mb-4">
                             <h1 className="text-2xl font-bold text-foreground">Personal Notes</h1>
                             <button onClick={() => { setIsCreating(true); setSelectedNoteId(null); }} className="p-2 rounded-full hover:bg-muted text-primary"><PlusIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="relative mb-4">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search notes..." className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div className="bg-card rounded-lg shadow-sm border border-border flex-1 overflow-y-auto no-scrollbar">
                           {filteredNotes.length > 0 ? (
                                filteredNotes.map(note => (
                                    <div 
                                        key={note.id} 
                                        onClick={() => { setSelectedNoteId(note.id); setIsCreating(false); }}
                                        className={`p-4 cursor-pointer border-l-4 ${selectedNoteId === note.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'}`}
                                    >
                                        <h3 className="font-semibold text-card-foreground truncate">{note.title}</h3>
                                        <p className="text-xs text-text-muted mt-1">{new Date(note.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))
                           ) : (
                                <div className="text-center p-8 text-text-muted">
                                    <NotebookIcon className="w-12 h-12 mx-auto mb-2"/>
                                    <p>{searchTerm ? `No notes found for "${searchTerm}"` : "You have no personal notes."}</p>
                                    <p className="text-sm">Click the '+' to create one.</p>
                                </div>
                           )}
                        </div>
                    </div>
                    {/* Editor / Details View */}
                    <div className={`md:col-span-2 h-full ${!viewToShow ? 'hidden md:block' : 'block'}`}>
                        {isCreating && (
                            <NoteEditor note={{ title: '', content: '' }} onSave={handleSaveNewNote} onCancel={() => setIsCreating(false)} isNew={true}/>
                        )}
                        {selectedNote && (
                            <NoteEditor note={selectedNote} onSave={handleUpdateNote} onCancel={() => setSelectedNoteId(null)} isNew={false}/>
                        )}
                        {!isCreating && !selectedNote && (
                             <div className="flex flex-col items-center justify-center h-full bg-card rounded-lg border border-border text-text-muted text-center p-8">
                                <NotebookIcon className="w-20 h-20 mx-auto mb-4"/>
                                <h2 className="text-xl font-semibold text-foreground">Select a note to view or edit</h2>
                                <p>Or create a new one to get started.</p>
                                <button onClick={() => { setIsCreating(true); setSelectedNoteId(null); }} className="mt-4 bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2">
                                    <PlusIcon className="w-5 h-5"/>
                                    Create New Note
                                </button>
                             </div>
                        )}
                    </div>
                </div>
            </main>

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default PersonalNotesPage;