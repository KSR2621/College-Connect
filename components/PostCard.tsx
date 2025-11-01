import React, { useState } from 'react';
import type { Post, User, Group } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import { LikeIcon, CommentIcon, ShareIcon, OptionsIcon, CalendarIcon, GhostIcon } from './Icons';

interface PostCardProps {
  post: Post;
  author: User;
  currentUser: User;
  users: { [key: string]: User };
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  groups: Group[];
}

const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onToggleLike, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, groups } = props;
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  if (!author && !post.isConfession) return null;

  const isLiked = post.likes.includes(currentUser.id);
  const isAuthor = post.authorId === currentUser.id;

  const handleAddCommentForPost = (text: string) => {
    onAddComment(post.id, text);
  };
  
  const formattedDate = new Date(post.timestamp).toLocaleString();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
        onDeletePost(post.id);
    }
    setShowOptions(false);
  }
  
  const handleShareToUser = async (userId: string) => {
    const originalPost = post.sharedPost ?? post;
    const authorName = originalPost.isConfession ? 'Anonymous' : users[originalPost.authorId]?.name || 'A user';
    const contentToShare = originalPost.content || 'an image/video';
    try {
        const convoId = await onCreateOrOpenConversation(userId);
        onSharePostAsMessage(convoId, authorName, contentToShare);
        setIsShareModalOpen(false);
    } catch (error) {
        console.error("Error sharing post as message:", error);
        alert("Could not share post.");
    }
  };

  const sharedPostAuthor = post.sharedPost ? users[post.sharedPost.originalAuthorId] : null;


  return (
    <div className="bg-card rounded-lg shadow-sm mb-6 border border-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {post.isConfession ? (
                <>
                    <div className="flex-shrink-0 h-10 w-10 bg-muted text-foreground rounded-full flex items-center justify-center">
                        <GhostIcon className="h-6 w-6"/>
                    </div>
                    <div>
                    <p className="font-bold text-card-foreground">Anonymous</p>
                    <p className="text-xs text-text-muted">{formattedDate}</p>
                    </div>
                </>
                ) : (
                <>
                    <Avatar src={author.avatarUrl} name={author.name} size="md" />
                    <div>
                    <p className="font-bold text-card-foreground">{author.name}</p>
                    <p className="text-xs text-text-muted">{formattedDate}</p>
                    </div>
                </>
                )}
            </div>
            {isAuthor && (
                <div className="relative">
                <button onClick={() => setShowOptions(!showOptions)} className="text-text-muted hover:text-foreground">
                    <OptionsIcon className="w-5 h-5" />
                </button>
                {showOptions && (
                    <div className="absolute right-0 mt-2 w-32 bg-card rounded-md shadow-lg py-1 border border-border z-10">
                    <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">
                        Delete Post
                    </button>
                    </div>
                )}
                </div>
            )}
        </div>
        
        {post.isEvent && post.eventDetails && (
             <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-bold text-lg text-primary">{post.eventDetails.title}</h3>
                <div className="flex items-center text-sm text-primary/80 mt-1">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>{new Date(post.eventDetails.date).toLocaleString()} at {post.eventDetails.location}</span>
                </div>
                <p className="mt-2 text-card-foreground">{post.content}</p>
            </div>
        )}

        {!post.isEvent && post.content && (
            <p className="my-4 text-card-foreground whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Render Embedded Shared Post */}
        {post.sharedPost && (
            <div className="mt-4 border border-border rounded-lg p-3">
                <div className="flex items-center space-x-3 mb-3">
                    {post.sharedPost.originalIsConfession ? (
                        <>
                           <div className="flex-shrink-0 h-8 w-8 bg-muted text-foreground rounded-full flex items-center justify-center">
                                <GhostIcon className="h-5 w-5"/>
                            </div>
                            <div>
                                <p className="font-bold text-card-foreground text-sm">Anonymous</p>
                                <p className="text-xs text-text-muted">{new Date(post.sharedPost.originalTimestamp).toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        sharedPostAuthor ? (
                            <>
                                <Avatar src={sharedPostAuthor.avatarUrl} name={sharedPostAuthor.name} size="sm" />
                                <div>
                                    <p className="font-bold text-card-foreground text-sm">{sharedPostAuthor.name}</p>
                                    <p className="text-xs text-text-muted">{new Date(post.sharedPost.originalTimestamp).toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                             <p className="text-sm text-text-muted">Original post by a user who is no longer available.</p>
                        )
                    )}
                </div>

                {post.sharedPost.originalIsEvent && post.sharedPost.originalEventDetails && (
                    <div className="mb-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <h3 className="font-bold text-base text-primary">{post.sharedPost.originalEventDetails.title}</h3>
                        <div className="flex items-center text-xs text-primary/80 mt-1">
                            <CalendarIcon className="w-3 h-3 mr-1.5" />
                            <span>{new Date(post.sharedPost.originalEventDetails.date).toLocaleString()} at {post.sharedPost.originalEventDetails.location}</span>
                        </div>
                    </div>
                )}
                
                {post.sharedPost.originalContent && (
                    <p className="text-card-foreground text-sm whitespace-pre-wrap line-clamp-4">{post.sharedPost.originalContent}</p>
                )}
                
                {post.sharedPost.originalMediaUrl && (
                    <div className="mt-3 bg-muted rounded-md overflow-hidden">
                        {post.sharedPost.originalMediaType === 'image' ? (
                            <img src={post.sharedPost.originalMediaUrl} alt="Shared post content" className="w-full max-h-[300px] object-contain" />
                        ) : (
                            <video src={post.sharedPost.originalMediaUrl} controls className="w-full max-h-[300px]" />
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {post.mediaUrl && !post.sharedPost && (
        <div className="bg-muted">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post content" className="w-full max-h-[600px] object-contain" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full max-h-[600px]" />
          )}
        </div>
      )}
      
      <div className="px-4 py-2">
         <div className="flex justify-between text-sm text-text-muted">
            <span>{post.likes.length > 0 && `${post.likes.length} Likes`}</span>
            <span>{post.comments.length > 0 && `${post.comments.length} Comments`}</span>
         </div>
      </div>

      <div className="border-t border-border mx-4"></div>

      <div className="flex justify-around p-1 text-text-muted">
        <button onClick={() => onToggleLike(post.id)} className={`flex items-center space-x-2 hover:bg-muted p-2 rounded-md w-full justify-center ${isLiked ? 'text-primary' : ''}`}>
          <LikeIcon className="w-5 h-5" />
          <span className="font-semibold text-sm">Like</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:bg-muted p-2 rounded-md w-full justify-center">
          <CommentIcon className="w-5 h-5" />
          <span className="font-semibold text-sm">Comment</span>
        </button>
        <div className="relative w-full">
            <button onClick={() => setIsShareModalOpen(true)} className="flex items-center space-x-2 hover:bg-muted p-2 rounded-md w-full justify-center">
                <ShareIcon className="w-5 h-5" />
                <span className="font-semibold text-sm">Share</span>
            </button>
        </div>
      </div>

      {showComments && (
        <div className="p-4 border-t border-border">
          <CommentSection 
            comments={post.comments}
            users={users}
            currentUser={currentUser}
            onAddComment={handleAddCommentForPost}
          />
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentUser={currentUser}
        users={Object.values(users)}
        onShareToUser={handleShareToUser}
        postToShare={post}
        onSharePost={onSharePost}
        groups={groups}
      />
    </div>
  );
};

export default PostCard;