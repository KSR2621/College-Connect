
import React, { useState } from 'react';
import type { Comment, User } from '../types';
import Avatar from './Avatar';
import { SendIcon, TrashIcon } from './Icons';

interface CommentSectionProps {
  comments: Comment[];
  users: { [key: string]: User };
  currentUser: User;
  onAddComment: (text: string) => void;
  postAuthorId: string;
  onDeleteComment: (commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, users, currentUser, onAddComment, postAuthorId, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="pt-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
        <Avatar src={currentUser.avatarUrl} name={currentUser.name} size="md" />
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-input border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
        />
        <button type="submit" className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!newComment.trim()}>
          <SendIcon className="w-5 h-5" />
        </button>
      </form>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.sort((a,b) => a.timestamp - b.timestamp).map((comment) => {
          const author = users[comment.authorId];
          if (!author) return null;
          const canDelete = currentUser.id === comment.authorId || currentUser.id === postAuthorId || currentUser.tag === 'Director';
          return (
            <div key={comment.id} className="group flex items-start space-x-3">
              <Avatar src={author.avatarUrl} name={author.name} size="sm" />
              <div className="flex-1">
                <div className="bg-muted p-3 rounded-lg flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{author.name}</p>
                    <p className="text-card-foreground text-sm">{comment.text}</p>
                  </div>
                  {canDelete && (
                      <button onClick={() => onDeleteComment(comment.id)} className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive p-1 flex-shrink-0 ml-2">
                          <TrashIcon className="w-4 h-4"/>
                      </button>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSection;