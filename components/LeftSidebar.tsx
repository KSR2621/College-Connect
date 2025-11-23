
import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { UserIcon, UsersIcon, CalendarIcon, BriefcaseIcon, BookmarkIcon, SettingsIcon, EditIcon } from './Icons';

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
        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group font-medium text-sm"
    >
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
        <span className="group-hover:text-primary transition-colors">{label}</span>
    </a>
);


const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden group">
            <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            </div>
            <div className="px-6 pb-6 relative">
                <div className="flex justify-center -mt-10 mb-3 relative">
                    <Avatar 
                        src={currentUser.avatarUrl} 
                        name={currentUser.name} 
                        size="xl" 
                        className="w-20 h-20 border-4 border-card shadow-md cursor-pointer"
                        onClick={() => onNavigate(`#/profile/${currentUser.id}`)}
                    />
                </div>
                <div className="text-center">
                    <h2 
                        className="font-bold text-lg text-foreground cursor-pointer hover:underline"
                        onClick={() => onNavigate(`#/profile/${currentUser.id}`)}
                    >
                        {currentUser.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                        {currentUser.department} • {currentUser.tag === 'Student' ? `Year ${currentUser.yearOfStudy || 1}` : currentUser.tag}
                    </p>
                    
                    <button 
                        onClick={() => onNavigate(`#/profile/${currentUser.id}`)} 
                        className="mt-4 w-full py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-1"
                    >
                        <EditIcon className="w-3 h-3" /> Edit Profile
                    </button>
                </div>
            </div>
        </div>

        {/* Quick Links Menu */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-2">
            <nav className="space-y-0.5">
                <NavLink icon={UserIcon} label="My Profile" path={`#/profile/${currentUser.id}`} onNavigate={onNavigate} />
                <NavLink icon={UsersIcon} label="My Groups" path="#/groups" onNavigate={onNavigate} />
                <NavLink icon={CalendarIcon} label="Events" path="#/events" onNavigate={onNavigate} />
                <NavLink icon={BriefcaseIcon} label="Opportunities" path="#/opportunities" onNavigate={onNavigate} />
                <NavLink icon={BookmarkIcon} label="Saved Posts" path={`#/profile/${currentUser.id}`} onNavigate={onNavigate} /> {/* Assuming saved posts are on profile for now */}
                <div className="h-px bg-border my-2 mx-4"></div>
                <NavLink icon={SettingsIcon} label="Settings" path="#/settings" onNavigate={() => alert("Settings page under construction")} />
            </nav>
        </div>

        {/* Footer Links */}
        <div className="text-xs text-muted-foreground text-center px-4 opacity-70 pb-4">
           &copy; 2025 CampusConnect
           <div className="mt-1 space-x-2">
               <a href="#" className="hover:underline">Privacy</a>
               <span>&bull;</span>
               <a href="#" className="hover:underline">Terms</a>
           </div>
       </div>
    </div>
  );
};

export default LeftSidebar;
