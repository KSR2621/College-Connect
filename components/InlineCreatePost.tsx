import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, EventIcon } from './Icons';

interface InlineCreatePostProps {
  user: User;
  onOpenCreateModal: (defaultType: 'post' | 'event') => void;
}

const InlineCreatePost: React.FC<InlineCreatePostProps> = ({ user, onOpenCreateModal }) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border border-border">
      <div className="flex items-center space-x-3">
        <Avatar src={user.avatarUrl} name={user.name} size="md" />
        <button
          className="flex-1 text-left bg-input hover:bg-border transition-colors cursor-pointer rounded-full px-4 py-2.5 text-text-muted"
          onClick={() => onOpenCreateModal('post')}
          aria-label="Create a new post"
        >
          What's on your mind, {user.name.split(' ')[0]}?
        </button>
      </div>
      <div className="flex justify-around items-center mt-3 pt-3 border-t border-border">
        <button 
          onClick={() => onOpenCreateModal('post')} 
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors font-semibold"
          aria-label="Create a photo or video post"
        >
          <PhotoIcon className="w-6 h-6 text-green-500" />
          <span>Photo/Video</span>
        </button>
        <div className="h-6 w-px bg-border"></div>
        <button 
          onClick={() => onOpenCreateModal('event')} 
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors font-semibold"
          aria-label="Create a new event"
        >
          <EventIcon className="w-6 h-6 text-red-500" />
          <span>Event</span>
        </button>
      </div>
    </div>
  );
};

export default InlineCreatePost;
