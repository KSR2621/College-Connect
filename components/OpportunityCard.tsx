
import React from 'react';
import type { Post, User } from '../types';
import { BriefcaseIcon, MapPinIcon, ClockIcon, BuildingIcon, ArrowRightIcon, TrashIcon, TrendingUpIcon } from './Icons';

interface OpportunityCardProps {
  opportunity: Post;
  author?: User;
  currentUser: User;
  onDeleteOpportunity: (opportunityId: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, author, currentUser, onDeleteOpportunity }) => {
  const details = opportunity.opportunityDetails;

  if (!opportunity.isOpportunity || !details) return null;

  const isAuthor = author && currentUser && author.id === currentUser.id;
  const isDirector = currentUser.tag === 'Director';
  const canDelete = isAuthor || isDirector;

  const typeColors: Record<string, string> = {
      'Internship': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'Job': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
      'Volunteer': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
      'Campus Role': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  };

  const badgeClass = typeColors[details.type || 'Internship'] || typeColors['Internship'];

  return (
    <div className="group relative bg-card hover:bg-gradient-to-br hover:from-card hover:to-muted/30 border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
        {canDelete && (
            <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete?')) onDeleteOpportunity(opportunity.id) }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
                <TrashIcon className="w-4 h-4"/>
            </button>
        )}

        <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-border/50 bg-background`}>
                <BuildingIcon className="w-6 h-6 text-muted-foreground/70"/>
            </div>
            
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1" title={details.title}>{details.title}</h3>
                <p className="text-sm font-medium text-muted-foreground truncate">{details.organization}</p>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badgeClass}`}>
                {details.type}
            </span>
            {details.location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    <MapPinIcon className="w-3 h-3"/> {details.location}
                </span>
            )}
        </div>
        
        <div className="space-y-2 mb-6 flex-1">
             {details.stipend && (
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs">💰</span>
                    {details.stipend}
                </div>
            )}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <ClockIcon className="w-3 h-3"/> 
                </span>
                Posted {new Date(opportunity.timestamp).toLocaleDateString()}
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
             <div className="text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1"><TrendingUpIcon className="w-3 h-3"/> Actively hiring</span>
             </div>
            
            {details.applyLink ? (
                <a 
                    href={details.applyLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg transform active:scale-95"
                >
                    Apply Now <ArrowRightIcon className="w-3 h-3"/>
                </a>
            ) : (
                <button disabled className="bg-muted text-muted-foreground px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed opacity-70">
                    Apply
                </button>
            )}
        </div>
    </div>
  );
};

export default OpportunityCard;
