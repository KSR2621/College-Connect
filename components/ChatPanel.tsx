import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Conversation, User, Message } from '../types';
import Avatar from './Avatar';
import NewConversationModal from './NewConversationModal';
import { 
    SendIcon, SearchIcon, ArrowLeftIcon, TrashIcon, NewChatIcon, InfoIcon, MessageIcon,
    PhoneIcon, VideoCallIcon, CameraIcon, MicIcon, ImageIcon, EmojiIcon, PlusCircleIcon
} from './Icons';

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
    <div className="h-full hidden md:flex flex-col items-center justify-center text-center text-text-muted bg-white p-4">
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
        <div className="h-full flex flex-col bg-white">
            <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0 h-20">
                <h2 className="text-xl font-bold text-card-foreground">Messages</h2>
                <button onClick={onNewConversationClick} className="p-2 text-foreground hover:text-primary rounded-full">
                    <NewChatIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-2 border-b border-border flex-shrink-0">
                 <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(({ convo, otherUser }) => {
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    const isUnread = lastMessage && lastMessage.senderId !== currentUser.id; // Basic unread logic

                    return (
                        <div
                            key={convo.id}
                            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${activeConversationId === convo.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            onClick={() => setActiveConversationId(convo.id)}
                        >
                             <div className="relative flex-shrink-0">
                                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="lg" />
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                                <p className={`font-semibold text-card-foreground ${isUnread ? 'font-bold' : ''}`}>{otherUser.name}</p>
                                <p className={`text-sm truncate ${isUnread ? 'text-card-foreground' : 'text-text-muted'}`}>
                                    {lastMessage?.text || 'No messages yet'}
                                </p>
                            </div>
                             {isUnread && (
                                <span className="block h-2.5 w-2.5 rounded-full bg-blue-500 ml-2 flex-shrink-0"/>
                            )}
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
        return <div className="h-full flex items-center justify-center text-text-muted bg-white"><p>Loading chat...</p></div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(conversation.id, message.trim());
            setMessage('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center p-3 border-b border-border shadow-sm bg-white h-20">
                <button onClick={() => setActiveConversationId(null)} className="md:hidden mr-2 p-1 text-text-muted">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                <div className="ml-3">
                    <h3 className="font-bold text-card-foreground">{otherUser.name}</h3>
                    <p className="text-xs text-text-muted">{otherUser.email}</p>
                </div>
                <div className="flex-grow" />
                <div className="flex items-center space-x-2">
                    <button className="p-2 text-text-muted hover:text-primary rounded-full">
                        <PhoneIcon className="w-6 h-6" />
                    </button>
                     <button className="p-2 text-text-muted hover:text-primary rounded-full">
                        <VideoCallIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversation.messages.map((msg, index) => {
                    const isCurrentUser = msg.senderId === currentUser.id;
                    const sender = users[msg.senderId];
                    const isLastInSequence = (index === conversation.messages.length - 1) || (conversation.messages[index + 1].senderId !== msg.senderId);

                    return (
                        <div key={msg.id} className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                             {!isCurrentUser && (
                                <div className="w-8 flex-shrink-0 self-end">
                                    {isLastInSequence && sender && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" />}
                                </div>
                             )}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isCurrentUser ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-white">
                <div className="bg-gray-100 rounded-full flex items-center p-2">
                    <button className="p-2 text-indigo-500 rounded-full">
                        <CameraIcon className="w-6 h-6" />
                    </button>
                    <form onSubmit={handleSubmit} className="flex-1">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Message..."
                            className="w-full bg-transparent px-3 py-1 focus:outline-none text-foreground placeholder-text-muted"
                        />
                    </form>
                    {message.trim() ? (
                        <button 
                            onClick={handleSubmit}
                            className="p-2 text-indigo-500 font-semibold"
                        >
                            Send
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2 px-2">
                            <button className="text-text-muted hover:text-primary"><MicIcon className="w-6 h-6"/></button>
                            <button className="text-text-muted hover:text-primary"><ImageIcon className="w-6 h-6"/></button>
                            <button className="text-text-muted hover:text-primary"><EmojiIcon className="w-6 h-6"/></button>
                        </div>
                    )}
                </div>
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
        <div className="bg-white rounded-lg h-full w-full flex md:grid md:grid-cols-12 overflow-hidden border border-border shadow-lg">
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
    );
};

export default ChatPanel;