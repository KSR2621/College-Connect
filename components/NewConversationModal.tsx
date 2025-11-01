import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ isOpen, onClose, users, currentUser, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.id !== currentUser.id &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, currentUser, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-16 sm:pt-24 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md flex flex-col h-full max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground text-center">New Message</h2>
            <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search for people..."
            className="w-full mt-3 bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className="flex items-center p-3 cursor-pointer hover:bg-muted"
                        onClick={() => onSelectUser(user.id)}
                    >
                        <Avatar src={user.avatarUrl} name={user.name} size="md" />
                        <div className="ml-3">
                            <p className="font-semibold text-card-foreground">{user.name}</p>
                            <p className="text-sm text-text-muted">{user.department}</p>
                        </div>
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

export default NewConversationModal;