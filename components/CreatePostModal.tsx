
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
  groupId?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, user, onAddPost, defaultType, groupId }) => {
  if (!isOpen) return null;

  const handlePostSubmit = async (postDetails: Parameters<typeof onAddPost>[0]) => {
    try {
      await onAddPost(postDetails);
      onClose();
    } catch (error) {
      console.error("Error in modal submit:", error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/10 flex-shrink-0">
          <h2 className="text-lg font-bold text-center flex-1 text-foreground">Create Post</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors leading-none">
            <span className="text-xl">&times;</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col relative">
            <CreatePost user={user} onAddPost={handlePostSubmit} isModalMode={true} defaultType={defaultType} groupId={groupId} />
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
