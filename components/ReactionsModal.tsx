import React, { useState, useMemo } from 'react';
import type { Post, User, ReactionType } from '../types';
import Avatar from './Avatar';
import { CloseIcon } from './Icons';

// Re-using the list from PostCard for consistency
const reactionsList: { type: ReactionType; emoji: string; label: string }[] = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
];

interface ReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions?: Post['reactions'];
  users: { [key: string]: User };
  onNavigate: (path: string) => void;
}

const ReactionsModal: React.FC<ReactionsModalProps> = ({ isOpen, onClose, reactions, users, onNavigate }) => {
  const activeReactionTypes = useMemo(() => {
    if (!reactions) return [];
    return reactionsList.filter(r => reactions[r.type] && reactions[r.type]!.length > 0);
  }, [reactions]);
  
  const [activeTab, setActiveTab] = useState<ReactionType | null>(activeReactionTypes[0]?.type || null);

  if (!isOpen || !reactions) return null;

  const handleUserClick = (userId: string) => {
    onNavigate(`#/profile/${userId}`);
    onClose();
  };

  const userIdsForActiveTab = activeTab ? reactions[activeTab] || [] : [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-sm flex flex-col h-full max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Reactions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5 text-text-muted"/></button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-border p-1 overflow-x-auto no-scrollbar">
          {activeReactionTypes.map(reaction => (
            <button 
              key={reaction.type}
              onClick={() => setActiveTab(reaction.type)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  activeTab === reaction.type ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <span className="text-lg">{reaction.emoji}</span>
              <span>{reactions[reaction.type]?.length || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
            {userIdsForActiveTab.length > 0 ? (
                userIdsForActiveTab.map(userId => {
                    const user = users[userId];
                    if (!user) return null;
                    return (
                        <div
                            key={userId}
                            className="flex items-center p-2 cursor-pointer hover:bg-muted rounded-lg"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <Avatar src={user.avatarUrl} name={user.name} size="md" />
                            <div className="ml-3">
                                <p className="font-semibold text-card-foreground">{user.name}</p>
                                <p className="text-sm text-text-muted">{user.department}</p>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-text-muted p-8">No reactions of this type.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReactionsModal;