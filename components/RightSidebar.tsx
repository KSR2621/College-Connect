
import React from 'react';
import type { User, Group, Post, Notice } from '../types';
import { UsersIcon, TrendingUpIcon, MegaphoneIcon, CalendarIcon, ArrowRightIcon } from './Icons';
import Avatar from './Avatar';

interface RightSidebarProps {
  groups: Group[];
  events: Post[];
  currentUser: User;
  onNavigate: (path: string) => void;
  users: User[];
  notices?: Notice[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ groups, events, currentUser, onNavigate, users, notices = [] }) => {

  const suggestedGroups = groups
    .filter(g => !g.memberIds.includes(currentUser.id) && !(currentUser.followingGroups || []).includes(g.id))
    .slice(0, 3);

  const upcomingEvents = events
    .filter(e => e.eventDetails && new Date(e.eventDetails.date) > new Date())
    .sort((a, b) => new Date(a.eventDetails!.date).getTime() - new Date(b.eventDetails!.date).getTime())
    .slice(0, 3);

  const suggestedUsers = users
    .filter(u => u.department === currentUser.department && u.id !== currentUser.id)
    .sort(() => 0.5 - Math.random()) // Shuffle suggestions
    .slice(0, 3);
    
  const latestNotices = notices
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 2);

  return (
    <div className="sticky top-24 space-y-6">
      
      {/* People You May Know */}
       {suggestedUsers.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">People You May Know</h3>
            <div className="space-y-4">
                {suggestedUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => onNavigate(`#/profile/${user.id}`)}>
                        <Avatar src={user.avatarUrl} name={user.name} size="md" className="group-hover:ring-2 ring-primary/20 transition-all"/>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onNavigate(`#/profile/${user.id}`); }} className="text-xs font-bold bg-muted hover:bg-muted/80 text-foreground py-1.5 px-3 rounded-lg transition-colors">
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )}

      {/* Trending / Highlights */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <TrendingUpIcon className="w-4 h-4"/> Campus Highlights
          </h3>
          
          <div className="space-y-4">
              {/* Mock Hashtags */}
              <div className="flex flex-wrap gap-2">
                  {['#TechFest2025', '#Hackathon', '#CulturalNight', '#SportsMeet'].map(tag => (
                      <span key={tag} className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md cursor-pointer transition-colors">{tag}</span>
                  ))}
              </div>

              {/* Admin Announcements */}
              {latestNotices.length > 0 && (
                  <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Announcements</p>
                      {latestNotices.map(notice => (
                          <div key={notice.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onNavigate('#/academics')}>
                              <MegaphoneIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <div>
                                  <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight">{notice.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(notice.timestamp).toLocaleDateString()}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
         <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center justify-between uppercase tracking-wider text-muted-foreground">
                Upcoming Events
            </h3>
            <div className="space-y-4">
                {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-start space-x-3 cursor-pointer group" onClick={() => onNavigate(`#/events/${event.id}`)}>
                        <div className="flex-shrink-0 h-12 w-12 bg-muted text-muted-foreground rounded-xl flex flex-col items-center justify-center shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border">
                            <span className="text-[9px] font-bold uppercase tracking-tighter">{new Date(event.eventDetails!.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-lg font-black leading-none">{new Date(event.eventDetails!.date).getDate()}</span>
                        </div>
                        <div className="flex-1 overflow-hidden pt-0.5">
                            <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{event.eventDetails?.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <CalendarIcon className="w-3 h-3"/>
                                <span className="truncate">{event.eventDetails?.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={() => onNavigate('#/events')} className="w-full py-2 text-xs font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
                    View All Events <ArrowRightIcon className="w-3 h-3"/>
                </button>
            </div>
         </div>
      )}

      {/* Suggested Groups */}
      {suggestedGroups.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">Clubs to Follow</h3>
            <div className="space-y-4">
                {suggestedGroups.map(group => (
                    <div 
                        key={group.id} 
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={() => onNavigate(`#/groups/${group.id}`)}
                    >
                    <div className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm`}>
                        <UsersIcon className="w-5 h-5 opacity-90"/>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.memberIds.length} members</p>
                    </div>
                    <button className="text-xs bg-transparent border border-muted-foreground/30 hover:border-primary hover:text-primary text-muted-foreground px-2 py-1 rounded transition-all">
                        Join
                    </button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
