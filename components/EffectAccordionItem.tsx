
import React from 'react';

interface EffectAccordionItemProps {
  id: string;
  title: string;
  isOpen: boolean; // This will be derived from activeEffectIds.has(id) in RightEffectsSidebar
  onToggle: () => void;
  children: React.ReactNode;
}

export const EffectAccordionItem: React.FC<EffectAccordionItemProps> = ({
  id,
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="effect-accordion-item border border-gray-700 rounded-md overflow-hidden">
      <div
        id={`accordion-header-${id}`}
        className={`effect-accordion-item-header flex justify-between items-center ${isOpen ? 'expanded' : ''}`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
      >
        <span className="font-orbitron text-sm font-semibold">{title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {isOpen && (
        <div
          id={`accordion-content-${id}`}
          role="region"
          aria-labelledby={`accordion-header-${id}`}
          className="effect-accordion-content custom-scrollbar" 
        >
          {children}
        </div>
      )}
    </div>
  );
};