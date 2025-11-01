import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, Conversation } from '../types';
import Avatar from './Avatar';
import { SendIcon, ArrowLeftIcon, OptionsIcon, TrashIcon, CloseIcon } from './Icons';

interface ChatPanelProps {
  conversation: Conversation;
  currentUser: User;
  users: { [key: string]: User };
  onSendMessage: (conversationId: string, text: string) => void;
  onDeleteMessage: (conversationId: string, messageId: string) => void;
  onDeleteMultipleMessages: (conversationId: string, messageIds: string[]) => void;
  onClose: () => void; // For mobile view to go back to list
  onNavigate: (path: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, currentUser, users, onSendMessage, onDeleteMessage, onDeleteMultipleMessages, onClose, onNavigate }) => {
  const [text, setText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const otherParticipantId = useMemo(() => conversation.participantIds.find(id => id !== currentUser.id), [conversation, currentUser]);
  const otherUser = otherParticipantId ? users[otherParticipantId] : null;
  const isSelectionMode = selectedMessages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  useEffect(() => {
    // Clear selection when conversation changes
    setSelectedMessages([]);
  }, [conversation.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(conversation.id, text.trim());
      setText('');
    }
  };
  
  const handleDelete = (messageId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
        onDeleteMessage(conversation.id, messageId);
    }
    setDeletingMessageId(null);
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
    } else {
        // Regular click action (if any) could go here
    }
  };

  const handleLongPressStart = (messageId: string) => {
    wasLongPress.current = false;
    longPressTimerRef.current = setTimeout(() => {
        wasLongPress.current = true;
        if (!selectedMessages.includes(messageId)) {
            setSelectedMessages(prev => [...prev, messageId]);
        }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedMessages.length} message(s)?`)) {
        onDeleteMultipleMessages(conversation.id, selectedMessages);
        setSelectedMessages([]);
    }
  };

  if (!otherUser) {
      return <div className="flex-1 flex items-center justify-center text-text-muted">User not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {isSelectionMode ? (
        <div className="p-3 border-b border-border flex items-center justify-between bg-primary/5">
             <button onClick={() => setSelectedMessages([])} className="p-2 rounded-full hover:bg-muted text-foreground">
                <CloseIcon className="w-6 h-6" />
            </button>
            <p className="font-bold text-foreground">{selectedMessages.length} Selected</p>
            <button onClick={handleDeleteSelected} className="p-2 rounded-full hover:bg-muted text-destructive">
                <TrashIcon className="w-6 h-6" />
            </button>
        </div>
      ) : (
        <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                <button onClick={onClose} className="md:hidden p-1 rounded-full hover:bg-muted">
                    <ArrowLeftIcon className="w-6 h-6 text-foreground" />
                </button>
                <div className="cursor-pointer" onClick={() => onNavigate(`#/profile/${otherUser.id}`)}>
                    <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />
                </div>
                <div className="cursor-pointer flex-1 overflow-hidden" onClick={() => onNavigate(`#/profile/${otherUser.id}`)}>
                    <p className="font-bold text-foreground truncate">{otherUser.name}</p>
                    <p className="text-xs text-text-muted truncate">{otherUser.department}</p>
                </div>
            </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {conversation.messages.map(msg => {
          const sender = users[msg.senderId];
          const isCurrentUser = msg.senderId === currentUser.id;
          const isSelected = selectedMessages.includes(msg.id);

          return (
            <div key={msg.id}
                 className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                 onClick={() => handleMessageTap(msg.id)}
                 onMouseDown={() => handleLongPressStart(msg.id)}
                 onMouseUp={handleLongPressEnd}
                 onMouseLeave={handleLongPressEnd}
                 onTouchStart={() => handleLongPressStart(msg.id)}
                 onTouchEnd={handleLongPressEnd}
            >
              {!isCurrentUser && <Avatar src={sender?.avatarUrl} name={sender?.name || '?'} size="sm" />}
              <div className={`group relative max-w-xs md:max-w-md p-3 rounded-2xl transition-colors ${isSelected ? 'bg-primary/20' : (isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-card-foreground rounded-bl-md')}`}>
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
              {isCurrentUser && (
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDeletingMessageId(deletingMessageId === msg.id ? null : msg.id)} className={`p-1 text-text-muted rounded-full transition-opacity ${isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                        <OptionsIcon className="w-5 h-5"/>
                    </button>
                    {deletingMessageId === msg.id && (
                        <div className="absolute bottom-full right-0 mb-1 w-28 bg-card rounded-md shadow-lg border border-border z-10">
                            <button onClick={() => handleDelete(msg.id)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-destructive hover:bg-muted">
                                <TrashIcon className="w-4 h-4"/> Delete
                            </button>
                        </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-input border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <button type="submit" className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!text.trim()}>
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;