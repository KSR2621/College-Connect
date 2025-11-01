import React, { useState } from 'react';
import type { User, Post, Achievement, UserTag } from '../types';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Feed from '../components/Feed';
import AchievementCard from '../components/AchievementCard';
import CreatePost from '../components/CreatePost';
import AddAchievementModal from '../components/AddAchievementModal';
import EditProfileModal from '../components/EditProfileModal';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { AwardIcon, SendIcon } from '../components/Icons';

interface ProfilePageProps {
  profileUserId: string;
  currentUser: User;
  users: { [key: string]: User };
  posts: Post[];
  onNavigate: (path: string) => void;
  currentPath: string;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onAddPost: (postDetails: { content: string; mediaFile?: File | null; mediaType?: 'image' | 'video' | null; }) => void;
  onAddAchievement: (achievement: Achievement) => void;
  onAddInterest: (interest: string) => void;
  onUpdateProfile: (updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number; }, avatarFile?: File | null) => void;
  onCreateOrOpenConversation: (otherUserId: string) => Promise<string>;
  onSharePostAsMessage: (conversationId: string, authorName: string, postContent: string) => void;
}

const getYearOfStudyText = (year?: number) => {
    if (!year) return '';
    switch (year) {
        case 1: return '1st Year';
        case 2: return '2nd Year';
        case 3: return '3rd Year';
        case 4: return '4th Year';
        case 5: return 'Graduate';
        default: return `${year}th Year`;
    }
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  const { profileUserId, currentUser, users, posts, onNavigate, currentPath, onToggleLike, onAddComment, onDeletePost, onAddPost, onAddAchievement, onAddInterest, onUpdateProfile, onCreateOrOpenConversation, onSharePostAsMessage } = props;
  const [activeTab, setActiveTab] = useState<'posts' | 'achievements' | 'interests'>('posts');
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  const user = users[profileUserId];
  const isCurrentUserProfile = currentUser.id === profileUserId;

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate('#/');
  };

  const handleAddInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newInterest.trim()) {
        onAddInterest(newInterest.trim());
        setNewInterest('');
    }
  }

  if (!user) {
    return (
      <div className="bg-background min-h-screen">
        <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
        <main className="container mx-auto px-4 pt-8">
            <p className="text-center text-foreground">User not found.</p>
        </main>
      </div>
    );
  }
  
  const userPosts = posts.filter(p => p.authorId === user.id && !p.groupId && !p.isConfession);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'achievements':
        return (
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center"><AwardIcon className="w-5 h-5 mr-2"/> Achievements</h2>
                {isCurrentUserProfile && (
                    <button onClick={() => setIsAchievementModalOpen(true)} className="bg-primary text-primary-foreground font-semibold py-1 px-3 rounded-full text-sm hover:bg-primary/90">Add New</button>
                )}
            </div>
            <div className="space-y-4">
              {user.achievements && user.achievements.length > 0 ? (
                user.achievements.map((ach, index) => <AchievementCard key={index} achievement={ach} />)
              ) : (
                <p className="text-center text-text-muted py-8">No achievements listed yet.</p>
              )}
            </div>
          </div>
        );
      case 'interests':
        return (
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Interests</h2>
             {isCurrentUserProfile && (
                <form onSubmit={handleAddInterestSubmit} className="flex items-center space-x-2 mb-4">
                    <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Add an interest (e.g., Hiking)" className="flex-1 bg-input border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm" />
                    <button type="submit" className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={!newInterest.trim()}>
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
             )}
            <div className="flex flex-wrap gap-3">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <span key={index} className="bg-secondary/10 text-secondary text-sm font-medium px-4 py-2 rounded-full">{interest}</span>
                ))
              ) : (
                <p className="text-center text-text-muted py-8 w-full">No interests listed yet.</p>
              )}
            </div>
          </div>
        );
      case 'posts':
      default:
        return (
            <div>
                {isCurrentUserProfile && <CreatePost user={currentUser} onAddPost={onAddPost} />}
                <Feed 
                    posts={userPosts}
                    users={users}
                    currentUser={currentUser}
                    onToggleLike={onToggleLike}
                    onAddComment={onAddComment}
                    onDeletePost={onDeletePost}
                    onCreateOrOpenConversation={onCreateOrOpenConversation}
                    onSharePostAsMessage={onSharePostAsMessage}
                />
            </div>
        );
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-8 pt-8 pb-20 md:pb-4">
        {/* Profile Header */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar src={user.avatarUrl} name={user.name} size="xl" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
              <p className="text-md text-text-muted">
                {user.tag}
                {user.tag === 'Student' && user.yearOfStudy && ` - ${getYearOfStudyText(user.yearOfStudy)}`}
                {' - '}
                {user.department}
              </p>
              {user.bio && <p className="mt-2 text-card-foreground">{user.bio}</p>}
            </div>
            {isCurrentUserProfile && (
              <button onClick={() => setIsEditModalOpen(true)} className="bg-primary/10 border border-primary text-primary font-semibold py-2 px-4 rounded-full text-sm hover:bg-primary/20">
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="mb-6">
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`transition-colors duration-200 ${
                        activeTab === 'posts'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`transition-colors duration-200 ${
                        activeTab === 'achievements'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Achievements
                    </button>
                    <button
                        onClick={() => setActiveTab('interests')}
                        className={`transition-colors duration-200 ${
                        activeTab === 'interests'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Interests
                    </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {renderTabContent()}
            </div>
        </div>
      </main>
      
      <AddAchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
        onAddAchievement={onAddAchievement}
      />

      {isCurrentUserProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
        />
      )}
      
      <BottomNavBar onNavigate={onNavigate} currentPage={currentPath}/>
    </div>
  );
};

export default ProfilePage;
