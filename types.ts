export type UserTag = 'Student' | 'Faculty' | 'Alumni';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  tag: UserTag;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  achievements?: Achievement[];
  yearOfStudy?: number;
  followingGroups?: string[];
  isAdmin?: boolean;
}

export interface Achievement {
    title: string;
    description: string;
}

export interface Comment {
    id: string;
    authorId: string;
    text: string;
    timestamp: number;
}

export interface SharedPostInfo {
  originalId: string;
  originalAuthorId: string;
  originalTimestamp: number;
  originalContent: string;
  originalMediaUrl?: string;
  originalMediaType?: 'image' | 'video';
  originalIsEvent?: boolean;
  originalEventDetails?: {
      title: string;
      date: string;
      location: string;
  };
  originalIsConfession?: boolean;
}

export interface Post {
    id:string;
    authorId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    imagePath?: string; // For reliable deletion from storage
    videoPath?: string; // For reliable deletion from storage
    timestamp: number;
    likes: string[]; // Array of user IDs
    comments: Comment[];
    groupId?: string;
    isEvent?: boolean;
    eventDetails?: {
        title: string;
        date: string;
        location: string;
    };
    isConfession?: boolean;
    sharedPost?: SharedPostInfo;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    memberIds: string[];
    creatorId: string;
    pendingMemberIds?: string[];
    messages?: Message[];
    followers?: string[];
}

export interface Opportunity {
    id: string;
    authorId: string;
    title: string;
    organization: string;
    description: string;
    applyLink?: string;
    timestamp: number;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    messages: Message[];
}
