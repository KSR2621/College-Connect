import React from 'react';
import { User } from '../types';
import { 
    HomeIcon, UsersIcon, SearchIcon, UserIcon, CalendarIcon,
    HomeIconSolid, UsersIconSolid, SearchIconSolid, UserIconSolid, CalendarIconSolid
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
    { path: '#/groups', icon: UsersIcon, activeIcon: UsersIconSolid, label: 'Groups' },
    { path: '#/events', icon: CalendarIcon, activeIcon: CalendarIconSolid, label: 'Events' },
    { path: `#/profile/${currentUser.id}`, icon: UserIcon, activeIcon: UserIconSolid, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-t-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, activeIcon: ActiveIcon, label }) => {
          // Special check for profile page, as it can be /profile/some-other-id
          const isActive = label === 'Profile' 
            ? currentPage.startsWith('#/profile/') && currentPage.endsWith(currentUser.id)
            : currentPage.startsWith(path);
            
          const IconComponent = isActive ? ActiveIcon : Icon;
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
                isActive ? 'text-foreground' : 'text-text-muted hover:text-foreground'
              }`}
              aria-label={label}
            >
              <IconComponent className="w-7 h-7" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;