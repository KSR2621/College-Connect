export type UserTag = 'Student' | 'Faculty' | 'Alumni';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  tag: UserTag;
  department: string;
  year?: number; // Optional, may not apply to Faculty/Alumni
}

export interface Comment {
  id:string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
  imageUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
}