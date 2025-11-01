import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { UserIcon, UsersIcon, GhostIcon, BookmarkIcon } from './Icons';

interface LeftSidebarProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

const NavLink: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    path: string;
    onNavigate: (path: string) => void;
}> = ({ icon: Icon, label, path, onNavigate }) => (
    <a 
        onClick={() => onNavigate(path)}
        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
    >
        <Icon className="w-6 h-6 text-text-muted" />
        <span className="font-semibold text-foreground">{label}</span>
    </a>
);


const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="sticky top-20">
      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        {/* User Info */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-border">
          <Avatar 
            src={currentUser.avatarUrl} 
            name={currentUser.name} 
            size="xl" 
            className="mb-3 cursor-pointer"
            onClick={() => onNavigate(`#/profile/${currentUser.id}`)}
          />
          <h2 
            className="font-bold text-lg text-foreground cursor-pointer"
            onClick={() => onNavigate(`#/profile/${currentUser.id}`)}
            >
                {currentUser.name}
            </h2>
          <p className="text-sm text-text-muted">{currentUser.department}</p>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 space-y-1">
            <NavLink icon={UserIcon} label="My Profile" path={`#/profile/${currentUser.id}`} onNavigate={onNavigate} />
            <NavLink icon={UsersIcon} label="My Groups" path="#/groups" onNavigate={onNavigate} />
            <NavLink icon={GhostIcon} label="Confessions" path="#/confessions" onNavigate={onNavigate} />
            {/* <NavLink icon={BookmarkIcon} label="Saved Posts" path="#/saved" onNavigate={onNavigate} /> */}
        </nav>
      </div>
    </div>
  );
};

export default LeftSidebar;
