
import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, EventIcon, VideoIcon, SparkleIcon, CloseIcon } from './Icons';

interface InlineCreatePostProps {
  user: User;
  onOpenCreateModal: (defaultType: 'post' | 'event') => void;
}

const InlineCreatePost: React.FC<InlineCreatePostProps> = ({ user, onOpenCreateModal }) => {
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  return (
    <>
        <div className="mb-8 animate-fade-in">
            <div className="bg-card dark:bg-slate-900 rounded-3xl shadow-sm border border-border/60 p-5 transition-all duration-300 hover:shadow-md group">
                <div className="flex items-center gap-4 mb-5">
                    <div className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200 relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-50 blur-[1px]"></div>
                        <div className="relative">
                            <Avatar src={user.avatarUrl} name={user.name} size="md" className="ring-2 ring-card" />
                        </div>
                    </div>
                    <button
                        className="flex-1 text-left bg-muted/40 hover:bg-muted/60 transition-all cursor-pointer rounded-2xl px-5 py-3.5 text-muted-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent hover:border-primary/10"
                        onClick={() => onOpenCreateModal('post')}
                        aria-label="Create a new post"
                    >
                        What's happening on campus, {user.name.split(' ')[0]}?
                    </button>
                </div>
                
                <div className="flex items-center justify-between gap-2 px-1">
                    <button 
                        onClick={() => setComingSoonFeature('Photo Uploads')} 
                        className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all group/btn active:scale-95"
                    >
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm group-hover/btn:scale-110 transition-transform">
                            <PhotoIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 transition-colors">Photo</span>
                    </button>
                    
                    <button 
                        onClick={() => setComingSoonFeature('Video Uploads')} 
                        className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group/btn active:scale-95"
                    >
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm group-hover/btn:scale-110 transition-transform">
                            <VideoIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 transition-colors">Video</span>
                    </button>

                    <button 
                        onClick={() => onOpenCreateModal('event')} 
                        className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all group/btn active:scale-95"
                    >
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm group-hover/btn:scale-110 transition-transform">
                            <EventIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300 transition-colors">Event</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Coming Soon Modal */}
        {comingSoonFeature && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setComingSoonFeature(null)}>
                <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border max-w-sm w-full text-center transform transition-all scale-100 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-secondary"></div>
                    <button onClick={() => setComingSoonFeature(null)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
                        <SparkleIcon className="w-10 h-10 animate-pulse" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-foreground mb-2">Coming Soon! 🚀</h3>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        We're working hard to bring <span className="font-bold text-foreground">{comingSoonFeature}</span> to CampusConnect. Stay tuned for future updates!
                    </p>
                    
                    <button 
                        onClick={() => setComingSoonFeature(null)} 
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                        Can't Wait!
                    </button>
                </div>
            </div>
        )}
    </>
  );
};

export default InlineCreatePost;
