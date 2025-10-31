
import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Removed v9 modular imports from 'firebase/*' as they were causing errors.
// Using v8 compat syntax with instances imported from local firebase setup.
import { auth, db, storage, FieldValue } from './firebase';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WelcomePage from './pages/WelcomePage';
import GroupsPage from './pages/GroupsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import EventsPage from './pages/EventsPage';
import SearchPage from './pages/SearchPage';

import type { User, Post, Comment, Conversation, Message, Opportunity } from './types';
import type { SignupFormFields } from './pages/SignupPage';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/welcome');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const swipeThreshold = 50;

  const navigate = useCallback((path: string) => {
    setRoute(path);
    window.location.hash = path;
  }, []);

  useEffect(() => {
    // FIX: Changed from onAuthStateChanged(auth, ...) to auth.onAuthStateChanged(...) for v8 compat.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // FIX: Changed from doc(db, 'users', user.uid) to db.collection('users').doc(user.uid) for v8 compat.
        const userDocRef = db.collection('users').doc(user.uid);
        // FIX: Changed from getDoc(userDocRef) to userDocRef.get() for v8 compat.
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          setCurrentUser({ id: user.uid, ...userDoc.data() } as User);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!currentUser) {
      setUsers({});
      setPosts([]);
      setConversations([]);
      setOpportunities([]);
      return;
    }

    // FIX: Changed from onSnapshot(collection(...)) to db.collection(...).onSnapshot() for v8 compat.
    const usersUnsub = db.collection("users").onSnapshot((snapshot) => {
        const usersData: { [key: string]: User } = {};
        snapshot.forEach(doc => {
            usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
        });
        setUsers(usersData);
    });

    // FIX: Changed from query(collection(...), orderBy(...)) to db.collection(...).orderBy(...) for v8 compat.
    const postsQuery = db.collection("posts").orderBy("timestamp", "desc");
    // FIX: Changed from onSnapshot(query, ...) to query.onSnapshot(...) for v8 compat.
    const postsUnsub = postsQuery.onSnapshot((snapshot) => {
        const postsData: Post[] = [];
        snapshot.forEach(doc => {
            postsData.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(postsData);
    });
    
    // FIX: Changed from query(collection(...), where(...)) to db.collection(...).where(...) for v8 compat.
    const convosQuery = db.collection("conversations").where("participantIds", "array-contains", currentUser.id);
    // FIX: Changed from onSnapshot(query, ...) to query.onSnapshot(...) for v8 compat.
    const convosUnsub = convosQuery.onSnapshot((snapshot) => {
        const convosData: Conversation[] = [];
        snapshot.forEach(doc => {
            convosData.push({ id: doc.id, ...doc.data() } as Conversation);
        });
        setConversations(convosData);
    });
    
    // FIX: Changed from query(collection(...), orderBy(...)) to db.collection(...).orderBy(...) for v8 compat.
    const opportunitiesQuery = db.collection("opportunities").orderBy("timestamp", "desc");
    // FIX: Changed from onSnapshot(query, ...) to query.onSnapshot(...) for v8 compat.
    const opportunitiesUnsub = opportunitiesQuery.onSnapshot((snapshot) => {
      const opportunitiesData: Opportunity[] = [];
      snapshot.forEach(doc => {
        opportunitiesData.push({ id: doc.id, ...doc.data() } as Opportunity);
      });
      setOpportunities(opportunitiesData);
    });

    return () => {
        usersUnsub();
        postsUnsub();
        convosUnsub();
        opportunitiesUnsub();
    };
  }, [currentUser]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/welcome');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  useEffect(() => {
    const baseRoute = route.split('?')[0];
    if (authReady && !currentUser && baseRoute !== '#/login' && baseRoute !== '#/signup' && baseRoute !== '#/welcome') {
      navigate('#/welcome');
    }
  }, [currentUser, route, navigate, authReady]);

  const handleLogin = async (email: string, password: string): Promise<void> => {
    // FIX: Changed from signInWithEmailAndPassword(auth, ...) to auth.signInWithEmailAndPassword(...) for v8 compat.
    await auth.signInWithEmailAndPassword(email, password);
    navigate('#/');
  };

  const handleSignup = async (formData: SignupFormFields): Promise<void> => {
    // FIX: Changed from createUserWithEmailAndPassword(auth, ...) to auth.createUserWithEmailAndPassword(...) for v8 compat.
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const newUser: Omit<User, 'id'> = {
        name: formData.name,
        email: formData.email,
        tag: formData.tag,
        department: formData.department,
        avatarUrl: `https://picsum.photos/seed/${formData.name.split(' ')[0]}/100/100`,
        year: formData.tag === 'Student' ? 1 : undefined,
    };
    if (!userCredential.user) {
        throw new Error("User creation failed, user object is null.");
    }
    // FIX: Changed from setDoc(doc(...)) to db.collection(...).doc(...).set() for v8 compat.
    await db.collection("users").doc(userCredential.user.uid).set(newUser);
    navigate('#/');
  };

  const handleLogout = useCallback(async () => {
    // FIX: Changed from signOut(auth) to auth.signOut() for v8 compat.
    await auth.signOut();
    navigate('#/welcome');
  }, [navigate]);

  const handleAddPost = useCallback(async (postDetails: {
    content: string;
    mediaFile?: File | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string };
  }) => {
    if (!currentUser) return;

    const { content, mediaFile, mediaType, eventDetails } = postDetails;
    let postData: Partial<Post> = {};

    if (mediaFile && mediaType) {
      // FIX: Changed from ref(storage, ...) to storage.ref(...) for v8 compat.
      const mediaRef = storage.ref(`posts/${currentUser.id}/${Date.now()}_${mediaFile.name}`);
      // FIX: Changed from uploadBytes(...) to mediaRef.put(...) for v8 compat.
      await mediaRef.put(mediaFile);
      // FIX: Changed from getDownloadURL(...) to mediaRef.getDownloadURL() for v8 compat.
      const downloadURL = await mediaRef.getDownloadURL();
      if (mediaType === 'image') {
        postData.imageUrl = downloadURL;
      } else if (mediaType === 'video') {
        postData.videoUrl = downloadURL;
      }
    }
    
    const newPost: Omit<Post, 'id'> = {
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      ...postData,
    };

    if (eventDetails) {
        newPost.eventType = 'event';
        newPost.eventTitle = eventDetails.title;
        newPost.eventDate = eventDetails.date;
        newPost.eventLocation = eventDetails.location;
    }

    // FIX: Changed from addDoc(collection(...)) to db.collection(...).add() for v8 compat.
    await db.collection("posts").add(newPost);
  }, [currentUser]);

  const handleToggleLike = useCallback(async (postId: string) => {
    if (!currentUser) return;
    // FIX: Changed from doc(db, ...) to db.collection(...).doc(...) for v8 compat.
    const postRef = db.collection("posts").doc(postId);
    const post = posts.find(p => p.id === postId);
    if (post) {
      const isLiked = post.likes.includes(currentUser.id);
      // FIX: Changed from updateDoc(..., { likes: arrayUnion(...) }) to postRef.update({ likes: FieldValue.arrayUnion(...) }) for v8 compat.
      await postRef.update({
        likes: isLiked ? FieldValue.arrayRemove(currentUser.id) : FieldValue.arrayUnion(currentUser.id)
      });
    }
  }, [currentUser, posts]);

  const handleAddComment = useCallback(async (postId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    // FIX: Changed from doc(db, ...) to db.collection(...).doc(...) for v8 compat.
    const postRef = db.collection("posts").doc(postId);
    // FIX: Changed from updateDoc(..., { comments: arrayUnion(...) }) to postRef.update({ comments: FieldValue.arrayUnion(...) }) for v8 compat.
    await postRef.update({
        comments: FieldValue.arrayUnion(newComment)
    });
  }, [currentUser]);

  const handleSendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    // FIX: Changed from doc(db, ...) to db.collection(...).doc(...) for v8 compat.
    const convoRef = db.collection("conversations").doc(conversationId);
    // FIX: Changed from updateDoc(..., { messages: arrayUnion(...) }) to convoRef.update({ messages: FieldValue.arrayUnion(...) }) for v8 compat.
    await convoRef.update({
        messages: FieldValue.arrayUnion(newMessage)
    });
  }, [currentUser]);
  
  const handleAddOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'authorId' | 'timestamp'>) => {
    if (!currentUser) return;

    const newOpportunity: Omit<Opportunity, 'id'> = {
      ...opportunityData,
      authorId: currentUser.id,
      timestamp: new Date().toISOString(),
    };
    // FIX: Changed from addDoc(collection(...)) to db.collection(...).add() for v8 compat.
    await db.collection("opportunities").add(newOpportunity);
  }, [currentUser]);

  const handleCreateOrOpenConversation = useCallback(async (otherUserId: string): Promise<string> => {
    if (!currentUser) throw new Error("User not authenticated");

    const existingConvo = conversations.find(c => 
        c.participantIds.length === 2 && 
        c.participantIds.includes(currentUser.id) && 
        c.participantIds.includes(otherUserId)
    );

    if (existingConvo) {
        return existingConvo.id;
    }

    const newConvoData: Omit<Conversation, 'id'> = {
        participantIds: [currentUser.id, otherUserId],
        messages: [],
    };
    // FIX: Changed from addDoc(collection(...)) to db.collection(...).add() for v8 compat.
    const newConvoRef = await db.collection("conversations").add(newConvoData);
    return newConvoRef.id;

  }, [currentUser, conversations]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > swipeThreshold;
    
    const baseRoute = route.split('?')[0];
    if (isLeftSwipe && (baseRoute === '#/' || baseRoute === '')) {
      navigate('#/chat');
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  if (!authReady) {
    return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>;
  }

  const baseRoute = route.split('?')[0];

  if (!currentUser) {
    if (baseRoute === '#/signup') {
      return <SignupPage onSignup={handleSignup} onNavigate={navigate} />;
    }
    if (baseRoute === '#/login') {
      return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
    }
    return <WelcomePage onNavigate={navigate} />;
  }
  
  const renderPage = () => {
    if (baseRoute.startsWith('#/profile')) {
       return <ProfilePage 
        key={route}
        currentUser={currentUser} 
        allUsers={users}
        onLogout={handleLogout} 
        onNavigate={navigate}
        posts={posts}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
      />;
    }

    switch(baseRoute) {
      case '#/groups':
        return <GroupsPage user={currentUser} onLogout={handleLogout} onNavigate={navigate} />;
      case '#/events':
        return <EventsPage 
            user={currentUser}
            users={users}
            onLogout={handleLogout}
            onNavigate={navigate}
            posts={posts}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
          />;
      case '#/search':
        return <SearchPage
            currentUser={currentUser}
            users={users}
            posts={posts}
            onLogout={handleLogout}
            onNavigate={navigate}
          />;
      case '#/opportunities':
        return <OpportunitiesPage 
            user={currentUser} 
            users={users}
            onLogout={handleLogout} 
            onNavigate={navigate} 
            opportunities={opportunities} 
            onAddOpportunity={handleAddOpportunity}
        />;
      case '#/chat':
        return <ChatPage 
            user={currentUser} 
            onLogout={handleLogout} 
            onNavigate={navigate} 
            conversations={conversations} 
            onSendMessage={handleSendMessage} 
            users={users}
            onCreateOrOpenConversation={handleCreateOrOpenConversation}
         />;
      case '#/':
      default:
        return <HomePage
          user={currentUser}
          users={users}
          onLogout={handleLogout}
          onNavigate={navigate}
          posts={posts}
          conversations={conversations}
          onAddPost={handleAddPost}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onSendMessage={handleSendMessage}
          onCreateOrOpenConversation={handleCreateOrOpenConversation}
         />;
    }
  }
  
  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
       {renderPage()}
    </div>
  );
};

export default App;
