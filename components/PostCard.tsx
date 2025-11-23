
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Post, User, Group, ReactionType, ConfessionMood, Comment } from '../types';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import ReactionsModal from './ReactionsModal';
import { CommentIcon, RepostIcon, CalendarIcon, GhostIcon, LikeIcon, BriefcaseIcon, LinkIcon, TrashIcon, BookmarkIcon, SendIcon, BookmarkIconSolid, OptionsIcon, CloseIcon, ArrowLeftIcon, ArrowRightIcon, MapPinIcon, ClockIcon } from './Icons';

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
    love: { emoji: '💘', gradient: 'from-rose-500 via-pink-600 to-purple-700' },
    funny: { emoji: '🤣', gradient: 'from-amber-400 via-orange-500 to-red-500' },
    sad: { emoji: '😢', gradient: 'from-blue-600 via-indigo-700 to-slate-800' },
    chaos: { emoji: '🤯', gradient: 'from-purple-600 via-fuchsia-700 to-pink-800' },
    deep: { emoji: '🧠', gradient: 'from-slate-700 via-slate-800 to-black' },
};

const formatTimestamp = (timestamp: number) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ImageGrid: React.FC<{ images: string[]; onImageClick: (index: number) => void }> = ({ images, onImageClick }) => {
    const count = images.length;
    const renderImage = (index: number, className: string = '') => (
        <div key={index} className={`relative cursor-pointer overflow-hidden bg-muted ${className}`} onClick={() => onImageClick(index)}>
            <img src={images[index]} alt={`Post media ${index + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
    );

    if (count === 1) {
        return <div className="aspect-square sm:aspect-video relative cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm" onClick={() => onImageClick(0)}><img src={images[0]} alt="Post media" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" /></div>;
    }
    if (count === 2) {
        return <div className="grid grid-cols-2 gap-1 aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-border/50">{images.map((_, i) => renderImage(i))}</div>;
    }
    if (count === 3) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-border/50">
                {renderImage(0, 'row-span-2')}
                {renderImage(1)}
                {renderImage(2)}
            </div>
        );
    }
    if (count === 4) {
        return <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-border/50">{images.slice(0, 4).map((_, i) => renderImage(i))}</div>;
    }
    if (count >= 5) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-border/50">
                {renderImage(0)}
                {renderImage(1)}
                {renderImage(2)}
                <div key={3} className="relative cursor-pointer" onClick={() => onImageClick(3)}>
                    <img src={images[3]} alt="Post media 4" className="absolute inset-0 w-full h-full object-cover filter blur-sm" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors hover:bg-black/30">
                        <span className="text-white text-2xl font-bold">+{count - 4}</span>
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
    }, []);

    return (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-white/80 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"><CloseIcon className="w-6 h-6"/></button>
                {images.length > 1 && <>
                    <button onClick={prevImage} className="absolute left-4 text-white/80 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"><ArrowLeftIcon className="w-6 h-6"/></button>
                    <button onClick={nextImage} className="absolute right-4 text-white/80 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"><ArrowRightIcon className="w-6 h-6"/></button>
                </>}
                <img src={images[currentIndex]} alt="Lightbox view" className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"/>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full font-medium">
                    {currentIndex + 1} / {images.length}
                </div>
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
  const isReadOnly = currentUser.isApproved === false;

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
        
        let countdownStr = 'In ';
        if (hours > 0) countdownStr += `${hours}h `;
        if (minutes > 0) countdownStr += `${minutes}m`;
        if (hours === 0 && minutes === 0) countdownStr = 'Starting now';

        setCountdown(countdownStr.trim());
    };

    if (new Date().getTime() < eventDate.getTime()) {
        calculate();
        timerId = setInterval(calculate, 60000);
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
    if (post.isConfession) return isDirector;
    return isAuthor || isDirector;
  }, [post, currentUser, isAuthor]);

  const currentUserReaction = useMemo(() => {
    const reactions = post.reactions || {};
    for (const reaction of reactionsList) {
        if (reactions[reaction.type]?.includes(currentUser.id)) return reaction;
    }
    return null;
  }, [post.reactions, currentUser.id]);

  const reactionSummary = useMemo(() => {
      const reactions = post.reactions || {};
      let total = 0;
      const counts = reactionsList.map(r => ({...r, count: reactions[r.type]?.length || 0})).filter(r => r.count > 0).sort((a,b) => b.count - a.count);
      counts.forEach(r => total += r.count);
      return { total, topEmojis: counts.slice(0, 3) };
  }, [post.reactions]);


  const handleAddCommentForPost = (text: string) => {
    if (isReadOnly) return;
    onAddComment(post.id, text);
  };
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) onDeletePost(post.id);
  }
  
  const handleShareToUser = async (userId: string) => {
    if (isReadOnly) return;
    const originalPost = post.sharedPost ?? post;
    const isConfession = 'originalId' in originalPost ? originalPost.originalIsConfession : originalPost.isConfession;
    const authorId = 'originalId' in originalPost ? originalPost.originalAuthorId : post.authorId;
    const content = 'originalId' in originalPost ? originalPost.originalContent : post.content;

    const authorName = isConfession ? 'Anonymous' : users[authorId]?.name || 'A user';
    const contentToShare = content || 'an image/video';
    try {
        const convoId = await onCreateOrOpenConversation(userId);
        onSharePostAsMessage(convoId, authorName, contentToShare);
        setShareModalState({isOpen: false, defaultTab: 'message'});
    } catch (error) {
        console.error("Error sharing:", error);
    }
  };

  const sharedPostAuthor = post.sharedPost ? users[post.sharedPost.originalAuthorId] : null;

  // --- Reaction Handlers ---
    const handleMouseEnter = () => {
        if (isReadOnly) return;
        if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
        setPickerVisible(true);
    };
    const handleMouseLeave = () => {
        pickerTimerRef.current = setTimeout(() => setPickerVisible(false), 300);
    };
    const handleTouchStart = () => {
        if (isReadOnly) return;
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
    };
    const handleLikeButtonClick = () => {
        if (isReadOnly || wasLongPress.current) {
            wasLongPress.current = false;
            return;
        }
        onReaction(post.id, currentUserReaction ? currentUserReaction.type : 'like');
    };

    const renderReactionsButton = (isConfession = false) => {
      const btnClass = isConfession 
        ? "text-white/80 hover:text-white hover:bg-white/10" 
        : `transition-colors ${currentUserReaction ? currentUserReaction.color + ' bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900' : 'text-muted-foreground hover:text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-transparent hover:border-rose-200 dark:hover:border-rose-800'}`;
        
      const icon = currentUserReaction 
        ? <span className="text-xl animate-bounce-in">{currentUserReaction.emoji}</span> 
        : <LikeIcon className="w-5 h-5" fill="none" stroke="currentColor" />;

      return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
             {isPickerVisible && (
                 <div 
                    className="absolute bottom-full mb-2 -left-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl border border-border flex items-center gap-1.5 z-20 animate-scale-in origin-bottom-left"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                 >
                    {reactionsList.map(r => (
                        <button key={r.type} onClick={() => handleReactionClick(r.type)} className="text-2xl hover:scale-125 transition-transform origin-bottom transform">
                            {r.emoji}
                        </button>
                    ))}
                 </div>
             )}
            <button 
                onClick={handleLikeButtonClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                disabled={isReadOnly}
                className={`px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-semibold border ${btnClass} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {icon}
                {!isConfession && <span className={`text-sm ${currentUserReaction ? currentUserReaction.color : ''}`}>{currentUserReaction ? currentUserReaction.label : 'Like'}</span>}
            </button>
        </div>
      )
    }

  if (post.isConfession) {
    const mood = post.confessionMood && confessionMoods[post.confessionMood] ? confessionMoods[post.confessionMood] : confessionMoods.deep;
    return (
        <div className="mb-8 animate-fade-in transform transition-all duration-300 hover:scale-[1.01]" style={{ animationDelay: `${(animationIndex || 0) * 100}ms` }}>
            <div className="rounded-3xl overflow-hidden shadow-lg relative group border border-white/10">
                <div className={`relative p-10 bg-gradient-to-br ${mood.gradient} text-white flex flex-col justify-center items-center text-center min-h-[320px]`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <span className="text-6xl mb-6 block filter drop-shadow-xl animate-bubble-in">{mood.emoji}</span>
                        <div
                            className={`text-xl md:text-3xl font-bold leading-relaxed font-serif drop-shadow-md max-w-prose tracking-wide`}
                            dangerouslySetInnerHTML={{ __html: isLongContent && !isExpanded ? postContent.substring(0, TRUNCATE_LENGTH) + '...' : postContent }}
                        />
                         {isLongContent && (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/90 hover:text-white font-bold mt-4 text-sm underline decoration-white/30 hover:decoration-white">
                                {isExpanded ? 'Read Less' : 'Read More'}
                            </button>
                        )}
                    </div>
                    {canDelete && (
                        <button onClick={handleDelete} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    )}
                </div>
                {/* Confession Actions */}
                <div className="bg-black/80 backdrop-blur-md text-gray-300 p-3 flex justify-between items-center border-t border-white/10">
                    <div className="flex gap-2">
                        {renderReactionsButton(true)}
                        <button onClick={() => setShowComments(!showComments)} className="px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-2">
                            <CommentIcon className="w-5 h-5"/>
                            <span className="text-sm font-bold">{post.comments.length > 0 ? post.comments.length : 'Comment'}</span>
                        </button>
                    </div>
                    <div className="text-xs font-medium opacity-60 px-3">{formatTimestamp(post.timestamp)}</div>
                </div>
                 {/* Comment Section */}
                {showComments && (
                    <div className="px-4 pb-4 bg-black/90 border-t border-white/10 text-gray-300">
                        <CommentSection comments={post.comments} users={users} currentUser={currentUser} onAddComment={handleAddCommentForPost} postAuthorId={post.authorId} onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}/>
                    </div>
                )}
            </div>
            {isReactionsModalOpen && <ReactionsModal isOpen={isReactionsModalOpen} onClose={() => setIsReactionsModalOpen(false)} reactions={post.reactions} users={users} onNavigate={onNavigate} />}
        </div>
    );
  }

  // Regular Post Layout
  return (
    <div 
      className="mb-8 animate-fade-in group relative" 
      style={{ animationDelay: `${(animationIndex || 0) * 100}ms` }}
    >
      {/* Decorative glow - More intense on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl opacity-0 group-hover:opacity-40 transition duration-500 blur-lg group-hover:blur-xl"></div>

      <div className="relative bg-card dark:bg-slate-900 border border-border/60 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center space-x-3.5 cursor-pointer group/author" onClick={() => onNavigate(`#/profile/${author.id}`)}>
          <div className="relative">
             <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full opacity-0 group-hover/author:opacity-100 transition duration-300 blur-[2px]"></div>
             <div className="relative">
                <Avatar src={author.avatarUrl} name={author.name} size="md" className="ring-2 ring-card"/>
             </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
                <p className="font-bold text-foreground text-base leading-none group-hover/author:text-primary transition-colors">{author.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                    author.tag === 'Student' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                    author.tag === 'Teacher' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                    'bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/30 dark:to-fuchsia-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                }`}>
                    {author.department || author.tag}
                </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
                {formatTimestamp(post.timestamp)} 
                {post.groupId && (
                    <>
                        <span className="text-muted-foreground/40 text-[10px] px-1">•</span>
                        <span className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5" onClick={(e) => {e.stopPropagation(); onNavigate(`#/groups/${post.groupId}`)}}>
                            {groups.find(g => g.id === post.groupId)?.name}
                        </span>
                    </>
                )}
            </p>
          </div>
        </div>
        <div className="relative">
            <button onClick={() => setIsOptionsOpen(!isOptionsOpen)} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
                <OptionsIcon className="w-5 h-5" />
            </button>
            {isOptionsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-popover rounded-xl shadow-xl py-1 border border-border z-20 animate-scale-in">
                    <button onClick={() => { onToggleSavePost(post.id); setIsOptionsOpen(false); }} className="flex items-center w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted font-medium transition-colors">
                       {isSaved ? <BookmarkIconSolid className="w-4 h-4 mr-2.5 text-primary"/> : <BookmarkIcon className="w-4 h-4 mr-2.5"/>}
                       {isSaved ? 'Unsave Post' : 'Save Post'}
                    </button>
                    {canDelete && (
                        <button onClick={() => { handleDelete(); setIsOptionsOpen(false); }} className="flex items-center w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 font-medium transition-colors">
                            <TrashIcon className="w-4 h-4 mr-2.5" />
                            Delete Post
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-2">
        {post.isEvent && post.eventDetails && (
             <div className="mb-6 mt-2 rounded-2xl overflow-hidden relative group/event cursor-pointer shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600"></div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CalendarIcon className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8"/>
                </div>
                {/* Glass effect content */}
                <div className="relative p-5 text-white flex flex-row gap-5 items-center">
                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-md rounded-xl p-3 text-center min-w-[70px] border border-white/20 shadow-inner">
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-90">{new Date(post.eventDetails.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="block text-3xl font-black leading-none mt-1">{new Date(post.eventDetails.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold leading-tight mb-1.5 drop-shadow-sm">{post.eventDetails.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm font-medium opacity-95">
                            <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> {new Date(post.eventDetails.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4"/> {post.eventDetails.location}</span>
                        </div>
                    </div>
                </div>
                {/* Action Strip */}
                <div className="bg-black/20 backdrop-blur-md p-3 flex justify-between items-center border-t border-white/10 relative z-10">
                    {countdown ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 flex items-center gap-1.5 animate-pulse text-white">⏳ {countdown}</span> : <span></span>}
                    {post.eventDetails.link && <a href={post.eventDetails.link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs bg-white text-indigo-600 px-4 py-1.5 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-sm">Register Now</a>}
                </div>
            </div>
        )}
         {post.isOpportunity && post.opportunityDetails && (
             <div className="mb-6 mt-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden shadow-sm">
                <div className="flex items-start space-x-4 relative z-10">
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl flex items-center justify-center shadow-md">
                        <BriefcaseIcon className="h-6 w-6"/>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-lg leading-tight">{post.opportunityDetails.title}</h3>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">{post.opportunityDetails.organization}</p>
                        {post.opportunityDetails.applyLink && <a href={post.opportunityDetails.applyLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm bg-white dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 dark:hover:bg-emerald-800 transition-colors border border-emerald-200 dark:border-emerald-700 shadow-sm"><LinkIcon className="w-4 h-4"/>Apply Here</a>}
                    </div>
                </div>
            </div>
        )}

        {postContent && (
            <div className={`whitespace-pre-wrap leading-relaxed mb-4 ${postContent.length < 80 && !post.mediaUrls ? 'text-2xl font-medium text-foreground/90 tracking-tight' : 'text-base text-foreground/80'}`}>
                <div dangerouslySetInnerHTML={{ __html: isLongContent && !isExpanded ? postContent.substring(0, TRUNCATE_LENGTH) + '...' : postContent }} />
                {isLongContent && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary hover:underline text-sm font-bold mt-1">
                        {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>
        )}

        {post.sharedPost && (
            <div className="mt-3 mb-3 border border-border rounded-2xl p-4 bg-muted/30">
                <div className="flex items-center space-x-2 mb-3">
                    {sharedPostAuthor ? (
                        <>
                            <Avatar src={sharedPostAuthor.avatarUrl} name={sharedPostAuthor.name} size="sm" />
                            <div>
                                <p className="font-bold text-sm text-foreground">{sharedPostAuthor.name}</p>
                                <p className="text-xs text-muted-foreground">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><GhostIcon className="w-4 h-4"/></div>
                            <div>
                                <p className="font-bold text-sm text-foreground">Anonymous</p>
                                <p className="text-xs text-muted-foreground">{formatTimestamp(post.sharedPost.originalTimestamp)}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div
                    className="text-muted-foreground text-sm whitespace-pre-wrap font-medium leading-relaxed pl-2 border-l-2 border-border"
                    dangerouslySetInnerHTML={{ __html: isLongSharedPost && !isSharedPostExpanded ? sharedPostOriginalContent.substring(0, TRUNCATE_LENGTH) + '...' : sharedPostOriginalContent }}
                />
                 {isLongSharedPost && (
                    <button onClick={() => setIsSharedPostExpanded(!isSharedPostExpanded)} className="text-primary hover:underline text-xs font-bold mt-2 pl-2">
                        {isSharedPostExpanded ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>
        )}
      </div>
      
      {/* Media Display */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mt-1 mb-4 px-0 sm:px-2">
            <ImageGrid images={post.mediaUrls} onImageClick={index => setLightboxState({ isOpen: true, startIndex: index })} />
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-3 flex justify-between items-center border-t border-border/50 bg-muted/5">
         <div className="flex items-center gap-2">
             {renderReactionsButton()}
             
             <button onClick={() => setShowComments(!showComments)} className="px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 font-semibold">
                <CommentIcon className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Comment</span>
             </button>
             
             <button 
                onClick={() => !isReadOnly && setShareModalState({isOpen: true, defaultTab: 'share'})} 
                disabled={isReadOnly}
                className={`px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2 font-semibold ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <RepostIcon className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Share</span>
             </button>
         </div>
         <div>
             <button onClick={() => onToggleSavePost(post.id)} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                {isSaved ? <BookmarkIconSolid className="w-5 h-5 text-primary"/> : <BookmarkIcon className="w-5 h-5"/>}
             </button>
         </div>
      </div>

      {/* Reactions & Comments Count */}
      {(reactionSummary.total > 0 || post.comments.length > 0) && (
          <div className="px-5 py-2.5 bg-muted/30 text-xs text-muted-foreground font-medium border-t border-border/50 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => setIsReactionsModalOpen(true)}>
                {reactionSummary.total > 0 && (
                    <div className="flex items-center">
                        <div className="flex -space-x-1 mr-1.5">
                            {reactionSummary.topEmojis.map(r => <span key={r.type} className="text-sm relative z-10 filter drop-shadow-sm">{r.emoji}</span>)}
                        </div>
                        <span>{reactionSummary.total} likes</span>
                    </div>
                )}
            </div>
            {post.comments.length > 0 && (
                <div className="cursor-pointer hover:text-foreground transition-colors hover:underline" onClick={() => setShowComments(!showComments)}>
                    {post.comments.length} comments
                </div>
            )}
          </div>
      )}

      {/* Comment Section */}
      {showComments && (
        <div className="px-5 pb-5 border-t border-border/50 bg-muted/10">
          {isReadOnly && <p className="text-xs text-center text-muted-foreground py-3">Comments are disabled.</p>}
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
    </div>
  );
};

export default React.memo(PostCard);
