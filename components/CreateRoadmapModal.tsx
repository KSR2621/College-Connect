
import React, { useState } from 'react';
import { MapIcon, CloseIcon, PlusIcon, TrashIcon } from './Icons';
import { RoadmapStep } from '../types';

interface CreateRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (postDetails: {
    content: string; // Used as description
    isRoadmap: boolean;
    roadmapDetails: {
        title: string;
        description: string;
        avgSalary: string;
        difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
        color: string;
        steps: RoadmapStep[];
    }
  }) => void;
}

const CreateRoadmapModal: React.FC<CreateRoadmapModalProps> = ({ isOpen, onClose, onAddPost }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [avgSalary, setAvgSalary] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [color, setColor] = useState('from-blue-500 to-cyan-400');
  const [steps, setSteps] = useState<RoadmapStep[]>([{ title: '', description: '', duration: '', resources: [] }]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    setSteps([...steps, { title: '', description: '', duration: '', resources: [] }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof RoadmapStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && steps.every(s => s.title.trim())) {
      onAddPost({
        content: description,
        isRoadmap: true,
        roadmapDetails: {
          title,
          description,
          avgSalary,
          difficulty,
          color,
          steps
        }
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setAvgSalary('');
      setDifficulty('Intermediate');
      setColor('from-blue-500 to-cyan-400');
      setSteps([{ title: '', description: '', duration: '', resources: [] }]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MapIcon className="w-6 h-6 text-primary"/> Create Career Roadmap
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Roadmap Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Full Stack Developer" required className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview of this career path..." required rows={3} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none resize-none text-foreground"/>
                  </div>
              </div>
              <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Avg Salary Range</label>
                    <input type="text" value={avgSalary} onChange={e => setAvgSalary(e.target.value)} placeholder="e.g., $80k - $120k" className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Theme Color</label>
                    <select value={color} onChange={e => setColor(e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground">
                        <option value="from-blue-500 to-cyan-400">Blue & Cyan</option>
                        <option value="from-purple-500 to-pink-500">Purple & Pink</option>
                        <option value="from-emerald-400 to-teal-500">Emerald & Teal</option>
                        <option value="from-orange-400 to-red-500">Orange & Red</option>
                    </select>
                  </div>
              </div>
          </div>

          <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Learning Steps</h3>
                  <button type="button" onClick={handleAddStep} className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                      <PlusIcon className="w-3 h-3"/> Add Step
                  </button>
              </div>
              
              <div className="space-y-4">
                  {steps.map((step, index) => (
                      <div key={index} className="bg-muted/30 p-4 rounded-xl border border-border relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => handleRemoveStep(index)} className="text-muted-foreground hover:text-destructive p-1"><TrashIcon className="w-4 h-4"/></button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                              <div className="sm:col-span-2">
                                  <input 
                                    type="text" 
                                    value={step.title} 
                                    onChange={e => handleStepChange(index, 'title', e.target.value)} 
                                    placeholder={`Step ${index + 1} Title`} 
                                    className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-sm font-bold text-foreground pb-1"
                                  />
                              </div>
                              <div>
                                  <input 
                                    type="text" 
                                    value={step.duration} 
                                    onChange={e => handleStepChange(index, 'duration', e.target.value)} 
                                    placeholder="Duration (e.g. 2 weeks)" 
                                    className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-xs text-muted-foreground pb-1"
                                  />
                              </div>
                          </div>
                          <textarea 
                            value={step.description} 
                            onChange={e => handleStepChange(index, 'description', e.target.value)} 
                            placeholder="Description of this step..." 
                            rows={2} 
                            className="w-full bg-transparent text-xs text-muted-foreground focus:text-foreground outline-none resize-none mt-1"
                          />
                      </div>
                  ))}
              </div>
          </div>
        </form>

        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={!title.trim() || steps.length === 0}>
              Create Roadmap
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoadmapModal;
