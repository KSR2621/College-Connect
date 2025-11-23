
import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Achievement, UserTag, Comment, College } from '../types';
import Header from '../components/Header';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import AchievementCard from '../components/AchievementCard';
import AddAchievementModal from '../components/AddAchievementModal';
import EditProfileModal from '../components/EditProfileModal';
import { auth } from '../firebase';
import { PostIcon, UsersIcon, StarIcon, BookmarkIcon, ArrowLeftIcon, PlusIcon, MessageIcon, EditIcon } from '../components/Icons';

interface ProfilePageProps {
  profileUserId?: string;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  colleges: College[];
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
    const { profileUserId, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddAchievement, onAddInterest, onUpdateProfile, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, isAdminView, onBackToAdmin, colleges } = props;

    const [activeTab, setActiveTab] = useState<'posts' | 'groups' | 'saved'>('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingAchievement, setIsAddingAchievement] = useState(false);
    const [newInterest, setNewInterest] = useState('');

    const profileUser = users[profileUserId || currentUser.id];
    const isOwnProfile = !profileUserId || profileUser?.id === currentUser.id;

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
    
    const userPosts = useMemo(() => posts.filter(p => p.authorId === profileUser?.id && !p.isConfession), [posts, profileUser]);
    const savedPosts = useMemo(() => {
        if (!isOwnProfile) return [];
        return posts.filter(p => currentUser.savedPosts?.includes(p.id));
    }, [posts, currentUser.savedPosts, isOwnProfile]);

    const userGroups = useMemo(() => groups.filter(g => profileUser?.followingGroups?.includes(g.id)), [groups, profileUser]);
    
    if (!profileUser) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-foreground">User not found.</p></div>;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'groups':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userGroups.length > 0 ? (
                            userGroups.map(group => (
                                <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-4 rounded-xl shadow-sm border border-border cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]">
                                    <h4 className="font-bold text-card-foreground">{group.name}</h4>
                                    <p className="text-sm text-text-muted">{group.memberIds.length} members</p>
                                </div>
                            ))
                        ) : <p className="sm:col-span-2 text-center text-text-muted p-8">Not following or a member of any groups yet.</p>}
                    </div>
                );
            case 'saved':
                if (!isOwnProfile) return null;
                return <div className="space-y-6"><Feed posts={savedPosts} users={users} currentUser={currentUser} onNavigate={onNavigate} groups={groups} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} /></div>;
            case 'posts':
            default:
                return (
                    <div className="space-y-6">
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
                
                {/* Profile Header Card */}
                <div className="bg-card sm:rounded-3xl shadow-lg border-b sm:border border-border overflow-hidden mb-8">
                    {/* Decorative Cover Banner with Mesh Gradient */}
                    <div className="h-40 sm:h-56 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-6 sm:space-x-6">
                            <div className="relative">
                                <div className="p-1.5 bg-card rounded-full shadow-2xl">
                                    <Avatar src={profileUser.avatarUrl} name={profileUser.name} size="xl" className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-card"/>
                                </div>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-all sm:hidden"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 text-center sm:text-left mt-3 sm:mt-0 sm:pb-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center">
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-black text-foreground flex items-center gap-2 justify-center sm:justify-start tracking-tight">
                                            {profileUser.name}
                                            {profileUser.isFrozen && <span className="text-xs font-bold bg-destructive text-white px-2 py-1 rounded-full uppercase tracking-wide">Suspended</span>}
                                        </h1>
                                        <p className="text-base font-medium text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-2">
                                            <span>{profileUser.department}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                            <span>{profileUser.tag}</span>
                                            {profileUser.tag === 'Student' && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                                    <span>Year {profileUser.yearOfStudy || 1}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="mt-6 sm:mt-0 hidden sm:block">
                                        {isOwnProfile && !isAdminView ? (
                                            <button onClick={() => setIsEditing(true)} className="bg-card border border-border text-foreground font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-muted transition-all flex items-center gap-2 shadow-sm hover:shadow">
                                                <EditIcon className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        ) : !isOwnProfile && (
                                            <button onClick={handleStartConversation} className="bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5">
                                                <MessageIcon className="w-4 h-4" /> Message
                                            </button>
                                        )}
                                    </div>
                                    {/* Mobile Message Button */}
                                    {!isOwnProfile && (
                                        <div className="mt-4 sm:hidden w-full">
                                             <button onClick={handleStartConversation} className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm shadow-lg">
                                                Message
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            {/* Bio & Stats */}
                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <h3 className="font-bold text-lg text-foreground mb-2">About</h3>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        {profileUser.bio || (
                                            isOwnProfile 
                                            ? <button onClick={() => setIsEditing(true)} className="text-primary hover:underline italic">Add a bio to introduce yourself...</button> 
                                            : <span className="italic opacity-70">No bio available.</span>
                                        )}
                                    </p>
                                </div>
                                
                                <div className="flex justify-between sm:justify-start sm:space-x-16 py-6 border-y border-border bg-muted/10 -mx-6 px-6 sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0">
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black text-foreground">{userPosts.length}</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Posts</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black text-foreground">{userGroups.length}</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Groups</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black text-foreground">{profileUser.achievements?.length || 0}</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Awards</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-8">
                                 {/* Interests */}
                                <div>
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Interests</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profileUser.interests?.map(interest => (
                                            <span key={interest} className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-xs font-bold border border-secondary/20">{interest}</span>
                                        ))}
                                        {isOwnProfile && (
                                            <form onSubmit={handleAddInterestSubmit} className="flex items-center">
                                                <input 
                                                    type="text" 
                                                    value={newInterest} 
                                                    onChange={e => setNewInterest(e.target.value)} 
                                                    placeholder="+ Add" 
                                                    className="bg-muted border-transparent rounded-full px-3 py-1.5 text-xs w-20 focus:w-32 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </form>
                                        )}
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Achievements</h3>
                                        {isOwnProfile && <button onClick={() => setIsAddingAchievement(true)} className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"><PlusIcon className="w-4 h-4"/></button>}
                                    </div>
                                    <div className="space-y-3">
                                        {profileUser.achievements?.map((ach, index) => <AchievementCard key={index} achievement={ach}/>)}
                                        {(!profileUser.achievements || profileUser.achievements.length === 0) && <p className="text-xs text-muted-foreground italic">No achievements yet.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="mt-8 px-4 sm:px-0">
                    <div className="border-b border-border mb-6 sticky top-16 bg-background/95 backdrop-blur-sm z-10">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('posts')} className={`flex items-center space-x-2 transition-all duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                                <PostIcon className="w-5 h-5"/><span>Posts</span>
                            </button>
                            <button onClick={() => setActiveTab('groups')} className={`flex items-center space-x-2 transition-all duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                                <UsersIcon className="w-5 h-5"/><span>Groups</span>
                            </button>
                            {isOwnProfile && (
                                <button onClick={() => setActiveTab('saved')} className={`flex items-center space-x-2 transition-all duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                                    <BookmarkIcon className="w-5 h-5"/><span>Saved</span>
                                </button>
                            )}
                        </nav>
                    </div>
                    <div className="animate-fade-in">
                        {renderTabContent()}
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
