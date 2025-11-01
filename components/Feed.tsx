
import React from 'react';
import type { Post, User } from '../types';
import PostCard from './PostCard';

interface FeedProps {
  posts: Post[];
  users: { [key: string]: User };
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
}

const Feed: React.FC<FeedProps> = (props) => {
  const { posts, users, currentUser, onToggleLike, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage } = props;
  
  if (posts.length === 0) {
    return <div className="text-center text-text-muted mt-8">No posts to show.</div>;
  }
  
  return (
    <div>
      {posts.map(post => {
          const author = users[post.authorId];
          // Don't render post if author data is not yet available (unless it's a confession)
          if (!author && !post.isConfession) return null;
          return (
            <PostCard 
              key={post.id}
              post={post}
              author={author} // author can be null for confessions
              currentUser={currentUser}
              users={users}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
              onDeletePost={onDeletePost}
              onCreateOrOpenConversation={onCreateOrOpenConversation}
              onSharePostAsMessage={onSharePostAsMessage}
            />
          );
      })}
    </div>
  );
};

export default Feed;
