
import React from 'react';
import { User } from '../types';
import { 
    HomeIcon, UsersIcon, SearchIcon, UserIcon, CalendarIcon, BriefcaseIcon, MessageIcon, BookOpenIcon,
    HomeIconSolid, UsersIconSolid, SearchIconSolid, UserIconSolid, CalendarIconSolid, BriefcaseIconSolid, MessageIconSolid, BookOpenIconSolid
} from './Icons';

interface BottomNavBarProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPage: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentUser, onNavigate, currentPage }) => {
  const navItems = [
    { path: '#/home', icon: HomeIcon, activeIcon: HomeIconSolid, label: 'Home' },
    { path: '#/search', icon: SearchIcon, activeIcon: SearchIconSolid, label: 'Search' },
    { path: '#/academics', icon: BookOpenIcon, activeIcon: BookOpenIconSolid, label: 'Academics' },
    { path: '#/groups', icon: UsersIcon, activeIcon: UsersIconSolid, label: 'Groups' },
    { path: '#/events', icon: CalendarIcon, activeIcon: CalendarIconSolid, label: 'Events' },
    { path: '#/opportunities', icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid, label: 'Opportunities' },
    { path: '#/chat', icon: MessageIcon, activeIcon: MessageIconSolid, label: 'Chat' },
    { path: `#/profile/${currentUser.id}`, icon: UserIcon, activeIcon: UserIconSolid, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 lg:hidden pb-safe">
      <div className="flex items-center justify-between px-2 h-16 overflow-x-auto no-scrollbar">
        {navItems.map(({ path, icon: Icon, activeIcon: ActiveIcon, label }) => {
          // Special check for profile page
          const isActive = label === 'Profile' 
            ? currentPage.startsWith('#/profile/') && currentPage.endsWith(currentUser.id)
            : currentPage.startsWith(path);
            
          const IconComponent = isActive ? ActiveIcon : Icon;
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={`flex flex-col items-center justify-center min-w-[64px] flex-1 h-full transition-colors duration-200 group focus:outline-none ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
            >
              <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'transform scale-110' : ''}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold mt-0.5 opacity-90">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
