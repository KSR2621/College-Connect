
import React, { useState, useMemo, useRef } from 'react';
import type { User, Conversation } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import NewConversationModal from '../components/NewConversationModal';
import { auth } from '../firebase';
import { PlusIcon, TrashIcon, CloseIcon, UsersIcon } from '../components/Icons';

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
        return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (messageDate >= startOfYesterday) {
        return 'Yesterday';
    } else {
        return messageDate.toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' });
    }
};

const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { currentUser, users, conversations, onSendMessage, onDeleteMessagesForEveryone, onDeleteMessagesForSelf, onDeleteConversations, onCreateOrOpenConversation, onNavigate, currentPath } = props;

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLongPress = useRef(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleSelectUser = async (userId: string) => {
        const convoId = await onCreateOrOpenConversation(userId);
        setSelectedConversationId(convoId);
        setIsNewConvoModalOpen(false);
    };

    const isSelectionMode = selectedConversations.length > 0;

    const handleConversationTap = (conversationId: string) => {
        if (wasLongPress.current) {
            wasLongPress.current = false;
            return;
        }
        if (isSelectionMode) {
            setSelectedConversations(prev =>
                prev.includes(conversationId)
                    ? prev.filter(id => id !== conversationId)
                    : [...prev, conversationId]
            );
        } else {
            setSelectedConversationId(conversationId);
        }
    };

    const handleLongPressStart = (conversationId: string) => {
        wasLongPress.current = false;
        longPressTimerRef.current = setTimeout(() => {
            wasLongPress.current = true;
            setSelectedConversations(prev => prev.includes(conversationId) ? prev : [...prev, conversationId]);
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Delete ${selectedConversations.length} conversation(s)? This action is permanent.`)) {
            onDeleteConversations(selectedConversations);
            if (selectedConversationId && selectedConversations.includes(selectedConversationId)) {
                setSelectedConversationId(null);
            }
            setSelectedConversations([]);
        }
    };

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            const lastMessageA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastMessageB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return lastMessageB - lastMessageA;
        });
    }, [conversations]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);

    const allUsersList = useMemo(() => Object.values(users), [users]);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pb-16 lg:pb-0">
                <div className="flex h-full border-t md:border-x border-border bg-card">
                    {/* Sidebar */}
                    <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border flex-col bg-slate-100 ${(selectedConversationId && !isSelectionMode) ? 'hidden md:flex' : 'flex'}`}>
                        {isSelectionMode ? (
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                                <button onClick={() => setSelectedConversations([])} className="p-2 rounded-full hover:bg-muted text-foreground">
                                    <CloseIcon className="w-6 h-6" />
                                </button>
                                <h1 className="text-xl font-bold text-foreground">{selectedConversations.length} Selected</h1>
                                <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-muted text-destructive">
                                    <TrashIcon className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                                <h1 className="text-2xl font-extrabold gradient-text">Messages</h1>
                                <button onClick={() => setIsNewConvoModalOpen(true)} className="p-2 rounded-full hover:bg-muted text-primary">
                                    <PlusIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {sortedConversations.map(convo => {
                                const isGroup = convo.isGroupChat;
                                const otherParticipantId = !isGroup ? convo.participantIds.find(id => id !== currentUser.id) : null;
                                const otherUser = otherParticipantId ? users[otherParticipantId] : null;
                                const lastMessage = convo.messages.filter(m => !m.deletedFor?.includes(currentUser.id)).pop();
                                const isSelectedForDeletion = selectedConversations.includes(convo.id);
                                const isActiveChat = selectedConversationId === convo.id && !isSelectionMode;

                                const chatName = isGroup ? convo.name : otherUser?.name;

                                if (!chatName) return null;

                                return (
                                    <div
                                        key={convo.id}
                                        onClick={() => handleConversationTap(convo.id)}
                                        onMouseDown={() => handleLongPressStart(convo.id)}
                                        onMouseUp={handleLongPressEnd}
                                        onMouseLeave={handleLongPressEnd}
                                        onTouchStart={() => handleLongPressStart(convo.id)}
                                        onTouchEnd={handleLongPressEnd}
                                        className={`p-3 flex items-start space-x-3 cursor-pointer border-l-4 transition-all duration-200 ${
                                            isSelectedForDeletion ? 'bg-primary/20 border-primary' : 
                                            isActiveChat ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-primary shadow-inner' : 'border-transparent hover:bg-white'
                                        }`}
                                    >
                                        {isGroup ? (
                                             <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                                                <UsersIcon className="w-8 h-8"/>
                                            </div>
                                        ) : (
                                            <Avatar src={otherUser?.avatarUrl} name={otherUser?.name || ''} size="lg" />
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-card-foreground truncate">{chatName}</p>
                                                {lastMessage && (
                                                    <p className="text-xs text-text-muted flex-shrink-0 ml-2">
                                                        {formatTimestampForChatList(lastMessage.timestamp)}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-muted truncate">
                                                {lastMessage ? `${lastMessage.senderId === currentUser.id ? 'You: ' : ''}${lastMessage.text}` : `Created ${isGroup ? 'group' : 'chat'}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div className={`w-full md:flex-1 flex-col ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
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
                            <div className="flex-1 flex items-center justify-center text-center text-text-muted p-4 bg-slate-50 chat-background-panel">
                                <div>
                                    <h2 className="text-xl font-semibold">Select a conversation</h2>
                                    <p>Choose from your existing conversations or start a new one.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>

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
