import React from 'react';
import { User } from '../types';
import { 
    HomeIcon, UsersIcon, SearchIcon, UserIcon, CalendarIcon, BriefcaseIcon,
    HomeIconSolid, UsersIconSolid, SearchIconSolid, UserIconSolid, CalendarIconSolid, BriefcaseIconSolid
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
    { path: '#/opportunities', icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid, label: 'Opportunities' },
    { path: '#/events', icon: CalendarIcon, activeIcon: CalendarIconSolid, label: 'Events' },
    { path: `#/profile/${currentUser.id}`, icon: UserIcon, activeIcon: UserIconSolid, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-border dark:border-slate-800 md:hidden z-50">
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
              className={`flex flex-col items-center justify-center flex-1 h-16 transition-colors duration-200 group focus:outline-none ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-primary'
              }`}
              aria-label={label}
            >
              <div className={`p-3 rounded-full transition-colors duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
                <IconComponent className="w-7 h-7" />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;