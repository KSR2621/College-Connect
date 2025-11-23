
import React from 'react';
import type { Post, User } from '../types';
import Avatar from './Avatar';
import { CodeIcon, LinkIcon, TrashIcon, GlobeIcon, BriefcaseIcon } from './Icons';

interface ProjectCardProps {
  project: Post;
  author?: User;
  currentUser: User;
  onDeleteProject: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, author, currentUser, onDeleteProject }) => {
  if (!project.isProject || !project.projectDetails) return null;

  const { title, description, techStack, githubUrl, demoUrl, lookingFor } = project.projectDetails;
  const isAuthor = author && currentUser && author.id === currentUser.id;
  const isDirector = currentUser.tag === 'Director';
  const canDelete = isAuthor || isDirector;

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="relative h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <CodeIcon className="w-12 h-12 text-white/20 transform group-hover:scale-110 transition-transform duration-500"/>
          
          {/* Author Tag */}
          {author && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pr-3 p-1 border border-white/10">
                  <Avatar src={author.avatarUrl} name={author.name} size="xs" className="w-5 h-5 ring-1 ring-white/50"/>
                  <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{author.name}</span>
              </div>
          )}

          {canDelete && (
            <button 
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this project?')) onDeleteProject(project.id) }}
                className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-red-500/80 p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            >
                <TrashIcon className="w-4 h-4"/>
            </button>
          )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">{description}</p>

          <div className="space-y-3">
              {techStack && techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                      {techStack.slice(0, 3).map((tech, i) => (
                          <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                              {tech}
                          </span>
                      ))}
                      {techStack.length > 3 && <span className="text-[10px] text-muted-foreground px-1 self-center">+{techStack.length - 3}</span>}
                  </div>
              )}

              {lookingFor && lookingFor.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/50">
                      <BriefcaseIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0"/>
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 truncate">
                          Looking for: {lookingFor.join(', ')}
                      </span>
                  </div>
              )}
          </div>
      </div>

      <div className="px-5 py-4 border-t border-border bg-muted/10 flex gap-2">
          {demoUrl && (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                  <GlobeIcon className="w-3.5 h-3.5"/> Live Demo
              </a>
          )}
          {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-colors shadow-sm">
                  <CodeIcon className="w-3.5 h-3.5"/> Code
              </a>
          )}
      </div>
    </div>
  );
};

export default ProjectCard;
