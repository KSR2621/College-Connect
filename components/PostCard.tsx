import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Post, User, Group, ReactionType, ConfessionMood } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import ReactionsModal from './ReactionsModal';
import { CommentIcon, ShareIcon, CalendarIcon, GhostIcon, LikeIcon, BriefcaseIcon, LinkIcon, TrashIcon, BookmarkIcon, SendIcon, BookmarkIconSolid } from './Icons';

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
  onToggleSavePost: (postId: string) => void;
  groups: Group[];
  onNavigate: (path: string) => void;
}

const reactionsList: { type: ReactionType; emoji: string; color: string; label: string }[] = [
    { type: 'like', emoji: '👍', color: 'text-blue-500', label: 'Like' },
    { type: 'love', emoji: '❤️', color: 'text-red-500', label: 'Love' },
    { type: 'haha', emoji: '😂', color: 'text-yellow-500', label: 'Haha' },
    { type: 'wow', emoji: '😮', color: 'text-sky-500', label: 'Wow' },
    { type: 'sad', emoji: '😢', color: 'text-yellow-500', label: 'Sad' },
    { type: 'angry', emoji: '😡', color: 'text-orange-600', label: 'Angry' },
];

const confessionMoods: { [key in ConfessionMood]: { emoji: string; gradient: string; } } = {
    love: { emoji: '💘', gradient: 'from-pink-500 to-rose-500' },
    funny: { emoji: '🤣', gradient: 'from-yellow-400 to-orange-500' },
    sad: { emoji: '😢', gradient: 'from-indigo-500 to-blue-600' },
    chaos: { emoji: '🤯', gradient: 'from-purple-600 to-indigo-700' },
    deep: { emoji: '🧠', gradient: 'from-gray-700 to-gray-900' },
};

