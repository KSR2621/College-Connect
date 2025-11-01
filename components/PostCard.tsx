import React, { useState, useMemo } from 'react';
import type { Post, User, Group, ReactionType } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import { CommentIcon, ShareIcon, OptionsIcon, CalendarIcon, GhostIcon, LikeIcon, HeartIcon, HahaIcon, WowIcon, SadIcon, AngryIcon } from './Icons';

interface PostCardProps {
  post: Post;
  author: User;
  currentUser: User;
  users: { [key: string]: User };
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  groups: Group[];
}

const reactionsList: { type: ReactionType; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; label: string }[] = [
    { type: 'like', icon: LikeIcon, color: 'text-blue-500', label: 'Like' },
    { type: 'love', icon: HeartIcon, color: 'text-red-500', label: 'Love' },
    { type: 'haha', icon: HahaIcon, color: 'text-yellow-500', label: 'Haha' },
    { type: 'wow', icon: WowIcon, color: 'text-sky-500', label: 'Wow' },
    { type: 'sad', icon: SadIcon, color: 'text-yellow-500', label: 'Sad' },
    { type: 'angry', icon: AngryIcon, color: 'text-orange-600', label: 'Angry' },
];

const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, groups } = props;
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  if (!author && !post.isConfession) return null;

  const isAuthor = post.authorId === currentUser.id;

  const currentUserReaction = useMemo(() => {
    const reactions = post.reactions || {};
    for (const reaction of reactionsList) {
        if (reactions[reaction.type]?.includes(currentUser.id)) {
            return reaction;
        }
    }
    return null;
  }, [post.reactions, currentUser.id]);

  const reactionSummary = useMemo(() => {
      const reactions = post.reactions || {};
      let total = 0;
      
      const counts = reactionsList.map(r => ({
          ...r,
          count: reactions[r.type]?.length || 0
      })).filter(r => r.count > 0).sort((a,b) => b.count - a.count);

      const topIcons = counts.slice(0, 3).map(r => ({ icon: r.icon, type: r.type, color: r.color }));
      
      counts.forEach(r => {
          total += r.count;
      });

      return { total, topIcons };
  }, [post.reactions]);


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

    // FIX: Use a proper type guard with an if/else block to safely access properties.
    // The 'in' operator in a ternary doesn't sufficiently narrow types for the else clause.
    let isConfession: boolean | undefined;
    let authorId: string;
    let content: string;
    
    if ('originalId' in originalPost) { // This property is unique to SharedPostInfo
      isConfession = originalPost.originalIsConfession;
      authorId = originalPost.originalAuthorId;
      content = originalPost.originalContent;
    } else { // It's a regular Post
      isConfession = originalPost.isConfession;
      authorId = originalPost.authorId;
      content = originalPost.content;
    }

    const authorName = isConfession ? 'Anonymous' : users[authorId]?.name || 'A user';
    const contentToShare = content || 'an image/video';
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
    <div className="bg-card border-b border-border sm:rounded-lg sm:shadow-sm sm:border mb-6">
      {/* Post Header */}
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
                    </div>
                </>
                ) : (
                <>
                    <Avatar src={author.avatarUrl} name={author.name} size="md" />
                    <div>
                    <p className="font-bold text-card-foreground">{author.name}</p>
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
      </div>

       {/* Media */}
      {post.mediaUrl && !post.sharedPost && (
        <div className="bg-muted">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post content" className="w-full max-h-[75vh] object-contain" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full max-h-[75vh]" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
           {/* Event Details */}
          {post.isEvent && post.eventDetails && (
             <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-bold text-lg text-primary">{post.eventDetails.title}</h3>
                <div className="flex items-center text-sm text-primary/80 mt-1">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>{new Date(post.eventDetails.date).toLocaleString()} at {post.eventDetails.location}</span>
                </div>
            </div>
          )}

          {/* Post Text */}
          <div className="my-2 text-card-foreground whitespace-pre-wrap">
            <span className="font-bold mr-2">{post.isConfession ? 'Anonymous' : author?.name}</span>
            {post.content}
          </div>

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

          {/* Reactions and Comments Info */}
            <div className="flex items-center justify-between text-sm text-text-muted mt-3">
                <div className="flex items-center space-x-2">
                    {reactionSummary.total > 0 && (
                        <>
                            <div className="flex items-center -space-x-1.5">
                                {reactionSummary.topIcons.map(({ icon: Icon, type, color }) => (
                                    <div key={type} className="rounded-full bg-card p-0.5 border-2 border-card">
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                ))}
                            </div>
                            <span className="hover:underline cursor-pointer">{reactionSummary.total}</span>
                        </>
                    )}
                </div>
                {post.comments.length > 0 && (
                    <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                        {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </button>
                )}
            </div>
      </div>
      
      {/* Actions Bar */}
      <div className="border-t border-border flex justify-around items-center">
          <div className="relative flex-1 group">
              {/* Reaction Popover */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-card p-1 rounded-full border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                  {reactionsList.map(reaction => (
                      <button key={reaction.type} onClick={() => onReaction(post.id, reaction.type)} className={`${reaction.color} p-1 rounded-full hover:scale-125 transition-transform`}>
                          <reaction.icon className="w-8 h-8" />
                      </button>
                  ))}
              </div>
              
              {/* Main Like/Reaction Button */}
              <button 
                  onClick={() => onReaction(post.id, currentUserReaction ? currentUserReaction.type : 'like')} 
                  className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted transition-colors ${
                      currentUserReaction ? currentUserReaction.color + ' font-bold' : 'text-text-muted'
                  }`}
              >
                  {currentUserReaction ? <currentUserReaction.icon className="w-6 h-6" /> : <LikeIcon className="w-6 h-6" fill="none" stroke="currentColor"/>}
                  <span className="text-sm font-semibold">{currentUserReaction ? currentUserReaction.label : 'Like'}</span>
              </button>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
              <CommentIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Comment</span>
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
              <ShareIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Share</span>
          </button>
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
