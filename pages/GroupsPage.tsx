import React, { useState } from 'react';
import type { User, Group } from '../types';
import Header from '../components/Header';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { GhostIcon } from '../components/Icons';

interface GroupsPageProps {
  currentUser: User;
  groups: Group[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onCreateGroup: (groupDetails: { name: string; description: string; }) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser, groups, onNavigate, currentPath, onCreateGroup }) => {
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
            <h1 className="text-3xl font-bold text-foreground">Groups</h1>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90">
                Create Group
            </button>
        </div>
        
        {/* Confessions Card */}
        <div 
            className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border mb-6 flex items-center space-x-4" 
            onClick={() => onNavigate('#/confessions')}
        >
            <div className="flex-shrink-0 h-12 w-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                <GhostIcon className="h-7 w-7"/>
            </div>
            <div>
                <h3 className="text-lg font-bold text-card-foreground">Campus Confessions</h3>
                <p className="text-sm text-text-muted">Share your thoughts anonymously with the campus community.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} onNavigate={onNavigate} />
          ))}
        </div>
      </main>
      
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={onCreateGroup}
      />

      <BottomNavBar onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default GroupsPage;
