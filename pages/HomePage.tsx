import React, { useState } from 'react';
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
  currentPath: string;
}

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, stories, groups, events, onNavigate, onAddPost, onAddStory, onMarkStoryAsViewed, onDeleteStory, onReplyToStory, onReaction, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, currentPath } = props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
    const [viewingStoryEntityId, setViewingStoryEntityId] = useState<string | null>(null);
    
    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    // Filter posts for the main feed: show non-group posts OR posts from groups the user follows.
    const feedPosts = posts.filter(post => 
        (!post.groupId || (currentUser.followingGroups && currentUser.followingGroups.includes(post.groupId))) 
        && !post.isConfession
    );

    const adminOfGroups = groups.filter(g => g.creatorId === currentUser.id);

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onNavigate={onNavigate} 
                currentPath={currentPath}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />

            <main className="container mx-auto pt-8 pb-20 md:pb-4">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3">
                       <LeftSidebar currentUser={currentUser} onNavigate={onNavigate} />
                    </aside>

                    {/* Main Content Feed */}
                    <div className="lg:col-span-6">
                        <div className="bg-card sm:rounded-lg border-b border-border sm:border p-4 mb-6">
                            <StoriesReel
                                stories={stories}
                                users={users}
                                groups={groups}
                                currentUser={currentUser}
                                onAddStoryClick={() => setIsStoryCreatorOpen(true)}
                                onViewStoryEntity={(entityId) => setViewingStoryEntityId(entityId)}
                            />
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
                        />
                    </div>
                    
                    {/* Right Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <RightSidebar 
                            groups={groups}
                            events={events}
                            currentUser={currentUser}
                            onNavigate={onNavigate}
                        />
                    </aside>

                 </div>
            </main>

            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath}/>

            <CreatePostModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                user={currentUser}
                onAddPost={onAddPost}
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