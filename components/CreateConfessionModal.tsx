import React, { useState, useRef } from 'react';
import type { ConfessionMood } from '../types';

interface CreateConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (postDetails: { 
    content: string; 
    isConfession: boolean;
    confessionMood: ConfessionMood;
  }) => void;
}

const confessionMoods: { id: ConfessionMood, label: string, emoji: string }[] = [
    { id: 'love', label: 'Love', emoji: '💘' },
    { id: 'funny', label: 'Funny', emoji: '🤣' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'chaos', label: 'Chaos', emoji: '🤯' },
    { id: 'deep', label: 'Deep', emoji: '🧠' },
];

const StyleButton: React.FC<{ onClick: () => void; children: React.ReactNode; isActive?: boolean }> = ({ onClick, children, isActive }) => (
  <button 
    type="button" 
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`font-semibold text-sm px-3 py-1 rounded-full border border-border transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
  >
    {children}
  </button>
);


const CreateConfessionModal: React.FC<CreateConfessionModalProps> = ({ isOpen, onClose, onAddPost }) => {
  const [mood, setMood] = useState<ConfessionMood>('deep');
  const [content, setContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;
  
  const applyStyle = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const handleInput = () => {
    setContent(editorRef.current?.innerHTML || '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentContent = editorRef.current?.innerHTML || '';
    const trimmedContent = editorRef.current?.innerText.trim() || '';

    if (!trimmedContent) {
        alert("Please write a confession before posting.");
        return;
    }

    onAddPost({ 
        content: currentContent,
        isConfession: true,
        confessionMood: mood,
    });
    onClose();
  };

  const isContentEmpty = !content.trim() || content === '<br>';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-foreground text-center">What's on your mind?</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border border-border rounded-lg">
                <div className="p-2 border-b border-border flex flex-wrap gap-2">
                   <StyleButton onClick={() => applyStyle('bold')}><b>B</b></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontName', 'sans-serif')}><span className="font-sans">Sans</span></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontName', 'serif')}><span className="font-serif">Serif</span></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontName', 'monospace')}><span className="font-mono">Mono</span></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontSize', '3')}><span className="text-sm">S</span></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontSize', '5')}><span className="text-base">M</span></StyleButton>
                   <StyleButton onClick={() => applyStyle('fontSize', '7')}><span className="text-lg">L</span></StyleButton>
                </div>
                <div
                    ref={editorRef}
                    contentEditable={true}
                    onInput={handleInput}
                    data-placeholder="Share your confession anonymously..."
                    className="w-full min-h-[150px] max-h-[300px] overflow-y-auto no-scrollbar px-4 py-2 text-foreground bg-input focus:outline-none focus:ring-0 resize-none text-xl empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted empty:before:cursor-text"
                />
            </div>
          
          <div className="pt-2">
            <label className="text-sm font-medium text-text-muted mb-2 block">Select a mood:</label>
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
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
              Cancel
            </button>
            <button type="submit" disabled={isContentEmpty} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              Post Anonymously 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConfessionModal;