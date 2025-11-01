import React, { useState, useEffect, useMemo } from 'react';
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
import { SlidersIcon } from '../components/Icons';


interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  stories: Story[];
  groups: Group[];
  events: Post[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; }; }) => void;
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
  currentPath: string;
}

const defaultFeedPreferences: FeedPreferences = {
    showRegularPosts: true,
    showEvents: true,
    showOpportunities: true,
    showSharedPosts: true,
};

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, currentPath } = props;
    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [feedPreferences, setFeedPreferences] = useState<FeedPreferences>(defaultFeedPreferences);

    useEffect(() => {
        const savedPrefs = localStorage.getItem('feedPreferences');
        if (savedPrefs) {
            setFeedPreferences(JSON.parse(savedPrefs));
        }
    }, []);

    const handleSavePreferences = (newPrefs: FeedPreferences) => {
        setFeedPreferences(newPrefs);
        localStorage.setItem('feedPreferences', JSON.stringify(newPrefs));
        setIsCustomizeModalOpen(false);
    };

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const feedPosts = useMemo(() => {
        return posts.filter(post => {
            // Filter out posts from groups the user doesn't follow
            if (post.groupId && !(currentUser.followingGroups && currentUser.followingGroups.includes(post.groupId))) {
                return false;
            }
            // Filter out confessions from the main feed
            if (post.isConfession) {
                return false;
            }

            // Apply user's feed preferences
            const isRegular = !post.isEvent && !post.isOpportunity && !post.sharedPost;
            if (!feedPreferences.showRegularPosts && isRegular) return false;
            if (!feedPreferences.showEvents && post.isEvent) return false;
            if (!feedPreferences.showOpportunities && post.isOpportunity) return false;
            if (!feedPreferences.showSharedPosts && post.sharedPost) return false;

            return true;
        });
    }, [posts, currentUser.followingGroups, feedPreferences]);

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
                        <StoriesReel
                            stories={stories}
                            users={users}
                            groups={groups}
                            currentUser={currentUser}
                            onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                            onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                        />
                        
                        <InlineCreatePost user={currentUser} onOpenCreateModal={setCreateModalType} />

                        <div className="flex justify-end items-center mb-4 px-2">
                            <button 
                                onClick={() => setIsCustomizeModalOpen(true)}
                                className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                            >
                                <SlidersIcon className="w-4 h-4" />
                                Filter Feed
                            </button>
                        </div>

                        <Feed 
                            posts={feedPosts}
                            users={users}
                            currentUser={currentUser}
                            onReaction={onReaction}
                            onAddComment={onAddComment}
                            onDeletePost={onDeletePost}
                            onCreateOrOpenConversation={onCreateOrOpenConversation}
                            onSharePostAsMessage={onSharePostAsMessage}
                            onSharePost={onSharePost}
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

            <FeedCustomizationModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                currentPreferences={feedPreferences}
                onSave={handleSavePreferences}
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
        </div>
    );
};

export default HomePage;
