import React, { useState, useEffect, useMemo } from 'react';
import type { User, Post, Group, ReactionType, Story } from '../types';
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
  onToggleSavePost: (postId: string) => void;
  currentPath: string;
}

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, onToggleSavePost, currentPath } = props;
    const [createModalType, setCreateModalType] = useState<'post' | 'event' | null>(null);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    const feedPosts = useMemo(() => {
        const now = Date.now();
        const oneHour = 1000 * 60 * 60;

        const getPostScore = (post: Post): number => {
            let score = 0;

            // 1. Recency Score (higher score for newer posts, decays over time)
            const ageInHours = (now - post.timestamp) / oneHour;
            score += 10 / (ageInHours + 1); // Heavily favors posts in the first few hours

            // 2. Engagement Score
            const reactionCount = Object.values(post.reactions || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
            const commentCount = post.comments.length;
            score += (reactionCount * 0.5) + (commentCount * 1.0);

            // 3. Author Relevance (if not current user)
            const author = users[post.authorId];
            if (author && author.department === currentUser.department && author.id !== currentUser.id) {
                score += 5;
            }

            // 4. Group Relevance (big boost for membership)
            if (post.groupId) {
                const group = groups.find(g => g.id === post.groupId);
                if (group && group.memberIds.includes(currentUser.id)) {
                    score += 8;
                }
            }

            // 5. Interest Match
            const userInterests = currentUser.interests || [];
            if (userInterests.length > 0) {
                const postText = [
                    post.content,
                    post.eventDetails?.title,
                    post.opportunityDetails?.title,
                    post.sharedPost?.originalContent
                ].join(' ').toLowerCase();
                
                for (const interest of userInterests) {
                    if (postText.includes(interest.toLowerCase())) {
                        score += 3;
                    }
                }
            }

            // 6. Deprioritize posts the user has already interacted with
            const hasReacted = Object.values(post.reactions || {}).some(arr => arr?.includes(currentUser.id));
            const hasCommented = post.comments.some(c => c.authorId === currentUser.id);
            if (hasReacted || hasCommented) {
                score *= 0.2;
            }

            return score;
        };
        
        return posts
            .filter(post => {
                // Filter out posts from groups the user doesn't follow
                if (post.groupId && !(currentUser.followingGroups && currentUser.followingGroups.includes(post.groupId))) {
                    return false;
                }
                // Filter out confessions from the main feed
                if (post.isConfession) {
                    return false;
                }
                return true;
            })
            .map(post => ({ post, score: getPostScore(post) }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.post);
    }, [posts, currentUser, users, groups]);

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
        </div>
    );
};

export default HomePage;