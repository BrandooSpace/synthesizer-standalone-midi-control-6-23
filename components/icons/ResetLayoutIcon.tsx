
import React from 'react';

export const ResetLayoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 4v5h-5M4 20v-5h5M20 20v-5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l-5-5m11 11l5 5M9 15l-5 5m11-11l5-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l2 2" /> {/* Implies resetting to arrangement */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0115.464-6.41M21 12a9 9 0 01-15.464 6.41" opacity="0.6"/> {/* Circular arrow for reset */}
  </svg>
);
