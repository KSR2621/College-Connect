import React, { useState, useMemo } from 'react';
import type { User, Conversation } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import NewConversationModal from '../components/NewConversationModal';
import { auth } from '../firebase';
import { PlusIcon } from '../components/Icons';

interface ChatPageProps {
  currentUser: User;
  users: { [key: string]: User };
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteMessage: (conversationId: string, messageId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onNavigate: (path: string) => void;
  currentPath: string;
}

const formatTimestampForChat = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (messageDate >= startOfToday) {
        return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (messageDate >= startOfYesterday) {
        return 'Yesterday';
    } else {
        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { currentUser, users, conversations, onSendMessage, onDeleteMessage, onCreateOrOpenConversation, onNavigate, currentPath } = props;

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleSelectUser = async (userId: string) => {
        const convoId = await onCreateOrOpenConversation(userId);
        setSelectedConversationId(convoId);
        setIsNewConvoModalOpen(false);
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
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            <main className="container mx-auto h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pb-16 md:pb-0">
                <div className="flex h-full border-t md:border-x border-border">
                    {/* Sidebar */}
                    <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h1 className="text-xl font-bold text-foreground">Messages</h1>
                            <button onClick={() => setIsNewConvoModalOpen(true)} className="p-2 rounded-full hover:bg-muted text-primary">
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {sortedConversations.map(convo => {
                                const otherParticipantId = convo.participantIds.find(id => id !== currentUser.id);
                                const otherUser = otherParticipantId ? users[otherParticipantId] : null;
                                const lastMessage = convo.messages[convo.messages.length - 1];

                                if (!otherUser) return null;

                                return (
                                    <div
                                        key={convo.id}
                                        onClick={() => setSelectedConversationId(convo.id)}
                                        className={`p-3 flex items-start space-x-3 cursor-pointer border-l-4 ${selectedConversationId === convo.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'}`}
                                    >
                                        <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="lg" />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-card-foreground truncate">{otherUser.name}</p>
                                                {lastMessage && (
                                                    <p className="text-xs text-text-muted flex-shrink-0 ml-2">
                                                        {formatTimestampForChat(lastMessage.timestamp)}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-muted truncate">
                                                {lastMessage ? `${lastMessage.senderId === currentUser.id ? 'You: ' : ''}${lastMessage.text}` : 'No messages yet'}
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
                                onDeleteMessage={onDeleteMessage}
                                onClose={() => setSelectedConversationId(null)}
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center text-text-muted p-4">
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