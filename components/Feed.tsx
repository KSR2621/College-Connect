import React from 'react';
import PostCard from './PostCard';
import type { Post, User } from '../types';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  users: { [key: string]: User };
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

const Feed: React.FC<FeedProps> = ({ posts, currentUser, users, onToggleLike, onAddComment }) => {
  return (
    <div className="space-y-6">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          users={users}
          onToggleLike={onToggleLike}
          onAddComment={onAddComment}
        />
      ))}
    </div>
  );
};

export default Feed;
