
import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PostIcon, EventIcon, PhotoIcon, CloseIcon, CalendarIcon, ClockIcon, LinkIcon, MapPinIcon, SparkleIcon, BriefcaseIcon } from './Icons';

interface CreatePostProps {
  user: User;
  onAddPost: (postDetails: {
    content: string;
    mediaDataUrls?: string[] | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { 
        title: string; 
        date: string; 
        location: string; 
        link?: string; 
        category?: string; 
        tags?: string[] 
    };
    groupId?: string;
    isConfession?: boolean;
  }) => void;
  groupId?: string;
  isConfessionMode?: boolean;
  isModalMode?: boolean;
  defaultType?: 'post' | 'event';
}

const StyleButton: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; children: React.ReactNode }> = ({ onMouseDown, children }) => (
    <button 
      type="button" 
      onMouseDown={onMouseDown}
      className="font-bold text-sm w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
);

const CreatePost: React.FC<CreatePostProps> = ({ user, onAddPost, groupId, isConfessionMode = false, isModalMode = false, defaultType }) => {
  const [postType, setPostType] = useState<'post' | 'event'>(defaultType || 'post');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
  
  const [eventDetails, setEventDetails] = useState({ 
      title: '', date: '', time: '', location: '', link: '', 
      category: 'Workshop', tags: '' 
  });
  const [mediaDataUrls, setMediaDataUrls] = useState<string[]>([]);
  
  const [hasText, setHasText] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load Draft
  useEffect(() => {
      const draft = localStorage.getItem('postDraft');
      if (draft && !isModalMode && postType === 'post') {
          if (editorRef.current) {
              editorRef.current.innerHTML = draft;
              setHasText(!!draft.trim());
          }
      }
  }, [isModalMode, postType]);

  const clearMedia = () => {
    setMediaDataUrls([]);
    if(imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeMediaItem = (index: number) => {
    setMediaDataUrls(urls => urls.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Intercept file change if manually triggered, though we block the button now
    setShowFeaturePopup(true);
    return;
  };

  const triggerFeaturePopup = () => {
      setShowFeaturePopup(true);
  };

  const applyStyle = (e: React.MouseEvent, command: string) => {
    e.preventDefault();
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const handleInput = () => {
      const text = editorRef.current?.innerText.trim();
      const html = editorRef.current?.innerHTML || '';
      setHasText(!!text);
      
      // Save draft for main posts only
      if (!isModalMode && postType === 'post') {
          localStorage.setItem('postDraft', html);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalContent = editorRef.current?.innerHTML || '';
    const currentTextContent = editorRef.current?.innerText.trim() || editorRef.current?.textContent?.trim() || '';

    if (postType === 'post' && !currentTextContent && mediaDataUrls.length === 0) {
        alert("Please write something to create a post.");
        return;
    }

    let finalEventDetails;
    if (postType === 'event' && !isConfessionMode) {
        const title = eventDetails.title.trim();
        const date = eventDetails.date;
        const time = eventDetails.time;
        const location = eventDetails.location.trim();

        if (!title || !date || !time || !location) {
            alert("Please fill in all required event details: Title, Date, Time, and Location.");
            return;
        }

        try {
            const combinedDateTime = new Date(`${date}T${time}`);
            if (isNaN(combinedDateTime.getTime())) {
                alert("Invalid date or time entered.");
                return;
            }
            finalEventDetails = {
                title,
                date: combinedDateTime.toISOString(),
                location,
                link: eventDetails.link.trim(),
                category: eventDetails.category,
                tags: eventDetails.tags.split(',').map(t => t.trim()).filter(t => t),
                organizer: user.department // Default to user dept
            };
        } catch (error) {
            console.error("Date parsing error:", error);
            alert("Failed to process event date/time. Please check your inputs.");
            return;
        }
    }

    setIsSubmitting(true);
    try {
        const determinedMediaType = mediaDataUrls.length > 0 ? 'image' : null;

        await onAddPost({
            content: finalContent,
            mediaDataUrls,
            mediaType: determinedMediaType,
            eventDetails: finalEventDetails,
            groupId,
            isConfession: isConfessionMode,
        });

        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setHasText(false);
        }
        localStorage.removeItem('postDraft');
        
        setEventDetails({ title: '', date: '', time: '', location: '', link: '', category: 'Workshop', tags: '' });
        clearMedia();
    } catch (error) {
        console.error("Failed to post:", error);
        alert("Failed to create post. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isEventFormValid = postType === 'event' 
    ? eventDetails.title.trim() && eventDetails.date && eventDetails.time && eventDetails.location.trim()
    : true;

  const isPostFormValid = postType === 'post'
    ? hasText || mediaDataUrls.length > 0
    : true;

  return (
    <>
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
        {/* Post Type Switcher */}
        {!isConfessionMode && (
            <div className="px-4 pt-4 pb-2">
                <div className="bg-muted/50 p-1 rounded-xl flex relative overflow-hidden">
                    <button 
                        type="button" 
                        onClick={() => setPostType('post')} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 z-10 ${postType === 'post' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        <PostIcon className="w-4 h-4"/> Regular Post
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setPostType('event')} 
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 z-10 ${postType === 'event' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        <EventIcon className="w-4 h-4"/> Event
                    </button>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="flex gap-3 mb-4 items-center">
                <Avatar src={user.avatarUrl} name={user.name} size="md" />
                <div>
                    <p className="font-bold text-sm text-foreground leading-none">{user.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                            {groupId ? 'Group Member' : 'Public'}
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {postType === 'event' && !isConfessionMode && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Event Title */}
                        <div className="relative group">
                            <input 
                                type="text" 
                                disabled={isSubmitting} 
                                placeholder="Event Title" 
                                className="w-full text-2xl font-bold bg-transparent border-b-2 border-border focus:border-primary py-2 placeholder:text-muted-foreground/40 text-foreground outline-none transition-colors"
                                value={eventDetails.title} 
                                onChange={e => setEventDetails({...eventDetails, title: e.target.value})} 
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <BriefcaseIcon className="w-3 h-3"/> Category
                                </label>
                                <div className="relative">
                                    <select 
                                        disabled={isSubmitting} 
                                        className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-all appearance-none" 
                                        value={eventDetails.category} 
                                        onChange={e => setEventDetails({...eventDetails, category: e.target.value})} 
                                    >
                                        <option value="Workshop">Workshop</option>
                                        <option value="Meetup">Meetup</option>
                                        <option value="Competition">Competition</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Sports">Sports</option>
                                        <option value="E-Cell">E-Cell</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {/* Tags */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    Tags (Comma sep)
                                </label>
                                <input 
                                    type="text" 
                                    disabled={isSubmitting} 
                                    placeholder="AI, Dance, Coding..."
                                    className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-all" 
                                    value={eventDetails.tags} 
                                    onChange={e => setEventDetails({...eventDetails, tags: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarIcon className="w-3 h-3"/> Date
                                </label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        disabled={isSubmitting} 
                                        className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-all" 
                                        value={eventDetails.date} 
                                        onChange={e => setEventDetails({...eventDetails, date: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <ClockIcon className="w-3 h-3"/> Time
                                </label>
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        disabled={isSubmitting} 
                                        className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-all" 
                                        value={eventDetails.time} 
                                        onChange={e => setEventDetails({...eventDetails, time: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <MapPinIcon className="w-4 h-4"/>
                                </div>
                                <input 
                                    type="text" 
                                    disabled={isSubmitting} 
                                    placeholder="Where is it happening?" 
                                    className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50" 
                                    value={eventDetails.location} 
                                    onChange={e => setEventDetails({...eventDetails, location: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* Link */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Registration Link (Optional)</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <LinkIcon className="w-4 h-4"/>
                                </div>
                                <input 
                                    type="url" 
                                    disabled={isSubmitting} 
                                    placeholder="External URL if applicable" 
                                    className="w-full bg-muted/30 border border-border hover:border-primary/50 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50" 
                                    value={eventDetails.link} 
                                    onChange={e => setEventDetails({...eventDetails, link: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent my-4"></div>
                    </div>
                )}
                
                <div 
                    className={`min-h-[120px] relative cursor-text`}
                    onClick={() => !isSubmitting && editorRef.current?.focus()}
                >
                    <div
                        ref={editorRef}
                        contentEditable={!isSubmitting}
                        suppressContentEditableWarning={true}
                        onInput={handleInput}
                        data-placeholder={postType === 'event' ? "Describe the event agenda, speakers, etc..." : "What's on your mind?"}
                        className="w-full h-full outline-none text-lg text-foreground placeholder:text-muted-foreground empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 cursor-text leading-relaxed whitespace-pre-wrap"
                    />
                </div>

                {mediaDataUrls.length > 0 && (
                    <div className={`grid gap-1 rounded-xl overflow-hidden ${
                        mediaDataUrls.length === 1 ? 'grid-cols-1' : 
                        mediaDataUrls.length === 2 ? 'grid-cols-2' : 
                        mediaDataUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                        {mediaDataUrls.map((preview, index) => (
                            <div key={index} className={`relative group bg-muted ${
                                mediaDataUrls.length === 3 && index === 0 ? 'row-span-2' : ''
                            }`}>
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover aspect-square sm:aspect-video" />
                                <button 
                                    type="button" 
                                    disabled={isSubmitting} 
                                    onClick={() => removeMediaItem(index)} 
                                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-sm backdrop-blur-sm"
                                >
                                    <CloseIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {mediaDataUrls.length < 5 && (
                            <button 
                                type="button"
                                onClick={triggerFeaturePopup}
                                className="flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/60 aspect-square sm:aspect-video transition-colors text-muted-foreground hover:text-primary group border-2 border-dashed border-border/50 hover:border-primary/30"
                            >
                                <div className="p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform">
                                    <PhotoIcon className="w-6 h-6"/>
                                </div>
                                <span className="text-xs font-bold mt-2">Add Photo</span>
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} multiple className="hidden" disabled={isSubmitting} />
                {!isConfessionMode && (
                    <>
                        <button 
                            type="button" 
                            disabled={isSubmitting} 
                            onClick={triggerFeaturePopup} 
                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-full transition-colors" 
                            title="Add Photo"
                        >
                            <PhotoIcon className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-border mx-2"></div>
                        <StyleButton onMouseDown={(e) => applyStyle(e, 'bold')}>B</StyleButton>
                        <StyleButton onMouseDown={(e) => applyStyle(e, 'italic')}>I</StyleButton>
                    </>
                )}
            </div>
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !isEventFormValid || !isPostFormValid}
                className="bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 transform active:scale-95"
            >
                {isSubmitting ? 'Posting...' : postType === 'event' ? 'Host Event' : 'Post'}
            </button>
        </div>
    </div>

    {/* Coming Soon Popup Modal */}
    {showFeaturePopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowFeaturePopup(false)}>
            <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border max-w-sm w-full text-center transform transition-all scale-100 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-secondary"></div>
                <button onClick={() => setShowFeaturePopup(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
                
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
                    <SparkleIcon className="w-10 h-10 animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-black text-foreground mb-2">Coming Soon! 📸</h3>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                    Media uploads are currently in development. We're adding secure storage to bring you the best experience.
                </p>
                
                <button 
                    onClick={() => setShowFeaturePopup(false)} 
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                    Got it
                </button>
            </div>
        </div>
    )}
    </>
  );
};

export default CreatePost;
