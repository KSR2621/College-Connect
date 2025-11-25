
import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { SearchIcon, PlusIcon, CheckCircleIcon, CloseIcon } from './Icons';
import Avatar from './Avatar';

interface AddStudentToCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudents: (studentIds: string[]) => void;
  availableStudents: User[];
}

const AddStudentToCourseModal: React.FC<AddStudentToCourseModalProps> = ({ isOpen, onClose, onAddStudents, availableStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return availableStudents;
    const lower = searchTerm.toLowerCase();
    return availableStudents.filter(s => s.name.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower));
  }, [availableStudents, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (selectedStudentIds.length > 0) {
      onAddStudents(selectedStudentIds);
      onClose();
      setSelectedStudentIds([]);
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] border border-border" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Add Students</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5"/></button>
        </div>
        
        <div className="p-4 border-b border-border">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Search students by name or email..." 
                    className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {filteredStudents.length > 0 ? (
                <div className="space-y-1">
                    {filteredStudents.map(student => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                            <div 
                                key={student.id} 
                                onClick={() => toggleSelection(student.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted border-transparent'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                    {isSelected && <CheckCircleIcon className="w-4 h-4 text-primary-foreground"/>}
                                </div>
                                <Avatar src={student.avatarUrl} name={student.name} size="sm"/>
                                <div className="min-w-0">
                                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{student.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No students found.
                </div>
            )}
        </div>

        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button 
                onClick={handleSubmit} 
                disabled={selectedStudentIds.length === 0}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
                Add {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentToCourseModal;
