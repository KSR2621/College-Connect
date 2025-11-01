import React from 'react';
import type { Story, User, Group } from '../types';
import Avatar from './Avatar';
import { PlusCircleIcon, UsersIcon } from './Icons';

interface StoriesReelProps {
  stories: Story[];
  users: { [key: string]: User };
  groups: Group[];
  currentUser: User;
  onAddStoryClick: () => void;
  onViewStoryEntity: (entityId: string) => void;
}

type StoryEntity = {
    id: string; // "user-userId" or "group-groupId"
    type: 'user' | 'group';
    name: string;
    avatarUrl?: string;
    hasUnviewed: boolean;
    latestTimestamp: number;
}

const AddStoryButton: React.FC<{ user: User; onClick: () => void; }> = ({ user, onClick }) => (
    <div className="text-center w-20 flex-shrink-0" onClick={onClick}>
        <div className="relative inline-block cursor-pointer">
            <Avatar src={user.avatarUrl} name={user.name} size="lg" />
            <div className="absolute bottom-0 right-0 inline-block">
               <div className="relative w-7 h-7">
                  <PlusCircleIcon className="w-7 h-7 text-primary bg-card rounded-full"/>
               </div>
            </div>
        </div>
         <p className="text-xs mt-1 text-foreground font-medium">Add Story</p>
    </div>
);

const StoryEntityAvatar: React.FC<{ entity: StoryEntity; onClick: () => void }> = ({ entity, onClick }) => {
    const ringClass = entity.hasUnviewed 
        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500' 
        : 'bg-border';

    return (
        <div className="text-center w-20 flex-shrink-0" onClick={onClick}>
            <div className={`p-0.5 rounded-full ${ringClass} cursor-pointer inline-block`}>
                <div className="bg-card p-0.5 rounded-full">
                    {entity.type === 'user' ? (
                         <Avatar src={entity.avatarUrl} name={entity.name} size="lg" />
                    ) : (
                        <div className="h-12 w-12 text-lg rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            <UsersIcon className="w-7 h-7" />
                        </div>
                    )}
                </div>
            </div>
            <p className="text-xs mt-1 text-text-muted truncate">{entity.name}</p>
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

            if (!entities[entityId]) {
                if (isGroupStory) {
                    const group = groups.find(g => g.id === story.groupId);
                    if (!group || !(currentUser.followingGroups || []).includes(group.id)) return; // Only show stories for followed groups
                    entities[entityId] = {
                        id: entityId,
                        type: 'group',
                        name: group.name,
                        hasUnviewed: !isViewed,
                        latestTimestamp: story.timestamp,
                    }
                } else {
                     const user = users[story.authorId];
                     if (!user) return;
                     entities[entityId] = {
                        id: entityId,
                        type: 'user',
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        hasUnviewed: !isViewed,
                        latestTimestamp: story.timestamp,
                     }
                }
            } else {
                if (!isViewed) {
                    entities[entityId].hasUnviewed = true;
                }
                if (story.timestamp > entities[entityId].latestTimestamp) {
                     entities[entityId].latestTimestamp = story.timestamp;
                }
            }
        });

        return Object.values(entities).sort((a, b) => {
            const isACurrentUserStory = a.id === `user-${currentUser.id}`;
            const isBCurrentUserStory = b.id === `user-${currentUser.id}`;
            
            // Prioritize current user's story first
            if (isACurrentUserStory && !isBCurrentUserStory) return -1;
            if (!isACurrentUserStory && isBCurrentUserStory) return 1;
    
            // Then, prioritize stories with unviewed content
            if (a.hasUnviewed && !b.hasUnviewed) return -1;
            if (!a.hasUnviewed && b.hasUnviewed) return 1;
    
            // Finally, sort by the most recent story's timestamp
            return b.latestTimestamp - a.latestTimestamp;
        });

    }, [stories, users, groups, currentUser.id, currentUser.followingGroups]);
    
    return (
        <div className="w-full">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
                <AddStoryButton user={currentUser} onClick={onAddStoryClick} />
                {storyEntities.map(entity => (
                    <StoryEntityAvatar 
                        key={entity.id}
                        entity={entity}
                        onClick={() => onViewStoryEntity(entity.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default StoriesReel;