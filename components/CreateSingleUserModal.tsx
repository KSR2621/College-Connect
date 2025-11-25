
import React, { useState } from 'react';
import { User } from '../types';
import { CloseIcon } from './Icons';
import { yearOptions } from '../constants';

interface CreateSingleUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    department: string;
    role: 'Student' | 'Teacher';
    onCreateUser: (userData: Omit<User, 'id'>, password?: string) => Promise<void>;
}

const CreateSingleUserModal: React.FC<CreateSingleUserModalProps> = ({ isOpen, onClose, department, role, onCreateUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [year, setYear] = useState(1);
    const [rollNo, setRollNo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userData: Omit<User, 'id'> = {
                name,
                email,
                department,
                tag: role,
                isApproved: true, // Added by HOD, so auto-approved
                isRegistered: false,
                isFrozen: false
            };
            if (role === 'Student') {
                userData.yearOfStudy = year;
                if(rollNo.trim()) userData.rollNo = rollNo.trim();
            }
            
            await onCreateUser(userData);
            onClose();
            setName('');
            setEmail('');
            setYear(1);
            setRollNo('');
        } catch (error) {
            console.error("Failed to create user", error);
            alert("Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h3 className="font-bold text-lg text-foreground">Add {role}</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            required 
                            placeholder="Full Name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            required 
                            placeholder="Email Address"
                        />
                    </div>
                    {role === 'Student' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Year</label>
                                <select 
                                    value={year} 
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                >
                                    {yearOptions.map(opt => (
                                        <option key={opt.val} value={opt.val}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Roll No</label>
                                <input 
                                    type="text" 
                                    value={rollNo} 
                                    onChange={e => setRollNo(e.target.value)} 
                                    className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                    placeholder="e.g. 101"
                                />
                            </div>
                        </div>
                    )}
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                            {isLoading ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSingleUserModal;
