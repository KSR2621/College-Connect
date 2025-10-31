import React from 'react';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
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
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="h-[calc(100vh-8rem)]">
            <ChatPanel 
                conversations={conversations}
                currentUser={user}
                onSendMessage={onSendMessage}
            />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;