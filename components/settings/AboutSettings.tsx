import React from 'react';
import { Button } from '../ui/Button';

export const AboutSettings: React.FC = () => {
  return (
    <div className="space-y-6 text-gray-300">
      <div>
        <h3 className="font-orbitron text-lg text-green-400 mb-1">Web X-Y Synthesizer</h3>
        <p className="text-sm text-gray-400">Version 0.1.0-alpha</p>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-200 mb-1">Description</h4>
        <p className="text-sm text-gray-400">
          An interactive X-Y oscilloscope synthesizer built with React, TypeScript, and the Web Audio API. 
          Explore unique soundscapes through visual synthesis.
        </p>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-200 mb-1">Credits</h4>
        <p className="text-sm text-gray-400">
          Key technologies: React, TypeScript, Tailwind CSS, Web Audio API.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Inspired by classic and modern synthesizers and the vibrant open-source community.
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-700">
        <Button variant="secondary" disabled className="w-full opacity-50 cursor-not-allowed">
          View Documentation (Coming Soon)
        </Button>
        <Button variant="secondary" disabled className="w-full opacity-50 cursor-not-allowed">
          Report an Issue / Feedback (Coming Soon)
        </Button>
      </div>
    </div>
  );
};