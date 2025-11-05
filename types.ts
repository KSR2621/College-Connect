import React from 'react';

// FIX: Replaced circular import with the actual type definition for UserTag, resolving the circular dependency.
export type UserTag = 'Student' | 'Faculty' | 'Alumni';
export type ConfessionMood = 'love' | 'funny' | 'sad' | 'chaos' | 'deep';

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
  savedPosts?: string[];
  // FIX: Added personalNotes property to User type to resolve error in PersonalNotesPage.
  personalNotes?: PersonalNote[];
}

// FIX: Added PersonalNote type to resolve error in PersonalNotesPage.
export type PersonalNote = {
    id: string;
    title: string;
    content: string;
    timestamp: number;
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
      link?: string;
  };
  originalIsConfession?: boolean;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type Post = {
    id:string;
    authorId: string;
    content: string; // Used for description in opportunities
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    timestamp: number;
    reactions?: { [key in ReactionType]?: string[] };
    comments: Comment[];
    groupId?: string;
    isEvent?: boolean;
    eventDetails?: {
        title: string;
        date: string;
        location: string;
        link?: string;
    };
    isConfession?: boolean;
    confessionMood?: ConfessionMood;
    sharedPost?: SharedPostInfo;
    isOpportunity?: boolean;
    opportunityDetails?: {
        title: string;
        organization: string;
        applyLink?: string;
    };
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

export type FeedPreferences = {
  showRegularPosts: boolean;
  showEvents: boolean;
  showOpportunities: boolean;
  showSharedPosts: boolean;
};

// --- Academics Types ---

export type Student = {
    id: string;
    name: string;
    avatarUrl?: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type AttendanceRecord = {
    date: number; // timestamp for the day
    records: Record<string, { status: AttendanceStatus; note?: string }>; // studentId -> { status, optional note }
};

export type Note = {
    id: string;
    title: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: number;
};

export type Assignment = {
    id: string;
    title: string;
    fileUrl: string;
    fileName: string;
    postedAt: number;
    dueDate: number;
};

export type Course = {
    id: string;
    subject: string;
    department: string;
    year: number;
    facultyId: string; // Added to identify the instructor
    description?: string;
    notes?: Note[];
    assignments?: Assignment[];
    attendanceRecords?: AttendanceRecord[];
    students?: string[]; // array of enrolled student IDs
    pendingStudents?: string[]; // array of student IDs requesting to join
    messages?: Message[]; // For in-course chat
    personalNotes?: { [userId: string]: string; }; // Private notes for faculty and students
};


// --- Notice Board Types ---
export type Notice = {
  id: string;
  authorId: string;
  title: string;
  content: string; // HTML content from editor
  timestamp: number;
  // FIX: Add optional properties for targeted notices to resolve type errors.
  targetDepartments?: string[];
  targetYears?: number[];
};