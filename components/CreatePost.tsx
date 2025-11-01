import React, { useState, useRef } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PostIcon, EventIcon, PhotoIcon, VideoIcon, GhostIcon } from './Icons';

interface CreatePostProps {
  user: User;
  onAddPost: (postDetails: {
    content: string;
    mediaFile?: File | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string; };
    groupId?: string;
    isConfession?: boolean;
  }) => void;
  groupId?: string;
  isConfessionMode?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onAddPost, groupId, isConfessionMode = false }) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'event'>('post');
  
  const [eventDetails, setEventDetails] = useState({ title: '', date: '', time: '', location: '' });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if(imageInputRef.current) imageInputRef.current.value = '';
    if(videoInputRef.current) videoInputRef.current.value = '';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile && postType === 'post') return;

    let finalEventDetails;
    if (postType === 'event' && !isConfessionMode) {
        if (!eventDetails.title || !eventDetails.date || !eventDetails.time || !eventDetails.location) return;
        const combinedDateTime = new Date(`${eventDetails.date}T${eventDetails.time}`).toISOString();
        finalEventDetails = {
            title: eventDetails.title,
            date: combinedDateTime,
            location: eventDetails.location
        };
    }

    onAddPost({
      content,
      mediaFile,
      mediaType,
      eventDetails: finalEventDetails,
      groupId,
      isConfession: isConfessionMode,
    });

    // Reset form
    setContent('');
    setEventDetails({ title: '', date: '', time: '', location: '' });
    clearMedia();
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border border-border">
      <div className="flex items-start space-x-4">
        {isConfessionMode ? (
            <div className="flex-shrink-0 h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <GhostIcon className="h-6 w-6"/>
            </div>
        ) : (
             <Avatar src={user.avatarUrl} name={user.name} size="md" />
        )}
       
        <div className="flex-1">
          {!isConfessionMode && (
            <div className="flex border-b border-border mb-2">
                <button onClick={() => setPostType('post')} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium ${postType === 'post' ? 'border-b-2 border-primary text-primary' : 'text-text-muted'}`}>
                    <PostIcon className="w-5 h-5"/> <span>Create Post</span>
                </button>
                <button onClick={() => setPostType('event')} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium ${postType === 'event' ? 'border-b-2 border-primary text-primary' : 'text-text-muted'}`}>
                    <EventIcon className="w-5 h-5"/> <span>Create Event</span>
                </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {postType === 'event' && !isConfessionMode && (
              <div className="space-y-2 mb-2">
                  <input type="text" placeholder="Event Title*" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={eventDetails.title} onChange={e => setEventDetails({...eventDetails, title: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="date" aria-label="Event Date" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={eventDetails.date} onChange={e => setEventDetails({...eventDetails, date: e.target.value})} />
                    <input type="time" aria-label="Event Time" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={eventDetails.time} onChange={e => setEventDetails({...eventDetails, time: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Location*" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={eventDetails.location} onChange={e => setEventDetails({...eventDetails, location: e.target.value})} />
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isConfessionMode ? "Share your confession anonymously..." : (postType === 'event' ? "Describe your event..." : `What's on your mind, ${user.name.split(' ')[0]}?`)}
              className="w-full bg-transparent focus:outline-none resize-none text-card-foreground text-lg placeholder-text-muted"
              rows={3}
            />

            {mediaPreview && (
              <div className="mt-4 relative">
                {mediaType === 'image' ? (
                  <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
                ) : (
                  <video src={mediaPreview} controls className="rounded-lg max-h-80 w-auto" />
                )}
                <button onClick={clearMedia} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center">&times;</button>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <div className="flex space-x-2">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
                <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center text-text-muted hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <PhotoIcon className="w-6 h-6" />
                </button>
                 <button type="button" onClick={() => videoInputRef.current?.click()} className="flex items-center text-text-muted hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors">
                  <VideoIcon className="w-6 h-6" />
                </button>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
