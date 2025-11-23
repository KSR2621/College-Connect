
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
    <div className="bg-background min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="flex-1 pb-24 lg:pb-8">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-sky-900 via-blue-900 to-slate-900 pt-12 pb-24 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Explore Campus</h1>
                    <p className="text-sky-100 text-lg max-w-lg">Connect with people, discover communities, and find what's trending.</p>
                </div>
            </div>
        </div>

        {/* Search Sticky Header */}
        <div className="sticky top-16 z-30 -mt-8 px-4">
            <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-2xl p-3 flex flex-col gap-3">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search people, groups, posts..."
                        className="w-full bg-muted/50 hover:bg-muted border border-transparent focus:border-primary rounded-xl pl-10 pr-10 py-3 text-base focus:outline-none transition-all text-foreground"
                        autoFocus
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-muted hover:bg-muted-foreground/20 rounded-full text-muted-foreground transition-colors">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {searchTerm && (
                    <div className="flex gap-2 px-1 pb-1 overflow-x-auto no-scrollbar">
                        {['all', 'people', 'groups', 'posts'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all duration-200 border ${
                                    activeTab === tab 
                                    ? 'bg-foreground text-background border-foreground shadow-sm' 
                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-4 pt-8 space-y-10 min-h-[400px]">
            
            {!searchTerm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {[
                        { title: "Find People", subtitle: "Connect with classmates", icon: UsersIcon, color: "text-primary", bg: "bg-primary/10", border: "hover:border-primary/40" },
                        { title: "Join Groups", subtitle: "Discover communities", icon: UsersIcon, color: "text-purple-500", bg: "bg-purple-500/10", border: "hover:border-purple-500/40" },
                        { title: "Trending", subtitle: "See what's happening", icon: SearchIcon, color: "text-amber-500", bg: "bg-amber-500/10", border: "hover:border-amber-500/40" }
                    ].map((item, i) => (
                        <div key={i} className={`p-8 border border-dashed border-border bg-card/50 rounded-3xl text-center transition-all duration-300 ${item.border} hover:bg-card hover:shadow-lg cursor-pointer group`}>
                            <div className={`w-16 h-16 mx-auto mb-4 ${item.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className={`w-8 h-8 ${item.color}`}/>
                            </div>
                            <p className="text-lg font-bold text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
                        </div>
                    ))}
                </div>
            )}

            {searchTerm && !hasResults && (
                <div className="text-center py-16 animate-fade-in">
                    <div className="bg-muted/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border border-border dashed">
                        <SearchIcon className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No results found</h3>
                    <p className="text-muted-foreground mt-2">We couldn't find anything for "<span className="font-semibold text-foreground">{searchTerm}</span>".</p>
                </div>
            )}

            {/* People Results */}
            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">People</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.people.map(user => (
                            <div key={user.id} onClick={() => onNavigate(`#/profile/${user.id}`)} className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <Avatar src={user.avatarUrl} name={user.name} size="lg" className="shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">{user.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{user.department}</p>
                                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-md ${user.tag === 'Student' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {user.tag}
                                    </span>
                                </div>
                                <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                    <ArrowRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"/>
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
                        <span className="bg-purple-500/10 text-purple-600 px-2 py-1 rounded text-xs">Groups</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.groups.map(group => (
                            <div key={group.id} onClick={() => onNavigate(`#/groups/${group.id}`)} className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all cursor-pointer flex items-center gap-4 group hover:-translate-y-0.5">
                                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                    <UsersIcon className="w-7 h-7"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{group.memberIds.length} members</p>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-muted text-xs font-bold text-muted-foreground group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
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
                        <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded text-xs">Posts</span>
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
