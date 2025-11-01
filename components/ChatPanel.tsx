import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Conversation, User, Message } from '../types';
import Avatar from './Avatar';
import NewConversationModal from './NewConversationModal';
import { SendIcon, SearchIcon, ArrowLeftIcon, TrashIcon, NewChatIcon, InfoIcon, MessageIcon } from './Icons';

interface ChatPanelProps {
    conversations: Conversation[];
    currentUser: User;
    users: { [key: string]: User };
    onSendMessage: (conversationId: string, text: string) => void;
    onDeleteMessage: (conversationId: string, messageId: string) => void;
    onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
}

const ChatPlaceholder: React.FC = () => (
    <div className="h-full hidden md:flex flex-col items-center justify-center text-center text-text-muted bg-card p-4">
        <MessageIcon className="w-24 h-24 text-gray-300" />
        <h2 className="mt-4 text-2xl font-semibold">Your Messages</h2>
        <p className="mt-1">Select a conversation from the left to start chatting.</p>
    </div>
);

const ConversationList: React.FC<Pick<ChatPanelProps, 'conversations' | 'currentUser' | 'users' | 'setActiveConversationId' | 'activeConversationId'> & { onNewConversationClick: () => void }> = 
({ conversations, currentUser, users, setActiveConversationId, activeConversationId, onNewConversationClick }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return conversations
            .map(convo => {
                const otherParticipantId = convo.participantIds.find(id => id !== currentUser.id);
                if (!otherParticipantId) return null;
                const otherUser = users[otherParticipantId];
                if (!otherUser) return null;
                return { convo, otherUser };
            })
            .filter((item): item is { convo: Conversation; otherUser: User } => 
                !!item && item.otherUser.name.toLowerCase().includes(lowercasedFilter)
            )
            .sort((a, b) => 
                (b.convo.messages[b.convo.messages.length - 1]?.timestamp || 0) - 
                (a.convo.messages[a.convo.messages.length - 1]?.timestamp || 0)
            );
    }, [conversations, currentUser.id, users, searchTerm]);

    return (
        <div className="h-full flex flex-col bg-card">
            <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
                <h2 className="text-2xl font-bold text-card-foreground">Messages</h2>
                <button onClick={onNewConversationClick} className="p-2 text-foreground hover:text-primary rounded-full">
                    <NewChatIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-2 border-b border-border flex-shrink-0">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-muted border-none rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(({ convo, otherUser }) => {
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                    const isUnread = lastMessage && lastMessage.senderId !== currentUser.id;

                    return (
                        <div
                            key={convo.id}
                            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 border-l-4 ${activeConversationId === convo.id ? 'bg-muted border-primary' : 'border-transparent hover:bg-muted/50'}`}
                            onClick={() => setActiveConversationId(convo.id)}
                        >
                            <div className="relative flex-shrink-0">
                                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                                {isUnread && (
                                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-card"/>
                                )}
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                                <p className="font-semibold text-card-foreground">{otherUser.name}</p>
                                <p className={`text-sm truncate ${isUnread ? 'text-card-foreground font-semibold' : 'text-text-muted'}`}>
                                    {lastMessage?.text || 'No messages yet'}
                                </p>
                            </div>
                            <span className="text-xs text-text-muted ml-2">{lastMessageTime}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const ChatWindow: React.FC<Pick<ChatPanelProps, 'activeConversationId' | 'conversations' | 'currentUser' | 'users' | 'onSendMessage' | 'onDeleteMessage' | 'setActiveConversationId'>> =
({ activeConversationId, conversations, currentUser, users, onSendMessage, onDeleteMessage, setActiveConversationId }) => {
    const [message, setMessage] = useState('');
    const conversation = conversations.find(c => c.id === activeConversationId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [conversation?.messages]);

    if (!conversation) return null;

    const otherParticipantId = conversation.participantIds.find(id => id !== currentUser.id)!;
    const otherUser = users[otherParticipantId];
    
    if(!otherUser) {
        return <div className="h-full flex items-center justify-center text-text-muted bg-card"><p>Loading chat...</p></div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(conversation.id, message.trim());
            setMessage('');
        }
    };

    const handleDelete = (messageId: string) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            onDeleteMessage(conversation.id, messageId);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="flex items-center p-3 border-b border-border shadow-sm bg-card flex-shrink-0">
                <button onClick={() => setActiveConversationId(null)} className="md:hidden mr-2 p-1 text-text-muted">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                <h3 className="ml-3 font-bold text-card-foreground">{otherUser.name}</h3>
                <div className="flex-grow" />
                <button className="p-2 text-text-muted hover:text-primary rounded-full">
                    <InfoIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {conversation.messages.map((msg, index) => {
                    const isCurrentUser = msg.senderId === currentUser.id;
                    const sender = users[msg.senderId];
                    const isLastInSequence = (index === conversation.messages.length - 1) || (conversation.messages[index + 1].senderId !== msg.senderId);

                    return (
                        <div key={msg.id} className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                             {!isCurrentUser && (
                                <div className="w-8 flex-shrink-0">
                                    {isLastInSequence && sender && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" />}
                                </div>
                             )}
                            
                            {isCurrentUser && (
                                <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-destructive p-1 rounded-full order-1">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}

                            <div className={`max-w-xs md:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-lg' : 'bg-muted text-card-foreground rounded-bl-lg'}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-border bg-card flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-input border-none rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <button 
                        type="submit"
                        disabled={!message.trim()}
                        className={`flex-shrink-0 p-3 rounded-full text-primary-foreground transition-all duration-300 ${message.trim() ? 'bg-gradient-to-br from-primary to-secondary scale-100' : 'bg-muted scale-90 cursor-not-allowed'}`}
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
}

const ChatPanel: React.FC<ChatPanelProps> = (props) => {
    const { activeConversationId, setActiveConversationId, users, currentUser, onCreateOrOpenConversation } = props;
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const handleSelectUser = async (userId: string) => {
        const convoId = await onCreateOrOpenConversation(userId);
        setActiveConversationId(convoId);
        setIsNewConvoModalOpen(false);
    };

    return (
        <div className="h-full w-full flex items-center justify-center md:p-4">
             <div className="container bg-card md:rounded-lg h-full w-full flex md:grid md:grid-cols-12 overflow-hidden md:border md:border-border md:shadow-lg">
                <div className={`col-span-12 md:col-span-4 lg:col-span-4 md:border-r md:border-border ${isMobile && activeConversationId ? 'hidden' : 'flex'} flex-col`}>
                    <ConversationList {...props} onNewConversationClick={() => setIsNewConvoModalOpen(true)} />
                </div>
                <div className={`col-span-12 md:col-span-8 lg:col-span-8 ${isMobile && !activeConversationId ? 'hidden' : 'flex'} flex-col`}>
                    {activeConversationId ? (
                        <ChatWindow {...props} />
                    ) : (
                        <ChatPlaceholder />
                    )}
                </div>
                 <NewConversationModal 
                    isOpen={isNewConvoModalOpen}
                    onClose={() => setIsNewConvoModalOpen(false)}
                    users={Object.values(users)}
                    currentUser={currentUser}
                    onSelectUser={handleSelectUser}
                />
             </div>
        </div>
    );
};

export default ChatPanel;