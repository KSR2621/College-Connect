



import React from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import PostCard from '../components/PostCard'; // Re-using PostCard for events
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';

interface EventsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  events: Post[]; // Events are a type of Post
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
}

const EventsPage: React.FC<EventsPageProps> = (props) => {
  const { currentUser, users, events, groups, onNavigate, currentPath, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost } = props;

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        <h1 className="text-3xl font-bold text-foreground mb-6">Upcoming Events</h1>
        <div className="space-y-6 max-w-3xl mx-auto">
          {events.length > 0 ? events.map(eventPost => {
              const author = users[eventPost.authorId];
              if (!author) return null;
              return (
                <PostCard 
                  key={eventPost.id} 
                  post={eventPost}
                  author={author}
                  currentUser={currentUser}
                  users={users}
                  onReaction={onReaction}
                  onAddComment={onAddComment}
                  onDeletePost={onDeletePost}
                  onCreateOrOpenConversation={onCreateOrOpenConversation}
                  onSharePostAsMessage={onSharePostAsMessage}
                  onSharePost={onSharePost}
                  groups={groups}
                />
              )
          }) : (
            <p className="text-center text-text-muted">No upcoming events found.</p>
          )}
        </div>
      </main>
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default EventsPage;