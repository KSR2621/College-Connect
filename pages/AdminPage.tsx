import React, { useState } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import ProfilePage from './ProfilePage'; // Import ProfilePage
import { auth } from '../firebase';
import { TrashIcon, UsersIcon, PostIcon, StarIcon } from '../components/Icons';

interface AdminPageProps {
    currentUser: User;
    allUsers: User[];
    allPosts: Post[];
    allGroups: Group[];
    usersMap: { [key: string]: User };
    onNavigate: (path: string) => void;
    currentPath: string;
    onDeleteUser: (userId: string) => void;
    onToggleAdmin: (userId: string, currentStatus: boolean) => void;
    onDeletePost: (postId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    // Props to pass down to ProfilePage
    // FIX: Fully defined `postCardProps` type to include all required properties for `ProfilePage`,
    // resolving a TypeScript error where `onToggleSavePost` was missing.
    postCardProps: {
        onReaction: (postId: string, reaction: ReactionType) => void;
        onAddComment: (postId: string, text: string) => void;
        onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
        onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
        onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
        onToggleSavePost: (postId: string) => void;
        onDeletePost: (postId: string) => void;
        groups: Group[];
    };
}

const UserManagement: React.FC<{
    allUsers: User[];
    onDeleteUser: (userId: string) => void;
    onToggleAdmin: (userId: string, currentStatus: boolean) => void;
    currentUser: User;
    onViewProfile: (userId: string) => void;
}> = ({ allUsers, onDeleteUser, onToggleAdmin, currentUser, onViewProfile }) => {
    return (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Manage Users ({allUsers.length})</h2>
            <div className="space-y-3">
                {allUsers.map(user => (
                    <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md bg-muted/50 border border-border">
                        <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => onViewProfile(user.id)}>
                            <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                            <div>
                                <p className="font-semibold text-card-foreground">{user.name} {user.id === currentUser.id && '(You)'}</p>
                                <p className="text-sm text-text-muted">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-end sm:self-center">
                            <button 
                                onClick={() => onToggleAdmin(user.id, user.isAdmin || false)}
                                disabled={user.id === currentUser.id}
                                className={`text-xs font-semibold py-1 px-3 rounded-full ${user.isAdmin ? 'bg-secondary/20 text-secondary hover:bg-secondary/30' : 'bg-primary/20 text-primary hover:bg-primary/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                            <button 
                                onClick={() => { if(window.confirm(`Are you sure you want to delete ${user.name}? This is irreversible.`)) onDeleteUser(user.id) }}
                                disabled={user.id === currentUser.id}
                                className="bg-destructive/20 text-destructive font-semibold py-1 px-3 rounded-full text-xs hover:bg-destructive/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PostManagement: React.FC<Pick<AdminPageProps, 'allPosts' | 'usersMap' | 'onDeletePost'>> = ({ allPosts, usersMap, onDeletePost }) => {
    return (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
             <h2 className="text-xl font-bold text-foreground mb-4">Manage Posts ({allPosts.length})</h2>
             <div className="space-y-3">
                {allPosts.map(post => {
                    const author = usersMap[post.authorId];
                    return (
                        <div key={post.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-border">
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-card-foreground truncate">{post.content || (post.mediaType ? `[${post.mediaType}]` : '[Shared Post]')}</p>
                                <p className="text-xs text-text-muted">
                                    By {post.isConfession ? 'Anonymous' : (author?.name || 'Unknown User')} on {new Date(post.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => { if(window.confirm('Are you sure you want to delete this post?')) onDeletePost(post.id) }}
                                className="ml-4 flex-shrink-0 bg-destructive/20 text-destructive p-2 rounded-full hover:bg-destructive/30"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GroupManagement: React.FC<Pick<AdminPageProps, 'allGroups' | 'usersMap' | 'onDeleteGroup'>> = ({ allGroups, usersMap, onDeleteGroup }) => {
    return (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
             <h2 className="text-xl font-bold text-foreground mb-4">Manage Groups ({allGroups.length})</h2>
             <div className="space-y-3">
                {allGroups.map(group => {
                    const creator = usersMap[group.creatorId];
                    return (
                        <div key={group.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-border">
                             <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-card-foreground">{group.name}</p>
                                <p className="text-xs text-text-muted">
                                    {group.memberIds.length} members - Created by {creator?.name || 'Unknown User'}
                                </p>
                            </div>
                            <button 
                                onClick={() => { if(window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) onDeleteGroup(group.id) }}
                                className="ml-4 flex-shrink-0 bg-destructive/20 text-destructive p-2 rounded-full hover:bg-destructive/30"
                            >
                               <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { currentUser, onNavigate, currentPath, postCardProps, usersMap, allPosts, allGroups, allUsers } = props;
    const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'groups'>('users');
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return <PostManagement {...props} />;
            case 'groups':
                return <GroupManagement {...props} />;
            case 'users':
            default:
                return <UserManagement {...props} onViewProfile={setViewingUserId} />;
        }
    };
    
    // If we are viewing a specific user's profile
    if (viewingUserId) {
        return (
            <ProfilePage
                profileUserId={viewingUserId}
                currentUser={currentUser}
                users={usersMap}
                posts={allPosts}
                groups={allGroups}
                onNavigate={onNavigate}
                currentPath={currentPath}
                onDeletePost={props.onDeletePost} // Pass admin delete handler
                {...postCardProps} // Pass other handlers
                // Admin-specific props
                isAdminView={true}
                onBackToAdmin={() => setViewingUserId(null)}
                // Dummy props for functions not needed in admin view
                onAddPost={() => {}}
                onAddAchievement={() => {}}
                onAddInterest={() => {}}
                onUpdateProfile={() => {}}
            />
        );
    }

    // Default admin dashboard view
    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-6">Admin Dashboard</h1>
                    
                    <div className="mb-6">
                        <div className="border-b border-border">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('users')} className={`flex items-center space-x-2 transition-colors duration-200 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                <UsersIcon className="w-5 h-5" /> <span>Users ({allUsers.length})</span>
                            </button>
                            <button onClick={() => setActiveTab('posts')} className={`flex items-center space-x-2 transition-colors duration-200 ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                <PostIcon className="w-5 h-5" /> <span>Posts ({allPosts.length})</span>
                            </button>
                             <button onClick={() => setActiveTab('groups')} className={`flex items-center space-x-2 transition-colors duration-200 ${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                <StarIcon className="w-5 h-5" /> <span>Groups ({allGroups.length})</span>
                            </button>
                            </nav>
                        </div>
                    </div>

                    <div>
                        {renderTabContent()}
                    </div>
                </div>
            </main>
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default AdminPage;