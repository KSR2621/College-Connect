
import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import CreateConfessionModal from '../components/CreateConfessionModal';
import { GhostIcon, PlusIcon } from '../components/Icons';
import { auth } from '../firebase';

interface ConfessionsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  // postCardProps
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
}

const ConfessionsPage: React.FC<ConfessionsPageProps> = (props) => {
  const { currentUser, users, posts, groups, onNavigate, currentPath, onAddPost, ...postCardProps } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'love' | 'funny' | 'sad' | 'chaos' | 'deep'>('all');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const filteredPosts = useMemo(() => {
      let p = posts.filter(post => post.isConfession).sort((a, b) => b.timestamp - a.timestamp);
      if (filter !== 'all') {
          p = p.filter(post => post.confessionMood === filter);
      }
      return p;
  }, [posts, filter]);

  const tabs = [
      { id: 'all', label: 'All' },
      { id: 'love', label: 'Love 💘' },
      { id: 'funny', label: 'Funny 🤣' },
      { id: 'sad', label: 'Sad 😢' },
      { id: 'chaos', label: 'Chaos 🤯' },
      { id: 'deep', label: 'Deep 🧠' },
  ];

  return (
    <div className="bg-background min-h-screen">
        <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={props.currentPath} />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-6 p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
                    <GhostIcon className="w-12 h-12 mx-auto mb-2 opacity-90"/>
                    <h1 className="text-3xl font-extrabold">Confessions</h1>
                    <p className="text-sm mt-2 opacity-90 max-w-md mx-auto">Share your thoughts, crushes, or secrets — 100% anonymous. No judgment zone.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-white text-purple-600 font-bold py-2.5 px-6 rounded-full shadow-md hover:bg-purple-50 transition-transform transform hover:scale-105 inline-flex items-center gap-2 text-sm">
                        <PlusIcon className="w-4 h-4"/> Post Confession
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2 justify-center">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === tab.id ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="max-w-2xl mx-auto">
                    <Feed 
                        posts={filteredPosts} 
                        users={users} 
                        currentUser={currentUser}
                        groups={groups}
                        onNavigate={onNavigate}
                        {...postCardProps} 
                    />
                </div>
            </div>
        </main>

        <CreateConfessionModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onAddPost={onAddPost}
        />

        <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default ConfessionsPage;
