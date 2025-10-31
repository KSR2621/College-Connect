import React from 'react';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import BottomNavBar from '../components/BottomNavBar';
import type { User, Conversation } from '../types';

interface ChatPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout, onNavigate, conversations, onSendMessage }) => {
  return (
    <div className="h-screen bg-background-dark text-text-primary-dark flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 pb-16 md:pb-0">
            <ChatPanel 
                conversations={conversations}
                currentUser={user}
                onSendMessage={onSendMessage}
            />
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/chat" />
    </div>
  );
};

export default ChatPage;
