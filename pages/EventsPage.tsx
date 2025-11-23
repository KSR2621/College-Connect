
import React, { useState } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import CreatePostModal from '../components/CreatePostModal';
import { CalendarIcon, PlusIcon } from '../components/Icons';
import { auth } from '../firebase';

interface EventsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  events: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  // postCardProps
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
}

const EventsPage: React.FC<EventsPageProps> = (props) => {
  const { currentUser, users, events, groups, onNavigate, currentPath, onAddPost, ...postCardProps } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-4">
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/10 opacity-50"></div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">What's Happening?</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                    Discover workshops, seminars, and social gatherings happening across campus.
                </p>
                <button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-secondary text-secondary-foreground font-bold py-3 px-6 rounded-full hover:bg-secondary/90 transition-transform transform hover:scale-105 inline-flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Create Event
                </button>
            </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
            <Feed 
                posts={events.sort((a, b) => (b.eventDetails?.date ? new Date(b.eventDetails.date).getTime() : 0) - (a.eventDetails?.date ? new Date(a.eventDetails.date).getTime() : 0))}
                users={users}
                currentUser={currentUser}
                groups={groups}
                onNavigate={onNavigate}
                {...postCardProps}
            />
        </div>
      </main>

      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={currentUser}
        onAddPost={onAddPost}
        defaultType="event"
      />

      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default EventsPage;
