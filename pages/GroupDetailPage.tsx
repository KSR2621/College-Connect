
import React, { useState, useRef, useEffect } from 'react';
import type { User, Post, Group, ReactionType, Story } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import CreatePostModal from '../components/CreatePostModal';
import Avatar from '../components/Avatar';
import { ArrowLeftIcon, UsersIcon, LockIcon, PlusIcon, SettingsIcon, TrashIcon, LogOutIcon, StarIcon, MessageIcon, SendIcon } from '../components/Icons';
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
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTab, group?.messages]);

    if (!group) return <div className="p-8 text-center">Group not found</div>;

    const isMember = group.memberIds.includes(currentUser.id);
    const isPending = group.pendingMemberIds?.includes(currentUser.id);
    const isAdmin = group.creatorId === currentUser.id;
    const isFollowing = currentUser.followingGroups?.includes(group.id);

    const memberUsers = group.memberIds.map(id => users[id]).filter(Boolean);
    const pendingUsers = (group.pendingMemberIds || []).map(id => users[id]).filter(Boolean);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onSendGroupMessage(group.id, chatInput.trim());
            setChatInput('');
        }
    };

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-4">
                 {/* Group Header */}
                <div className="bg-card rounded-2xl shadow-sm p-6 mb-6 border border-border animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <button onClick={() => onNavigate('#/groups')} className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeftIcon className="w-4 h-4 mr-1.5"/>
                            Back
                        </button>
                        
                        <div className="flex gap-2">
                             {/* Follow Button */}
                            <button 
                                onClick={() => onToggleFollowGroup(group.id)}
                                className={`px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border shadow-sm ${
                                    isFollowing 
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' 
                                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                                }`}
                            >
                                <StarIcon className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`}/>
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>

                            {isMember ? (
                                <>
                                    <button onClick={() => setIsCreatePostModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                                        <PlusIcon className="w-4 h-4"/> Post
                                    </button>
                                    {isAdmin ? (
                                        <button onClick={() => { if(window.confirm('Delete this group?')) { onDeleteGroup(group.id); onNavigate('#/groups'); } }} className="bg-destructive/10 text-destructive px-3 py-2 rounded-xl font-bold text-sm hover:bg-destructive/20 transition-colors" title="Delete Group">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    ) : (
                                        <button onClick={() => onRemoveGroupMember(group.id, currentUser.id)} className="bg-muted text-muted-foreground px-3 py-2 rounded-xl font-bold text-sm hover:bg-muted/80 transition-colors" title="Leave Group">
                                            <LogOutIcon className="w-4 h-4"/>
                                        </button>
                                    )}
                                </>
                            ) : isPending ? (
                                <button disabled className="bg-muted text-muted-foreground px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed border border-border">Requested</button>
                            ) : (
                                <button onClick={() => onJoinGroupRequest(group.id)} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">Join Group</button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">{group.name}</h1>
                            <p className="text-muted-foreground leading-relaxed">{group.description}</p>
                            
                            <div className="flex items-center gap-4 mt-4 text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                                    <UsersIcon className="w-4 h-4"/> {group.memberIds.length} members
                                </div>
                                {isAdmin && <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">Admin</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                {isMember && (
                    <div className="flex border-b border-border mb-6 sticky top-16 bg-background/95 backdrop-blur-sm z-10">
                        <button onClick={() => setActiveTab('feed')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Feed</button>
                        <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Chat</button>
                        <button onClick={() => setActiveTab('members')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Members</button>
                    </div>
                )}

                {/* Tab Content */}
                {isMember ? (
                    <div className="animate-fade-in">
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
                        
                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-[70vh] bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                                     {(group.messages || []).map((msg, idx) => {
                                         const isMe = msg.senderId === currentUser.id;
                                         const sender = users[msg.senderId];
                                         
                                         // Check if previous message was from same sender to group visually
                                         const prevMsg = (group.messages || [])[idx - 1];
                                         const isSequence = prevMsg && prevMsg.senderId === msg.senderId;

                                         return (
                                             <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-1' : 'mt-3'}`}>
                                                 {!isMe ? (
                                                     <div className="w-8 flex-shrink-0">
                                                         {!isSequence && <Avatar src={sender?.avatarUrl} name={sender?.name || 'User'} size="sm" />}
                                                     </div>
                                                 ) : <div className="w-8"/>}
                                                 
                                                 <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                     {!isMe && !isSequence && (
                                                         <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">{sender?.name}</span>
                                                     )}
                                                     <div className={`px-4 py-2.5 text-sm shadow-sm break-words ${isMe ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-foreground border border-border rounded-2xl rounded-tl-sm'}`}>
                                                         {msg.text}
                                                     </div>
                                                     <span className={`text-[9px] text-muted-foreground mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                         {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                     </span>
                                                 </div>
                                             </div>
                                         )
                                     })}
                                     <div ref={chatEndRef} />
                                     {(!group.messages || group.messages.length === 0) && (
                                         <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                             <MessageIcon className="w-16 h-16 mb-4 text-muted-foreground/30"/>
                                             <p className="font-medium">No messages yet.</p>
                                             <p className="text-sm">Start the conversation!</p>
                                         </div>
                                     )}
                                </div>

                                <div className="p-3 bg-card border-t border-border">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                        <input 
                                            className="flex-1 bg-muted/50 border-transparent focus:bg-background border focus:border-primary rounded-full px-5 py-3 text-sm focus:outline-none transition-all shadow-inner"
                                            placeholder="Message the group..."
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!chatInput.trim()} 
                                            className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                        >
                                            <SendIcon className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="space-y-6">
                                {isAdmin && pendingUsers.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl">
                                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                                            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
                                            Pending Requests
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {pendingUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                        <div>
                                                            <p className="font-bold text-sm text-foreground">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.department}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => onApproveJoinRequest(group.id, user.id)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Accept</button>
                                                        <button onClick={() => onDeclineJoinRequest(group.id, user.id)} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Deny</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {memberUsers.map(user => (
                                        <div key={user.id} className="flex justify-between items-center p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                                                <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                                                <div>
                                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.department}</p>
                                                </div>
                                            </div>
                                            {isAdmin && user.id !== currentUser.id && (
                                                <button onClick={() => onRemoveGroupMember(group.id, user.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors" title="Remove Member">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                            {user.id === group.creatorId && (
                                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-wide">Admin</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border shadow-sm mt-6">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                            <LockIcon className="w-8 h-8 opacity-50"/>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Private Content</h3>
                        <p className="mt-2">Join this group to view posts, members, and chat.</p>
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
