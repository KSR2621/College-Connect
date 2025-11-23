
import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import Avatar from '../components/Avatar';
import { SearchIcon, UsersIcon, ArrowRightIcon, CloseIcon } from '../components/Icons';
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
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = (props) => {
  const { currentUser, users, posts, groups, onNavigate, currentPath, ...postCardProps } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'groups' | 'posts'>('all');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  const results = useMemo(() => {
      if (!searchTerm.trim()) return { people: [], groups: [], posts: [] };
      const lower = searchTerm.toLowerCase();
      return {
          people: users.filter(u => u.name.toLowerCase().includes(lower) || u.department.toLowerCase().includes(lower)),
          groups: groups.filter(g => g.name.toLowerCase().includes(lower) || g.description.toLowerCase().includes(lower)),
          posts: posts.filter(p => p.content?.toLowerCase().includes(lower))
      };
  }, [users, groups, posts, searchTerm]);

  const hasResults = results.people.length > 0 || results.groups.length > 0 || results.posts.length > 0;

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8 max-w-5xl">
        
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-3xl shadow-lg border border-border overflow-hidden mb-8 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/5 opacity-50"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20 transform hover:scale-105 transition-transform duration-300">
                    <SearchIcon className="w-8 h-8"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-2">Explore Campus</h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Find students, discover communities, and join the conversation.
                </p>
            </div>
        </div>

        {/* Search Bar Sticky Header */}
        <div className="sticky top-20 z-30 mb-8">
            <div className="bg-card/80 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-border/50 ring-1 ring-black/5 dark:ring-white/5">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for people, groups, or posts..."
                        className="w-full bg-background/50 border-transparent rounded-xl pl-12 pr-10 py-3.5 text-base focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner text-foreground placeholder:text-muted-foreground"
                        autoFocus
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-muted hover:bg-muted-foreground/20 rounded-full text-muted-foreground transition-colors">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {/* Filter Tabs */}
                {searchTerm && (
                    <div className="flex gap-2 mt-2 px-1 pb-1 overflow-x-auto no-scrollbar">
                        {['all', 'people', 'groups', 'posts'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all duration-200 ${
                                    activeTab === tab 
                                    ? 'bg-foreground text-background shadow-md' 
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Results Content */}
        <div className="space-y-8">
            {searchTerm && !hasResults && (
                <div className="text-center py-16">
                    <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <SearchIcon className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No results found</h3>
                    <p className="text-muted-foreground">We couldn't find anything for "{searchTerm}".</p>
                </div>
            )}

            {!searchTerm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
                    <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center">
                        <UsersIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground"/>
                        <p className="text-sm font-medium text-muted-foreground">Find People</p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center">
                        <UsersIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground"/>
                        <p className="text-sm font-medium text-muted-foreground">Join Groups</p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center">
                        <SearchIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground"/>
                        <p className="text-sm font-medium text-muted-foreground">Discover Content</p>
                    </div>
                </div>
            )}

            {/* People Results */}
            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-primary"/> People
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.people.map(user => (
                            <div key={user.id} onClick={() => onNavigate(`#/profile/${user.id}`)} className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <Avatar src={user.avatarUrl} name={user.name} size="lg" className="shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">{user.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{user.department}</p>
                                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${user.tag === 'Student' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {user.tag}
                                    </span>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Groups Results */}
            {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-purple-500"/> Groups
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.groups.map(group => (
                            <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <UsersIcon className="w-6 h-6"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{group.memberIds.length} members</p>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-muted text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    View
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Posts Results */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <SearchIcon className="w-5 h-5 text-amber-500"/> Posts
                    </h3>
                    <div className="max-w-2xl mx-auto">
                        <Feed 
                            posts={results.posts} 
                            users={usersMap} 
                            currentUser={currentUser}
                            groups={groups}
                            onNavigate={onNavigate}
                            {...postCardProps} 
                        />
                    </div>
                </div>
            )}
        </div>
      </main>
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default SearchPage;
