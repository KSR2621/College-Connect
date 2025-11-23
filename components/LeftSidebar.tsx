
import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { UserIcon, UsersIcon, CalendarIcon, BriefcaseIcon } from './Icons';

interface LeftSidebarProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

const NavLink: React.FC<{
    icon: React.ElementType;
    label: string;
    path: string;
    onNavigate: (path: string) => void;
}> = ({ icon: Icon, label, path, onNavigate }) => (
    <a 
        onClick={() => onNavigate(path)}
        className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
    >
        <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{label}</span>
    </a>
);


const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="sticky top-24 space-y-6">
        <div className="animated-border-wrapper">
            <div className="bg-card rounded-[14px] p-6 shadow-sm h-full">
                {/* User Info */}
                <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                    <div className="relative group cursor-pointer" onClick={() => onNavigate(`#/profile/${currentUser.id}`)}>
                        <Avatar 
                            src={currentUser.avatarUrl} 
                            name={currentUser.name} 
                            size="xl" 
                            className="mb-3 shadow-sm group-hover:opacity-90 transition-opacity w-20 h-20 text-2xl"
                        />
                    </div>
                    <h2 
                        className="font-bold text-lg text-foreground cursor-pointer hover:underline"
                        onClick={() => onNavigate(`#/profile/${currentUser.id}`)}
                    >
                        {currentUser.name}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{currentUser.department}</p>
                </div>

                {/* Navigation Links */}
                <nav className="mt-4 space-y-1">
                    <NavLink icon={UserIcon} label="My Profile" path={`#/profile/${currentUser.id}`} onNavigate={onNavigate} />
                    <NavLink icon={UsersIcon} label="My Groups" path="#/groups" onNavigate={onNavigate} />
                    <NavLink icon={CalendarIcon} label="Events" path="#/events" onNavigate={onNavigate} />
                    <NavLink icon={BriefcaseIcon} label="Opportunities" path="#/opportunities" onNavigate={onNavigate} />
                </nav>
            </div>
        </div>
    </div>
  );
};

export default LeftSidebar;