import React, { useState } from 'react';
import type { ConfessionMood } from '../types';

interface CreateConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (postDetails: { 
    content: string; 
    isConfession: boolean;
    confessionMood: ConfessionMood;
    confessionFontFamily: string;
    confessionFontSize: string;
  }) => void;
}

const confessionMoods: { id: ConfessionMood, label: string, emoji: string }[] = [
    { id: 'love', label: 'Love', emoji: '💘' },
    { id: 'funny', label: 'Funny', emoji: '🤣' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'chaos', label: 'Chaos', emoji: '🤯' },
    { id: 'deep', label: 'Deep', emoji: '🧠' },
];

const fontFamilies = [
    { name: 'Sans', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' },
];

const fontSizes = [
    { name: 'S', class: 'text-lg sm:text-xl' },
    { name: 'M', class: 'text-xl sm:text-2xl' },
    { name: 'L', class: 'text-2xl sm:text-3xl' },
];

const CreateConfessionModal: React.FC<CreateConfessionModalProps> = ({ isOpen, onClose, onAddPost }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<ConfessionMood>('deep');
  const [fontFamilyIndex, setFontFamilyIndex] = useState(0);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  
  const activeFont = fontFamilies[fontFamilyIndex];
  const activeSize = fontSizes[fontSizeIndex];
  const textPreviewClasses = `${activeFont.class} ${activeSize.class}`;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAddPost({ 
        content: content.trim(),
        isConfession: true,
        confessionMood: mood,
        confessionFontFamily: activeFont.class,
        confessionFontSize: activeSize.class,
      });
      setContent('');
      setMood('deep');
      setFontFamilyIndex(0);
      setFontSizeIndex(1);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-foreground text-center">What's on your mind?</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your confession anonymously..."
            required
            rows={6}
            className={`w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${textPreviewClasses}`}
          />

          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center space-x-2">
                <button type="button" onClick={() => setFontFamilyIndex((p) => (p + 1) % fontFamilies.length)} className="font-semibold text-sm px-3 py-1 rounded-full hover:bg-muted border border-border">
                    <span className={activeFont.class}>{activeFont.name}</span>
                </button>
                 <button type="button" onClick={() => setFontSizeIndex((p) => (p + 1) % fontSizes.length)} className="font-semibold text-sm px-3 py-1 rounded-full hover:bg-muted border border-border flex items-center">
                    <span className="text-xs">A</span><span className="text-lg">A</span>
                </button>
            </div>
             <label className="text-sm font-medium text-text-muted">Select a mood:</label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {confessionMoods.map(m => (
                <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
                        mood === m.id 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-transparent border-border hover:bg-muted'
                    }`}
                >
                    {m.emoji} {m.label}
                </button>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={!content.trim()}>
              Post Anonymously 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConfessionModal;