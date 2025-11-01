import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Conversation, User, Message } from '../types';
import Avatar from './Avatar';
import NewConversationModal from './NewConversationModal';
import { 
    SendIcon, SearchIcon, ArrowLeftIcon, NewChatIcon,
    PhoneIcon, VideoCallIcon, EmojiIcon, PlusCircleIcon, InfoIcon, TrashIcon
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
    <div className="h-full hidden md:flex flex-col items-center justify-center text-center text-text-muted bg-slate-50 p-4">
        <div className="w-24 h-24 border-4 border-slate-300 rounded-full flex items-center justify-center">
            <SendIcon className="w-12 h-12 text-slate-300 transform -rotate-12" />
        </div>
        <h2 className="mt-6 text-2xl font-light text-foreground">Your Messages</h2>
        <p className="mt-1 text-sm">Select a conversation to start chatting.</p>
    </div>
);

const ConversationList: React.FC<Pick<ChatPanelProps, 'conversations' | 'currentUser' | 'users' | 'setActiveConversationId' | 'activeConversationId'> & { onNewConversationClick: () => void }> = 
({ conversations, currentUser, users, setActiveConversationId, activeConversationId, onNewConversationClick }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

        if (diffInSeconds < 60) return 'Now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

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
            <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0 h-[60px]">
                <h2 className="text-xl font-bold text-card-foreground">Messages</h2>
                <button onClick={onNewConversationClick} className="p-2 text-text-muted hover:text-primary rounded-full">
                    <NewChatIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-2 border-b border-border flex-shrink-0">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                 </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(({ convo, otherUser }) => {
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    const isUnread = lastMessage && lastMessage.senderId !== currentUser.id; // Basic unread logic

                    return (
                        <div
                            key={convo.id}
                            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 relative ${activeConversationId === convo.id ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                            onClick={() => setActiveConversationId(convo.id)}
                        >
                            {activeConversationId === convo.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                             <div className="relative flex-shrink-0">
                                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <p className={`font-semibold text-card-foreground ${isUnread ? 'font-bold' : ''}`}>{otherUser.name}</p>
                                    {lastMessage && <p className="text-xs text-text-muted flex-shrink-0 ml-2">{formatTimestamp(lastMessage.timestamp)}</p>}
                                </div>
                                <div className="flex items-center">
                                    <p className={`text-sm flex-1 truncate ${isUnread ? 'text-card-foreground font-medium' : 'text-gray-500'}`}>
                                        {lastMessage ? `${lastMessage.senderId === currentUser.id ? "You: " : ""}${lastMessage.text}` : 'No messages yet'}
                                    </p>
                                     {isUnread && (
                                        <span className="block h-2 w-2 rounded-full bg-primary ml-2 flex-shrink-0"/>
                                    )}
                                </div>
                            </div>
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    // FIX: Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout` for browser compatibility.
    const pressTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const handlePressStart = (msg: Message) => {
        pressTimerRef.current = setTimeout(() => {
            if (msg.senderId === currentUser.id) {
                setMessageToDelete(msg);
            }
        }, 500);
    };

    const handlePressEnd = () => {
        clearTimeout(pressTimerRef.current);
    };

    const confirmDelete = () => {
        if (messageToDelete) {
            onDeleteMessage(conversation!.id, messageToDelete.id);
            setMessageToDelete(null);
        }
    };
    
    // Swipe to go back logic
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const minSwipeDistance = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX || !touchStartY) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy) && dx > minSwipeDistance) {
            setActiveConversationId(null);
        }
        
        setTouchStartX(null);
        setTouchStartY(null);
    };


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation?.messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [message]);

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
        <div className="h-full flex flex-col bg-slate-50" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center p-2.5 h-[60px] border-b border-border bg-white shadow-sm">
                <button onClick={() => setActiveConversationId(null)} className="md:hidden mr-2 p-2 text-text-muted rounded-full hover:bg-slate-100">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                <div className="ml-3">
                    <h3 className="font-bold text-card-foreground">{otherUser.name}</h3>
                    <p className="text-xs text-green-500 font-semibold">Active now</p> 
                </div>
                <div className="flex-grow" />
                <div className="flex items-center space-x-1">
                    <button className="p-2 text-text-muted hover:text-primary rounded-full">
                        <PhoneIcon className="w-5 h-5" />
                    </button>
                     <button className="p-2 text-text-muted hover:text-primary rounded-full">
                        <VideoCallIcon className="w-5 h-5" />
                    </button>
                     <button className="p-2 text-text-muted hover:text-primary rounded-full">
                        <InfoIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Message List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-1">
                    {conversation.messages.map((msg, index) => {
                        const isCurrentUser = msg.senderId === currentUser.id;
                        const prevMsg = conversation.messages[index - 1];
                        const nextMsg = conversation.messages[index + 1];

                        const isFirstOfGroup = !prevMsg || prevMsg.senderId !== msg.senderId || (msg.timestamp - prevMsg.timestamp) > 60000;
                        const isLastOfGroup = !nextMsg || nextMsg.senderId !== msg.senderId || (nextMsg.timestamp - msg.timestamp) > 60000;

                        return (
                            <div key={msg.id} className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isFirstOfGroup ? 'mt-3' : ''}`}>
                                {!isCurrentUser && (
                                    <div className="w-8 flex-shrink-0 self-end">
                                        {isLastOfGroup ? <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="sm" /> : <div className="w-8"></div>}
                                    </div>
                                )}
                                <div 
                                    className={`max-w-[70%] p-3 rounded-2xl ${isCurrentUser ? `bg-primary text-primary-foreground ${isLastOfGroup ? 'rounded-br-sm' : ''}` : `bg-white text-foreground shadow-sm ${isLastOfGroup ? 'rounded-bl-sm' : ''}`}`}
                                    onTouchStart={() => handlePressStart(msg)}
                                    onTouchEnd={handlePressEnd}
                                    onMouseDown={() => handlePressStart(msg)}
                                    onMouseUp={handlePressEnd}
                                    onMouseLeave={handlePressEnd}
                                >
                                    <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar - Fixed */}
            <div className="flex-shrink-0 p-2 border-t border-border bg-white">
                <div className="flex items-end space-x-2">
                    <button className="p-2 text-text-muted hover:text-primary rounded-full flex-shrink-0">
                        <PlusCircleIcon className="w-6 h-6" />
                    </button>
                    <form onSubmit={handleSubmit} className="flex-1 flex items-center bg-slate-100 rounded-2xl">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Message..."
                            className="w-full bg-transparent py-2 px-3 focus:outline-none text-foreground placeholder-text-muted resize-none max-h-24"
                        />
                        <button type="button" className="p-2 text-text-muted hover:text-primary rounded-full flex-shrink-0 mr-1">
                            <EmojiIcon className="w-6 h-6" />
                        </button>
                    </form>
                    <button onClick={handleSubmit} className="p-2 flex-shrink-0" disabled={!message.trim()}>
                        <SendIcon className={`w-6 h-6 transition-colors ${message.trim() ? 'text-primary' : 'text-gray-400'}`}/>
                    </button>
                </div>
            </div>

             {/* Delete Confirmation Modal */}
            {messageToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMessageToDelete(null)}>
                    <div className="bg-card rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg text-foreground">Delete Message?</h3>
                        <p className="text-sm text-text-muted mt-2">This will permanently delete the message. This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setMessageToDelete(null)} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 font-bold text-primary-foreground bg-destructive rounded-lg hover:bg-destructive/90">Delete</button>
                        </div>
                    </div>
                </div>
            )}
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
        <div className="h-full w-full md:container md:mx-auto md:py-4">
            <div className="bg-white h-full w-full flex md:grid md:grid-cols-12 overflow-hidden md:rounded-lg md:border md:border-border md:shadow-lg">
                <div className={`col-span-12 md:col-span-4 lg:col-span-4 md:border-r md:border-border ${isMobile && activeConversationId ? 'hidden' : 'flex'} flex-col min-h-0`}>
                    <ConversationList {...props} onNewConversationClick={() => setIsNewConvoModalOpen(true)} />
                </div>
                <div className={`col-span-12 md:col-span-8 lg:col-span-8 ${isMobile && !activeConversationId ? 'hidden' : 'flex'} flex-col min-h-0`}>
                    {activeConversationId ? (
                        <ChatWindow {...props} />
                    ) : (
                        <ChatPlaceholder />
                    )}
                </div>
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