import React from 'react';
import type { Achievement } from '../types';
import { AwardIcon } from './Icons';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm flex items-start space-x-4 border border-border">
      <div className="flex-shrink-0 h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
        {/* Placeholder for dynamic icons, using a default for now */}
        <AwardIcon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="font-bold text-card-foreground">{achievement.title}</h4>
        <p className="text-sm text-text-muted">{achievement.description}</p>
      </div>
    </div>
  );
};

export default AchievementCard;