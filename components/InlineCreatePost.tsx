
import React, { useState } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { PhotoIcon, EventIcon, FileTextIcon, SparkleIcon, CloseIcon } from './Icons';

interface InlineCreatePostProps {
  user: User;
  onOpenCreateModal: (defaultType: 'post' | 'event') => void;
}

const InlineCreatePost: React.FC<InlineCreatePostProps> = ({ user, onOpenCreateModal }) => {
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  return (
    <>
        <div className="mb-4 animate-fade-in">
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                        <Avatar src={user.avatarUrl} name={user.name} size="lg" className="w-12 h-12" />
                    </div>
                    <button
                        className="flex-1 text-left bg-background hover:bg-muted/60 border border-border/60 hover:border-muted-foreground/30 transition-all duration-200 rounded-full px-5 h-12 text-muted-foreground font-semibold text-sm shadow-sm hover:shadow-md"
                        onClick={() => onOpenCreateModal('post')}
                    >
                        Start a post
                    </button>
                </div>
                
                <div className="flex items-center justify-between -mx-2 pt-1">
                    <button 
                        onClick={() => setComingSoonFeature('Media')} 
                        className="flex items-center justify-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors group flex-1"
                    >
                        <PhotoIcon className="w-6 h-6 text-sky-500" />
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Media</span>
                    </button>
                    
                    <button 
                        onClick={() => onOpenCreateModal('event')} 
                        className="flex items-center justify-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors group flex-1"
                    >
                        <EventIcon className="w-6 h-6 text-amber-600" />
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Event</span>
                    </button>

                    <button 
                        onClick={() => setComingSoonFeature('Article')} 
                        className="flex items-center justify-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors group flex-1"
                    >
                        <FileTextIcon className="w-6 h-6 text-rose-500" />
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Article</span>
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
