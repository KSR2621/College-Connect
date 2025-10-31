import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { BellIcon, HomeIcon, UsersIcon, BriefcaseIcon, ChatBubbleLeftRightIcon } from './Icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <header className="bg-surface-dark shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-brand-secondary">CampusConnect</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-text-secondary-dark">
            <a href="#/" onClick={(e) => { e.preventDefault(); onNavigate('#/'); }} className="flex flex-col items-center hover:text-white transition-colors cursor-pointer">
              <HomeIcon className="h-6 w-6" />
              <span className="text-xs">Home</span>
            </a>
            <a href="#/groups" onClick={(e) => { e.preventDefault(); onNavigate('#/groups'); }} className="flex flex-col items-center hover:text-white transition-colors cursor-pointer">
              <UsersIcon className="h-6 w-6" />
              <span className="text-xs">Groups</span>
            </a>
            <a href="#/opportunities" onClick={(e) => { e.preventDefault(); onNavigate('#/opportunities'); }} className="flex flex-col items-center hover:text-white transition-colors cursor-pointer">
              <BriefcaseIcon className="h-6 w-6" />
              <span className="text-xs">Opportunities</span>
            </a>
             <a href="#/chat" onClick={(e) => { e.preventDefault(); onNavigate('#/chat'); }} className="flex flex-col items-center hover:text-white transition-colors cursor-pointer">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              <span className="text-xs">Chat</span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <BellIcon className="h-6 w-6 text-text-secondary-dark" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(prev => !prev)} className="focus:outline-none">
                <Avatar src={user.avatarUrl} alt={user.name} />
              </button>
              {dropdownOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-gray-700 rounded-md shadow-lg py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-semibold text-text-primary-dark">{user.name}</p>
                      <p className="text-xs text-text-secondary-dark">{user.email}</p>
                    </div>
                    <a
                      href="#/profile"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('#/profile');
                        setDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-text-primary-dark hover:bg-gray-700 cursor-pointer"
                    >
                      Profile
                    </a>
                    <button
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-text-primary-dark hover:bg-gray-700"
                    >
                      Logout
                    </button>
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