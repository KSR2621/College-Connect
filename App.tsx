


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
// FIX: Added Feedback type to the import list.
import type { User, Post, Group, Conversation, Message, Achievement, UserTag, SharedPostInfo, ReactionType, Story, ConfessionMood, Course, Note, Assignment, AttendanceRecord, AttendanceStatus, Notice, PersonalNote, Feedback, DepartmentChat, Comment, College } from './types';
import { LocalNotifications } from '@capacitor/local-notifications';

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
// FIX: Renamed AdminPage to DirectorPage to reflect new role hierarchy.
// FIX: Changed import for DirectorPage to a default import.
import DirectorPage from './pages/DirectorPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AcademicsPage from './pages/AcademicsPage';
import PersonalNotesPage from './pages/PersonalNotesPage';
// FIX: Changed to named import for CourseDetailPage.
import { CourseDetailPage } from './pages/CourseDetailPage';
import HodPage from './pages/HodPage';

declare const firebase: any;

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
    const [departmentChats, setDepartmentChats] = useState<DepartmentChat[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const prevConversationsRef = useRef<Conversation[]>([]);
    const prevPostsRef = useRef<Post[]>([]);
    const remindedEventIdsRef = useRef<Set<string>>(new Set());


    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    // Request notification permission on load using Capacitor
    useEffect(() => {
        const requestPermissions = async () => {
            let { display } = await LocalNotifications.checkPermissions();
            if (display !== 'granted') {
                ({ display } = await LocalNotifications.requestPermissions());
            }
            if (display !== 'granted') {
                console.warn('Notification permissions not granted.');
            }
        };
        requestPermissions();
    }, []);

    // Effect for handling new message notifications with Capacitor
    useEffect(() => {
        if (!currentUser || conversations.length === 0 || !document.hidden) {
            prevConversationsRef.current = conversations;
            return;
        }
    
        conversations.forEach(async convo => {
            const prevConvo = prevConversationsRef.current.find(p => p.id === convo.id);
            const prevMessagesCount = prevConvo?.messages.length || 0;
            
            if (convo.messages.length > prevMessagesCount) {
                const newMessage = convo.messages[convo.messages.length - 1];
                if (newMessage && newMessage.senderId !== currentUser.id) {
                    const sender = users[newMessage.senderId];
                    if (sender) {
                         await LocalNotifications.schedule({
                            notifications: [{
                                title: `New message from ${sender.name}`,
                                body: newMessage.text,
                                id: Date.now(),
                                schedule: { at: new Date(Date.now() + 100) }, // Immediate
                            }]
                         });
                    }
                }
            }
        });
    
        prevConversationsRef.current = conversations;
    }, [conversations, currentUser, users]);

    // Effect for new group post notifications with Capacitor
    useEffect(() => {
        if (!currentUser || posts.length === 0 || !document.hidden || groups.length === 0) {
            prevPostsRef.current = posts;
            return;
        }

        const prevPostIds = new Set(prevPostsRef.current.map(p => p.id));
        const newPosts = posts.filter(p => !prevPostIds.has(p.id));

        if (newPosts.length > 0) {
            const userGroupIds = new Set([
                ...(currentUser.followingGroups || []),
                ...groups.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id)
            ]);

            newPosts.forEach(async post => {
                if (post.groupId && userGroupIds.has(post.groupId) && post.authorId !== currentUser.id) {
                    const group = groups.find(g => g.id === post.groupId);
                    const author = users[post.authorId];
                    if (group && author) {
                        await LocalNotifications.schedule({
                            notifications: [{
                                title: `New post in ${group.name}`,
                                body: `${author.name}: ${post.content.substring(0, 100).replace(/<[^>]*>?/gm, '')}...`,
                                id: Date.now() + Math.random(),
                                schedule: { at: new Date(Date.now() + 100) },
                            }]
                        });
                    }
                }
            });
        }

        prevPostsRef.current = posts;
    }, [posts, currentUser, users, groups]);

    // Effect for event reminders with Capacitor
    useEffect(() => {
        if (!currentUser) return;

        const reminderInterval = setInterval(() => {
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            posts.forEach(async post => {
                if (post.isEvent && post.eventDetails) {
                    const eventTime = new Date(post.eventDetails.date).getTime();
                    const timeUntilEvent = eventTime - now;

                    if (timeUntilEvent > 0 && timeUntilEvent <= oneHour && !remindedEventIdsRef.current.has(post.id)) {
                        await LocalNotifications.schedule({
                            notifications: [{
                                title: `Event Reminder: ${post.eventDetails.title}`,
                                body: `Starts in about an hour at ${post.eventDetails.location}.`,
                                id: Date.now() + Math.random(),
                                schedule: { at: new Date(Date.now() + 100) },
                            }]
                        });
                        remindedEventIdsRef.current.add(post.id);
                    }
                }
            });
        }, 60 * 1000); // Check every minute

        return () => {
            clearInterval(reminderInterval);
            remindedEventIdsRef.current.clear();
        };
    }, [posts, currentUser]);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userRef = db.collection('users').doc(user.uid);
                let userDoc = await userRef.get();
                let userData = userDoc.data();

                if (user.email === 'superadmin@gmail.com' && (!userData || userData.tag !== 'Super Admin')) {
                    const superAdminData = {
                        name: userData?.name || 'Super Admin',
                        email: user.email,
                        department: userData?.department || 'Administration',
                        tag: 'Super Admin',
                    };
                    await userRef.set(superAdminData, { merge: true });
                    userDoc = await userRef.get();
                    userData = userDoc.data();
                }
    
                // Hardcoded Director check. If a user logs in with this email, they are a Director.
                else if (user.email === 'admin@gmail.com' && (!userData || userData.tag !== 'Director')) {
                    const directorData = {
                        name: userData?.name || 'Campus Director',
                        email: user.email,
                        department: userData?.department || 'Administration',
                        tag: 'Director',
                    };
                    
                    await userRef.set(directorData, { merge: true });
    
                    // After updating, refetch the document to ensure we have the latest data for the session.
                    userDoc = await userRef.get();
                    userData = userDoc.data();
                }
    
                if (userDoc.exists) {
                    const userDataWithId = { id: user.uid, ...userData } as User;
                    if (userDataWithId.isFrozen) {
                        alert("Your account has been suspended. Please contact the administration.");
                        auth.signOut();
                        setCurrentUser(null);
                    } else {
                        setCurrentUser(userDataWithId);
                    }
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

    const handleEnsureDirectorSystemChats = async (director: User, allUsers: { [key: string]: User }) => {
        if (director.tag !== 'Director' || !director.collegeId) return;

        const college = colleges.find(c => c.id === director.collegeId);
        if (!college || !college.departments || college.departments.length === 0) {
            return; // Can't create chats if departments aren't set up.
        }
        const departmentOptions = college.departments;

        const allUsersList = Object.values(allUsers);
        const allHods = allUsersList.filter(u => u.tag === 'HOD/Dean');
        const allTeachersAndHods = allUsersList.filter(u => u.tag === 'Teacher' || u.tag === 'HOD/Dean');

        const systemGroups = [
            {
                id: 'director-hods-group',
                name: 'HOD Council',
                participants: [director.id, ...allHods.map(h => h.id)]
            },
            {
                id: 'director-all-faculty-group',
                name: 'All Faculty',
                participants: [director.id, ...allTeachersAndHods.map(t => t.id)]
            },
            ...departmentOptions.map(dept => {
                const deptTeachers = allTeachersAndHods.filter(t => t.department === dept);
                return {
                    id: `director-${dept.toLowerCase().replace(/[^a-z0-9]/g, '-')}-faculty-group`,
                    name: `${dept} Faculty`,
                    participants: [director.id, ...deptTeachers.map(t => t.id)]
                }
            })
        ];

        for (const group of systemGroups) {
            const groupRef = db.collection('conversations').doc(group.id);
            const uniqueParticipants = Array.from(new Set(group.participants));

            try {
                const doc = await groupRef.get();
                if (!doc.exists) {
                    await groupRef.set({
                        name: group.name,
                        participantIds: uniqueParticipants,
                        messages: [],
                        isGroupChat: true,
                        creatorId: 'system',
                        collegeId: director.collegeId,
                    });
                } else {
                    const existingData = doc.data() as Conversation;
                    const existingParticipants = new Set(existingData.participantIds);
                    const newParticipants = new Set(uniqueParticipants);
                    if (existingParticipants.size !== newParticipants.size || !uniqueParticipants.every(id => existingParticipants.has(id))) {
                        await groupRef.update({
                            participantIds: uniqueParticipants
                        });
                    }
                }
            } catch (error) {
                console.error(`Error ensuring system chat for ${group.name}:`, error);
            }
        }
    };


    useEffect(() => {
        if (!currentUser) {
            setUsers({});
            setPosts([]);
            setStories([]);
            setGroups([]);
            setConversations([]);
            setCourses([]);
            setNotices([]);
            setDepartmentChats([]);
            // Do not clear colleges for signup page
            return;
        };

        // Fetch colleges for all users, as it's needed for context (e.g., signup)
        const unsubColleges = db.collection('colleges').onSnapshot(snapshot => {
            const collegeData: College[] = [];
            snapshot.forEach(doc => {
                collegeData.push({ id: doc.id, ...doc.data() } as College);
            });
            setColleges(collegeData);
        });

        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const isSuperAdmin = currentUser.tag === 'Super Admin';
        const collegeId = currentUser.collegeId;

        const createScopedQuery = (collectionName: string) => {
            let query: any = db.collection(collectionName);
            if (!isSuperAdmin && collegeId) {
                query = query.where('collegeId', '==', collegeId);
            }
            return query;
        };

        const unsubscribers = [
            createScopedQuery('users').onSnapshot(snapshot => {
                const newUsers : { [key: string]: User } = {};
                snapshot.forEach(doc => {
                    newUsers[doc.id] = { id: doc.id, ...doc.data() } as User;
                });
                setUsers(newUsers);

                if (currentUser?.tag === 'Director' && Object.keys(newUsers).length > 0 && colleges.length > 0) {
                    handleEnsureDirectorSystemChats(currentUser, newUsers);
                }
            }),
            createScopedQuery('posts').onSnapshot(snapshot => {
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
                    // FIX: Explicitly specify the return type of the sort function to resolve a potential type inference issue.
                    return Array.from(postsMap.values()).sort((a: Post, b: Post): number => b.timestamp - a.timestamp);
                });
            }),
            createScopedQuery('stories')
                .onSnapshot(snapshot => {
                    // For stories, which are temporary and less frequently updated, a full replace is simpler and acceptable.
                    const storiesData: Story[] = [];
                    snapshot.forEach(doc => {
                        const story = { id: doc.id, ...doc.data() } as Story;
                        // Client-side filtering to avoid composite index requirement.
                        if (story.timestamp > twentyFourHoursAgo) {
                            storiesData.push(story);
                        }
                    });
                    storiesData.sort((a, b) => b.timestamp - a.timestamp);
                    setStories(storiesData);
            }),
            createScopedQuery('groups').onSnapshot(snapshot => {
                 setGroups(prevGroups => {
                    const groupsMap = new Map(prevGroups.map(g => [g.id, g]));
                    for (const change of snapshot.docChanges()) {
                        // FIX: Argument of type 'unknown' is not assignable to parameter of type 'string'.
                        // Refactored to handle 'removed' case separately, which is cleaner and may help with type inference.
                        if (change.type === "removed") {
                            // FIX: Cast change.doc.id to string to fix 'unknown' type error.
                            groupsMap.delete(change.doc.id as string);
                        } else { // added or modified
                            // FIX: Cast change.doc.id to string to satisfy the Group type.
                            const group = { ...change.doc.data(), id: change.doc.id as string } as Group;
                            groupsMap.set(group.id, group);
                        }
                    }
                    // Sort by name for a consistent order in lists
                    // FIX: Explicitly type sort parameters and return type to resolve 'unknown' type error.
                    return Array.from(groupsMap.values()).sort((a: Group, b: Group): number => a.name.localeCompare(b.name));
                });
            }),
            (() => {
                let convoQuery: any = db.collection('conversations').where('participantIds', 'array-contains', currentUser.id);
                if (!isSuperAdmin && collegeId) {
                     convoQuery = convoQuery.where('collegeId', '==', collegeId);
                }
                return convoQuery.onSnapshot(snapshot => {
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
                });
            })(),
            createScopedQuery('notices').onSnapshot(snapshot => {
                const noticesData: Notice[] = [];
                snapshot.forEach(doc => {
                    noticesData.push({ id: doc.id, ...doc.data() } as Notice);
                });
                noticesData.sort((a, b) => b.timestamp - a.timestamp);
                setNotices(noticesData);
            }),
            createScopedQuery('courses').onSnapshot(snapshot => {
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
            createScopedQuery('departmentChats').onSnapshot(snapshot => {
                const chatData: DepartmentChat[] = [];
                snapshot.forEach(doc => {
                    chatData.push({ id: doc.id, ...doc.data() } as DepartmentChat);
                });
                setDepartmentChats(chatData);
            }),
             unsubColleges
        ];

        return () => unsubscribers.forEach(unsub => unsub());

    }, [currentUser]);
    
    // Fetch colleges for signup page when no user is logged in
    useEffect(() => {
        if (!currentUser) {
            const unsub = db.collection('colleges').onSnapshot(snapshot => {
                const collegeData: College[] = [];
                snapshot.forEach(doc => {
                    collegeData.push({ id: doc.id, ...doc.data() } as College);
                });
                setColleges(collegeData);
            });
            return () => unsub();
        }
    }, [currentUser]);


    // This effect synchronizes the `currentUser` state with the real-time `users` data map.
    // This is crucial for features like the "Follow" button to update correctly in the UI
    // after the action is performed.
    useEffect(() => {
        if (currentUser && users[currentUser.id]) {
            const latestUserData = users[currentUser.id];
            // Simple stringify check to prevent infinite re-render loops if the user object has not changed.
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
        mediaDataUrls?: string[] | null;
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
            const newPost: Partial<Omit<Post, 'id'>> = {
                authorId: currentUser.id,
                collegeId: currentUser.collegeId,
                content: postDetails.content,
                timestamp: Date.now(),
                reactions: {},
                comments: [],
                isEvent: !!postDetails.eventDetails,
                isConfession: !!postDetails.isConfession,
                isOpportunity: !!postDetails.isOpportunity,
            };

            if (postDetails.mediaDataUrls && postDetails.mediaDataUrls.length > 0 && postDetails.mediaType) {
                newPost.mediaUrls = postDetails.mediaDataUrls;
                newPost.mediaType = postDetails.mediaType;
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
            collegeId: currentUser.collegeId,
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
            const isDirector = currentUser.tag === 'Director';
    
            if (!isAuthor && !isGroupCreator && !isDirector) {
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

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!currentUser) return;
        const postRef = db.collection('posts').doc(postId);
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(postRef);
                if (!doc.exists) throw "Post does not exist!";
                
                const postData = doc.data() as Post;
                const commentToDelete = postData.comments.find(c => c.id === commentId);
                if (!commentToDelete) return;
                
                const isCommentAuthor = commentToDelete.authorId === currentUser.id;
                const isPostAuthor = postData.authorId === currentUser.id;
                const isDirector = currentUser.tag === 'Director';
    
                if (!isCommentAuthor && !isPostAuthor && !isDirector) {
                    alert("You don't have permission to delete this comment.");
                    return;
                }
    
                const updatedComments = postData.comments.filter(c => c.id !== commentId);
                transaction.update(postRef, { comments: updatedComments });
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Could not delete comment.");
        }
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
            const isDirector = currentUser.tag === 'Director';
    
            // Admins can delete any post.
            // Authors can delete their own posts, as long as it's NOT a confession.
            const canDelete = isDirector || (isAuthor && !postToDelete.isConfession);
    
            if (!canDelete) {
                console.error(`User ${currentUser.id} is not authorized to delete post ${postId}.`);
                alert("You do not have permission to delete this post.");
                return;
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

    const handleDeleteMessagesForEveryone = async (conversationId: string, messageIds: string[]) => {
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

    const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
        if (!currentUser) return;
        const conversationRef = db.collection('conversations').doc(conversationId);
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(conversationRef);
                if (!doc.exists) {
                    throw "Document does not exist!";
                }
    
                const conversationData = doc.data() as Conversation;
                const messagesToDelete = new Set(messageIds);
    
                const updatedMessages = conversationData.messages.map(msg => {
                    if (messagesToDelete.has(msg.id)) {
                        const deletedFor = Array.from(new Set([...(msg.deletedFor || []), currentUser.id]));
                        return { ...msg, deletedFor };
                    }
                    return msg;
                });
    
                transaction.update(conversationRef, { messages: updatedMessages });
            });
        } catch (error) {
            console.error("Error deleting messages for self:", error);
            alert("Could not update message status.");
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
                originalMediaUrls: originalPost.mediaUrls,
                originalMediaType: originalPost.mediaType,
                originalIsEvent: originalPost.isEvent,
                originalEventDetails: originalPost.eventDetails,
                originalIsConfession: originalPost.isConfession,
            };

            const newPost: Partial<Omit<Post, 'id'>> = {
                authorId: currentUser.id,
                collegeId: currentUser.collegeId,
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
            !c.isGroupChat &&
            c.participantIds.length === 2 && 
            c.participantIds.includes(currentUser.id) && 
            c.participantIds.includes(otherUserId)
        );
    
        if (existingConvo) return existingConvo.id;
    
        const newConvo = {
            participantIds: [currentUser.id, otherUserId],
            collegeId: currentUser.collegeId,
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
            collegeId: currentUser.collegeId,
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
    
            const isCreator = groupData.creatorId === currentUser.id;
            const isDirector = currentUser.tag === 'Director';

            if (!isCreator && !isDirector) {
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
    
            const isCreator = groupData.creatorId === currentUser.id;
            const isDirector = currentUser.tag === 'Director';
    
            if (!isCreator && !isDirector) {
                alert("You are not authorized to remove members from this group.");
                return;
            }
            
            if (groupData.creatorId === memberId) {
                alert("You cannot remove yourself as the creator or another admin cannot remove you.");
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
        if (group?.creatorId !== currentUser.id && currentUser.tag !== 'Director') {
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
        if (group?.creatorId !== currentUser.id && currentUser.tag !== 'Director') {
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

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const handleUpdateProfile = async (
        updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number; }, 
        avatarFile?: File | null
    ) => {
        if (!currentUser) return;
        try {
            const userRef = db.collection('users').doc(currentUser.id);
            
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
                const dataUrl = await fileToBase64(avatarFile);
                dataToUpdate.avatarUrl = dataUrl;
            }
            await userRef.update(dataToUpdate);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Could not update profile.");
        }
    };

    const handleCreateUser = async (newUserData: Omit<User, 'id'>, password?: string): Promise<void> => {
        if (!currentUser || (currentUser.tag !== 'HOD/Dean' && currentUser.tag !== 'Director')) {
            const errorMsg = "You don't have permission to create users.";
            alert(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }
    
        // New flow for Director creating HOD with password
        if (currentUser.tag === 'Director' && (newUserData.tag === 'HOD/Dean' || newUserData.tag === 'Teacher') && password) {
            try {
                const secondaryAppName = 'secondary-auth-app';
                let secondaryApp;
                const existingApp = firebase.apps.find((app: any) => app.name === secondaryAppName);
                if (existingApp) {
                    secondaryApp = existingApp;
                } else {
                    const primaryConfig = firebase.app().options;
                    secondaryApp = firebase.initializeApp(primaryConfig, secondaryAppName);
                }
    
                const secondaryAuth = secondaryApp.auth();
                const userCredential = await secondaryAuth.createUserWithEmailAndPassword(newUserData.email, password);
                const newUser = userCredential.user;
    
                if (newUser) {
                    const userDataWithCollege = {
                        ...newUserData,
                        collegeId: currentUser.collegeId,
                    };
                    await db.collection('users').doc(newUser.uid).set(userDataWithCollege);
                    
                    await secondaryAuth.signOut();
                    // Success is handled by the modal, so no alert here.
                    return Promise.resolve();
                } else {
                    throw new Error('Failed to create user authentication account.');
                }
            } catch (error: any) {
                console.error(`Error creating user with auth (${newUserData.tag}):`, error);
                alert(`Could not create user: ${error.message}`);
                // Propagate the error so the modal can handle it
                return Promise.reject(error);
            }
        } else {
            // Existing flow for other user creations (HOD creating student/teacher without auth)
            try {
                const userDataWithCollege = {
                    ...newUserData,
                    collegeId: currentUser.collegeId,
                }
                await db.collection('users').add(userDataWithCollege);
                alert(`User document for ${newUserData.name} created. An admin must create their Firebase login credentials for them to be able to log in.`);
                return Promise.resolve();
            } catch (error) {
                console.error("Error creating user document:", error);
                alert("Could not create user document.");
                return Promise.reject(error);
            }
        }
    };

    const handleCreateUsersBatch = async (usersData: Omit<User, 'id'>[]): Promise<{ successCount: number; errors: { email: string; reason: string }[] }> => {
        if (!currentUser) {
            throw new Error("Authentication error.");
        }
        const errors: { email: string; reason: string }[] = [];
        const emailsToCreate = usersData.map(u => u.email);
        const existingEmails = new Set<string>();
    
        // Chunk emails to check against Firestore 'in' query limit (30)
        for (let i = 0; i < emailsToCreate.length; i += 30) {
            const chunk = emailsToCreate.slice(i, i + 30);
            const querySnapshot = await db.collection('users').where('email', 'in', chunk).get();
            querySnapshot.forEach((doc: any) => {
                existingEmails.add(doc.data().email);
            });
        }
    
        const validUsers: Omit<User, 'id'>[] = [];
        usersData.forEach(user => {
            if (existingEmails.has(user.email)) {
                errors.push({ email: user.email, reason: 'Email already exists.' });
            } else {
                validUsers.push({
                    ...user,
                    collegeId: currentUser.collegeId, // Ensure collegeId is set
                });
            }
        });
    
        if (validUsers.length > 0) {
            const batch = db.batch();
            validUsers.forEach(user => {
                const docRef = db.collection('users').doc(); // Auto-generate ID
                batch.set(docRef, user);
            });
            await batch.commit();
        }
    
        return { successCount: validUsers.length, errors };
    };


    // --- ACADEMICS HANDLERS (Firestore Persistence) ---
    const handleCreateCourse = async (newCourseData: Omit<Course, 'id' | 'facultyId'>) => {
        if (!currentUser) return;
        const newCourse: Omit<Course, 'id'> = {
            ...newCourseData,
            collegeId: currentUser.collegeId,
            facultyId: currentUser.id,
            students: [],
            pendingStudents: [],
            notes: [],
            assignments: [],
            attendanceRecords: [],
            messages: [],
            personalNotes: {},
            feedback: [], // Initialize feedback
        };
        await db.collection('courses').add(newCourse);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!currentUser) return;
    
        const courseToDelete = courses.find(c => c.id === courseId);
        if (!courseToDelete) {
            alert("Course not found.");
            return;
        }
    
        const canDelete = currentUser.tag === 'Director' || courseToDelete.facultyId === currentUser.id;
    
        if (!canDelete) {
            alert("You don't have permission to delete this course.");
            return;
        }
    
        try {
            await db.collection('courses').doc(courseId).delete();
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Could not delete the course.");
        }
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

    const handleSendDepartmentMessage = async (department: string, channel: string, text: string) => {
        if (!currentUser || !currentUser.collegeId) return;

        const chatQuery = db.collection('departmentChats')
            .where('collegeId', '==', currentUser.collegeId)
            .where('department', '==', department)
            .where('channel', '==', channel);

        const newMessage: Message = {
            id: `msg_dept_${Date.now()}`,
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
        };

        const querySnapshot = await chatQuery.get();
        if (querySnapshot.empty) {
            // Create new chat
            await db.collection('departmentChats').add({
                collegeId: currentUser.collegeId,
                department,
                channel,
                messages: [newMessage],
            });
        } else {
            // Update existing chat
            const docRef = querySnapshot.docs[0].ref;
            await docRef.update({
                messages: FieldValue.arrayUnion(newMessage)
            });
        }
    };

    const handleUpdateCoursePersonalNote = async (courseId: string, userId: string, content: string) => {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            [`personalNotes.${userId}`]: content
        });
    };

    const handleSaveFeedback = async (courseId: string, feedbackData: Omit<Feedback, 'studentId' | 'timestamp'>) => {
        if (!currentUser) return;
        const newFeedback: Feedback = {
            ...feedbackData,
            studentId: currentUser.id,
            timestamp: Date.now(),
        };
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
            feedback: FieldValue.arrayUnion(newFeedback)
        });
    };


    // --- NOTICE BOARD HANDLERS ---
    const handleCreateNotice = async (noticeData: Omit<Notice, 'id' | 'authorId' | 'timestamp'>) => {
        if (!currentUser || currentUser.tag === 'Student') return;
        const newNotice: Omit<Notice, 'id'> = {
            ...noticeData,
            authorId: currentUser.id,
            collegeId: currentUser.collegeId,
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

        if (notice.authorId === currentUser.id || currentUser.tag === 'Director') {
            await noticeRef.delete();
        } else {
            alert("You don't have permission to delete this notice.");
        }
    };


    // --- ADMIN & HOD HANDLERS ---
    const handleApproveTeacherRequest = async (teacherId: string) => {
        if (!currentUser || (currentUser.tag !== 'HOD/Dean' && currentUser.tag !== 'Director')) {
            alert("You don't have permission to approve users.");
            return;
        }
        try {
            await db.collection('users').doc(teacherId).update({ isApproved: true });
            alert("User approved successfully.");
        } catch (error) {
            console.error("Error approving user:", error);
            alert("Could not approve user.");
        }
    };
    
    const handleDeclineTeacherRequest = async (teacherId: string) => {
        if (!currentUser || (currentUser.tag !== 'HOD/Dean' && currentUser.tag !== 'Director')) {
            alert("You don't have permission to decline users.");
            return;
        }
        try {
            await db.collection('users').doc(teacherId).delete();
            alert("User request declined and removed.");
        } catch (error) {
            console.error("Error declining user request:", error);
            alert("Could not decline user request.");
        }
    };

    const handleApproveHodRequest = async (hodId: string) => {
        if (currentUser?.tag !== 'Director') {
            alert("You don't have permission to approve this role.");
            return;
        }
        try {
            await db.collection('users').doc(hodId).update({ isApproved: true });
            alert("HOD/Dean approved successfully.");
        } catch (error) {
            console.error("Error approving HOD/Dean:", error);
            alert("Could not approve HOD/Dean.");
        }
    };
    
    const handleDeclineHodRequest = async (hodId: string) => {
        if (currentUser?.tag !== 'Director') {
            alert("You don't have permission to decline this role.");
            return;
        }
        try {
            await db.collection('users').doc(hodId).delete();
            alert("HOD/Dean request declined and removed.");
        } catch (error) {
            console.error("Error declining HOD/Dean request:", error);
            alert("Could not decline HOD/Dean request.");
        }
    };

    const handleAdminDeleteUser = async (userId: string) => {
        if (currentUser?.tag !== 'Director') return;
        // Note: This is a simple deletion. In a real app, you might want to handle user's content (posts, etc.)
        // or implement a "soft delete" by flagging the user as deleted.
        try {
            await db.collection('users').doc(userId).delete();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Could not delete user.");
        }
    };
    
    const handleToggleFreezeUser = async (userId: string) => {
        if (currentUser?.tag !== 'Director') {
            alert("You don't have permission for this action.");
            return;
        }
        const userRef = db.collection('users').doc(userId);
        try {
            const doc = await userRef.get();
            if (!doc.exists) return;
            const userData = doc.data() as User;
            await userRef.update({ isFrozen: !userData.isFrozen });
        } catch (error) {
            console.error("Error toggling user freeze status:", error);
            alert("Could not update user status.");
        }
    };

    const handleAdminDeletePost = async (postId: string) => {
        if (currentUser?.tag !== 'Director') return;
        await db.collection('posts').doc(postId).delete().catch(error => {
            console.error(`Admin error deleting post ${postId}:`, error);
            alert("Could not delete the post.");
        });
    };

    const handleAdminDeleteGroup = async (groupId: string) => {
        if (currentUser?.tag !== 'Director') return;
        try {
            await db.collection('groups').doc(groupId).delete();
        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Could not delete the group.");
        }
    };

    const handleUpdateUserRole = async (userId: string, updateData: { tag: UserTag, department: string }) => {
        if (currentUser?.tag !== 'Director') {
            alert("You don't have permission for this action.");
            return;
        }
        try {
            await db.collection('users').doc(userId).update(updateData);
            alert("User role updated successfully.");
        } catch (error) {
            console.error("Error updating user role:", error);
            alert("Could not update user role.");
        }
    };

    const handleUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
        if (!currentUser || (currentUser.tag !== 'HOD/Dean' && currentUser.tag !== 'Director')) {
            alert("You don't have permission for this action.");
            return;
        }

        const course = courses.find(c => c.id === courseId);
        const newFaculty = users[newFacultyId];

        if (!course || !newFaculty) {
            alert("Invalid course or faculty selected.");
            return;
        }

        // HOD can only assign teachers within their own department
        if (currentUser.tag === 'HOD/Dean' && (course.department !== currentUser.department || newFaculty.department !== currentUser.department)) {
             alert("HODs can only assign faculty within their own department.");
             return;
        }
        
        try {
            await db.collection('courses').doc(courseId).update({
                facultyId: newFacultyId
            });
            alert("Course faculty updated successfully.");
        } catch (error) {
            console.error("Error updating course faculty:", error);
            alert("Could not update faculty.");
        }
    };

     // --- PERSONAL NOTES HANDLERS ---
     const handleCreatePersonalNote = async (title: string, content: string) => {
        if (!currentUser) return;
        const newNote: PersonalNote = {
            id: `note_${Date.now()}`,
            title,
            content,
            timestamp: Date.now(),
        };
        await db.collection('users').doc(currentUser.id).update({
            personalNotes: FieldValue.arrayUnion(newNote)
        });
    };

    const handleUpdatePersonalNoteApp = async (noteId: string, title: string, content: string) => {
        if (!currentUser || !currentUser.personalNotes) return;

        const updatedNotes = currentUser.personalNotes.map(n => {
            if (n.id === noteId) {
                return { ...n, title, content, timestamp: n.timestamp };
            }
            return n;
        });
        
        await db.collection('users').doc(currentUser.id).update({
            personalNotes: updatedNotes
        });
    };

    const handleDeletePersonalNote = async (noteId: string) => {
        if (!currentUser || !currentUser.personalNotes) return;
        
        const updatedNotes = currentUser.personalNotes.filter(n => n.id !== noteId);
        
        await db.collection('users').doc(currentUser.id).update({
            personalNotes: updatedNotes
        });
    };

    const handleCreateCollegeAdmin = async (collegeName: string, email: string, password: string) => {
        try {
            const secondaryAppName = 'secondary-auth-app';
            let secondaryApp;
            const existingApp = firebase.apps.find((app: any) => app.name === secondaryAppName);
            if (existingApp) {
                secondaryApp = existingApp;
            } else {
                const primaryConfig = firebase.app().options;
                secondaryApp = firebase.initializeApp(primaryConfig, secondaryAppName);
            }

            const secondaryAuth = secondaryApp.auth();
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
            const newUser = userCredential.user;

            if (newUser) {
                const collegeRef = await db.collection('colleges').add({
                    name: collegeName,
                    adminUids: [],
                });
                const collegeId = collegeRef.id;

                const adminData = {
                    name: `Director of ${collegeName}`,
                    email: email,
                    department: 'Administration',
                    tag: 'Director',
                    isApproved: true,
                    collegeId: collegeId,
                };
                await db.collection('users').doc(newUser.uid).set(adminData);
                await collegeRef.update({ adminUids: [newUser.uid] });
                
                await secondaryAuth.signOut();
                alert(`Successfully created college '${collegeName}' with admin user '${email}'.`);
            } else {
                throw new Error('Failed to create user account.');
            }
        } catch (error: any) {
            console.error("Error creating college admin:", error);
            alert(`Could not create college admin: ${error.message}`);
            throw error;
        }
    };

    const handleUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
        if (!currentUser || (currentUser.tag !== 'Director' && currentUser.tag !== 'Super Admin') ) {
            alert("You don't have permission for this action.");
            return;
        }
        if (currentUser.tag === 'Director' && currentUser.collegeId !== collegeId) {
            alert("You can only edit your own college's departments.");
            return;
        }

        try {
            await db.collection('colleges').doc(collegeId).update({ departments });
            alert("Departments updated successfully. The page will now reflect these changes.");
        } catch (error) {
            console.error("Error updating departments:", error);
            alert("Could not update departments.");
        }
    };


    if (loading) {
        return <div className="min-h-screen bg-background dark:bg-slate-900 flex items-center justify-center"><p className="text-foreground dark:text-slate-100">Loading...</p></div>;
    }

    const renderPage = () => {
        const [path, ...params] = currentPath.split('/').slice(1);
        const allUsersList = Object.values(users);
        const events = posts.filter(p => p.isEvent);

        if (!currentUser) {
            switch (path) {
                case 'login': return <LoginPage onNavigate={handleNavigate} />;
                case 'signup': return <SignupPage onNavigate={handleNavigate} colleges={colleges}/>;
                default: return <WelcomePage onNavigate={handleNavigate} />;
            }
        }
        
        const postCardProps = {
            onReaction: handleReaction,
            onAddComment: handleAddComment,
            onDeletePost: handleDeletePost,
            onDeleteComment: handleDeleteComment,
            onCreateOrOpenConversation: handleCreateOrOpenConversation,
            onSharePostAsMessage: handleSharePostAsMessage,
            onSharePost: handleSharePost,
            onToggleSavePost: handleToggleSavePost,
            groups,
        };
        
        switch (path) {
            case 'home': return <HomePage currentUser={currentUser} users={users} posts={posts} stories={stories} groups={groups} events={events} onNavigate={handleNavigate} onAddPost={handleAddPost} currentPath={currentPath} onAddStory={handleAddStory} onMarkStoryAsViewed={handleMarkStoryAsViewed} onDeleteStory={handleDeleteStory} onReplyToStory={handleReplyToStory} {...postCardProps} />;
            case 'profile': return <ProfilePage profileUserId={params[0]} currentUser={currentUser} users={users} posts={posts} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onAddAchievement={handleAddAchievement} onAddInterest={handleAddInterest} onUpdateProfile={handleUpdateProfile} colleges={colleges} {...postCardProps} />;
            case 'groups': 
                if (params[0]) {
                    const group = groups.find(g => g.id === params[0]);
                    // FIX: Removed duplicate `onDeleteComment` prop which was causing a type error. The prop is already included in `postCardProps`.
                    return group ? <GroupDetailPage group={group} currentUser={currentUser} users={users} posts={posts.filter(p => p.groupId === params[0])} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} onAddStory={handleAddStory} onJoinGroupRequest={handleJoinGroupRequest} onApproveJoinRequest={handleApproveJoinRequest} onDeclineJoinRequest={handleDeclineJoinRequest} onDeleteGroup={handleDeleteGroup} onRemoveGroupMember={handleRemoveGroupMember} onSendGroupMessage={handleSendGroupMessage} onToggleFollowGroup={handleToggleFollowGroup} {...postCardProps} /> : <div>Group not found</div>;
                }
                return <GroupsPage currentUser={currentUser} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onCreateGroup={handleCreateGroup} />;
            case 'events': return <EventsPage currentUser={currentUser} users={users} events={events} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} {...postCardProps} />;
            case 'opportunities': return <OpportunitiesPage currentUser={currentUser} users={users} posts={posts} onNavigate={handleNavigate} currentPath={currentPath} onAddPost={handleAddPost} postCardProps={postCardProps} />;
            case 'chat': return <ChatPage currentUser={currentUser} users={users} conversations={conversations} onSendMessage={handleSendMessage} onDeleteMessagesForEveryone={handleDeleteMessagesForEveryone} onDeleteMessagesForSelf={handleDeleteMessagesForSelf} onDeleteConversations={handleDeleteConversations} onCreateOrOpenConversation={handleCreateOrOpenConversation} onNavigate={handleNavigate} currentPath={currentPath} />;
            case 'search': return <SearchPage currentUser={currentUser} users={allUsersList} posts={posts} groups={groups} onNavigate={handleNavigate} currentPath={currentPath} {...postCardProps} />;
            case 'confessions':
                return <ConfessionsPage 
                    currentUser={currentUser}
                    users={users}
                    posts={posts.filter(p => p.isConfession)}
                    groups={groups}
                    onNavigate={handleNavigate}
                    onAddPost={handleAddPost}
                    currentPath={currentPath}
                    {...postCardProps}
                />;
            case 'personal-notes':
                return <PersonalNotesPage
                    currentUser={currentUser}
                    onNavigate={handleNavigate}
                    currentPath={currentPath}
                    onCreateNote={handleCreatePersonalNote}
                    onUpdateNote={handleUpdatePersonalNoteApp}
                    onDeleteNote={handleDeletePersonalNote}
                />;
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
                        onSaveFeedback={handleSaveFeedback}
                        onDeleteCourse={handleDeleteCourse}
                        onUpdateCourseFaculty={handleUpdateCourseFaculty}
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
                    onRequestToJoinCourse={handleRequestToJoinCourse}
                    departmentChats={departmentChats}
                    onSendDepartmentMessage={handleSendDepartmentMessage as any}
                    onCreateUser={handleCreateUser}
                    onApproveTeacherRequest={handleApproveTeacherRequest}
                    onDeclineTeacherRequest={handleDeclineTeacherRequest}
                    colleges={colleges}
                />;
            case 'director':
                if (currentUser.tag !== 'Director') {
                    handleNavigate('#/home');
                    return null;
                }
                return <DirectorPage 
                            currentUser={currentUser} 
                            allUsers={allUsersList} 
                            allPosts={posts} 
                            allGroups={groups}
                            allCourses={courses}
                            usersMap={users}
                            onNavigate={handleNavigate} 
                            currentPath={currentPath}
                            onDeleteUser={handleAdminDeleteUser}
                            onDeletePost={handleAdminDeletePost}
                            onDeleteGroup={handleAdminDeleteGroup}
                            onApproveHodRequest={handleApproveHodRequest}
                            onDeclineHodRequest={handleDeclineHodRequest}
                            onApproveTeacherRequest={handleApproveTeacherRequest}
                            onDeclineTeacherRequest={handleDeclineTeacherRequest}
                            onToggleFreezeUser={handleToggleFreezeUser}
                            onUpdateUserRole={handleUpdateUserRole}
                            notices={notices}
                            onCreateNotice={handleCreateNotice}
                            onDeleteNotice={handleDeleteNotice}
                            onCreateCourse={handleCreateCourse}
                            onCreateUser={handleCreateUser}
                            onDeleteCourse={handleDeleteCourse}
                            colleges={colleges}
                            onUpdateCollegeDepartments={handleUpdateCollegeDepartments}
                            postCardProps={{...postCardProps, onDeletePost: handleAdminDeletePost, onDeleteComment: handleDeleteComment}}
                        />;
            case 'hod':
                if (currentUser.tag !== 'HOD/Dean') {
                    handleNavigate('#/home');
                    return null;
                }
                return <HodPage
                    currentUser={currentUser}
                    allUsers={allUsersList}
                    users={users}
                    courses={courses}
                    notices={notices}
                    departmentChats={departmentChats}
                    colleges={colleges}
                    onNavigate={handleNavigate}
                    currentPath={currentPath}
                    onCreateCourse={handleCreateCourse}
                    onCreateUser={handleCreateUser}
                    onCreateUsersBatch={handleCreateUsersBatch}
                    onApproveTeacherRequest={handleApproveTeacherRequest}
                    onDeclineTeacherRequest={handleDeclineTeacherRequest}
                    onCreateNotice={handleCreateNotice}
                    onDeleteNotice={handleDeleteNotice}
                    onSendDepartmentMessage={handleSendDepartmentMessage as any}
                />;
            case 'superadmin':
                if (currentUser.tag !== 'Super Admin') {
                    handleNavigate('#/home');
                    return null;
                }
                return <SuperAdminPage 
                            currentUser={currentUser}
                            currentPath={currentPath}
                            onNavigate={handleNavigate}
                            colleges={colleges}
                            users={users}
                            onCreateCollegeAdmin={handleCreateCollegeAdmin}
                        />;
            default:
                handleNavigate('#/home');
                return null;
        }
    };
    
    return <>{renderPage()}</>;
};

export default App;