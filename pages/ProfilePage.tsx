
import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Achievement, UserTag, College, Course } from '../types';
import Header from '../components/Header';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import AchievementCard from '../components/AchievementCard';
import AddAchievementModal from '../components/AddAchievementModal';
import EditProfileModal from '../components/EditProfileModal';
import ProjectCard from '../components/ProjectCard';
import { auth } from '../firebase';
import { 
    PostIcon, UsersIcon, StarIcon, BookmarkIcon, ArrowLeftIcon, 
    PlusIcon, MessageIcon, EditIcon, BookOpenIcon, CalendarIcon, 
    BriefcaseIcon, CodeIcon, MedalIcon, TrophyIcon, CheckCircleIcon,
    ChartBarIcon, FileTextIcon, ClockIcon, LockIcon
} from '../components/Icons';

interface ProfilePageProps {
  profileUserId?: string;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  colleges: College[];
  courses: Course[]; // Added for academic stats
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; mediaDataUrls?: string[] | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; link?: string; }; }) => void;
  onAddAchievement: (achievement: Achievement) => void;
  onAddInterest: (interest: string) => void;
  onUpdateProfile: (updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number }, avatarFile?: File | null) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  isAdminView?: boolean;
  onBackToAdmin?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
    const { profileUserId, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddAchievement, onAddInterest, onUpdateProfile, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, isAdminView, onBackToAdmin, colleges, courses } = props;

    const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'academics' | 'activities' | 'projects' | 'saved'>('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingAchievement, setIsAddingAchievement] = useState(false);
    const [newInterest, setNewInterest] = useState('');

    // Robust User Resolution: If viewing own profile, fallback to currentUser prop if users state isn't ready.
    const profileUser = (profileUserId && profileUserId !== currentUser.id) 
        ? users[profileUserId] 
        : (users[currentUser.id] || currentUser);

    const isOwnProfile = !profileUserId || profileUser?.id === currentUser.id;
    const isFacultyView = ['Teacher', 'HOD/Dean', 'Director', 'Super Admin'].includes(currentUser.tag);

    // --- Derived Data ---
    const userPosts = useMemo(() => posts.filter(p => p.authorId === profileUser?.id && !p.isConfession && !p.isProject).sort((a, b) => b.timestamp - a.timestamp), [posts, profileUser]);
    const userProjects = useMemo(() => posts.filter(p => p.authorId === profileUser?.id && p.isProject).sort((a, b) => b.timestamp - a.timestamp), [posts, profileUser]);
    const userGroups = useMemo(() => groups.filter(g => profileUser?.followingGroups?.includes(g.id) || g.memberIds.includes(profileUser?.id)), [groups, profileUser]);
    const savedPosts = useMemo(() => {
        if (!isOwnProfile) return [];
        return posts.filter(p => currentUser.savedPosts?.includes(p.id));
    }, [posts, currentUser.savedPosts, isOwnProfile]);

    // Academic Stats Calculation
    const academicStats = useMemo(() => {
        if (!profileUser) return null;
        const enrolledCourses = courses.filter(c => c.students?.includes(profileUser.id));
        
        let totalClasses = 0;
        let presentClasses = 0;
        enrolledCourses.forEach(c => {
            c.attendanceRecords?.forEach(r => {
                if (r.records[profileUser.id]) {
                    totalClasses++;
                    if (r.records[profileUser.id].status === 'present') presentClasses++;
                }
            });
        });
        
        const attendance = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
        return {
            enrolled: enrolledCourses.length,
            attendance: attendance,
            assignments: enrolledCourses.reduce((acc, c) => acc + (c.assignments?.length || 0), 0)
        };
    }, [courses, profileUser]);

    // Badges Logic
    const badges = useMemo(() => {
        if (!profileUser) return [];
        const list = [];
        if (profileUser.tag === 'Director' || profileUser.tag === 'HOD/Dean' || profileUser.tag === 'Super Admin') {
            list.push({ label: 'Admin', icon: MedalIcon, color: 'text-purple-600 bg-purple-100 border-purple-200' });
        }
        if (userGroups.length > 3) list.push({ label: 'Club Member', icon: UsersIcon, color: 'text-blue-600 bg-blue-100 border-blue-200' });
        if (academicStats && academicStats.attendance > 90) list.push({ label: 'Perfect Attendance', icon: CheckCircleIcon, color: 'text-emerald-600 bg-emerald-100 border-emerald-200' });
        if ((profileUser.achievements?.length || 0) > 0) list.push({ label: 'High Achiever', icon: TrophyIcon, color: 'text-amber-600 bg-amber-100 border-amber-200' });
        if (userProjects.length > 0) list.push({ label: 'Builder', icon: CodeIcon, color: 'text-slate-600 bg-slate-100 border-slate-200' });
        return list;
    }, [profileUser, userGroups, academicStats, userProjects]);

    // Profile Completion
    const completion = useMemo(() => {
        if (!profileUser) return 0;
        let score = 20; // Base for creating account
        if (profileUser.bio) score += 20;
        if (profileUser.avatarUrl) score += 20;
        if (profileUser.interests && profileUser.interests.length > 0) score += 20;
        if (profileUser.achievements && profileUser.achievements.length > 0) score += 20;
        return score;
    }, [profileUser]);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleAddInterestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newInterest.trim()) {
            onAddInterest(newInterest.trim());
            setNewInterest('');
        }
    };

    const handleStartConversation = async () => {
        if (isOwnProfile || !profileUser) return;
        await onCreateOrOpenConversation(profileUser.id);
        onNavigate(`#/chat`);
    };
    
    if (!profileUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-foreground font-bold text-xl">User not found.</p>
                    <button onClick={() => onNavigate('#/home')} className="mt-4 text-primary hover:underline">Go Home</button>
                </div>
            </div>
        );
    }

    // Component: Quick Stat Card
    const QuickStatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 flex items-center gap-3 min-w-[140px] flex-1 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase mt-1">{label}</p>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-primary"/> Personal Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-muted-foreground">Role</span>
                                    <span className="font-medium text-foreground">{profileUser.tag}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-muted-foreground">Department</span>
                                    <span className="font-medium text-foreground">{profileUser.department}</span>
                                </div>
                                {profileUser.tag === 'Student' && (
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-muted-foreground">Year of Study</span>
                                        <span className="font-medium text-foreground">{profileUser.yearOfStudy || 'N/A'}</span>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <span className="text-muted-foreground block mb-2">Bio</span>
                                    <p className="text-foreground leading-relaxed">{profileUser.bio || (isOwnProfile ? "Add a bio..." : "No bio provided.")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                        <StarIcon className="w-5 h-5 text-amber-500"/> Interests & Skills
                                    </h3>
                                    {isOwnProfile && (
                                        <form onSubmit={handleAddInterestSubmit} className="flex items-center">
                                            <input 
                                                type="text" 
                                                value={newInterest} 
                                                onChange={e => setNewInterest(e.target.value)} 
                                                placeholder="+ Add" 
                                                className="bg-muted border-transparent rounded-full px-3 py-1.5 text-xs w-24 focus:w-32 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </form>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profileUser.interests?.map((interest, i) => (
                                        <span key={i} className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-xs font-bold border border-secondary/20">
                                            {interest}
                                        </span>
                                    ))}
                                    {(!profileUser.interests || profileUser.interests.length === 0) && <p className="text-sm text-muted-foreground italic">No interests listed.</p>}
                                </div>
                            </div>

                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                        <TrophyIcon className="w-5 h-5 text-yellow-600"/> Achievements
                                    </h3>
                                    {isOwnProfile && <button onClick={() => setIsAddingAchievement(true)} className="p-1.5 bg-muted rounded-full hover:bg-muted-foreground/20"><PlusIcon className="w-4 h-4"/></button>}
                                </div>
                                <div className="space-y-3">
                                    {profileUser.achievements?.map((ach, index) => <AchievementCard key={index} achievement={ach}/>)}
                                    {(!profileUser.achievements || profileUser.achievements.length === 0) && <p className="text-sm text-muted-foreground italic">No achievements yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'academics':
                if (!isOwnProfile && !isFacultyView) return <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border border-dashed"><LockIcon className="w-12 h-12 mx-auto mb-3 opacity-50"/><p>Academic info is private.</p></div>;
                if (profileUser.tag !== 'Student') return <div className="p-12 text-center text-muted-foreground">Not applicable for {profileUser.tag}.</div>;
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Overall Attendance</h3>
                                <div className="relative h-32 w-32 flex items-center justify-center">
                                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-muted" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                        <path className={`${(academicStats?.attendance || 0) >= 75 ? 'text-emerald-500' : (academicStats?.attendance || 0) >= 60 ? 'text-amber-500' : 'text-red-500'}`} strokeDasharray={`${academicStats?.attendance || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                    </svg>
                                    <span className="absolute text-3xl font-extrabold text-foreground">{academicStats?.attendance}%</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-blue-500"/> Enrolled Courses</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {courses.filter(c => c.students?.includes(profileUser.id)).map(c => (
                                        <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{c.subject}</p>
                                                <p className="text-xs text-muted-foreground">Year {c.year}</p>
                                            </div>
                                            <div className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{c.department.substring(0,3)}</div>
                                        </div>
                                    ))}
                                    {courses.filter(c => c.students?.includes(profileUser.id)).length === 0 && <p className="text-sm text-muted-foreground">No enrolled courses.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'projects':
                return (
                    <div className="animate-fade-in">
                        {userProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userProjects.map(proj => (
                                    <ProjectCard 
                                        key={proj.id} 
                                        project={proj} 
                                        author={profileUser}
                                        currentUser={currentUser}
                                        onDeleteProject={onDeletePost}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
                                <CodeIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50"/>
                                <p className="text-muted-foreground">No projects showcased yet.</p>
                            </div>
                        )}
                    </div>
                );
            case 'activities':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        {userGroups.length > 0 ? (
                            userGroups.map(group => (
                                <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-4 rounded-xl shadow-sm border border-border cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {group.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-card-foreground">{group.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium uppercase">{group.category} • {group.memberIds.length} Members</p>
                                    </div>
                                </div>
                            ))
                        ) : <p className="col-span-full text-center text-muted-foreground p-8 bg-card rounded-xl border border-border border-dashed">Not a member of any clubs or groups.</p>}
                    </div>
                );
            case 'saved':
                if (!isOwnProfile) return null;
                return <div className="space-y-6 animate-fade-in"><Feed posts={savedPosts} users={users} currentUser={currentUser} onNavigate={onNavigate} groups={groups} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} /></div>;
            case 'posts':
            default:
                return (
                    <div className="space-y-6 animate-fade-in">
                        {isOwnProfile && <CreatePost user={currentUser} onAddPost={onAddPost} />}
                        <Feed posts={userPosts} users={users} currentUser={currentUser} onNavigate={onNavigate} groups={groups} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} />
                    </div>
                );
        }
    };

    return (
        <div className="bg-background min-h-screen pb-20">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-0 sm:px-4 lg:px-8 pt-0 sm:pt-6 lg:pb-8">
                 {isAdminView && onBackToAdmin && (
                    <div className="p-4">
                        <button onClick={onBackToAdmin} className="flex items-center text-sm text-primary hover:underline mb-4 font-medium">
                            <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                            Back to Admin Dashboard
                        </button>
                    </div>
                )}
                
                {/* --- 1. Top Profile Header --- */}
                <div className="bg-card sm:rounded-3xl shadow-lg border-b sm:border border-border overflow-hidden mb-6">
                    {/* Cover Photo */}
                    <div className="h-48 sm:h-64 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        {isOwnProfile && (
                            <button className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-all">
                                <EditIcon className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                    
                    <div className="px-6 pb-6 relative">
                        {/* Profile Pic & Actions */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-20 mb-4 gap-4">
                            <div className="relative group">
                                <div className="p-1.5 bg-card rounded-full shadow-2xl">
                                    <Avatar src={profileUser.avatarUrl} name={profileUser.name} size="xl" className="w-36 h-36 sm:w-44 sm:h-44 border-4 border-card object-cover"/>
                                </div>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 text-center sm:text-left sm:pb-2 min-w-0">
                                <h1 className="text-3xl font-black text-foreground tracking-tight flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                                    {profileUser.name}
                                    {badges.map((badge, i) => (
                                        <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wide ${badge.color}`} title={badge.label}>
                                            <badge.icon className="w-3 h-3"/> {badge.label}
                                        </span>
                                    ))}
                                </h1>
                                <p className="text-base font-medium text-muted-foreground mt-1">
                                    {profileUser.department} • {profileUser.tag === 'Student' ? `Year ${profileUser.yearOfStudy || 1}` : profileUser.tag}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto sm:mx-0 line-clamp-2">{profileUser.bio || "CampusConnect Member"}</p>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0 sm:pb-4">
                                {isOwnProfile && !isAdminView ? (
                                    <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none bg-card border border-border text-foreground font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-muted transition-all shadow-sm">
                                        Edit Profile
                                    </button>
                                ) : !isOwnProfile && (
                                    <button onClick={handleStartConversation} className="flex-1 sm:flex-none bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                        Message
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Completion Meter (Self Only) */}
                        {isOwnProfile && completion < 100 && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-3 flex items-center gap-4 max-w-xl">
                                <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${completion}%`}}></div>
                                </div>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">{completion}% Complete</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* --- 3. Main Body (Left Column) --- */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* --- 2. Quick Stats Section --- */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {academicStats && <QuickStatCard label="Academics" value={`${academicStats.attendance}%`} icon={CheckCircleIcon} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />}
                            <QuickStatCard label="Clubs" value={userGroups.length} icon={UsersIcon} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                            <QuickStatCard label="Events" value={academicStats?.assignments || 0} icon={CalendarIcon} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
                            <QuickStatCard label="Projects" value={userProjects.length} icon={CodeIcon} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
                        </div>

                        {/* Tabs & Content */}
                        <div className="">
                            <div className="border-b border-border mb-6 bg-background/95 backdrop-blur-sm sticky top-16 z-20 overflow-x-auto no-scrollbar">
                                <div className="flex">
                                    <TabButton id="posts" label="Posts" icon={PostIcon} />
                                    <TabButton id="about" label="About" icon={FileTextIcon} />
                                    {(isOwnProfile || isFacultyView) && <TabButton id="academics" label="Academics" icon={ChartBarIcon} />}
                                    <TabButton id="activities" label="Activities" icon={UsersIcon} />
                                    <TabButton id="projects" label="Projects" icon={CodeIcon} />
                                    {isOwnProfile && <TabButton id="saved" label="Saved" icon={BookmarkIcon} />}
                                </div>
                            </div>
                            
                            {renderTabContent()}
                        </div>
                    </div>

                    {/* --- 4. Right Sidebar (Optional) --- */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        {/* Campus Highlights / Trending */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-foreground mb-4 uppercase tracking-wider text-xs text-muted-foreground">Campus Highlights</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['#TechFest2025', '#Hackathon', '#CulturalNight'].map(tag => (
                                    <span key={tag} className="text-xs font-bold bg-muted hover:bg-primary/10 hover:text-primary px-2 py-1 rounded-md cursor-pointer transition-colors">{tag}</span>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 flex items-center justify-center"><CalendarIcon className="w-5 h-5"/></div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">Annual Sports Meet</p>
                                        <p className="text-xs text-muted-foreground">Coming up in 2 days</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Views / Interactions (Mock) */}
                        {isOwnProfile && (
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-bold mb-1">Your Impact</h3>
                                <p className="text-xs text-slate-400 mb-4">Last 30 days activity</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-2xl font-bold">124</p>
                                        <p className="text-xs text-slate-400">Profile Views</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">45</p>
                                        <p className="text-xs text-slate-400">Post Impressions</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isOwnProfile && (
                <EditProfileModal
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    currentUser={profileUser}
                    onUpdateProfile={onUpdateProfile}
                    colleges={colleges}
                />
            )}
            {isOwnProfile && (
                <AddAchievementModal
                    isOpen={isAddingAchievement}
                    onClose={() => setIsAddingAchievement(false)}
                    onAddAchievement={onAddAchievement}
                />
            )}
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default ProfilePage;
