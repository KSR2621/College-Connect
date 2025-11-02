import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Story, User, Group } from '../types';
import Avatar from './Avatar';
import StoryViewersList from './StoryViewersList';
import { CloseIcon, OptionsIcon, TrashIcon, SendIcon, UsersIcon } from './Icons';

interface StoryViewerModalProps {
  stories: Story[];
  users: { [key: string]: User };
  groups: Group[];
  currentUser: User;
  startEntityId: string;
  onClose: () => void;
  onMarkStoryAsViewed: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onReplyToStory: (authorId: string, text: string) => void;
}

const StoryProgressBar: React.FC<{ count: number; currentIndex: number; isPaused: boolean; currentEntityId: string }> = ({ count, currentIndex, isPaused, currentEntityId }) => {
    return (
        <div className="flex items-center gap-1 w-full">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    {index < currentIndex && <div className="h-full w-full bg-white" />}
                    {index === currentIndex && (
                        <div
                            key={`${currentEntityId}-${currentIndex}`} // Force re-render/restart animation
                            className={`relative h-full bg-white progress-bar-shimmer ${!isPaused ? 'animate-progress' : ''}`}
                            style={{ 
                                transformOrigin: 'left',
                                animationPlayState: isPaused ? 'paused' : 'running'
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};


const StoryViewerModal: React.FC<StoryViewerModalProps> = (props) => {
    const { stories, users, groups, currentUser, startEntityId, onClose, onMarkStoryAsViewed, onDeleteStory, onReplyToStory } = props;

    const orderedEntities = useMemo(() => {
        const storiesByEntity = stories.reduce((acc, story) => {
            const entityId = story.groupId ? `group-${story.groupId}` : `user-${story.authorId}`;
            (acc[entityId] = acc[entityId] || []).push(story);
            return acc;
        }, {} as Record<string, Story[]>);

        const entityIdsWithStories = Object.keys(storiesByEntity).filter(id => {
            if (id.startsWith('group-')) {
                const groupId = id.split('-')[1];
                return groups.some(g => g.id === groupId) && (currentUser.followingGroups || []).includes(groupId);
            }
            return !!users[id.split('-')[1]];
        });
        
        const currentUserStoryId = `user-${currentUser.id}`;

        return entityIdsWithStories.sort((a, b) => {
            // 1. The story that was clicked to open the viewer always comes first.
            if (a === startEntityId) return -1;
            if (b === startEntityId) return 1;
    
            // 2. The current user's own story is prioritized next.
            if (a === currentUserStoryId) return -1;
            if (b === currentUserStoryId) return 1;
            
            // 3. Stories with unviewed content come after that.
            const aHasUnviewed = storiesByEntity[a].some(s => !s.viewedBy.includes(currentUser.id));
            const bHasUnviewed = storiesByEntity[b].some(s => !s.viewedBy.includes(currentUser.id));
            if (aHasUnviewed && !bHasUnviewed) return -1;
            if (!aHasUnviewed && bHasUnviewed) return 1;
    
            // 4. Finally, sort all others by the timestamp of their most recent story.
            const aLatest = Math.max(...storiesByEntity[a].map(s => s.timestamp));
            const bLatest = Math.max(...storiesByEntity[b].map(s => s.timestamp));
            return bLatest - aLatest;
        });
    }, [stories, users, groups, startEntityId, currentUser.id, currentUser.followingGroups]);

    const [currentEntityIndex, setCurrentEntityIndex] = useState(() => orderedEntities.indexOf(startEntityId));
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isViewersListOpen, setIsViewersListOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    
    const activeEntityId = orderedEntities[currentEntityIndex];
    const [activeEntityType, activeId] = activeEntityId ? activeEntityId.split('-') : [null, null];

    const activeEntity = useMemo(() => {
        if (!activeId) return null;
        if (activeEntityType === 'group') {
            return groups.find(g => g.id === activeId) || null;
        }
        return users[activeId] || null;
    }, [activeEntityType, activeId, users, groups]);
    
    const activeEntityStories = useMemo(() => {
        if (!activeEntityId) return [];
        return stories.filter(s => {
            const storyEntityId = s.groupId ? `group-${s.groupId}` : `user-${s.authorId}`;
            return storyEntityId === activeEntityId;
        }).sort((a, b) => a.timestamp - b.timestamp);
    }, [stories, activeEntityId]);
    
    const activeStory = activeEntityStories[currentStoryIndex];
    const isGroupStory = activeEntityType === 'group';

    const canDelete = useMemo(() => {
        if (!activeStory) return false;
        const isAuthor = currentUser.id === activeStory.authorId;
        if (isAuthor) return true;
        
        if (isGroupStory) {
            const group = groups.find(g => g.id === activeStory.groupId);
            return !!(group && group.creatorId === currentUser.id);
        }
        return false;
    }, [activeStory, currentUser.id, isGroupStory, groups]);

    const goToNextStory = useCallback(() => {
        if (currentStoryIndex < activeEntityStories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else if (currentEntityIndex < orderedEntities.length - 1) {
            setCurrentEntityIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
        } else {
            onClose();
        }
    }, [currentStoryIndex, activeEntityStories.length, currentEntityIndex, orderedEntities.length, onClose]);

    const goToPrevStory = useCallback(() => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else if (currentEntityIndex > 0) {
            const prevEntityIndex = currentEntityIndex - 1;
            const prevEntityId = orderedEntities[prevEntityIndex];
            const prevEntityStories = stories.filter(s => {
                const storyEntityId = s.groupId ? `group-${s.groupId}` : `user-${s.authorId}`;
                return storyEntityId === prevEntityId;
            });
            setCurrentEntityIndex(prevEntityIndex);
            setCurrentStoryIndex(prevEntityStories.length - 1);
        }
    }, [currentStoryIndex, currentEntityIndex, orderedEntities, stories]);

    useEffect(() => {
        if (activeEntityStories.length > 0 && currentStoryIndex >= activeEntityStories.length) {
            setCurrentStoryIndex(activeEntityStories.length - 1);
        } else if (activeEntityStories.length === 0 && activeEntityId) {
            goToNextStory();
        }
    }, [activeEntityStories, currentStoryIndex, activeEntityId, goToNextStory]);

    useEffect(() => {
        if (activeStory && !activeStory.viewedBy.includes(currentUser.id)) {
            onMarkStoryAsViewed(activeStory.id);
        }
    }, [activeStory, currentUser.id, onMarkStoryAsViewed]);
    
    useEffect(() => {
        if (isPaused) return;
        const timer = setTimeout(goToNextStory, 5000);
        return () => clearTimeout(timer);
    }, [currentStoryIndex, currentEntityIndex, isPaused, goToNextStory]);
    
    const handleDelete = () => {
        if (!activeStory || !window.confirm("Are you sure you want to delete this story?")) return;
        onDeleteStory(activeStory.id);
        setIsOptionsMenuOpen(false);
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() && activeEntity) {
            const authorId = activeStory.authorId; // Reply to the person who posted it
            const text = isGroupStory ? `Replied to ${activeEntity.name}'s story: ${replyText.trim()}` : replyText.trim();
            onReplyToStory(authorId, text);
            setReplyText('');
        }
    };

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        const target = e.target as HTMLElement;
        // Do not pause if the user is interacting with a button, input, or form
        if (target.closest('button, input, form, a')) {
            return;
        }
        setIsPaused(true);
    };

    const handleInteractionEnd = () => {
        setIsPaused(false);
    };
    
    if (!activeEntity || !activeStory) {
        if (orderedEntities.length === 0) onClose();
        return null;
    }
    
    const textClasses = `${activeStory.fontSize || 'text-3xl'} ${activeStory.fontFamily || 'font-sans'} ${activeStory.fontWeight || 'font-bold'}`;
    const postingAdmin = isGroupStory ? users[activeStory.authorId] : null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center" role="dialog" aria-modal="true">
            <div className={`absolute inset-0 transition-colors duration-300 ${activeStory.backgroundColor}`}></div>
            <div className="absolute inset-0 bg-black/10"></div>

            <div 
                className="relative z-10 w-full h-full max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-lg overflow-hidden flex flex-col"
                onMouseDown={handleInteractionStart} onMouseUp={handleInteractionEnd} onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart} onTouchEnd={handleInteractionEnd}
            >
                {/* SAFE ZONE for click-through navigation */}
                <div className="absolute top-20 bottom-24 left-0 right-0 flex z-20">
                    <div className="w-1/3 h-full cursor-pointer" onClick={() => { if (!isPaused) goToPrevStory(); }} />
                    <div className="flex-1 h-full" />
                    <div className="w-1/3 h-full cursor-pointer" onClick={() => { if (!isPaused) goToNextStory(); }} />
                </div>

                {/* Header - z-30 to be above navigation zone */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/40 to-transparent z-30">
                     <StoryProgressBar count={activeEntityStories.length} currentIndex={currentStoryIndex} isPaused={isPaused} currentEntityId={activeEntityId}/>
                     <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                            {isGroupStory ? (
                                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                    <UsersIcon className="w-6 h-6"/>
                                </div>
                            ) : (
                                <Avatar src={(activeEntity as User).avatarUrl} name={activeEntity.name} size="md"/>
                            )}
                            <div>
                                <span className="text-white font-bold text-sm">{activeEntity.name}</span>
                                {postingAdmin && <p className="text-xs text-white/80">Posted by {postingAdmin.name}</p>}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                             {canDelete && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsOptionsMenuOpen(prev => !prev)}
                                        className="p-1 text-white"
                                    >
                                        <OptionsIcon className="w-6 h-6"/>
                                    </button>
                                    {isOptionsMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-36 bg-card rounded-md shadow-lg py-1 border border-border z-30">
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                                            >
                                                <TrashIcon className="w-4 h-4 mr-2"/>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                             )}
                            <button
                                onClick={onClose}
                                className="p-1 text-white"
                            >
                                <CloseIcon className="w-7 h-7" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 pointer-events-none">
                    <p className={`text-white text-center shadow-2xl ${textClasses}`}>{activeStory.textContent}</p>
                </div>
                
                 {/* Footer - z-30 to be above navigation zone */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black/40 to-transparent">
                    {canDelete ? (
                        <button onClick={() => { setIsViewersListOpen(true); setIsPaused(true); }} className="text-white text-sm font-semibold flex items-center bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                           Viewed by {activeStory.viewedBy.length}
                        </button>
                    ) : (
                        <form onSubmit={handleReplySubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${activeEntity.name}...`}
                                className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white text-white placeholder:text-white/70 text-sm backdrop-blur-sm"
                            />
                            <button type="submit" className="p-2.5 rounded-full text-white bg-white/20 hover:bg-white/30 disabled:opacity-50" disabled={!replyText.trim()}>
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {isViewersListOpen && (
                <StoryViewersList
                    viewedBy={activeStory.viewedBy}
                    users={users}
                    onClose={() => { setIsViewersListOpen(false); setIsPaused(false); }}
                />
            )}
        </div>
    );
};

export default StoryViewerModal;