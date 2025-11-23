
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Post, Group, Story, ReactionType } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import Feed from '../components/Feed';
import StoriesReel from '../components/StoriesReel';
import InlineCreatePost from '../components/InlineCreatePost';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import CreatePostModal from '../components/CreatePostModal';
import StoryCreatorModal from '../components/StoryCreatorModal';
import StoryViewerModal from '../components/StoryViewerModal';
import { TrendingUpIcon } from '../components/Icons';
import { auth } from '../firebase';

interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  stories: Story[];
  groups: Group[];
  events: Post[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: any) => void;
  onAddStory: (storyDetails: any) => void;
  onMarkStoryAsViewed: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onReplyToStory: (authorId: string, text: string) => void;
  currentPath: string;
  // postCardProps
  onReaction: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  onToggleSavePost: (postId: string) => void;
}

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, currentPath, ...postCardProps } = props;

    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'latest' | 'forYou'>('latest');
    const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const canPost = currentUser.isApproved !== false;

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleSortOrderChange = (order: 'latest' | 'forYou') => {
        setSortOrder(order);
    };

    const handleShowNewPosts = () => {
        setShowNewPostsBanner(false);
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const feedToRender = useMemo(() => {
        let filteredPosts = posts.filter(p => !p.isConfession && !p.groupId); // Main feed doesn't show confessions or group posts by default
        
        if (sortOrder === 'latest') {
            return filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            // Simple "For You" logic: prioritize posts from friends/followed groups? 
            // For now just shuffle or keep same as we don't have a complex graph
            return filteredPosts;
        }
    }, [posts, sortOrder]);

    // Check for new posts (simulated)
    useEffect(() => {
        if (posts.length > 0) {
            // Logic to detect new posts could go here
        }
    }, [posts.length]);

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            {/* New Posts Toast */}
            {showNewPostsBanner && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                    <button 
                        onClick={handleShowNewPosts} 
                        className="bg-primary text-white font-bold py-2 px-6 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2 border border-white/20"
                    >
                        <TrendingUpIcon className="w-4 h-4" />
                        New Posts
                    </button>
                </div>
            )}

            <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 lg:pb-8" ref={mainContentRef}>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    
                    {/* Left Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-24 transition-all duration-300 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
                       <LeftSidebar currentUser={currentUser} onNavigate={onNavigate} />
                       <div className="mt-6 text-xs text-muted-foreground text-center px-4 opacity-70">
                           &copy; 2025 CampusConnect
                           <div className="mt-1 space-x-2">
                               <a href="#" className="hover:underline">Privacy</a>
                               <span>&bull;</span>
                               <a href="#" className="hover:underline">Terms</a>
                           </div>
                       </div>
                    </aside>

                    {/* Main Feed Column */}
                    <div className="lg:col-span-6 w-full max-w-2xl mx-auto space-y-6">
                        
                        {/* Stories */}
                        <div className="relative">
                            <StoriesReel
                                stories={stories}
                                users={users}
                                groups={groups}
                                currentUser={currentUser}
                                onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                                onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                            />
                        </div>
                        
                        {/* Create Post */}
                        {canPost && (
                            <InlineCreatePost user={currentUser} onOpenCreateModal={setCreateModalType} />
                        )}

                        {/* Feed Header & Sort */}
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Your Feed</h2>
                            <div className="flex bg-card/80 p-1 rounded-lg shadow-sm border border-border backdrop-blur-sm">
                                <button 
                                    onClick={() => handleSortOrderChange('forYou')} 
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${sortOrder === 'forYou' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    For You
                                </button>
                                <button 
                                    onClick={() => handleSortOrderChange('latest')} 
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${sortOrder === 'latest' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Latest
                                </button>
                            </div>
                        </div>

                        {/* Posts Feed */}
                        <div className="min-h-[50vh]">
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
                    <aside className="hidden lg:block lg:col-span-3 sticky top-24 transition-all duration-300 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
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

            <CreatePostModal 
                isOpen={!!createModalType}
                onClose={() => setCreateModalType(null)}
                user={currentUser}
                onAddPost={onAddPost}
                defaultType={createModalType || 'post'}
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

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HomePage;
