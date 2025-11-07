import React from 'react';
import type { User } from '../types';
import CreatePost from './CreatePost';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onAddPost: (postDetails: {
    content: string;
    mediaDataUrls?: string[] | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string; link?: string; };
    groupId?: string;
    isConfession?: boolean;
  }) => void;
  defaultType?: 'post' | 'event';
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, user, onAddPost, defaultType }) => {
  if (!isOpen) return null;

  const handlePostSubmit = (postDetails: Parameters<typeof onAddPost>[0]) => {
    onAddPost(postDetails);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold text-center flex-1 text-foreground">Create Post</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground text-2xl leading-none">&times;</button>
        </div>
        <CreatePost user={user} onAddPost={handlePostSubmit} isModalMode={true} defaultType={defaultType} />
      </div>
    </div>
  );
};

export default CreatePostModal;
