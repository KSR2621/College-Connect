
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
  onJoinGroupRequest: (groupId: string) => void;
  onToggleFollowGroup: (groupId: string) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser, groups, onNavigate, currentPath, onCreateGroup, onJoinGroupRequest, onToggleFollowGroup }) => {
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
        <div className="relative bg-card dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-sm border border-border overflow-hidden mb-10 text-center group">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000 delay-100"></div>
            </div>
            
            <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/20 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <UsersIcon className="w-10 h-10"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">Find Your Squad</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                    Explore student-led groups, clubs, and communities. Or start your own and lead the way!
                </p>
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="bg-foreground text-background dark:bg-primary dark:text-primary-foreground font-bold py-3.5 px-8 rounded-full hover:opacity-90 transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-xl"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    Create a New Group
                </button>
            </div>
        </div>

        {/* Confessions Link Card */}
        <div className="mb-12 animate-fade-in">
            <div 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center p-[2px] group relative overflow-hidden" 
                onClick={() => onNavigate('#/confessions')}
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-[14px] w-full h-full p-6 flex items-center border border-transparent relative z-10">
                    <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-2xl flex items-center justify-center shadow-md mr-5 group-hover:scale-110 transition-transform duration-500">
                        <GhostIcon className="h-8 w-8"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Campus Confessions</h3>
                        <p className="text-sm text-muted-foreground truncate">Share your thoughts anonymously with the entire community.</p>
                    </div>
                    <div className="hidden sm:flex h-10 w-10 bg-muted rounded-full items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all ml-4">
                        <ArrowRightIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>

        {/* My Groups Section */}
        {myGroups.length > 0 && (
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6 px-1">
                    <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                    <h2 className="text-2xl font-bold text-foreground">Your Groups</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myGroups.map(group => (
                        <GroupCard 
                            key={group.id} 
                            group={group} 
                            currentUser={currentUser}
                            onNavigate={onNavigate} 
                            onJoinGroupRequest={onJoinGroupRequest}
                            onToggleFollowGroup={onToggleFollowGroup}
                        />
                    ))}
                </div>
            </div>
        )}

        {/* Discover Groups Section */}
         <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="h-8 w-1.5 bg-secondary rounded-full"></div>
                <h2 className="text-2xl font-bold text-foreground">Discover Groups</h2>
            </div>
            {discoverGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {discoverGroups.map(group => (
                        <GroupCard 
                            key={group.id} 
                            group={group} 
                            currentUser={currentUser}
                            onNavigate={onNavigate} 
                            onJoinGroupRequest={onJoinGroupRequest}
                            onToggleFollowGroup={onToggleFollowGroup}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-card dark:bg-slate-900 rounded-3xl border border-border border-dashed p-16">
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
