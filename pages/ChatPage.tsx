import React, { useState } from 'react';
import Header from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import BottomNavBar from '../components/BottomNavBar';
import type { User, Conversation } from '../types';

interface ChatPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  conversations: Conversation[];
  users: { [key: string]: User };
  onSendMessage: (conversationId: string, text: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
}

const ChatPage: React.FC<ChatPageProps> = ({ 
  user, 
  onLogout, 
  onNavigate, 
  conversations, 
  users, 
  onSendMessage,
  onCreateOrOpenConversation,
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div className="h-screen bg-background-dark text-text-primary-dark flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 pb-16 md:pb-0">
            <ChatPanel 
                conversations={conversations}
                currentUser={user}
                users={users}
                onSendMessage={onSendMessage}
                onCreateOrOpenConversation={onCreateOrOpenConversation}
                activeConversationId={activeConversationId}
                setActiveConversationId={setActiveConversationId}
            />
        </div>
      </main>
      <BottomNavBar onNavigate={onNavigate} currentRoute="#/chat" />
    </div>
  );
};

export default ChatPage;