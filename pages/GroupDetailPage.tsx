
import React, { useState } from 'react';
import type { User, Post, Group, ReactionType, Story } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import CreatePostModal from '../components/CreatePostModal';
import Avatar from '../components/Avatar';
import { ArrowLeftIcon, UsersIcon, LockIcon, PlusIcon, SettingsIcon, TrashIcon, LogOutIcon } from '../components/Icons';
import { auth } from '../firebase';

interface GroupDetailPageProps {
  group: Group;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[]; // For consistency with feed props
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  onAddStory: (storyDetails: any) => void;
  // postCardProps
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  // Group Specific
  onJoinGroupRequest: (groupId: string) => void;
  onApproveJoinRequest: (groupId: string, userId: string) => void;
  onDeclineJoinRequest: (groupId: string, userId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSendGroupMessage: (groupId: string, text: string) => void;
  onRemoveGroupMember: (groupId: string, memberId: string) => void;
  onToggleFollowGroup: (groupId: string) => void;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = (props) => {
    const { group, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddStory, onJoinGroupRequest, onApproveJoinRequest, onDeclineJoinRequest, onDeleteGroup, onSendGroupMessage, onRemoveGroupMember, onToggleFollowGroup, ...postCardProps } = props;
    
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'chat'>('feed');

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    if (!group) return <div className="p-8 text-center">Group not found</div>;

    const isMember = group.memberIds.includes(currentUser.id);
    const isPending = group.pendingMemberIds?.includes(currentUser.id);
    const isAdmin = group.creatorId === currentUser.id;

    const memberUsers = group.memberIds.map(id => users[id]).filter(Boolean);
    const pendingUsers = (group.pendingMemberIds || []).map(id => users[id]).filter(Boolean);

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-4">
                 {/* Group Header */}
                <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
                    <button onClick={() => onNavigate('#/groups')} className="flex items-center text-sm text-primary mb-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                        Back to all groups
                    </button>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                            <p className="text-muted-foreground mt-2">{group.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1"><UsersIcon className="w-4 h-4"/> {group.memberIds.length} members</div>
                                {isAdmin && <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">Admin</div>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isMember ? (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCreatePostModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90">
                                        <PlusIcon className="w-4 h-4"/> Post
                                    </button>
                                    {isAdmin ? (
                                        <button onClick={() => { if(window.confirm('Delete this group?')) { onDeleteGroup(group.id); onNavigate('#/groups'); } }} className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-bold text-sm hover:bg-destructive/20 flex items-center gap-2">
                                            <TrashIcon className="w-4 h-4"/> Delete
                                        </button>
                                    ) : (
                                        <button onClick={() => onRemoveGroupMember(group.id, currentUser.id)} className="bg-muted text-muted-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-muted/80 flex items-center gap-2">
                                            <LogOutIcon className="w-4 h-4"/> Leave
                                        </button>
                                    )}
                                </div>
                            ) : isPending ? (
                                <button disabled className="bg-muted text-muted-foreground px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed">Requested</button>
                            ) : (
                                <button onClick={() => onJoinGroupRequest(group.id)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90">Join Group</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                {isMember && (
                    <div className="flex border-b border-border mb-6">
                        <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Feed</button>
                        <button onClick={() => setActiveTab('members')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Members</button>
                    </div>
                )}

                {/* Tab Content */}
                {isMember ? (
                    <div>
                        {activeTab === 'feed' && (
                            <Feed 
                                posts={posts} 
                                users={users} 
                                currentUser={currentUser} 
                                groups={groups}
                                onNavigate={onNavigate}
                                {...postCardProps} 
                            />
                        )}
                        {activeTab === 'members' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isAdmin && pendingUsers.length > 0 && (
                                    <div className="col-span-full mb-4">
                                        <h3 className="text-lg font-bold mb-2">Pending Requests</h3>
                                        <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2">
                                            {pendingUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center bg-card p-2 rounded shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                        <span>{user.name}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => onApproveJoinRequest(group.id, user.id)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">Approve</button>
                                                        <button onClick={() => onDeclineJoinRequest(group.id, user.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Decline</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {memberUsers.map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-3 bg-card rounded-lg border border-border shadow-sm">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                                            <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                                            <div>
                                                <p className="font-bold text-foreground">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.department}</p>
                                            </div>
                                        </div>
                                        {isAdmin && user.id !== currentUser.id && (
                                            <button onClick={() => onRemoveGroupMember(group.id, user.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
                        <LockIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                        <p>Join this group to see posts and members.</p>
                    </div>
                )}
            </main>

            <CreatePostModal 
                isOpen={isCreatePostModalOpen}
                onClose={() => setIsCreatePostModalOpen(false)}
                user={currentUser}
                onAddPost={onAddPost}
                groupId={group.id}
            />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default GroupDetailPage;
