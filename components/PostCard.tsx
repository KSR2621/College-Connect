import React, { useState, useMemo, useRef } from 'react';
import type { Post, User, Group, ReactionType } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import { CommentIcon, ShareIcon, OptionsIcon, CalendarIcon, GhostIcon, LikeIcon, BriefcaseIcon, LinkIcon } from './Icons';

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

const reactionsList: { type: ReactionType; emoji: string; color: string; label: string }[] = [
    { type: 'like', emoji: '👍', color: 'text-blue-500', label: 'Like' },
    { type: 'love', emoji: '❤️', color: 'text-red-500', label: 'Love' },
    { type: 'haha', emoji: '😂', color: 'text-yellow-500', label: 'Haha' },
    { type: 'wow', emoji: '😮', color: 'text-sky-500', label: 'Wow' },
    { type: 'sad', emoji: '😢', color: 'text-yellow-500', label: 'Sad' },
    { type: 'angry', emoji: '😡', color: 'text-orange-600', label: 'Angry' },
];

const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, groups } = props;
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const wasLongPress = useRef(false);

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

      const topEmojis = counts.slice(0, 3).map(r => ({ emoji: r.emoji, type: r.type }));
      
      counts.forEach(r => {
          total += r.count;
      });

      return { total, topEmojis };
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

    let isConfession: boolean | undefined;
    let authorId: string;
    let content: string;
    
    if ('originalId' in originalPost) {
      isConfession = originalPost.originalIsConfession;
      authorId = originalPost.originalAuthorId;
      content = originalPost.originalContent;
    } else {
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

  // --- Reaction Handlers ---
    const handleMouseEnter = () => {
        clearTimeout(pickerTimerRef.current);
        setPickerVisible(true);
    };
    const handleMouseLeave = () => {
        pickerTimerRef.current = setTimeout(() => {
            setPickerVisible(false);
        }, 300);
    };
    const handleTouchStart = () => {
        wasLongPress.current = false;
        pickerTimerRef.current = setTimeout(() => {
            wasLongPress.current = true;
            setPickerVisible(true);
        }, 400);
    };
    const handleTouchEnd = () => {
        clearTimeout(pickerTimerRef.current);
    };
    const handleLikeClick = () => {
        if (wasLongPress.current) return;
        setPickerVisible(false);
        onReaction(post.id, currentUserReaction ? currentUserReaction.type : 'like');
    };
    const handleReactionSelect = (reactionType: ReactionType) => {
        onReaction(post.id, reactionType);
        setPickerVisible(false);
    };

  // RENDER EVENT CARD
  if (post.isEvent && post.eventDetails) {
    const eventDate = new Date(post.eventDetails.date);
    const now = new Date();
    const fourHours = 4 * 60 * 60 * 1000;
    const isLive = eventDate <= now && now.getTime() - eventDate.getTime() < fourHours;
    const isPast = now.getTime() - eventDate.getTime() >= fourHours;

    return (
        <div className="bg-card border-b border-border sm:rounded-lg sm:shadow-sm sm:border mb-6 flex flex-col overflow-hidden">
            {post.mediaUrl && post.mediaType === 'image' && (
                <div className="relative">
                    <img src={post.mediaUrl} alt={post.eventDetails.title} className="w-full h-48 object-cover" />
                    {isLive && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</span>
                    )}
                </div>
            )}
             <div className="p-4 flex-1">
                <p className={`text-sm font-bold ${isPast ? 'text-text-muted' : 'text-primary'}`}>
                    {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })} at {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit'})}
                </p>
                <h3 className="text-xl font-bold text-foreground mt-1">{post.eventDetails.title}</h3>
                <p className="text-sm text-text-muted mt-1">Organized by {author.name}</p>
                <p className="text-sm text-text-muted font-medium mt-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> 
                    {post.eventDetails.location}
                </p>
                {post.content && <p className="mt-3 text-card-foreground text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>}
            </div>

             {/* Reactions and Comments Info */}
            <div className="flex items-center justify-between text-sm text-text-muted px-4 pb-3">
                <div className="flex items-center space-x-2">
                    {reactionSummary.total > 0 && (
                        <>
                            <div className="flex items-center">
                                {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                    <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
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
            
            {/* Actions Bar */}
            <div className="border-t border-border flex justify-around items-center">
                <div 
                    className="relative flex-1"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {isPickerVisible && (
                        <div className="absolute bottom-full mb-2 left-4 right-4 sm:w-auto sm:left-1/2 sm:-translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-lg transition-opacity duration-200">
                            {reactionsList.map(reaction => (
                                <button 
                                    key={reaction.type} 
                                    onClick={() => handleReactionSelect(reaction.type)}
                                    className="p-1 rounded-full transition-transform duration-150 ease-in-out hover:scale-125 hover:-translate-y-1"
                                    title={reaction.label}
                                >
                                    <span className="text-3xl drop-shadow-md">{reaction.emoji}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <button 
                        onClick={handleLikeClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted transition-colors ${
                            currentUserReaction ? currentUserReaction.color + ' font-bold' : 'text-text-muted'
                        }`}
                    >
                        {currentUserReaction ? (
                            <span className="text-xl" role="img" aria-label={currentUserReaction.label}>{currentUserReaction.emoji}</span>
                        ) : (
                            <LikeIcon className="w-6 h-6" fill="none" stroke="currentColor"/>
                        )}
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
  }


  // RENDER OPPORTUNITY CARD
  if (post.isOpportunity && post.opportunityDetails) {
    const { title, organization, applyLink } = post.opportunityDetails;
    return (
        <div className="bg-card border-b border-border sm:rounded-lg sm:shadow-sm sm:border mb-6">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <BriefcaseIcon className="h-5 w-5"/>
                        </div>
                        <div>
                            <p className="font-bold text-card-foreground">{organization}</p>
                            <p className="text-xs text-text-muted">Posted by {author.name} · {new Date(post.timestamp).toLocaleDateString()}</p>
                        </div>
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

                <div className="mt-4">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <p className="mt-2 text-card-foreground whitespace-pre-wrap line-clamp-4">{post.content}</p>
                </div>
                
                {applyLink && (
                     <div className="mt-4">
                        <a href={applyLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90">
                           <LinkIcon className="w-4 h-4 mr-2"/>
                           Know More & Apply
                        </a>
                    </div>
                )}
                
                {/* Reactions and Comments Info */}
                <div className="flex items-center justify-between text-sm text-text-muted mt-4 pt-3 border-t border-border">
                    <div className="flex items-center space-x-2">
                        {reactionSummary.total > 0 && (
                            <>
                                <div className="flex items-center">
                                    {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                        <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
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
              <div 
                className="relative flex-1"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                  {isPickerVisible && (
                      <div className="absolute bottom-full mb-2 left-4 right-4 sm:w-auto sm:left-1/2 sm:-translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-lg transition-opacity duration-200">
                          {reactionsList.map(reaction => (
                              <button 
                                key={reaction.type} 
                                onClick={() => handleReactionSelect(reaction.type)}
                                className="p-1 rounded-full transition-transform duration-150 ease-in-out hover:scale-125 hover:-translate-y-1"
                                title={reaction.label}
                              >
                                  <span className="text-3xl drop-shadow-md">{reaction.emoji}</span>
                              </button>
                          ))}
                      </div>
                  )}
                  
                  <button 
                      onClick={handleLikeClick}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted transition-colors ${
                          currentUserReaction ? currentUserReaction.color + ' font-bold' : 'text-text-muted'
                      }`}
                  >
                      {currentUserReaction ? (
                        <span className="text-xl" role="img" aria-label={currentUserReaction.label}>{currentUserReaction.emoji}</span>
                      ) : (
                        <LikeIcon className="w-6 h-6" fill="none" stroke="currentColor"/>
                      )}
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
  }

  // RENDER REGULAR/EVENT/SHARED POST
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
                            <div className="flex items-center">
                                {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                    <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
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
          <div 
            className="relative flex-1"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
              {isPickerVisible && (
                  <div className="absolute bottom-full mb-2 left-4 right-4 sm:w-auto sm:left-1/2 sm:-translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-lg transition-opacity duration-200">
                      {reactionsList.map(reaction => (
                          <button 
                            key={reaction.type} 
                            onClick={() => handleReactionSelect(reaction.type)}
                            className="p-1 rounded-full transition-transform duration-150 ease-in-out hover:scale-125 hover:-translate-y-1"
                            title={reaction.label}
                          >
                              <span className="text-3xl drop-shadow-md">{reaction.emoji}</span>
                          </button>
                      ))}
                  </div>
              )}
              
              <button 
                  onClick={handleLikeClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted transition-colors ${
                      currentUserReaction ? currentUserReaction.color + ' font-bold' : 'text-text-muted'
                  }`}
              >
                  {currentUserReaction ? (
                    <span className="text-xl" role="img" aria-label={currentUserReaction.label}>{currentUserReaction.emoji}</span>
                  ) : (
                    <LikeIcon className="w-6 h-6" fill="none" stroke="currentColor"/>
                  )}
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