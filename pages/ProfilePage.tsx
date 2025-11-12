import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Achievement, UserTag, Comment } from '../types';
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
    const { profileUserId, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddAchievement, onAddInterest, onUpdateProfile, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, isAdminView, onBackToAdmin } = props;

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
                                <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors">
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
        <div className="bg-slate-50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                 {isAdminView && onBackToAdmin && (
                    <button onClick={onBackToAdmin} className="flex items-center text-sm text-primary hover:underline mb-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                        Back to Admin Dashboard
                    </button>
                )}
                
                {/* Profile Header Card */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
                        <Avatar src={profileUser.avatarUrl} name={profileUser.name} size="xl" className="mb-4 sm:mb-0 flex-shrink-0 border-4 border-white shadow-md"/>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        {profileUser.name}
                                        {profileUser.isFrozen && <span className="text-xs font-bold bg-destructive/20 text-destructive px-2 py-1 rounded-full">SUSPENDED</span>}
                                    </h1>
                                    <p className="text-sm text-text-muted">{profileUser.department} &bull; {profileUser.tag}{profileUser.tag === 'Student' && ` - ${profileUser.yearOfStudy || 1}st Year`}</p>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    {isOwnProfile && !isAdminView ? (
                                        <button onClick={() => setIsEditing(true)} className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-lg text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
                                            <EditIcon className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    ) : !isOwnProfile && (
                                        <button onClick={handleStartConversation} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                                            <MessageIcon className="w-4 h-4" /> Message
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-base text-card-foreground mt-3">{profileUser.bio || (isOwnProfile && <button onClick={() => setIsEditing(true)} className="text-sm text-text-muted hover:text-foreground underline">Add a bio to your profile</button>)}</p>
                            <div className="flex items-center justify-center sm:justify-start space-x-6 mt-4 pt-4 border-t border-border">
                                <div className="text-center">
                                    <p className="text-xl font-bold">{userPosts.length}</p>
                                    <p className="text-sm text-text-muted">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold">{userGroups.length}</p>
                                    <p className="text-sm text-text-muted">Groups</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Left Sidebar */}
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                            <h3 className="font-bold text-lg text-foreground mb-3">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileUser.interests?.map(interest => (
                                    <span key={interest} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{interest}</span>
                                ))}
                                {isOwnProfile && (
                                    <form onSubmit={handleAddInterestSubmit} className="flex gap-2 items-center">
                                        <input type="text" value={newInterest} onChange={e => setNewInterest(e.target.value)} placeholder="Add interest" className="bg-input border border-border rounded-full px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32"/>
                                        <button type="submit" className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 hover:bg-primary/90">+</button>
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
                    </aside>

                    {/* Right Content */}
                    <div className="lg:col-span-2">
                        <div className="border-b border-border mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button onClick={() => setActiveTab('posts')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                    <PostIcon className="w-5 h-5"/><span>Posts</span>
                                </button>
                                <button onClick={() => setActiveTab('groups')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                    <UsersIcon className="w-5 h-5"/><span>Groups</span>
                                </button>
                                {isOwnProfile && (
                                    <button onClick={() => setActiveTab('saved')} className={`flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'}`}>
                                        <BookmarkIcon className="w-5 h-5"/><span>Saved</span>
                                    </button>
                                )}
                            </nav>
                        </div>
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