import React, { useState, useEffect } from 'react';
import type { User, UserTag } from '../types';
import Avatar from './Avatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (
      updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number; }, 
      avatarFile?: File | null
  ) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateProfile }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [tag, setTag] = useState<UserTag>('Student');
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setDepartment(currentUser.department);
      setTag(currentUser.tag);
      setYearOfStudy(currentUser.yearOfStudy || 1);
      setAvatarPreview(currentUser.avatarUrl || null);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ 
      name, 
      bio, 
      department, 
      tag,
      yearOfStudy: tag === 'Student' ? yearOfStudy : undefined
    }, avatarFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar src={avatarPreview || undefined} name={name} size="xl" />
            <label className="block">
                <span className="sr-only">Choose profile photo</span>
                <input type="file" onChange={handleAvatarChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Department</label>
            <input type="text" value={department} onChange={e => setDepartment(e.target.value)} required className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">I am a...</label>
            <select value={tag} onChange={e => setTag(e.target.value as UserTag)} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Student</option>
              <option>Faculty</option>
              <option>Alumni</option>
            </select>
          </div>

          {tag === 'Student' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Year of Study</label>
              <select value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className="w-full px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>Graduate</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>
            <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
