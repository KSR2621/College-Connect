import React from 'react';
import type { Achievement } from '../types';
import { AwardIcon } from './Icons';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className="bg-muted/50 p-3 rounded-lg flex items-center space-x-3 border border-border/50">
      <div className="flex-shrink-0 text-accent">
        <AwardIcon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-card-foreground">{achievement.title}</h4>
        <p className="text-sm text-text-muted">{achievement.description}</p>
      </div>
    </div>
  );
};

export default AchievementCard;
