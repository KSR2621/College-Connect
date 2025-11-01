import React from 'react';
import type { User, Group, Post } from '../types';
import { UsersIcon, CalendarIcon } from './Icons';

interface RightSidebarProps {
  groups: Group[];
  events: Post[];
  currentUser: User;
  onNavigate: (path: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ groups, events, currentUser, onNavigate }) => {

  const suggestedGroups = groups
    .filter(g => !g.memberIds.includes(currentUser.id) && !(currentUser.followingGroups || []).includes(g.id))
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => e.eventDetails && new Date(e.eventDetails.date) > new Date())
    .sort((a, b) => new Date(a.eventDetails!.date).getTime() - new Date(b.eventDetails!.date).getTime())
    .slice(0, 3);

  return (
    <div className="sticky top-20 space-y-6">
      {/* Suggested Groups */}
      {suggestedGroups.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <h3 className="font-bold text-foreground mb-3">Suggested Groups</h3>
          <div className="space-y-3">
            {suggestedGroups.map(group => (
              <div key={group.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-5 h-5"/>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-card-foreground text-sm truncate">{group.name}</p>
                    <p className="text-xs text-text-muted">{group.memberIds.length} members</p>
                </div>
                <button onClick={() => onNavigate(`#/groups/${group.id}`)} className="text-xs font-semibold bg-muted hover:bg-border text-foreground py-1 px-3 rounded-full">
                    View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
         <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <h3 className="font-bold text-foreground mb-3">Upcoming Events</h3>
            <div className="space-y-3">
                {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-start space-x-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-muted" onClick={() => onNavigate('#/events')}>
                        <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-card-foreground text-sm truncate">{event.eventDetails?.title}</p>
                            <p className="text-xs text-text-muted">{new Date(event.eventDetails!.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

    </div>
  );
};

export default RightSidebar;
