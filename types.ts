export type UserTag = 'Student' | 'Faculty' | 'Alumni';

export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  avatarUrl: string;
  tag: UserTag;
  department: string;
  year?: number; // Optional, may not apply to Faculty/Alumni
}

export interface Comment {
  id:string;
  authorId: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string; // Firestore Document ID
  authorId: string;
  content: string;
  timestamp: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
  imageUrl?: string;
  videoUrl?: string;
  // Event-specific fields
  eventType?: 'event';
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string; // Firestore Document ID
  participantIds: string[];
  messages: Message[];
}

export interface Opportunity {
    id: string; // Firestore Document ID
    authorId: string;
    title: string;
    organization: string;
    description: string;
    applyLink?: string;
    timestamp: string;
}