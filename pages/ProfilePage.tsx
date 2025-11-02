import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Achievement, UserTag } from '../types';
import Header from '../components/Header';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import AchievementCard from '../components/AchievementCard';
import AddAchievementModal from '../components/AddAchievementModal';
import EditProfileModal from '../components/EditProfileModal';
import { auth } from '../firebase';
import { PostIcon, UsersIcon, StarIcon, BookmarkIcon, ArrowLeftIcon, PlusIcon, MessageIcon } from '../components/Icons';

interface ProfilePageProps {
  profileUserId?: string;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; }) => void;
  onAddAchievement: (achievement: Achievement) => void;
  onAddInterest: (interest: string) => void;
  onUpdateProfile: (updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number }, avatarFile?: File | null) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  isAdminView?: boolean;
  onBackToAdmin?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
    const { profileUserId, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddAchievement, onAddInterest, onUpdateProfile, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, isAdminView, onBackToAdmin } = props;

    const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'groups' | 'saved'>('posts');
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
        if (isOwnProfile) return;
        const convoId = await onCreateOrOpenConversation(profileUser.id);
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
            case 'about':
                return (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {profileUser.bio && (
                            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                                <h3 className="font-bold text-lg text-foreground mb-2">Bio</h3>
                                <p className="text-card-foreground whitespace-pre-wrap">{profileUser.bio}</p>
                            </div>
                        )}
                        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                            <h3 className="font-bold text-lg text-foreground mb-3">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileUser.interests?.map(interest => (
                                    <span key={interest} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{interest}</span>
                                ))}
                                {isOwnProfile && (
                                    <form onSubmit={handleAddInterestSubmit} className="flex gap-2">
                                        <input type="text" value={newInterest} onChange={e => setNewInterest(e.target.value)} placeholder="Add interest" className="bg-input border border-border rounded-full px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"/>
                                        <button type="submit" className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0"><PlusIcon className="w-4 h-4" /></button>
                                    </form>
                                )}
                            </div>
                        </div>
                        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg text-foreground">Achievements</h3>
                                {isOwnProfile && <button onClick={() => setIsAddingAchievement(true)} className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full hover:bg-primary/20">Add New</button>}
                            </div>
                            <div className="space-y-3">
                                {profileUser.achievements?.map((ach, index) => <AchievementCard key={index} achievement={ach}/>)}
                                {(!profileUser.achievements || profileUser.achievements.length === 0) && <p className="text-text-muted text-sm">No achievements listed yet.</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'groups':
                return (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {userGroups.length > 0 ? (
                            userGroups.map(group => (
                                <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-muted">
                                    <h4 className="font-bold text-card-foreground">{group.name}</h4>
                                    <p className="text-sm text-text-muted">{group.memberIds.length} members</p>
                                </div>
                            ))
                        ) : <p className="text-center text-text-muted p-8">Not a member of any groups yet.</p>}
                    </div>
                );
            case 'saved':
                if (!isOwnProfile) return null;
                return <div className="max-w-xl mx-auto"><Feed posts={savedPosts} users={users} currentUser={currentUser} onNavigate={onNavigate} groups={groups} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} /></div>;
            case 'posts':
            default:
                return (
                    <div className="space-y-6 max-w-xl mx-auto">
                        {isOwnProfile && <CreatePost user={currentUser} onAddPost={onAddPost} />}
                        <Feed posts={userPosts} users={users} currentUser={currentUser} onNavigate={onNavigate} groups={groups} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} />
                    </div>
                );
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="pb-20 md:pb-4">
                {/* Profile Header */}
                <div className="relative bg-gradient-to-br from-primary to-secondary text-white shadow-lg pt-8 pb-10 mb-6 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-10"></div>
                     <div className="container mx-auto px-4 relative z-10">
                        {isAdminView && onBackToAdmin && (
                            <button onClick={onBackToAdmin} className="flex items-center text-sm text-white/80 hover:text-white mb-4">
                                <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                                Back to Admin Dashboard
                            </button>
                        )}
                        <div className="flex flex-col items-center text-center">
                            <Avatar src={profileUser.avatarUrl} name={profileUser.name} size="xl" className="mb-4 border-4 border-white shadow-md"/>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                                {profileUser.bio ? (
                                    <p className="text-lg mt-2 max-w-xl mx-auto opacity-90">{profileUser.bio}</p>
                                ) : (
                                    isOwnProfile && <button onClick={() => setIsEditing(true)} className="mt-2 text-white/80 hover:text-white underline">Add a bio</button>
                                )}
                                <p className="text-sm mt-2 opacity-80">{profileUser.department} &bull; {profileUser.tag}{profileUser.tag === 'Student' && ` - ${profileUser.yearOfStudy || 1}st Year`}</p>
                            </div>
                            <div className="flex items-center space-x-8 mt-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{userPosts.length}</p>
                                    <p className="text-sm opacity-80">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{userGroups.length}</p>
                                    <p className="text-sm opacity-80">Groups</p>
                                </div>
                            </div>

                            {isOwnProfile && !isAdminView && (
                                <button onClick={() => setIsEditing(true)} className="mt-6 bg-white/20 hover:bg-white/30 font-semibold py-2 px-6 rounded-full transition-colors">
                                    Edit Profile
                                </button>
                            )}
                            {!isOwnProfile && (
                                <button onClick={handleStartConversation} className="mt-6 bg-white/20 hover:bg-white/30 font-semibold py-2 px-6 rounded-full transition-colors flex items-center gap-2">
                                    <MessageIcon className="w-5 h-5" /> Message
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="container mx-auto px-4">
                     <div className="border-b border-border flex justify-center mb-6">
                        <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('posts')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                <PostIcon className="w-5 h-5"/><span className="hidden sm:inline">Posts</span>
                            </button>
                            <button onClick={() => setActiveTab('about')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                <UsersIcon className="w-5 h-5"/><span className="hidden sm:inline">About</span>
                            </button>
                             <button onClick={() => setActiveTab('groups')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                <StarIcon className="w-5 h-5"/><span className="hidden sm:inline">Groups</span>
                            </button>
                             {isOwnProfile && (
                                <button onClick={() => setActiveTab('saved')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                    <BookmarkIcon className="w-5 h-5"/><span className="hidden sm:inline">Saved</span>
                                </button>
                            )}
                        </nav>
                     </div>
                </div>

                {/* Content Area */}
                <div className="container mx-auto px-4">
                    {renderTabContent()}
                </div>
            </main>

            {isOwnProfile && (
                <EditProfileModal
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    currentUser={profileUser}
                    onUpdateProfile={onUpdateProfile}
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