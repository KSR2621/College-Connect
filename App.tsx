

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
import type { User, Post, Group, Conversation, Message, Achievement, UserTag, SharedPostInfo, ReactionType, Story, ConfessionMood, Course, Note, Assignment, AttendanceRecord, AttendanceStatus, Notice } from './types';

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
import AcademicsPage from './pages/AcademicsPage';
// FIX: Changed to named import for CourseDetailPage.
import { CourseDetailPage } from './pages/CourseDetailPage';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

    // Global state
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [posts, setPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
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
            setStories([]);
            setGroups([]);
            setConversations([]);
            setCourses([]);
            setNotices([]);
            return;
        };

        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

        const unsubscribers = [
            db.collection('users').onSnapshot(snapshot => {
                setUsers(prevUsers => {
                    const newUsers = { ...prevUsers };
                    for (const change of snapshot.docChanges()) {
                        const user = { id: change.doc.id, ...change.doc.data() } as User;
                        if (change.type === 'removed') {
                            delete newUsers[user.id];
                        } else { // added or modified
                            newUsers[user.id] = user;
                        }
                    }
                    return newUsers;
                });
            }),
            db.collection('posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                setPosts(prevPosts => {
                    const postsMap = new Map(prevPosts.map(p => [p.id, p]));
                    for (const change of snapshot.docChanges()) {
                        const data = { id: change.doc.id, ...change.doc.data() } as Post;
                        if (change.type === "removed") {
                            postsMap.delete(data.id);
                        } else { // added or modified
                            postsMap.set(data.id, data);
                        }
                    }
                    // FIX: Explicitly type sort parameters to resolve 'unknown' type error.
                    return Array.from(postsMap.values()).sort((a: Post, b: Post) => b.timestamp - a.timestamp);
                });
            }),
            db.collection('stories')
                .where('timestamp', '>', twentyFourHoursAgo)
                .orderBy('timestamp', 'desc')
                .onSnapshot(snapshot => {
                    // For stories, which are temporary and less frequently updated, a full replace is simpler and acceptable.
                    const storiesData: Story[] = [];
                    snapshot.forEach(doc => {
                        storiesData.push({ id: doc.id, ...doc.data() } as Story);
                    });
                    setStories(storiesData);
            }),
            db.collection('groups').onSnapshot(snapshot => {
                 setGroups(prevGroups => {
                    const groupsMap = new Map(prevGroups.map(g => [g.id, g]));
                    for (const change of snapshot.docChanges()) {
                        const group = { id: change.doc.id, ...change.doc.data() } as Group;
                        if (change.type === "removed") {
                            groupsMap.delete(group.id);
                        } else { // added or modified
                            groupsMap.set(group.id, group);
                        }
                    }
                    // Sort by name for a consistent order in lists
                    // FIX: Explicitly type sort parameters to resolve 'unknown' type error.
                    return Array.from(groupsMap.values()).sort((a: Group, b: Group) => a.name.localeCompare(b.name));
                });
            }),
            db.collection('conversations').where('participantIds', 'array-contains', currentUser.id).onSnapshot(snapshot => {
                setConversations(prevConvos => {
                    const convosMap = new Map(prevConvos.map(c => [c.id, c]));
                    for (const change of snapshot.docChanges()) {
                        const convo = { id: change.doc.id, ...change.doc.data() } as Conversation;
                        if (change.type === "removed") {
                            convosMap.delete(convo.id);
                        } else { // added or modified
                            convosMap.set(convo.id, convo);
                        }
                    }
                    return Array.from(convosMap.values());
                });
            }),
            db.collection('notices').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                const noticesData: Notice[] = [];
                snapshot.forEach(doc => {
                    noticesData.push({ id: doc.id, ...doc.data() } as Notice);
                });
                setNotices(noticesData);
            }),
            db.collection('courses').onSnapshot(snapshot => {
                setCourses(prevCourses => {
                    const coursesMap = new Map(prevCourses.map(c => [c.id, c]));
                    for (const change of snapshot.docChanges()) {
                        const course = { id: change.doc.id, ...change.doc.data() } as Course;
                        if (change.type === "removed") {
                            coursesMap.delete(course.id);
                        } else { // added or modified
                            coursesMap.set(course.id, course);
                        }
                    }
                    return Array.from(coursesMap.values());
                });
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
        eventDetails?: { title: string; date: string; location: string; link?: string; };
        groupId?: string;
        isConfession?: boolean;
        confessionMood?: ConfessionMood;
        isOpportunity?: boolean;
        opportunityDetails?: { title: string; organization: string; applyLink?: string; };
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
                reactions: {},
                comments: [],
                isEvent: !!postDetails.eventDetails,
                isConfession: !!postDetails.isConfession,
                isOpportunity: !!postDetails.isOpportunity,
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
            
            if (postDetails.isConfession && postDetails.confessionMood) {
                newPost.confessionMood = postDetails.confessionMood;
            }

            if (postDetails.isOpportunity && postDetails.opportunityDetails) {
                newPost.opportunityDetails = postDetails.opportunityDetails;
            }

            await db.collection('posts').add(newPost);

        } catch (error) {
            console.error("Error creating post:", error);
            alert("Could not create post. Please check your connection or storage permissions.");
        }
    };

    const handleAddStory = async (storyDetails: { 
        textContent: string; 
        backgroundColor: string;
        fontFamily: string;
        fontWeight: string;
        fontSize: string;
        groupId?: string;
    }) => {
        if (!currentUser) return;
        const newStory: Omit<Story, 'id'> = {
            authorId: currentUser.id,
            textContent: storyDetails.textContent,
            backgroundColor: storyDetails.backgroundColor,
            fontFamily: storyDetails.fontFamily,
            fontWeight: storyDetails.fontWeight,
            fontSize: storyDetails.fontSize,
            timestamp: Date.now(),
            viewedBy: [],
        };

        if (storyDetails.groupId) {
            newStory.groupId = storyDetails.groupId;
        }

        await db.collection('stories').add(newStory);
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!currentUser) return;
        const storyRef = db.collection('stories').doc(storyId);
        try {
            const doc = await storyRef.get();
            if (!doc.exists) {
                console.error("Story not found.");
                return;
            }
            const storyData = doc.data() as Omit<Story, 'id'>;
            const group = storyData.groupId ? groups.find(g => g.id === storyData.groupId) : null;

            const isAuthor = storyData.authorId === currentUser.id;
            const isGroupCreator = group && group.creatorId === currentUser.id;
    
            if (!isAuthor && !isGroupCreator) {
                alert("You can only delete your own stories or stories from groups you created.");
                return;
            }
    
            await storyRef.delete();
        } catch (error) {
            console.error("Error deleting story:", error);
            alert("Could not delete story.");
        }
    };

    const handleMarkStoryAsViewed = async (storyId: string) => {
        if (!currentUser) return;
        const storyRef = db.collection('stories').doc(storyId);
        // We only add the user's ID, Firestore handles ensuring it's unique.
        await storyRef.update({
            viewedBy: FieldValue.arrayUnion(currentUser.id)
        });
    };
    
    const handleReaction = async (postId: string, reactionType: ReactionType) => {
        if (!currentUser) return;
        const postRef = db.collection('posts').doc(postId);
        const post = posts.find(p => p.id === postId);
        if (!post) return;
    
        const currentReactions = post.reactions || {};
        let userPreviousReaction: ReactionType | null = null;
    
        // Find if the user has an existing reaction
        for (const rType in currentReactions) {
            if (currentReactions[rType as ReactionType]?.includes(currentUser.id)) {
                userPreviousReaction = rType as ReactionType;
                break;
            }
        }
    
        const batch = db.batch();
    
        // If the user has a previous reaction, remove it
        if (userPreviousReaction) {
            batch.update(postRef, {
                [`reactions.${userPreviousReaction}`]: FieldValue.arrayRemove(currentUser.id)
            });
        }
    
        // If the new reaction is different from the old one, add the new reaction.
        // This also handles the case where there was no previous reaction.
        // If the new reaction is the SAME as the old one, we only remove it (toggle off).
        if (userPreviousReaction !== reactionType) {
            batch.update(postRef, {
                [`reactions.${reactionType}`]: FieldValue.arrayUnion(currentUser.id)
            });
        }
    
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error updating reaction:", error);
            alert("Could not update reaction. Please try again.");
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
            
            const isAuthor = postToDelete.authorId === currentUser.id;
            const isAdmin = !!currentUser.isAdmin;
    
            // Admins can delete any post.
            // Authors can delete their own posts, as long as it's NOT a confession.
            const canDelete = isAdmin || (isAuthor && !postToDelete.isConfession);
    
            if (!canDelete) {
                console.error(`User ${currentUser.id} is not authorized to delete post ${postId}.`);
                alert("You do not have permission to delete this post.");
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

    const handleReplyToStory = async (authorId: string, text: string) => {
        if (!currentUser) return;
        try {
            const conversationId = await handleCreateOrOpenConversation(authorId);
            await handleSendMessage(conversationId, text);
            // In a real app, you might show a success toast here.
        } catch (error) {
            console.error("Error replying to story:", error);
            alert("Could not send reply.");
        }
    };

    const handleDeleteMultipleMessages = async (conversationId: string, messageIds: string[]) => {
        if (!currentUser || messageIds.length === 0) return;
    
        const conversationRef = db.collection('conversations').doc(conversationId);
        try {
            const doc = await conversationRef.get();
            if (!doc.exists) {
                console.error("Conversation not found.");
                return;
            }
            const conversationData = doc.data() as Omit<Conversation, 'id'>;
    
            const messagesToDelete = new Set(messageIds);
            const updatedMessages = conversationData.messages.filter(m => !messagesToDelete.has(m.id));
    
            await conversationRef.update({
                messages: updatedMessages
            });
    
        } catch (error) {
            console.error("Error deleting messages:", error);
            alert("Could not delete the messages. Please try again.");
        }
    };

    const handleDeleteConversations = async (conversationIds: string[]) => {
        if (!currentUser || conversationIds.length === 0) return;
        
        const batch = db.batch();
        
        conversationIds.forEach(id => {
            const conversationRef = db.collection('conversations').doc(id);
            batch.delete(conversationRef);
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error deleting conversations:", error);
            alert("Could not delete the conversations. Please try again.");
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
                reactions: {},
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

    const handleToggleSavePost = async (postId: string) => {
        if (!currentUser) return;
        const userRef = db.collection('users').doc(currentUser.id);
        const isSaved = currentUser.savedPosts?.includes(postId);
        try {
            if (isSaved) {
                await userRef.update({
                    savedPosts: FieldValue.arrayRemove(postId)
                });
            } else {
                await userRef.update({
                    savedPosts: FieldValue.arrayUnion(postId)
                });
            }
        } catch (error) {
            console.error("Error toggling save post:", error);
            alert("Could not update saved posts. Please try again.");
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

    // FIX: Added handlers for group join requests to resolve errors in GroupDetailPage component.
    const handleJoinGroupRequest = async (groupId: string) => {
        if (!currentUser) return;
        const groupRef = db.collection('groups').doc(groupId);
        try {
            await groupRef.update({
                pendingMemberIds: FieldValue.arrayUnion(currentUser.id)
            });
        } catch (error) {
            console.error("Error requesting to join group:", error);
            alert("Could not send join request. Please try again.");
        }
    };

    const handleApproveJoinRequest = async (groupId: string, userId: string) => {
        if (!currentUser) return;
        const groupRef = db.collection('groups').doc(groupId);
        const group = groups.find(g => g.id === groupId);
        if (group?.creatorId !== currentUser.id && !currentUser.isAdmin) {
            alert("You don't have permission to approve requests.");
            return;
        }
        try {
            await groupRef.update({
                pendingMemberIds: FieldValue.arrayRemove(userId),
                memberIds: FieldValue.arrayUnion(userId)
            });
        } catch (error) {
            console.error("Error approving join request:", error);
            alert("Could not approve request. Please try again.");
        }
    };

    const handleDeclineJoinRequest = async (groupId: string, userId: string) => {
        if (!currentUser) return;
        const groupRef = db.collection('groups').doc(groupId);
        const group = groups.find(g => g.id === groupId);
        if (group?.creatorId !== currentUser.id && !currentUser.isAdmin) {
            alert("You don't have permission to decline requests.");
            return;
        }
        try {
            await groupRef.update({
                pendingMemberIds: FieldValue.arrayRemove(userId)
            });
        } catch (error) {
            console.error("Error declining join request:", error);
            alert("Could not decline request. Please try again.");
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
            
            // Explicitly build the update object to prevent issues with undefined fields
            const dataToUpdate: { [key: string]: any } = {
                name: updateData.name,
                bio: updateData.bio,
                department: updateData.department,
                tag: updateData.tag,
            };
    
            if (updateData.tag === 'Student') {
                dataToUpdate.yearOfStudy = updateData.yearOfStudy || 1;
            } else {
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

    // --- ACADEMICS HANDLERS (Firestore Persistence) ---
    const handleCreateCourse = async (newCourseData: Omit<Course, 'id' | 'facultyId'>) => {
        if (!currentUser) return;
        const newCourse: Omit<Course, 'id'> = {
            ...newCourseData,
            facultyId: currentUser.id,
            students: [],
            pendingStudents: [],
            notes: [],
            assignments: [],
            attendanceRecords: [],
            messages: [],
            personalNotes: {},
        };
        await db.collection('courses').add(newCourse);
    };

    const handleAddNote = async (courseId: string, noteData: Omit<Note, 'id'>) => {
        const courseRef = db.collection('courses').doc(courseId);
        const newNote: Note = { id: `note_${Date.now()}`, ...noteData };
        await courseRef.update({
            notes: FieldValue.arrayUnion(newNote)
        });
    };

    const handleAddAssignment = async (courseId: string, assignmentData: Omit<Assignment, 'id'>) => {
        const courseRef = db.collection('courses').doc(courseId);
        const newAssignment: Assignment = { id: `assignment_${Date.now()}`, ...assignmentData };
        await courseRef.update({
            assignments: FieldValue.arrayUnion(newAssignment)
        });
    };

    const handleTakeAttendance = async (courseId: string, attendanceData: Omit<AttendanceRecord, 'date'>) => {
        const courseRef = db.collection('courses').doc(courseId);
        const newRecord: AttendanceRecord = { date: Date.now(), ...attendanceData };
        await courseRef.update({
            attendanceRecords: FieldValue.arrayUnion(newRecord)
        });
    };
    
    const handleRequestToJoinCourse = async (courseId: string) => {
        if (!currentUser) return;
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            pendingStudents: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleManageCourseRequest = async (courseId: string, studentId: string, action: 'approve' | 'decline') => {
        const courseRef = db.collection('courses').doc(courseId);
        const batch = db.batch();
        
        batch.update(courseRef, {
            pendingStudents: FieldValue.arrayRemove(studentId)
        });
        
        if (action === 'approve') {
            batch.update(courseRef, {
                students: FieldValue.arrayUnion(studentId)
            });
        }
        
        await batch.commit();
    };
    
    const handleAddStudentsToCourse = async (courseId: string, studentIds: string[]) => {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            students: FieldValue.arrayUnion(...studentIds)
        });
    };
    
    const handleRemoveStudentFromCourse = async (courseId: string, studentId: string) => {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            students: FieldValue.arrayRemove(studentId)
        });
    };

    const handleSendCourseMessage = async (courseId: string, text: string) => {
        if (!currentUser) return;
        const courseRef = db.collection('courses').doc(courseId);
        const newMessage: Message = {
            id: `msg_course_${Date.now()}`,
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
        };
        await courseRef.update({
            messages: FieldValue.arrayUnion(newMessage)
        });
    };

    const handleUpdateCoursePersonalNote = async (courseId: string, userId: string, content: string) => {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            [`personalNotes.${userId}`]: content
        });
    };


    // --- NOTICE BOARD HANDLERS ---
    const handleCreateNotice = async (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => {
        if (!currentUser || currentUser.tag !== 'Faculty') return;
        const newNotice: Omit<Notice, 'id'> = {
            ...noticeData,
            authorId: currentUser.id,
            timestamp: Date.now(),
        };
        await db.collection('notices').add(newNotice);
    };

    const handleDeleteNotice = async (noticeId: string) => {
        if (!currentUser) return;
        const noticeRef = db.collection('notices').doc(noticeId);
        const doc = await noticeRef.get();
        if (!doc.exists) return;
        const notice = doc.data() as Omit<Notice, 'id'>;

        if (notice.authorId === currentUser.id || currentUser.isAdmin) {
            await noticeRef.delete();
        } else {
            alert("You don't have permission to delete this notice.");
        }
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
        const events = posts.filter(p => p.isEvent);

        if (!currentUser) {
            switch (path) {
                case 'login': return <LoginPage onNavigate={handleNavigate} />;
                case 'signup': return <SignupPage onNavigate={handleNavigate} />;
                default: return <WelcomePage onNavigate={handleNavigate} />;
            }
        }
        
        const postCardProps = {
            onReaction: handleReaction,
            onAddComment: handleAddComment,
            onDeletePost: handleDeletePost,
            onCreateOrOpenConversation: handleCreateOrOpenConversation,
            onSharePostAsMessage: handleSharePostAsMessage,
            onSharePost: handleSharePost,
            onToggleSavePost: handleToggleSavePost,
            groups,
        };
        
        switch (path) {
            case 'home': return <HomePage currentUser={currentUser} users={users} posts={posts} stories={stories} groups={groups} events={events} onNavigate={handleNavigate} onAddPost={handleAddPost} currentPath={currentPath} onAddStory={handleAddStory} onMarkStoryAsViewed={handleMarkStoryAsViewed} onDeleteStory={handleDeleteStory} onReplyToStory={handleReplyToStory} {...postCardProps} />;
            case 'profile': return <ProfilePage profileUserId={params[0]} currentUser={currentUser} users={users} posts={posts} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onAddAchievement={handleAddAchievement} onAddInterest={handleAddInterest} onUpdateProfile={handleUpdateProfile} {...postCardProps} />;
            case 'groups': 
                if (params[0]) {
                    const group = groups.find(g => g.id === params[0]);
                    return group ? <GroupDetailPage group={group} currentUser={currentUser} users={users} posts={posts.filter(p => p.groupId === params[0])} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onAddStory={handleAddStory} onJoinGroupRequest={handleJoinGroupRequest} onApproveJoinRequest={handleApproveJoinRequest} onDeclineJoinRequest={handleDeclineJoinRequest} onDeleteGroup={handleDeleteGroup} onRemoveGroupMember={handleRemoveGroupMember} onSendGroupMessage={handleSendGroupMessage} onToggleFollowGroup={handleToggleFollowGroup} {...postCardProps} /> : <div>Group not found</div>;
                }
                return <GroupsPage currentUser={currentUser} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onCreateGroup={handleCreateGroup} />;
            case 'events': return <EventsPage currentUser={currentUser} users={users} events={events} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} {...postCardProps} />;
            case 'opportunities': return <OpportunitiesPage currentUser={currentUser} users={users} posts={posts} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} postCardProps={postCardProps} />;
            case 'chat': return <ChatPage currentUser={currentUser} users={users} conversations={conversations} onSendMessage={handleSendMessage} onDeleteMultipleMessages={handleDeleteMultipleMessages} onDeleteConversations={handleDeleteConversations} onCreateOrOpenConversation={handleCreateOrOpenConversation} onNavigate={handleNavigate} currentPath={currentPath} />;
            case 'search': return <SearchPage currentUser={currentUser} users={allUsersList} posts={posts} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} {...postCardProps} />;
            case 'academics': 
                 if (params[0]) { // We have a course ID
                    const course = courses.find(c => c.id === params[0]);
                    // FIX: Explicitly type parameter 'u' to resolve 'unknown' type error.
                    const studentsForCourse = allUsersList.filter((u: User) => course?.students?.includes(u.id));
                    return course ? <CourseDetailPage 
                        course={course} 
                        currentUser={currentUser} 
                        allUsers={allUsersList}
                        onNavigate={handleNavigate} 
                        currentPath={currentPath}
                        students={studentsForCourse}
                        onAddNote={handleAddNote}
                        onAddAssignment={handleAddAssignment}
                        onTakeAttendance={handleTakeAttendance}
                        onRequestToJoinCourse={handleRequestToJoinCourse}
                        onManageCourseRequest={handleManageCourseRequest}
                        onAddStudentsToCourse={handleAddStudentsToCourse}
                        onRemoveStudentFromCourse={handleRemoveStudentFromCourse}
                        onSendCourseMessage={handleSendCourseMessage}
                        onUpdateCoursePersonalNote={handleUpdateCoursePersonalNote}
                    /> : <div>Course not found</div>;
                }
                return <AcademicsPage 
                    currentUser={currentUser} 
                    onNavigate={handleNavigate} 
                    currentPath={currentPath} 
                    courses={courses}
                    onCreateCourse={handleCreateCourse}
                    notices={notices}
                    users={users}
                    onCreateNotice={handleCreateNotice}
                    onDeleteNotice={handleDeleteNotice}
                />;
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
