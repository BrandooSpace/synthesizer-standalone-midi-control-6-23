
import React from 'react';

interface HelpDisplayBoxProps {
  helpText: string;
}

export const HelpDisplayBox: React.FC<HelpDisplayBoxProps> = ({ helpText }) => {
  return (
    <div
      id="help-display-box"
      className="fixed bottom-0 left-0 right-0 h-10 bg-gray-800 text-gray-300 flex items-center px-4 py-2 z-20 border-t border-gray-700"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs truncate">{helpText}</p>
    </div>
  );
};
