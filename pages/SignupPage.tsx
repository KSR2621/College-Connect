import React, { useState, useRef, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import type { UserTag, College } from '../types';
import { UserIcon, MailIcon, LockIcon, BuildingIcon, CameraIcon } from '../components/Icons';
import { yearOptions } from '../constants';

interface SignupPageProps {
    onNavigate: (path: string) => void;
    colleges: College[];
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, colleges }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [tag, setTag] = useState<UserTag>('Student');
    const [yearOfStudy, setYearOfStudy] = useState<number>(1);
    const [collegeId, setCollegeId] = useState('');
    const [error, setError] = useState('');
    
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const departmentOptions = useMemo(() => {
        if (!collegeId) return [];
        const selectedCollege = colleges.find(c => c.id === collegeId);
        return selectedCollege?.departments || [];
    }, [collegeId, colleges]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 700 * 1024) { 
                alert("Profile picture must be smaller than 700KB.");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!department) {
            setError('Please select a department.');
            return;
        }
        if (!collegeId) {
            setError('Please select a college.');
            return;
        }
        try {
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (user) {
                let avatarUrl = '';
                if (avatarFile) {
                    avatarUrl = await fileToBase64(avatarFile);
                }

                const userData: any = {
                    name,
                    email,
                    department,
                    tag,
                    collegeId,
                    avatarUrl,
                    bio: '',
                    interests: [],
                    achievements: [],
                    isApproved: tag === 'Student',
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

    const inputClasses = "w-full pl-10 pr-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";
    const selectClasses = "w-full appearance-none px-4 py-3 text-foreground bg-input dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-4 bg-card dark:bg-slate-800 rounded-2xl shadow-xl border border-border dark:border-slate-700 animate-fade-in">
                <div className="text-center">
                    <span className="font-bold text-3xl text-primary">CampusConnect</span>
                    <h1 className="text-2xl font-bold text-foreground mt-2">Create Your Account</h1>
                    <p className="text-text-muted">Join your campus community today.</p>
                </div>
                
                {/* FIX: Corrected typo from `handleSubmit` to `handleSignup`. */}
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <img
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'A')}&background=random&color=fff`}
                                alt="Avatar preview"
                                className="w-24 h-24 rounded-full object-cover border-4 border-card dark:border-slate-800 shadow-md"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-2 rounded-full border-2 border-card dark:border-slate-800 hover:bg-primary/90"
                                aria-label="Upload profile picture"
                            >
                                <CameraIcon className="w-5 h-5"/>
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={collegeId}
                        onChange={e => { setCollegeId(e.target.value); setDepartment(''); }}
                        required
                        className={selectClasses}
                    >
                        <option value="" disabled>Select Your College</option>
                        {colleges.map(college => <option key={college.id} value={college.id}>{college.name}</option>)}
                    </select>

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
                        <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10" />
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            required
                            disabled={!collegeId || departmentOptions.length === 0}
                            className={`${selectClasses} pl-10 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <option value="" disabled>Select Department</option>
                            {collegeId && departmentOptions.length === 0 && <option disabled>This college has no departments set up.</option>}
                            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    
                    <select value={tag} onChange={e => setTag(e.target.value as UserTag)} className={selectClasses}>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="HOD/Dean">Dean/HOD</option>
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