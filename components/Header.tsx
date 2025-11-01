import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { HomeIcon, UsersIcon, CalendarIcon, BriefcaseIcon, SearchIcon, MessageIcon, LogoutIcon } from './Icons';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onNavigate: (path: string) => void;
    currentPath: string;
}

const navItems = [
    { path: '#/home', icon: HomeIcon, label: 'Home' },
    { path: '#/search', icon: SearchIcon, label: 'Search' },
    { path: '#/groups', icon: UsersIcon, label: 'Groups' },
    { path: '#/events', icon: CalendarIcon, label: 'Events' },
    { path: '#/opportunities', icon: BriefcaseIcon, label: 'Opportunities' },
    { path: '#/chat', icon: MessageIcon, label: 'Chat' },
];


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, currentPath }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-card border-b border-border sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Left Side: Logo */}
                    <div className="flex items-center space-x-4">
                        <span className="font-bold text-xl text-primary cursor-pointer" onClick={() => onNavigate('#/home')}>CampusConnect</span>
                    </div>

                    {/* Center: Navigation (hidden on mobile) */}
                    <nav className="hidden md:flex items-center space-x-2">
                       {navItems.map(({ path, icon: Icon, label }) => {
                           const isActive = currentPath.startsWith(path);
                           return (
                                <button
                                    key={path}
                                    onClick={() => onNavigate(path)}
                                    className={`flex flex-col items-center justify-center h-16 w-20 transition-colors duration-200 ${
                                        isActive ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-primary'
                                    }`}
                                    aria-label={label}
                                >
                                    <Icon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                           )
                       })}
                    </nav>

                    {/* Right Side: Profile Dropdown */}
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2">
                           <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="md" />
                           <span className="hidden lg:block font-medium text-foreground">{currentUser.name}</span>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 border border-border">
                                <a onClick={() => { onNavigate(`#/profile/${currentUser.id}`); setIsMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer">
                                    <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="sm" className="mr-2"/>
                                    Profile
                                </a>
                                {currentUser.isAdmin && (
                                    <a onClick={() => { onNavigate('#/admin'); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer">
                                        Admin Dashboard
                                    </a>
                                )}
                                <div className="border-t border-border my-1"></div>
                                <a onClick={() => { onLogout(); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer">
                                  <LogoutIcon className="w-5 h-5 mr-2" />
                                  Logout
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
