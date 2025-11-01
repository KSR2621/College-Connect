import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { CloseIcon } from './Icons';

interface StoryViewersListProps {
  viewedBy: string[];
  users: { [key: string]: User };
  onClose: () => void;
}

const StoryViewersList: React.FC<StoryViewersListProps> = ({ viewedBy, users, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/50 z-30 flex justify-center items-end" onClick={onClose}>
      <div className="bg-card rounded-t-lg shadow-xl w-full max-w-md flex flex-col h-full max-h-[50vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-foreground">Viewed By ({viewedBy.length})</h3>
          <button onClick={onClose} className="p-1 text-text-muted rounded-full hover:bg-muted">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {viewedBy.length > 0 ? (
            viewedBy.map(userId => {
              const user = users[userId];
              if (!user) return null;
              return (
                <div key={userId} className="flex items-center p-2 rounded-md">
                  <Avatar src={user.avatarUrl} name={user.name} size="md" />
                  <div className="ml-3">
                    <p className="font-semibold text-card-foreground">{user.name}</p>
                    <p className="text-sm text-text-muted">{user.department}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-text-muted p-8">No views yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewersList;