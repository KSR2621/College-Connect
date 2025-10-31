import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import { SearchIcon } from '../components/Icons';
import type { User, Post } from '../types';

interface SearchPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ currentUser, users, posts, onLogout, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = Object.values(users).filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) && u.id !== currentUser.id
    );
    setSearchResults(results);
  }, [searchQuery, users, currentUser.id]);

  const handleResultClick = (userId: string) => {
    onNavigate(`#/profile/${userId}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const mediaPosts = posts.filter(p => p.imageUrl || p.videoUrl);

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={currentUser} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search for users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-dark text-text-primary-dark rounded-lg py-3 pl-10 pr-4 border border-gray-600 focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
          />
        </div>

        {searchQuery.trim() === '' ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Explore</h2>
            {mediaPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                {mediaPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-surface-dark overflow-hidden">
                        {post.imageUrl && <img src={post.imageUrl} alt="Post media" className="w-full h-full object-cover" />}
                        {post.videoUrl && <video src={post.videoUrl} className="w-full h-full object-cover" />}
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-surface-dark rounded-lg">
                    <p className="text-text-secondary-dark">No media posts to explore yet.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-dark rounded-lg">
            {searchResults.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {searchResults.map(result => (
                  <li
                    key={result.id}
                    onClick={() => handleResultClick(result.id)}
                    className="flex items-center p-4 hover:bg-gray-700 cursor-pointer"
                  >
                    <Avatar src={result.avatarUrl} alt={result.name} size="md" />
                    <span className="ml-4 font-semibold">{result.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
                <div className="p-6 text-center text-text-secondary-dark">
                    No users found.
                </div>
            )}
          </div>
        )}
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/search" />
    </div>
  );
};

export default SearchPage;