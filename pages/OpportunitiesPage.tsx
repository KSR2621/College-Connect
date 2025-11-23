
import React, { useState } from 'react';
import type { User, Post, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import OpportunityCard from '../components/OpportunityCard';
import { BriefcaseIcon, PlusIcon } from '../components/Icons';
import { auth } from '../firebase';

interface OpportunitiesPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  postCardProps: {
      onDeletePost: (postId: string) => void;
      // ... other props needed if used, but OpportunityCard uses simplified props
  }
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ currentUser, users, posts, onNavigate, currentPath, onAddPost, postCardProps }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const opportunities = posts.filter(p => p.isOpportunity).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-4">
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <BriefcaseIcon className="w-8 h-8"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Career & Growth</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                    Find internships, part-time jobs, and volunteer positions to build your resume.
                </p>
                <button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Post Opportunity
                </button>
            </div>
        </div>

        {/* List */}
        <div className="space-y-4 max-w-3xl mx-auto">
            {opportunities.length > 0 ? opportunities.map(opp => (
                <OpportunityCard 
                    key={opp.id} 
                    opportunity={opp} 
                    author={users[opp.authorId]}
                    currentUser={currentUser}
                    onDeleteOpportunity={postCardProps.onDeletePost}
                />
            )) : (
                <p className="text-center text-muted-foreground py-12">No opportunities listed yet.</p>
            )}
        </div>
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
