import React, { useState } from 'react';
import Header from '../components/Header';
import CreatePost from '../components/CreatePost';
import Feed from '../components/Feed';
import ChatPanel from '../components/ChatPanel';
import BottomNavBar from '../components/BottomNavBar';
import type { Post, User, Conversation } from '../types';

interface HomePageProps {
  user: User;
  users: { [key: string]: User };
  onLogout: () => void;
  onNavigate: (path: string) => void;
  posts: Post[];
  conversations: Conversation[];
  onAddPost: (postDetails: {
    content: string;
    mediaFile?: File | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string };
  }) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  users,
  onLogout,
  onNavigate,
  posts,
  conversations,
  onAddPost,
  onToggleLike,
  onAddComment,
  onSendMessage,
  onCreateOrOpenConversation,
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  // Separate posts into events for the upcoming events section
  const eventPosts = posts.filter(p => p.eventType === 'event');

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <CreatePost user={user} onAddPost={onAddPost} />
            
            {/* Upcoming Events Section */}
            {eventPosts.length > 0 && (
              <div className="bg-surface-dark rounded-lg shadow-lg">
                <div className="p-4 sm:p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-text-primary-dark">Upcoming Events</h2>
                  <a 
                    href="#/events" 
                    onClick={(e) => { e.preventDefault(); onNavigate('#/events'); }}
                    className="text-sm font-semibold text-brand-secondary hover:underline"
                  >
                    See all
                  </a>
                </div>
                <div className="border-t border-gray-700">
                  <Feed
                    posts={eventPosts.slice(0, 3)} // Show top 3 recent events
                    currentUser={user}
                    users={users}
                    onToggleLike={onToggleLike}
                    onAddComment={onAddComment}
                  />
                </div>
              </div>
            )}
            
            {posts.length > 0 && <h2 className="text-xl font-bold text-text-primary-dark pt-4">Feed</h2>}
            <Feed
              posts={posts} // Display all posts in the main feed
              currentUser={user}
              users={users}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
            />
          </div>
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-6">
              <div className="h-[calc(100vh-8rem)]">
                <ChatPanel 
                  conversations={conversations}
                  currentUser={user}
                  users={users}
                  onSendMessage={onSendMessage}
                  onCreateOrOpenConversation={onCreateOrOpenConversation}
                  activeConversationId={activeConversationId}
                  setActiveConversationId={setActiveConversationId}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/" />
    </div>
  );
};

export default HomePage;