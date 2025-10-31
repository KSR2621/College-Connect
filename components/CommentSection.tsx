import React, { useState } from 'react';
import type { Post, User } from '../types';
import Avatar from './Avatar';

interface CommentSectionProps {
  post: Post;
  currentUser: User;
  users: { [key: string]: User };
  onAddComment: (postId: string, text: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ post, currentUser, users, onAddComment }) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-gray-800 p-4 border-t border-gray-700">
      <form onSubmit={handleSubmit} className="flex items-start space-x-3 mb-4">
        <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
        <div className="flex-1">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-gray-700 text-text-primary-dark rounded-full py-2 px-4 border border-gray-600 focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
          />
        </div>
        <button type="submit" className="bg-brand-secondary text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-500" disabled={!commentText.trim()}>
          Send
        </button>
      </form>
      <div className="space-y-4">
        {post.comments.map(comment => {
          const author = users[comment.authorId];
          if (!author) return null;
          return (
            <div key={comment.id} className="flex items-start space-x-3">
              <Avatar src={author.avatarUrl} alt={author.name} size="sm" />
              <div className="flex-1 bg-gray-700 rounded-lg p-3">
                <p className="font-semibold text-sm text-text-primary-dark">{author.name}</p>
                <p className="text-sm text-text-primary-dark">{comment.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSection;
