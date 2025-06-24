
import React from 'react';
import { MidiMappings, MidiMappingEntry } from '../../types';
import { Button } from '../ui/Button';

interface MidiMappingControlsProps {
  mappings: MidiMappings;
  onDeleteMapping: (cc: number) => void;
}

// Helper to make paramId more readable (can be expanded)
const formatParamId = (paramId: string): string => {
  return paramId
    .replace(/\./g, ' ') // Replace dots with spaces
    .replace(/\[(\d+)\]/g, ' $1') // Space before array indices
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const MidiMappingControls: React.FC<MidiMappingControlsProps> = React.memo(({ mappings, onDeleteMapping }) => {
  const mappingEntries = Object.values(mappings);

  return (
    <div className="space-y-3 text-gray-300">
      <h3 className="text-sm font-semibold text-gray-400 uppercase text-center mb-2">
        Active MIDI CC Mappings
      </h3>
      {mappingEntries.length === 0 ? (
        <p className="text-xs text-gray-500 text-center italic">No MIDI CCs learned yet.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
          {mappingEntries.map((mapping) => (
            <div 
              key={mapping.cc} 
              className="p-2.5 bg-gray-700 bg-opacity-60 rounded-md border border-gray-600 shadow-sm"
              role="listitem"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    CC {mapping.cc} &rarr; {formatParamId(mapping.paramId)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Range: {mapping.min.toFixed(2)} to {mapping.max.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onDeleteMapping(mapping.cc)}
                  className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 text-white"
                  aria-label={`Delete mapping for CC ${mapping.cc}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
