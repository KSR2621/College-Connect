import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { 
    HomeIcon, UsersIcon, CalendarIcon, BriefcaseIcon, SearchIcon, MessageIcon, LogoutIcon, PlusSquareIcon,
    HomeIconSolid, UsersIconSolid, CalendarIconSolid, BriefcaseIconSolid, SearchIconSolid, MessageIconSolid, ChevronDownIcon
} from './Icons';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onNavigate: (path: string) => void;
    currentPath: string;
    // FIX: Made onOpenCreateModal optional to accommodate pages that don't have this feature.
    onOpenCreateModal?: () => void;
}

const navItems = [
    { path: '#/home', icon: HomeIcon, activeIcon: HomeIconSolid, label: 'Home' },
    { path: '#/search', icon: SearchIcon, activeIcon: SearchIconSolid, label: 'Search' },
    { path: '#/groups', icon: UsersIcon, activeIcon: UsersIconSolid, label: 'Groups' },
    { path: '#/events', icon: CalendarIcon, activeIcon: CalendarIconSolid, label: 'Events' },
    { path: '#/opportunities', icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid, label: 'Opportunities' },
    { path: '#/chat', icon: MessageIcon, activeIcon: MessageIconSolid, label: 'Chat' },
];


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, currentPath, onOpenCreateModal }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-40 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <span className="font-bold text-xl gradient-text cursor-pointer" onClick={() => onNavigate('#/home')}>CampusConnect</span>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-2 h-full">
                       {navItems.map(({ path, icon: Icon, activeIcon: ActiveIcon, label }) => {
                           const isActive = currentPath.startsWith(path);
                           const IconComponent = isActive ? ActiveIcon : Icon;
                           return (
                                <button
                                    key={path}
                                    onClick={() => onNavigate(path)}
                                    className={`flex items-center justify-center h-full w-24 px-2 transition-colors duration-200 relative ${
                                        isActive ? 'text-primary' : 'text-text-muted hover:text-primary'
                                    }`}
                                    aria-label={label}
                                >
                                    <div className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-slate-100'}`}>
                                      <IconComponent className="w-6 h-6 mb-1" />
                                      <span className="text-xs font-medium">{label}</span>
                                    </div>
                                </button>
                           )
                       })}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-2">
                         {/* Create Post Icon (all screens) */}
                        {/* FIX: Conditionally render the create post button only if the handler is provided. */}
                        {onOpenCreateModal && (
                            <button onClick={onOpenCreateModal} className="p-2 text-foreground hover:text-primary rounded-full hover:bg-slate-100" aria-label="Create Post">
                                <PlusSquareIcon className="w-6 h-6" />
                            </button>
                        )}
                        
                        {/* Messages Icon (mobile only) */}
                        <button onClick={() => onNavigate('#/chat')} className="p-2 text-foreground hover:text-primary rounded-full md:hidden" aria-label="Messages">
                            <MessageIcon className="w-6 h-6" />
                        </button>

                        {/* Desktop Profile Dropdown */}
                        <div className="relative hidden md:block">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors">
                                <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="md" />
                                <span className="hidden lg:block font-medium text-foreground pr-1">{currentUser.name}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-text-muted transition-transform mr-1 ${isMenuOpen ? 'rotate-180' : ''}`} />
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
            </div>
        </header>
    );
};

export default Header;