import React, { useState, useRef, useEffect } from 'react';
import type { User, Group, Post, ReactionType } from '../types';
import Header from '../components/Header';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import StoryCreatorModal from '../components/StoryCreatorModal';
import { auth } from '../firebase';
import { UsersIcon, ArrowLeftIcon, ShareIcon, OptionsIcon, MessageIcon, PostIcon, SendIcon, StarIcon, PlusCircleIcon } from '../components/Icons';

interface GroupDetailPageProps {
  group: Group;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; groupId?: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; }) => void;
  onAddStory: (storyDetails: { 
    textContent: string; 
    backgroundColor: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    groupId?: string;
  }) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onJoinGroupRequest: (groupId: string) => void;
  onApproveJoinRequest: (groupId: string, userId: string) => void;
  onDeclineJoinRequest: (groupId: string, userId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSendGroupMessage: (groupId: string, text: string) => void;
  onRemoveGroupMember: (groupId: string, memberId: string) => void;
  onToggleFollowGroup: (groupId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
}

const GroupChatWindow: React.FC<{
    group: Group;
    currentUser: User;
    users: { [key: string]: User };
    onSendGroupMessage: (groupId: string, text: string) => void;
}> = ({ group, currentUser, users, onSendGroupMessage }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messages = group.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendGroupMessage(group.id, message.trim());
            setMessage('');
        }
    };
    
    return (
        <div className="bg-card rounded-lg shadow-sm border border-border h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-center text-text-muted mt-8">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((msg) => {
                        const sender = users[msg.senderId];
                        if (!sender) return null;
                        const isCurrentUser = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                {!isCurrentUser && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" />}
                                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    {!isCurrentUser && <p className="text-xs text-text-muted mb-1">{sender.name}</p>}
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-card-foreground'}`}>
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border">
                <form onSubmit={handleSubmit} className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-input border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <button type="submit" className="ml-2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const GroupMembersList: React.FC<{
    group: Group;
    currentUser: User;
    users: { [key: string]: User };
    isCreator: boolean;
    onRemoveGroupMember: (groupId: string, memberId: string) => void;
    onNavigate: (path: string) => void;
}> = ({ group, currentUser, users, isCreator, onRemoveGroupMember, onNavigate }) => {
    
    const handleRemove = (memberId: string) => {
        if (window.confirm("Are you sure you want to remove this member from the group?")) {
            onRemoveGroupMember(group.id, memberId);
        }
    }

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
             <div className="space-y-4">
                {group.memberIds.map(memberId => {
                    const member = users[memberId];
                    if (!member) return null;
                    const isGroupCreator = member.id === group.creatorId;

                    return (
                        <div key={memberId} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate(`#/profile/${member.id}`)}>
                                <Avatar src={member.avatarUrl} name={member.name} size="md" />
                                <div>
                                    <p className="font-semibold text-card-foreground flex items-center">
                                        {member.name}
                                        {isGroupCreator && <span className="ml-2 text-xs font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Admin</span>}
                                    </p>
                                    <p className="text-sm text-text-muted">{member.department}</p>
                                </div>
                            </div>
                            {isCreator && member.id !== currentUser.id && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemove(member.id); }} className="bg-destructive/20 text-destructive font-semibold py-1 px-3 rounded-full text-xs hover:bg-destructive/30">
                                    Remove
                                </button>
                            )}
                        </div>
                    );
                })}
             </div>
        </div>
    );
};