const formatTimestamp = (timestamp: number) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, groups, onNavigate } = props;
  const [showComments, setShowComments] = useState(false);
  const [shareModalState, setShareModalState] = useState<{isOpen: boolean, defaultTab: 'share' | 'message'}>({isOpen: false, defaultTab: 'share'});
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!post.isEvent || !post.eventDetails) return;

    let timerId: ReturnType<typeof setInterval> | null = null;
    const eventDate = new Date(post.eventDetails.date);
    
    const calculate = () => {
        const now = new Date();
        const diff = eventDate.getTime() - now.getTime();

        if (diff <= 0) {
            setCountdown('');
            if (timerId) clearInterval(timerId);
            return;
        }

        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        let countdownStr = 'Starts in ';
        if (hours > 0) {
            countdownStr += `${hours}h `;
        }
        if (minutes > 0) {
            countdownStr += `${minutes}m`;
        }

        if (hours === 0 && minutes === 0) {
            countdownStr = 'Starts very soon';
        }

        setCountdown(countdownStr.trim());
    };

    if (new Date().getTime() < eventDate.getTime()) {
        calculate();
        timerId = setInterval(calculate, 60000); // Update every minute
    } else {
        setCountdown('');
    }

    return () => {
        if (timerId) clearInterval(timerId);
    };
}, [post.isEvent, post.eventDetails?.date]);


  if (!author && !post.isConfession) return null;

  const isAuthor = post.authorId === currentUser.id;
  
  const canDelete = useMemo(() => {
    const isAdmin = !!currentUser.isAdmin;
    if (post.isConfession) {
        return isAdmin; // Only admins can delete confessions
    }
    return isAuthor || isAdmin; // Authors or admins can delete other posts
  }, [post, currentUser, isAuthor]);

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
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
        onDeletePost(post.id);
    }
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
        setShareModalState({isOpen: false, defaultTab: 'message'});
    } catch (error) {
        console.error("Error sharing post as message:", error);
        alert("Could not share post.");
    }
  };

  const sharedPostAuthor = post.sharedPost ? users[post.sharedPost.originalAuthorId] : null;

  // --- Reaction Handlers ---
    const handleMouseEnter = () => {
        if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
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
        if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
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

    // RENDER CONFESSION CARD
  if (post.isConfession) {
    const mood = post.confessionMood ? confessionMoods[post.confessionMood] : confessionMoods.deep;

    return (
      <div className="flex flex-col">
        <div className={`relative bg-gradient-to-br ${mood.gradient} rounded-lg shadow-card text-white p-8 flex flex-col justify-center items-center transition-transform transform hover:scale-[1.02] min-h-[180px] overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-prism.png')] opacity-10"></div>
          <span className="absolute top-3 left-3 text-3xl opacity-80">{mood.emoji}</span>
          {canDelete && (
             <button 
                onClick={handleDelete} 
                className="absolute top-2 right-2 z-10 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Delete confession"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
          )}
          <div 
            className="text-center leading-relaxed whitespace-pre-wrap break-words w-full"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </div>
        
        <div className="bg-card rounded-b-lg px-4 pt-2 pb-1">
            {/* Reactions and Comments Info */}
            <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-4 text-sm text-text-muted">
                <div className="flex items-center space-x-2">
                    {reactionSummary.total > 0 && (
                        <button onClick={() => setIsReactionsModalOpen(true)} className="flex items-center hover:underline">
                            <div className="flex items-center">
                                {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                    <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
                                ))}
                            </div>
                            <span className="ml-2">{reactionSummary.total}</span>
                        </button>
                    )}
                </div>
                {post.comments.length > 0 && (
                    <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                        {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </button>
                )}
            </div>
            
            {/* Actions Bar */}
            <div className="border-t border-border flex justify-around items-center mt-2">
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
                <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'share'})} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
                    <ShareIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold">Share</span>
                </button>
            </div>
        </div>

        {showComments && (
            <div className="bg-card p-4 rounded-b-lg border-t border-border">
              <CommentSection 
                comments={post.comments}
                users={users}
                currentUser={currentUser}
                onAddComment={handleAddCommentForPost}
              />
            </div>
        )}

        <ShareModal
            isOpen={shareModalState.isOpen}
            onClose={() => setShareModalState({isOpen: false, defaultTab: 'share'})}
            currentUser={currentUser}
            users={Object.values(users)}
            onShareToUser={handleShareToUser}
            postToShare={post}
            onSharePost={onSharePost}
            groups={groups}
            defaultTab={shareModalState.defaultTab}
        />
         {isReactionsModalOpen && (
            <ReactionsModal
                isOpen={isReactionsModalOpen}
                onClose={() => setIsReactionsModalOpen(false)}
                reactions={post.reactions}
                users={users}
                onNavigate={onNavigate}
            />
        )}
      </div>
    );
  }

  // RENDER EVENT CARD
  if (post.isEvent && post.eventDetails) {
    const eventDate = new Date(post.eventDetails.date);
    const now = new Date();
    const fourHours = 4 * 60 * 60 * 1000;
    const isLive = eventDate <= now && now.getTime() - eventDate.getTime() < fourHours;
    const isPast = now.getTime() - eventDate.getTime() >= fourHours;

    return (
        <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover border border-border flex flex-col overflow-hidden transition-shadow duration-300 group">
            {post.mediaUrl && post.mediaType === 'image' && (
                <div className="relative h-48 overflow-hidden">
                    <img src={post.mediaUrl} alt={post.eventDetails.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {isLive && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-10">LIVE</span>
                    )}
                     <div className="absolute bottom-4 left-4 z-10">
                        <h3 className="text-xl font-bold text-white shadow-2xl line-clamp-2">{post.eventDetails.title}</h3>
                        <p className="text-sm font-medium text-white/90 mt-1">by {author.name}</p>
                     </div>
                </div>
            )}
            <div className="p-4 flex flex-col flex-1">
                 {!post.mediaUrl && (
                    <div className="relative flex-1">
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="absolute -top-1 -right-1 z-10 text-text-muted hover:text-destructive p-2 rounded-full hover:bg-destructive/10 transition-colors"
                                aria-label="Delete event"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 pr-8">{post.eventDetails.title}</h3>
                        <p className="text-xs text-text-muted mt-1">By {author.name}</p>
                    </div>
                 )}
                 
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex-shrink-0 bg-card rounded-lg shadow-md w-16 text-center border border-border">
                        <div className="bg-secondary text-secondary-foreground text-xs font-bold uppercase py-1 rounded-t-md">
                            {eventDate.toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-foreground py-1">
                            {eventDate.getDate()}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${isPast ? 'text-text-muted' : 'text-primary'}`}>
                            {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit'})}
                        </p>
                        <p className="text-sm text-text-muted font-medium mt-1 flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" /> 
                            {post.eventDetails.location}
                        </p>
                    </div>
                </div>
                
                {countdown && !isPast && (
                    <div className="mt-3 bg-accent/20 text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full self-start">
                        {countdown}
                    </div>
                )}
                
                {post.content && <p className="mt-3 text-card-foreground text-sm whitespace-pre-wrap line-clamp-2 flex-grow">{post.content}</p>}
            </div>

            <div className="mt-auto border-t border-border">
                {/* Reactions and Comments Info */}
                <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-4 text-sm text-text-muted px-4 py-2">
                    <div className="flex items-center space-x-2">
                        {reactionSummary.total > 0 && (
                            <button onClick={() => setIsReactionsModalOpen(true)} className="flex items-center hover:underline">
                                <div className="flex items-center">
                                    {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                        <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
                                    ))}
                                </div>
                                <span className="ml-2">{reactionSummary.total}</span>
                            </button>
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
                    <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'share'})} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
                        <ShareIcon className="w-6 h-6" />
                        <span className="text-sm font-semibold">Share</span>
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
                isOpen={shareModalState.isOpen}
                onClose={() => setShareModalState({isOpen: false, defaultTab: 'share'})}
                currentUser={currentUser}
                users={Object.values(users)}
                onShareToUser={handleShareToUser}
                postToShare={post}
                onSharePost={onSharePost}
                groups={groups}
                defaultTab={shareModalState.defaultTab}
            />
            {isReactionsModalOpen && (
                <ReactionsModal
                    isOpen={isReactionsModalOpen}
                    onClose={() => setIsReactionsModalOpen(false)}
                    reactions={post.reactions}
                    users={users}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
  }


  // RENDER OPPORTUNITY CARD
  if (post.isOpportunity && post.opportunityDetails) {
    const { title, organization, applyLink } = post.opportunityDetails;
    return (
        <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover border border-border flex flex-col transition-shadow duration-300 group overflow-hidden">
            <div className="p-5 flex-1 flex flex-col relative">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary rounded-l-xl"></div>
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <BriefcaseIcon className="h-6 w-6"/>
                        </div>
                        <div>
                            <p className="font-bold text-card-foreground text-base">{organization}</p>
                            <p className="text-xs text-text-muted">Posted by {author.name}</p>
                        </div>
                    </div>
                    {canDelete && (
                        <button 
                            onClick={handleDelete} 
                            className="text-text-muted hover:text-destructive p-2 rounded-full hover:bg-destructive/10 transition-colors"
                            aria-label="Delete opportunity"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="mt-4 flex-1">
                    <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
                    <p className="mt-2 text-card-foreground text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                </div>
                
                {applyLink && (
                     <div className="mt-5">
                        <a href={applyLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground font-bold py-2.5 px-4 rounded-lg text-sm hover:bg-primary/90 transition-transform transform group-hover:scale-105">
                           <LinkIcon className="w-4 h-4 mr-2"/>
                           Apply or Learn More
                        </a>
                    </div>
                )}
            </div>
            
            <div className="border-t border-border mt-auto">
                {/* Reactions and Comments Info */}
                <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-4 text-sm text-text-muted px-4 py-2">
                    <div className="flex items-center space-x-2">
                        {reactionSummary.total > 0 && (
                             <button onClick={() => setIsReactionsModalOpen(true)} className="flex items-center hover:underline">
                                <div className="flex items-center">
                                    {reactionSummary.topEmojis.map(({ emoji, type }) => (
                                        <span key={type} className="text-lg -ml-1 drop-shadow-sm first:ml-0">{emoji}</span>
                                    ))}
                                </div>
                                <span className="ml-2">{reactionSummary.total}</span>
                            </button>
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
                  <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'share'})} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
                      <ShareIcon className="w-6 h-6" />
                      <span className="text-sm font-semibold">Share</span>
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
                isOpen={shareModalState.isOpen}
                onClose={() => setShareModalState({isOpen: false, defaultTab: 'share'})}
                currentUser={currentUser}
                users={Object.values(users)}
                onShareToUser={handleShareToUser}
                postToShare={post}
                onSharePost={onSharePost}
                groups={groups}
                defaultTab={shareModalState.defaultTab}
            />
            {isReactionsModalOpen && (
                <ReactionsModal
                    isOpen={isReactionsModalOpen}
                    onClose={() => setIsReactionsModalOpen(false)}
                    reactions={post.reactions}
                    users={users}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
  }

  // RENDER REGULAR/SHARED POST
  const isSaved = currentUser.savedPosts?.includes(post.id);
  return (
    <div className="bg-card rounded-xl shadow-card border border-border transition-shadow duration-300">
      {/* Post Header */}
      <div className="p-4 flex items-start space-x-3">
        <div onClick={() => onNavigate(`#/profile/${author.id}`)} className="cursor-pointer">
            <Avatar src={author.avatarUrl} name={author.name} size="lg" />
        </div>
        <div className="flex-1">
            <p onClick={() => onNavigate(`#/profile/${author.id}`)} className="font-bold text-card-foreground leading-tight cursor-pointer hover:underline">{author.name}</p>
            <p className="text-xs text-text-muted">{author.tag} &bull; {author.department}</p>
            <p className="text-xs text-text-muted">{formatTimestamp(post.timestamp)}</p>
        </div>
        {canDelete && (
            <button 
                onClick={handleDelete} 
                className="text-text-muted hover:text-destructive p-2 rounded-full hover:bg-destructive/10 transition-colors"
                aria-label="Delete post"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
          {post.content && (
            <p className="text-card-foreground whitespace-pre-wrap">
              {post.content}
            </p>
          )}
      </div>

       {/* Media */}
      {post.mediaUrl && !post.sharedPost && (
        <div className="bg-muted mt-2">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post content" className="w-full max-h-[500px] object-cover" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full max-h-[500px]" />
          )}
        </div>
      )}

      {/* Render Embedded Shared Post */}
      {post.sharedPost && (
          <div className="px-4 pb-2 mt-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3">
                    <div className="flex items-center space-x-3 mb-3">
                        {post.sharedPost.originalIsConfession ? (
                            <>
                                <div className="flex-shrink-0 h-10 w-10 bg-muted text-foreground rounded-full flex items-center justify-center">
                                    <GhostIcon className="h-5 w-5"/>
                                </div>
                                <div>
                                    <p className="font-bold text-card-foreground text-sm">Anonymous</p>
                                    <p className="text-xs text-text-muted">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                                </div>
                            </>
                        ) : (
                            sharedPostAuthor ? (
                                <>
                                    <Avatar src={sharedPostAuthor.avatarUrl} name={sharedPostAuthor.name} size="md" onClick={() => onNavigate(`#/profile/${sharedPostAuthor.id}`)} className="cursor-pointer" />
                                    <div onClick={() => onNavigate(`#/profile/${sharedPostAuthor.id}`)} className="cursor-pointer">
                                        <p className="font-bold text-card-foreground text-sm hover:underline">{sharedPostAuthor.name}</p>
                                        <p className="text-xs text-text-muted">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                                    </div>
                                </>
                            ) : null
                        )}
                    </div>
                    <p className="text-card-foreground text-sm whitespace-pre-wrap">{post.sharedPost.originalContent}</p>
                </div>
                {post.sharedPost.originalMediaUrl && (
                    <div className="bg-muted">
                    {post.sharedPost.originalMediaType === 'image' ? (
                        <img src={post.sharedPost.originalMediaUrl} alt="Shared content" className="w-full max-h-64 object-cover" />
                    ) : (
                        <video src={post.sharedPost.originalMediaUrl} controls className="w-full max-h-64" />
                    )}
                    </div>
                )}
              </div>
          </div>
      )}

      {/* Social Proof Section */}
        {(reactionSummary.total > 0 || post.comments.length > 0) && (
            <div className="flex items-center justify-between text-sm text-text-muted mx-4 mt-2 pb-2">
                {reactionSummary.total > 0 ? (
                    <button onClick={() => setIsReactionsModalOpen(true)} className="flex items-center space-x-1 hover:underline">
                        <div className="flex items-center">
                            {reactionSummary.topEmojis.slice(0, 3).map(({ emoji, type }) => (
                                <span key={type} className="text-base -ml-1 first:ml-0">{emoji}</span>
                            ))}
                        </div>
                        <span>{reactionSummary.total}</span>
                    </button>
                ) : <div></div>}
                 {post.comments.length > 0 && (
                    <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                        {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </button>
                )}
            </div>
        )}
      
      {/* Actions Bar */}
      <div className="border-t border-border flex justify-around items-center mx-4">
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
                  {currentUserReaction ? <LikeIcon className="w-6 h-6"/> : <LikeIcon className="w-6 h-6" fill="none" stroke="currentColor"/>}
                  <span className="text-sm font-semibold">{currentUserReaction ? currentUserReaction.label : 'Like'}</span>
              </button>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
              <CommentIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Comment</span>
          </button>
          <button onClick={() => onToggleSavePost(post.id)} className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted transition-colors ${isSaved ? 'text-primary font-bold' : 'text-text-muted'}`}>
            {isSaved ? <BookmarkIconSolid className="w-6 h-6" /> : <BookmarkIcon className="w-6 h-6" />}
            <span className="text-sm font-semibold">Save</span>
          </button>
          <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'message'})} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-muted text-text-muted transition-colors">
              <SendIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Send</span>
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
            isOpen={shareModalState.isOpen}
            onClose={() => setShareModalState({isOpen: false, defaultTab: 'share'})}
            currentUser={currentUser}
            users={Object.values(users)}
            onShareToUser={handleShareToUser}
            postToShare={post}
            onSharePost={onSharePost}
            groups={groups}
            defaultTab={shareModalState.defaultTab}
        />
        {isReactionsModalOpen && (
            <ReactionsModal
                isOpen={isReactionsModalOpen}
                onClose={() => setIsReactionsModalOpen(false)}
                reactions={post.reactions}
                users={users}
                onNavigate={onNavigate}
            />
        )}
    </div>
  );
};

export default PostCard;