
import React from 'react';
import type { User, Group, Post } from '../types';
import { UsersIcon } from './Icons';
import Avatar from './Avatar';

interface RightSidebarProps {
  groups: Group[];
  events: Post[];
  currentUser: User;
  onNavigate: (path: string) => void;
  users: User[];
}

const generateGradient = (name: string) => {
    const gradients = [
        'from-blue-500 to-cyan-400',
        'from-purple-500 to-indigo-500',
        'from-green-400 to-teal-500',
        'from-pink-500 to-rose-500',
        'from-orange-400 to-red-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % gradients.length);
    return gradients[index];
};

const RightSidebar: React.FC<RightSidebarProps> = ({ groups, events, currentUser, onNavigate, users }) => {

  const suggestedGroups = groups
    .filter(g => !g.memberIds.includes(currentUser.id) && !(currentUser.followingGroups || []).includes(g.id))
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => e.eventDetails && new Date(e.eventDetails.date) > new Date())
    .sort((a, b) => new Date(a.eventDetails!.date).getTime() - new Date(b.eventDetails!.date).getTime())
    .slice(0, 3);

  const suggestedUsers = users
    .filter(u => u.department === currentUser.department && u.id !== currentUser.id)
    .sort(() => 0.5 - Math.random()) // Shuffle suggestions
    .slice(0, 3);

  return (
    <div className="sticky top-24 space-y-6">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
         <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-full relative z-10">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                    Upcoming Events
                    <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => onNavigate('#/events')}>See all</span>
                </h3>
                <div className="space-y-4">
                    {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-start space-x-3 cursor-pointer group" onClick={() => onNavigate('#/events')}>
                            <div className="flex-shrink-0 h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex flex-col items-center justify-center shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <span className="text-[10px] font-bold uppercase">{new Date(event.eventDetails!.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-lg font-bold leading-none">{new Date(event.eventDetails!.date).getDate()}</span>
                            </div>
                            <div className="flex-1 overflow-hidden pt-0.5">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-primary transition-colors">{event.eventDetails?.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{event.eventDetails?.location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}

      {/* People You May Know */}
       {suggestedUsers.length > 0 && (
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-full relative z-10">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">People You May Know</h3>
                <div className="space-y-4">
                    {suggestedUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-3">
                            <Avatar src={user.avatarUrl} name={user.name} size="md" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.department}</p>
                            </div>
                            <button onClick={() => onNavigate(`#/profile/${user.id}`)} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg transition-colors">
                                View
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )}

      {/* Suggested Groups */}
      {suggestedGroups.length > 0 && (
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-full relative z-10">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                    Suggested Groups
                    <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => onNavigate('#/groups')}>See all</span>
                </h3>
                <div className="space-y-4">
                    {suggestedGroups.map(group => {
                    const gradient = generateGradient(group.name);
                    return (
                        <div 
                            key={group.id} 
                            className="flex items-center space-x-3 cursor-pointer group"
                            onClick={() => onNavigate(`#/groups/${group.id}`)}
                        >
                        <div className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br ${gradient} text-white rounded-xl flex items-center justify-center shadow-sm`}>
                            <UsersIcon className="w-5 h-5 opacity-90"/>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-primary transition-colors">{group.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{group.memberIds.length} members</p>
                        </div>
                        </div>
                    );
                    })}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
