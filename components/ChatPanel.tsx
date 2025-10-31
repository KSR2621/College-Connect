import React, { useState, useRef, useEffect } from 'react';
import type { Conversation, User } from '../types';
import Avatar from './Avatar';
import { ArrowLeftIcon, PaperAirplaneIcon } from './Icons';

interface ChatPanelProps {
    conversations: Conversation[];
    currentUser: User;
    onSendMessage: (conversationId: string, text: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversations, currentUser, onSendMessage }) => {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageText.trim() && activeConversationId) {
            onSendMessage(activeConversationId, messageText);
            setMessageText('');
        }
    };
    
    const getOtherParticipant = (convo: Conversation) => {
        return convo.participants.find(p => p.id !== currentUser.id);
    };

    return (
        <div className="bg-surface-dark rounded-lg shadow-lg h-full flex flex-col">
            {!activeConversation ? (
                <>
                    <h3 className="font-bold text-lg p-4 border-b border-gray-700">Messages</h3>
                    <ul className="space-y-1 p-2 overflow-y-auto">
                        {conversations.map(convo => {
                             const otherParticipant = getOtherParticipant(convo);
                             if (!otherParticipant) return null;
                             const lastMessage = convo.messages[convo.messages.length - 1];
                            return (
                                <li key={convo.id} onClick={() => setActiveConversationId(convo.id)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                                    <Avatar src={otherParticipant.avatarUrl} alt={otherParticipant.name} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{otherParticipant.name}</p>
                                        <p className="text-sm text-text-secondary-dark truncate">{lastMessage?.text || 'No messages yet'}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            ) : (
                <>
                    <div className="flex items-center p-3 border-b border-gray-700">
                        <button onClick={() => setActiveConversationId(null)} className="mr-3 p-1 rounded-full hover:bg-gray-700">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <Avatar src={getOtherParticipant(activeConversation)?.avatarUrl || ''} alt={getOtherParticipant(activeConversation)?.name || ''} size="sm" />
                        <h4 className="font-bold ml-2">{getOtherParticipant(activeConversation)?.name}</h4>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {activeConversation.messages.map(msg => (
                           <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                {msg.senderId !== currentUser.id && <Avatar src={getOtherParticipant(activeConversation)?.avatarUrl || ''} alt="" size="sm" />}
                                <div className={`max-w-xs md:max-w-md lg:max-w-xs xl:max-w-sm rounded-2xl px-4 py-2 ${msg.senderId === currentUser.id ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-gray-700 text-text-primary-dark rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex items-center space-x-2">
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-gray-700 text-text-primary-dark rounded-full py-2 px-4 border border-gray-600 focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                         />
                        <button type="submit" className="bg-brand-secondary p-2 rounded-full text-white hover:bg-blue-500 disabled:bg-gray-500" disabled={!messageText.trim()}>
                            <PaperAirplaneIcon className="h-5 w-5"/>
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatPanel;
