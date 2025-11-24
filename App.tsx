
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
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
import EventDetailPage from './pages/EventDetailPage'; 
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage';
import ConfessionsPage from './pages/ConfessionsPage';
import DirectorPage from './pages/DirectorPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AcademicsPage from './pages/AcademicsPage';
import PersonalNotesPage from './pages/PersonalNotesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import HodPage from './pages/HodPage';

declare const firebase: any;

declare global {
  interface String {
    hashCode(): number;
  }
}

// Helper to remove undefined keys from an object
const cleanData = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            cleaned[key] = data[key];
        }
    });
    return cleaned;
};

// Helper to convert Data URL to Blob
const dataURLtoBlob = (dataurl: string) => {
    try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    } catch (e) {
        console.error("Error converting data URL to blob", e);
        return null;
    }
};

// Helper: Compress Image on Client Side
const compressImage = (source: File | string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("No context"));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const result = canvas.toDataURL('image/jpeg', quality);
            resolve(result);
        };
        img.onerror = (e) => reject(e);
        
        if (typeof source === 'string') {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
};

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
    
    // Refs for state access in callbacks without dependency loop
    const postsRef = useRef(posts);
    postsRef.current = posts;

    useEffect(() => {
        const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    // Request notification permission on load
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                let { display } = await LocalNotifications.checkPermissions();
                if (display !== 'granted') {
                    ({ display } = await LocalNotifications.requestPermissions());
                }
            } catch (e) {
                console.error('Capacitor LocalNotifications API not available.', e);
            }
        };
        requestPermissions();
    }, []);

    useEffect(() => {
        String.prototype.hashCode = function() {
            var hash = 0, i, chr;
            if (this.length === 0) return hash;
            for (i = 0; i < this.length; i++) {
                chr   = this.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0;
            }
            return Math.abs(hash);
        };
    }, []);

    // Auth & Data Fetching
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const userDocRef = db.collection('users').doc(user.uid);
                const userUnsubscribe = userDocRef.onSnapshot(async (doc) => {
                    if (doc.exists) {
                        const userData = doc.data() as Omit<User, 'id'>;
                        const userWithId: User = { ...userData, id: doc.id };
                        
                        if (userWithId.isFrozen) {
                            alert("Your account has been suspended.");
                            auth.signOut();
                            return;
                        }
                        setCurrentUser(userWithId);
                        setLoading(false);
                    } else {
                        auth.signOut();
                        setLoading(false);
                    }
                });
                return () => userUnsubscribe();
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setUsers({}); setColleges([]); setPosts([]); setStories([]); setGroups([]); setConversations([]); setCourses([]); setNotices([]);
            return;
        };

        if (currentUser.tag === 'Super Admin') {
            const usersUnsub = db.collection('users').onSnapshot(snap => {
                const d = {}; snap.forEach(doc => d[doc.id] = { id: doc.id, ...doc.data() }); setUsers(d);
            });
            const collegesUnsub = db.collection('colleges').onSnapshot(snap => setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
            return () => { usersUnsub(); collegesUnsub(); };
        }

        if (!currentUser.collegeId) return;

        const usersUnsub = db.collection('users').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => {
            const d = {}; snap.forEach(doc => d[doc.id] = { id: doc.id, ...doc.data() }); setUsers(d);
        });
        const collegesUnsub = db.collection('colleges').onSnapshot(snap => setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const postsUnsub = db.collection('posts').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp)));
        const storiesUnsub = db.collection('stories').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.timestamp >= Date.now() - 86400000).sort((a,b) => b.timestamp - a.timestamp)));
        const groupsUnsub = db.collection('groups').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const convosUnsub = db.collection('conversations').where('collegeId', '==', currentUser.collegeId).where('participantIds', 'array-contains', currentUser.id).onSnapshot(snap => setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const coursesUnsub = db.collection('courses').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const noticesUnsub = db.collection('notices').where('collegeId', '==', currentUser.collegeId).onSnapshot(snap => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp)));
        const department = currentUser.department;
        let deptChatsUnsub = () => {};
        if (department) {
             deptChatsUnsub = db.collection('departmentChats').where('collegeId', '==', currentUser.collegeId).where('department', '==', department).onSnapshot(snap => setDepartmentChats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        }

        return () => { usersUnsub(); collegesUnsub(); postsUnsub(); storiesUnsub(); groupsUnsub(); convosUnsub(); coursesUnsub(); noticesUnsub(); deptChatsUnsub(); };
    }, [currentUser]);

    // Handlers
    const handleUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
        await db.collection('colleges').doc(collegeId).update({ departments });
    };
    const handleEditCollegeDepartment = async (collegeId: string, oldName: string, newName: string) => {
        const collegeRef = db.collection('colleges').doc(collegeId);
        const doc = await collegeRef.get();
        if (doc.exists) {
            const departments = doc.data()?.departments || [];
            const index = departments.indexOf(oldName);
            if (index > -1) {
                departments[index] = newName;
                await collegeRef.update({ departments });
            }
        }
    };
    const handleDeleteCollegeDepartment = async (collegeId: string, deptName: string) => {
         await db.collection('colleges').doc(collegeId).update({
            departments: FieldValue.arrayRemove(deptName)
        });
    };

    const handleUpdateCollegeClasses = async (collegeId: string, department: string, classes: { [year: number]: string[] }) => {
        await db.collection('colleges').doc(collegeId).update({ [`classes.${department}`]: classes });
    };
    
    const handleAddPost = async (postDetails: any) => {
        if (!currentUser) return;
        
        try {
            const { content, mediaDataUrls, mediaType, eventDetails, groupId, isConfession, confessionMood, isOpportunity, opportunityDetails, isProject, projectDetails, isRoadmap, roadmapDetails } = postDetails;
            let uploadedMediaUrls: string[] = [];
            
            if (mediaDataUrls && mediaDataUrls.length > 0) {
                const count = mediaDataUrls.length;
                const fallbackMaxWidth = count > 2 ? 400 : 600;
                const fallbackQuality = count > 2 ? 0.5 : 0.6;

                const uploadPromises = mediaDataUrls.map(async (dataUrl: string) => {
                    try {
                        const compressedDataUrl = await compressImage(dataUrl, 1024, 0.8);
                        const blob = dataURLtoBlob(compressedDataUrl);
                        if (!blob) throw new Error("Failed to create blob");
                        const filename = `posts/${Date.now()}-${Math.random().toString(36).substring(7)}`;
                        const storageRef = storage.ref().child(filename);
                        const snapshot = await storageRef.put(blob);
                        return await snapshot.ref.getDownloadURL();
                    } catch (storageError) {
                        console.warn("Storage upload failed, falling back to Firestore Base64.", storageError);
                        return await compressImage(dataUrl, fallbackMaxWidth, fallbackQuality);
                    }
                });
                uploadedMediaUrls = (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
            }
            
            const postData: any = {
                authorId: currentUser.id, 
                collegeId: currentUser.collegeId, 
                content: content || '', 
                mediaUrls: uploadedMediaUrls, 
                timestamp: Date.now(), 
                reactions: {}, 
                comments: [], 
                isEvent: !!eventDetails, 
                isConfession: !!isConfession, 
                isOpportunity: !!isOpportunity, 
                isProject: !!isProject,
                isRoadmap: !!isRoadmap
            };

            if (uploadedMediaUrls.length > 0) postData.mediaType = 'image'; 
            else if (mediaType) postData.mediaType = mediaType;
            
            if (groupId) postData.groupId = groupId;
            if (eventDetails) postData.eventDetails = { ...eventDetails, attendees: [] };
            if (confessionMood) postData.confessionMood = confessionMood;
            if (opportunityDetails) postData.opportunityDetails = opportunityDetails;
            if (isProject && projectDetails) postData.projectDetails = projectDetails;
            if (isRoadmap && roadmapDetails) postData.roadmapDetails = roadmapDetails;

            await db.collection('posts').add(postData);

        } catch (error) {
            console.error("Error adding post:", error);
            alert("Failed to post. Images might be too large or connection is unstable.");
        }
    };

    const handleReaction = useCallback(async (postId: string, reaction: ReactionType) => {
        if (!currentUser) return;

        // Use ref to access latest posts without re-creating function
        const currentPosts = postsRef.current;
        const post = currentPosts.find(p => p.id === postId);
        if (!post) return;

        const reactions = post.reactions || {};
        let existingType: string | undefined;
        
        Object.keys(reactions).forEach(k => {
            if (reactions[k]?.includes(currentUser.id)) {
                existingType = k;
            }
        });

        // Optimistic Update
        setPosts(prevPosts => {
            return prevPosts.map(p => {
                if (p.id !== postId) return p;
                
                const newReactions: any = { ...p.reactions };
                Object.keys(newReactions).forEach(k => {
                    newReactions[k] = [...(newReactions[k] || [])];
                });

                if (existingType) {
                    newReactions[existingType] = newReactions[existingType].filter((id: string) => id !== currentUser.id);
                    if (newReactions[existingType].length === 0) delete newReactions[existingType];
                }

                if (existingType !== reaction) {
                    if (!newReactions[reaction]) newReactions[reaction] = [];
                    newReactions[reaction].push(currentUser.id);
                }

                return { ...p, reactions: newReactions };
            });
        });

        // DB Update
        const updateData: any = {};
        if (existingType) {
            updateData[`reactions.${existingType}`] = FieldValue.arrayRemove(currentUser.id);
        }
        if (existingType !== reaction) {
            updateData[`reactions.${reaction}`] = FieldValue.arrayUnion(currentUser.id);
        }

        if (Object.keys(updateData).length > 0) {
            try {
                await db.collection('posts').doc(postId).update(updateData);
            } catch (error) {
                console.error("Reaction update failed:", error);
            }
        }
    }, [currentUser]);

    const handleAddComment = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        await db.collection('posts').doc(postId).update({ comments: FieldValue.arrayUnion({ id: Date.now().toString(), authorId: currentUser.id, text, timestamp: Date.now() }) });
    }, [currentUser]);

    const handleDeleteComment = useCallback(async (postId: string, commentId: string) => {
         const postRef = db.collection('posts').doc(postId);
         const doc = await postRef.get();
         if(doc.exists) {
             const comments = doc.data().comments || [];
             await postRef.update({ comments: comments.filter(c => c.id !== commentId) });
         }
    }, []);

    const handleDeletePost = useCallback(async (postId: string) => { await db.collection('posts').doc(postId).delete(); }, []);
    
    const handleToggleSavePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const ref = db.collection('users').doc(currentUser.id);
        const isSaved = currentUser.savedPosts?.includes(postId);
        await ref.update({ savedPosts: isSaved ? FieldValue.arrayRemove(postId) : FieldValue.arrayUnion(postId) });
    }, [currentUser]);

    const handleSharePost = useCallback(async (originalPost: Post, commentary: string, shareTarget: any) => {
        if (!currentUser) return;
        const sharedPostInfo = originalPost.sharedPost || { originalId: originalPost.id, originalAuthorId: originalPost.authorId, originalTimestamp: originalPost.timestamp, originalContent: originalPost.content, originalMediaUrls: originalPost.mediaUrls, originalMediaType: originalPost.mediaType, originalIsEvent: originalPost.isEvent, originalEventDetails: originalPost.eventDetails, originalIsConfession: originalPost.isConfession };
        const rawData = { authorId: currentUser.id, collegeId: currentUser.collegeId, content: commentary, timestamp: Date.now(), reactions: {}, comments: [], groupId: shareTarget.type === 'group' ? shareTarget.id : undefined, sharedPost: sharedPostInfo };
        await db.collection('posts').add(cleanData(rawData));
    }, [currentUser]);
    
    const handleCreateOrOpenConversation = useCallback(async (otherUserId: string) => {
        if (!currentUser) return '';
        // Check current state first
        const existing = conversations.find(c => !c.isGroupChat && c.participantIds.includes(currentUser.id) && c.participantIds.includes(otherUserId));
        if (existing) return existing.id;
        
        // Double check DB to avoid race condition or stale state
        const q = await db.collection('conversations').where('participantIds', 'array-contains', currentUser.id).get();
        const dbExisting = q.docs.find(d => {
            const data = d.data();
            return !data.isGroupChat && data.participantIds.includes(otherUserId);
        });
        
        if (dbExisting) return dbExisting.id;

        const ref = await db.collection('conversations').add({ participantIds: [currentUser.id, otherUserId], collegeId: currentUser.collegeId, messages: [], isGroupChat: false });
        return ref.id;
    }, [currentUser, conversations]);

    const handleSendMessage = useCallback(async (conversationId: string, text: string) => {
        if (!currentUser) return;
        await db.collection('conversations').doc(conversationId).update({ messages: FieldValue.arrayUnion({ id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now() }) });
    }, [currentUser]);

    const handleSharePostAsMessage = useCallback(async (conversationId: string, authorName: string, postContent: string) => {
        await handleSendMessage(conversationId, `Shared a post by ${authorName}:\n"${postContent}"`);
    }, [handleSendMessage]);

    const handleDeleteMessagesForEveryone = async (conversationId: string, messageIds: string[]) => {
         const ref = db.collection('conversations').doc(conversationId);
         const doc = await ref.get();
         if(doc.exists) {
             const msgs = doc.data().messages || [];
             await ref.update({ messages: msgs.filter(m => !messageIds.includes(m.id)) });
         }
    };
    const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
         const ref = db.collection('conversations').doc(conversationId);
         const doc = await ref.get();
         if(doc.exists) {
             const msgs = doc.data().messages.map(m => messageIds.includes(m.id) ? { ...m, deletedFor: [...(m.deletedFor||[]), currentUser.id] } : m);
             await ref.update({ messages: msgs });
         }
    };
    const handleDeleteConversations = async (ids: string[]) => { ids.forEach(id => db.collection('conversations').doc(id).delete()); };

    const handleCreateGroup = async (data: any) => {
        const rawData = { ...data, collegeId: currentUser.collegeId, creatorId: currentUser.id, memberIds: [currentUser.id], pendingMemberIds: [], messages: [], followers: [] };
        await db.collection('groups').add(cleanData(rawData));
    };
    const handleUpdateGroup = async (groupId: string, data: any) => {
        await db.collection('groups').doc(groupId).update(cleanData(data));
    };
    const handleDeleteGroup = async (groupId: string) => { await db.collection('groups').doc(groupId).delete(); };
    const handleJoinGroupRequest = async (groupId: string) => { await db.collection('groups').doc(groupId).update({ pendingMemberIds: FieldValue.arrayUnion(currentUser.id) }); };
    const handleApproveJoinRequest = async (groupId: string, userId: string) => { await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayUnion(userId), pendingMemberIds: FieldValue.arrayRemove(userId) }); };
    const handleDeclineJoinRequest = async (groupId: string, userId: string) => { await db.collection('groups').doc(groupId).update({ pendingMemberIds: FieldValue.arrayRemove(userId) }); };
    const handleSendGroupMessage = async (groupId: string, text: string) => { await db.collection('groups').doc(groupId).update({ messages: FieldValue.arrayUnion({ id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now() }) }); };
    const handleRemoveGroupMember = async (groupId: string, memberId: string) => { await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayRemove(memberId) }); };
    const handleToggleFollowGroup = async (groupId: string) => {
        const isFollowing = currentUser.followingGroups?.includes(groupId);
        await db.collection('users').doc(currentUser.id).update({ followingGroups: isFollowing ? FieldValue.arrayRemove(groupId) : FieldValue.arrayUnion(groupId) });
        await db.collection('groups').doc(groupId).update({ followers: isFollowing ? FieldValue.arrayRemove(currentUser.id) : FieldValue.arrayUnion(currentUser.id) });
    };

    const handleAddAchievement = async (ach: Achievement) => { await db.collection('users').doc(currentUser.id).update({ achievements: FieldValue.arrayUnion(ach) }); };
    const handleAddInterest = async (int: string) => { await db.collection('users').doc(currentUser.id).update({ interests: FieldValue.arrayUnion(int) }); };
    
    const handleUpdateProfile = async (data: any, file?: File) => {
        if (file) {
            try {
                const compressedDataUrl = await compressImage(file, 300, 0.6);
                try {
                    const blob = dataURLtoBlob(compressedDataUrl);
                    if(blob) {
                        const snap = await storage.ref().child(`avatars/${currentUser.id}`).put(blob);
                        data.avatarUrl = await snap.ref.getDownloadURL();
                    } else { throw new Error("Blob conversion failed"); }
                } catch (storageErr) {
                    console.warn("Avatar upload failed, utilizing fallback storage.", storageErr);
                    data.avatarUrl = compressedDataUrl;
                }
            } catch (e) {
                console.error("Error processing profile image", e);
            }
        }
        await db.collection('users').doc(currentUser.id).update(cleanData(data));
    };
    
    const handleAddStory = async (data: any) => {
        const rawData = { ...data, authorId: currentUser.id, collegeId: currentUser.collegeId, timestamp: Date.now(), viewedBy: [] };
        await db.collection('stories').add(cleanData(rawData));
    };
    const handleMarkStoryAsViewed = async (id: string) => { await db.collection('stories').doc(id).update({ viewedBy: FieldValue.arrayUnion(currentUser.id) }); };
    const handleDeleteStory = async (id: string) => { await db.collection('stories').doc(id).delete(); };
    const handleReplyToStory = async (authorId: string, text: string) => {
        const cid = await handleCreateOrOpenConversation(authorId);
        await handleSendMessage(cid, text);
    };

    const handleCreateCourse = async (data: any) => {
        const rawData = { ...data, facultyId: currentUser.id, collegeId: currentUser.collegeId, students: [], pendingStudents: [], notes: [], assignments: [], attendanceRecords: [], messages: [], feedback: [] };
        await db.collection('courses').add(cleanData(rawData));
    };
    const handleUpdateCourse = async (courseId: string, data: any) => {
        await db.collection('courses').doc(courseId).update(cleanData(data));
    };
    const handleAddNote = async (cid: string, note: any) => { await db.collection('courses').doc(cid).update({ notes: FieldValue.arrayUnion({ ...note, id: Date.now().toString() }) }); };
    const handleAddAssignment = async (cid: string, ass: any) => { await db.collection('courses').doc(cid).update({ assignments: FieldValue.arrayUnion({ ...ass, id: Date.now().toString() }) }); };
    const handleTakeAttendance = async (cid: string, data: any) => { await db.collection('courses').doc(cid).update({ attendanceRecords: FieldValue.arrayUnion({ ...data, date: Date.now() }) }); };
    const onRequestToJoinCourse = async (cid: string) => { await db.collection('courses').doc(cid).update({ pendingStudents: FieldValue.arrayUnion(currentUser.id) }); };
    const handleManageCourseRequest = async (cid: string, uid: string, action: 'approve'|'decline') => {
        const update = action === 'approve' ? { students: FieldValue.arrayUnion(uid), pendingStudents: FieldValue.arrayRemove(uid) } : { pendingStudents: FieldValue.arrayRemove(uid) };
        await db.collection('courses').doc(cid).update(update);
    };
    const handleAddStudentsToCourse = async (cid: string, uids: string[]) => { await db.collection('courses').doc(cid).update({ students: FieldValue.arrayUnion(...uids) }); };
    const handleRemoveStudentFromCourse = async (cid: string, uid: string) => { await db.collection('courses').doc(cid).update({ students: FieldValue.arrayRemove(uid) }); };
    const handleSendCourseMessage = async (cid: string, text: string) => { await db.collection('courses').doc(cid).update({ messages: FieldValue.arrayUnion({ id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now() }) }); };
    const handleUpdateCoursePersonalNote = async (cid: string, uid: string, content: string) => { await db.collection('courses').doc(cid).update({ [`personalNotes.${uid}`]: content }); };
    const handleSaveFeedback = async (cid: string, data: any) => { await db.collection('courses').doc(cid).update({ feedback: FieldValue.arrayUnion({ ...data, studentId: currentUser.id, timestamp: Date.now() }) }); };
    const handleCreateNotice = async (data: any) => { 
        const rawData = { ...data, authorId: currentUser.id, collegeId: currentUser.collegeId, timestamp: Date.now() };
        await db.collection('notices').add(cleanData(rawData));
    };
    const handleDeleteNotice = async (id: string) => { await db.collection('notices').doc(id).delete(); };

    const handleCreatePersonalNote = async (title: string, content: string) => {
        await db.collection('users').doc(currentUser.id).update({ personalNotes: FieldValue.arrayUnion({ id: Date.now().toString(), title, content, timestamp: Date.now() }) });
    };
    const handleUpdatePersonalNote = async (id: string, title: string, content: string) => {
        const notes = currentUser.personalNotes?.map(n => n.id === id ? { ...n, title, content, timestamp: Date.now() } : n);
        await db.collection('users').doc(currentUser.id).update({ personalNotes: notes });
    };
    const handleDeletePersonalNote = async (id: string) => {
        const notes = currentUser.personalNotes?.filter(n => n.id !== id);
        await db.collection('users').doc(currentUser.id).update({ personalNotes: notes });
    };

    // Admin Handlers
    const handleApproveTeacherRequest = async (teacherId: string) => {
        try {
            await db.collection('users').doc(teacherId).update({ isApproved: true });
        } catch (error) {
            console.error("Error approving teacher:", error);
            alert("Failed to approve teacher. Please try again.");
        }
    };
    const handleDeclineTeacherRequest = async (teacherId: string) => {
        try {
            await db.collection('users').doc(teacherId).delete();
        } catch (error) {
            console.error("Error declining teacher:", error);
            alert("Failed to decline teacher. Please try again.");
        }
    };
    const handleApproveHodRequest = async (hodId: string) => {
        try {
            await db.collection('users').doc(hodId).update({ isApproved: true });
        } catch (error) {
            console.error("Error approving HOD:", error);
            alert("Failed to approve HOD. Please try again.");
        }
    };
    const handleDeclineHodRequest = async (hodId: string) => {
        try {
            await db.collection('users').doc(hodId).delete();
        } catch (error) {
            console.error("Error declining HOD:", error);
            alert("Failed to decline HOD. Please try again.");
        }
    };
    const handleApproveDirector = async (directorId: string) => {
        try {
            await db.collection('users').doc(directorId).update({ isApproved: true });
        } catch (error) {
            console.error("Error approving director:", error);
            alert("Failed to approve director. Please try again.");
        }
    };
    const handleDeleteUser = async (userId: string) => {
        await db.collection('users').doc(userId).delete();
    };
    const handleToggleFreezeUser = async (userId: string) => {
        const user = users[userId];
        if (user) await db.collection('users').doc(userId).update({ isFrozen: !user.isFrozen });
    };
    const handleUpdateUserRole = async (userId: string, data: any) => {
        await db.collection('users').doc(userId).update(cleanData(data));
    };
    const handleCreateUser = async (userData: Omit<User, 'id'>, password?: string): Promise<void> => {
        if (password) {
            try {
                const { user } = await auth.createUserWithEmailAndPassword(userData.email, password);
                const rawData = {
                    ...userData,
                    collegeId: currentUser.collegeId,
                    isRegistered: true, 
                    isApproved: true,   
                };
                await db.collection('users').doc(user.uid).set(cleanData(rawData));
            } catch (e) {
                console.error("Error creating user with password:", e);
                throw e;
            }
        } else {
            const rawData = { 
                ...userData, 
                collegeId: currentUser.collegeId,
                isRegistered: false,
                isApproved: false 
            };
            return db.collection('users').add(cleanData(rawData)).then(() => void 0);
        }
    };
    const handleCreateUsersBatch = async (usersData: Omit<User, 'id'>[]) => {
        const batch = db.batch();
        usersData.forEach(u => {
            const ref = db.collection('users').doc();
            const rawData = { 
                ...u, 
                collegeId: currentUser.collegeId,
                isRegistered: false,
                isApproved: false 
            };
            batch.set(ref, cleanData(rawData));
        });
        await batch.commit();
        return { successCount: usersData.length, errors: [] };
    };
    const handleCreateCollegeAdmin = async (collegeName: string, email: string, password: string) => {
        const cRef = db.collection('colleges').doc();
        const uRef = db.collection('users').doc();
        await cRef.set({ name: collegeName, adminUids: [uRef.id], departments: [] });
        await uRef.set({ name: 'Director', email, tag: 'Director', collegeId: cRef.id, department: 'Administration', isApproved: true });
    };
    const onUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
        await db.collection('courses').doc(courseId).update({ facultyId: newFacultyId });
    };
    const onDeleteCourse = async (courseId: string) => {
        await db.collection('courses').doc(courseId).delete();
    };
    const handleSendDepartmentMessage = async (department: string, channel: string, text: string) => {
        console.log("Sending dept message", department, channel, text);
    };
    
    const handleRegisterForEvent = async (eventId: string) => {
        const eventRef = db.collection('posts').doc(eventId);
        await eventRef.update({
            'eventDetails.attendees': FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleUnregisterForEvent = async (eventId: string) => {
        const eventRef = db.collection('posts').doc(eventId);
        await eventRef.update({
            'eventDetails.attendees': FieldValue.arrayRemove(currentUser.id)
        });
    };


    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!currentUser && currentPath !== '#/login' && currentPath !== '#/signup' && currentPath !== '#/') {
        return <LoginPage onNavigate={setCurrentPath} />;
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
        groups
    };

    if (currentPath.startsWith('#/director/view/') && currentUser?.tag === 'Director') {
        const targetUserId = currentPath.split('/')[3];
        const targetUser = users[targetUserId];
        
        if (!targetUser) return <div>User not found</div>;
        
        const ImpersonationBanner = () => (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-amber-800 flex justify-between items-center sticky top-0 z-50">
                <span className="font-semibold text-sm">Viewing dashboard as: {targetUser.name} ({targetUser.tag})</span>
                <button onClick={() => setCurrentPath('#/director')} className="text-xs bg-white border border-amber-300 px-3 py-1 rounded hover:bg-amber-50 font-bold text-amber-900">Exit View</button>
            </div>
        );

        if (targetUser.tag === 'HOD/Dean') {
             return (
                <>
                    <ImpersonationBanner />
                    <HodPage 
                       currentUser={targetUser} 
                       onNavigate={setCurrentPath}
                       currentPath={currentPath}
                       courses={courses}
                       onCreateCourse={handleCreateCourse}
                       onUpdateCourse={handleUpdateCourse}
                       notices={notices}
                       users={users}
                       allUsers={Object.values(users)}
                       onCreateNotice={handleCreateNotice}
                       onDeleteNotice={handleDeleteNotice}
                       departmentChats={departmentChats}
                       onSendDepartmentMessage={handleSendDepartmentMessage}
                       onCreateUser={handleCreateUser}
                       onCreateUsersBatch={handleCreateUsersBatch}
                       onApproveTeacherRequest={handleApproveTeacherRequest}
                       onDeclineTeacherRequest={handleDeclineTeacherRequest}
                       colleges={colleges}
                       onUpdateCourseFaculty={onUpdateCourseFaculty}
                       onUpdateCollegeClasses={handleUpdateCollegeClasses}
                    />
                </>
             );
        } else if (targetUser.tag === 'Teacher') {
             return (
                <>
                    <ImpersonationBanner />
                    <AcademicsPage 
                       currentUser={targetUser} 
                       onNavigate={setCurrentPath}
                       currentPath={currentPath}
                       courses={courses}
                       onCreateCourse={handleCreateCourse}
                       notices={notices}
                       users={users}
                       onCreateNotice={handleCreateNotice}
                       onDeleteNotice={handleDeleteNotice}
                       onRequestToJoinCourse={onRequestToJoinCourse}
                       departmentChats={departmentChats}
                       onSendDepartmentMessage={handleSendDepartmentMessage}
                       onCreateUser={handleCreateUser}
                       onApproveTeacherRequest={handleApproveTeacherRequest}
                       onDeclineTeacherRequest={handleDeclineTeacherRequest}
                       colleges={colleges}
                    />
                </>
             );
        }
    }

    return (
        <>
        {currentPath === '#/' && <WelcomePage onNavigate={setCurrentPath} />}
        {currentPath === '#/login' && <LoginPage onNavigate={setCurrentPath} />}
        {currentPath === '#/signup' && <SignupPage onNavigate={setCurrentPath} />}
        {currentPath === '#/home' && currentUser && <HomePage currentUser={currentUser} users={users} posts={posts} stories={stories} groups={groups} events={posts.filter(p=>p.isEvent)} notices={notices} onNavigate={setCurrentPath} onAddPost={handleAddPost} onAddStory={handleAddStory} onMarkStoryAsViewed={handleMarkStoryAsViewed} onDeleteStory={handleDeleteStory} onReplyToStory={handleReplyToStory} currentPath={currentPath} {...postCardProps} />}
        {currentPath.startsWith('#/profile/') && currentUser && <ProfilePage profileUserId={currentPath.split('/')[2]} currentUser={currentUser} users={users} posts={posts} groups={groups} colleges={colleges} courses={courses} onNavigate={setCurrentPath} currentPath={currentPath} onAddPost={handleAddPost} onAddAchievement={handleAddAchievement} onAddInterest={handleAddInterest} onUpdateProfile={handleUpdateProfile} {...postCardProps} />}
        
        {currentPath === '#/groups' && currentUser && (
            <GroupsPage 
                currentUser={currentUser} 
                groups={groups} 
                onNavigate={setCurrentPath} 
                currentPath={currentPath} 
                onCreateGroup={handleCreateGroup}
                onJoinGroupRequest={handleJoinGroupRequest}
                onToggleFollowGroup={handleToggleFollowGroup}
            />
        )}
        
        {currentPath.startsWith('#/groups/') && currentUser && <GroupDetailPage group={groups.find(g => g.id === currentPath.split('/')[2])!} currentUser={currentUser} users={users} posts={posts.filter(p => p.groupId === currentPath.split('/')[2])} groups={groups} onNavigate={setCurrentPath} currentPath={currentPath} onAddPost={handleAddPost} onAddStory={handleAddStory} {...postCardProps} onJoinGroupRequest={handleJoinGroupRequest} onApproveJoinRequest={handleApproveJoinRequest} onDeclineJoinRequest={handleDeclineJoinRequest} onDeleteGroup={handleDeleteGroup} onSendGroupMessage={handleSendGroupMessage} onRemoveGroupMember={handleRemoveGroupMember} onToggleFollowGroup={handleToggleFollowGroup} onUpdateGroup={handleUpdateGroup} />}
        {currentPath === '#/opportunities' && currentUser && <OpportunitiesPage currentUser={currentUser} users={users} posts={posts} onNavigate={setCurrentPath} currentPath={currentPath} onAddPost={handleAddPost} postCardProps={postCardProps} />}
        
        {currentPath === '#/events' && currentUser && (
            <EventsPage 
                currentUser={currentUser} 
                users={users} 
                events={posts.filter(p => p.isEvent)} 
                groups={groups} 
                onNavigate={setCurrentPath} 
                currentPath={currentPath} 
                onAddPost={handleAddPost} 
                {...postCardProps} 
            />
        )}
        
        {currentPath.startsWith('#/events/') && currentUser && (
            <EventDetailPage 
                eventId={currentPath.split('/')[2]} 
                posts={posts}
                users={users}
                currentUser={currentUser}
                onNavigate={setCurrentPath}
                onRegister={handleRegisterForEvent}
                onUnregister={handleUnregisterForEvent}
                onDeleteEvent={handleDeletePost}
            />
        )}

        {currentPath === '#/chat' && currentUser && <ChatPage currentUser={currentUser} users={users} conversations={conversations} onSendMessage={handleSendMessage} onDeleteMessagesForEveryone={handleDeleteMessagesForEveryone} onDeleteMessagesForSelf={handleDeleteMessagesForSelf} onDeleteConversations={handleDeleteConversations} onCreateOrOpenConversation={handleCreateOrOpenConversation} onNavigate={setCurrentPath} currentPath={currentPath} />}
        {currentPath === '#/search' && currentUser && <SearchPage currentUser={currentUser} users={Object.values(users)} posts={posts} groups={groups} onNavigate={setCurrentPath} currentPath={currentPath} {...postCardProps} />}
        {currentPath === '#/confessions' && currentUser && <ConfessionsPage currentUser={currentUser} users={users} posts={posts.filter(p => p.isConfession)} groups={groups} onNavigate={setCurrentPath} onAddPost={handleAddPost} {...postCardProps} currentPath={currentPath} />}
        {currentPath === '#/personal-notes' && currentUser && <PersonalNotesPage currentUser={currentUser} onNavigate={setCurrentPath} currentPath={currentPath} onCreateNote={handleCreatePersonalNote} onUpdateNote={handleUpdatePersonalNote} onDeleteNote={handleDeletePersonalNote} />}
        
        {currentPath === '#/director' && currentUser && currentUser.tag === 'Director' && (
             <DirectorPage 
                currentUser={currentUser} 
                allUsers={Object.values(users)}
                allPosts={posts}
                allGroups={groups}
                allCourses={courses}
                usersMap={users}
                notices={notices}
                colleges={colleges}
                onNavigate={setCurrentPath} 
                currentPath={currentPath}
                onDeleteUser={handleDeleteUser}
                onDeletePost={handleDeletePost}
                onDeleteGroup={handleDeleteGroup}
                onApproveHodRequest={handleApproveHodRequest}
                onDeclineHodRequest={handleDeclineHodRequest}
                onApproveTeacherRequest={handleApproveTeacherRequest}
                onDeclineTeacherRequest={handleDeclineTeacherRequest}
                onToggleFreezeUser={handleToggleFreezeUser}
                onUpdateUserRole={handleUpdateUserRole}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
                onCreateCourse={handleCreateCourse}
                onCreateUser={handleCreateUser}
                onDeleteCourse={onDeleteCourse}
                onUpdateCollegeDepartments={handleUpdateCollegeDepartments}
                onEditCollegeDepartment={handleEditCollegeDepartment}
                onDeleteCollegeDepartment={handleDeleteCollegeDepartment}
                onUpdateCourseFaculty={onUpdateCourseFaculty}
                postCardProps={postCardProps}
             />
        )}
        
        {currentPath === '#/hod' && currentUser && currentUser.tag === 'HOD/Dean' && (
            <HodPage 
                currentUser={currentUser} 
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                courses={courses}
                onCreateCourse={handleCreateCourse}
                onUpdateCourse={handleUpdateCourse}
                notices={notices}
                users={users}
                allUsers={Object.values(users)}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
                departmentChats={departmentChats}
                onSendDepartmentMessage={handleSendDepartmentMessage}
                onCreateUser={handleCreateUser}
                onCreateUsersBatch={handleCreateUsersBatch}
                onApproveTeacherRequest={handleApproveTeacherRequest}
                onDeclineTeacherRequest={handleDeclineTeacherRequest}
                colleges={colleges}
                onUpdateCourseFaculty={onUpdateCourseFaculty}
                onUpdateCollegeClasses={handleUpdateCollegeClasses}
            />
        )}
        
        {currentPath === '#/superadmin' && currentUser && currentUser.tag === 'Super Admin' && (
            <SuperAdminPage 
                colleges={colleges} 
                users={users} 
                onCreateCollegeAdmin={handleCreateCollegeAdmin} 
                onNavigate={setCurrentPath} 
                currentUser={currentUser} 
                currentPath={currentPath}
                onApproveDirector={handleApproveDirector}
                onDeleteUser={handleDeleteUser}
            />
        )}

        {(currentPath === '#/academics' || currentPath.startsWith('#/academics/')) && currentUser && (
            currentPath === '#/academics' ? (
                <AcademicsPage 
                    currentUser={currentUser} 
                    onNavigate={setCurrentPath} 
                    currentPath={currentPath} 
                    courses={courses} 
                    onCreateCourse={handleCreateCourse}
                    notices={notices}
                    users={users}
                    onCreateNotice={handleCreateNotice}
                    onDeleteNotice={handleDeleteNotice}
                    onRequestToJoinCourse={onRequestToJoinCourse}
                    departmentChats={departmentChats}
                    onSendDepartmentMessage={handleSendDepartmentMessage}
                    onCreateUser={handleCreateUser}
                    onApproveTeacherRequest={handleApproveTeacherRequest}
                    onDeclineTeacherRequest={handleDeclineTeacherRequest}
                    colleges={colleges}
                />
            ) : (
                <CourseDetailPage 
                    course={courses.find(c => c.id === currentPath.split('/')[2])!} 
                    currentUser={currentUser} 
                    allUsers={Object.values(users) as User[]} 
                    students={(Object.values(users) as User[]).filter((u: User) => u.tag === 'Student' && courses.find(c => c.id === currentPath.split('/')[2])?.students?.includes(u.id))}
                    onNavigate={setCurrentPath} 
                    currentPath={currentPath}
                    onAddNote={handleAddNote}
                    onAddAssignment={handleAddAssignment}
                    onTakeAttendance={handleTakeAttendance}
                    onRequestToJoinCourse={onRequestToJoinCourse}
                    onManageCourseRequest={handleManageCourseRequest}
                    onAddStudentsToCourse={handleAddStudentsToCourse}
                    onRemoveStudentFromCourse={handleRemoveStudentFromCourse}
                    onSendCourseMessage={handleSendCourseMessage}
                    onUpdateCoursePersonalNote={handleUpdateCoursePersonalNote}
                    onSaveFeedback={handleSaveFeedback}
                    onDeleteCourse={onDeleteCourse}
                    onUpdateCourseFaculty={onUpdateCourseFaculty}
                    initialTab={currentPath.split('/')[3]}
                />
            )
        )}
        </>
    );
};

export default App;
