
import React, { useState, useMemo } from 'react';
import type { User, Post, CareerRoadmap, Mentor, Project, SkillBadge } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateRoadmapModal from '../components/CreateRoadmapModal';
import OpportunityCard from '../components/OpportunityCard';
import ProjectCard from '../components/ProjectCard';
import { 
    BriefcaseIcon, PlusIcon, MapIcon, UsersIcon, CpuIcon, 
    SearchIcon, FilterIcon, ArrowRightIcon, UserPlusIcon, 
    SparkleIcon, FileTextIcon, AwardIconSolid, CodeIcon, 
    ChartBarIcon, GlobeIcon, CheckCircleIcon, ClockIcon,
    TrashIcon
} from '../components/Icons';
import { auth } from '../firebase';
import Avatar from '../components/Avatar';

interface OpportunitiesPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onAddPost: (postDetails: any) => void;
  postCardProps: {
      onDeletePost: (postId: string) => void;
  }
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ currentUser, users, posts, onNavigate, currentPath, onAddPost, postCardProps }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'campus' | 'roadmaps' | 'mentor' | 'projects'>('jobs');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateRoadmapModalOpen, setIsCreateRoadmapModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const opportunities = posts.filter(p => p.isOpportunity).sort((a, b) => b.timestamp - a.timestamp);
  const jobListings = opportunities.filter(p => p.opportunityDetails?.type !== 'Campus Role' && p.opportunityDetails?.type !== 'Volunteer');
  const campusListings = opportunities.filter(p => p.opportunityDetails?.type === 'Campus Role' || p.opportunityDetails?.type === 'Volunteer');
  const projectListings = posts.filter(p => p.isProject).sort((a, b) => b.timestamp - a.timestamp);
  
  const roadmaps = posts.filter(p => p.isRoadmap && p.roadmapDetails).map(p => ({
      ...p.roadmapDetails,
      id: p.id,
      authorId: p.authorId
  })).sort((a, b) => (posts.find(post => post.id === b.id)?.timestamp || 0) - (posts.find(post => post.id === a.id)?.timestamp || 0));

  // Components
  const TabButton: React.FC<{ id: typeof activeTab, label: string, icon: React.ElementType }> = ({ id, label, icon: Icon }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === id ? 'bg-primary text-white shadow-md' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border'}`}
      >
          <Icon className="w-4 h-4"/> {label}
      </button>
  );

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 pt-12 pb-28 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          {/* Abstract Shapes */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-5xl mx-auto text-center text-white">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-md">Shape Your Future</h1>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-medium">Find internships, track your skills, get mentorship, and launch your career.</p>
              
              <div className="max-w-2xl mx-auto relative group">
                  <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10"/>
                  <input 
                    type="text" 
                    placeholder="Search for jobs, skills, or mentors..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 rounded-full bg-white text-gray-900 shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 text-base font-medium transition-all placeholder:text-gray-400"
                  />
                  <div className="absolute inset-0 -z-10 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
          </div>
      </div>

      <main className="flex-1 container mx-auto px-4 -mt-14 relative z-10 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Navigation/Content Area (Full Width) */}
              <div className="lg:col-span-12 space-y-8">
                  {/* Navigation Tabs - Sticky on mobile if needed, but sticking with static for layout */}
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 px-1">
                      <TabButton id="jobs" label="Jobs & Internships" icon={BriefcaseIcon} />
                      <TabButton id="campus" label="Campus & Volunteer" icon={GlobeIcon} />
                      <TabButton id="roadmaps" label="Roadmaps" icon={MapIcon} />
                      <TabButton id="mentor" label="Mentorship & AI" icon={UserPlusIcon} />
                      <TabButton id="projects" label="Projects" icon={CodeIcon} />
                  </div>

                  {/* Content Views */}
                  <div className="min-h-[400px]">
                      {activeTab === 'jobs' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="flex justify-between items-center">
                                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                      Latest Opportunities 
                                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{jobListings.length}</span>
                                  </h2>
                                  <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                      <PlusIcon className="w-4 h-4"/> Post Job
                                  </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {jobListings.length > 0 ? jobListings.map(opp => (
                                      <OpportunityCard 
                                          key={opp.id} 
                                          opportunity={opp} 
                                          author={users[opp.authorId]}
                                          currentUser={currentUser}
                                          onDeleteOpportunity={postCardProps.onDeletePost}
                                      />
                                  )) : (
                                      <div className="col-span-full text-center py-20 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                          <BriefcaseIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
                                          <h3 className="text-lg font-bold text-foreground">No listings found</h3>
                                          <p className="text-muted-foreground mt-1">Be the first to post an opportunity!</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'campus' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="flex justify-between items-center">
                                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                      Campus Roles
                                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{campusListings.length}</span>
                                  </h2>
                                  <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                      <PlusIcon className="w-4 h-4"/> Post Role
                                  </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {campusListings.map(opp => (
                                      <OpportunityCard 
                                          key={opp.id} 
                                          opportunity={opp} 
                                          author={users[opp.authorId]}
                                          currentUser={currentUser}
                                          onDeleteOpportunity={postCardProps.onDeletePost}
                                      />
                                  ))}
                                  {campusListings.length === 0 && (
                                       <div className="col-span-full text-center py-20 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                          <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
                                          <h3 className="text-lg font-bold text-foreground">No campus roles available</h3>
                                          <p className="text-muted-foreground mt-1">Check back later or start a club initiative!</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'roadmaps' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="flex justify-between items-center">
                                  <h2 className="text-2xl font-bold text-foreground">Career Roadmaps</h2>
                                  <button onClick={() => setIsCreateRoadmapModalOpen(true)} className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                      <PlusIcon className="w-4 h-4"/> Create Roadmap
                                  </button>
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {roadmaps.length > 0 ? roadmaps.map(map => (
                                      <div key={map.id} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group flex flex-col h-full">
                                          <div className={`h-3 bg-gradient-to-r ${map.color || 'from-blue-500 to-cyan-500'}`}></div>
                                          {(currentUser.id === map.authorId || currentUser.tag === 'Director') && (
                                                <button 
                                                    onClick={() => { if(window.confirm('Delete this roadmap?')) postCardProps.onDeletePost(map.id) }}
                                                    className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                          )}
                                          <div className="p-6 flex-1 flex flex-col">
                                              <div className="flex justify-between items-start mb-4">
                                                  <div>
                                                      <h3 className="text-xl font-bold text-foreground">{map.title}</h3>
                                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{map.description}</p>
                                                  </div>
                                                  <span className="text-[10px] font-bold bg-muted px-2.5 py-1 rounded-md uppercase tracking-wider flex-shrink-0 ml-2 border border-border">{map.difficulty}</span>
                                              </div>
                                              
                                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 bg-muted/30 p-3 rounded-xl border border-border/50">
                                                  <span className="flex items-center gap-1.5 font-medium"><ChartBarIcon className="w-4 h-4 text-emerald-500"/> {map.avgSalary}</span>
                                                  <div className="h-4 w-px bg-border"></div>
                                                  <span className="flex items-center gap-1.5 font-medium"><UserPlusIcon className="w-4 h-4 text-blue-500"/> By: {users[map.authorId]?.name || 'User'}</span>
                                              </div>

                                              <div className="relative pt-4 mt-auto">
                                                  <div className="absolute top-[34px] left-0 w-full h-0.5 bg-border z-0"></div>
                                                  <div className="flex justify-between relative z-10 overflow-x-auto no-scrollbar pb-2 gap-4">
                                                      {map.steps?.map((step, i) => (
                                                          <div key={i} className="flex flex-col items-center text-center min-w-[80px] group/step cursor-default">
                                                              <div className={`w-8 h-8 rounded-full ${i === 0 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-card border-2 border-muted-foreground text-muted-foreground'} mb-3 flex items-center justify-center text-xs font-bold transition-all`}>
                                                                  {i + 1}
                                                              </div>
                                                              <p className="text-xs font-bold text-foreground truncate w-full">{step.title}</p>
                                                              <p className="text-[10px] text-muted-foreground">{step.duration}</p>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  )) : (
                                      <div className="col-span-full text-center py-20 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                          <MapIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
                                          <h3 className="text-lg font-bold text-foreground">No roadmaps shared yet</h3>
                                          <p className="text-muted-foreground mt-1">Create a learning path to help your peers!</p>
                                          <button onClick={() => setIsCreateRoadmapModalOpen(true)} className="text-primary font-bold text-sm mt-4 hover:underline">Create Roadmap</button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'mentor' && (
                          <div className="flex flex-col items-center justify-center min-h-[500px] text-center bg-card rounded-3xl border border-border p-8 animate-fade-in relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent"></div>
                              
                              <div className="relative mb-8">
                                  <div className="absolute inset-0 bg-violet-500 blur-[60px] opacity-20 rounded-full"></div>
                                  <div className="relative bg-white dark:bg-slate-900 p-6 rounded-full border border-border shadow-xl inline-flex">
                                      <SparkleIcon className="w-16 h-16 text-violet-600 dark:text-violet-400 animate-pulse" />
                                  </div>
                              </div>
                              
                              <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight">AI Career Mentor</h2>
                              <p className="text-muted-foreground max-w-lg text-lg leading-relaxed mb-8">
                                  Get personalized career guidance, resume reviews, and learning paths tailored just for you by our advanced AI.
                              </p>
                              
                              <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-4 py-2 rounded-full text-sm font-bold border border-violet-200 dark:border-violet-800">
                                  <ClockIcon className="w-4 h-4"/> Coming Soon
                              </div>
                          </div>
                      )}

                      {activeTab === 'projects' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="flex justify-between items-center">
                                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                      Student Projects
                                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{projectListings.length}</span>
                                  </h2>
                                  <button onClick={() => setIsCreateProjectModalOpen(true)} className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                      <PlusIcon className="w-4 h-4"/> Add Project
                                  </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {projectListings.length > 0 ? projectListings.map(proj => (
                                      <ProjectCard 
                                          key={proj.id} 
                                          project={proj} 
                                          author={users[proj.authorId]}
                                          currentUser={currentUser}
                                          onDeleteProject={postCardProps.onDeletePost}
                                      />
                                  )) : (
                                      <div className="col-span-full text-center py-20 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                          <CodeIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
                                          <h3 className="text-lg font-bold text-foreground">No projects showcased</h3>
                                          <p className="text-muted-foreground mt-1">Share your work and find collaborators!</p>
                                          <button onClick={() => setIsCreateProjectModalOpen(true)} className="text-primary font-bold text-sm mt-4 hover:underline">Launch Project</button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </main>

      <CreateOpportunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddPost={onAddPost}
      />

      <CreateProjectModal 
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onAddPost={onAddPost}
      />

      <CreateRoadmapModal
        isOpen={isCreateRoadmapModalOpen}
        onClose={() => setIsCreateRoadmapModalOpen(false)}
        onAddPost={onAddPost}
      />

      <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default OpportunitiesPage;
