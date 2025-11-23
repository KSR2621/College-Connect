
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
    <div className="bg-muted/30 dark:bg-background min-h-screen transition-colors duration-300">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8 max-w-5xl">
        
        {/* Hero Section */}
        <div className="relative bg-card dark:bg-slate-900/50 p-8 rounded-3xl shadow-lg border border-border dark:border-slate-800 overflow-hidden mb-8 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/5 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-purple-500/10 opacity-100"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl"></div>
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
            <div className="bg-card/80 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-lg shadow-black/5 border border-border/50 dark:border-slate-700/50 ring-1 ring-black/5 dark:ring-white/5">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for people, groups, or posts..."
                        className="w-full bg-muted/50 dark:bg-slate-800 border-transparent rounded-xl pl-12 pr-10 py-3.5 text-base focus:outline-none focus:bg-background dark:focus:bg-slate-950 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-inner text-foreground placeholder:text-muted-foreground"
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
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all duration-200 border ${
                                    activeTab === tab 
                                    ? 'bg-foreground text-background border-foreground shadow-md' 
                                    : 'bg-muted/50 dark:bg-slate-800/50 text-muted-foreground border-transparent hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground'
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
                    <div className="bg-muted/30 dark:bg-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-border dark:border-slate-700">
                        <SearchIcon className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No results found</h3>
                    <p className="text-muted-foreground">We couldn't find anything for "{searchTerm}".</p>
                </div>
            )}

            {!searchTerm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 border-2 border-dashed border-border/50 dark:border-slate-700 bg-card/50 dark:bg-slate-900/30 rounded-3xl text-center transition-all hover:border-primary/30 hover:bg-card dark:hover:bg-slate-800 group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UsersIcon className="w-6 h-6 text-primary"/>
                        </div>
                        <p className="text-sm font-bold text-foreground">Find People</p>
                        <p className="text-xs text-muted-foreground mt-1">Connect with classmates</p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-border/50 dark:border-slate-700 bg-card/50 dark:bg-slate-900/30 rounded-3xl text-center transition-all hover:border-purple-500/30 hover:bg-card dark:hover:bg-slate-800 group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UsersIcon className="w-6 h-6 text-purple-500"/>
                        </div>
                        <p className="text-sm font-bold text-foreground">Join Groups</p>
                        <p className="text-xs text-muted-foreground mt-1">Discover communities</p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-border/50 dark:border-slate-700 bg-card/50 dark:bg-slate-900/30 rounded-3xl text-center transition-all hover:border-amber-500/30 hover:bg-card dark:hover:bg-slate-800 group">
                        <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <SearchIcon className="w-6 h-6 text-amber-500"/>
                        </div>
                        <p className="text-sm font-bold text-foreground">Discover Content</p>
                        <p className="text-xs text-muted-foreground mt-1">Search posts and news</p>
                    </div>
                </div>
            )}

            {/* People Results */}
            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg"><UsersIcon className="w-4 h-4 text-primary"/></div>
                        People
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.people.map(user => (
                            <div key={user.id} onClick={() => onNavigate(`#/profile/${user.id}`)} className="bg-card dark:bg-slate-900 p-4 rounded-2xl border border-border dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <Avatar src={user.avatarUrl} name={user.name} size="lg" className="shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">{user.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{user.department}</p>
                                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${user.tag === 'Student' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {user.tag}
                                    </span>
                                </div>
                                <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                    <ArrowRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Groups Results */}
            {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/10 rounded-lg"><UsersIcon className="w-4 h-4 text-purple-500"/></div>
                        Groups
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.groups.map(group => (
                            <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card dark:bg-slate-900 p-5 rounded-2xl border border-border dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <UsersIcon className="w-6 h-6"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{group.memberIds.length} members</p>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-muted dark:bg-slate-800 text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
                        <div className="p-1.5 bg-amber-500/10 rounded-lg"><SearchIcon className="w-4 h-4 text-amber-500"/></div>
                        Posts
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
