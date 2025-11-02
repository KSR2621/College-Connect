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
    'bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600',
    'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500',
    'bg-gradient-to-br from-gray-700 via-gray-900 to-black',
];

const fontFamilies = [
    { name: 'Sans', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' },
];

const fontSizes = [
    { name: 'S', class: 'text-2xl' },
    { name: 'M', class: 'text-3xl' },
    { name: 'L', class: 'text-4xl' },
];


const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({ currentUser, adminOfGroups, onClose, onAddStory, defaultGroup }) => {
    const [textContent, setTextContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState(backgroundOptions[0]);
    const [fontFamilyIndex, setFontFamilyIndex] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [isBold, setIsBold] = useState(true);

    const [poster, setPoster] = useState<Poster>(
        defaultGroup
            ? { type: 'group', id: defaultGroup.id, name: defaultGroup.name }
            : { type: 'user', id: currentUser.id, name: 'Your Story', avatarUrl: currentUser.avatarUrl }
    );
    const [showPosterSelector, setShowPosterSelector] = useState(false);


    const activeFont = fontFamilies[fontFamilyIndex];
    const activeSize = fontSizes[fontSizeIndex];

    const handleSubmit = () => {
        if (textContent.trim()) {
            onAddStory({ 
                textContent, 
                backgroundColor,
                fontFamily: activeFont.class,
                fontWeight: isBold ? 'font-bold' : 'font-normal',
                fontSize: activeSize.class,
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
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <button onClick={onClose} className="p-2 bg-black/30 rounded-full text-white">
                    <CloseIcon className="w-6 h-6" />
                </button>
                 <div className="flex items-center space-x-2 bg-black/30 p-1.5 rounded-full">
                    {/* Font Family Cycle Button */}
                    <button 
                        onClick={() => setFontFamilyIndex((prev) => (prev + 1) % fontFamilies.length)}
                        className="text-white font-semibold text-sm px-3 py-1 rounded-full hover:bg-white/20"
                    >
                       <span className={activeFont.class}>{activeFont.name}</span>
                    </button>
                    {/* Font Size Cycle Button */}
                     <button
                        onClick={() => setFontSizeIndex((prev) => (prev + 1) % fontSizes.length)}
                        className="text-white font-semibold text-sm px-3 py-1 rounded-full hover:bg-white/20 flex items-center"
                    >
                        <span className="text-xs">A</span>
                        <span className="text-lg">A</span>
                    </button>
                    {/* Bold Toggle Button */}
                    <button
                        onClick={() => setIsBold(!isBold)}
                        className={`text-white font-bold text-sm px-3 py-1 rounded-full ${isBold ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                    >
                        B
                    </button>
                 </div>
                 <div className="flex items-center space-x-2">
                    {backgroundOptions.map(bg => (
                        <button 
                            key={bg} 
                            onClick={() => setBackgroundColor(bg)}
                            className={`w-8 h-8 rounded-full ${bg} border-2 transition-all duration-200 ${backgroundColor === bg ? 'border-white scale-110' : 'border-transparent'}`}
                            aria-label={`Select background ${bg}`}
                        />
                    ))}
                 </div>
            </div>

            {/* Content */}
            <div className={`flex-1 flex items-center justify-center p-8 transition-colors duration-300 ${backgroundColor}`}>
                <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Start typing..."
                    maxLength={250}
                    className={`w-full bg-transparent text-white text-center focus:outline-none resize-none placeholder:text-white/70 ${activeSize.class} ${activeFont.class} ${isBold ? 'font-bold' : 'font-normal'}`}
                />
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <div className="relative">
                    {!defaultGroup && posterOptions.length > 1 && (
                        <button 
                            onClick={() => setShowPosterSelector(!showPosterSelector)}
                            className="flex items-center space-x-2 bg-black/40 text-white font-semibold py-2 px-4 rounded-full text-sm"
                        >
                            <span>Posting as: <strong>{poster.name}</strong></span>
                        </button>
                    )}
                    {showPosterSelector && !defaultGroup && (
                        <div className="absolute bottom-full mb-2 bg-card rounded-lg shadow-lg w-60 overflow-hidden">
                            {posterOptions.map(option => (
                                <div key={option.id} onClick={() => { setPoster(option); setShowPosterSelector(false); }} className="flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer">
                                    {option.type === 'user' ? (
                                        <Avatar src={option.avatarUrl} name={option.name} size="md" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-md bg-primary/20 text-primary flex items-center justify-center">
                                            <UsersIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    <span className="font-semibold text-foreground">{option.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleSubmit}
                    disabled={!textContent.trim()}
                    className="flex items-center space-x-2 bg-white text-black font-bold py-3 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 hover:shadow-lg"
                >
                    <SendIcon className="w-5 h-5"/>
                    <span>Share Story</span>
                </button>
            </div>
        </div>
    );
};

export default StoryCreatorModal;