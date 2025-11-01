import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, User, Message } from '../types';
import Avatar from './Avatar';
import NewConversationModal from './NewConversationModal';
import { SendIcon, SearchIcon, ArrowLeftIcon, TrashIcon } from './Icons';

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

const ConversationList: React.FC<Pick<ChatPanelProps, 'conversations' | 'currentUser' | 'users' | 'setActiveConversationId' | 'activeConversationId'> & { onNewConversationClick: () => void }> = 
({ conversations, currentUser, users, setActiveConversationId, activeConversationId, onNewConversationClick }) => {
    return (
        <div className="h-full flex flex-col bg-card">
            <div className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground">Messages</h2>
                <button onClick={onNewConversationClick} className="bg-primary text-primary-foreground font-semibold py-1 px-3 rounded-full text-sm hover:bg-primary/90">
                    New
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.sort((a, b) => (b.messages[b.messages.length - 1]?.timestamp || 0) - (a.messages[a.messages.length - 1]?.timestamp || 0))
                .map(convo => {
                    const otherParticipantId = convo.participantIds.find(id => id !== currentUser.id);
                    if (!otherParticipantId) return null;
                    
                    const otherUser = users[otherParticipantId];
                    if (!otherUser) return null;

                    const lastMessage = convo.messages[convo.messages.length - 1];
                    const lastMessageTime = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                    const isUnread = lastMessage && lastMessage.senderId !== currentUser.id;


                    return (
                        <div
                            key={convo.id}
                            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${activeConversationId === convo.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                            onClick={() => setActiveConversationId(convo.id)}
                        >
                            <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
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

    if (!conversation) {
        return <div className="h-full hidden md:flex items-center justify-center text-text-muted bg-card"><p>Select a conversation to start chatting.</p></div>;
    }

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
        <div className="h-full flex flex-col bg-card">
            <div className="flex items-center p-3 border-b border-border shadow-sm">
                <button onClick={() => setActiveConversationId(null)} className="md:hidden mr-2 p-1 text-text-muted">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                <h3 className="ml-3 font-bold text-card-foreground">{otherUser.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversation.messages.map((msg, index) => {
                    const isCurrentUser = msg.senderId === currentUser.id;
                    const sender = users[msg.senderId];
                    const isFirstInSequence = (index === 0) || (conversation.messages[index - 1].senderId !== msg.senderId);
                    const isLastInSequence = (index === conversation.messages.length - 1) || (conversation.messages[index + 1].senderId !== msg.senderId);

                    return (
                        <div key={msg.id} className={`flex items-end gap-3 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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

                            <div className={`max-w-xs md:max-w-xl p-3 rounded-2xl ${isCurrentUser ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-none' : 'bg-muted text-card-foreground rounded-bl-none'} ${isFirstInSequence ? '' : (isCurrentUser ? 'mr-[1.8rem]' : 'ml-8')}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSubmit} className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-input border-border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <button 
                        type="submit"
                        disabled={!message.trim()}
                        className={`ml-3 flex-shrink-0 p-3 rounded-full text-primary-foreground transition-all duration-300 ${message.trim() ? 'bg-gradient-to-br from-primary to-secondary scale-100' : 'bg-muted scale-90 cursor-not-allowed'}`}
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

    // In a mobile view, we show either the list or the chat window, not both.
    const isMobile = window.innerWidth < 768;
    
    const handleSelectUser = async (userId: string) => {
        const convoId = await onCreateOrOpenConversation(userId);
        setActiveConversationId(convoId);
        setIsNewConvoModalOpen(false);
    };

    return (
        <div className="container mx-auto bg-card md:rounded-lg h-full flex flex-col md:grid md:grid-cols-12 overflow-hidden md:border md:border-border md:shadow-lg">
            <div className={`col-span-12 md:col-span-4 md:border-r md:border-border ${isMobile && activeConversationId ? 'hidden' : 'flex'} flex-col`}>
                    <ConversationList {...props} onNewConversationClick={() => setIsNewConvoModalOpen(true)} />
                </div>
                <div className={`col-span-12 md:col-span-8 ${isMobile && !activeConversationId ? 'hidden' : 'flex'} flex-col`}>
                    <ChatWindow {...props} />
                </div>
                <NewConversationModal 
                    isOpen={isNewConvoModalOpen}
                    onClose={() => setIsNewConvoModalOpen(false)}
                    users={Object.values(users)}
                    currentUser={currentUser}
                    onSelectUser={handleSelectUser}
                />
        </div>
    );
};

export default ChatPanel;