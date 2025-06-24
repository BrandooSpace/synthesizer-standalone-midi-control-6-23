
import React from 'react';

export const MidiDisabledIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l7-3v13l-7 3zM9 6h1.5M16 3v3" />
    <circle cx="6.5" cy="18.5" r="1.5" />
    <circle cx="13.5" cy="15.5" r="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h3M5 12h3M5 15h3" />
    {/* Line indicating disabled */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
  </svg>
);