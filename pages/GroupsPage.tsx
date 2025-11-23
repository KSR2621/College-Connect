
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
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-4 pt-8 pb-20 lg:pb-8">
        {/* Hero Section */}
        <div className="relative bg-card p-8 rounded-3xl shadow-sm border border-border overflow-hidden mb-10 text-center">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg transform -rotate-3">
                    <UsersIcon className="w-10 h-10"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Find Your Squad</h1>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Explore student-led groups, clubs, and communities. Or start your own and lead the way!
                </p>
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="mt-8 bg-foreground text-background font-bold py-3.5 px-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-xl"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    Create a New Group
                </button>
            </div>
        </div>

        {/* Confessions Link Card */}
        <div className="mb-12 animate-fade-in">
            <div 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center p-1 group relative overflow-hidden" 
                onClick={() => onNavigate('#/confessions')}
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl w-full h-full p-6 flex items-center border border-white/10">
                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-2xl flex items-center justify-center shadow-md mr-5 group-hover:scale-110 transition-transform duration-500">
                        <GhostIcon className="h-8 w-8"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Campus Confessions</h3>
                        <p className="text-sm text-muted-foreground truncate">Share your thoughts anonymously with the entire community.</p>
                    </div>
                    <div className="hidden sm:flex h-10 w-10 bg-muted rounded-full items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <ArrowRightIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>

        {/* My Groups Section */}
        {myGroups.length > 0 && (
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                    <h2 className="text-2xl font-bold text-foreground">Your Groups</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myGroups.map(group => (
                        <GroupCard key={group.id} group={group} onNavigate={onNavigate} />
                    ))}
                </div>
            </div>
        )}

        {/* Discover Groups Section */}
         <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1.5 bg-secondary rounded-full"></div>
                <h2 className="text-2xl font-bold text-foreground">Discover Groups</h2>
            </div>
            {discoverGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {discoverGroups.map(group => (
                        <GroupCard key={group.id} group={group} onNavigate={onNavigate} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-card rounded-3xl border border-border border-dashed p-16">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <UsersIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">All groups have been discovered!</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">You've seen it all. Why not create a new group and start building your own community?</p>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-6 text-primary font-bold hover:underline"
                    >
                        Create a Group
                    </button>
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
