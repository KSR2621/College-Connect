import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType, ConfessionMood, Comment } from '../types';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import BottomNavBar from '../components/BottomNavBar';
import CreateConfessionModal from '../components/CreateConfessionModal';
import { auth } from '../firebase';
import { PlusCircleIcon } from '../components/Icons';

interface ConfessionsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { 
    content: string; 
    mediaDataUrls?: string[] | null; 
    mediaType?: "image" | "video" | null; 
    isConfession?: boolean;
    confessionMood?: ConfessionMood;
    eventDetails?: { title: string; date: string; location: string; link?: string; };
  }) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  currentPath: string;
}

const confessionCategories: { id: ConfessionMood | 'all', label: string, emoji: string }[] = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'love', label: 'Love', emoji: '💘' },
    { id: 'funny', label: 'Funny', emoji: '🤣' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'chaos', label: 'Chaos', emoji: '🤯' },
    { id: 'deep', label: 'Deep', emoji: '🧠' },
];

const ConfessionsPage: React.FC<ConfessionsPageProps> = (props) => {
    const { currentUser, users, posts, groups, onNavigate, onAddPost, ...postCardProps } = props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<ConfessionMood | 'all'>('all');

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const filteredPosts = useMemo(() => {
        if (activeCategory === 'all') return posts;
        return posts.filter(p => p.confessionMood === activeCategory);
    }, [posts, activeCategory]);

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={props.currentPath} />

            <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-6 p-6 rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-lg">
                        <h1 className="text-4xl font-extrabold">Confessions 💬</h1>
                        <p className="text-md mt-2 opacity-90">Share your thoughts, crushes, or secrets — 100% anonymous.</p>
                    </div>

                    {/* Category Tabs */}
                    <div className="py-2 mb-6">
                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
                            {confessionCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                        activeCategory === cat.id 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted text-text-muted hover:bg-border'
                                    }`}
                                >
                                    {cat.emoji} {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {filteredPosts.length > 0 ? (
                            filteredPosts.map((post, index) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    author={users[post.authorId]} // Will be undefined for confessions, PostCard handles this
                                    currentUser={currentUser}
                                    users={users}
                                    groups={groups}
                                    onNavigate={onNavigate}
                                    animationIndex={index}
                                    {...postCardProps}
                                />
                            ))
                       ) : (
                            <div className="md:col-span-2 text-center py-16 text-text-muted bg-card rounded-lg border border-border">
                                <p className="font-semibold text-lg text-foreground">Nothing here yet!</p>
                                <p>No confessions found in this category. Be the first to share one!</p>
                            </div>
                       )}
                    </div>
                </div>
            </main>

            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-20 right-5 md:bottom-8 md:right-8 bg-secondary text-secondary-foreground rounded-full p-4 shadow-lg hover:bg-secondary/90 transition-transform transform hover:scale-110 z-40"
                aria-label="Create a new confession"
            >
                <PlusCircleIcon className="w-8 h-8"/>
            </button>
            
            <CreateConfessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddPost={onAddPost}
            />

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={props.currentPath}/>
        </div>
    );
};

export default ConfessionsPage;