import React from 'react';
import { HomeIcon, BriefcaseIcon, UserCircleIcon, SearchIcon, CalendarDaysIcon } from './Icons';

interface BottomNavBarProps {
  onNavigate: (path: string) => void;
  currentRoute: string;
}

const navItems = [
    { path: '#/', icon: HomeIcon, label: 'Home' },
    { path: '#/search', icon: SearchIcon, label: 'Search' },
    { path: '#/events', icon: CalendarDaysIcon, label: 'Events' },
    { path: '#/opportunities', icon: BriefcaseIcon, label: 'Opportunities' },
    { path: '#/profile', icon: UserCircleIcon, label: 'Profile' },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onNavigate, currentRoute }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-gray-700 z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = currentRoute.startsWith(item.path) && (item.path !== '#/' || currentRoute === '#/');
                    return (
                        <a 
                            key={item.path} 
                            href={item.path} 
                            onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors cursor-pointer ${isActive ? 'text-brand-secondary' : 'text-text-secondary-dark hover:text-white'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </a>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;