
import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, VideoCameraIcon, CalendarDaysIcon } from './Icons';

interface CreatePostProps {
  user: User;
  onAddPost: (content: string) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onAddPost }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAddPost(content);
      setContent('');
    }
  };

  return (
    <div className="bg-surface-dark p-4 rounded-lg shadow-lg">
      <div className="flex space-x-4">
        <Avatar src={user.avatarUrl} alt={user.name} />
        <textarea
          className="w-full bg-gray-700 text-text-primary-dark rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary focus:border-transparent resize-none"
          rows={3}
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-4 text-text-secondary-dark">
          <button className="flex items-center space-x-1 hover:text-brand-secondary transition-colors">
            <PhotoIcon className="h-5 w-5 text-green-500"/>
            <span>Photo</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-brand-secondary transition-colors">
            <VideoCameraIcon className="h-5 w-5 text-red-500"/>
            <span>Video</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-brand-secondary transition-colors">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500"/>
            <span>Event</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
