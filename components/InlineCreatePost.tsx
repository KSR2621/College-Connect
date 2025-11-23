
import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, CalendarIcon, FileTextIcon, SparkleIcon, CloseIcon } from './Icons';

interface InlineCreatePostProps {
  user: User;
  onOpenCreateModal: (defaultType: 'post' | 'event') => void;
}

const InlineCreatePost: React.FC<InlineCreatePostProps> = ({ user, onOpenCreateModal }) => {
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  return (
    <>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6 animate-fade-in transition-all duration-200">
            {/* Top Row: Avatar + Input Trigger */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onOpenCreateModal('post')}>
                    <Avatar src={user.avatarUrl} name={user.name} size="md" className="w-12 h-12 ring-1 ring-slate-100 dark:ring-slate-800" />
                </div>
                <button
                    className="flex-1 text-left bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-full h-12 px-5 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onClick={() => onOpenCreateModal('post')}
                >
                    Start a post, {user.name.split(' ')[0]}...
                </button>
            </div>
            
            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center justify-between pt-1 sm:px-2">
                <button 
                    onClick={() => setComingSoonFeature('Media')} 
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex-1 justify-center sm:justify-start"
                >
                    <PhotoIcon className="w-6 h-6 text-sky-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-foreground">Media</span>
                </button>
                
                <button 
                    onClick={() => onOpenCreateModal('event')} 
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex-1 justify-center sm:justify-start"
                >
                    <CalendarIcon className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-foreground">Event</span>
                </button>

                <button 
                    onClick={() => setComingSoonFeature('Article')} 
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex-1 justify-center sm:justify-start"
                >
                    <FileTextIcon className="w-6 h-6 text-rose-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-foreground hidden sm:inline">Write article</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-foreground sm:hidden">Article</span>
                </button>
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
                        <span className="font-bold text-foreground">{comingSoonFeature}</span> creation is under development. Stay tuned!
                    </p>
                    
                    <button 
                        onClick={() => setComingSoonFeature(null)} 
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

export default InlineCreatePost;
