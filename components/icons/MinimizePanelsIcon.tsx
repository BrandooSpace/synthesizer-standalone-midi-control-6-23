
import React from 'react';

export const MinimizePanelsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
     {/* Representing multiple panels being minimized */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 17l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" opacity="0.6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l-2 2m0 0l-2 2m2-2l2 2m-2-2L15 7" opacity="0.6"/>
  </svg>
);
