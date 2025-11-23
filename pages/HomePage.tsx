
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Post, Group, Story, ReactionType, Notice } from '../types';
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
import { TrendingUpIcon, ChevronDownIcon } from '../components/Icons';
import { auth } from '../firebase';

interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  stories: Story[];
  groups: Group[];
  events: Post[];
  notices: Notice[];
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

type FeedFilter = 'Latest' | 'For You' | 'Groups';

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, stories, groups, events, notices, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, currentPath, ...postCardProps } = props;

    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('For You');
    const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const canPost = currentUser.isApproved !== false;

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const handleShowNewPosts = () => {
        setShowNewPostsBanner(false);
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const feedToRender = useMemo(() => {
        let filteredPosts = posts.filter(p => !p.isConfession); // Base filter: no confessions in main feed

        if (activeFilter === 'Groups') {
            const myGroupIds = currentUser.followingGroups || [];
            // Include posts posted to my groups
            filteredPosts = filteredPosts.filter(p => p.groupId && myGroupIds.includes(p.groupId));
        } else if (activeFilter === 'Latest') {
            // Show all public posts + posts from my groups
            filteredPosts = filteredPosts.filter(p => !p.groupId || (currentUser.followingGroups || []).includes(p.groupId));
            // Sort purely by time
            return filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            // 'For You' (Default)
            filteredPosts = filteredPosts.filter(p => {
                const author = users[p.authorId];
                const isMyDept = author && author.department === currentUser.department;
                const isMyGroup = p.groupId && (currentUser.followingGroups || []).includes(p.groupId);
                const isPublic = !p.groupId; // Assume non-group posts are public
                return isMyDept || isMyGroup || isPublic;
            });
            return filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
        }
        
        return filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
    }, [posts, activeFilter, currentUser, users]);

    return (
        <div className="min-h-screen bg-background relative isolate transition-colors duration-300">
            {/* Beautiful Background Mesh - Enhanced for Light Mode */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                {/* Light Mode: Richer Gradients */}
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-400/20 dark:bg-indigo-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-400/20 dark:bg-fuchsia-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-pulse animation-delay-2000"></div>
                <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] rounded-full bg-pink-300/20 dark:bg-sky-900/20 blur-[100px] mix-blend-multiply dark:mix-blend-normal opacity-70"></div>
            </div>

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

            <main className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-8" ref={mainContentRef}>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-24 transition-all duration-300 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
                       <LeftSidebar currentUser={currentUser} onNavigate={onNavigate} />
                    </aside>

                    {/* Center Main Feed Column */}
                    <div className="lg:col-span-6 w-full max-w-[680px] mx-auto space-y-5 px-4 sm:px-0">
                        
                        {/* Stories - Top of Feed */}
                        <StoriesReel
                            stories={stories}
                            users={users}
                            groups={groups}
                            currentUser={currentUser}
                            onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                            onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                        />
                        
                        {/* Create Post Box */}
                        {canPost && (
                            <InlineCreatePost user={currentUser} onOpenCreateModal={setCreateModalType} />
                        )}

                        {/* Sort Divider */}
                        <div className="flex items-center justify-between px-1 pt-2 pb-1">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent mr-4 opacity-50"></div>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => {
                                const nextFilter = activeFilter === 'For You' ? 'Latest' : activeFilter === 'Latest' ? 'Groups' : 'For You';
                                setActiveFilter(nextFilter);
                            }}>
                                Sort by: <span className="text-foreground">{activeFilter}</span>
                                <ChevronDownIcon className="w-3 h-3" />
                            </span>
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
                            notices={notices}
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
