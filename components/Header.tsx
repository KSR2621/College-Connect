

import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { 
    HomeIcon, UsersIcon, CalendarIcon, BriefcaseIcon, SearchIcon, MessageIcon, LogoutIcon, BookOpenIcon,
    HomeIconSolid, UsersIconSolid, CalendarIconSolid, BriefcaseIconSolid, SearchIconSolid, MessageIconSolid, ChevronDownIcon, BookOpenIconSolid, NotebookIcon,
    SunIcon, MoonIcon
} from './Icons';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onNavigate: (path: string) => void;
    currentPath: string;
}

const navItems = [
    { path: '#/home', icon: HomeIcon, activeIcon: HomeIconSolid, label: 'Home' },
    { path: '#/search', icon: SearchIcon, activeIcon: SearchIconSolid, label: 'Search' },
    { path: '#/academics', icon: BookOpenIcon, activeIcon: BookOpenIconSolid, label: 'Academics' },
    { path: '#/personal-notes', icon: NotebookIcon, activeIcon: NotebookIcon, label: 'Notes' },
    { path: '#/groups', icon: UsersIcon, activeIcon: UsersIconSolid, label: 'Groups' },
    { path: '#/events', icon: CalendarIcon, activeIcon: CalendarIconSolid, label: 'Events' },
    { path: '#/opportunities', icon: BriefcaseIcon, activeIcon: BriefcaseIconSolid, label: 'Opportunities' },
    { path: '#/chat', icon: MessageIcon, activeIcon: MessageIconSolid, label: 'Chat' },
];


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, currentPath }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-border dark:border-slate-800 sticky top-0 z-40 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <span className="font-bold text-xl gradient-text cursor-pointer" onClick={() => onNavigate('#/home')}>CampusConnect</span>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <nav className="hidden lg:flex items-center lg:space-x-1 h-full">
                       {navItems.map(({ path, icon: Icon, activeIcon: ActiveIcon, label }) => {
                           const isActive = currentPath.startsWith(path);
                           const IconComponent = isActive ? ActiveIcon : Icon;
                           return (
                                <button
                                    key={path}
                                    onClick={() => onNavigate(path)}
                                    className={`flex items-center justify-center h-full px-1 transition-colors duration-200 relative ${
                                        isActive ? 'text-primary' : 'text-text-muted hover:text-primary dark:hover:text-primary'
                                    }`}
                                    aria-label={label}
                                    title={label}
                                >
                                    <div className={`flex flex-col items-center justify-center p-2 rounded-lg w-20 transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                      <IconComponent className="w-6 h-6 mb-1" />
                                      <span className="text-xs font-medium">{label}</span>
                                    </div>
                                </button>
                           )
                       })}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Mobile Icons */}
                        <div className="flex items-center lg:hidden">
                             <button onClick={() => onNavigate('#/personal-notes')} className="p-2 text-foreground hover:text-primary rounded-full" aria-label="Personal Notes">
                                <NotebookIcon className="w-6 h-6" />
                            </button>
                            <button onClick={() => onNavigate('#/academics')} className="p-2 text-foreground hover:text-primary rounded-full" aria-label="Academics">
                                <BookOpenIcon className="w-6 h-6" />
                            </button>
                            <button onClick={() => onNavigate('#/chat')} className="p-2 text-foreground hover:text-primary rounded-full" aria-label="Messages">
                                <MessageIcon className="w-6 h-6" />
                            </button>
                        </div>

                         {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="p-2 text-foreground hover:text-primary rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
                            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>


                        {/* Desktop Profile Dropdown */}
                        <div className="relative hidden md:block">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="md" />
                                <span className="hidden lg:block font-medium text-foreground pr-1">{currentUser.name}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-text-muted transition-transform mr-1 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-slate-800 rounded-md shadow-lg py-1 border border-border dark:border-slate-700">
                                    <a onClick={() => { onNavigate(`#/profile/${currentUser.id}`); setIsMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-slate-700 cursor-pointer">
                                        <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="sm" className="mr-2"/>
                                        Profile
                                    </a>
                                    {currentUser.tag === 'HOD/Dean' && (
                                        <a onClick={() => { onNavigate('#/hod'); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-slate-700 cursor-pointer">
                                            HOD Dashboard
                                        </a>
                                    )}
                                    {currentUser.tag === 'Director' && (
                                        <a onClick={() => { onNavigate('#/director'); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-slate-700 cursor-pointer">
                                            Director Dashboard
                                        </a>
                                    )}
                                    {currentUser.tag === 'Super Admin' && (
                                        <a onClick={() => { onNavigate('#/superadmin'); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-slate-700 cursor-pointer">
                                            Super Admin
                                        </a>
                                    )}
                                    <div className="border-t border-border dark:border-slate-700 my-1"></div>
                                    <a onClick={() => { onLogout(); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-slate-700 cursor-pointer">
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