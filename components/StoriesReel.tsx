import React from 'react';
import type { Story, User, Group } from '../types';
import { PlusCircleIcon, UsersIcon } from './Icons';
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
    id: string; // "user-userId" or "group-groupId"
    type: 'user' | 'group';
    name: string;
    avatarUrl?: string;
    hasUnviewed: boolean;
    latestTimestamp: number;
}

// "Add Story" component - a permanent first item in the reel
const AddStoryCircle: React.FC<{ user: User; onClick: () => void; }> = ({ user, onClick }) => (
    <div className="text-center flex-shrink-0 w-16 cursor-pointer group" onClick={onClick}>
        <div className="relative w-14 h-14 mx-auto add-story-ring">
            <Avatar src={user.avatarUrl} name={user.name} size="lg" className="w-full h-full"/>
            <div className="absolute bottom-0 right-0 transform transition-transform group-hover:scale-110">
                <PlusCircleIcon className="w-5 h-5 text-primary bg-white rounded-full border-2 border-white" />
            </div>
        </div>
        <p className="mt-1 text-xs text-foreground font-medium truncate">Add Story</p>
    </div>
);

// A circle representing a user or group's story
const StoryCircle: React.FC<{ entity: StoryEntity; onClick: () => void }> = ({ entity, onClick }) => {
    const ringClass = entity.hasUnviewed 
        ? 'story-ring-unviewed' 
        : 'story-ring-viewed';

    return (
        <div className="text-center flex-shrink-0 w-16 cursor-pointer group" onClick={onClick}>
            <div className={`${ringClass} transition-transform duration-200 group-hover:scale-105`}>
                <div className="bg-white p-0.5 rounded-full">
                    {entity.type === 'user' ? (
                         <Avatar src={entity.avatarUrl} name={entity.name} size="lg" className="w-14 h-14"/>
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                            <UsersIcon className="w-7 h-7" />
                        </div>
                    )}
                </div>
            </div>
             <p className="mt-1 text-xs text-foreground font-medium truncate">{entity.name}</p>
        </div>
    );
};

const StoriesReel: React.FC<StoriesReelProps> = ({ stories, users, groups, currentUser, onAddStoryClick, onViewStoryEntity }) => {
    
    // This logic groups stories by entity and checks for unviewed stories
    const storyEntities = React.useMemo(() => {
        const entities: { [key: string]: StoryEntity } = {};

        stories.forEach(story => {
            const isGroupStory = !!story.groupId;
            const entityId = isGroupStory ? `group-${story.groupId}` : `user-${story.authorId}`;
            const isViewed = story.viewedBy.includes(currentUser.id);

            // Basic check to see if we have the user/group data for this story
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

        // Separate current user's story to place it first (after "Add Story")
        const currentUserStoryId = `user-${currentUser.id}`;
        const currentUserStory = entities[currentUserStoryId];
        delete entities[currentUserStoryId]; // remove from main list

        const otherEntities = Object.values(entities).sort((a, b) => {
            if (a.hasUnviewed && !b.hasUnviewed) return -1;
            if (!a.hasUnviewed && b.hasUnviewed) return 1;
            return b.latestTimestamp - a.latestTimestamp;
        });

        return currentUserStory ? [currentUserStory, ...otherEntities] : otherEntities;

    }, [stories, users, groups, currentUser.id, currentUser.followingGroups]);
    
    return (
        <div className="p-0.5 rounded-xl animated-border mb-6">
            <div className="bg-card rounded-[10px] p-4">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                    <AddStoryCircle user={currentUser} onClick={onAddStoryClick} />
                    {storyEntities.map(entity => (
                        <StoryCircle 
                            key={entity.id}
                            entity={entity}
                            onClick={() => onViewStoryEntity(entity.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StoriesReel;