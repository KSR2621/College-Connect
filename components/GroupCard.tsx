import React from 'react';
import type { Group } from '../types';
import { UsersIcon, StarIcon, ArrowRightIcon } from './Icons';

interface GroupCardProps {
  group: Group;
  onNavigate: (path: string) => void;
}

// Generate a consistent, nice-looking gradient for each group based on its name
const generateGradient = (name: string) => {
    const gradients = [
        'from-blue-500 to-cyan-400',
        'from-purple-500 to-indigo-500',
        'from-green-400 to-teal-500',
        'from-pink-500 to-rose-500',
        'from-orange-400 to-red-500'
    ];
    // Simple hash function to pick a gradient
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % gradients.length);
    return gradients[index];
};

const GroupCard: React.FC<GroupCardProps> = ({ group, onNavigate }) => {
  const gradient = generateGradient(group.name);
  
  return (
    <div 
      className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-border flex flex-col h-full overflow-hidden group hover:-translate-y-1" 
      onClick={() => onNavigate(`#/groups/${group.id}`)}
    >
      {/* Banner */}
      <div className={`relative h-24 bg-gradient-to-r ${gradient} flex items-center justify-center`}>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-20"></div>
         <UsersIcon className="w-10 h-10 text-white/50" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-card-foreground mb-1 truncate">{group.name}</h3>
        <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-grow min-h-[40px]">{group.description}</p>
        
        <div className="flex items-center text-sm text-text-muted space-x-4 border-t border-border pt-3">
          <div className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-1.5" />
              <span className="font-medium">{group.memberIds.length}</span>
              <span className="ml-1">members</span>
          </div>
          <div className="flex items-center">
              <StarIcon className="w-4 h-4 mr-1.5" />
              <span className="font-medium">{group.followers?.length || 0}</span>
              <span className="ml-1">followers</span>
          </div>
        </div>
      </div>
      
       {/* Footer */}
      <div className="bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300 p-3 mt-auto text-center font-semibold text-sm text-primary flex items-center justify-center gap-2">
          View Group
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default GroupCard;