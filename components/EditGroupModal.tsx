
import React, { useState, useEffect } from 'react';
import type { Group, GroupCategory, GroupPrivacy } from '../types';
import { GlobeIcon, LockIcon, BriefcaseIcon, CloseIcon } from './Icons';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdateGroup: (groupId: string, data: { name: string; description: string; category: GroupCategory; privacy: GroupPrivacy }) => void;
}

const categories: GroupCategory[] = ['Academic', 'Cultural', 'Sports', 'Tech', 'Social', 'Other'];

const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, group, onUpdateGroup }) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [category, setCategory] = useState<GroupCategory>(group.category || 'Social');
  const [privacy, setPrivacy] = useState<GroupPrivacy>(group.privacy || 'public');

  useEffect(() => {
    if (isOpen) {
        setName(group.name);
        setDescription(group.description);
        setCategory(group.category || 'Social');
        setPrivacy(group.privacy || 'public');
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onUpdateGroup(group.id, { name, description, category, privacy });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl p-0 w-full max-w-md overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Edit Group Details</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="editGroupName" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Group Name</label>
            <input
              id="editGroupName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Robotics Club"
              required
              className="w-full px-4 py-3 text-foreground bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="editGroupDescription" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</label>
            <textarea
              id="editGroupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              required
              rows={3}
              className="w-full px-4 py-3 text-foreground bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                <div className="relative">
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as GroupCategory)} 
                        className="w-full appearance-none px-4 py-3 bg-input border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <BriefcaseIcon className="w-4 h-4"/>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Privacy</label>
                <div className="flex bg-input rounded-xl p-1 border border-border">
                    <button 
                        type="button"
                        onClick={() => setPrivacy('public')} 
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all ${privacy === 'public' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <GlobeIcon className="w-3 h-3 mr-1"/> Public
                    </button>
                    <button 
                        type="button"
                        onClick={() => setPrivacy('private')} 
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all ${privacy === 'private' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <LockIcon className="w-3 h-3 mr-1"/> Private
                    </button>
                </div>
              </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]" disabled={!name.trim() || !description.trim()}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;
