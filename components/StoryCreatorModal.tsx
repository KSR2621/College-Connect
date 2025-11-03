import React, { useState } from 'react';
import type { Story, User, Group } from '../types';
import { CloseIcon, SendIcon, UsersIcon } from './Icons';
import Avatar from './Avatar';

interface StoryCreatorModalProps {
  currentUser: User;
  adminOfGroups: Group[];
  onClose: () => void;
  onAddStory: (storyDetails: { 
    textContent: string; 
    backgroundColor: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    groupId?: string;
  }) => void;
  defaultGroup?: Group;
}

type Poster = {
    type: 'user' | 'group';
    id: string;
    name: string;
    avatarUrl?: string;
}

const backgroundOptions = [
    'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    'bg-gradient-to-br from-green-400 to-cyan-500',
    'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500',
    'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500',
    'bg-gradient-to-br from-sky-400 to-blue-600',
];

const fontFamilies = [
    { name: 'Sans', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' },
];

const textBackgroundStyles = [
  { name: 'None', classes: '' },
  { name: 'Light', classes: 'bg-white/90 text-black px-4 py-2 rounded-lg' },
  { name: 'Dark', classes: 'bg-black/60 text-white px-4 py-2 rounded-lg' },
];


const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({ currentUser, adminOfGroups, onClose, onAddStory, defaultGroup }) => {
    const [textContent, setTextContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState(backgroundOptions[0]);
    const [fontFamilyIndex, setFontFamilyIndex] = useState(0);
    const [textBackgroundIndex, setTextBackgroundIndex] = useState(0);
    const [isBold, setIsBold] = useState(true);

    const [poster, setPoster] = useState<Poster>(
        defaultGroup
            ? { type: 'group', id: defaultGroup.id, name: defaultGroup.name }
            : { type: 'user', id: currentUser.id, name: 'Your Story', avatarUrl: currentUser.avatarUrl }
    );
    const [showPosterSelector, setShowPosterSelector] = useState(false);

    const activeFont = fontFamilies[fontFamilyIndex];
    const activeTextBackground = textBackgroundStyles[textBackgroundIndex];

    const handleSubmit = () => {
        if (textContent.trim()) {
            onAddStory({ 
                textContent: textContent.trim(), 
                backgroundColor,
                fontFamily: activeFont.class,
                fontWeight: isBold ? 'font-bold' : 'font-normal',
                fontSize: 'text-3xl', // Default font size
                groupId: poster.type === 'group' ? poster.id : undefined
            });
            onClose();
        }
    };
    
    const posterOptions: Poster[] = [
        { type: 'user', id: currentUser.id, name: 'Your Story', avatarUrl: currentUser.avatarUrl },
        ...adminOfGroups.map(g => ({ type: 'group' as 'group', id: g.id, name: g.name }))
    ];

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" role="dialog" aria-modal="true">
            {/* The gradient background layer */}
            <div className={`absolute inset-0 transition-colors duration-300 ${backgroundColor}`}></div>

            {/* UI Overlay */}
            <div className="relative flex-1 flex flex-col p-4">
                {/* Header */}
                <div className="relative h-12 flex justify-between items-center z-10">
                    <button onClick={onClose} className="p-2 bg-black/30 rounded-full text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-full">
                        {/* Font family button */}
                        <button 
                            onClick={() => setFontFamilyIndex((prev) => (prev + 1) % fontFamilies.length)}
                            className="text-white font-semibold text-sm px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <span className={activeFont.class}>{activeFont.name}</span>
                        </button>
                        {/* Text background style button */}
                        <button
                            onClick={() => setTextBackgroundIndex((prev) => (prev + 1) % textBackgroundStyles.length)}
                            className="text-white font-semibold text-sm w-9 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                        >
                            AA
                        </button>
                        {/* Bold style button */}
                        <button
                            onClick={() => setIsBold(!isBold)}
                            className={`text-sm w-9 h-7 flex items-center justify-center rounded-full transition-colors ${isBold ? 'bg-white text-black font-bold' : 'text-white font-semibold hover:bg-white/20'}`}
                        >
                            B
                        </button>

                        {/* Separator */}
                        <div className="w-px h-5 bg-white/30 mx-1"></div>

                        {/* Color Palette */}
                        {backgroundOptions.map(bg => (
                            <button 
                                key={bg} 
                                onClick={() => setBackgroundColor(bg)}
                                className={`w-8 h-8 rounded-full ${bg} border-2 transition-all duration-200 ${backgroundColor === bg ? 'border-white scale-110' : 'border-white/30 hover:border-white/70'}`}
                                aria-label={`Select background ${bg}`}
                            />
                        ))}
                    </div>
                </div>


                {/* Content */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className={activeTextBackground.classes}>
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Start typing..."
                            maxLength={250}
                            className={`w-full bg-transparent text-white text-center focus:outline-none resize-none placeholder:text-white/70 text-3xl ${activeFont.class} ${isBold ? 'font-bold' : 'font-normal'}`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center z-10">
                    <button 
                        onClick={handleSubmit}
                        disabled={!textContent.trim()}
                        className="flex items-center space-x-2 bg-white/90 text-black font-bold py-2.5 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    >
                        <SendIcon className="w-5 h-5"/>
                        <span>Share Story</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryCreatorModal;
