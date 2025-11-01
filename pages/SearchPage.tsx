



import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard'; 
import GroupCard from '../components/GroupCard';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';

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
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
}

const SearchPage: React.FC<SearchPageProps> = (props) => {
  const { currentUser, users, posts, groups, onNavigate, currentPath, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost } = props;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'people' | 'posts' | 'groups'>('all');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const filteredResults = useMemo(() => {
    if (!query) return { people: [], posts: [], groups: [] };
    const lowerCaseQuery = query.toLowerCase();

    const people = users.filter(u => u.name.toLowerCase().includes(lowerCaseQuery) || (u.department && u.department.toLowerCase().includes(lowerCaseQuery)));
    const foundPosts = posts.filter(p => p.content.toLowerCase().includes(lowerCaseQuery));
    const foundGroups = groups.filter(g => g.name.toLowerCase().includes(lowerCaseQuery) || g.description.toLowerCase().includes(lowerCaseQuery));
    
    return { people, posts: foundPosts, groups: foundGroups };
  }, [query, users, posts, groups]);
  
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  const renderResults = () => {
    if (!query) {
        return <p className="text-center text-text-muted mt-8">Start typing to search for people, posts, or groups.</p>;
    }

    const nothingFound = filteredResults.people.length === 0 && filteredResults.posts.length === 0 && filteredResults.groups.length === 0;
    if (nothingFound) {
        return <p className="text-center text-text-muted mt-8">No results found for "{query}".</p>;
    }
    
    return (
        <div className="space-y-8 mt-6">
            {(filter === 'all' || filter === 'people') && filteredResults.people.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">People</h2>
                    <div className="space-y-3">
                    {filteredResults.people.map(user => (
                        <div key={user.id} className="flex items-center p-3 bg-card rounded-lg cursor-pointer hover:bg-muted border border-border" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                           <Avatar src={user.avatarUrl} name={user.name} />
                           <div className="ml-3">
                               <p className="font-semibold text-card-foreground">{user.name}</p>
                               <p className="text-sm text-text-muted">{user.department}</p>
                           </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
            {(filter === 'all' || filter === 'groups') && filteredResults.groups.length > 0 && (
                 <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">Groups</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredResults.groups.map(group => <GroupCard key={group.id} group={group} onNavigate={onNavigate}/>)}
                    </div>
                </div>
            )}
            {(filter === 'all' || filter === 'posts') && filteredResults.posts.length > 0 && (
                 <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">Posts</h2>
                    <div className="space-y-4">
                        {filteredResults.posts.map(post => {
                            const author = usersMap[post.authorId];
                            if (!author && !post.isConfession) return null;
                            return <PostCard key={post.id} post={post} author={author} currentUser={currentUser} users={usersMap} onReaction={onReaction} onAddComment={onAddComment} onDeletePost={onDeletePost} onCreateOrOpenConversation={onCreateOrOpenConversation} onSharePostAsMessage={onSharePostAsMessage} onSharePost={onSharePost} groups={groups} />
                        })}
                    </div>
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-6">Search</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search CampusConnect..."
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            {/* Filters can be added here */}
            {renderResults()}
        </div>
      </main>
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default SearchPage;