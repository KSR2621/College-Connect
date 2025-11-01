import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        id={id} 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
};

export default ToggleSwitch;
