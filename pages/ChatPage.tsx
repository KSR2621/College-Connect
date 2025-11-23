
import React, { useState, useMemo, useRef } from 'react';
import type { User, Conversation } from '../types';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import NewConversationModal from '../components/NewConversationModal';
import { auth } from '../firebase';
import { 
    MessageIcon, UsersIcon, SearchIcon, PlusIcon, TrashIcon, EditIcon, CloseIcon, ChevronRightIcon
} from '../components/Icons';

interface ChatPageProps {
  currentUser: User;
  users: { [key: string]: User };
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteMessagesForEveryone: (conversationId: string, messageIds: string[]) => void;
  onDeleteMessagesForSelf: (conversationId: string, messageIds: string[]) => void;
  onDeleteConversations: (conversationIds: string[]) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onNavigate: (path: string) => void;
  currentPath: string;
}

const formatTimestampForChatList = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (messageDate >= startOfToday) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (messageDate >= startOfYesterday) {
        return 'Yesterday';
    } else {
        return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { currentUser, users, conversations, onSendMessage, onDeleteMessagesForEveryone, onDeleteMessagesForSelf, onDeleteConversations, onCreateOrOpenConversation, onNavigate, currentPath } = props;

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'All' | 'Groups'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    // Long press refs
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleSelectUser = async (userId: string) => {
        const convoId = await onCreateOrOpenConversation(userId);
        setSelectedConversationId(convoId);
        setIsNewConvoModalOpen(false);
    };

    const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
            onDeleteConversations([id]);
            if (selectedConversationId === id) setSelectedConversationId(null);
        }
    };

    // Long Press Handlers
    const handleLongPressStart = (id: string) => {
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
            if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
                onDeleteConversations([id]);
                if (selectedConversationId === id) setSelectedConversationId(null);
            }
        }, 600);
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
    };

    const handleConvoClick = (id: string) => {
        if (isLongPressRef.current) return;
        setSelectedConversationId(id);
    };

    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        if (activeFilter === 'Groups') {
            filtered = filtered.filter(c => c.isGroupChat);
        } 
        
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(c => {
                if (c.isGroupChat) {
                    return c.name?.toLowerCase().includes(lowerQuery);
                } else {
                    const otherId = c.participantIds.find(id => id !== currentUser.id);
                    const user = otherId ? users[otherId] : null;
                    return user && (user.name.toLowerCase().includes(lowerQuery) || user.department.toLowerCase().includes(lowerQuery));
                }
            });
        }

        return filtered.sort((a, b) => {
            const lastMessageA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastMessageB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return lastMessageB - lastMessageA;
        });
    }, [conversations, activeFilter, searchQuery, users, currentUser]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);

    const allUsersList = useMemo(() => Object.values(users), [users]);

    return (
        <div className="bg-background h-screen flex flex-col overflow-hidden">
            <div className="hidden md:block flex-none">
                <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            </div>

            <main className="flex-1 flex relative overflow-hidden">
                {/* Sidebar (Chat List) */}
                {/* Mobile: Absolute positioning for slide effect. Desktop: Relative flex item. */}
                <div 
                    className={`
                        absolute inset-0 z-20 w-full h-full bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out
                        md:relative md:w-80 lg:w-96 md:translate-x-0 md:z-auto
                        ${selectedConversationId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
                    `}
                >
                    
                    {/* Sidebar Header - Static */}
                    <div className="px-4 py-4 flex items-center justify-between shrink-0 bg-card border-b border-border flex-none h-16">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Messages</h1>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsEditMode(!isEditMode)} 
                                className={`p-2 rounded-full transition-all duration-200 ${
                                    isEditMode 
                                    ? 'bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90' 
                                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                }`} 
                                title={isEditMode ? "Done Editing" : "Edit List"}
                            >
                                {isEditMode ? <CloseIcon className="w-5 h-5"/> : <EditIcon className="w-5 h-5"/>}
                            </button>
                            <button 
                                onClick={() => setIsNewConvoModalOpen(true)} 
                                className="p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors" 
                                title="New Chat"
                            >
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter - Static */}
                    <div className="p-4 space-y-4 flex-none">
                        <div className="relative group">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search conversations..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-muted/50 hover:bg-muted border border-transparent focus:bg-background focus:border-primary rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all shadow-sm placeholder:text-muted-foreground"
                            />
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {['All', 'Groups'].map(filter => (
                                <button 
                                    key={filter}
                                    onClick={() => setActiveFilter(filter as any)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        activeFilter === filter 
                                        ? 'bg-foreground text-background border-foreground shadow-sm' 
                                        : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat List - Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                        {filteredConversations.length > 0 ? (
                            <div className="space-y-2">
                                {filteredConversations.map(convo => {
                                    const isGroup = convo.isGroupChat;
                                    const otherParticipantId = !isGroup ? convo.participantIds.find(id => id !== currentUser.id) : null;
                                    const otherUser = otherParticipantId ? users[otherParticipantId] : null;
                                    const lastMessage = convo.messages.filter(m => !m.deletedFor?.includes(currentUser.id)).pop();
                                    const isActive = selectedConversationId === convo.id;
                                    const name = isGroup ? convo.name : otherUser?.name;

                                    if (!name) return null;

                                    return (
                                        <div 
                                            key={convo.id} 
                                            onClick={() => handleConvoClick(convo.id)}
                                            onMouseDown={() => handleLongPressStart(convo.id)}
                                            onMouseUp={handleLongPressEnd}
                                            onMouseLeave={handleLongPressEnd}
                                            onTouchStart={() => handleLongPressStart(convo.id)}
                                            onTouchEnd={handleLongPressEnd}
                                            onTouchMove={handleLongPressEnd}
                                            className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border select-none ${
                                                isActive 
                                                ? 'bg-primary/10 border-primary/20 shadow-inner' 
                                                : 'bg-card border-transparent hover:bg-muted hover:border-border/50'
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                {isGroup ? (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                                                        <UsersIcon className="w-6 h-6"/>
                                                    </div>
                                                ) : (
                                                    <Avatar src={otherUser?.avatarUrl} name={name} size="lg" className="w-12 h-12 shadow-sm ring-2 ring-background" />
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                                        {name}
                                                    </h4>
                                                    {lastMessage && (
                                                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2 font-medium opacity-70">
                                                            {formatTimestampForChatList(lastMessage.timestamp)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className={`text-xs truncate pr-4 flex-1 ${isActive ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                                                        {lastMessage ? (
                                                            <>
                                                                {lastMessage.senderId === currentUser.id && <span className="font-bold mr-1">You:</span>}
                                                                {lastMessage.text}
                                                            </>
                                                        ) : <span className="italic opacity-50">Start chatting</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delete Action */}
                                            {(isEditMode) && (
                                                <button
                                                    onClick={(e) => handleDeleteConversation(e, convo.id)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-destructive text-destructive-foreground rounded-full shadow-md animate-scale-in hover:bg-destructive/90 transition-colors"
                                                    title="Delete conversation"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                            {!isEditMode && (
                                                <button
                                                    onClick={(e) => handleDeleteConversation(e, convo.id)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 hidden md:block"
                                                    title="Delete conversation"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <MessageIcon className="w-10 h-10 text-muted-foreground"/>
                                </div>
                                <h3 className="text-lg font-bold text-foreground">No chats yet</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Start a new conversation to connect with others.</p>
                                <button onClick={() => setIsNewConvoModalOpen(true)} className="mt-6 text-primary font-bold text-sm hover:underline flex items-center gap-1">
                                    Start Chatting <ChevronRightIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                {/* Mobile: Absolute positioning for slide effect. Desktop: Relative flex-1. */}
                <div 
                    className={`
                        absolute inset-0 z-30 w-full h-full bg-background flex flex-col transition-transform duration-300 ease-out
                        md:relative md:flex-1 md:translate-x-0 md:z-auto md:bg-muted/10
                        ${selectedConversationId ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    {selectedConversation ? (
                        <ChatPanel
                            conversation={selectedConversation}
                            currentUser={currentUser}
                            users={users}
                            onSendMessage={onSendMessage}
                            onDeleteMessagesForEveryone={onDeleteMessagesForEveryone}
                            onDeleteMessagesForSelf={onDeleteMessagesForSelf}
                            onClose={() => setSelectedConversationId(null)}
                            onNavigate={onNavigate}
                        />
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
                            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-[2rem] flex items-center justify-center mb-6 rotate-12 shadow-inner">
                                <MessageIcon className="w-12 h-12 text-muted-foreground/40" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Select a conversation</h2>
                            <p className="text-sm mt-2 opacity-70">Choose a chat from the list or start a new one.</p>
                        </div>
                    )}
                </div>
            </main>

            <NewConversationModal
                isOpen={isNewConvoModalOpen}
                onClose={() => setIsNewConvoModalOpen(false)}
                users={allUsersList}
                currentUser={currentUser}
                onSelectUser={handleSelectUser}
            />
        </div>
    );
};

export default ChatPage;
