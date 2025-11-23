
import React, { useState } from 'react';
import type { Group, User } from '../types';
import { UsersIcon, StarIcon, ShareIcon } from './Icons';

interface GroupCardProps {
  group: Group;
  currentUser: User;
  onNavigate: (path: string) => void;
  onJoinGroupRequest: (groupId: string) => void;
  onToggleFollowGroup: (groupId: string) => void;
}

const generateGradient = (name: string) => {
    const gradients = [
        'from-blue-500 to-cyan-400',
        'from-violet-500 to-purple-500',
        'from-emerald-400 to-teal-500',
        'from-pink-500 to-rose-500',
        'from-amber-400 to-orange-500',
        'from-indigo-500 to-blue-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % gradients.length);
    return gradients[index];
};

const GroupCard: React.FC<GroupCardProps> = ({ group, currentUser, onNavigate, onJoinGroupRequest, onToggleFollowGroup }) => {
  const gradient = generateGradient(group.name);
  const [linkCopied, setLinkCopied] = useState(false);

  const isMember = group.memberIds.includes(currentUser.id);
  const isPending = group.pendingMemberIds?.includes(currentUser.id);
  const isFollowing = currentUser.followingGroups?.includes(group.id);

  const handleInvite = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/#/groups/${group.id}`;
      navigator.clipboard.writeText(url).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
      });
  };

  const handleJoinClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMember) {
          onNavigate(`#/groups/${group.id}`);
      } else if (!isPending) {
          onJoinGroupRequest(group.id);
      }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFollowGroup(group.id);
  };
  
  return (
    <div 
        className={`relative p-[1px] rounded-2xl bg-gradient-to-br ${gradient} hover:shadow-xl dark:hover:shadow-primary/10 transition-all duration-300 group hover:-translate-y-1 cursor-pointer h-full flex flex-col`}
        onClick={() => onNavigate(`#/groups/${group.id}`)}
    >
        <div className="bg-card dark:bg-slate-900 rounded-[15px] h-full relative z-10 overflow-hidden flex flex-col">
            {/* Banner */}
            <div className={`relative h-28 bg-gradient-to-r ${gradient} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                {/* Glass Icon Container */}
                <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                    <UsersIcon className="w-7 h-7 text-white drop-shadow-md" />
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-1" title={group.name}>{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow leading-relaxed">{group.description}</p>
                
                <div className="flex items-center gap-3 mt-auto">
                    <div className="flex items-center text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border/50">
                        <UsersIcon className="w-3 h-3 mr-1.5 opacity-70" />
                        <span>{group.memberIds.length} Members</span>
                    </div>
                    <div className="flex items-center text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border/50">
                        <StarIcon className="w-3 h-3 mr-1.5 opacity-70" />
                        <span>{group.followers?.length || 0}</span>
                    </div>
                </div>
            </div>
            
            {/* Action Footer */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                    <button 
                        onClick={handleFollowClick} 
                        className={`p-2 rounded-xl transition-colors border ${isFollowing ? 'bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-background border-border text-muted-foreground hover:text-amber-500 hover:border-amber-200'}`}
                        title={isFollowing ? "Unfollow" : "Follow"}
                    >
                        <StarIcon className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                        onClick={handleInvite} 
                        className="p-2 rounded-xl bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors relative group/invite"
                        title="Copy Link"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {linkCopied && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded shadow-lg animate-fade-in whitespace-nowrap">
                                Copied!
                            </span>
                        )}
                    </button>
                </div>

                <button 
                    onClick={handleJoinClick}
                    disabled={isPending}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all transform active:scale-95 ${
                        isMember 
                        ? 'bg-muted text-foreground hover:bg-muted/80 border border-border' 
                        : isPending 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-70 border border-border' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md shadow-primary/20'
                    }`}
                >
                    {isMember ? 'View Group' : isPending ? 'Requested' : 'Join Group'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default GroupCard;
