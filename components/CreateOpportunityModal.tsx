import React, { useState } from 'react';

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOpportunity: (oppDetails: { title: string; organization: string; description: string; applyLink?: string; }) => void;
}

const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({ isOpen, onClose, onCreateOpportunity }) => {
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && organization.trim() && description.trim()) {
      onCreateOpportunity({ title, organization, description, applyLink });
      setTitle('');
      setOrganization('');
      setDescription('');
      setApplyLink('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Create Opportunity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Job Title" required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company / Organization" required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required rows={5} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          <input type="url" value={applyLink} onChange={e => setApplyLink(e.target.value)} placeholder="Application Link (optional)" className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={!title.trim() || !organization.trim() || !description.trim()}>
              Post Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunityModal;
