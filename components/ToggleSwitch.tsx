
import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
  return (
    <div className="flex items-center">
      <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          id={id} 
          className="sr-only peer" 
          checked={checked} 
          onChange={onChange}
        />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-primary transition-colors duration-200 ease-in-out"></div>
      </label>
      {label && <span className="ml-3 text-sm font-medium text-foreground">{label}</span>}
    </div>
  );
};

export default ToggleSwitch;
