
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, Conversation, Message } from '../types';
import Avatar from '../components/Avatar';
import { SendIcon, ArrowLeftIcon, TrashIcon, CloseIcon, UsersIcon } from '../components/Icons';

interface ChatPanelProps {
  conversation: Conversation;
  currentUser: User;
  users: { [key: string]: User };
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteMessagesForEveryone: (conversationId: string, messageIds: string[]) => void;
  onDeleteMessagesForSelf: (conversationId: string, messageIds: string[]) => void;
  onClose: () => void; // For mobile view to go back to list
  onNavigate: (path: string) => void;
}

const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const isSameDay = (ts1: number, ts2: number) => {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatDateSeparator = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (messageDate >= startOfToday) {
        return 'Today';
    } else if (messageDate >= startOfYesterday) {
        return 'Yesterday';
    } else {
        return messageDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    }
};

const DeleteMessageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    canDeleteForEveryone: boolean;
    onDeleteForMe: () => void;
    onDeleteForEveryone: () => void;
}> = ({ isOpen, onClose, canDeleteForEveryone, onDeleteForMe, onDeleteForEveryone }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-xs border border-border" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg text-center mb-4 text-foreground">Delete message(s)?</h3>
                <div className="space-y-3">
                    {canDeleteForEveryone && (
                        <button onClick={onDeleteForEveryone} className="w-full text-left p-3 rounded-lg hover:bg-muted text-destructive font-semibold transition-colors">Delete for everyone</button>
                    )}
                    <button onClick={onDeleteForMe} className="w-full text-left p-3 rounded-lg hover:bg-muted text-foreground font-semibold transition-colors">Delete for me</button>
                    <button onClick={onClose} className="w-full p-3 rounded-lg hover:bg-muted text-center font-semibold text-muted-foreground transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, currentUser, users, onSendMessage, onDeleteMessagesForEveryone, onDeleteMessagesForSelf, onClose, onNavigate }) => {
  const [text, setText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const prevMessagesLength = useRef(conversation.messages.length);

  const isGroupChat = conversation.isGroupChat;
  const otherParticipantId = !isGroupChat ? conversation.participantIds.find(id => id !== currentUser.id) : null;
  const otherUser = otherParticipantId ? users[otherParticipantId] : null;
  const chatName = isGroupChat ? conversation.name : otherUser?.name;

  const isSelectionMode = selectedMessages.length > 0;

  const visibleMessages = useMemo(() => {
    return conversation.messages.filter(msg => !msg.deletedFor?.includes(currentUser.id));
  }, [conversation.messages, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    prevMessagesLength.current = conversation.messages.length;
  }, [conversation.id]);

  useEffect(() => {
    const currentMessagesLength = visibleMessages.length;
    if (currentMessagesLength > prevMessagesLength.current) {
      const messagesContainer = messagesContainerRef.current;
      if (messagesContainer) {
        const lastMessage = visibleMessages[currentMessagesLength - 1];
        const isFromCurrentUser = lastMessage.senderId === currentUser.id;
        const scrollThreshold = 150;
        const isScrolledNearBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + scrollThreshold;

        if (isFromCurrentUser || isScrolledNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevMessagesLength.current = currentMessagesLength;
  }, [visibleMessages, currentUser.id]);

  useEffect(() => {
    setSelectedMessages([]);
  }, [conversation.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(conversation.id, text.trim());
      setText('');
    }
  };
  
  const handleMessageTap = (messageId: string) => {
    if (wasLongPress.current) {
        wasLongPress.current = false;
        return;
    }
    if (isSelectionMode) {
        setSelectedMessages(prev => 
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    }
  };

  const handleLongPressStart = (messageId: string) => {
    wasLongPress.current = false;
    longPressTimerRef.current = setTimeout(() => {
        wasLongPress.current = true;
        if (navigator.vibrate) navigator.vibrate(50);
        if (!selectedMessages.includes(messageId)) {
            setSelectedMessages(prev => [...prev, messageId]);
        }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleDeleteTrigger = () => {
    setIsDeleteModalOpen(true);
  };
  
  const canDeleteForEveryone = useMemo(() => {
      if (selectedMessages.length === 0) return false;
      const messagesToDelete = conversation.messages.filter(m => selectedMessages.includes(m.id));
      return messagesToDelete.every(m => m.senderId === currentUser.id);
  }, [selectedMessages, conversation.messages, currentUser.id]);

  if (!isGroupChat && !otherUser) {
      return <div className="flex-1 flex items-center justify-center text-muted-foreground">User not found</div>;
  }

  return (
    <div className="flex flex-col h-full bg-muted/10 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

      {/* Static Header */}
      {isSelectionMode ? (
        <header className="flex-none h-16 px-4 flex items-center justify-between bg-card border-b border-border z-20 shadow-sm relative">
             <button onClick={() => setSelectedMessages([])} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors">
                <CloseIcon className="w-6 h-6" />
            </button>
            <p className="font-bold text-foreground text-lg">{selectedMessages.length} Selected</p>
            <button onClick={handleDeleteTrigger} className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors">
                <TrashIcon className="w-6 h-6" />
            </button>
        </header>
      ) : (
        <header className="flex-none h-16 px-4 flex items-center justify-between bg-card border-b border-border z-20 shadow-sm relative">
            <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                <button onClick={onClose} className="md:hidden p-1 rounded-full hover:bg-muted transition-colors -ml-2 text-foreground">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                {isGroupChat ? (
                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                        <UsersIcon className="w-6 h-6"/>
                    </div>
                ) : (
                    <div className="cursor-pointer" onClick={() => onNavigate(`#/profile/${otherUser.id}`)}>
                        <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                    </div>
                )}
                <div className={!isGroupChat && otherUser ? "cursor-pointer flex-1 overflow-hidden" : "flex-1 overflow-hidden"} onClick={!isGroupChat && otherUser ? () => onNavigate(`#/profile/${otherUser.id}`) : undefined}>
                    <p className="font-bold text-foreground truncate text-base">{chatName}</p>
                    {isGroupChat ? (
                         <p className="text-xs text-muted-foreground font-medium">{conversation.participantIds.length} members</p>
                    ) : (
                        <p className="text-xs text-muted-foreground truncate font-medium">{otherUser?.department}</p>
                    )}
                </div>
            </div>
        </header>
      )}

      {/* Scrollable Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2 z-10">
        {visibleMessages.map((msg, index) => {
          const sender = users[msg.senderId];
          const isCurrentUser = msg.senderId === currentUser.id;
          const isSelected = selectedMessages.includes(msg.id);
          
          const prevMessage = index > 0 ? visibleMessages[index - 1] : null;
          const showDateSeparator = !prevMessage || !isSameDay(msg.timestamp, prevMessage.timestamp);

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-4 sticky top-2 z-10">
                  <span className="bg-card/80 backdrop-blur-md text-muted-foreground text-xs font-bold px-3 py-1 rounded-full border border-border shadow-sm">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <div 
                  className={`flex items-end gap-2 animate-bubble-in ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  onClick={() => handleMessageTap(msg.id)}
                  onMouseDown={() => handleLongPressStart(msg.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={() => handleLongPressStart(msg.id)}
                  onTouchEnd={handleLongPressEnd}
              >
                {!isCurrentUser && sender && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" className="mb-1 shadow-sm" />}
                <div className="flex flex-col max-w-[80%] sm:max-w-md">
                   {!isCurrentUser && conversation.isGroupChat && sender && (
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 px-3">{sender.name}</p>
                  )}
                  <div className={`relative px-4 py-2.5 text-sm transition-all shadow-sm ${
                      isSelected 
                        ? 'bg-primary/30 border-2 border-primary rounded-xl' 
                        : (isCurrentUser 
                            ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-card text-foreground border border-border rounded-2xl rounded-tl-sm'
                          )
                  }`}>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  </div>
                   <p className={`text-[9px] font-medium text-muted-foreground mt-1 px-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>{formatTimestamp(msg.timestamp)}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Static Footer (Input) */}
      <div className="flex-none p-3 bg-card border-t border-border z-20 safe-area-bottom">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-muted/40 p-1.5 rounded-[26px] border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-4 py-2.5 text-foreground placeholder:text-muted-foreground max-h-32 min-h-[44px] resize-none custom-scrollbar"
            rows={1}
            style={{ lineHeight: '1.5' }}
          />
          <button 
            type="submit" 
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-0 disabled:scale-50 transition-all duration-200 shadow-md shadow-primary/20 mb-0.5" 
            disabled={!text.trim()}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        canDeleteForEveryone={canDeleteForEveryone}
        onDeleteForEveryone={() => {
            onDeleteMessagesForEveryone(conversation.id, selectedMessages);
            setIsDeleteModalOpen(false);
            setSelectedMessages([]);
        }}
        onDeleteForMe={() => {
            onDeleteMessagesForSelf(conversation.id, selectedMessages);
            setIsDeleteModalOpen(false);
            setSelectedMessages([]);
        }}
      />
    </div>
  );
};

export default ChatPanel;
