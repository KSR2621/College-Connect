import React, { useState, useMemo } from 'react';
import type { User, Post, Group, ReactionType } from '../types';
import Header from '../components/Header';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import PostCard from '../components/PostCard';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { SearchIcon, PlusCircleIcon, BriefcaseIcon } from '../components/Icons';

interface OpportunitiesPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: { content: string; isOpportunity?: boolean; opportunityDetails?: { title: string; organization: string; applyLink?: string; }; eventDetails?: { title: string; date: string; location: string; link?: string; }; }) => void;
  postCardProps: {
    onReaction: (postId: string, reaction: ReactionType) => void;
    onAddComment: (postId: string, text: string) => void;
    onDeletePost: (postId: string) => void;
    onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
    onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
    onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
    onToggleSavePost: (postId: string) => void;
    groups: Group[];
  }
}

const opportunityCategories = [
    { id: 'all', label: 'All' },
    { id: 'internship', label: 'Internships' },
    { id: 'job', label: 'Jobs' },
    { id: 'volunteer', label: 'Volunteering' },
    { id: 'workshop', label: 'Workshops' },
];

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = (props) => {
  const { currentUser, users, posts, onNavigate, currentPath, onAddPost, postCardProps } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const opportunityPosts = useMemo(() => {
    const lowercasedSearch = searchTerm.toLowerCase();
    return posts
      .filter(post => post.isOpportunity)
      .filter(post => {
        if (activeCategory === 'all') return true;
        const title = post.opportunityDetails?.title.toLowerCase() || '';
        const content = post.content.toLowerCase();
        
        const matchesCategory = (keywords: string[]) => {
            return keywords.some(kw => title.includes(kw) || content.includes(kw));
        };

        switch (activeCategory) {
            case 'internship':
                return matchesCategory(['intern', 'internship']);
            case 'job':
                return matchesCategory(['job', 'hiring', 'full-time', 'part-time']);
            case 'volunteer':
                return matchesCategory(['volunteer', 'volunteering']);
            case 'workshop':
                return matchesCategory(['workshop', 'seminar', 'webinar']);
            default:
                return false;
        }
      })
      .filter(post => {
        if (!lowercasedSearch) return true;
      
        const details = post.opportunityDetails;
        return (
          details?.title.toLowerCase().includes(lowercasedSearch) ||
          details?.organization.toLowerCase().includes(lowercasedSearch) ||
          post.content.toLowerCase().includes(lowercasedSearch)
        );
      });
  }, [posts, searchTerm, activeCategory]);

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50"></div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <BriefcaseIcon className="w-8 h-8"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Career & Growth</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                    Find internships, part-time jobs, and volunteer positions to build your resume.
                </p>
            </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search opportunities..."
                        className="w-full bg-card border-border border rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                 <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="w-full sm:w-auto bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    Post Opportunity
                </button>
            </div>
            {/* Category Tabs */}
            <div className="mt-6">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
                    {opportunityCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                activeCategory === cat.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-card text-text-muted hover:bg-border border border-border'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
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
                            // FIX: Pass the onNavigate prop to satisfy the PostCardProps interface.
                            onNavigate={onNavigate}
                        />
                    );
                })}
            </div>
        ) : (
             <div className="text-center text-text-muted mt-16">
                <div className="inline-block p-6 bg-card border border-border rounded-full">
                    <BriefcaseIcon className="w-12 h-12 text-text-muted" />
                </div>
                <h2 className="text-xl font-semibold mt-4">No opportunities found</h2>
                <p className="mt-2">There are no posts in the "{activeCategory}" category. Try another!</p>
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