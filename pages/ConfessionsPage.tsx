import React from 'react';
import type { User, Post, Group } from '../types';
import Header from '../components/Header';
import CreatePost from '../components/CreatePost';
import Feed from '../components/Feed';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { GhostIcon } from '../components/Icons';

interface ConfessionsPageProps {
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  groups: Group[];
  onNavigate: (path: string) => void;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: "image" | "video" | null; isConfession?: boolean; }) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
  onSharePost: (originalPost: Post, commentary: string, shareTarget: { type: 'feed' | 'group'; id?: string }) => void;
  currentPath: string;
}

const ConfessionsPage: React.FC<ConfessionsPageProps> = (props) => {
    const { currentUser, users, posts, groups, onNavigate, onAddPost, onToggleLike, onAddComment, onDeletePost, onCreateOrOpenConversation, onSharePostAsMessage, onSharePost, currentPath } = props;

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    return (
        <div className="bg-background min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />

            <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <GhostIcon className="w-16 h-16 mx-auto text-secondary"/>
                        <h1 className="text-4xl font-bold text-foreground mt-4">Campus Confessions</h1>
                        <p className="text-lg text-text-muted mt-2">Share your thoughts anonymously. Be respectful.</p>
                    </div>

                    <CreatePost user={currentUser} onAddPost={onAddPost} isConfessionMode={true} />
                    <Feed 
                        posts={posts}
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
            </main>

            <BottomNavBar onNavigate={onNavigate} currentPage={currentPath}/>
        </div>
    );
};

export default ConfessionsPage;