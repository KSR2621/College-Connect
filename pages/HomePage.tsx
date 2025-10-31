import React from 'react';
import Header from '../components/Header';
import CreatePost from '../components/CreatePost';
import Feed from '../components/Feed';
import ChatPanel from '../components/ChatPanel';
import type { Post, User, Conversation } from '../types';

interface HomePageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  posts: Post[];
  conversations: Conversation[];
  onAddPost: (content: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  onLogout,
  onNavigate,
  posts,
  conversations,
  onAddPost,
  onToggleLike,
  onAddComment,
  onSendMessage,
}) => {
  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <CreatePost user={user} onAddPost={onAddPost} />
            <Feed
              posts={posts}
              currentUser={user}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
            />
          </div>
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-6">
              <ChatPanel 
                conversations={conversations}
                currentUser={user}
                onSendMessage={onSendMessage}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default HomePage;