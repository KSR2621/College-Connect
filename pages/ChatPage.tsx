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

    // Swipe navigation state
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

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
            // Swipe Left to go back to Home
            if (dx < 0) {
                onNavigate('#/home');
            }
        }
        
        setTouchStartX(null);
        setTouchStartY(null);
    };


    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    return (
        <div className="bg-muted/50 h-screen flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="flex-1 overflow-hidden min-h-0 container mx-auto p-0 md:py-4">
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