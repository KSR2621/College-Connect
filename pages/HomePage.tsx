import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, Post, Group, ReactionType, Story, FeedPreferences, ConfessionMood } from '../types';
import Header from '../components/Header';
import CreatePostModal from '../components/CreatePostModal';
import Feed from '../components/Feed';
import BottomNavBar from '../components/BottomNavBar';
import StoriesReel from '../components/StoriesReel';
import StoryCreatorModal from '../components/StoryCreatorModal';
import StoryViewerModal from '../components/StoryViewerModal';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import InlineCreatePost from '../components/InlineCreatePost';
import { auth } from '../firebase';
import { BriefcaseIcon, CalendarIcon, CloseIcon, GhostIcon, PostIcon, PlusIcon, UsersIcon } from '../components/Icons';

interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  stories: Story[];
  groups: Group[];
  events: Post[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { content: string; mediaDataUrl?: string | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; link?: string; }; isConfession?: boolean, confessionMood?: ConfessionMood }) => void;
  onAddStory: (storyDetails: { 
    textContent: string; 
    backgroundColor: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    groupId?: string;
  }) => void;
  onMarkStoryAsViewed: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onReplyToStory: (authorId: string, text: string) => void;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
  currentPath: string;
}

const HomePage: React.FC<HomePageProps> = (props) => {
    const { 
        currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, 
        onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, ...postCardProps 
    } = props;

    // === STATE MANAGEMENT ===
    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'forYou' | 'latest'>('forYou');
    const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
    
    // === REFS & PERSISTENCE ===
    const prevPostCountRef = useRef(posts.length);
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load user's sort order from local storage on component mount
        const savedSortOrder = localStorage.getItem('feedSortOrder') as 'forYou' | 'latest';
        if (savedSortOrder) {
            setSortOrder(savedSortOrder);
        }
    }, []);
    
    // Effect to detect new posts and show banner
    useEffect(() => {
        const isScrolled = (window.scrollY || document.documentElement.scrollTop) > 200;
        if (posts.length > prevPostCountRef.current && isScrolled) {
            setShowNewPostsBanner(true);
        }
        prevPostCountRef.current = posts.length;
    }, [posts]);

    // Effect to hide banner on scroll to top
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY < 200) {
                setShowNewPostsBanner(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    // === HANDLERS ===
    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };
    
    const handleSortOrderChange = (order: 'forYou' | 'latest') => {
        setSortOrder(order);
        localStorage.setItem('feedSortOrder', order);
    };

    const handleShowNewPosts = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowNewPostsBanner(false);
    };

    // === MEMOIZED FEED LOGIC ===
    const getPostScore = useCallback((post: Post): number => {
        let score = 0;
        const author = users[post.authorId];
        if (author && author.department === currentUser.department && author.id !== currentUser.id) score += 5;
        if (post.groupId) {
            const group = groups.find(g => g.id === post.groupId);
            if (group && group.memberIds.includes(currentUser.id)) score += 8;
        }
        const userInterests = currentUser.interests || [];
        if (userInterests.length > 0) {
            const postText = [post.content, post.eventDetails?.title, post.opportunityDetails?.title, post.sharedPost?.originalContent].join(' ').toLowerCase();
            for (const interest of userInterests) {
                if (postText.includes(interest.toLowerCase())) score += 3;
            }
        }
        return score;
    }, [users, currentUser, groups]);

    const feedToRender = useMemo(() => {
        const userGroupIds = new Set([
            ...(currentUser.followingGroups || []),
            ...groups.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id)
        ]);

        const filtered = posts.filter(post => {
            // Exclude all confessions from the main home feed
            if (post.isConfession) {
                return false;
            }

            // If it's a group post, only show it if the user is a member or follower of that group.
            if (post.groupId && !userGroupIds.has(post.groupId)) {
                return false;
            }
            // Otherwise, show the post
            return true;
        });

        if (sortOrder === 'latest') {
            return filtered; // Already sorted by timestamp desc from source
        }

        // "For You" sorting logic remains the same, but applied to the new unified feed.
        return filtered
            .map(post => ({ post, score: getPostScore(post) }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.post.timestamp - a.post.timestamp;
            })
            .map(item => item.post);
    }, [posts, sortOrder, currentUser, groups, getPostScore]);


    // === RENDER ===
    return (
        <div className="bg-slate-50 min-h-screen">
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onNavigate={onNavigate} 
                currentPath={props.currentPath}
            />
            
            {showNewPostsBanner && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
                    <button onClick={handleShowNewPosts} className="bg-primary text-primary-foreground font-bold py-2 px-5 rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105">
                        New Posts Available
                    </button>
                </div>
            )}

            <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4" ref={mainContentRef}>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3">
                       <LeftSidebar currentUser={currentUser} onNavigate={onNavigate} />
                    </aside>

                    {/* Main Content Feed */}
                    <div className="lg:col-span-6">
                        <div className="max-w-2xl mx-auto w-full">
                            <StoriesReel
                                stories={stories}
                                users={users}
                                groups={groups}
                                currentUser={currentUser}
                                onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                                onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                            />
                            
                            <InlineCreatePost user={currentUser} onOpenCreateModal={setCreateModalType} />

                            {/* Feed sort options */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-foreground">Feed</h2>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleSortOrderChange('forYou')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sortOrder === 'forYou' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-muted'}`}>For You</button>
                                    <button onClick={() => handleSortOrderChange('latest')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${sortOrder === 'latest' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-muted'}`}>Latest</button>
                                </div>
                            </div>


                            <Feed 
                                posts={feedToRender}
                                users={users}
                                currentUser={currentUser}
                                groups={groups}
                                onNavigate={onNavigate}
                                {...postCardProps}
                            />
                        </div>
                    </div>
                    
                    {/* Right Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <RightSidebar 
                            groups={groups}
                            events={events}
                            currentUser={currentUser}
                            onNavigate={onNavigate}
                            users={Object.values(users)}
                        />
                    </aside>
                 </div>
            </main>

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={props.currentPath}/>
            
            <button
                onClick={() => setCreateModalType('post')}
                className="fixed bottom-20 right-5 md:bottom-8 md:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-110 z-40"
                aria-label="Create new post"
            >
                <PlusIcon className="w-7 h-7"/>
            </button>


            {/* Modals */}
            <CreatePostModal 
                isOpen={!!createModalType}
                onClose={() => setCreateModalType(null)}
                user={currentUser}
                onAddPost={onAddPost}
                defaultType={createModalType === 'event' ? 'event' : 'post'}
            />

            {isStoryCreatorOpen && (
                <StoryCreatorModal
                    currentUser={currentUser}
                    adminOfGroups={groups.filter(g => g.creatorId === currentUser.id)}
                    onClose={() => setIsStoryCreatorOpen(false)}
                    onAddStory={onAddStory}
                />
            )}

            {viewingStoryEntityId && (
                <StoryViewerModal
                    stories={stories}
                    users={users}
                    groups={groups}
                    currentUser={currentUser}
                    startEntityId={viewingStoryEntityId}
                    onClose={() => setViewingStoryEntityId(null)}
                    onMarkStoryAsViewed={onMarkStoryAsViewed}
                    onDeleteStory={onDeleteStory}
                    onReplyToStory={onReplyToStory}
                />
            )}
        </div>
    );
};

export default HomePage;