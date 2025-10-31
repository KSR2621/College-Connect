import type { User, Post, Conversation } from './types';

export const MOCK_USERS: { [key: string]: User } = {
  'user-1': {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/alice/100/100',
    tag: 'Student',
    department: 'Computer Science',
    year: 3
  },
  'user-2': {
    id: 'user-2',
    name: 'Bob Williams',
    email: 'bob.w@university.edu',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/bob/100/100',
    tag: 'Student',
    department: 'Mechanical Engineering',
    year: 4
  },
  'user-3': {
    id: 'user-3',
    name: 'Dr. Carol White',
    email: 'carol.w@university.edu',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/carol/100/100',
    tag: 'Faculty',
    department: 'Physics'
  },
  'user-4': {
    id: 'user-4',
    name: 'David Green',
    email: 'david.g@university.edu',
    password: 'password123',
    avatarUrl: 'https://picsum.photos/seed/david/100/100',
    tag: 'Alumni',
    department: 'Business Administration'
  },
};

export const MOCK_CURRENT_USER = MOCK_USERS['user-1'];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    author: MOCK_USERS['user-2'],
    content: 'Just finished my final year project presentation! It was a tough journey but learned so much. Big thanks to my project guide, Dr. White, for the constant support. #engineering #finalyear',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    imageUrl: 'https://picsum.photos/seed/project/600/400',
    likes: ['user-1', 'user-3'],
    comments: [
      {
        id: 'comment-1',
        author: MOCK_USERS['user-3'],
        text: 'Excellent work, Bob! Your dedication was evident throughout the project.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'comment-2',
        author: MOCK_USERS['user-1'],
        text: 'Congrats! That looks amazing!',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: 'post-2',
    author: MOCK_USERS['user-3'],
    content: 'A reminder to all physics students: The guest lecture on Quantum Computing has been scheduled for this Friday at 3 PM in the main auditorium. Don\'t miss out on this fantastic opportunity!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: ['user-1', 'user-2', 'user-4'],
    comments: [],
  },
  {
    id: 'post-3',
    author: MOCK_USERS['user-4'],
    content: 'Our startup is looking for talented interns for a 3-month winter internship program. If you are skilled in React and Node.js, feel free to DM me. Great chance to work on a live product! #internship #opportunity',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: [],
    comments: [],
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-1',
        participants: [MOCK_USERS['user-1'], MOCK_USERS['user-2']],
        messages: [
            { id: 'msg-1-1', senderId: 'user-2', text: 'Hey Alice, did you see the internship opportunity David posted?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()},
            { id: 'msg-1-2', senderId: 'user-1', text: 'Oh, no I missed it! Is it still open?', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString()},
            { id: 'msg-1-3', senderId: 'user-2', text: 'I think so! You should DM him. It looks perfect for you.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString()},
        ]
    },
    {
        id: 'conv-2',
        participants: [MOCK_USERS['user-1'], MOCK_USERS['user-3']],
        messages: [
            { id: 'msg-2-1', senderId: 'user-1', text: 'Hello Dr. White, I had a question about the upcoming quantum computing lecture.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()},
            { id: 'msg-2-2', senderId: 'user-3', text: 'Hi Alice, of course. How can I help?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString()},
        ]
    },
    {
        id: 'conv-3',
        participants: [MOCK_USERS['user-1'], MOCK_USERS['user-4']],
        messages: [
            { id: 'msg-3-1', senderId: 'user-4', text: 'Just saw your profile. Impressive projects!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()},
        ]
    }
];