
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'toggle';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyle = "p-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400";
  
  let variantStyle = "";
  switch (variant) {
    case 'primary':
      variantStyle = "bg-green-500 text-black hover:bg-green-600 effect-btn";
      break;
    case 'secondary':
      variantStyle = "bg-gray-600 text-gray-100 hover:bg-gray-500 effect-btn";
      break;
    case 'toggle':
        variantStyle = "bg-gray-700 bg-opacity-50 border border-gray-600 backdrop-filter backdrop-blur-sm text-gray-300 hover:text-white hover:bg-gray-600";
        break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};