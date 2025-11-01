import React, { useState } from 'react';
import { auth, db } from '../firebase';
import type { UserTag } from '../types';

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-2xl shadow-xl border border-border animate-fade-in">
                <h1 className="text-3xl font-bold text-center text-foreground">Create Your Account</h1>
                
                <form onSubmit={handleSignup} className="space-y-4">
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Department (e.g., Computer Science)" value={department} onChange={e => setDepartment(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    
                    <select value={tag} onChange={e => setTag(e.target.value as UserTag)} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Student</option>
                        <option>Faculty</option>
                        <option>Alumni</option>
                    </select>

                    {tag === 'Student' && (
                        <div>
                            <label className="text-sm font-medium text-text-muted">Year of Study</label>
                            <select value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                                <option value={5}>Graduate</option>
                            </select>
                        </div>
                    )}

                    {error && <p className="text-sm text-center text-destructive">{error}</p>}
                    
                    <button type="submit" className="w-full px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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