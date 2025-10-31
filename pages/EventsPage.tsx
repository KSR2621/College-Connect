import React from 'react';
import Header from '../components/Header';
import Feed from '../components/Feed';
import BottomNavBar from '../components/BottomNavBar';
import type { Post, User } from '../types';

interface EventsPageProps {
  user: User;
  users: { [key: string]: User };
  onLogout: () => void;
  onNavigate: (path: string) => void;
  posts: Post[];
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ user, users, onLogout, onNavigate, posts, onToggleLike, onAddComment }) => {
  const eventPosts = posts.filter(post => post.eventType === 'event');

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Upcoming Events</h1>
                <p className="mt-2 text-text-secondary-dark">Discover what's happening on campus.</p>
            </div>
            {eventPosts.length > 0 ? (
                <Feed
                    posts={eventPosts}
                    currentUser={user}
                    users={users}
                    onToggleLike={onToggleLike}
                    onAddComment={onAddComment}
                />
            ) : (
                <div className="text-center py-12 bg-surface-dark rounded-lg">
                    <p className="text-text-secondary-dark">No events posted yet. Check back soon!</p>
                </div>
            )}
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/events" />
    </div>
  );
};

export default EventsPage;