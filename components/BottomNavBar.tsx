import React from 'react';
import { HomeIcon, UsersIcon, CalendarIcon, BriefcaseIcon, SearchIcon, MessageIcon } from './Icons';

interface BottomNavBarProps {
  onNavigate: (path: string) => void;
  currentPage: string;
}

const navItems = [
  { path: '#/home', icon: HomeIcon, label: 'Home' },
  { path: '#/groups', icon: UsersIcon, label: 'Groups' },
  { path: '#/events', icon: CalendarIcon, label: 'Events' },
  { path: '#/opportunities', icon: BriefcaseIcon, label: 'Jobs' },
  { path: '#/chat', icon: MessageIcon, label: 'Chat' },
  { path: '#/search', icon: SearchIcon, label: 'Search' },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onNavigate, currentPage }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-t-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = currentPage.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={`flex flex-col items-center justify-center text-xs w-16 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-primary'
              }`}
              aria-label={label}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;