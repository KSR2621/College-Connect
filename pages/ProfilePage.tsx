import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import BottomNavBar from '../components/BottomNavBar';
import PostCard from '../components/PostCard';
import type { User, Post } from '../types';

interface ProfilePageProps {
  currentUser: User;
  allUsers: { [key: string]: User };
  onLogout: () => void;
  onNavigate: (path: string) => void;
  posts: Post[];
  onToggleLike: (postId: string) => void;
  onAddComment: (postId:string, text: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, allUsers, onLogout, onNavigate, posts, onToggleLike, onAddComment }) => {
  const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Determine which user's profile to display
  const profileUserId = window.location.hash.split('/')[2] || currentUser.id;
  const user = allUsers[profileUserId];
  const isOwnProfile = user?.id === currentUser.id;

  const myPosts = posts.filter(post => post.authorId === user?.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
        <div className="min-h-screen bg-background-dark text-text-primary-dark">
            <Header user={currentUser} onLogout={onLogout} onNavigate={onNavigate} />
            <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-text-secondary-dark">User not found.</div>
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={currentUser} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="bg-surface-dark rounded-lg shadow-lg overflow-hidden">
          <div className="h-32 bg-brand-secondary"></div>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-end -mt-20">
              <div className="flex items-end">
                  <Avatar src={user.avatarUrl} alt={user.name} size="lg" />
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full mt-1 inline-block ${
                        user.tag === 'Faculty' ? 'bg-red-500 text-white' : 
                        user.tag === 'Alumni' ? 'bg-green-500 text-white' : 
                        'bg-blue-500 text-white'
                      }`}
                    >
                      {user.tag}
                    </span>
                  </div>
              </div>
              {isOwnProfile && (
                <div className="relative" ref={createMenuRef}>
                  <button 
                    onClick={() => setCreateMenuOpen(prev => !prev)}
                    className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    Create
                  </button>
                  {isCreateMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
                      <a onClick={() => { onNavigate('#/'); setCreateMenuOpen(false); }} className="block px-4 py-2 text-sm text-text-primary-dark hover:bg-gray-700 cursor-pointer">New Post</a>
                      <a onClick={() => { onNavigate('#/'); setCreateMenuOpen(false); }} className="block px-4 py-2 text-sm text-text-primary-dark hover:bg-gray-700 cursor-pointer">New Event</a>
                      <a onClick={() => { onNavigate('#/opportunities?action=create'); setCreateMenuOpen(false); }} className="block px-4 py-2 text-sm text-text-primary-dark hover:bg-gray-700 cursor-pointer">New Opportunity</a>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 border-t border-gray-700 pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-text-secondary-dark">Email</dt>
                  <dd className="mt-1 text-sm text-text-primary-dark">{user.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-text-secondary-dark">Department</dt>
                  <dd className="mt-1 text-sm text-text-primary-dark">{user.department}</dd>
                </div>
                {user.year && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-text-secondary-dark">Year</dt>
                    <dd className="mt-1 text-sm text-text-primary-dark">{user.year}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">{isOwnProfile ? "My Posts" : `${user.name.split(' ')[0]}'s Posts`}</h2>
            {myPosts.length > 0 ? (
              <div className="space-y-6">
                {myPosts.map(post => (
                  <PostCard 
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    users={allUsers}
                    onToggleLike={onToggleLike}
                    onAddComment={onAddComment}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-dark rounded-lg p-6 text-center text-text-secondary-dark">
                  <p>{isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}</p>
              </div>
            )}
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/profile" />
    </div>
  );
};

export default ProfilePage;