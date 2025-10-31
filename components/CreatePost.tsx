import React, { useState, useRef } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, VideoCameraIcon, CalendarDaysIcon } from './Icons';

interface CreatePostProps {
  user: User;
  onAddPost: (postDetails: {
    content: string;
    mediaFile?: File | null;
    mediaType?: 'image' | 'video' | null;
    eventDetails?: { title: string; date: string; location: string };
  }) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onAddPost }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setIsEventModalOpen(false);
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
    if(imageInputRef.current) imageInputRef.current.value = "";
    if(videoInputRef.current) videoInputRef.current.value = "";
  };
  
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if(imageInputRef.current) imageInputRef.current.value = "";
    if(videoInputRef.current) videoInputRef.current.value = "";
  };
  
  const handleRemoveEvent = () => {
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    handleRemoveMedia(); // Clear previous media
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() || mediaFile || (eventTitle && eventDate && eventLocation)) {
      onAddPost({
        content,
        mediaFile,
        mediaType,
        eventDetails: (eventTitle && eventDate && eventLocation) 
            ? { title: eventTitle, date: eventDate, location: eventLocation }
            : undefined
      });
      resetState();
    }
  };

  return (
    <div className="bg-surface-dark p-4 rounded-lg shadow-lg">
       <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleMediaChange(e, 'image')}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleMediaChange(e, 'video')}
        className="hidden"
        accept="video/*"
      />
      <div className="flex space-x-4">
        <Avatar src={user.avatarUrl} alt={user.name} />
        <textarea
          className="w-full bg-gray-700 text-text-primary-dark rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary focus:border-transparent resize-none"
          rows={3}
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {eventTitle && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg relative">
          <button
            onClick={handleRemoveEvent}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
            aria-label="Remove event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-text-primary-dark">Event: {eventTitle}</h4>
              <p className="text-sm text-text-secondary-dark">{eventDate} at {eventLocation}</p>
            </div>
          </div>
        </div>
      )}

      {mediaPreview && (
        <div className="mt-4 relative">
          {mediaType === 'image' && <img src={mediaPreview} alt="Selected preview" className="rounded-lg max-h-80 w-auto" />}
          {mediaType === 'video' && <video src={mediaPreview} controls className="rounded-lg max-h-80 w-auto" />}
          <button
            onClick={handleRemoveMedia}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
            aria-label="Remove media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {isEventModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsEventModalOpen(false);
              }}
              className="bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-md"
            >
                <h3 className="text-lg font-bold mb-4">Create an Event</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                    <input type="text" placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} required className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 rounded-md text-text-secondary-dark hover:bg-gray-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-brand-secondary text-white hover:bg-blue-500">Done</button>
                </div>
            </form>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-4 text-text-secondary-dark">
          <button onClick={() => imageInputRef.current?.click()} className="flex items-center space-x-1 hover:text-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!mediaFile || !!eventTitle}>
            <PhotoIcon className="h-5 w-5 text-green-500"/>
            <span>Photo</span>
          </button>
          <button onClick={() => videoInputRef.current?.click()} className="flex items-center space-x-1 hover:text-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!mediaFile || !!eventTitle}>
            <VideoCameraIcon className="h-5 w-5 text-red-500"/>
            <span>Video</span>
          </button>
          <button onClick={() => setIsEventModalOpen(true)} className="flex items-center space-x-1 hover:text-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!mediaFile}>
            <CalendarDaysIcon className="h-5 w-5 text-blue-500"/>
            <span>Event</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() && !mediaFile && !eventTitle.trim()}
          className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CreatePost;