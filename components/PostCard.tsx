import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Post, User, Group, ReactionType, ConfessionMood, Comment } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import ReactionsModal from './ReactionsModal';
import { CommentIcon, RepostIcon, CalendarIcon, GhostIcon, LikeIcon, BriefcaseIcon, LinkIcon, TrashIcon, BookmarkIcon, SendIcon, BookmarkIconSolid, OptionsIcon, CloseIcon, ArrowLeftIcon, ArrowRightIcon } from './Icons';

interface PostCardProps {
  post: Post;
  author: User;
  currentUser: User;
  users: { [key: string]: User };
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  groups: Group[];
  onNavigate: (path: string) => void;
  animationIndex?: number;
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

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ImageGrid: React.FC<{ images: string[]; onImageClick: (index: number) => void }> = ({ images, onImageClick }) => {
    const count = images.length;
    const renderImage = (index: number, className: string = '') => (
        <div key={index} className={`relative cursor-pointer overflow-hidden bg-slate-100 ${className}`} onClick={() => onImageClick(index)}>
            <img src={images[index]} alt={`Post media ${index + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
    );

    if (count === 1) {
        return <div className="aspect-video relative cursor-pointer overflow-hidden rounded-lg group" onClick={() => onImageClick(0)}><img src={images[0]} alt="Post media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" /></div>;
    }
    if (count === 2) {
        return <div className="grid grid-cols-2 gap-1 aspect-video rounded-lg overflow-hidden group">{images.map((_, i) => renderImage(i))}</div>;
    }
    if (count === 3) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-video rounded-lg overflow-hidden group">
                {renderImage(0, 'row-span-2')}
                {renderImage(1)}
                {renderImage(2)}
            </div>
        );
    }
    if (count === 4) {
        return <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-video rounded-lg overflow-hidden group">{images.slice(0, 4).map((_, i) => renderImage(i))}</div>;
    }
    if (count >= 5) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-video rounded-lg overflow-hidden group">
                {renderImage(0)}
                {renderImage(1)}
                {renderImage(2)}
                <div key={3} className="relative cursor-pointer" onClick={() => onImageClick(3)}>
                    <img src={images[3]} alt="Post media 4" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">+{count - 4}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const Lightbox: React.FC<{ images: string[]; startIndex: number; onClose: () => void }> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % images.length);
    };
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImage();
            else if (e.key === 'ArrowLeft') prevImage();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors z-10"><CloseIcon className="w-6 h-6"/></button>
                {images.length > 1 && <>
                    <button onClick={prevImage} className="absolute left-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"><ArrowLeftIcon className="w-6 h-6"/></button>
                    <button onClick={nextImage} className="absolute right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"><ArrowRightIcon className="w-6 h-6"/></button>
                </>}
                <img src={images[currentIndex]} alt="Lightbox view" className="max-h-[90vh] max-w-[90vw] object-contain"/>
            </div>
        </div>
    );
};


const PostCard: React.FC<PostCardProps> = (props) => {
  const { post, author, currentUser, users, onReaction, onAddComment, onDeletePost, onDeleteComment, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, groups, onNavigate, animationIndex } = props;
  const [showComments, setShowComments] = useState(false);
  const [shareModalState, setShareModalState] = useState<{isOpen: boolean, defaultTab: 'share' | 'message'}>({isOpen: false, defaultTab: 'share'});
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const [countdown, setCountdown] = useState('');

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSharedPostExpanded, setIsSharedPostExpanded] = useState(false);
  const TRUNCATE_LENGTH = 350;

  const isSaved = currentUser.savedPosts?.includes(post.id);

  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });

  const postContent = post.content || '';
  const isLongContent = postContent.length > TRUNCATE_LENGTH;

  const sharedPostOriginalContent = post.sharedPost?.originalContent || '';
  const isLongSharedPost = sharedPostOriginalContent.length > TRUNCATE_LENGTH;


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
    const isDirector = currentUser.tag === 'Director';
    if (post.isConfession) {
        return isDirector; // Only director can delete confessions
    }
    return isAuthor || isDirector; // Authors or director can delete other posts
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
        }, 500);
    };
    const handleTouchEnd = () => {
        if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
        setTimeout(() => setPickerVisible(false), 1500);
    };
    const handleReactionClick = (reactionType: ReactionType) => {
        onReaction(post.id, reactionType);
        setPickerVisible(false);
        if(pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    };
    const handleLikeButtonClick = () => {
        if (wasLongPress.current) {
            wasLongPress.current = false;
            return;
        }
        onReaction(post.id, currentUserReaction ? currentUserReaction.type : 'like');
    };

    const renderReactionsButton = (isConfession = false) => {
      const confessionClasses = isConfession 
        ? "text-text-muted hover:text-primary"
        : `${currentUserReaction ? currentUserReaction.color : 'text-text-muted hover:text-primary'}`;
      
      const buttonIcon = isConfession
        ? (currentUserReaction ? <span className="text-xl">{currentUserReaction.emoji}</span> : <LikeIcon className="w-5 h-5"/>)
        : (currentUserReaction ? <span className="text-xl">{currentUserReaction.emoji}</span> : <LikeIcon className="w-5 h-5" fill="none" stroke="currentColor" />);

      return (
        <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
             {isPickerVisible && (
                 <div 
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card p-1.5 rounded-full shadow-lg border border-border flex items-center space-x-1"
                    onMouseEnter={handleMouseEnter} // Keep it open when moving mouse to picker
                    onMouseLeave={handleMouseLeave}
                 >
                    {reactionsList.map(r => (
                        <button key={r.type} onClick={() => handleReactionClick(r.type)} className="text-2xl p-1 rounded-full hover:bg-muted transform transition-transform hover:scale-125">
                            {r.emoji}
                        </button>
                    ))}
                 </div>
             )}
            <button 
                onClick={handleLikeButtonClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex items-center space-x-2 p-2 rounded-lg flex-1 justify-center transition-colors ${confessionClasses}`}
            >
                {buttonIcon}
            </button>
        </div>
      )
    }

  if (post.isConfession) {
    const mood = post.confessionMood && confessionMoods[post.confessionMood] 
        ? confessionMoods[post.confessionMood] 
        : confessionMoods.deep;

    return (
        <div 
            className="p-0.5 rounded-xl animated-border h-full"
            style={{ animationDelay: `${(animationIndex || 0) * 100}ms` }}
        >
            <div className="bg-card rounded-[10px] shadow-card border border-border flex flex-col h-full">
                <div className={`relative p-6 rounded-t-[9px] bg-gradient-to-br ${mood.gradient} text-white flex-1 flex flex-col justify-center items-center text-center`}>
                    <span className="absolute top-3 left-3 text-2xl drop-shadow-md">{mood.emoji}</span>
                    <div
                        className={`text-lg font-semibold leading-relaxed ${post.sharedPost ? 'font-serif' : 'font-sans'}`}
                        dangerouslySetInnerHTML={{ __html: isLongContent && !isExpanded ? postContent.substring(0, TRUNCATE_LENGTH) + '...' : postContent }}
                    />
                     {isLongContent && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/80 hover:text-white font-bold mt-2">
                            {isExpanded ? '...less' : '...more'}
                        </button>
                    )}
                </div>
                {/* Actions */}
                <div className="p-2 border-t border-border">
                    {reactionSummary.total > 0 && (
                        <div className="flex items-center px-2 pb-2 text-sm text-text-muted cursor-pointer" onClick={() => setIsReactionsModalOpen(true)}>
                            {reactionSummary.topEmojis.slice(0, 3).map(r => <span key={r.type} className="text-base -ml-1">{r.emoji}</span>)}
                            <span className="ml-2 font-medium">{reactionSummary.total}</span>
                        </div>
                    )}
                    <div className="flex justify-around items-center">
                        {renderReactionsButton(true)}
                        <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 text-text-muted hover:text-primary p-2 rounded-lg flex-1 justify-center">
                            <CommentIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => onToggleSavePost(post.id)} className={`flex items-center space-x-2 p-2 rounded-lg flex-1 justify-center ${isSaved ? 'text-yellow-500' : 'text-text-muted hover:text-yellow-500'}`}>
                            {isSaved ? <BookmarkIconSolid className="w-5 h-5"/> : <BookmarkIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'message'})} className="flex items-center space-x-2 text-text-muted hover:text-primary p-2 rounded-lg flex-1 justify-center">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
            {isReactionsModalOpen && <ReactionsModal isOpen={isReactionsModalOpen} onClose={() => setIsReactionsModalOpen(false)} reactions={post.reactions} users={users} onNavigate={onNavigate} />}
        </div>
    );
}


  return (
    <div 
      className="p-0.5 rounded-xl animated-border animate-fade-in"
      style={{ animationDelay: `${(animationIndex || 0) * 100}ms` }}
    >
      <div className="bg-card rounded-[10px] shadow-card border border-border">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate(`#/profile/${author.id}`)}>
              <Avatar src={author.avatarUrl} name={author.name} size="md" />
              <div>
                <p className="font-bold text-card-foreground">{author.name}</p>
                <p className="text-xs text-text-muted">{formatTimestamp(post.timestamp)}</p>
              </div>
            </div>
            <div className="relative">
                <button onClick={() => setIsOptionsOpen(!isOptionsOpen)} className="text-text-muted hover:text-foreground p-1 rounded-full hover:bg-muted">
                    <OptionsIcon className="w-5 h-5" />
                </button>
                {isOptionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 border border-border z-10">
                        <button onClick={() => { onToggleSavePost(post.id); setIsOptionsOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted">
                           {isSaved ? <BookmarkIconSolid className="w-5 h-5 mr-2 text-yellow-500"/> : <BookmarkIcon className="w-5 h-5 mr-2"/>}
                           {isSaved ? 'Saved' : 'Save Post'}
                        </button>
                        {canDelete && (
                            <button onClick={() => { handleDelete(); setIsOptionsOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Delete Post
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-4">
            {post.isEvent && post.eventDetails && (
                 <div className="mb-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">{post.eventDetails.title}</h3>
                            <p className="text-sm text-text-muted">{new Date(post.eventDetails.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} &bull; {post.eventDetails.location}</p>
                            {post.eventDetails.link && <a href={post.eventDetails.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="w-4 h-4"/>Event Link</a>}
                             {countdown && <p className="text-xs font-bold text-secondary mt-1">{countdown}</p>}
                        </div>
                    </div>
                </div>
            )}
             {post.isOpportunity && post.opportunityDetails && (
                 <div className="mb-2 p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-accent/20 text-accent-foreground rounded-lg flex items-center justify-center">
                            <BriefcaseIcon className="h-6 w-6"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">{post.opportunityDetails.title}</h3>
                            <p className="text-sm text-text-muted">{post.opportunityDetails.organization}</p>
                            {post.opportunityDetails.applyLink && <a href={post.opportunityDetails.applyLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="w-4 h-4"/>Apply Here</a>}
                        </div>
                    </div>
                </div>
            )}

            {postContent && (
                <div
                    className="text-card-foreground whitespace-pre-wrap text-base"
                    dangerouslySetInnerHTML={{ __html: isLongContent && !isExpanded ? postContent.substring(0, TRUNCATE_LENGTH) + '...' : postContent }}
                />
            )}
            {isLongContent && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary hover:underline text-sm font-semibold mt-1">
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}

            {post.sharedPost && (
                <div className="mt-4 border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        {sharedPostAuthor ? (
                            <>
                                <Avatar src={sharedPostAuthor.avatarUrl} name={sharedPostAuthor.name} size="sm" />
                                <div>
                                    <p className="font-semibold text-sm">{sharedPostAuthor.name}</p>
                                    <p className="text-xs text-text-muted">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><GhostIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-semibold text-sm">Anonymous</p>
                                    <p className="text-xs text-text-muted">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div
                        className="text-text-muted text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: isLongSharedPost && !isSharedPostExpanded ? sharedPostOriginalContent.substring(0, TRUNCATE_LENGTH) + '...' : sharedPostOriginalContent }}
                    />
                     {isLongSharedPost && (
                        <button onClick={() => setIsSharedPostExpanded(!isSharedPostExpanded)} className="text-primary hover:underline text-xs font-semibold mt-1">
                            {isSharedPostExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            )}
          </div>
          
          {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType === 'image' && (
            <div className="px-4 pb-2">
                <ImageGrid images={post.mediaUrls} onImageClick={index => setLightboxState({ isOpen: true, startIndex: index })} />
            </div>
          )}

          {/* Reactions & Comments Count */}
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center text-sm text-text-muted cursor-pointer" onClick={() => setIsReactionsModalOpen(true)}>
              {reactionSummary.total > 0 && (
                  <>
                    {reactionSummary.topEmojis.slice(0, 3).map(r => <span key={r.type} className="text-base -ml-1">{r.emoji}</span>)}
                    <span className="ml-2 font-medium">{reactionSummary.total}</span>
                  </>
              )}
            </div>
            <div className="text-sm text-text-muted">
              {post.comments.length > 0 && <span>{post.comments.length} comments</span>}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="border-t border-border mx-4 py-1 flex justify-around items-center">
             {renderReactionsButton()}
            <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 text-text-muted hover:text-primary p-2 rounded-lg flex-1 justify-center">
              <CommentIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'share'})} className="flex items-center space-x-2 text-text-muted hover:text-primary p-2 rounded-lg flex-1 justify-center">
              <RepostIcon className="w-5 h-5" />
            </button>
             <button onClick={() => setShareModalState({isOpen: true, defaultTab: 'message'})} className="flex items-center space-x-2 text-text-muted hover:text-primary p-2 rounded-lg flex-1 justify-center">
              <SendIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Comment Section */}
          {showComments && (
            <div className="p-4 border-t border-border">
              <CommentSection
                comments={post.comments}
                users={users}
                currentUser={currentUser}
                onAddComment={handleAddCommentForPost}
                postAuthorId={post.authorId}
                onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
              />
            </div>
          )}
        </div>
        
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
        {isReactionsModalOpen && <ReactionsModal isOpen={isReactionsModalOpen} onClose={() => setIsReactionsModalOpen(false)} reactions={post.reactions} users={users} onNavigate={onNavigate} />}
        {lightboxState.isOpen && post.mediaUrls && (
            <Lightbox 
                images={post.mediaUrls}
                startIndex={lightboxState.startIndex}
                onClose={() => setLightboxState({ isOpen: false, startIndex: 0 })}
            />
        )}
    </div>
  );
};

export default PostCard;