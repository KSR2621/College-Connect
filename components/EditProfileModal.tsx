import React, { useState, useEffect, useRef } from 'react';
import type { User, UserTag } from '../types';
import { CameraIcon, CloseIcon } from './Icons';
// FIX: Import yearOptions to dynamically generate year selection.
import { yearOptions } from '../constants';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (
    updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number },
    avatarFile?: File | null
  ) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateProfile }) => {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [department, setDepartment] = useState(currentUser.department);
  const [tag, setTag] = useState<UserTag>(currentUser.tag);
  const [yearOfStudy, setYearOfStudy] = useState<number>(currentUser.yearOfStudy || 1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When the modal opens, populate the form with the current user's data.
    // This effect should only run when the modal is opened, not on subsequent
    // re-renders of the parent component, which would overwrite user input.
    if (isOpen) {
        setName(currentUser.name);
        setBio(currentUser.bio || '');
        setDepartment(currentUser.department);
        setTag(currentUser.tag);
        setYearOfStudy(currentUser.yearOfStudy || 1);
        setAvatarFile(null);
        setAvatarPreview(currentUser.avatarUrl || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 700 * 1024) {
        alert("Profile picture must be smaller than 700KB.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: { name: string; bio: string; department: string; tag: UserTag; yearOfStudy?: number } = {
      name,
      bio,
      department,
      tag
    };
    if (tag === 'Student') {
      updateData.yearOfStudy = yearOfStudy;
    }
    onUpdateProfile(updateData, avatarFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><CloseIcon className="w-5 h-5 text-text-muted"/></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
            {/* Avatar */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <img
                        src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full border-2 border-card"
                    >
                        <CameraIcon className="w-5 h-5"/>
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Form Fields */}
            <div>
              <label htmlFor="name" className="text-sm font-medium text-text-muted">Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label htmlFor="bio" className="text-sm font-medium text-text-muted">Bio</label>
              <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself" className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>

            <div>
              <label htmlFor="department" className="text-sm font-medium text-text-muted">Department</label>
              <input type="text" id="department" value={department} onChange={e => setDepartment(e.target.value)} required className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label htmlFor="tag" className="text-sm font-medium text-text-muted">Role</label>
              <select id="tag" value={tag} onChange={e => setTag(e.target.value as UserTag)} className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Student</option>
                <option>Faculty</option>
                <option>Alumni</option>
              </select>
            </div>

            {tag === 'Student' && (
              <div>
                <label htmlFor="yearOfStudy" className="text-sm font-medium text-text-muted">Year of Study</label>
                <select id="yearOfStudy" value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className="w-full mt-1 px-4 py-2 text-foreground bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    {yearOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">
                Cancel
            </button>
            <button type="submit" className="px-4 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">
                Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
