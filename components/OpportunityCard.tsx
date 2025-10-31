import React from 'react';
import type { Opportunity, User } from '../types';
import Avatar from './Avatar';

interface OpportunityCardProps {
    opportunity: Opportunity;
    author: User | undefined;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, author }) => {

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    return (
        <div className="bg-surface-dark rounded-lg shadow-lg p-5 flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-lg text-brand-secondary">{opportunity.title}</h3>
                <p className="text-md font-semibold text-text-primary-dark mb-2">{opportunity.organization}</p>
                <p className="text-sm text-text-secondary-dark mb-4 whitespace-pre-wrap">{opportunity.description}</p>
            </div>
            <div className="border-t border-gray-700 pt-3 mt-auto">
                <div className="flex justify-between items-center">
                    {author ? (
                         <div className="flex items-center space-x-2 text-xs text-text-secondary-dark">
                            <Avatar src={author.avatarUrl} alt={author.name} size="sm" />
                            <span>Posted by {author.name}</span>
                            <span>&bull;</span>
                            <span>{timeAgo(opportunity.timestamp)}</span>
                        </div>
                    ) : <div />}
                   
                    {opportunity.applyLink && (
                        <a 
                            href={opportunity.applyLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-brand-secondary text-white font-semibold py-1.5 px-4 rounded-md hover:bg-blue-500 transition-colors text-sm"
                        >
                            Apply
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpportunityCard;