
import React, { useState } from 'react';
import type { Opportunity, User } from '../types';
import { BriefcaseIcon, OptionsIcon } from './Icons';

interface OpportunityCardProps {
  opportunity: Opportunity;
  author?: User;
  currentUser: User;
  onDeleteOpportunity: (opportunityId: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, author, currentUser, onDeleteOpportunity }) => {
  const [showOptions, setShowOptions] = useState(false);
  const isAuthor = author && currentUser && author.id === currentUser.id;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
        onDeleteOpportunity(opportunity.id);
    }
    setShowOptions(false);
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
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
        
        {isAuthor && (
            <div className="relative ml-2">
                <button onClick={() => setShowOptions(!showOptions)} className="text-text-muted hover:text-foreground p-1 rounded-full hover:bg-muted">
                    <OptionsIcon className="w-5 h-5" />
                </button>
                {showOptions && (
                    <div className="absolute right-0 mt-2 w-32 bg-card rounded-md shadow-lg py-1 border border-border z-10">
                        <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">
                            Delete
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;
