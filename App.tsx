import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WelcomePage from './pages/WelcomePage';
import GroupsPage from './pages/GroupsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import { MOCK_USERS, MOCK_POSTS, MOCK_CONVERSATIONS } from './constants';
import type { User, Post, Comment, Conversation, Message } from './types';

// localStorage keys
const USERS_KEY = 'campusconnect_users';
const POSTS_KEY = 'campusconnect_posts';
const CONVERSATIONS_KEY = 'campusconnect_conversations';
const CURRENT_USER_ID_KEY = 'campusconnect_currentUserId';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/welcome');
  
  // Initialize state from localStorage or fall back to mock data
  const [users, setUsers] = useState<{ [key: string]: User }>(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      return storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
    } catch (error) {
      console.error("Error parsing users from localStorage:", error);
      return MOCK_USERS;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const storedPosts = localStorage.getItem(POSTS_KEY);
      return storedPosts ? JSON.parse(storedPosts) : MOCK_POSTS;
    } catch (error) {
      console.error("Error parsing posts from localStorage:", error);
      return MOCK_POSTS;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const storedConvos = localStorage.getItem(CONVERSATIONS_KEY);
      return storedConvos ? JSON.parse(storedConvos) : MOCK_CONVERSATIONS;
    } catch (error) {
      console.error("Error parsing conversations from localStorage:", error);
      return MOCK_CONVERSATIONS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
      const allUsersData = localStorage.getItem(USERS_KEY);
      const allUsers = allUsersData ? JSON.parse(allUsersData) : MOCK_USERS;
      if (storedUserId && allUsers[storedUserId]) {
        return allUsers[storedUserId];
      }
      return null;
    } catch (error) {
      console.error("Error parsing current user from localStorage:", error);
      return null;
    }
  });

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to localStorage:", error);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error("Error saving posts to localStorage:", error);
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error saving conversations to localStorage:", error);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
      } else {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
      }
    } catch (error) {
      console.error("Error saving current user to localStorage:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/welcome');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const navigate = useCallback((path: string) => {
    setRoute(path);
    window.location.hash = path;
  }, []);

  useEffect(() => {
    if (!currentUser && route !== '#/login' && route !== '#/signup' && route !== '#/welcome') {
      navigate('#/welcome');
    }
  }, [currentUser, route, navigate]);

  const handleLogin = useCallback((email: string, password: string): boolean => {
    // FIX: Explicitly type the parameter `u` as `User` to resolve type inference issues.
    const user = Object.values(users).find((u: User) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      navigate('#/');
      return true;
    }
    return false;
  }, [users, navigate]);

  const handleSignup = useCallback((newUser: Omit<User, 'id'>): boolean => {
    // FIX: Explicitly type the parameter `user` as `User` to resolve type inference issues.
    const emailExists = Object.values(users).some((user: User) => user.email === newUser.email);
    if (emailExists) {
      return false; 
    }
    
    const newId = `user-${Date.now()}`;
    const userWithId: User = { ...newUser, id: newId };
    setUsers(prevUsers => ({ ...prevUsers, [newId]: userWithId }));
    setCurrentUser(userWithId);
    navigate('#/');
    return true;
  }, [users, navigate]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    navigate('#/welcome');
  }, [navigate]);

  const handleAddPost = useCallback((content: string) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  }, [currentUser]);

  const handleToggleLike = useCallback((postId: string) => {
    if (!currentUser) return;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const newLikes = post.likes.includes(currentUser.id)
            ? post.likes.filter(id => id !== currentUser.id)
            : [...post.likes, currentUser.id];
          return { ...post, likes: newLikes };
        }
        return post;
      })
    );
  }, [currentUser]);

  const handleAddComment = useCallback((postId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      text,
      timestamp: new Date().toISOString(),
    };
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
      })
    );
  }, [currentUser]);

  const handleSendMessage = useCallback((conversationId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };

    setConversations(prevConvos => 
      prevConvos.map(convo => {
        if (convo.id === conversationId) {
          return { ...convo, messages: [...convo.messages, newMessage] };
        }
        return convo;
      })
    );
  }, [currentUser]);

  if (!currentUser) {
    if (route === '#/signup') {
      return <SignupPage onSignup={handleSignup} onNavigate={navigate} />;
    }
    if (route === '#/login') {
      return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
    }
    return <WelcomePage onNavigate={navigate} />;
  }

  switch(route) {
    case '#/groups':
      return <GroupsPage user={currentUser} onLogout={handleLogout} onNavigate={navigate} />;
    case '#/opportunities':
      return <OpportunitiesPage user={currentUser} onLogout={handleLogout} onNavigate={navigate} />;
    case '#/chat':
      return <ChatPage user={currentUser} onLogout={handleLogout} onNavigate={navigate} conversations={conversations} onSendMessage={handleSendMessage} />;
    case '#/profile':
      return <ProfilePage user={currentUser} onLogout={handleLogout} onNavigate={navigate} />;
    case '#/':
    default:
      return <HomePage
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={navigate}
        posts={posts}
        conversations={conversations}
        onAddPost={handleAddPost}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        onSendMessage={handleSendMessage}
       />;
  }
};

export default App;