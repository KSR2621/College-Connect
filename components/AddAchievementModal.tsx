import React, { useState } from 'react';
import type { Achievement } from '../types';

interface AddAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAchievement: (achievement: Achievement) => void;
}

const AddAchievementModal: React.FC<AddAchievementModalProps> = ({ isOpen, onClose, onAddAchievement }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onAddAchievement({ title, description });
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Add Achievement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g., Dean's List)" required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g., Achieved a 4.0 GPA in Fall 2024)" required rows={4} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={!title.trim() || !description.trim()}>
              Add Achievement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAchievementModal;
