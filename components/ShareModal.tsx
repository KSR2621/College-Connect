import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { LinkIcon, SendIcon } from './Icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onShareToUser: (userId: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, currentUser, users, onShareToUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.id !== currentUser.id &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, currentUser, searchTerm]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const postUrl = window.location.href; // Share the current URL
    navigator.clipboard.writeText(postUrl).then(() => {
        setLinkCopied(true);
        setTimeout(() => {
            setLinkCopied(false);
            onClose();
        }, 1500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-16 sm:pt-24 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md flex flex-col h-full max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground text-center">Share Post</h2>
        </div>
        
        <div className="p-4">
             <button 
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80"
             >
                <LinkIcon className="w-5 h-5"/>
                <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
        </div>

        <div className="px-4 pb-2">
            <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search to send a message..."
            className="w-full bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
        </div>

        <div className="flex-1 overflow-y-auto">
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted"
                        onClick={() => onShareToUser(user.id)}
                    >
                        <div className="flex items-center space-x-3">
                            <Avatar src={user.avatarUrl} name={user.name} size="md" />
                            <div>
                                <p className="font-semibold text-card-foreground">{user.name}</p>
                                <p className="text-sm text-text-muted">{user.department}</p>
                            </div>
                        </div>
                        <SendIcon className="w-5 h-5 text-text-muted"/>
                    </div>
                ))
            ) : (
                <p className="text-center text-text-muted p-8">No users found.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
