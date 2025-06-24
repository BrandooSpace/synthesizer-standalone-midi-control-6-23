
import React from 'react';

interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  tooltip?: string;
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
}

export const Switch: React.FC<SwitchProps> = React.memo(({ 
  id, label, checked, onChange, className, tooltip,
  onSetHelpText, onClearHelpText
}) => {
  const helpText = tooltip || `${label}: No description available.`;
  return (
    <div 
      className={`flex items-center justify-between ${className || ''}`}
      onMouseEnter={() => onSetHelpText && onSetHelpText(helpText)}
      onMouseLeave={() => onClearHelpText && onClearHelpText()}
    >
      <label htmlFor={id} className="control-label text-sm font-semibold text-gray-300">
        {label}
      </label>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-green-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
      </label>
    </div>
  );
});