const GroupFollowersList: React.FC<{
    group: Group;
    users: { [key: string]: User };
    onNavigate: (path: string) => void;
}> = ({ group, users, onNavigate }) => {
    const followers = group.followers || [];

    if (followers.length === 0) {
        return (
             <div className="bg-card rounded-lg shadow-sm border border-border p-4">
                <p className="text-center text-text-muted py-8">This group doesn't have any followers yet.</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
             <div className="space-y-4">
                {followers.map(followerId => {
                    const follower = users[followerId];
                    if (!follower) return null;

                    return (
                        <div key={followerId} className="flex justify-between items-center p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => onNavigate(`#/profile/${follower.id}`)}>
                            <div className="flex items-center space-x-3">
                                <Avatar src={follower.avatarUrl} name={follower.name} size="md" />
                                <div>
                                    <p className="font-semibold text-card-foreground">{follower.name}</p>
                                    <p className="text-sm text-text-muted">{follower.department}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
    );
};


const GroupDetailPage: React.FC<GroupDetailPageProps> = (props) => {
    const { group, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddStory, onReaction, onAddComment, onDeletePost, onJoinGroupRequest, onApproveJoinRequest, onDeclineJoinRequest, onDeleteGroup, onSendGroupMessage, onRemoveGroupMember, onToggleFollowGroup, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost } = props;
    const [inviteCopied, setInviteCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'members' | 'followers'>('posts');
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);


    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const isMember = group.memberIds.includes(currentUser.id);
    const isCreator = group.creatorId === currentUser.id;
    const hasRequested = group.pendingMemberIds?.includes(currentUser.id) ?? false;
    const isFollowing = currentUser.followingGroups?.includes(group.id) ?? false;

    const handleInvite = () => {
        const inviteLink = `${window.location.origin}${window.location.pathname}#/groups/${group.id}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2000);
        });
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            onDeleteGroup(group.id);
            onNavigate('#/groups');
        }
        setShowOptions(false);
    };

    const pendingRequests = (group.pendingMemberIds || []).map(id => users[id]).filter(Boolean);
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'chat':
                if (!isMember) {
                    return <div className="text-center bg-card p-8 rounded-lg border border-border"><h3 className="text-lg font-semibold text-foreground">You must be a member of this group to join the chat.</h3></div>;
                }
                return <GroupChatWindow group={group} currentUser={currentUser} users={users} onSendGroupMessage={onSendGroupMessage} />;
            case 'members':
                return <GroupMembersList group={group} currentUser={currentUser} users={users} isCreator={isCreator} onRemoveGroupMember={onRemoveGroupMember} onNavigate={onNavigate} />;
            case 'followers':
                return <GroupFollowersList group={group} users={users} onNavigate={onNavigate} />;
            case 'posts':
            default:
                return (
                    <>
                        {isMember && <CreatePost user={currentUser} onAddPost={onAddPost} groupId={group.id} />}
                        <Feed 
                            posts={posts}
                            users={users}
                            currentUser={currentUser}
                            onReaction={onReaction}
                            onAddComment={onAddComment}
                            onDeletePost={onDeletePost}
                            onCreateOrOpenConversation={onCreateOrOpenConversation}
                            onSharePostAsMessage={onSharePostAsMessage}
                            onSharePost={onSharePost}
                            groups={groups}
                            onNavigate={onNavigate}
                        />
                    </>
                );
        }
    };


    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
                 {/* Group Header */}
                <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
                    <button onClick={() => onNavigate('#/groups')} className="flex items-center text-sm text-primary mb-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2"/>
                        Back to all groups
                    </button>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                            <p className="text-md text-text-muted mt-2">{group.description}</p>
                            <div className="flex items-center text-sm text-text-muted mt-4 space-x-4">
                               <button onClick={() => setActiveTab('members')} className={`flex items-center transition-colors duration-200 rounded-md p-1 -ml-1 ${activeTab === 'members' ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}>
                                    <UsersIcon className="w-4 h-4 mr-2" />
                                    <strong className="font-semibold">{group.memberIds.length}</strong>
                                    <span className="ml-1">members</span>
                                </button>
                                <button onClick={() => setActiveTab('followers')} className={`flex items-center transition-colors duration-200 rounded-md p-1 ${activeTab === 'followers' ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}>
                                    <StarIcon className="w-4 h-4 mr-2" />
                                    <strong className="font-semibold">{group.followers?.length || 0}</strong>
                                    <span className="ml-1">followers</span>
                                </button>
                            </div>
                        </div>
                         <div className="flex items-center space-x-2 flex-shrink-0 mt-4 sm:mt-0 sm:ml-4">
                            <button
                                onClick={() => onToggleFollowGroup(group.id)}
                                className={`font-semibold py-2 px-4 rounded-full text-sm transition-colors ${isFollowing ? 'bg-primary/10 border border-primary text-primary hover:bg-primary/20' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            {isMember && (
                                <div className="relative">
                                    <button onClick={handleInvite} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-secondary/90 flex items-center">
                                        <ShareIcon className="w-4 h-4 mr-2" />
                                        Invite
                                    </button>
                                    {inviteCopied && <span className="absolute bottom-full mb-2 right-0 bg-foreground text-background text-xs rounded py-1 px-2">Link Copied!</span>}
                                </div>
                            )}
                            {isCreator && (
                                <button
                                    onClick={() => setIsStoryCreatorOpen(true)}
                                    className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90 flex items-center"
                                >
                                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                                    Add Story
                                </button>
                            )}
                            {!isMember && !hasRequested && (
                                <button onClick={() => onJoinGroupRequest(group.id)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90">
                                    Join Group
                                </button>
                            )}
                             {!isMember && hasRequested && (
                                <button disabled className="bg-muted text-text-muted font-semibold py-2 px-4 rounded-full text-sm cursor-not-allowed">
                                    Request Sent
                                </button>
                            )}
                            {isCreator && (
                                <div className="relative">
                                    <button onClick={() => setShowOptions(!showOptions)} className="p-2 rounded-full hover:bg-muted text-text-muted">
                                        <OptionsIcon className="w-5 h-5" />
                                    </button>
                                    {showOptions && (
                                        <div className="absolute right-0 mt-2 w-40 bg-card rounded-md shadow-lg py-1 border border-border z-10">
                                            <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">
                                                Delete Group
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                 {/* Join Requests for Creator */}
                {isCreator && pendingRequests.length > 0 && (
                    <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
                        <h2 className="text-xl font-bold text-foreground mb-4">Join Requests</h2>
                        <div className="space-y-3">
                            {pendingRequests.map(user => (
                                <div key={user.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center space-x-3">
                                        <Avatar src={user.avatarUrl} name={user.name} size="md" />
                                        <div>
                                            <p className="font-semibold text-card-foreground">{user.name}</p>
                                            <p className="text-sm text-text-muted">{user.department}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => onApproveJoinRequest(group.id, user.id)} className="bg-primary/20 text-primary font-semibold py-1 px-3 rounded-full text-xs hover:bg-primary/30">Approve</button>
                                        <button onClick={() => onDeclineJoinRequest(group.id, user.id)} className="bg-destructive/20 text-destructive font-semibold py-1 px-3 rounded-full text-xs hover:bg-destructive/30">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Main Content */}
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <div className="border-b border-border">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`flex items-center space-x-2 transition-colors duration-200 ${
                                (activeTab === 'posts' || activeTab === 'members' || activeTab === 'followers') ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                <PostIcon className="w-5 h-5"/><span>Posts</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex items-center space-x-2 transition-colors duration-200 ${
                                activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                <MessageIcon className="w-5 h-5"/><span>Chat</span>
                            </button>
                            </nav>
                        </div>
                    </div>

                    <div>
                        {renderTabContent()}
                    </div>
                </div>
            </main>
            
            {isStoryCreatorOpen && (
                <StoryCreatorModal
                    currentUser={currentUser}
                    adminOfGroups={[]}
                    onClose={() => setIsStoryCreatorOpen(false)}
                    onAddStory={onAddStory}
                    defaultGroup={group}
                />
            )}
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default GroupDetailPage;