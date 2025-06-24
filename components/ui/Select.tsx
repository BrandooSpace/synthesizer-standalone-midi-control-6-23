
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  id: string;
  label:string;
  options: SelectOption[];
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  tooltip?: string;
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  disabled?: boolean; // Added disabled prop
}

export const Select: React.FC<SelectProps> = React.memo(({ 
  id, label, options, value, onChange, className, tooltip,
  onSetHelpText, onClearHelpText, disabled
}) => {
  const helpText = tooltip || `${label}: No description available.`;
  return (
    <div 
      className={`flex flex-col ${className || ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseEnter={() => !disabled && onSetHelpText && onSetHelpText(helpText)}
      onMouseLeave={() => !disabled && onClearHelpText && onClearHelpText()}
    >
      <label htmlFor={id} className="control-label text-sm text-gray-300 mb-1" title={tooltip}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-10 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-gray-700 text-gray-200">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});
