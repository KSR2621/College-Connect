
import React from 'react';
import type { Post, User, Group, ReactionType } from '../types';
import PostCard from './PostCard';
import { CheckCircleIcon } from './Icons';

interface FeedProps {
  posts: Post[];
  users: { [key: string]: User };
  currentUser: User;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  groups: Group[];
  onNavigate: (path: string) => void;
}

const Feed: React.FC<FeedProps> = (props) => {
  const { posts, users, currentUser, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, groups, onNavigate } = props;
  
  if (posts.length === 0) {
    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-border">
                <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">No posts yet</h3>
            <p className="text-muted-foreground">Be the first to share something with your campus!</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      {posts.map((post, index) => {
          const author = users[post.authorId];
          // Don't render post if author data is not yet available (unless it's a confession)
          if (!author && !post.isConfession) return null;
          return (
            <PostCard 
              key={post.id}
              post={post}
              author={author}
              currentUser={currentUser}
              users={users}
              onReaction={onReaction}
              onAddComment={onAddComment}
              onDeletePost={onDeletePost}
              onDeleteComment={onDeleteComment}
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
      
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-60 animate-fade-in">
          <div className="p-3 bg-muted rounded-full mb-3">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold">You're all caught up!</p>
          <p className="text-xs">Check back later for more updates.</p>
      </div>
    </div>
  );
};

export default Feed;
