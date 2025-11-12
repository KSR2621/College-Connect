import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Comment } from '../types';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import BottomNavBar from '../components/BottomNavBar';
import CreatePostModal from '../components/CreatePostModal';
import { auth } from '../firebase';
import { SearchIcon, PlusCircleIcon, CalendarIcon } from '../components/Icons';

interface EventsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  events: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; mediaDataUrls?: string[] | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; link?: string; }; }) => void;
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
  const { currentUser, users, events, groups, onNavigate, currentPath, onAddPost, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const canCreateEvent = (currentUser.tag === 'Teacher' || currentUser.tag === 'HOD/Dean' || currentUser.tag === 'Director') && currentUser.isApproved !== false;

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const lowercasedFilter = searchTerm.toLowerCase();

    return events
      .filter(post => {
        if (!post.eventDetails) return false;
        const eventDate = new Date(post.eventDetails.date);
        if (filter === 'upcoming' && eventDate < now) return false;
        if (filter === 'past' && eventDate >= now) return false;
        return true;
      })
      .filter(post => {
        if (!searchTerm) return true;
      
        const details = post.eventDetails;
        const author = users[post.authorId];

        return (
          details?.title.toLowerCase().includes(lowercasedFilter) ||
          details?.location.toLowerCase().includes(lowercasedFilter) ||
          author?.name.toLowerCase().includes(lowercasedFilter) ||
          post.content.toLowerCase().includes(lowercasedFilter)
        );
      })
      .sort((a, b) => {
          const dateA = new Date(a.eventDetails!.date).getTime();
          const dateB = new Date(b.eventDetails!.date).getTime();
          return filter === 'upcoming' ? dateA - dateB : dateB - dateA;
      });
  }, [events, searchTerm, users, filter]);

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
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
            </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search events..."
                        className="w-full bg-card border-border border rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                {canCreateEvent && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        Add Event
                    </button>
                )}
            </div>
             {/* Filter Tabs */}
            <div className="mt-6 border-b border-border flex justify-center">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            filter === 'upcoming'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`transition-colors duration-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            filter === 'past'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                        }`}
                    >
                        Past
                    </button>
                </nav>
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
                  onDeleteComment={onDeleteComment}
                  onCreateOrOpenConversation={onCreateOrOpenConversation}
                  onSharePostAsMessage={onSharePostAsMessage}
                  onSharePost={onSharePost}
                  onToggleSavePost={onToggleSavePost}
                  groups={groups}
                  // FIX: Pass the onNavigate prop to satisfy the PostCardProps interface.
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-muted mt-24">
            <div className="inline-block p-6 bg-card border border-border rounded-full">
              <CalendarIcon className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mt-4">No {filter} events found</h2>
            <p className="mt-2">Check back later or adjust your search term.</p>
          </div>
        )}
      </main>

      {canCreateEvent && (
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