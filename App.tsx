import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth.js';
import { doc, setDoc, getDoc, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage.js';
import { auth, db, storage } from './firebase';

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
  
  // Swipe navigation state
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const swipeThreshold = 50;


  // Navigation handler
  const navigate = useCallback((path: string) => {
    setRoute(path);
    window.location.hash = path;
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, ...userDoc.data() } as User);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  
  // Firestore listeners
  useEffect(() => {
    if (!currentUser) {
      setUsers({});
      setPosts([]);
      setConversations([]);
      setOpportunities([]);
      return;
    }

    // Listen for all users
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersData: { [key: string]: User } = {};
        snapshot.forEach(doc => {
            usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
        });
        setUsers(usersData);
    });

    // Listen for posts
    const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const postsUnsub = onSnapshot(postsQuery, (snapshot) => {
        const postsData: Post[] = [];
        snapshot.forEach(doc => {
            postsData.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(postsData);
    });
    
    // Listen for conversations
    const convosQuery = query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.id));
    const convosUnsub = onSnapshot(convosQuery, (snapshot) => {
        const convosData: Conversation[] = [];
        snapshot.forEach(doc => {
            convosData.push({ id: doc.id, ...doc.data() } as Conversation);
        });
        setConversations(convosData);
    });
    
    // Listen for opportunities
    const opportunitiesQuery = query(collection(db, "opportunities"), orderBy("timestamp", "desc"));
    const opportunitiesUnsub = onSnapshot(opportunitiesQuery, (snapshot) => {
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

  // Route handling
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


  // Firebase-backed handlers
  const handleLogin = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
    navigate('#/');
  };

  const handleSignup = async (formData: SignupFormFields): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const newUser: Omit<User, 'id'> = {
        name: formData.name,
        email: formData.email,
        tag: formData.tag,
        department: formData.department,
        avatarUrl: `https://picsum.photos/seed/${formData.name.split(' ')[0]}/100/100`,
        year: formData.tag === 'Student' ? 1 : undefined,
    };
    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    navigate('#/');
  };

  const handleLogout = useCallback(async () => {
    await signOut(auth);
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
      const mediaRef = ref(storage, `posts/${currentUser.id}/${Date.now()}_${mediaFile.name}`);
      await uploadBytes(mediaRef, mediaFile);
      const downloadURL = await getDownloadURL(mediaRef);
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

    await addDoc(collection(db, "posts"), newPost);
  }, [currentUser]);

  const handleToggleLike = useCallback(async (postId: string) => {
    if (!currentUser) return;
    const postRef = doc(db, "posts", postId);
    const post = posts.find(p => p.id === postId);
    if (post) {
      const isLiked = post.likes.includes(currentUser.id);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
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
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
        comments: arrayUnion(newComment)
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
    const convoRef = doc(db, "conversations", conversationId);
    await updateDoc(convoRef, {
        messages: arrayUnion(newMessage)
    });
  }, [currentUser]);
  
  const handleAddOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'authorId' | 'timestamp'>) => {
    if (!currentUser) return;

    const newOpportunity: Omit<Opportunity, 'id'> = {
      ...opportunityData,
      authorId: currentUser.id,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, "opportunities"), newOpportunity);
  }, [currentUser]);

  const handleCreateOrOpenConversation = useCallback(async (otherUserId: string): Promise<string> => {
    if (!currentUser) throw new Error("User not authenticated");

    // Check if a conversation already exists
    const existingConvo = conversations.find(c => 
        c.participantIds.length === 2 && 
        c.participantIds.includes(currentUser.id) && 
        c.participantIds.includes(otherUserId)
    );

    if (existingConvo) {
        return existingConvo.id;
    }

    // If not, create a new one
    const newConvoData: Omit<Conversation, 'id'> = {
        participantIds: [currentUser.id, otherUserId],
        messages: [],
    };
    const newConvoRef = await addDoc(collection(db, "conversations"), newConvoData);
    return newConvoRef.id;

  }, [currentUser, conversations]);
  
  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null; // reset touch end on new start
    touchStartRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > swipeThreshold;
    
    // Only swipe from home page
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
        key={route} // Force re-render on hash change
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