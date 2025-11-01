import React, { useState } from 'react';
import type { User, Group, Post } from '../types';
import Header from '../components/Header';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { auth } from '../firebase';
import { UsersIcon, ArrowLeftIcon, ShareIcon, OptionsIcon } from '../components/Icons';

interface GroupDetailPageProps {
  group: Group;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; groupId?: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; }) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onJoinGroupRequest: (groupId: string) => void;
  onApproveJoinRequest: (groupId: string, userId: string) => void;
  onDeclineJoinRequest: (groupId: string, userId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = (props) => {
    const { group, currentUser, users, posts, onNavigate, currentPath, onAddPost, onToggleLike, onAddComment, onDeletePost, onJoinGroupRequest, onApproveJoinRequest, onDeclineJoinRequest, onDeleteGroup, onCreateOrOpenConversation, onSharePostAsMessage } = props;
    const [inviteCopied, setInviteCopied] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const isMember = group.memberIds.includes(currentUser.id);
    const isCreator = group.creatorId === currentUser.id;
    const hasRequested = group.pendingMemberIds?.includes(currentUser.id) ?? false;

    const handleInvite = () => {
        const inviteLink = `${window.location.origin}${window.location.pathname}#/groups/${group.id}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2000);
        });
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this group? This action cannot be undone. Posts within this group will be orphaned.")) {
            onDeleteGroup(group.id);
            onNavigate('#/groups');
        }
        setShowOptions(false);
    };

    const pendingRequests = (group.pendingMemberIds || []).map(id => users[id]).filter(Boolean);
    
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
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                            <p className="text-md text-text-muted mt-2">{group.description}</p>
                            <div className="flex items-center text-sm text-text-muted mt-4">
                                <UsersIcon className="w-4 h-4 mr-2" />
                                <span>{group.memberIds.length} members</span>
                            </div>
                        </div>
                         <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                            {isMember && (
                                <div className="relative">
                                    <button onClick={handleInvite} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-secondary/90 flex items-center">
                                        <ShareIcon className="w-4 h-4 mr-2" />
                                        Invite
                                    </button>
                                    {inviteCopied && <span className="absolute bottom-full mb-2 right-0 bg-foreground text-background text-xs rounded py-1 px-2">Link Copied!</span>}
                                </div>
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
                    {isMember ? (
                        <>
                            <CreatePost user={currentUser} onAddPost={onAddPost} groupId={group.id} />
                            <Feed 
                                posts={posts}
                                users={users}
                                currentUser={currentUser}
                                onToggleLike={onToggleLike}
                                onAddComment={onAddComment}
                                onDeletePost={onDeletePost}
                                onCreateOrOpenConversation={onCreateOrOpenConversation}
                                onSharePostAsMessage={onSharePostAsMessage}
                            />
                        </>
                    ) : (
                        <div className="text-center bg-card p-8 rounded-lg border border-border">
                            <h3 className="text-lg font-semibold text-foreground">Join this group to see posts and participate.</h3>
                        </div>
                    )}
                </div>
            </main>
            
            <BottomNavBar onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default GroupDetailPage;