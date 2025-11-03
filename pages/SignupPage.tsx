import React, { useState } from 'react';
import { auth, db } from '../firebase';
import type { UserTag } from '../types';
import { UserIcon, MailIcon, LockIcon, BuildingIcon } from '../components/Icons';
// FIX: Import yearOptions to dynamically generate year selection.
import { yearOptions } from '../constants';

interface SignupPageProps {
    onNavigate: (path: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [tag, setTag] = useState<UserTag>('Student');
    const [yearOfStudy, setYearOfStudy] = useState<number>(1);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (user) {
                // Create a user document in Firestore
                const userData: any = {
                    name,
                    email,
                    department,
                    tag,
                    avatarUrl: '', // Default avatar
                    bio: '',
                    interests: [],
                    achievements: []
                };

                if (tag === 'Student') {
                    userData.yearOfStudy = yearOfStudy;
                }

                await db.collection('users').doc(user.uid).set(userData);
                onNavigate('#/home');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";
    const selectClasses = "w-full appearance-none px-4 py-3 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-2xl shadow-xl border border-border animate-fade-in">
                <div className="text-center">
                    <span className="font-bold text-3xl text-primary">CampusConnect</span>
                    <h1 className="text-2xl font-bold text-foreground mt-2">Create Your Account</h1>
                    <p className="text-text-muted">Join your campus community today.</p>
                </div>
                
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                    </div>
                    <div className="relative">
                         <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
                    </div>
                    <div className="relative">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
                    </div>
                     <div className="relative">
                        <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input type="text" placeholder="Department (e.g., Computer Science)" value={department} onChange={e => setDepartment(e.target.value)} required className={inputClasses} />
                    </div>
                    
                    <select value={tag} onChange={e => setTag(e.target.value as UserTag)} className={selectClasses}>
                        <option>Student</option>
                        <option>Faculty</option>
                        <option>Alumni</option>
                    </select>

                    {tag === 'Student' && (
                        <div>
                            <label className="text-sm font-medium text-text-muted">Year of Study</label>
                            <select value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className={`mt-1 ${selectClasses}`}>
                                {yearOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}

                    {error && <p className="text-sm text-center text-destructive">{error}</p>}
                    
                    <button type="submit" className="w-full px-4 py-3 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105">
                        Sign Up
                    </button>
                </form>

                <p className="text-sm text-center text-text-muted">
                    Already have an account?{' '}
                    <a onClick={() => onNavigate('#/login')} className="font-medium text-primary hover:underline cursor-pointer">
                        Log in
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;