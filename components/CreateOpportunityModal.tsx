
import React, { useState } from 'react';
import { BriefcaseIcon, MapPinIcon, PlusIcon, CloseIcon } from './Icons';

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (postDetails: { 
    content: string; 
    isOpportunity: boolean;
    opportunityDetails: { 
        title: string; 
        organization: string; 
        applyLink?: string;
        type: 'Internship' | 'Job' | 'Volunteer' | 'Campus Role';
        location: 'Remote' | 'On-site' | 'Hybrid';
        stipend?: string;
    }
  }) => void;
}

const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({ isOpen, onClose, onAddPost }) => {
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [type, setType] = useState<'Internship' | 'Job' | 'Volunteer' | 'Campus Role'>('Internship');
  const [location, setLocation] = useState<'Remote' | 'On-site' | 'Hybrid'>('On-site');
  const [stipend, setStipend] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && organization.trim() && description.trim()) {
      onAddPost({ 
        content: description,
        isOpportunity: true,
        opportunityDetails: {
          title, 
          organization, 
          applyLink: applyLink.trim() || undefined,
          type,
          location,
          stipend: stipend.trim() || undefined
        }
      });
      // Reset form
      setTitle('');
      setOrganization('');
      setDescription('');
      setApplyLink('');
      setType('Internship');
      setLocation('On-site');
      setStipend('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BriefcaseIcon className="w-6 h-6 text-primary"/> Post Opportunity
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><CloseIcon className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as any)} 
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  >
                      <option value="Internship">Internship</option>
                      <option value="Job">Job</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Campus Role">Campus Role</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Location</label>
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value as any)} 
                    className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  >
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                  </select>
              </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Frontend Intern, Club Secretary" required className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground"/>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Organization</label>
                <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company or Club Name" required className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground"/>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Stipend / Salary (Optional)</label>
                <input type="text" value={stipend} onChange={e => setStipend(e.target.value)} placeholder="e.g., ₹5k/mo, Unpaid" className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Roles, responsibilities, and requirements..." required rows={4} className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none text-foreground"/>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Application Link (Optional)</label>
            <input type="url" value={applyLink} onChange={e => setApplyLink(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground"/>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all" disabled={!title.trim() || !organization.trim() || !description.trim()}>
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunityModal;
