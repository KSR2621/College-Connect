
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, storage, FieldValue } from './firebase';
import type { User, Post, Group, Story, Course, Notice, Conversation, College, PersonalNote, UserTag, GroupCategory, GroupPrivacy, AttendanceRecord, Note, Assignment } from './types';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AcademicsPage from './pages/AcademicsPage';
import CourseDetailPage from './pages/CourseDetailPage';
import PersonalNotesPage from './pages/PersonalNotesPage';
import NoticeBoardPage from './pages/NoticeBoardPage';
import HodPage from './pages/HodPage';
import DirectorPage from './pages/DirectorPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SearchPage from './pages/SearchPage';
import ConfessionsPage from './pages/ConfessionsPage';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('#/');
  
  // Data State
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);

  // --- Auth & Initial Load ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (authUser: any) => {
      if (authUser) {
        // Fetch current user details
        const userDoc = await db.collection('users').doc(authUser.uid).get();
        if (userDoc.exists) {
          setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          if (window.location.hash === '#/' || window.location.hash === '#/login') {
             setCurrentPath('#/home');
          } else {
             setCurrentPath(window.location.hash || '#/home');
          }
        } else {
          // User exists in Auth but not DB (rare edge case or deleted)
          setCurrentPath('#/login');
        }
      } else {
        setCurrentUser(null);
        const publicPaths = ['#/', '#/login', '#/signup'];
        if (!publicPaths.includes(window.location.hash)) {
            setCurrentPath('#/');
        }
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Real-time Data Subscriptions ---
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

    // Users
    unsubs.push(db.collection('users').onSnapshot((snapshot: any) => {
        const usersMap: { [key: string]: User } = {};
        snapshot.forEach((doc: any) => { usersMap[doc.id] = { id: doc.id, ...doc.data() } as User; });
        setUsers(usersMap);
        // Update current user if changed
        if (usersMap[currentUser.id]) setCurrentUser(usersMap[currentUser.id]);
    }));

    // Posts
    unsubs.push(db.collection('posts').onSnapshot((snapshot: any) => {
        const postsData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Post[];
        setPosts(postsData);
    }));

    // Groups
    unsubs.push(db.collection('groups').onSnapshot((snapshot: any) => {
        const groupsData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Group[];
        setGroups(groupsData);
    }));

    // Stories
    unsubs.push(db.collection('stories').onSnapshot((snapshot: any) => {
        const storiesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Story[];
        // Filter expired stories (24h)
        const now = Date.now();
        setStories(storiesData.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000));
    }));

    // Courses
    unsubs.push(db.collection('courses').onSnapshot((snapshot: any) => {
        const coursesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Course[];
        setCourses(coursesData);
    }));

    // Notices
    unsubs.push(db.collection('notices').onSnapshot((snapshot: any) => {
        const noticesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Notice[];
        setNotices(noticesData);
    }));

    // Conversations
    unsubs.push(db.collection('conversations')
        .where('participantIds', 'array-contains', currentUser.id)
        .onSnapshot((snapshot: any) => {
            const convsData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Conversation[];
            setConversations(convsData);
        })
    );

    // Colleges
    unsubs.push(db.collection('colleges').onSnapshot((snapshot: any) => {
        const collegesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as College[];
        setColleges(collegesData);
    }));

    return () => unsubs.forEach(u => u());
  }, [currentUser?.id]);

  // --- Handlers ---

  // Posts
  const handleAddPost = async (postDetails: any) => {
      if (!currentUser) return;
      const newPost = {
          ...postDetails,
          authorId: currentUser.id,
          timestamp: Date.now(),
          comments: [],
          reactions: {}
      };
      if (currentUser.collegeId) newPost.collegeId = currentUser.collegeId;
      await db.collection('posts').add(newPost);
  };

  const handleDeletePost = async (postId: string) => {
      await db.collection('posts').doc(postId).delete();
  };

  const handleReaction = async (postId: string, reaction: any) => {
      const post = posts.find(p => p.id === postId);
      if (!post || !currentUser) return;
      const currentReactions = post.reactions || {};
      const userReactions = currentReactions[reaction] || [];
      
      // Toggle logic
      if (userReactions.includes(currentUser.id)) {
          await db.collection('posts').doc(postId).update({
              [`reactions.${reaction}`]: FieldValue.arrayRemove(currentUser.id)
          });
      } else {
          // Remove from other reactions first to ensure only 1 reaction per user (optional style)
          // For simplicity, we'll just add to this one
          await db.collection('posts').doc(postId).update({
              [`reactions.${reaction}`]: FieldValue.arrayUnion(currentUser.id)
          });
      }
  };

  const handleAddComment = async (postId: string, text: string) => {
      if (!currentUser) return;
      const newComment = {
          id: Date.now().toString(),
          authorId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('posts').doc(postId).update({
          comments: FieldValue.arrayUnion(newComment)
      });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const commentToDelete = post.comments.find(c => c.id === commentId);
      if (commentToDelete) {
          await db.collection('posts').doc(postId).update({
              comments: FieldValue.arrayRemove(commentToDelete)
          });
      }
  };

  const handleToggleSavePost = async (postId: string) => {
      if (!currentUser) return;
      if (currentUser.savedPosts?.includes(postId)) {
          await db.collection('users').doc(currentUser.id).update({
              savedPosts: FieldValue.arrayRemove(postId)
          });
      } else {
          await db.collection('users').doc(currentUser.id).update({
              savedPosts: FieldValue.arrayUnion(postId)
          });
      }
  };

  const handleSharePost = async (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group', id?: string }) => {
      if (!currentUser) return;
      const sharedPostInfo = {
          originalId: originalPost.id,
          originalAuthorId: originalPost.authorId,
          originalTimestamp: originalPost.timestamp,
          originalContent: originalPost.content,
          originalMediaUrls: originalPost.mediaUrls,
          originalMediaType: originalPost.mediaType,
          originalIsEvent: originalPost.isEvent,
          originalEventDetails: originalPost.eventDetails,
          originalIsConfession: originalPost.isConfession
      };

      const newPost = {
          authorId: currentUser.id,
          content: commentary,
          timestamp: Date.now(),
          sharedPost: sharedPostInfo,
          comments: [],
          reactions: {},
          groupId: shareTarget.type === 'group' ? shareTarget.id : undefined
      };
      await db.collection('posts').add(newPost);
  };

  const handleSharePostAsMessage = async (conversationId: string, authorName: string, postContent: string) => {
      if (!currentUser) return;
      const text = `Shared post by ${authorName}: ${postContent.substring(0, 50)}...`;
      await handleSendMessage(conversationId, text);
  };

  // Stories
  const handleAddStory = async (storyDetails: any) => {
      if (!currentUser) return;
      const newStory = {
          ...storyDetails,
          authorId: currentUser.id,
          timestamp: Date.now(),
          viewedBy: []
      };
      await db.collection('stories').add(newStory);
  };

  const handleMarkStoryAsViewed = async (storyId: string) => {
      if (!currentUser) return;
      await db.collection('stories').doc(storyId).update({
          viewedBy: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleDeleteStory = async (storyId: string) => {
      await db.collection('stories').doc(storyId).delete();
  };

  const handleReplyToStory = async (authorId: string, text: string) => {
      const conversationId = await handleCreateOrOpenConversation(authorId);
      await handleSendMessage(conversationId, text);
  };

  // Chat
  const handleCreateOrOpenConversation = async (otherUserId: string): Promise<string> => {
      if (!currentUser) throw new Error("Not logged in");
      // Check if conversation exists
      const existing = conversations.find(c => !c.isGroupChat && c.participantIds.includes(currentUser.id) && c.participantIds.includes(otherUserId));
      if (existing) return existing.id;

      // Create new
      const newConvoRef = await db.collection('conversations').add({
          participantIds: [currentUser.id, otherUserId],
          messages: [],
          collegeId: currentUser.collegeId
      });
      return newConvoRef.id;
  };

  const handleSendMessage = async (conversationId: string, text: string) => {
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('conversations').doc(conversationId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleDeleteMessagesForEveryone = async (conversationId: string, messageIds: string[]) => {
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;
      const updatedMessages = convo.messages.filter(m => !messageIds.includes(m.id));
      await db.collection('conversations').doc(conversationId).update({ messages: updatedMessages });
  };

  const handleDeleteMessagesForSelf = async (conversationId: string, messageIds: string[]) => {
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;
      // In a real app, you'd mark messages as deleted for user. For simplified prototype, we might just ignore or implement full delete logic structure.
      // We'll update the message object to include a `deletedFor` array.
      const updatedMessages = convo.messages.map(m => {
          if (messageIds.includes(m.id)) {
              return { ...m, deletedFor: [...(m.deletedFor || []), currentUser?.id] };
          }
          return m;
      });
      await db.collection('conversations').doc(conversationId).update({ messages: updatedMessages });
  };

  const handleDeleteConversations = async (conversationIds: string[]) => {
      // For now, actually delete document for prototype simplicity
      for (const id of conversationIds) {
          await db.collection('conversations').doc(id).delete();
      }
  };

  // Groups
  const handleCreateGroup = async (groupDetails: any) => {
      if (!currentUser) return;
      const newGroup = {
          ...groupDetails,
          creatorId: currentUser.id,
          memberIds: [currentUser.id],
          collegeId: currentUser.collegeId
      };
      await db.collection('groups').add(newGroup);
  };

  const handleJoinGroupRequest = async (groupId: string) => {
      if (!currentUser) return;
      const group = groups.find(g => g.id === groupId);
      if (group?.privacy === 'public') {
          await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayUnion(currentUser.id) });
      } else {
          await db.collection('groups').doc(groupId).update({ pendingMemberIds: FieldValue.arrayUnion(currentUser.id) });
      }
  };

  const handleApproveJoinRequest = async (groupId: string, userId: string) => {
      await db.collection('groups').doc(groupId).update({
          pendingMemberIds: FieldValue.arrayRemove(userId),
          memberIds: FieldValue.arrayUnion(userId)
      });
  };

  const handleDeclineJoinRequest = async (groupId: string, userId: string) => {
      await db.collection('groups').doc(groupId).update({
          pendingMemberIds: FieldValue.arrayRemove(userId)
      });
  };

  const handleToggleFollowGroup = async (groupId: string) => {
      if (!currentUser) return;
      const isFollowing = currentUser.followingGroups?.includes(groupId);
      if (isFollowing) {
          await db.collection('users').doc(currentUser.id).update({ followingGroups: FieldValue.arrayRemove(groupId) });
          await db.collection('groups').doc(groupId).update({ followers: FieldValue.arrayRemove(currentUser.id) });
      } else {
          await db.collection('users').doc(currentUser.id).update({ followingGroups: FieldValue.arrayUnion(groupId) });
          await db.collection('groups').doc(groupId).update({ followers: FieldValue.arrayUnion(currentUser.id) });
      }
  };

  const handleUpdateGroup = async (groupId: string, data: any) => {
      await db.collection('groups').doc(groupId).update(data);
  };

  const handleDeleteGroup = async (groupId: string) => {
      await db.collection('groups').doc(groupId).delete();
  };

  const handleSendGroupMessage = async (groupId: string, text: string) => {
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('groups').doc(groupId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
      await db.collection('groups').doc(groupId).update({ memberIds: FieldValue.arrayRemove(memberId) });
  };

  // Profile
  const handleAddAchievement = async (achievement: any) => {
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

  const handleUpdateProfile = async (updateData: any, avatarFile?: File | null) => {
      if (!currentUser) return;
      let avatarUrl = currentUser.avatarUrl;
      
      if (avatarFile) {
          const storageRef = storage.ref().child(`avatars/${currentUser.id}`);
          const snapshot = await storageRef.put(avatarFile);
          avatarUrl = await snapshot.ref.getDownloadURL();
      }

      await db.collection('users').doc(currentUser.id).update({
          ...updateData,
          avatarUrl
      });
  };

  // Academics & Courses
  const handleCreateCourse = async (courseData: any) => {
      if (!currentUser) return;
      await db.collection('courses').add({
          ...courseData,
          collegeId: currentUser.collegeId,
          facultyId: currentUser.id // Initially assigned to creator, HOD can change
      });
  };

  const handleUpdateCourse = async (courseId: string, data: any) => {
      await db.collection('courses').doc(courseId).update(data);
  };

  const handleDeleteCourse = async (courseId: string) => {
      await db.collection('courses').doc(courseId).delete();
  };

  const handleRequestToJoinCourse = async (courseId: string) => {
      if (!currentUser) return;
      await db.collection('courses').doc(courseId).update({
          pendingStudents: FieldValue.arrayUnion(currentUser.id)
      });
  };

  const handleUpdateCourseFaculty = async (courseId: string, newFacultyId: string) => {
      await db.collection('courses').doc(courseId).update({ facultyId: newFacultyId });
  };

  // Notices
  const handleCreateNotice = async (noticeData: any) => {
      if (!currentUser) return;
      await db.collection('notices').add({
          ...noticeData,
          authorId: currentUser.id,
          collegeId: currentUser.collegeId,
          timestamp: Date.now()
      });
  };

  const handleDeleteNotice = async (noticeId: string) => {
      await db.collection('notices').doc(noticeId).delete();
  };

  // Admin/HOD User Management
  const handleCreateUser = async (userData: any, password?: string) => {
      // Note: In a real app, creating auth users usually requires a backend function or secondary auth app instance.
      // For this prototype, we'll assume we can create a user if we are admin, but Firebase Client SDK doesn't support creating secondary users easily without logging out.
      // We will simulate by just adding to Firestore for listing purposes, real Auth creation happens on Signup/Login flows or via a Cloud Function.
      // OR, we create a placeholder doc and they "claim" it on signup.
      // The SignupPage logic handles "finding invite". So we just create the doc.
      const newRef = await db.collection('users').add({
          ...userData,
          collegeId: currentUser?.collegeId,
          isRegistered: false
      });
      // We'll use the doc ID as a temporary invite code logic
  };

  const handleCreateUsersBatch = async (usersData: any[]) => {
      // Firestore allows max 500 writes per batch. We must chunk it.
      const chunkSize = 450; // Use a safe margin
      let successCount = 0;
      const errors: any[] = [];

      // Process in chunks
      for (let i = 0; i < usersData.length; i += chunkSize) {
          const batch = db.batch();
          const chunk = usersData.slice(i, i + chunkSize);
          
          for (const u of chunk) {
              // Note: Checking duplicates synchronously against local state is fast but might be stale.
              // In a real app, use a transaction or unique index constraints.
              const existing = (Object.values(users) as User[]).find(existingUser => existingUser.email === u.email);
              if (existing) {
                  errors.push({ email: u.email, reason: "Email already exists" });
                  continue;
              }
              
              const newRef = db.collection('users').doc(); // Generate ID
              batch.set(newRef, {
                  ...u,
                  collegeId: currentUser?.collegeId,
                  isRegistered: false,
                  isApproved: u.tag === 'Teacher' ? false : true // Students might not need approval if invited? Let's say False for now to be safe
              });
              successCount++;
          }
          // Commit this chunk
          if (chunk.length > 0) {
             await batch.commit();
          }
      }
      return { successCount, errors };
  };

  const handleApproveTeacherRequest = async (userId: string) => {
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineTeacherRequest = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const handleApproveHodRequest = async (userId: string) => {
      await db.collection('users').doc(userId).update({ isApproved: true });
  };

  const handleDeclineHodRequest = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const onDeleteUser = async (userId: string) => {
      await db.collection('users').doc(userId).delete();
  };

  const onToggleFreezeUser = async (userId: string) => {
      const user = users[userId];
      await db.collection('users').doc(userId).update({ isFrozen: !user.isFrozen });
  };

  const onUpdateUserRole = async (userId: string, updateData: { tag: UserTag, department: string }) => {
      await db.collection('users').doc(userId).update(updateData);
  }

  // Super Admin
  const handleCreateCollegeAdmin = async (collegeName: string, email: string, password: string) => {
      // Create College
      const collegeRef = await db.collection('colleges').add({ name: collegeName, adminUids: [], departments: [] });
      // We can't create the Auth user here easily without logging out. 
      // In a real app, call a Cloud Function. 
      // For prototype: Create a user doc that is "pre-approved" and wait for them to sign up? 
      // Or simply fail for now as "Backend Required". 
      // Let's assume we just create the college and the user has to sign up via "Register College" flow.
      alert("College created. Please ask the director to sign up via the 'Register College' page.");
  };

  const handleApproveDirector = async (directorId: string) => {
      await db.collection('users').doc(directorId).update({ isApproved: true });
  };

  // College Management
  const onUpdateCollegeDepartments = async (collegeId: string, departments: string[]) => {
      await db.collection('colleges').doc(collegeId).update({ departments });
  };

  const onUpdateCollegeClasses = async (collegeId: string, department: string, classes: any) => {
      // Logic to update nested map in Firestore
      await db.collection('colleges').doc(collegeId).update({
          [`classes.${department}`]: classes
      });
  };

  const onEditCollegeDepartment = async (collegeId: string, oldName: string, newName: string) => {
        // Placeholder
  }

  const onDeleteCollegeDepartment = async (collegeId: string, deptName: string) => {
        // Placeholder
  }

  // Personal Notes
  const handleCreateNote = async (title: string, content: string) => {
      if (!currentUser) return;
      const newNote = {
          id: Date.now().toString(),
          title,
          content,
          timestamp: Date.now()
      };
      await db.collection('users').doc(currentUser.id).update({
          personalNotes: FieldValue.arrayUnion(newNote)
      });
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.map(n => 
          n.id === noteId ? { ...n, title, content, timestamp: Date.now() } : n
      );
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  const handleDeleteNote = async (noteId: string) => {
      if (!currentUser || !currentUser.personalNotes) return;
      const updatedNotes = currentUser.personalNotes.filter(n => n.id !== noteId);
      await db.collection('users').doc(currentUser.id).update({ personalNotes: updatedNotes });
  };

  // Course management
  const handleAddNote = async (courseId: string, noteData: { title: string, fileUrl: string, fileName: string }) => {
      const newNote: Note = {
          id: Date.now().toString(),
          ...noteData,
          uploadedAt: Date.now()
      };
      await db.collection('courses').doc(courseId).update({
          notes: FieldValue.arrayUnion(newNote)
      });
  };

  const handleAddAssignment = async (courseId: string, assignmentData: { title: string, fileUrl: string, fileName: string, dueDate: number }) => {
      const newAssignment: Assignment = {
          id: Date.now().toString(),
          ...assignmentData,
          postedAt: Date.now()
      };
      await db.collection('courses').doc(courseId).update({
          assignments: FieldValue.arrayUnion(newAssignment)
      });
  };

  const handleManageCourseRequest = () => {};
  
  const handleAddStudentsToCourse = async (courseId: string, studentIds: string[]) => {
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayUnion(...studentIds)
      });
  };

  const handleRemoveStudentFromCourse = async (courseId: string, studentId: string) => {
      await db.collection('courses').doc(courseId).update({
          students: FieldValue.arrayRemove(studentId)
      });
  };

  const handleSendCourseMessage = async (courseId: string, text: string) => {
      if (!currentUser) return;
      const newMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      await db.collection('courses').doc(courseId).update({
          messages: FieldValue.arrayUnion(newMessage)
      });
  };

  const handleUpdateCoursePersonalNote = () => {};
  const handleSaveFeedback = () => {};

  const handleTakeAttendance = async (courseId: string, attendanceData: Omit<AttendanceRecord, 'date'>) => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
      // ... (Implemented in onTakeAttendanceReal below)
  };

  // Real implementation of handleTakeAttendance
  const onTakeAttendanceReal = async (courseId: string, record: AttendanceRecord) => {
      const courseRef = db.collection('courses').doc(courseId);
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const existingRecords = course.attendanceRecords || [];
      const dateString = new Date(record.date).toDateString();
      
      const existingIndex = existingRecords.findIndex(r => new Date(r.date).toDateString() === dateString);
      
      let newRecords = [...existingRecords];
      if (existingIndex >= 0) {
          newRecords[existingIndex] = record;
      } else {
          newRecords.push(record);
      }

      await courseRef.update({ attendanceRecords: newRecords });
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // Simple router
  const renderPage = () => {
    if (currentPath === '#/' || currentPath === '') return <WelcomePage onNavigate={setCurrentPath} />;
    if (currentPath === '#/login') return <LoginPage onNavigate={setCurrentPath} />;
    if (currentPath === '#/signup') return <SignupPage onNavigate={setCurrentPath} />;

    if (!currentUser) return <LoginPage onNavigate={setCurrentPath} />;

    if (currentPath === '#/home') {
        return (
            <HomePage
                currentUser={currentUser}
                users={users}
                posts={posts}
                stories={stories}
                groups={groups}
                events={posts.filter(p => p.isEvent)}
                notices={notices}
                onNavigate={setCurrentPath}
                onAddPost={handleAddPost}
                onAddStory={handleAddStory}
                onMarkStoryAsViewed={handleMarkStoryAsViewed}
                onDeleteStory={handleDeleteStory}
                onReplyToStory={handleReplyToStory}
                currentPath={currentPath}
                onReaction={handleReaction}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onSharePostAsMessage={handleSharePostAsMessage}
                onSharePost={handleSharePost}
                onToggleSavePost={handleToggleSavePost}
            />
        );
    }

    if (currentPath === '#/groups') {
        return (
            <GroupsPage
                currentUser={currentUser}
                groups={groups}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onCreateGroup={handleCreateGroup}
                onJoinGroupRequest={handleJoinGroupRequest}
                onToggleFollowGroup={handleToggleFollowGroup}
            />
        );
    }

    if (currentPath.startsWith('#/groups/')) {
        const groupId = currentPath.split('/')[2];
        const group = groups.find(g => g.id === groupId);
        if (group) {
            return (
                <GroupDetailPage
                    group={group}
                    currentUser={currentUser}
                    users={users}
                    posts={posts.filter(p => p.groupId === groupId)}
                    groups={groups}
                    onNavigate={setCurrentPath}
                    currentPath={currentPath}
                    onAddPost={(p) => handleAddPost({ ...p, groupId })}
                    onAddStory={(s) => handleAddStory({ ...s, groupId })}
                    onReaction={handleReaction}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    onCreateOrOpenConversation={handleCreateOrOpenConversation}
                    onSharePostAsMessage={handleSharePostAsMessage}
                    onSharePost={handleSharePost}
                    onToggleSavePost={handleToggleSavePost}
                    onJoinGroupRequest={handleJoinGroupRequest}
                    onApproveJoinRequest={handleApproveJoinRequest}
                    onDeclineJoinRequest={handleDeclineJoinRequest}
                    onDeleteGroup={handleDeleteGroup}
                    onSendGroupMessage={handleSendGroupMessage}
                    onRemoveGroupMember={handleRemoveGroupMember}
                    onToggleFollowGroup={handleToggleFollowGroup}
                    onUpdateGroup={handleUpdateGroup}
                />
            );
        }
    }

    if (currentPath === '#/events') {
        return (
            <EventsPage
                currentUser={currentUser}
                users={users}
                events={posts.filter(p => p.isEvent)}
                groups={groups}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onAddPost={handleAddPost}
                onReaction={handleReaction}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onSharePostAsMessage={handleSharePostAsMessage}
                onSharePost={handleSharePost}
                onToggleSavePost={handleToggleSavePost}
            />
        );
    }

    if (currentPath.startsWith('#/events/')) {
        const eventId = currentPath.split('/')[2];
        return (
            <EventDetailPage
                eventId={eventId}
                posts={posts}
                users={users}
                currentUser={currentUser}
                onNavigate={setCurrentPath}
                onRegister={() => {/* Implement register logic */}}
                onUnregister={() => {/* Implement unregister logic */}}
                onDeleteEvent={handleDeletePost}
            />
        );
    }

    if (currentPath === '#/opportunities') {
        return (
            <OpportunitiesPage
                currentUser={currentUser}
                users={users}
                posts={posts}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onAddPost={handleAddPost}
                postCardProps={{
                    onDeletePost: handleDeletePost
                }}
            />
        );
    }

    if (currentPath === '#/chat') {
        return (
            <ChatPage
                currentUser={currentUser}
                users={users}
                conversations={conversations}
                onSendMessage={handleSendMessage}
                onDeleteMessagesForEveryone={handleDeleteMessagesForEveryone}
                onDeleteMessagesForSelf={handleDeleteMessagesForSelf}
                onDeleteConversations={handleDeleteConversations}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
            />
        );
    }

    if (currentPath.startsWith('#/profile/')) {
        const profileId = currentPath.split('/')[2];
        return (
            <ProfilePage
                profileUserId={profileId}
                currentUser={currentUser}
                users={users}
                posts={posts}
                groups={groups}
                colleges={colleges}
                courses={courses}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onAddPost={handleAddPost}
                onAddAchievement={handleAddAchievement}
                onAddInterest={handleAddInterest}
                onUpdateProfile={handleUpdateProfile}
                onReaction={handleReaction}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onSharePostAsMessage={handleSharePostAsMessage}
                onSharePost={handleSharePost}
                onToggleSavePost={handleToggleSavePost}
            />
        );
    }

    if (currentPath === '#/academics') {
        return (
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
                onRequestToJoinCourse={handleRequestToJoinCourse}
                departmentChats={[]}
                onSendDepartmentMessage={() => {}}
                onCreateUser={handleCreateUser}
                onApproveTeacherRequest={handleApproveTeacherRequest}
                onDeclineTeacherRequest={handleDeclineTeacherRequest}
                colleges={colleges}
            />
        );
    }

    if (currentPath.startsWith('#/academics/')) {
        const parts = currentPath.split('/');
        const courseId = parts[2];
        const course = courses.find(c => c.id === courseId);
        // For nested routes like /academics/:id/attendance, passing via prop
        const initialTab = parts[3] === 'attendance' ? 'attendance' : parts[3] === 'assignments' ? 'assignments' : parts[3] === 'roster' ? 'roster' : undefined;

        if (course) {
            // Filter enrolled students for this course: Combine Automatic Class-based students AND Manually enrolled students
            let classStudents: User[] = [];
            if (course.year) {
                 // Ensure comparison is robust (e.g., case-insensitive for division)
                 classStudents = (Object.values(users) as User[]).filter((u: User) => 
                    u.collegeId === course.collegeId &&
                    u.department === course.department &&
                    u.yearOfStudy === course.year &&
                    u.tag === 'Student' &&
                    (!course.division || (u.division && u.division.toLowerCase() === course.division.toLowerCase()))
                 );
            }

            const manualStudentIds = course.students || [];
            const manualStudents = manualStudentIds.map(id => users[id]).filter(Boolean);

            // Merge and Dedupe by ID
            const studentMap = new Map<string, User>();
            classStudents.forEach(s => studentMap.set(s.id, s));
            manualStudents.forEach(s => studentMap.set(s.id, s));

            // Cast to ensure type safety when filtering
            const finalStudents = Array.from(studentMap.values()).map(u => ({
                id: u.id, 
                name: u.name, 
                avatarUrl: u.avatarUrl,
                rollNo: u.rollNo
            }));

            return (
                <CourseDetailPage
                    course={course}
                    currentUser={currentUser}
                    allUsers={Object.values(users)}
                    students={finalStudents}
                    onNavigate={setCurrentPath}
                    currentPath={currentPath}
                    onAddNote={handleAddNote}
                    onAddAssignment={handleAddAssignment}
                    onTakeAttendance={onTakeAttendanceReal}
                    onRequestToJoinCourse={handleRequestToJoinCourse}
                    onManageCourseRequest={handleManageCourseRequest}
                    onAddStudentsToCourse={handleAddStudentsToCourse}
                    onRemoveStudentFromCourse={handleRemoveStudentFromCourse}
                    onSendCourseMessage={handleSendCourseMessage}
                    onUpdateCoursePersonalNote={handleUpdateCoursePersonalNote}
                    onSaveFeedback={handleSaveFeedback}
                    onDeleteCourse={handleDeleteCourse}
                    onUpdateCourseFaculty={handleUpdateCourseFaculty}
                    initialTab={initialTab}
                />
            );
        }
    }

    if (currentPath === '#/notes') {
        return (
            <PersonalNotesPage
                currentUser={currentUser}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
            />
        );
    }

    if (currentPath === '#/notices') {
        return (
            <NoticeBoardPage
                currentUser={currentUser}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                notices={notices}
                users={users}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
            />
        );
    }

    if (currentPath === '#/hod') {
        if (currentUser.tag !== 'HOD/Dean') return <HomePage {...{} as any} />; // Redirect or show error
        return (
            <HodPage
                currentUser={currentUser}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                courses={courses}
                onCreateCourse={handleCreateCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                notices={notices}
                users={users}
                allUsers={Object.values(users)}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
                departmentChats={[]}
                onSendDepartmentMessage={() => {}}
                onCreateUser={handleCreateUser}
                onCreateUsersBatch={handleCreateUsersBatch}
                onApproveTeacherRequest={handleApproveTeacherRequest}
                onDeclineTeacherRequest={handleDeclineTeacherRequest}
                colleges={colleges}
                onUpdateCourseFaculty={handleUpdateCourseFaculty}
                onUpdateCollegeClasses={onUpdateCollegeClasses}
                onDeleteUser={onDeleteUser}
                onToggleFreezeUser={onToggleFreezeUser}
                onUpdateUserRole={onUpdateUserRole}
            />
        );
    }

    if (currentPath.startsWith('#/director')) {
        if (currentUser.tag !== 'Director') return <HomePage {...{} as any} />;
        return (
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
                onDeleteUser={onDeleteUser}
                onDeletePost={handleDeletePost}
                onDeleteGroup={handleDeleteGroup}
                onApproveHodRequest={handleApproveHodRequest}
                onDeclineHodRequest={handleDeclineHodRequest}
                onApproveTeacherRequest={handleApproveTeacherRequest}
                onDeclineTeacherRequest={handleDeclineTeacherRequest}
                onToggleFreezeUser={onToggleFreezeUser}
                onUpdateUserRole={() => {}}
                onCreateNotice={handleCreateNotice}
                onDeleteNotice={handleDeleteNotice}
                onCreateCourse={handleCreateCourse}
                onCreateUser={handleCreateUser}
                onDeleteCourse={handleDeleteCourse}
                onUpdateCollegeDepartments={onUpdateCollegeDepartments}
                onEditCollegeDepartment={() => {}}
                onDeleteCollegeDepartment={() => {}}
                onUpdateCourseFaculty={handleUpdateCourseFaculty}
                postCardProps={{
                    onReaction: handleReaction,
                    onAddComment: handleAddComment,
                    onDeletePost: handleDeletePost,
                    onDeleteComment: handleDeleteComment,
                    onCreateOrOpenConversation: handleCreateOrOpenConversation,
                    onSharePostAsMessage: handleSharePostAsMessage,
                    onSharePost: handleSharePost,
                    onToggleSavePost: handleToggleSavePost,
                    groups: groups
                }}
            />
        );
    }

    if (currentPath === '#/superadmin') {
        return (
            <SuperAdminPage
                colleges={colleges}
                users={users}
                onCreateCollegeAdmin={handleCreateCollegeAdmin}
                onNavigate={setCurrentPath}
                currentUser={currentUser}
                currentPath={currentPath}
                onApproveDirector={handleApproveDirector}
                onDeleteUser={onDeleteUser}
            />
        );
    }

    if (currentPath === '#/search') {
        return (
            <SearchPage
                currentUser={currentUser}
                users={Object.values(users)}
                posts={posts}
                groups={groups}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onReaction={handleReaction}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onSharePostAsMessage={handleSharePostAsMessage}
                onSharePost={handleSharePost}
                onToggleSavePost={handleToggleSavePost}
            />
        );
    }

    if (currentPath === '#/confessions') {
        return (
            <ConfessionsPage
                currentUser={currentUser}
                users={users}
                posts={posts}
                groups={groups}
                onNavigate={setCurrentPath}
                currentPath={currentPath}
                onAddPost={handleAddPost}
                onReaction={handleReaction}
                onAddComment={handleAddComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onCreateOrOpenConversation={handleCreateOrOpenConversation}
                onSharePostAsMessage={handleSharePostAsMessage}
                onSharePost={handleSharePost}
                onToggleSavePost={handleToggleSavePost}
            />
        );
    }

    return <HomePage 
        currentUser={currentUser}
        users={users}
        posts={posts}
        stories={stories}
        groups={groups}
        events={posts.filter(p => p.isEvent)}
        notices={notices}
        onNavigate={setCurrentPath}
        onAddPost={handleAddPost}
        onAddStory={handleAddStory}
        onMarkStoryAsViewed={handleMarkStoryAsViewed}
        onDeleteStory={handleDeleteStory}
        onReplyToStory={handleReplyToStory}
        currentPath={currentPath}
        onReaction={handleReaction}
        onAddComment={handleAddComment}
        onDeletePost={handleDeletePost}
        onDeleteComment={handleDeleteComment}
        onCreateOrOpenConversation={handleCreateOrOpenConversation}
        onSharePostAsMessage={handleSharePostAsMessage}
        onSharePost={handleSharePost}
        onToggleSavePost={handleToggleSavePost}
    />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {renderPage()}
    </div>
  );
};

export default App;
