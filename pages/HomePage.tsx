import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, Post, Group, ReactionType, Story, FeedPreferences } from '../types';
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
import FeedCustomizationModal from '../components/FeedCustomizationModal';
import { auth } from '../firebase';
import { FilterIcon, SparkleIcon, CloseIcon } from '../components/Icons';


interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  stories: Story[];
  groups: Group[];
  events: Post[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; link?: string; }; }) => void;
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
    const { currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, currentPath } = props;
    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] = useState(false);
    
    const [feedPreferences, setFeedPreferences] = useState<FeedPreferences>({
        showRegularPosts: true,
        showEvents: true,
        showOpportunities: true,
        showSharedPosts: true,
    });
    
    useEffect(() => {
        try {
            const savedPrefs = localStorage.getItem('feedPreferences');
            if (savedPrefs) {
                setFeedPreferences(JSON.parse(savedPrefs));
            }
        } catch (e) {
            console.error("Could not load feed preferences:", e);
        }

        const bannerDismissed = sessionStorage.getItem('welcomeBannerDismissed');
        if (!bannerDismissed) {
            setIsWelcomeBannerVisible(true);
        }
    }, []);

    const handleDismissBanner = () => {
        sessionStorage.setItem('welcomeBannerDismissed', 'true');
        setIsWelcomeBannerVisible(false);
    };

    const handleSavePreferences = (preferences: FeedPreferences) => {
        setFeedPreferences(preferences);
        try {
            localStorage.setItem('feedPreferences', JSON.stringify(preferences));
        } catch (e) {
            console.error("Could not save feed preferences:", e);
        }
        setIsFeedModalOpen(false);
    };


    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    // --- START: Stable Feed Logic ---
    const [feedToRender, setFeedToRender] = useState<Post[]>([]);
    const prevFeedPreferencesRef = useRef<string>(JSON.stringify(feedPreferences));
    const prevPostsCountRef = useRef<number>(posts.length);

    const getPostScore = useCallback((post: Post): number => {
        const now = Date.now();
        const oneHour = 1000 * 60 * 60;
        let score = 0;
        const ageInHours = (now - post.timestamp) / oneHour;
        score += 10 / (ageInHours + 1);
        const author = users[post.authorId];
        if (author && author.department === currentUser.department && author.id !== currentUser.id) {
            score += 5;
        }
        if (post.groupId) {
            const group = groups.find(g => g.id === post.groupId);
            if (group && group.memberIds.includes(currentUser.id)) {
                score += 8;
            }
        }
        const userInterests = currentUser.interests || [];
        if (userInterests.length > 0) {
            const postText = [post.content, post.eventDetails?.title, post.opportunityDetails?.title, post.sharedPost?.originalContent].join(' ').toLowerCase();
            for (const interest of userInterests) {
                if (postText.includes(interest.toLowerCase())) {
                    score += 3;
                }
            }
        }
        return score;
    }, [users, currentUser, groups]);

    const filterPost = useCallback((post: Post, prefs: FeedPreferences): boolean => {
        const isRegularPost = !post.isEvent && !post.isOpportunity && !post.sharedPost;
        if (!prefs.showRegularPosts && isRegularPost) return false;
        if (!prefs.showEvents && post.isEvent) return false;
        if (!prefs.showOpportunities && post.isOpportunity) return false;
        if (!prefs.showSharedPosts && post.sharedPost) return false;
        if (post.groupId && !(currentUser.followingGroups && currentUser.followingGroups.includes(post.groupId))) {
            return false;
        }
        if (post.isConfession) {
            return false;
        }
        return true;
    }, [currentUser]);

    useEffect(() => {
        const currentPrefsString = JSON.stringify(feedPreferences);
        const feedPreferencesChanged = prevFeedPreferencesRef.current !== currentPrefsString;
        const hasNewPosts = posts.length > prevPostsCountRef.current;

        if (feedToRender.length === 0 || feedPreferencesChanged) {
            const sorted = posts
                .filter(p => filterPost(p, feedPreferences))
                .map(post => ({ post, score: getPostScore(post) }))
                .sort((a, b) => b.score - a.score)
                .map(item => item.post);
            setFeedToRender(sorted);
        } else {
            const newPostsMap = new Map(posts.map(p => [p.id, p]));
            const currentFeedIds = new Set(feedToRender.map(p => p.id));

            let updatedFeed = feedToRender
                .map(oldPost => newPostsMap.get(oldPost.id))
                .filter((p): p is Post => !!p);

            if (hasNewPosts) {
                const newUnseenPosts = posts.filter(p => !currentFeedIds.has(p) && filterPost(p, feedPreferences));
                if (newUnseenPosts.length > 0) {
                    updatedFeed = [...newUnseenPosts, ...updatedFeed];
                }
            }
            
            setFeedToRender(updatedFeed);
        }

        prevFeedPreferencesRef.current = currentPrefsString;
        prevPostsCountRef.current = posts.length;

    }, [posts, feedPreferences, getPostScore, filterPost, feedToRender.length]);
    // --- END: Stable Feed Logic ---

    const adminOfGroups = groups.filter(g => g.creatorId === currentUser.id);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onNavigate={onNavigate} 
                currentPath={currentPath}
                onOpenCreateModal={() => setCreateModalType('post')}
            />

            <main className="container mx-auto pt-8 pb-20 md:pb-4">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3">
                       <LeftSidebar currentUser={currentUser} onNavigate={onNavigate} />
                    </aside>

                    {/* Main Content Feed */}
                    <div className="lg:col-span-6">
                        {isWelcomeBannerVisible && (
                            <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-2xl shadow-lg mb-6 animate-fade-in flex items-center justify-between">
                                <div className="flex items-center">
                                    <SparkleIcon className="w-10 h-10 mr-4 flex-shrink-0" />
                                    <div>
                                        <h2 className="text-xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
                                        <p className="text-sm opacity-90 mt-1">Ready to connect and discover what's new on campus?</p>
                                    </div>
                                </div>
                                <button onClick={handleDismissBanner} className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <StoriesReel
                            stories={stories}
                            users={users}
                            groups={groups}
                            currentUser={currentUser}
                            onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                            onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                        />
                        
                        <InlineCreatePost user={currentUser} onOpenCreateModal={setCreateModalType} />

                        <div className="flex justify-between items-center mb-4 px-1">
                             <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">For You</h2>
                             <button onClick={() => setIsFeedModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors">
                                <FilterIcon className="w-4 h-4" />
                                Customize
                             </button>
                        </div>


                        <Feed 
                            posts={feedToRender}
                            users={users}
                            currentUser={currentUser}
                            onReaction={onReaction}
                            onAddComment={onAddComment}
                            onDeletePost={onDeletePost}
                            onCreateOrOpenConversation={onCreateOrOpenConversation}
                            onSharePostAsMessage={onSharePostAsMessage}
                            onSharePost={onSharePost}
                            onToggleSavePost={onToggleSavePost}
                            groups={groups}
                            onNavigate={onNavigate}
                        />
                    </div>
                    
                    {/* Right Sidebar */}
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

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>

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
                    adminOfGroups={adminOfGroups}
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

            <FeedCustomizationModal
                isOpen={isFeedModalOpen}
                onClose={() => setIsFeedModalOpen(false)}
                onSave={handleSavePreferences}
                currentPreferences={feedPreferences}
            />
        </div>
    );
};

export default HomePage;
