
import React from 'react';

interface GlobalClipIndicatorUIProps {
  isActive: boolean;
  className?: string;
}

export const GlobalClipIndicatorUI: React.FC<GlobalClipIndicatorUIProps> = ({ isActive, className }) => {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 border-gray-600 transition-all duration-150 ease-in-out ${
        isActive ? 'bg-red-600 shadow-[0_0_10px_3px_rgba(220,38,38,0.7)] animate-pulse' : 'bg-gray-700'
      } ${className || ''}`}
      title={isActive ? "GLOBAL CLIP DETECTED!" : "System Nominal"}
      aria-live="polite"
      aria-atomic="true"
    >
      {isActive && <span className="sr-only">Global audio clip detected!</span>}
    </div>
  );
};
