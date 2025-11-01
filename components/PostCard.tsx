import React, { useState } from 'react';
import type { Post, User } from '../types';
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
}

const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onToggleLike, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage } = props;
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
    const authorName = post.isConfession ? 'Anonymous' : author.name;
    try {
        const convoId = await onCreateOrOpenConversation(userId);
        onSharePostAsMessage(convoId, authorName, post.content);
        setIsShareModalOpen(false);
        // Maybe show a success toast here
    } catch (error) {
        console.error("Error sharing post as message:", error);
        alert("Could not share post.");
    }
  };


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
      </div>

      {post.mediaUrl && (
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
      />
    </div>
  );
};

export default PostCard;