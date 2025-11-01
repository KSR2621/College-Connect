import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
import type { User, Post, Group, Opportunity, Conversation, Message, Achievement, UserTag, SharedPostInfo } from './types';

// Pages
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import EventsPage from './pages/EventsPage';
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage';
import ConfessionsPage from './pages/ConfessionsPage';
import AdminPage from './pages/AdminPage';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

    // Global state
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [posts, setPosts] = useState<Post[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const prevConversationsRef = useRef<Conversation[]>([]);


    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    // Request notification permission on load
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    // Effect for handling new message notifications
    useEffect(() => {
        if (!currentUser || conversations.length === 0 || !document.hidden) {
            prevConversationsRef.current = conversations;
            return;
        }
    
        conversations.forEach(convo => {
            const prevConvo = prevConversationsRef.current.find(p => p.id === convo.id);
            const prevMessagesCount = prevConvo?.messages.length || 0;
            
            if (convo.messages.length > prevMessagesCount) {
                const newMessage = convo.messages[convo.messages.length - 1];
                if (newMessage && newMessage.senderId !== currentUser.id) {
                    const sender = users[newMessage.senderId];
                    if (sender) {
                         new Notification(`New message from ${sender.name}`, {
                            body: newMessage.text,
                            icon: sender.avatarUrl || '/vite.svg' 
                        });
                    }
                }
            }
        });
    
        prevConversationsRef.current = conversations;
    }, [conversations, currentUser, users]);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userRef = db.collection('users').doc(user.uid);
                let userDoc = await userRef.get();
                let userData = userDoc.data();
    
                // Hardcoded admin check. If a user logs in with this email, they are an admin.
                // This will create/update their user document in Firestore to reflect this.
                if (user.email === 'admin@gmail.com' && (!userData || userData.isAdmin !== true)) {
                    const adminData = {
                        name: userData?.name || 'Campus Admin',
                        email: user.email,
                        department: userData?.department || 'Administration',
                        tag: userData?.tag || 'Faculty',
                        isAdmin: true,
                    };
                    
                    await userRef.set(adminData, { merge: true });
    
                    // After updating, refetch the document to ensure we have the latest data for the session.
                    userDoc = await userRef.get();
                    userData = userDoc.data();
                }
    
                if (userDoc.exists) {
                    setCurrentUser({ id: user.uid, ...userData } as User);
                } else {
                    // A user exists in Firebase Auth, but not in Firestore database.
                    // This is an inconsistent state, so we won't log them in.
                    console.error(`User document not found for UID: ${user.uid}. Logging out.`);
                    auth.signOut();
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
    
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setUsers({});
            setPosts([]);
            setGroups([]);
            setOpportunities([]);
            setConversations([]);
            return;
        };

        const unsubscribers = [
            db.collection('users').onSnapshot(snapshot => {
                const usersData: { [key: string]: User } = {};
                snapshot.forEach(doc => {
                    usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
                });
                setUsers(usersData);
            }),
            db.collection('posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                const postsData: Post[] = [];
                snapshot.forEach(doc => {
                    postsData.push({ id: doc.id, ...doc.data() } as Post);
                });
                setPosts(postsData);
            }),
            db.collection('groups').onSnapshot(snapshot => {
                const groupsData: Group[] = [];
                snapshot.forEach(doc => {
                    groupsData.push({ id: doc.id, ...doc.data() } as Group);
                });
                setGroups(groupsData);
            }),
            db.collection('opportunities').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                const opportunitiesData: Opportunity[] = [];
                snapshot.forEach(doc => {
                    opportunitiesData.push({ id: doc.id, ...doc.data() } as Opportunity);
                });
                setOpportunities(opportunitiesData);
            }),
            db.collection('conversations').where('participantIds', 'array-contains', currentUser.id).onSnapshot(snapshot => {
                const conversationsData: Conversation[] = [];
                snapshot.forEach(doc => {
                    conversationsData.push({ id: doc.id, ...doc.data() } as Conversation);
                });
                setConversations(conversationsData);
            }),
        ];

        return () => unsubscribers.forEach(unsub => unsub());

    }, [currentUser]);

    // This effect synchronizes the `currentUser` state with the real-time `users` data map.
    // This is crucial for features like the "Follow" button to update correctly in the UI
    // after the action is performed.
    useEffect(() => {
        if (currentUser && users[currentUser.id]) {
            const latestUserData = users[currentUser.id];
            // Simple stringify check to prevent infinite re-render loops if the user object hasn't changed.
            if (JSON.stringify(currentUser) !== JSON.stringify(latestUserData)) {
                setCurrentUser(latestUserData);
            }
        }
    }, [users, currentUser]);

    const handleNavigate = (path: string) => {
        window.location.hash = path;
    };
    
    const handleAddPost = async (postDetails: {
        content: string;
        mediaFile?: File | null;
        mediaType?: 'image' | 'video' | null;
        eventDetails?: { title: string; date: string; location: string; };
        groupId?: string;
        isConfession?: boolean;
    }) => {
        if (!currentUser) return;

        try {
            let mediaUrl = '';
            let mediaPath = '';
            
            if (postDetails.mediaFile && postDetails.mediaType) {
                const filePath = `${postDetails.mediaType}s/${currentUser.id}_${Date.now()}_${postDetails.mediaFile.name}`;
                const fileSnapshot = await storage.ref(filePath).put(postDetails.mediaFile);
                mediaUrl = await fileSnapshot.ref.getDownloadURL();
                mediaPath = filePath;
            }

            const newPost: Partial<Omit<Post, 'id'>> = {
                authorId: currentUser.id,
                content: postDetails.content,
                timestamp: Date.now(),
                likes: [],
                comments: [],
                isEvent: !!postDetails.eventDetails,
                isConfession: !!postDetails.isConfession,
            };

            if (mediaUrl && postDetails.mediaType) {
                newPost.mediaUrl = mediaUrl;
                newPost.mediaType = postDetails.mediaType;
                if (postDetails.mediaType === 'image' && mediaPath) {
                    newPost.imagePath = mediaPath;
                } else if (postDetails.mediaType === 'video' && mediaPath) {
                    newPost.videoPath = mediaPath;
                }
            }

            if (postDetails.groupId) {
                newPost.groupId = postDetails.groupId;
            }

            if (postDetails.eventDetails) {
                newPost.eventDetails = postDetails.eventDetails;
            }

            await db.collection('posts').add(newPost);

        } catch (error) {
            console.error("Error creating post:", error);
            alert("Could not create post. Please check your connection or storage permissions.");
        }
    };
    
    const handleToggleLike = async (postId: string) => {
        if (!currentUser) return;
        const postRef = db.collection('posts').doc(postId);
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (post.likes.includes(currentUser.id)) {
            await postRef.update({ likes: FieldValue.arrayRemove(currentUser.id) });
        } else {
            await postRef.update({ likes: FieldValue.arrayUnion(currentUser.id) });
        }
    };

    const handleAddComment = async (postId: string, text: string) => {
        if (!currentUser) return;
        const newComment = {
            id: `comment_${Date.now()}`,
            authorId: currentUser.id,
            text,
            timestamp: Date.now()
        };
        await db.collection('posts').doc(postId).update({
            comments: FieldValue.arrayUnion(newComment)
        });
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser) {
            console.error("Delete operation failed: No current user.");
            return;
        }
    
        const postRef = db.collection('posts').doc(postId);
    
        try {
            const doc = await postRef.get();
            if (!doc.exists) {
                console.error(`Post ${postId} not found in Firestore.`);
                alert("This post may have already been deleted.");
                return;
            }
    
            const postToDelete = doc.data() as Omit<Post, 'id'>;
    
            if (postToDelete.authorId !== currentUser.id) {
                console.error(`User ${currentUser.id} is not authorized to delete post ${postId} owned by ${postToDelete.authorId}.`);
                alert("You can only delete your own posts.");
                return;
            }
    
            // Delete associated media from storage
            const mediaPath = postToDelete.imagePath || postToDelete.videoPath;
            if (mediaPath) {
                await storage.ref(mediaPath).delete().catch(err => {
                    // Log error but don't block post deletion if file is already gone
                    console.warn(`Could not delete media at ${mediaPath}:`, err);
                });
            }
            
            // Delete the post document from Firestore
            await postRef.delete();
        } catch (error) {
            console.error(`An unexpected error occurred while deleting post ${postId}:`, error);
            alert("Could not delete the post due to an unexpected error. Please try again.");
        }
    };

    const handleSendMessage = async (conversationId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Omit<Message, 'id'> = {
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
        };
        const conversationRef = db.collection('conversations').doc(conversationId);
        await conversationRef.update({
            messages: FieldValue.arrayUnion({ ...newMessage, id: `msg_${Date.now()}` })
        });
    };

    const handleDeleteMessage = async (conversationId: string, messageId: string) => {
        if (!currentUser) return;
    
        const conversationRef = db.collection('conversations').doc(conversationId);
        try {
            const doc = await conversationRef.get();
            if (!doc.exists) {
                console.error("Conversation not found.");
                return;
            }
            const conversationData = doc.data() as Omit<Conversation, 'id'>;
    
            const messageToDelete = conversationData.messages.find(m => m.id === messageId);
            if (!messageToDelete) {
                console.warn(`Message ${messageId} not found in conversation ${conversationId}.`);
                return;
            }
    
            if (messageToDelete.senderId !== currentUser.id) {
                alert("You can only delete your own messages.");
                return;
            }
            
            await conversationRef.update({
                messages: FieldValue.arrayRemove(messageToDelete)
            });
    
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Could not delete the message. Please try again.");
        }
    };

    const handleSendGroupMessage = async (groupId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Omit<Message, 'id'> = {
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
        };
        const groupRef = db.collection('groups').doc(groupId);
        await groupRef.update({
            messages: FieldValue.arrayUnion({ ...newMessage, id: `msg_${Date.now()}` })
        });
    };

    const handleSharePostAsMessage = async (conversationId: string, authorName: string, postContent: string) => {
        if (!currentUser) return;
        const text = `Shared a post by ${authorName}:\n\n"${postContent}"`;
        await handleSendMessage(conversationId, text);
    };
    
    const handleSharePost = async (
        originalPost: Post,
        commentary: string,
        shareTarget: { type: 'feed' | 'group'; id?: string }
    ) => {
        if (!currentUser) return;

        try {
            const originalPostToEmbed = originalPost.sharedPost ? originalPost.sharedPost : {
                originalId: originalPost.id,
                originalAuthorId: originalPost.authorId,
                originalTimestamp: originalPost.timestamp,
                originalContent: originalPost.content,
                originalMediaUrl: originalPost.mediaUrl,
                originalMediaType: originalPost.mediaType,
                originalIsEvent: originalPost.isEvent,
                originalEventDetails: originalPost.eventDetails,
                originalIsConfession: originalPost.isConfession,
            };

            const newPost: Partial<Omit<Post, 'id'>> = {
                authorId: currentUser.id,
                content: commentary,
                timestamp: Date.now(),
                likes: [],
                comments: [],
                sharedPost: originalPostToEmbed,
            };

            if (shareTarget.type === 'group' && shareTarget.id) {
                newPost.groupId = shareTarget.id;
            }

            await db.collection('posts').add(newPost);
        } catch (error) {
            console.error("Error sharing post:", error);
            alert("Could not share post. Please try again.");
        }
    };

    const handleCreateOrOpenConversation = async (otherUserId: string): Promise<string> => {
        if (!currentUser) throw new Error("User not logged in");
    
        const existingConvo = conversations.find(c => 
            c.participantIds.length === 2 && 
            c.participantIds.includes(currentUser.id) && 
            c.participantIds.includes(otherUserId)
        );
    
        if (existingConvo) return existingConvo.id;
    
        const newConvo = {
            participantIds: [currentUser.id, otherUserId],
            messages: []
        };
    
        const docRef = await db.collection('conversations').add(newConvo);
        return docRef.id;
    };

    const handleCreateGroup = async (groupDetails: { name: string; description: string; }) => {
        if (!currentUser) return;
        const newGroup: Omit<Group, 'id'> = {
            name: groupDetails.name,
            description: groupDetails.description,
            creatorId: currentUser.id,
            memberIds: [currentUser.id],
            pendingMemberIds: [],
            messages: [],
            followers: [currentUser.id],
        };
        await db.collection('groups').add(newGroup);
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!currentUser) return;
        
        const groupRef = db.collection('groups').doc(groupId);
        try {
            const doc = await groupRef.get();
            if (!doc.exists) {
                console.error("Group not found.");
                return;
            }
            const groupData = doc.data() as Omit<Group, 'id'>;
    
            if (groupData.creatorId !== currentUser.id) {
                alert("You are not authorized to delete this group.");
                return;
            }
    
            await groupRef.delete();
    
        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Could not delete the group. Please try again.");
        }
    };

    const handleToggleFollowGroup = async (groupId: string) => {
        if (!currentUser) return;
    
        const userRef = db.collection('users').doc(currentUser.id);
        const groupRef = db.collection('groups').doc(groupId);
    
        const isFollowing = currentUser.followingGroups?.includes(groupId);
    
        try {
            if (isFollowing) {
                // Unfollow
                await userRef.update({
                    followingGroups: FieldValue.arrayRemove(groupId)
                });
                await groupRef.update({
                    followers: FieldValue.arrayRemove(currentUser.id)
                });
            } else {
                // Follow
                await userRef.update({
                    followingGroups: FieldValue.arrayUnion(groupId)
                });
                await groupRef.update({
                    followers: FieldValue.arrayUnion(currentUser.id)
                });
            }
        } catch (error) {
            console.error("Error toggling group follow:", error);
            alert("Could not update follow status. Please try again.");
        }
    };

    const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
        if (!currentUser) return;
        
        const groupRef = db.collection('groups').doc(groupId);
        try {
            const doc = await groupRef.get();
            if (!doc.exists) {
                console.error("Group not found.");
                return;
            }
            const groupData = doc.data() as Omit<Group, 'id'>;
    
            if (groupData.creatorId !== currentUser.id) {
                alert("You are not authorized to remove members from this group.");
                return;
            }
            
            if (groupData.creatorId === memberId) {
                alert("You cannot remove yourself from the group.");
                return;
            }
    
            await groupRef.update({
                memberIds: FieldValue.arrayRemove(memberId)
            });
    
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Could not remove member. Please try again.");
        }
    };

    const handleCreateOpportunity = async (oppDetails: { title: string; organization: string; description: string; applyLink?: string; }) => {
        if (!currentUser) return;
        const newOpp: Omit<Opportunity, 'id'> = {
            authorId: currentUser.id,
            title: oppDetails.title,
            organization: oppDetails.organization,
            description: oppDetails.description,
            applyLink: oppDetails.applyLink || '',
            timestamp: Date.now(),
        };
        await db.collection('opportunities').add(newOpp);
    };

    const handleDeleteOpportunity = async (opportunityId: string) => {
        if (!currentUser) {
            alert("You must be logged in to delete opportunities.");
            return;
        }
    
        const oppRef = db.collection('opportunities').doc(opportunityId);
    
        try {
            const doc = await oppRef.get();
            if (!doc.exists) {
                console.error("Opportunity not found.");
                alert("This opportunity may have already been deleted.");
                return;
            }
    
            const oppData = doc.data() as Omit<Opportunity, 'id'>;
    
            if (oppData.authorId !== currentUser.id) {
                alert("You are not authorized to delete this opportunity.");
                return;
            }
    
            await oppRef.delete();
        } catch (error) {
            console.error("Error deleting opportunity:", error);
            alert("Could not delete the opportunity. Please try again.");
        }
    };

    const handleAddAchievement = async (achievement: Achievement) => {
        if (!currentUser) return;
        await db.collection('users').doc(currentUser.id).update({
            achievements: FieldValue.arrayUnion(achievement)
        });
    };

    const handleAddInterest = async (interest: string) => {
        if (!currentUser) return;
        await db.collection('users').doc(currentUser.id).update({
            interests: FieldValue.arrayUnion(interest)
        });
    };

    const handleUpdateProfile = async (
        updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number; }, 
        avatarFile?: File | null
    ) => {
        if (!currentUser) return;
        try {
            const userRef = db.collection('users').doc(currentUser.id);
            const dataToUpdate: any = { ...updateData };

            if (updateData.tag !== 'Student') {
                dataToUpdate.yearOfStudy = FieldValue.delete();
            }

            if (avatarFile) {
                const filePath = `avatars/${currentUser.id}/${avatarFile.name}`;
                const fileSnapshot = await storage.ref(filePath).put(avatarFile);
                dataToUpdate.avatarUrl = await fileSnapshot.ref.getDownloadURL();
            }
            await userRef.update(dataToUpdate);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Could not update profile.");
        }
    };

    const handleJoinGroupRequest = async (groupId: string) => {
        if (!currentUser) return;
        await db.collection('groups').doc(groupId).update({
            pendingMemberIds: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleApproveJoinRequest = async (groupId: string, userId: string) => {
        if (!currentUser) return;
        const groupRef = db.collection('groups').doc(groupId);
        await groupRef.update({
            pendingMemberIds: FieldValue.arrayRemove(userId),
            memberIds: FieldValue.arrayUnion(userId)
        });
    };
    
    const handleDeclineJoinRequest = async (groupId: string, userId: string) => {
        if (!currentUser) return;
        const groupRef = db.collection('groups').doc(groupId);
        await groupRef.update({
            pendingMemberIds: FieldValue.arrayRemove(userId)
        });
    };

    // --- ADMIN HANDLERS ---
    const handleAdminDeleteUser = async (userId: string) => {
        if (!currentUser?.isAdmin) return;
        // Note: This is a simple deletion. In a real app, you might want to handle user's content (posts, etc.)
        // or implement a "soft delete" by flagging the user as deleted.
        try {
            await db.collection('users').doc(userId).delete();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Could not delete user.");
        }
    };
    
    const handleAdminToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
        if (!currentUser?.isAdmin) return;
        try {
            await db.collection('users').doc(userId).update({ isAdmin: !currentStatus });
        } catch (error) {
            console.error("Error updating admin status:", error);
            alert("Could not update admin status.");
        }
    };

    const handleAdminDeletePost = async (postId: string) => {
        if (!currentUser?.isAdmin) return;
        const postRef = db.collection('posts').doc(postId);
        try {
            const doc = await postRef.get();
            if (!doc.exists) return;
            const postToDelete = doc.data() as Omit<Post, 'id'>;
            const mediaPath = postToDelete.imagePath || postToDelete.videoPath;
            if (mediaPath) {
                await storage.ref(mediaPath).delete().catch(err => console.warn(`Could not delete media at ${mediaPath}:`, err));
            }
            await postRef.delete();
        } catch (error) {
            console.error(`Admin error deleting post ${postId}:`, error);
            alert("Could not delete the post.");
        }
    };

    const handleAdminDeleteGroup = async (groupId: string) => {
        if (!currentUser?.isAdmin) return;
        try {
            await db.collection('groups').doc(groupId).delete();
        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Could not delete the group.");
        }
    };


    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-foreground">Loading...</p></div>;
    }

    const renderPage = () => {
        const [path, ...params] = currentPath.split('/').slice(1);
        const allUsersList = Object.values(users);

        if (!currentUser) {
            switch (path) {
                case 'login': return <LoginPage onNavigate={handleNavigate} />;
                case 'signup': return <SignupPage onNavigate={handleNavigate} />;
                default: return <WelcomePage onNavigate={handleNavigate} />;
            }
        }
        
        const postCardProps = {
            onToggleLike: handleToggleLike,
            onAddComment: handleAddComment,
            onDeletePost: handleDeletePost,
            onCreateOrOpenConversation: handleCreateOrOpenConversation,
            onSharePostAsMessage: handleSharePostAsMessage,
            onSharePost: handleSharePost,
            groups,
        };
        
        switch (path) {
            case 'home': return <HomePage currentUser={currentUser} users={users} posts={posts} onNavigate={handleNavigate} onAddPost={handleAddPost} currentPath={currentPath} {...postCardProps} />;
            case 'profile': return <ProfilePage profileUserId={params[0]} currentUser={currentUser} users={users} posts={posts} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onAddAchievement={handleAddAchievement} onAddInterest={handleAddInterest} onUpdateProfile={handleUpdateProfile} {...postCardProps} />;
            case 'groups': 
                if (params[0]) {
                    const group = groups.find(g => g.id === params[0]);
                    return group ? <GroupDetailPage group={group} currentUser={currentUser} users={users} posts={posts.filter(p => p.groupId === params[0])} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onJoinGroupRequest={handleJoinGroupRequest} onApproveJoinRequest={handleApproveJoinRequest} onDeclineJoinRequest={handleDeclineJoinRequest} onDeleteGroup={handleDeleteGroup} onRemoveGroupMember={handleRemoveGroupMember} onSendGroupMessage={handleSendGroupMessage} onToggleFollowGroup={handleToggleFollowGroup} {...postCardProps} /> : <div>Group not found</div>;
                }
                return <GroupsPage currentUser={currentUser} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onCreateGroup={handleCreateGroup} />;
            case 'confessions': return <ConfessionsPage currentUser={currentUser} users={users} posts={posts.filter(p => p.isConfession)} onNavigate={handleNavigate} onAddPost={handleAddPost} currentPath={currentPath} {...postCardProps} />;
            case 'events': return <EventsPage currentUser={currentUser} users={users} events={posts.filter(p => p.isEvent)} onNavigate={handleNavigate} currentPath={currentPath} {...postCardProps} />;
            case 'opportunities': return <OpportunitiesPage currentUser={currentUser} users={users} opportunities={opportunities} onNavigate={handleNavigate} currentPath={currentPath} onCreateOpportunity={handleCreateOpportunity} onDeleteOpportunity={handleDeleteOpportunity} />;
            case 'chat': return <ChatPage currentUser={currentUser} users={users} conversations={conversations} onSendMessage={handleSendMessage} onDeleteMessage={handleDeleteMessage} onCreateOrOpenConversation={handleCreateOrOpenConversation} onNavigate={handleNavigate} currentPath={currentPath} />;
            case 'search': return <SearchPage currentUser={currentUser} users={allUsersList} posts={posts} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} {...postCardProps} />;
            case 'admin':
                if (!currentUser.isAdmin) {
                    handleNavigate('#/home');
                    return null;
                }
                return <AdminPage 
                            currentUser={currentUser} 
                            allUsers={allUsersList} 
                            allPosts={posts} 
                            allGroups={groups}
                            usersMap={users}
                            onNavigate={handleNavigate} 
                            currentPath={currentPath}
                            onDeleteUser={handleAdminDeleteUser}
                            onToggleAdmin={handleAdminToggleAdminStatus}
                            onDeletePost={handleAdminDeletePost}
                            onDeleteGroup={handleAdminDeleteGroup}
                            postCardProps={{...postCardProps, onDeletePost: handleAdminDeletePost}} // Pass admin delete post
                        />;
            default:
                handleNavigate('#/home');
                return null;
        }
    };
    
    return <>{renderPage()}</>;
};

export default App;