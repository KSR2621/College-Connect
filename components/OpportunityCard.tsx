import React from 'react';
import type { Opportunity, User } from '../types';
import { BriefcaseIcon } from './Icons';

interface OpportunityCardProps {
  opportunity: Opportunity;
  author?: User;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, author }) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
            <BriefcaseIcon className="h-6 w-6"/>
        </div>
        <div className="flex-1">
            <h3 className="text-lg font-bold text-card-foreground">{opportunity.title}</h3>
            <p className="text-md font-medium text-text-muted">{opportunity.organization}</p>
            <p className="text-sm text-card-foreground mt-2 line-clamp-3">{opportunity.description}</p>
            <div className="mt-4 flex justify-between items-center">
                {opportunity.applyLink && (
                    <a href={opportunity.applyLink} target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/90">
                        Apply Now
                    </a>
                )}
                 <p className="text-xs text-text-muted">Posted on {new Date(opportunity.timestamp).toLocaleDateString()}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;