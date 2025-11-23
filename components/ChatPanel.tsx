
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, Conversation } from '../types';
import Avatar from '../components/Avatar';
import { SendIcon, ArrowLeftIcon, TrashIcon, CloseIcon, UsersIcon } from '../components/Icons';

interface ChatPanelProps {
  conversation: Conversation;
  currentUser: User;
  users: { [key: string]: User };
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteMessagesForEveryone: (conversationId: string, messageIds: string[]) => void;
  onDeleteMessagesForSelf: (conversationId: string, messageIds: string[]) => void;
  onClose: () => void;
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
                <h3 className="font-bold text-lg text-center mb-4 text-foreground">Delete message(s)?</h3>
                <div className="space-y-3">
                    {canDeleteForEveryone && (
                        <button onClick={onDeleteForEveryone} className="w-full text-left p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold transition-colors">Delete for everyone</button>
                    )}
                    <button onClick={onDeleteForMe} className="w-full text-left p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors">Delete for me</button>
                    <button onClick={onClose} className="w-full p-3 rounded-xl hover:bg-muted text-center font-semibold text-muted-foreground transition-colors">Cancel</button>
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
    if (visibleMessages.length > prevMessagesLength.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const lastMsg = visibleMessages[visibleMessages.length - 1];
        const isMine = lastMsg.senderId === currentUser.id;
        const scrollBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
        if (isMine || scrollBottom < 150) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevMessagesLength.current = visibleMessages.length;
  }, [visibleMessages, currentUser.id]);

  useEffect(() => { setSelectedMessages([]); }, [conversation.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(conversation.id, text.trim());
      setText('');
    }
  };
  
  const handleMessageTap = (messageId: string) => {
    if (wasLongPress.current) { wasLongPress.current = false; return; }
    if (isSelectionMode) {
        setSelectedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
    }
  };

  const handleLongPressStart = (messageId: string) => {
    wasLongPress.current = false;
    longPressTimerRef.current = setTimeout(() => {
        wasLongPress.current = true;
        if (!selectedMessages.includes(messageId)) setSelectedMessages(prev => [...prev, messageId]);
    }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };

  const canDeleteForEveryone = useMemo(() => {
      if (selectedMessages.length === 0) return false;
      const messagesToDelete = conversation.messages.filter(m => selectedMessages.includes(m.id));
      return messagesToDelete.every(m => m.senderId === currentUser.id);
  }, [selectedMessages, conversation.messages, currentUser.id]);

  if (!isGroupChat && !otherUser) return <div className="flex-1 flex items-center justify-center text-muted-foreground">User not found</div>;

  return (
    <div className="flex flex-col h-full relative bg-background">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Header */}
      <header className="h-16 px-4 py-2 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between z-20 shadow-sm">
        {isSelectionMode ? (
            <div className="flex items-center gap-4 w-full animate-fade-in">
                <button onClick={() => setSelectedMessages([])} className="p-2 hover:bg-muted rounded-full text-foreground"><CloseIcon className="w-5 h-5"/></button>
                <span className="font-bold text-lg text-foreground">{selectedMessages.length} Selected</span>
                <div className="ml-auto">
                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={!isGroupChat ? () => onNavigate(`#/profile/${otherUser!.id}`) : undefined}>
                <button onClick={onClose} className="md:hidden p-1 text-muted-foreground hover:text-foreground"><ArrowLeftIcon className="w-6 h-6"/></button>
                {isGroupChat ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm"><UsersIcon className="w-5 h-5"/></div>
                ) : (
                    <Avatar src={otherUser?.avatarUrl} name={chatName || ''} size="md" className="ring-2 ring-border" />
                )}
                <div className="flex flex-col justify-center">
                    <h4 className="text-base font-bold text-foreground leading-tight truncate max-w-[150px] sm:max-w-xs">{chatName}</h4>
                    <span className="text-xs text-muted-foreground truncate leading-tight font-medium">
                        {isGroupChat ? `${conversation.participantIds.length} members` : 'View Profile'}
                    </span>
                </div>
                {/* Clean Header: No call/option icons here */}
            </div>
        )}
      </header>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:px-6 z-10 custom-scrollbar space-y-1.5">
        {visibleMessages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = users[msg.senderId];
          const isSelected = selectedMessages.includes(msg.id);
          const prevMsg = index > 0 ? visibleMessages[index - 1] : null;
          const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
          
          const bubbleClass = isMe 
            ? 'bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl rounded-tr-sm shadow-md shadow-primary/20' 
            : 'bg-card border border-border text-foreground rounded-2xl rounded-tl-sm shadow-sm';

          const selectionClass = isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '';

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="bg-muted/50 backdrop-blur-md text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-border">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              
              <div 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                onClick={() => handleMessageTap(msg.id)}
                onMouseDown={() => handleLongPressStart(msg.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(msg.id)}
                onTouchEnd={handleLongPressEnd}
              >
                <div className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 ${bubbleClass} ${selectionClass} transition-all duration-200 animate-fade-in`}>
                    {!isMe && isGroupChat && isFirstInGroup && (
                        <p className="text-xs font-bold mb-1 text-primary opacity-90">
                            {sender?.name || 'Unknown'}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-x-3 items-end">
                        <span className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{msg.text}</span>
                        <span className={`text-[10px] font-medium ml-auto ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTimestamp(msg.timestamp)}
                        </span>
                    </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <footer className="p-3 bg-card border-t border-border z-20">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-muted/30 p-1 rounded-[24px] border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto resize-none"
            />
            <button 
                type="submit" 
                disabled={!text.trim()}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-0 disabled:scale-75 transition-all shadow-md shadow-primary/20 m-1"
            >
                <SendIcon className="w-5 h-5"/>
            </button>
        </form>
      </footer>

      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        canDeleteForEveryone={canDeleteForEveryone}
        onDeleteForEveryone={() => { onDeleteMessagesForEveryone(conversation.id, selectedMessages); setIsDeleteModalOpen(false); setSelectedMessages([]); }}
        onDeleteForMe={() => { onDeleteMessagesForSelf(conversation.id, selectedMessages); setIsDeleteModalOpen(false); setSelectedMessages([]); }}
      />
    </div>
  );
};

export default ChatPanel;
