import React, { useState, useMemo } from 'react';
import type { User, Group } from '../types';
import Header from '../components/Header';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { GhostIcon, ArrowRightIcon, PlusCircleIcon, UsersIcon } from '../components/Icons';

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

  const { myGroups, discoverGroups } = useMemo(() => {
    const myGroupIds = new Set([...(currentUser.followingGroups || []), ...groups.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id)]);
    const myGroups = groups.filter(g => myGroupIds.has(g.id));
    const discoverGroups = groups.filter(g => !myGroupIds.has(g.id));
    return { myGroups, discoverGroups };
  }, [groups, currentUser]);


  return (
    <div className="bg-muted/50 min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <UsersIcon className="w-8 h-8"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Find Your Community</h1>
                <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                    Explore student-led groups, clubs, and communities. Or start your own!
                </p>
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="mt-6 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 inline-flex items-center gap-2"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    Create a New Group
                </button>
            </div>
        </div>

        {/* My Groups Section */}
        {myGroups.length > 0 && (
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">Your Groups</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myGroups.map(group => (
                        <GroupCard key={group.id} group={group} onNavigate={onNavigate} />
                    ))}
                </div>
            </div>
        )}

        {/* Discover Groups Section */}
         <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Discover Groups</h2>
            {discoverGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {discoverGroups.map(group => (
                        <GroupCard key={group.id} group={group} onNavigate={onNavigate} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-card rounded-lg border border-border p-12 text-text-muted">
                    <h3 className="text-lg font-semibold text-foreground">All groups have been discovered!</h3>
                    <p className="mt-2">Why not create a new one and build a community?</p>
                </div>
            )}
        </div>
      </main>
      
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={onCreateGroup}
      />

      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default GroupsPage;