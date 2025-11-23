
import React, { useState } from 'react';
import { CodeIcon, CloseIcon } from './Icons';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (postDetails: {
    content: string;
    isProject: boolean;
    projectDetails: {
      title: string;
      description: string;
      techStack: string[];
      githubUrl?: string;
      demoUrl?: string;
      lookingFor?: string[];
    }
  }) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onAddPost }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      const techStackArray = techStack.split(',').map(t => t.trim()).filter(t => t);
      const lookingForArray = lookingFor.split(',').map(l => l.trim()).filter(l => l);

      onAddPost({
        content: description,
        isProject: true,
        projectDetails: {
          title,
          description,
          techStack: techStackArray,
          githubUrl,
          demoUrl,
          lookingFor: lookingForArray,
        }
      });
      
      setTitle('');
      setDescription('');
      setTechStack('');
      setGithubUrl('');
      setDemoUrl('');
      setLookingFor('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CodeIcon className="w-6 h-6 text-primary"/> Post a Project
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Project Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Campus Note Taker AI" required className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is your project about?" required rows={3} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none resize-none text-foreground"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Tech Stack (comma sep)</label>
                <input type="text" value={techStack} onChange={e => setTechStack(e.target.value)} placeholder="React, Node.js, Firebase" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Looking For (comma sep)</label>
                <input type="text" value={lookingFor} onChange={e => setLookingFor(e.target.value)} placeholder="Designer, Developer" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">GitHub Link</label>
                <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Live Demo Link</label>
                <input type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://my-app.com" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={!title || !description} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              Launch Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;