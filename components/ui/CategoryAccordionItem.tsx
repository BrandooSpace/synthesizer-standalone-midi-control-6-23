
import React from 'react';

interface CategoryAccordionItemProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CategoryAccordionItem: React.FC<CategoryAccordionItemProps> = ({
  id,
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="category-accordion-item border-b border-gray-700 last:border-b-0">
      <div
        id={`category-accordion-header-${id}`}
        className={`category-accordion-item-header flex justify-between items-center py-2 px-1 cursor-pointer hover:bg-gray-800 transition-colors duration-150 ${isOpen ? 'bg-gray-800' : ''}`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`category-accordion-content-${id}`}
      >
        <span className={`font-orbitron text-xs font-semibold uppercase ${isOpen ? 'text-green-400' : 'text-gray-400'}`}>{title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-400' : 'rotate-0 text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {isOpen && (
        <div
          id={`category-accordion-content-${id}`}
          role="region"
          aria-labelledby={`category-accordion-header-${id}`}
          className="category-accordion-content" 
        >
          {children}
        </div>
      )}
    </div>
  );
};
