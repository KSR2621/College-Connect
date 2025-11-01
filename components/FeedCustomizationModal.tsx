import React, { useState, useEffect } from 'react';
import type { FeedPreferences } from '../types';
import ToggleSwitch from './ToggleSwitch';
import { CloseIcon } from './Icons';

interface FeedCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: FeedPreferences) => void;
  currentPreferences: FeedPreferences;
}

const FeedCustomizationModal: React.FC<FeedCustomizationModalProps> = ({ isOpen, onClose, onSave, currentPreferences }) => {
  const [prefs, setPrefs] = useState<FeedPreferences>(currentPreferences);

  useEffect(() => {
    setPrefs(currentPreferences);
  }, [currentPreferences]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof FeedPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(prefs);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Customize Your Feed</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5 text-text-muted"/></button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-muted">Choose what you want to see on your home feed.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="showRegularPosts" className="font-medium text-card-foreground">Regular Posts</label>
              <ToggleSwitch id="showRegularPosts" checked={prefs.showRegularPosts} onChange={() => handleToggle('showRegularPosts')} />
            </div>
             <div className="flex items-center justify-between">
              <label htmlFor="showEvents" className="font-medium text-card-foreground">Events</label>
              <ToggleSwitch id="showEvents" checked={prefs.showEvents} onChange={() => handleToggle('showEvents')} />
            </div>
             <div className="flex items-center justify-between">
              <label htmlFor="showOpportunities" className="font-medium text-card-foreground">Opportunities</label>
              <ToggleSwitch id="showOpportunities" checked={prefs.showOpportunities} onChange={() => handleToggle('showOpportunities')} />
            </div>
             <div className="flex items-center justify-between">
              <label htmlFor="showSharedPosts" className="font-medium text-card-foreground">Shared Posts</label>
              <ToggleSwitch id="showSharedPosts" checked={prefs.showSharedPosts} onChange={() => handleToggle('showSharedPosts')} />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted/50 border-t border-border flex justify-end">
          <button 
            onClick={handleSave} 
            className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedCustomizationModal;
