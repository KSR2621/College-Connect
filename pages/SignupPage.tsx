
import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import type { User } from '../types';
import { MailIcon, LockIcon, CameraIcon, ArrowLeftIcon, CheckCircleIcon, BuildingIcon, UserIcon, ShieldIcon, XCircleIcon } from '../components/Icons';

interface SignupPageProps {
    onNavigate: (path: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const [step, setStep] = useState<'roleSelect' | 'verifyEmail' | 'completeProfile' | 'adminSetup' | 'registerCollege'>('roleSelect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [adminSecret, setAdminSecret] = useState('');
    const [department, setDepartment] = useState(''); // Added for manual entry
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
            // Normalize email to lowercase to match storage
            const normalizedEmail = email.toLowerCase();
            
            // This query requires Firestore Rules to allow reading documents.
            // If rules block unauthenticated reads, we catch the error and proceed to manual entry.
            const userQuery = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();
            
            if (userQuery.empty) {
                setError('This email has not been invited. Please contact your department head or teacher.');
                setIsLoading(false);
                return;
            }
            
            const userDoc = userQuery.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            
            if (userData.isRegistered) {
                setError('An account with this email already exists. Please log in.');
                setIsLoading(false);
                return;
            }
            
            setPreRegisteredUser(userData);
            setName(userData.name); // Pre-fill name
            setStep('completeProfile');

        } catch (err: any) {
            console.warn("Verify Email Warning:", err);
            if (err.code === 'permission-denied') {
                // OPTIMISTIC FLOW: If we can't read DB due to permissions, we assume the user MIGHT exist.
                // We proceed to 'completeProfile' but will strictly validate AFTER creating the auth account.
                console.log("Permission denied. Proceeding to optimistic signup flow.");
                setPreRegisteredUser(null); // No data yet
                setStep('completeProfile');
            } else {
                setError(err.message || "Failed to verify email.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // If doing manual verification (optimistic), name is required
        if (!preRegisteredUser && !name.trim()) {
            setError('Please enter your full name.');
            return;
        }

        setIsLoading(true);
        let createdAuthUser: any = null;

        try {
            // 1. Create Auth User (This logs the user in automatically)
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (!user) throw new Error("Could not create user account.");
            createdAuthUser = user;

            // 2. DEFERRED VALIDATION: Now that we are logged in, check for the invite
            let userDataToUse = preRegisteredUser;
            let inviteDocId = preRegisteredUser?.id;

            if (!userDataToUse) {
                // We are in optimistic flow. Query DB now.
                const inviteQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
                
                if (inviteQuery.empty) {
                    throw new Error("NO_INVITE_FOUND");
                }
                
                const inviteDoc = inviteQuery.docs[0];
                const inviteData = inviteDoc.data();
                
                if (inviteData.isRegistered) {
                    throw new Error("ALREADY_REGISTERED");
                }
                
                userDataToUse = { id: inviteDoc.id, ...inviteData } as User;
                inviteDocId = inviteDoc.id;
            }

            // 3. Construct Final User Data
            const rawUserData: any = {
                name: userDataToUse!.name || name, // Use entered name if invite name is missing
                email: userDataToUse!.email,
                department: userDataToUse!.department || department, // Use entered dept if missing
                tag: userDataToUse!.tag,
                collegeId: userDataToUse!.collegeId || null, 
                yearOfStudy: userDataToUse!.yearOfStudy,
                rollNo: userDataToUse!.rollNo,
                division: userDataToUse!.division,
                isApproved: userDataToUse!.isApproved !== undefined ? userDataToUse!.isApproved : true,
                isRegistered: true,
                isFrozen: false,
                createdAt: Date.now()
            };

            // 4. Upload Avatar if selected
            if (avatarFile) {
                try {
                    const storageRef = storage.ref().child(`avatars/${user.uid}`);
                    const snapshot = await storageRef.put(avatarFile);
                    rawUserData.avatarUrl = await snapshot.ref.getDownloadURL();
                } catch (uploadErr) {
                    console.warn("Failed to upload avatar, proceeding without it.", uploadErr);
                }
            }

            // 5. Save Real User Document
            await db.collection('users').doc(user.uid).set(rawUserData);

            // 6. Handle Director Migration (if applicable)
            if (userDataToUse!.collegeId && userDataToUse!.tag === 'Director') {
                const collegeRef = db.collection('colleges').doc(userDataToUse!.collegeId);
                const collegeDoc = await collegeRef.get();
                if (collegeDoc.exists) {
                    const collegeData = collegeDoc.data();
                    const updatedAdminUids = (collegeData.adminUids || []).filter((id: string) => id !== inviteDocId);
                    updatedAdminUids.push(user.uid);
                    await collegeRef.update({ adminUids: updatedAdminUids });
                }
            }

            // 7. Clean up the Invite Document
            if (inviteDocId) {
                try {
                    await db.collection('users').doc(inviteDocId).delete();
                } catch (delErr) {
                    console.warn("Could not delete invite doc, skipping.", delErr);
                }
            }

            // App.tsx will auto-redirect based on auth state

        } catch (err: any) {
            // ROLLBACK if validation failed
            if (createdAuthUser) {
                await createdAuthUser.delete().catch((e: any) => console.error("Failed to rollback auth user", e));
            }

            if (err.message === 'NO_INVITE_FOUND') {
                setError("No invite found. Please contact your administrator.");
            } else if (err.message === 'ALREADY_REGISTERED') {
                setError("Account already registered. Please log in.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Account already exists. Try logging in.");
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

            const userData: any = {
                name: name,
                email: email.toLowerCase(),
                department: 'Administration',
                tag: 'Super Admin',
                isApproved: true,
                isRegistered: true,
                createdAt: Date.now()
            };

            await db.collection('users').doc(user.uid).set(userData);
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
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            if (!user) throw new Error("Could not create user.");

            const userData: any = {
                name: name,
                email: email.toLowerCase(),
                tag: 'Director',
                department: 'Administration',
                isApproved: false, 
                isRegistered: true,
                requestedCollegeName: collegeName,
                createdAt: Date.now()
            };

            await db.collection('users').doc(user.uid).set(userData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 'verifyEmail' || step === 'registerCollege' || step === 'adminSetup') {
            setStep('roleSelect');
        } else if (step === 'completeProfile') {
            setStep('verifyEmail');
            setPreRegisteredUser(null);
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
                        {step === 'adminSetup' ? <ShieldIcon className="w-10 h-10 text-white" /> : step === 'registerCollege' ? <BuildingIcon className="w-10 h-10 text-white" /> : <CheckCircleIcon className="w-10 h-10 text-white" />}
                     </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight drop-shadow-md">
                        {step === 'adminSetup' ? 'System Admin' : step === 'registerCollege' ? 'Register Institute' : 'Join Community'}
                    </h1>
                    <p className="text-xl font-light text-blue-50 leading-relaxed opacity-90">
                        {step === 'adminSetup' 
                            ? 'Setup the Super Admin account to manage the entire platform.' 
                            : step === 'registerCollege'
                            ? 'Sign up as a Director to onboard your college.'
                            : 'Students, Faculty, and HODs: Enter your university email to access your account.'}
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border/50 transition-all duration-300">
                     {/* Back Button */}
                     {step !== 'roleSelect' && (
                        <button onClick={handleBack} className="flex items-center text-sm text-text-muted hover:text-primary mb-6 transition-colors font-medium">
                            <ArrowLeftIcon className="w-4 h-4 mr-1.5"/>
                            Back
                        </button>
                    )}
                    
                    {step === 'roleSelect' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-extrabold text-foreground">Get Started</h2>
                                <p className="mt-2 text-muted-foreground">Choose your role to continue.</p>
                            </div>
                            
                            <div className="grid gap-4">
                                <button onClick={() => setStep('verifyEmail')} className="flex items-center p-4 bg-card border border-border rounded-xl hover:border-primary hover:bg-muted/50 transition-all group text-left shadow-sm">
                                    <div className="p-3 bg-primary/10 text-primary rounded-full mr-4 group-hover:scale-110 transition-transform">
                                        <UserIcon className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Student / Faculty / HOD</h3>
                                        <p className="text-xs text-muted-foreground">Join via university invite</p>
                                    </div>
                                </button>
                                
                                <button onClick={() => setStep('registerCollege')} className="flex items-center p-4 bg-card border border-border rounded-xl hover:border-purple-500 hover:bg-muted/50 transition-all group text-left shadow-sm">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                        <BuildingIcon className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Director</h3>
                                        <p className="text-xs text-muted-foreground">Register your institute</p>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8 text-center border-t border-border pt-6">
                                <p className="text-sm text-muted-foreground mb-4">Already have an account?</p>
                                <button onClick={() => onNavigate('#/login')} className="w-full py-3 font-bold text-primary border border-primary/20 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all">
                                    Log In
                                </button>
                                <button onClick={() => setStep('adminSetup')} className="mt-6 text-xs text-muted-foreground hover:underline hover:text-foreground transition-colors">
                                    System Admin Access (Root)
                                </button>
                            </div>
                        </div>
                    )}

                    {step !== 'roleSelect' && (
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
                    )}

                    {error && (
                         <div className="mb-6 rounded-xl bg-destructive/10 p-4 animate-fade-in border border-destructive/20">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <XCircleIcon className="w-5 h-5 text-destructive" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-destructive font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'verifyEmail' && (
                        <form onSubmit={handleVerifyEmail} className="space-y-6 animate-fade-in">
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
                            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary/30">
                                {isLoading ? 'Checking Invite...' : 'Find Invite'}
                            </button>
                        </form>
                    )}

                    {step === 'completeProfile' && (
                        <form onSubmit={handleSignup} className="space-y-6 animate-fade-in">
                            <div className="flex flex-col items-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-card shadow-lg ring-2 ring-border group-hover:ring-primary transition-all">
                                        <img
                                            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`}
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

                            {preRegisteredUser ? (
                                <div className="text-center bg-muted/50 p-3 rounded-lg border border-border">
                                    <h3 className="text-lg font-bold text-foreground">{preRegisteredUser.name}</h3>
                                    <p className="text-sm text-text-muted">{preRegisteredUser.department} &bull; {preRegisteredUser.tag}</p>
                                    <p className="text-xs text-text-muted mt-1">Account status: Invited</p>
                                </div>
                            ) : (
                                <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                                    <p className="text-xs text-muted-foreground text-center">We couldn't auto-verify your invite yet. Please confirm your details.</p>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-foreground mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="John Doe"
                                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-foreground mb-1">Department</label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="e.g. Computer Science"
                                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                </div>
                            )}

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
                            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary/30">
                                {isLoading ? 'Activating...' : 'Activate Account'}
                            </button>
                        </form>
                    )}

                    {step === 'registerCollege' && (
                        <form onSubmit={handleCollegeRegistration} className="space-y-4 animate-fade-in">
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
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                {isLoading ? 'Registering...' : 'Register College'}
                            </button>
                        </form>
                    )}

                    {step === 'adminSetup' && (
                        <form onSubmit={handleAdminSignup} className="space-y-4 animate-fade-in">
                            <div className="relative group">
                                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-primary" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Super Admin Name"
                                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                />
                            </div>
                            <div className="relative group">
                                <MailIcon className="absolute left-3 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-primary" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Admin Email"
                                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                />
                            </div>
                            <div className="relative group">
                                <LockIcon className="absolute left-3 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-primary" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Password"
                                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                />
                            </div>
                            <div className="relative group">
                                <ShieldIcon className="absolute left-3 top-3.5 w-5 h-5 text-text-muted group-focus-within:text-primary" />
                                <input
                                    type="password"
                                    value={adminSecret}
                                    onChange={(e) => setAdminSecret(e.target.value)}
                                    required
                                    placeholder="Secret Key"
                                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
                                {isLoading ? 'Creating...' : 'Create Super Admin'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
