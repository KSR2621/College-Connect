

import React from 'react';
import type { Post, User, Group, ReactionType } from '../types';
import PostCard from './PostCard';

interface FeedProps {
  posts: Post[];
  users: { [key: string]: User };
  currentUser: User;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  groups: Group[];
  onNavigate: (path: string) => void;
}

const Feed: React.FC<FeedProps> = (props) => {
  const { posts, users, currentUser, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, groups, onNavigate } = props;
  
  if (posts.length === 0) {
    return <div className="text-center text-text-muted mt-8">No posts to show.</div>;
  }
  
  return (
    <div className="space-y-4">
      {posts.map((post, index) => {
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
              onReaction={onReaction}
              onAddComment={onAddComment}
              onDeletePost={onDeletePost}
              onCreateOrOpenConversation={onCreateOrOpenConversation}
              onSharePostAsMessage={onSharePostAsMessage}
              onSharePost={onSharePost}
              onToggleSavePost={onToggleSavePost}
              groups={groups}
              onNavigate={onNavigate}
              animationIndex={index}
            />
          );
      })}
    </div>
  );
};

export default Feed;