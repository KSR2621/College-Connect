
import React, { useState, useMemo } from 'react';
import type { User, Group, GroupCategory, GroupPrivacy } from '../types';
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
  onCreateGroup: (groupDetails: { name: string; description: string; category: GroupCategory; privacy: GroupPrivacy }) => void;
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
    <div className="bg-background min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="flex-1 pb-24 lg:pb-8">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900 pt-12 pb-24 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Student Communities</h1>
                    <p className="text-emerald-100 text-lg max-w-lg">Find your squad, join clubs, and lead the way.</p>
                </div>
                
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="bg-white text-emerald-900 font-bold py-3 px-6 rounded-xl shadow-xl hover:bg-emerald-50 transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                    <PlusCircleIcon className="w-5 h-5"/> Create Group
                </button>
            </div>
        </div>

        {/* Content Container - Overlap Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 space-y-12 pb-10">
            
            {/* Confessions Link Card */}
            <div className="animate-fade-in">
                <div 
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center p-[2px] group relative overflow-hidden" 
                    onClick={() => onNavigate('#/confessions')}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-[14px] w-full h-full p-5 flex items-center border border-transparent relative z-10">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-xl flex items-center justify-center shadow-md mr-4 group-hover:scale-110 transition-transform duration-500">
                            <GhostIcon className="h-6 w-6"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Campus Confessions</h3>
                            <p className="text-sm text-muted-foreground truncate">Share your thoughts anonymously.</p>
                        </div>
                        <div className="hidden sm:flex h-8 w-8 bg-muted rounded-full items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all ml-4">
                            <ArrowRightIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* My Groups Section */}
            {myGroups.length > 0 && (
                <div>
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
            <div>
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
