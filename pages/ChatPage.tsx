import React, { useState } from 'react';
import type { User, Conversation } from '../types';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';

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

const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { currentUser, users, conversations, onSendMessage, onDeleteMessage, onCreateOrOpenConversation, onNavigate, currentPath } = props;
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    return (
        <div className="bg-background h-screen flex flex-col">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="flex-1 overflow-hidden">
                <ChatPanel
                    conversations={conversations}
                    currentUser={currentUser}
                    users={users}
                    onSendMessage={onSendMessage}
                    onDeleteMessage={onDeleteMessage}
                    onCreateOrOpenConversation={onCreateOrOpenConversation}
                    activeConversationId={activeConversationId}
                    setActiveConversationId={setActiveConversationId}
                />
            </main>
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage="#/chat"/>
        </div>
    );
};

export default ChatPage;
