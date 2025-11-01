import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import BottomNavBar from '../components/BottomNavBar';
import CreatePostModal from '../components/CreatePostModal';
import { auth } from '../firebase';
import { SearchIcon, PlusCircleIcon } from '../components/Icons';

interface EventsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  events: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
}

const EventsPage: React.FC<EventsPageProps> = (props) => {
  const { currentUser, users, events, groups, onNavigate, currentPath, onAddPost, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const filteredEvents = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return events.filter(post => {
      if (!searchTerm) return true;
      
      const details = post.eventDetails;
      const author = users[post.authorId];

      return (
        details?.title.toLowerCase().includes(lowercasedFilter) ||
        details?.location.toLowerCase().includes(lowercasedFilter) ||
        author?.name.toLowerCase().includes(lowercasedFilter) ||
        post.content.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [events, searchTerm, users]);

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-4 pb-20 md:pb-4">
        {/* Sticky Page Header */}
        <div className="sticky top-[65px] bg-background z-20 py-4 -mx-2 sm:-mx-4 px-2 sm:px-4 mb-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Events 🎉</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="w-full bg-input border-border border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {currentUser.isAdmin && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)} 
                  className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90 flex items-center gap-1"
                >
                  <PlusCircleIcon className="w-5 h-5"/>
                  <span className="hidden sm:inline">Add Event</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Event Feed */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(eventPost => {
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
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-muted mt-24">
            <h2 className="text-xl font-semibold">No Events Found 🎭</h2>
            <p className="mt-2">Check back later or create one for your club!</p>
          </div>
        )}
      </main>

      {currentUser.isAdmin && (
        <CreatePostModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          user={currentUser}
          onAddPost={onAddPost}
          defaultType="event"
        />
      )}
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default EventsPage;