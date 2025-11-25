
import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  // FIX: Add optional onClick prop to allow the avatar to be clickable.
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '', onClick }) => {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold ${sizeClass} ${className}`}
      title={name}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;