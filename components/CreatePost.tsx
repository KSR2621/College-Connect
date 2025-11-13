import React, { useState, useRef } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PostIcon, EventIcon, PhotoIcon, VideoIcon, GhostIcon, LinkIcon, CloseIcon } from './Icons';

interface CreatePostProps {
  user: User;
  onAddPost: (postDetails: {
    content: string;
    mediaDataUrls?: string[] | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string; link?: string; };
    groupId?: string;
    isConfession?: boolean;
  }) => void;
  groupId?: string;
  isConfessionMode?: boolean;
  isModalMode?: boolean;
  defaultType?: 'post' | 'event';
}

const StyleButton: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; children: React.ReactNode; }> = ({ onMouseDown, children }) => (
    <button 
      type="button" 
      onMouseDown={onMouseDown} // Use onMouseDown to prevent the editor from losing focus
      className="font-semibold text-sm w-8 h-8 flex items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
    >
      {children}
    </button>
);


const CreatePost: React.FC<CreatePostProps> = ({ user, onAddPost, groupId, isConfessionMode = false, isModalMode = false, defaultType }) => {
  const [postType, setPostType] = useState<'post' | 'event'>(defaultType || 'post');
  
  const [eventDetails, setEventDetails] = useState({ title: '', date: '', time: '', location: '', link: '' });
  const [mediaDataUrls, setMediaDataUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const clearMedia = () => {
    setMediaDataUrls([]);
    setMediaPreviews([]);
    setMediaType(null);
    if(imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeMediaItem = (index: number) => {
    setMediaDataUrls(urls => urls.filter((_, i) => i !== index));
    setMediaPreviews(previews => previews.filter((_, i) => i !== index));
    if (mediaDataUrls.length === 1) { // if it was the last one
        setMediaType(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        if (files.length + mediaDataUrls.length > 5) {
            alert("You can upload a maximum of 5 images.");
            return;
        }

        // FIX: Explicitly type 'file' as File to resolve properties 'type', 'size', and 'name'.
        Array.from(files).forEach((file: File) => {
            if (file.type.startsWith('video/')) {
                alert("Video uploads are not supported. Please select an image.");
                return;
            }
            if (file.size > 700 * 1024) { 
                alert(`Image "${file.name}" is too large (max 700KB).`);
                return;
            }
      
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setMediaDataUrls(prev => [...prev, result]);
                setMediaPreviews(prev => [...prev, result]);
                setMediaType('image');
            };
            // FIX: The 'file' is now correctly typed as File, which is a Blob, satisfying readAsDataURL.
            reader.readAsDataURL(file);
        });
    }
  };

  const applyStyle = (e: React.MouseEvent, command: string) => {
    e.preventDefault();
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalContent = editorRef.current?.innerHTML || '';
    const currentTextContent = editorRef.current?.innerText.trim() || '';

    if (postType === 'post' && !currentTextContent && mediaDataUrls.length === 0) {
        alert("Please write something or add an image to create a post.");
        return;
    }

    let finalEventDetails;
    if (postType === 'event' && !isConfessionMode) {
        if (!eventDetails.title || !eventDetails.date || !eventDetails.time || !eventDetails.location) {
            alert("Please fill in all required event details: Title, Date, Time, and Location.");
            return;
        }
        const combinedDateTime = new Date(`${eventDetails.date}T${eventDetails.time}`).toISOString();
        finalEventDetails = {
            title: eventDetails.title,
            date: combinedDateTime,
            location: eventDetails.location,
            link: eventDetails.link
        };
    }

    onAddPost({
      content: finalContent,
      mediaDataUrls,
      mediaType,
      eventDetails: finalEventDetails,
      groupId,
      isConfession: isConfessionMode,
    });

    // Reset form
    if (editorRef.current) editorRef.current.innerHTML = '';
    setEventDetails({ title: '', date: '', time: '', location: '', link: '' });
    clearMedia();
  };
  
  const containerClasses = isModalMode
    ? "p-4 bg-slate-50"
    : "p-1 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl shadow-lg mb-6";
    
  const inputBaseClasses = "w-full text-foreground bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200";
  const inputSizeClasses = "px-3 py-2 text-sm";
  const inputIconPadding = "pl-10";


  return (
    <div className={containerClasses}>
      <div className={isModalMode ? "" : "bg-card rounded-lg"}>
        <div className="flex items-start space-x-4 p-4">
            {isConfessionMode ? (
                <div className="flex-shrink-0 h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center border-2 border-primary/20">
                    <GhostIcon className="h-7 w-7"/>
                </div>
            ) : (
                <Avatar src={user.avatarUrl} name={user.name} size="lg" />
            )}
        
            <div className="flex-1">
            {!isConfessionMode && (
                <div className="bg-muted/50 rounded-lg p-1 flex gap-1 mb-3">
                    <button onClick={() => setPostType('post')} className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${postType === 'post' ? 'bg-card shadow-sm text-primary' : 'text-text-muted hover:bg-card/50'}`}>
                        <PostIcon className="w-5 h-5"/> <span>Create Post</span>
                    </button>
                    <button onClick={() => setPostType('event')} className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${postType === 'event' ? 'bg-card shadow-sm text-primary' : 'text-text-muted hover:bg-card/50'}`}>
                        <EventIcon className="w-5 h-5"/> <span>Create Event</span>
                    </button>
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {postType === 'event' && !isConfessionMode && (
                <div className="space-y-3 mb-3">
                    <input type="text" placeholder="Event Title*" className={`${inputBaseClasses} ${inputSizeClasses}`} value={eventDetails.title} onChange={e => setEventDetails({...eventDetails, title: e.target.value})} />
                    <div className="flex gap-3">
                        <input type="date" aria-label="Event Date" className={`${inputBaseClasses} ${inputSizeClasses}`} value={eventDetails.date} onChange={e => setEventDetails({...eventDetails, date: e.target.value})} />
                        <input type="time" aria-label="Event Time" className={`${inputBaseClasses} ${inputSizeClasses}`} value={eventDetails.time} onChange={e => setEventDetails({...eventDetails, time: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Location*" className={`${inputBaseClasses} ${inputSizeClasses}`} value={eventDetails.location} onChange={e => setEventDetails({...eventDetails, location: e.target.value})} />
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/70" />
                        <input type="url" placeholder="Link (e.g., meeting, tickets)" className={`${inputBaseClasses} ${inputSizeClasses} ${inputIconPadding}`} value={eventDetails.link} onChange={e => setEventDetails({...eventDetails, link: e.target.value})} />
                    </div>
                </div>
                )}
                
                <div className="border border-border rounded-lg bg-slate-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/50 transition-all duration-200">
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        data-placeholder={isConfessionMode ? "Share your confession anonymously..." : (postType === 'event' ? "Describe your event..." : `What's on your mind, ${user.name.split(' ')[0]}?`)}
                        className="w-full min-h-[120px] max-h-[400px] overflow-y-auto no-scrollbar p-3 bg-transparent text-card-foreground text-lg focus:outline-none resize-y empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted empty:before:cursor-text"
                    />
                    <div className="p-2 border-t border-border flex items-center">
                        <StyleButton onMouseDown={(e) => applyStyle(e, 'bold')}><b>B</b></StyleButton>
                    </div>
                </div>

                {mediaPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {mediaPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                                <img src={preview} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                                <button type="button" onClick={() => removeMediaItem(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 leading-none w-5 h-5 flex items-center justify-center hover:bg-black">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}


                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <div className="flex space-x-1">
                    <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} multiple className="hidden" />
                    {!isConfessionMode && (
                        <>
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center text-text-muted hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors" aria-label="Add photo">
                        <PhotoIcon className="w-6 h-6" />
                        </button>
                        <button type="button" className="flex items-center text-text-muted/50 p-2 rounded-full cursor-not-allowed" aria-label="Add video (disabled)" title="Video uploads are not supported">
                        <VideoIcon className="w-6 h-6" />
                        </button>
                        </>
                    )}
                </div>
                <button type="submit" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-2.5 px-8 rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                    Post
                </button>
                </div>
            </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;