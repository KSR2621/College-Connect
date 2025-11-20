

import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Comment } from '../types';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard'; 
import GroupCard from '../components/GroupCard';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { SearchIcon, UsersIcon, PostIcon, StarIcon, ArrowRightIcon } from '../components/Icons';

interface SearchPageProps {
  currentUser: User;
  users: User[];
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
}

const filterTabs: { id: 'all' | 'people' | 'posts' | 'groups', label: string, icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: SearchIcon },
    { id: 'people', label: 'People', icon: UsersIcon },
    { id: 'posts', label: 'Posts', icon: PostIcon },
    { id: 'groups', label: 'Groups', icon: StarIcon }
];

const SearchPage: React.FC<SearchPageProps> = (props) => {
  const { currentUser, users, posts, groups, onNavigate, currentPath, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost } = props;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'people' | 'posts' | 'groups'>('all');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { people: [], posts: [], groups: [] };
    const lowerCaseQuery = query.toLowerCase();

    const people = users.filter(u => u.name.toLowerCase().includes(lowerCaseQuery) || (u.department && u.department.toLowerCase().includes(lowerCaseQuery)));
    const foundPosts = posts.filter(p => p.content.toLowerCase().includes(lowerCaseQuery));
    const foundGroups = groups.filter(g => g.name.toLowerCase().includes(lowerCaseQuery) || g.description.toLowerCase().includes(lowerCaseQuery));
    
    return { people, posts: foundPosts, groups: foundGroups };
  }, [query, users, posts, groups]);
  
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  const renderResults = () => {
    if (!query) {
      return (
        <div className="text-center text-text-muted mt-16">
            <div className="inline-block p-6 bg-card border border-border rounded-full">
                <SearchIcon className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mt-4">Search CampusConnect</h2>
            <p className="mt-2">Find what you're looking for by typing in the search bar above.</p>
        </div>
      );
    }

    const nothingFound = filteredResults.people.length === 0 && filteredResults.posts.length === 0 && filteredResults.groups.length === 0;
    if (nothingFound) {
      return (
        <div className="text-center text-text-muted mt-16">
            <div className="inline-block p-6 bg-card border border-border rounded-full">
                <SearchIcon className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mt-4">No results found for "{query}"</h2>
            <p className="mt-2">Try searching for something else.</p>
        </div>
      );
    }
    
    // Check if a specific filter has no results
    if (filter === 'people' && filteredResults.people.length === 0) return <p className="text-center text-text-muted mt-8">No people found matching your search.</p>;
    if (filter === 'posts' && filteredResults.posts.length === 0) return <p className="text-center text-text-muted mt-8">No posts found matching your search.</p>;
    if (filter === 'groups' && filteredResults.groups.length === 0) return <p className="text-center text-text-muted mt-8">No groups found matching your search.</p>;

    return (
        <div className="space-y-12">
            {(filter === 'all' || filter === 'people') && filteredResults.people.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">People</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResults.people.map(user => (
                            <div key={user.id} className="bg-card rounded-lg shadow-sm border border-border p-4 text-center flex flex-col items-center">
                               <Avatar src={user.avatarUrl} name={user.name} size="lg" className="mb-3"/>
                               <p className="font-bold text-card-foreground">{user.name}</p>
                               <p className="text-sm text-text-muted mb-4">{user.department}</p>
                               <button 
                                 onClick={() => onNavigate(`#/profile/${user.id}`)} 
                                 className="mt-auto w-full bg-primary/10 text-primary font-semibold py-2 px-4 rounded-lg text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    View Profile <ArrowRightIcon className="w-4 h-4" />
                               </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             {(filter === 'all' || filter === 'groups') && filteredResults.groups.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Groups</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredResults.groups.map(group => <GroupCard key={group.id} group={group} onNavigate={onNavigate}/>)}
                    </div>
                </div>
            )}
            {(filter === 'all' || filter === 'posts') && filteredResults.posts.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Posts</h2>
                    <div className="space-y-6">
                        {filteredResults.posts.map(post => {
                            const author = usersMap[post.authorId];
                            if (!author && !post.isConfession) return null;
                            return <PostCard key={post.id} post={post} author={author} currentUser={currentUser} users={usersMap} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} onToggleSavePost={onToggleSavePost} groups={groups} onNavigate={onNavigate} />
                        })}
                    </div>
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        {/* Search Hero */}
        <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Discover Everything</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                Search for people, posts, and groups across CampusConnect.
                </p>
                <div className="mt-6 max-w-2xl mx-auto">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="w-full bg-input border-2 border-border rounded-full pl-14 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                </div>
                </div>
            </div>
        </div>

        {/* Filter Tabs */}
        {query && (
            <div className="mb-8">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 flex items-center gap-2 ${
                                filter === tab.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-card text-text-muted hover:bg-border border border-border'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        )}
        
        {/* Results */}
        <div className="max-w-4xl mx-auto">
            {renderResults()}
        </div>
      </main>
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default SearchPage;
