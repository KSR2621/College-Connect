import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import PostCard from '../components/PostCard';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { SearchIcon, PlusCircleIcon } from '../components/Icons';

interface OpportunitiesPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void; // Using 'any' for simplicity due to merged post types
  postCardProps: {
    onReaction: (postId: string, reaction: ReactionType) => void;
    onAddComment: (postId: string, text: string) => void;
    onDeletePost: (postId: string) => void;
    onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
    onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
    onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
    groups: Group[];
  }
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = (props) => {
  const { currentUser, users, posts, onNavigate, currentPath, onAddPost, postCardProps } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const opportunityPosts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return posts.filter(post => {
      if (!post.isOpportunity) return false;
      if (!searchTerm) return true;
      
      const details = post.opportunityDetails;
      return (
        details?.title.toLowerCase().includes(lowercasedFilter) ||
        details?.organization.toLowerCase().includes(lowercasedFilter) ||
        post.content.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [posts, searchTerm]);

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-4 pb-20 md:pb-4">
        {/* Sticky Page Header */}
        <div className="sticky top-[65px] bg-background z-20 py-4 -mx-2 sm:-mx-4 px-2 sm:px-4 mb-4 border-b border-border">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Opportunities</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-input border-border border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90 flex items-center gap-1"
                    >
                       <PlusCircleIcon className="w-5 h-5"/>
                       <span className="hidden sm:inline">Post</span>
                    </button>
                </div>
            </div>
        </div>

        {opportunityPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {opportunityPosts.map(post => {
                    const author = users[post.authorId];
                    if (!author) return null;
                    return (
                        <PostCard 
                            key={post.id} 
                            post={post}
                            author={author}
                            currentUser={currentUser}
                            users={users}
                            {...postCardProps}
                        />
                    );
                })}
            </div>
        ) : (
             <div className="text-center text-text-muted mt-16">
                <h2 className="text-xl font-semibold">No Opportunities Found</h2>
                <p className="mt-2">Check back later or post a new opportunity for the community!</p>
            </div>
        )}
      </main>

      <CreateOpportunityModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddPost={onAddPost}
      />
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default OpportunitiesPage;