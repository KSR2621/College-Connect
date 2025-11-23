
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Story, GroupResource, GroupCategory, GroupPrivacy } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import CreatePostModal from '../components/CreatePostModal';
import Avatar from '../components/Avatar';
import ToggleSwitch from '../components/ToggleSwitch';
import EditGroupModal from '../components/EditGroupModal';
import { 
    ArrowLeftIcon, UsersIcon, LockIcon, PlusIcon, SettingsIcon, TrashIcon, 
    LogOutIcon, StarIcon, MessageIcon, SendIcon, GlobeIcon, CalendarIcon, 
    FileIcon, InfoIcon, ShieldIcon, CheckCircleIcon, XCircleIcon, LinkIcon,
    DownloadIcon, EditIcon, EyeIcon
} from '../components/Icons';
import { auth, db, FieldValue } from '../firebase';

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
  onUpdateGroup: (groupId: string, data: { name: string; description: string; category: GroupCategory; privacy: GroupPrivacy }) => void;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = (props) => {
    const { group, currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, onAddStory, onJoinGroupRequest, onApproveJoinRequest, onDeclineJoinRequest, onDeleteGroup, onSendGroupMessage, onRemoveGroupMember, onToggleFollowGroup, onUpdateGroup, ...postCardProps } = props;
    
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'about' | 'feed' | 'chat' | 'events' | 'members' | 'resources' | 'settings'>('about');
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    // State for Resources
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceLink, setNewResourceLink] = useState('');
    const [isAddingResource, setIsAddingResource] = useState(false);

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
    const isPrivate = group.privacy === 'private';

    const memberUsers = group.memberIds.map(id => users[id]).filter(Boolean);
    const pendingUsers = (group.pendingMemberIds || []).map(id => users[id]).filter(Boolean);
    const groupEvents = posts.filter(p => p.groupId === group.id && p.isEvent).sort((a, b) => (b.eventDetails?.date ? new Date(b.eventDetails.date).getTime() : 0) - (a.eventDetails?.date ? new Date(a.eventDetails.date).getTime() : 0));

    // Visibility Settings Logic
    // Default behavior: Public groups show everything by default, Private groups hide everything by default.
    const defaultVisibility = isPrivate 
        ? { about: true, feed: false, events: false, members: false, resources: false }
        : { about: true, feed: true, events: true, members: true, resources: true };

    const visSettings = group.visibilitySettings || defaultVisibility;

    // Visibility Checks
    const canViewAbout = isMember || visSettings.about !== false; // Default to true if undefined
    const canViewFeed = isMember || visSettings.feed !== false;
    const canViewEvents = isMember || visSettings.events !== false;
    const canViewMembers = isMember || visSettings.members !== false;
    const canViewResources = isMember || visSettings.resources !== false;
    const canViewChat = isMember; // Chat always private to members

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onSendGroupMessage(group.id, chatInput.trim());
            setChatInput('');
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newResourceTitle.trim() && newResourceLink.trim()) {
            const newResource: GroupResource = {
                id: Date.now().toString(),
                title: newResourceTitle,
                url: newResourceLink,
                type: 'link', // Default to link for now
                uploadedBy: currentUser.id,
                timestamp: Date.now()
            };
            
            await db.collection('groups').doc(group.id).update({
                resources: FieldValue.arrayUnion(newResource)
            });
            
            setNewResourceTitle('');
            setNewResourceLink('');
            setIsAddingResource(false);
        }
    };

    const handleDeleteResource = async (resource: GroupResource) => {
        if(window.confirm("Remove this resource?")) {
             await db.collection('groups').doc(group.id).update({
                resources: FieldValue.arrayRemove(resource)
            });
        }
    }

    const handleToggleVisibility = async (setting: keyof NonNullable<Group['visibilitySettings']>) => {
        const currentSettings = group.visibilitySettings || defaultVisibility;
        const newSettings = { ...currentSettings, [setting]: !currentSettings[setting] };
        
        await db.collection('groups').doc(group.id).update({
            visibilitySettings: newSettings
        });
    };

    const TabButton: React.FC<{ id: typeof activeTab; label: string; icon: React.ElementType }> = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`flex flex-col items-center py-3 px-4 min-w-[80px] border-b-2 transition-all duration-200 ${
                activeTab === id 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
            <Icon className={`w-5 h-5 mb-1 ${activeTab === id ? 'stroke-2' : ''}`} />
            <span className="text-xs font-bold">{label}</span>
        </button>
    );

    const PrivatePlaceholder: React.FC<{ message: string; icon: React.ElementType }> = ({ message, icon: Icon }) => (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card rounded-3xl border border-border shadow-sm mt-2 mx-auto max-w-md animate-fade-in">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-muted/30">
                <Icon className="w-8 h-8 opacity-50"/>
            </div>
            <h3 className="text-xl font-bold text-foreground">Content Private</h3>
            <p className="mt-2 text-sm">{message}</p>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'about':
                if (!canViewAbout) return <PrivatePlaceholder message="The group description is private." icon={InfoIcon} />;
                return (
                    <div className="space-y-6 p-4 animate-fade-in">
                        <div className="bg-card dark:bg-slate-900 rounded-2xl border border-border p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <InfoIcon className="w-5 h-5 text-primary"/> About
                            </h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base">{group.description}</p>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</p>
                                    <p className="font-semibold text-foreground">{group.category || 'General'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Privacy</p>
                                    <div className="flex items-center gap-1.5">
                                        {group.privacy === 'private' ? <LockIcon className="w-3.5 h-3.5 text-amber-500"/> : <GlobeIcon className="w-3.5 h-3.5 text-emerald-500"/>}
                                        <span className="font-semibold text-foreground capitalize">{group.privacy || 'Public'}</span>
                                    </div>
                                </div>
                                 <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Members</p>
                                    <p className="font-semibold text-foreground">{group.memberIds.length}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin</p>
                                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onNavigate(`#/profile/${group.creatorId}`)}>
                                        <Avatar src={users[group.creatorId]?.avatarUrl} name={users[group.creatorId]?.name || 'Admin'} size="sm"/>
                                        <span className="font-semibold text-foreground text-sm truncate">{users[group.creatorId]?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'feed':
                if (!canViewFeed) return <PrivatePlaceholder message="Posts are visible to members only." icon={GlobeIcon} />;
                return (
                    <div className="animate-fade-in p-4">
                        <Feed 
                            posts={posts} 
                            users={users} 
                            currentUser={currentUser} 
                            groups={groups}
                            onNavigate={onNavigate}
                            {...postCardProps} 
                        />
                    </div>
                );
            case 'chat':
                return (
                    <div className="h-[calc(100vh-240px)] flex flex-col animate-fade-in bg-card border-x border-b border-border max-w-4xl mx-auto shadow-sm rounded-b-xl overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                                {(group.messages || []).map((msg, idx) => {
                                    const isMe = msg.senderId === currentUser.id;
                                    const sender = users[msg.senderId];
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
                        <div className="p-3 bg-card border-t border-border sticky bottom-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input 
                                    className="flex-1 bg-muted/50 hover:bg-muted border-transparent focus:bg-background border focus:border-primary rounded-full px-5 py-3 text-sm focus:outline-none transition-all shadow-inner text-foreground placeholder:text-muted-foreground"
                                    placeholder="Message the group..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatInput.trim()} 
                                    className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-transform active:scale-95 flex-shrink-0"
                                >
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                );
            case 'events':
                if (!canViewEvents) return <PrivatePlaceholder message="Events are visible to members only." icon={CalendarIcon} />;
                return (
                    <div className="p-4 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary"/> Group Events</h3>
                            {isMember && (
                                <button onClick={() => setIsCreatePostModalOpen(true)} className="text-sm font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                                    <PlusIcon className="w-4 h-4"/> Add Event
                                </button>
                            )}
                        </div>
                        {groupEvents.length > 0 ? (
                            <Feed 
                                posts={groupEvents} 
                                users={users} 
                                currentUser={currentUser} 
                                groups={groups}
                                onNavigate={onNavigate}
                                {...postCardProps} 
                            />
                        ) : (
                            <div className="text-center py-16 bg-card rounded-2xl border border-border dashed">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-8 h-8 text-muted-foreground/50"/>
                                </div>
                                <p className="text-muted-foreground font-medium">No upcoming events.</p>
                            </div>
                        )}
                    </div>
                );
            case 'members':
                if (!canViewMembers) return <PrivatePlaceholder message="Members list is visible to members only." icon={UsersIcon} />;
                return (
                    <div className="p-4 space-y-6 animate-fade-in">
                        {isAdmin && pendingUsers.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl">
                                <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
                                    Pending Requests
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {pendingUsers.map(user => (
                                        <div key={user.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button onClick={() => onApproveJoinRequest(group.id, user.id)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 p-2 rounded-lg font-bold transition-colors"><CheckCircleIcon className="w-4 h-4"/></button>
                                                <button onClick={() => onDeclineJoinRequest(group.id, user.id)} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-lg font-bold transition-colors"><XCircleIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {memberUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                                        <Avatar src={user.avatarUrl} name={user.name} size="md"/>
                                        <div className="min-w-0">
                                            <p className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2 truncate">
                                                {user.name}
                                                {user.id === group.creatorId && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide border border-primary/20 font-extrabold">Admin</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                                        </div>
                                    </div>
                                    {isAdmin && user.id !== currentUser.id && (
                                        <button onClick={() => onRemoveGroupMember(group.id, user.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remove Member">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'resources':
                if (!canViewResources) return <PrivatePlaceholder message="Resources are available to members only." icon={FileIcon} />;
                return (
                    <div className="p-4 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><FileIcon className="w-5 h-5 text-blue-500"/> Files & Resources</h3>
                            {isMember && (
                                <button onClick={() => setIsAddingResource(!isAddingResource)} className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md">
                                    <PlusIcon className="w-4 h-4"/> Add Resource
                                </button>
                            )}
                        </div>

                        {isAddingResource && (
                            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-lg animate-scale-in">
                                <h4 className="font-bold text-sm text-foreground">Add New Resource</h4>
                                <input 
                                    type="text" 
                                    placeholder="Title (e.g., Study Guide)" 
                                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newResourceTitle}
                                    onChange={e => setNewResourceTitle(e.target.value)}
                                />
                                <input 
                                    type="url" 
                                    placeholder="URL (e.g., Google Drive Link)" 
                                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newResourceLink}
                                    onChange={e => setNewResourceLink(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={() => setIsAddingResource(false)} className="text-sm font-bold text-muted-foreground px-4 py-2 hover:bg-muted rounded-lg">Cancel</button>
                                    <button onClick={handleAddResource} className="text-sm font-bold bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-transform active:scale-95">Save</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {(group.resources || []).map((resource) => (
                                <div key={resource.id} className="flex items-center p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all group">
                                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                        {resource.type === 'link' ? <LinkIcon className="w-6 h-6"/> : <FileIcon className="w-6 h-6"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground truncate text-base">{resource.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="font-medium">{users[resource.uploadedBy]?.name.split(' ')[0]}</span>
                                            <span>•</span>
                                            <span>{new Date(resource.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Open">
                                            <DownloadIcon className="w-5 h-5"/>
                                        </a>
                                        {(isAdmin || resource.uploadedBy === currentUser.id) && (
                                            <button onClick={() => handleDeleteResource(resource)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!group.resources || group.resources.length === 0) && (
                                <div className="text-center py-16 bg-muted/10 rounded-2xl border border-border dashed">
                                    <FileIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30"/>
                                    <p className="text-muted-foreground font-medium">No resources shared yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-4 space-y-8 animate-fade-in max-w-3xl mx-auto">
                        {!isAdmin ? (
                            <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
                                <ShieldIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"/>
                                <h3 className="font-bold text-xl text-foreground">Admin Access Required</h3>
                                <p className="text-muted-foreground mt-2">Only group administrators can manage settings.</p>
                            </div>
                        ) : (
                            <>
                                {/* General Settings */}
                                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                                        <SettingsIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-foreground">General Settings</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-foreground text-sm">Edit Group Info</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Update name, description, or category.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditGroupModalOpen(true)}
                                                className="bg-secondary/10 text-secondary hover:bg-secondary/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-secondary/20"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <div className="w-full h-px bg-border"></div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-foreground text-sm">Privacy Level</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    Current: <span className="font-semibold capitalize text-foreground">{group.privacy || 'Public'}</span>
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditGroupModalOpen(true)}
                                                className="bg-muted hover:bg-muted/80 text-foreground border border-border px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility Settings */}
                                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                                        <EyeIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-foreground">Content Visibility</h3>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <p className="text-sm text-muted-foreground mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <InfoIcon className="w-4 h-4 inline-block mr-1 -mt-0.5"/> 
                                            Control what non-members can see. {isPrivate ? "As a Private group, content is hidden by default, but you can choose to make specific sections public." : "As a Public group, content is visible by default, but you can choose to hide specific sections."}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-foreground">About Tab</span>
                                            <ToggleSwitch id="vis-about" checked={visSettings.about !== false} onChange={() => handleToggleVisibility('about')} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-foreground">Posts Feed</span>
                                            <ToggleSwitch id="vis-feed" checked={visSettings.feed !== false} onChange={() => handleToggleVisibility('feed')} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-foreground">Events Calendar</span>
                                            <ToggleSwitch id="vis-events" checked={visSettings.events !== false} onChange={() => handleToggleVisibility('events')} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-foreground">Members List</span>
                                            <ToggleSwitch id="vis-members" checked={visSettings.members !== false} onChange={() => handleToggleVisibility('members')} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-foreground">Resources & Files</span>
                                            <ToggleSwitch id="vis-resources" checked={visSettings.resources !== false} onChange={() => handleToggleVisibility('resources')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl border border-red-200 dark:border-red-900/50">
                                    <h3 className="font-bold text-lg text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                        <TrashIcon className="w-5 h-5"/> Danger Zone
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-400 mb-6">
                                        Deleting the group is permanent and cannot be undone. All messages, posts, and resources will be lost forever.
                                    </p>
                                    <button 
                                        onClick={() => { if(window.confirm('Are you absolutely sure? This cannot be undone.')) { onDeleteGroup(group.id); onNavigate('#/groups'); } }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 transition-transform active:scale-95"
                                    >
                                        Delete Group Permanently
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-0 sm:px-4 lg:px-8 pt-0 sm:pt-6 pb-20 lg:pb-8">
                 {/* Group Banner */}
                <div className={`relative h-48 sm:h-72 w-full sm:rounded-t-3xl overflow-hidden group`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
                    </div>
                    <button onClick={() => onNavigate('#/groups')} className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full backdrop-blur-md transition-all z-10">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* Header Content */}
                <div className="bg-card dark:bg-slate-900 sm:rounded-b-3xl shadow-sm border-x border-b border-border px-4 sm:px-8 pb-6 -mt-6 pt-16 relative mb-6 z-10">
                    {/* Floating Icon */}
                    <div className="absolute -top-12 left-4 sm:left-8 bg-card p-1.5 rounded-3xl shadow-xl">
                        <div className="bg-gradient-to-br from-primary to-purple-600 w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] flex items-center justify-center text-white shadow-inner">
                            <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md"/>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
                        <div className="mt-2 sm:mt-0">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{group.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                                    <UsersIcon className="w-4 h-4"/> {group.memberIds.length} members
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${group.privacy === 'private' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {group.privacy || 'Public'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                             {/* Follow Button */}
                            <button 
                                onClick={() => onToggleFollowGroup(group.id)}
                                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border shadow-sm ${
                                    isFollowing 
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' 
                                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                                }`}
                            >
                                <StarIcon className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`}/>
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>

                            {isMember ? (
                                <button onClick={() => setIsCreatePostModalOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform hover:scale-105">
                                    <PlusIcon className="w-4 h-4"/> Post
                                </button>
                            ) : isPending ? (
                                <button disabled className="flex-1 sm:flex-none bg-muted text-muted-foreground px-6 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed border border-border">Request Sent</button>
                            ) : (
                                <button onClick={() => onJoinGroupRequest(group.id)} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform hover:scale-105">Join Group</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-xl border-b border-border mb-6 overflow-x-auto no-scrollbar mx-0 rounded-none shadow-sm">
                    <div className="flex px-4 sm:px-8 gap-6 min-w-max">
                        <TabButton id="about" label="About" icon={InfoIcon} />
                        {canViewFeed && <TabButton id="feed" label="Feed" icon={GlobeIcon} />}
                        {canViewChat && <TabButton id="chat" label="Chat" icon={MessageIcon} />}
                        {canViewEvents && <TabButton id="events" label="Events" icon={CalendarIcon} />}
                        {canViewMembers && <TabButton id="members" label="Members" icon={UsersIcon} />}
                        {canViewResources && <TabButton id="resources" label="Resources" icon={FileIcon} />}
                        {isAdmin && <TabButton id="settings" label="Settings" icon={SettingsIcon} />}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-5xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            <CreatePostModal 
                isOpen={isCreatePostModalOpen}
                onClose={() => setIsCreatePostModalOpen(false)}
                user={currentUser}
                onAddPost={onAddPost}
                groupId={group.id}
            />

            {isEditGroupModalOpen && (
                <EditGroupModal
                    isOpen={isEditGroupModalOpen}
                    onClose={() => setIsEditGroupModalOpen(false)}
                    group={group}
                    onUpdateGroup={onUpdateGroup}
                />
            )}

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default GroupDetailPage;
