import React from 'react';
import type { User, Post, Group } from '../types';
import Header from '../components/Header';
import CreatePost from '../components/CreatePost';
import Feed from '../components/Feed';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';


interface HomePageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; eventDetails?: { title: string; date: string; location: string; }; }) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  currentPath: string;
}

const HomePage: React.FC<HomePageProps> = (props) => {
    const { currentUser, users, posts, groups, onNavigate, onAddPost, onToggleLike, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, currentPath } = props;

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    // Filter posts for the main feed: show non-group posts OR posts from groups the user follows.
    const feedPosts = posts.filter(post => 
        (!post.groupId || (currentUser.followingGroups && currentUser.followingGroups.includes(post.groupId))) 
        && !post.isConfession
    );

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />

            <main className="container mx-auto px-2 sm:px-4 lg:px-8 grid grid-cols-12 gap-8 pt-8 pb-20 md:pb-4">
                {/* Left Sidebar (optional) */}
                <aside className="hidden lg:block col-span-3">
                    {/* Placeholder for widgets like profile summary, quick links */}
                </aside>
                
                {/* Main Content */}
                <div className="col-span-12 lg:col-span-6">
                    <CreatePost user={currentUser} onAddPost={onAddPost} />
                    <Feed 
                        posts={feedPosts}
                        users={users}
                        currentUser={currentUser}
                        onToggleLike={onToggleLike}
                        onAddComment={onAddComment}
                        onDeletePost={onDeletePost}
                        onCreateOrOpenConversation={onCreateOrOpenConversation}
                        onSharePostAsMessage={onSharePostAsMessage}
                        onSharePost={onSharePost}
                        groups={groups}
                    />
                </div>

                {/* Right Sidebar (optional) */}
                <aside className="hidden lg:block col-span-3">
                    {/* Placeholder for widgets like upcoming events, trending groups */}
                </aside>
            </main>

            <BottomNavBar onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default HomePage;