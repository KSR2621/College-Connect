

import React, { useState } from 'react';
import type { Opportunity, User } from '../types';
import Header from '../components/Header';
import OpportunityCard from '../components/OpportunityCard';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';

interface OpportunitiesPageProps {
  currentUser: User;
  users: { [key: string]: User };
  opportunities: Opportunity[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onCreateOpportunity: (oppDetails: { title: string; organization: string; description: string; applyLink?: string; }) => void;
  onDeleteOpportunity: (opportunityId: string) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = (props) => {
  const { currentUser, users, opportunities, onNavigate, currentPath, onCreateOpportunity, onDeleteOpportunity } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Career Opportunities</h1>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90">
            Create Opportunity
          </button>
        </div>
        <div className="space-y-6">
          {opportunities.map(opp => (
            <OpportunityCard 
              key={opp.id} 
              opportunity={opp}
              author={users[opp.authorId]}
              currentUser={currentUser}
              onDeleteOpportunity={onDeleteOpportunity}
            />
          ))}
        </div>
      </main>

      <CreateOpportunityModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateOpportunity={onCreateOpportunity}
      />
      
      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default OpportunitiesPage;
