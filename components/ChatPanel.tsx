
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
            <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-xs border border-border animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg text-center mb-4 text-foreground">Delete message?</h3>
                <div className="space-y-3">
                    {canDeleteForEveryone && (
                        <button onClick={onDeleteForEveryone} className="w-full text-left p-3 rounded-xl hover:bg-destructive/10 text-destructive font-semibold transition-colors text-sm">Delete for everyone</button>
                    )}
                    <button onClick={onDeleteForMe} className="w-full text-left p-3 rounded-xl hover:bg-muted text-foreground font-semibold transition-colors text-sm">Delete for me</button>
                    <button onClick={onClose} className="w-full p-3 rounded-xl hover:bg-muted text-center font-semibold text-muted-foreground transition-colors text-sm">Cancel</button>
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
      // Reset height of textarea
      const textarea = document.getElementById('chat-textarea');
      if(textarea) textarea.style.height = '44px';
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

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (!isGroupChat && !otherUser) {
      return <div className="flex-1 flex items-center justify-center text-muted-foreground">User not found</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden overscroll-none">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

      {/* Static Header */}
      <header className="flex-none z-50 w-full bg-card/95 backdrop-blur-md border-b border-border shadow-sm h-16 flex items-center px-2 sm:px-4 relative">
        {isSelectionMode ? (
            <div className="flex items-center justify-between w-full animate-fade-in">
                <button onClick={() => setSelectedMessages([])} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <p className="font-bold text-foreground text-lg">{selectedMessages.length} Selected</p>
                <button onClick={handleDeleteTrigger} className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors">
                    <TrashIcon className="w-6 h-6" />
                </button>
            </div>
        ) : (
            <div className="flex items-center space-x-2 w-full">
                <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-muted transition-colors text-foreground -ml-1">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center space-x-3 flex-1 overflow-hidden cursor-pointer" onClick={!isGroupChat && otherUser ? () => onNavigate(`#/profile/${otherUser.id}`) : undefined}>
                    {isGroupChat ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <UsersIcon className="w-5 h-5"/>
                        </div>
                    ) : (
                        <Avatar src={otherUser?.avatarUrl} name={chatName || 'User'} size="md" className="border border-border"/>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-base leading-tight">{chatName}</p>
                        {isGroupChat ? (
                             <p className="text-xs text-muted-foreground font-medium truncate">{conversation.participantIds.length} members</p>
                        ) : (
                            <p className="text-xs text-muted-foreground truncate font-medium">{otherUser?.department || 'Online'}</p>
                        )}
                    </div>
                </div>
            </div>
        )}
      </header>

      {/* Scrollable Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 z-10 w-full scroll-smooth custom-scrollbar overscroll-contain">
        {visibleMessages.map((msg, index) => {
          const sender = users[msg.senderId];
          const isCurrentUser = msg.senderId === currentUser.id;
          const isSelected = selectedMessages.includes(msg.id);
          
          const prevMessage = index > 0 ? visibleMessages[index - 1] : null;
          const showDateSeparator = !prevMessage || !isSameDay(msg.timestamp, prevMessage.timestamp);
          
          // Grouping logic for consecutive messages
          const isSequence = prevMessage && prevMessage.senderId === msg.senderId && !showDateSeparator;

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-5 py-1">
                  <span className="bg-muted/60 backdrop-blur-sm text-muted-foreground text-[10px] font-bold px-3 py-1 rounded-full border border-border/50 shadow-sm">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              
              <div 
                  className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-0.5' : 'mt-3'}`}
                  onClick={() => handleMessageTap(msg.id)}
                  onMouseDown={() => handleLongPressStart(msg.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={() => handleLongPressStart(msg.id)}
                  onTouchEnd={handleLongPressEnd}
              >
                <div className={`flex max-w-[80%] sm:max-w-[65%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar for received messages */}
                    {!isCurrentUser && (
                        <div className="flex-shrink-0 w-8 mr-2 flex flex-col justify-end">
                            {!isSequence && sender && <Avatar src={sender.avatarUrl} name={sender.name} size="sm" className="shadow-sm" />}
                        </div>
                    )}

                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {!isCurrentUser && !isSequence && conversation.isGroupChat && sender && (
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 mb-1">{sender.name}</span>
                        )}
                        
                        <div className={`
                            relative px-4 py-2.5 text-[15px] shadow-sm transition-all
                            ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                            ${isCurrentUser 
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                                : 'bg-card text-card-foreground border border-border rounded-2xl rounded-tl-sm'}
                        `}>
                            <p className="whitespace-pre-wrap break-words leading-snug">{msg.text}</p>
                        </div>
                        
                        {/* Timestamp only on last of sequence or if selected */}
                        <span className={`text-[9px] font-medium text-muted-foreground/70 mt-0.5 px-1 ${isSelectionMode ? 'block' : 'opacity-0 group-hover:opacity-100 transition-opacity'} ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatTimestamp(msg.timestamp)}
                        </span>
                    </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Static Footer (Input) */}
      <div className="flex-none z-50 w-full bg-card border-t border-border p-3 safe-area-bottom relative">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-muted/40 p-1.5 rounded-[24px] border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <textarea
            id="chat-textarea"
            value={text}
            onChange={handleTextareaInput}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-4 py-2.5 text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px] resize-none custom-scrollbar"
            rows={1}
            style={{ lineHeight: '1.5' }}
          />
          <button 
            type="submit" 
            className="p-2.5 m-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-0 disabled:scale-50 transition-all duration-200 shadow-md shadow-primary/20 flex-shrink-0" 
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
