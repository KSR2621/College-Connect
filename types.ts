
import React from 'react';

// FIX: Removed the 'Director/Principle' type as it was redundant. The value 'Director' is used.
export type UserTag = 'Student' | 'Teacher' | 'HOD/Dean' | 'Director' | 'Super Admin';
export type ConfessionMood = 'love' | 'funny' | 'sad' | 'chaos' | 'deep';

export type User = {
  id: string;
  name: string;
  email: string;
  department: string;
  tag: UserTag;
  collegeId?: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  achievements?: Achievement[];
  yearOfStudy?: number;
  followingGroups?: string[];
  savedPosts?: string[];
  // FIX: Added personalNotes property to User type to resolve error in PersonalNotesPage.
  personalNotes?: PersonalNote[];
  isApproved?: boolean;
  isRegistered?: boolean; // Tracks if the user has set a password/completed signup
  isFrozen?: boolean;
}

export type College = {
  id: string;
  name: string;
  adminUids: string[];
  departments?: string[];
  classes?: {
    [department: string]: {
        [year: number]: string[]; // array of division names
    }
  };
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
  originalMediaUrls?: string[];
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
    collegeId?: string;
    content: string; // Used for description in opportunities
    mediaUrls?: string[];
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
  collegeId?: string;
  textContent: string;
  backgroundColor: string;
  timestamp: number;
  viewedBy: string[];
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  groupId?: string;
}

export type GroupCategory = 'Academic' | 'Cultural' | 'Sports' | 'Tech' | 'Social' | 'Other';
export type GroupPrivacy = 'public' | 'private';

export type GroupResource = {
    id: string;
    title: string;
    url: string; // Can be a link or a file URL
    type: 'pdf' | 'image' | 'link' | 'other';
    uploadedBy: string;
    timestamp: number;
}

export type Group = {
    id: string;
    name: string;
    description: string;
    category?: GroupCategory;
    privacy?: GroupPrivacy;
    collegeId?: string;
    memberIds: string[];
    creatorId: string;
    pendingMemberIds?: string[];
    messages?: Message[];
    followers?: string[];
    resources?: GroupResource[];
    // Optional tagline if we want a short bio
    tagline?: string;
    coverImage?: string;
    visibilitySettings?: {
        about: boolean;
        feed: boolean;
        events: boolean;
        members: boolean;
        resources: boolean;
    };
}

export type Message = {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    deletedFor?: string[];
}

export type Conversation = {
    id: string;
    participantIds: string[];
    collegeId?: string;
    messages: Message[];
    name?: string; // For group chats
    isGroupChat?: boolean;
    creatorId?: 'system' | string;
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

export type Feedback = {
    studentId: string;
    rating: number;
    comment: string;
    timestamp: number;
}

export type Course = {
    id: string;
    subject: string;
    department: string;
    year: number;
    division?: string;
    facultyId: string; // Added to identify the instructor
    collegeId?: string;
    description?: string;
    notes?: Note[];
    assignments?: Assignment[];
    attendanceRecords?: AttendanceRecord[];
    students?: string[]; // array of enrolled student IDs
    pendingStudents?: string[]; // array of student IDs requesting to join
    messages?: Message[]; // For in-course chat
    personalNotes?: { [userId: string]: string; }; // Private notes for faculty and students
    feedback?: Feedback[];
};


// --- Notice Board Types ---
export type Notice = {
  id: string;
  authorId: string;
  title: string;
  content: string; // HTML content from editor
  timestamp: number;
  collegeId?: string;
  // FIX: Add optional properties for targeted notices to resolve type errors.
  targetDepartments?: string[];
  targetYears?: number[];
};

export type DepartmentChat = {
    id: string; // Department name
    collegeId?: string;
    department?: string;
    channel?: string;
    messages: Message[];
};
