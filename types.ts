// FIX: Removed circular import of 'UserTag' and added the export of the UserTag type.
export type UserTag = 'Student' | 'Faculty' | 'Alumni';

export type User = {
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

export type Achievement = {
    title: string;
    description: string;
}

export type Comment = {
    id:string;
    authorId: string;
    text: string;
    timestamp: number;
}

export type SharedPostInfo = {
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

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type Post = {
    id:string;
    authorId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    imagePath?: string; // For reliable deletion from storage
    videoPath?: string; // For reliable deletion from storage
    timestamp: number;
    reactions?: { [key in ReactionType]?: string[] };
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

export type Story = {
  id: string;
  authorId: string;
  textContent: string;
  backgroundColor: string;
  timestamp: number;
  viewedBy: string[];
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  groupId?: string;
}

export type Group = {
    id: string;
    name: string;
    description: string;
    memberIds: string[];
    creatorId: string;
    pendingMemberIds?: string[];
    messages?: Message[];
    followers?: string[];
}

export type Opportunity = {
    id: string;
    authorId: string;
    title: string;
    organization: string;
    description: string;
    applyLink?: string;
    timestamp: number;
}

export type Message = {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export type Conversation = {
    id: string;
    participantIds: string[];
    messages: Message[];
}