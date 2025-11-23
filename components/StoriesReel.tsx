
import React from 'react';
import type { Story, User, Group } from '../types';
import { PlusIcon, UsersIcon } from './Icons';
import Avatar from './Avatar';

interface StoriesReelProps {
  stories: Story[];
  users: { [key: string]: User };
  groups: Group[];
  currentUser: User;
  onAddStoryClick: () => void;
  onViewStoryEntity: (entityId: string) => void;
}

type StoryEntity = {
    id: string;
    type: 'user' | 'group';
    name: string;
    avatarUrl?: string;
    hasUnviewed: boolean;
    latestTimestamp: number;
}

// "Add Story" component
const AddStoryCircle: React.FC<{ user: User; onClick: () => void; }> = ({ user, onClick }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer group w-20 flex-shrink-0" onClick={onClick}>
        <div className="relative w-16 h-16 transition-transform duration-300 ease-out group-hover:scale-105">
            <div className="absolute inset-0 rounded-full p-[2px] bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900">
                 <Avatar src={user.avatarUrl} name={user.name} size="lg" className="w-full h-full rounded-full object-cover"/>
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white dark:border-slate-900 shadow-sm">
                <PlusIcon className="w-3 h-3" />
            </div>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors truncate w-full text-center">Your Story</span>
    </div>
);

// Story Circle
const StoryCircle: React.FC<{ entity: StoryEntity; onClick: () => void }> = ({ entity, onClick }) => {
    // Gradient ring for unviewed stories
    const ringClass = entity.hasUnviewed 
        ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 p-[2.5px]' 
        : 'bg-slate-200 dark:bg-slate-700 p-[1.5px]';

    return (
        <div className="flex flex-col items-center gap-2 cursor-pointer group w-20 flex-shrink-0" onClick={onClick}>
            <div className={`rounded-full ${ringClass} transition-all duration-300 ease-out group-hover:scale-105 shadow-sm group-hover:shadow-md`}>
                <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                    {entity.type === 'user' ? (
                         <Avatar src={entity.avatarUrl} name={entity.name} size="lg" className="w-14 h-14 rounded-full object-cover"/>
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    )}
                </div>
            </div>
             <span className={`text-xs truncate w-full text-center transition-colors ${entity.hasUnviewed ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                 {entity.name.split(' ')[0]}
             </span>
        </div>
    );
};

const StoriesReel: React.FC<StoriesReelProps> = ({ stories, users, groups, currentUser, onAddStoryClick, onViewStoryEntity }) => {
    
    const storyEntities = React.useMemo(() => {
        const entities: { [key: string]: StoryEntity } = {};

        stories.forEach(story => {
            const isGroupStory = !!story.groupId;
            const entityId = isGroupStory ? `group-${story.groupId}` : `user-${story.authorId}`;
            const isViewed = story.viewedBy.includes(currentUser.id);

             if (isGroupStory) {
                const group = groups.find(g => g.id === story.groupId);
                if (!group || !(currentUser.followingGroups || []).includes(group.id)) return;
            } else {
                 const user = users[story.authorId];
                 if (!user) return;
            }

            if (!entities[entityId]) {
                if (isGroupStory) {
                    const group = groups.find(g => g.id === story.groupId)!;
                    entities[entityId] = {
                        id: entityId, type: 'group', name: group.name,
                        hasUnviewed: !isViewed, latestTimestamp: story.timestamp,
                    }
                } else {
                     const user = users[story.authorId]!;
                     entities[entityId] = {
                        id: entityId, type: 'user', name: user.name, avatarUrl: user.avatarUrl,
                        hasUnviewed: !isViewed, latestTimestamp: story.timestamp,
                     }
                }
            } else {
                if (!isViewed) entities[entityId].hasUnviewed = true;
                if (story.timestamp > entities[entityId].latestTimestamp) {
                     entities[entityId].latestTimestamp = story.timestamp;
                }
            }
        });

        const currentUserStoryId = `user-${currentUser.id}`;
        const currentUserStory = entities[currentUserStoryId];
        delete entities[currentUserStoryId];

        const otherEntities = Object.values(entities).sort((a, b) => {
            if (a.hasUnviewed && !b.hasUnviewed) return -1;
            if (!a.hasUnviewed && b.hasUnviewed) return 1;
            return b.latestTimestamp - a.latestTimestamp;
        });

        return currentUserStory ? [currentUserStory, ...otherEntities] : otherEntities;

    }, [stories, users, groups, currentUser.id, currentUser.followingGroups]);

    const canCreateStory = !(currentUser.tag === 'Teacher' && currentUser.isApproved === false);
    
    return (
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 relative z-10">
                <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2 px-1">
                    {canCreateStory && <AddStoryCircle user={currentUser} onClick={onAddStoryClick} />}
                    {storyEntities.map(entity => (
                        <StoryCircle 
                            key={entity.id}
                            entity={entity}
                            onClick={() => onViewStoryEntity(entity.id)}
                        />
                    ))}
                    {storyEntities.length === 0 && !canCreateStory && (
                        <p className="text-xs text-muted-foreground pl-2">No stories yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoriesReel;
