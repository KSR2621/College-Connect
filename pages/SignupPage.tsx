
import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import type { User } from '../types';
import { MailIcon, LockIcon, CameraIcon, ArrowLeftIcon, CheckCircleIcon, BuildingIcon, UserIcon } from '../components/Icons';

interface SignupPageProps {
    onNavigate: (path: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const [step, setStep] = useState<'verifyEmail' | 'completeProfile' | 'adminSetup' | 'registerCollege'>('verifyEmail');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [adminSecret, setAdminSecret] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [preRegisteredUser, setPreRegisteredUser] = useState<User | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // 1. Check if email exists in DB (Invited by Teacher/HOD)
            const userQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
            
            if (userQuery.empty) {
                setError('This email has not been invited. Please contact your department head or teacher to be added.');
                setIsLoading(false);
                return;
            }
            
            const userDoc = userQuery.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            
            // 2. Check if user has already registered (set a password)
            if (userData.isRegistered) {
                setError('An account with this email already exists. Please log in.');
                setIsLoading(false);
                return;
            }
            
            // Found valid invite
            setPreRegisteredUser(userData);
            setStep('completeProfile');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!preRegisteredUser) {
            setError('Session expired. Please verify your email again.');
            setStep('verifyEmail');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create the user in Firebase Auth
            const { user } = await auth.createUserWithEmailAndPassword(preRegisteredUser.email, password);
            if (!user) {
                throw new Error("Could not create user account.");
            }

            // 2. Prepare new user data based on the invite doc
            const userDataForNewDoc: Omit<User, 'id'> = {
                ...preRegisteredUser,
                isApproved: false, 
                isRegistered: true, 
            };
            delete (userDataForNewDoc as any).id; // Remove the old temp ID

            // 3. Upload Avatar (if selected)
            if (avatarFile) {
                try {
                    const storageRef = storage.ref().child(`avatars/${user.uid}`);
                    const snapshot = await storageRef.put(avatarFile);
                    userDataForNewDoc.avatarUrl = await snapshot.ref.getDownloadURL();
                } catch (uploadErr) {
                    console.warn("Failed to upload avatar, proceeding without it.", uploadErr);
                }
            }

            // 4. Create the new user document with the correct UID from Firebase Auth
            await db.collection('users').doc(user.uid).set(userDataForNewDoc);

            // 5. Delete the old "invite" document to clean up
            try {
                await db.collection('users').doc(preRegisteredUser.id).delete();
            } catch (deleteErr) {
                console.warn("Could not delete old invite document. Ignoring.", deleteErr);
            }

            // 6. Navigate to Home
            onNavigate('#/home');

        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else if (err.code === 'auth/weak-password') {
                setError('The password is too weak.');
            } else {
                setError(err.message || 'An error occurred during signup.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (adminSecret !== 'admin') {
            setError('Invalid Admin Secret Key.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (!user) throw new Error("Could not create user.");

            const userData: Omit<User, 'id'> = {
                name: name,
                email: email,
                department: 'Administration',
                tag: 'Super Admin',
                isApproved: true,
                isRegistered: true,
            };

            await db.collection('users').doc(user.uid).set(userData);
            onNavigate('#/superadmin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCollegeRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Auth User
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (!user) throw new Error("Could not create user.");

            // 2. Create College Document
            const collegeRef = await db.collection('colleges').add({ 
                name: collegeName, 
                adminUids: [user.uid], 
                departments: [] 
            });

            // 3. Create Director User Document (Pending Approval)
            const userData: Omit<User, 'id'> = {
                name: name,
                email: email,
                tag: 'Director',
                collegeId: collegeRef.id,
                department: 'Administration',
                isApproved: false, // Requires Super Admin approval
                isRegistered: true,
            };

            await db.collection('users').doc(user.uid).set(userData);
            onNavigate('#/home'); // Redirect to home where they will see "Pending Approval" screen
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-background font-sans">
             {/* Left Side - Branding */}
             <div className="hidden lg:flex lg:w-1/2 relative bg-secondary overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 opacity-90"></div>
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
                </div>

                <div className="relative z-10 p-12 text-white max-w-lg">
                     <div className="mb-8 bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                        {step === 'adminSetup' ? <BuildingIcon className="w-10 h-10 text-white" /> : <CheckCircleIcon className="w-10 h-10 text-white" />}
                     </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight drop-shadow-md">
                        {step === 'adminSetup' ? 'Initialize System' : step === 'registerCollege' ? 'Register Institution' : 'Join the Community'}
                    </h1>
                    <p className="text-xl font-light text-blue-50 leading-relaxed opacity-90">
                        {step === 'adminSetup' 
                            ? 'Setup the Super Admin account to start managing colleges and directors.' 
                            : step === 'registerCollege'
                            ? 'Sign up as a Director/Principal to manage your college on CampusConnect.'
                            : 'Access your courses, groups, and connect with your campus. You must be invited by a teacher to join.'}
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border/50 transition-all duration-300">
                     {step !== 'verifyEmail' && (
                        <button onClick={() => { setStep('verifyEmail'); setError(''); }} className="flex items-center text-sm text-text-muted hover:text-primary mb-6 transition-colors font-medium">
                            <ArrowLeftIcon className="w-4 h-4 mr-1.5"/>
                            Back to verification
                        </button>
                    )}
                    
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                            {step === 'verifyEmail' ? 'Activate Account' : step === 'adminSetup' ? 'Admin Setup' : step === 'registerCollege' ? 'Register College' : 'Set Password'}
                        </h2>
                        <p className="mt-2 text-sm text-text-muted">
                            {step === 'verifyEmail' 
                                ? 'Enter your university email to find your invite.' 
                                : step === 'adminSetup'
                                ? 'Create the root Super Admin account.'
                                : step === 'registerCollege'
                                ? 'Create an account for your college director.'
                                : 'Set a password to access your dashboard.'}
                        </p>
                    </div>

                    {error && (
                         <div className="mb-6 rounded-xl bg-destructive/10 p-4 animate-fade-in border border-destructive/20">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-destructive font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'verifyEmail' && (
                        <form onSubmit={handleVerifyEmail} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MailIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="your.email@university.edu"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary/30">
                                    {isLoading ? 'Checking Invite...' : 'Find Invite'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'completeProfile' && preRegisteredUser && (
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-card shadow-lg ring-2 ring-border group-hover:ring-primary transition-all">
                                        <img
                                            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(preRegisteredUser.name)}&background=random`}
                                            alt="Avatar preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                        <CameraIcon className="w-4 h-4"/>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-text-muted mt-2">Tap to add profile photo (Optional)</p>
                            </div>

                            <div className="text-center bg-muted/50 p-3 rounded-lg border border-border">
                                <h3 className="text-lg font-bold text-foreground">{preRegisteredUser.name}</h3>
                                <p className="text-sm text-text-muted">{preRegisteredUser.department} &bull; {preRegisteredUser.tag}</p>
                                <p className="text-xs text-text-muted mt-1">Account status: Invited</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Create Password</label>
                                 <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Choose a secure password (min 6 chars)"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary/30">
                                    {isLoading ? 'Activating...' : 'Activate Account'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'registerCollege' && (
                        <form onSubmit={handleCollegeRegistration} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">College Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <BuildingIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={collegeName}
                                        onChange={(e) => setCollegeName(e.target.value)}
                                        required
                                        placeholder="e.g. Institute of Technology"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Director Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Full Name"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MailIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="director@college.edu"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockIcon className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Create Password"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-input text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all">
                                {isLoading ? 'Registering...' : 'Register College'}
                            </button>
                        </form>
                    )}

                    {step === 'adminSetup' && (
                        <form onSubmit={handleAdminSignup} className="space-y-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Super Admin Name"
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Admin Email"
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            />
                            <input
                                type="password"
                                value={adminSecret}
                                onChange={(e) => setAdminSecret(e.target.value)}
                                required
                                placeholder="Secret Key"
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                            />
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all">
                                {isLoading ? 'Creating...' : 'Create Super Admin'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-border text-center space-y-4">
                         <p className="text-sm text-text-muted">
                            Already activated?{' '}
                            <a onClick={() => onNavigate('#/login')} className="font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors hover:underline">
                                Log in
                            </a>
                        </p>
                        <div className="flex justify-center gap-4 text-xs text-text-muted">
                            {step === 'verifyEmail' && (
                                <>
                                    <button onClick={() => setStep('registerCollege')} className="hover:text-foreground underline">
                                        Register College
                                    </button>
                                    <button onClick={() => setStep('adminSetup')} className="hover:text-foreground underline">
                                        Setup Admin
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
