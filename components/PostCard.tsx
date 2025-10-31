
import React, { useState } from 'react';
import type { Post, User } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import { ThumbsUpIcon, ChatBubbleOvalLeftEllipsisIcon, ShareIcon } from './Icons';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onToggleLike, onAddComment }) => {
  const [showComments, setShowComments] = useState(false);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.floor(seconds)}s`;
  };

  const isLiked = post.likes.includes(currentUser.id);

  return (
    <div className="bg-surface-dark rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-start space-x-4">
          <Avatar src={post.author.avatarUrl} alt={post.author.name} size="md" />
          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <p className="font-bold text-text-primary-dark">{post.author.name}</p>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${post.author.tag === 'Faculty' ? 'bg-red-500 text-white' : post.author.tag === 'Alumni' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                {post.author.tag}
              </span>
            </div>
            <p className="text-sm text-text-secondary-dark">{post.author.department} {post.author.year ? `(Year ${post.author.year})` : ''}</p>
            <p className="text-xs text-text-secondary-dark mt-1">{timeAgo(post.timestamp)} ago</p>
          </div>
        </div>
        <p className="mt-4 text-text-primary-dark whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.imageUrl && (
        <div className="mt-2">
          <img src={post.imageUrl} alt="Post content" className="w-full object-cover" />
        </div>
      )}

      <div className="px-4 sm:px-6 py-2 flex justify-between items-center text-sm text-text-secondary-dark border-t border-gray-700">
         <span>{post.likes.length > 0 ? `${post.likes.length} Likes` : ''}</span>
         <span>{post.comments.length > 0 ? `${post.comments.length} Comments` : ''}</span>
      </div>

      <div className="border-t border-gray-700 p-2 flex justify-around">
        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center space-x-2 p-2 rounded-md w-full justify-center transition-colors ${isLiked ? 'text-brand-secondary' : 'text-text-secondary-dark hover:bg-gray-700'}`}
        >
          <ThumbsUpIcon className="h-5 w-5" />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 p-2 rounded-md w-full justify-center text-text-secondary-dark hover:bg-gray-700 transition-colors"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
          <span>Comment</span>
        </button>
        <button className="flex items-center space-x-2 p-2 rounded-md w-full justify-center text-text-secondary-dark hover:bg-gray-700 transition-colors">
          <ShareIcon className="h-5 w-5" />
          <span>Share</span>
        </button>
      </div>
      
      {showComments && <CommentSection post={post} currentUser={currentUser} onAddComment={onAddComment} />}
    </div>
  );
};

export default PostCard;
