import React from 'react';
import type { Group, User } from '../types';
import { UsersIcon } from './Icons';

interface GroupCardProps {
  group: Group;
  onNavigate: (path: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onNavigate }) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border" onClick={() => onNavigate(`#/groups/${group.id}`)}>
      <h3 className="text-lg font-bold text-card-foreground mb-2">{group.name}</h3>
      <p className="text-sm text-text-muted mb-4 line-clamp-2">{group.description}</p>
      <div className="flex items-center text-sm text-text-muted">
        <UsersIcon className="w-4 h-4 mr-2" />
        <span>{group.memberIds.length} members</span>
      </div>
    </div>
  );
};

export default GroupCard;