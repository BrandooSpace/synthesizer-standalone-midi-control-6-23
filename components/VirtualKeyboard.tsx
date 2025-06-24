
import React, { useCallback } from 'react';
import { KEY_MAP, OCTAVE_RANGE } from '../constants';
import { NoteDetails } from '../types';
import { Button } from './ui/Button';
import { OctaveUpIcon } from './icons/OctaveUpIcon';
import { OctaveDownIcon } from './icons/OctaveDownIcon';

interface VirtualKeyboardProps {
  octave: number;
  onOctaveChange: (newOctave: number) => void;
  onNoteOn: (noteKey: string, frequency: number) => void;
  onNoteOff: (noteKey: string) => void;
  activeNotes: Set<string>;
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
}

const orderedKeys = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k'];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = React.memo(({
  octave,
  onOctaveChange,
  onNoteOn,
  onNoteOff,
  activeNotes,
  onSetHelpText,
  onClearHelpText
}) => {
  const handleOctaveUp = useCallback(() => onOctaveChange(Math.min(OCTAVE_RANGE[1], octave + 1)), [octave, onOctaveChange]);
  const handleOctaveDown = useCallback(() => onOctaveChange(Math.max(OCTAVE_RANGE[0], octave - 1)), [octave, onOctaveChange]);

  const getFrequency = useCallback((baseFreq: number, currentOctave: number): number => {
    return baseFreq * Math.pow(2, currentOctave);
  }, []);

  const mainDivHelpText = "Virtual Keyboard: Play notes using your mouse or QWERTY keyboard. 'Z' and 'X' change octaves.";
  const octaveUpHelpText = "Octave Up: Increases the pitch of the keyboard by one octave.";
  const octaveDownHelpText = "Octave Down: Decreases the pitch of the keyboard by one octave.";
  const octaveDisplayHelpText = `Current Octave: ${octave}. Range is ${OCTAVE_RANGE[0]} to ${OCTAVE_RANGE[1]}.`;


  return (
    <div
      id="keyboard-area-wrapper" 
      className="flex items-center gap-4 p-3 bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-md rounded-lg shadow-xl"
      onMouseEnter={() => onSetHelpText && onSetHelpText(mainDivHelpText)}
      onMouseLeave={() => onClearHelpText && onClearHelpText()}
    >
      <div id="virtual-keyboard" className="flex flex-row h-36">
        {orderedKeys.map(keyChar => {
          const note = KEY_MAP[keyChar];
          if (!note) return null;
          const isActive = activeNotes.has(note.key);
          const noteName = note.key.toUpperCase(); 
          const keyHelpText = `Play Note ${noteName} (Keyboard key: ${note.key})`;
          
          let keyClasses = "key relative transition-colors duration-75 ease-in-out border-2 border-gray-800 rounded-md cursor-pointer flex items-end justify-center pb-1";
          if (note.type === 'white') {
            keyClasses += ` w-12 h-full ${isActive ? 'bg-green-400 border-green-300' : 'bg-gray-100 hover:bg-gray-300'} text-gray-800`;
          } else {
            keyClasses += ` w-8 h-2/3 ${isActive ? 'bg-green-500 border-green-400' : 'bg-gray-900 hover:bg-gray-700'} text-gray-100 ml-[-0.75rem] mr-[-0.75rem] z-10`;
          }

          return (
            <div
              key={note.key}
              data-key={note.key}
              className={keyClasses}
              onMouseDown={() => onNoteOn(note.key, getFrequency(note.freq, octave))}
              onMouseUp={() => onNoteOff(note.key)}
              onMouseLeave={() => { if(isActive) onNoteOff(note.key); if (onClearHelpText) onClearHelpText(); }} 
              onMouseEnter={() => onSetHelpText && onSetHelpText(keyHelpText)}
            >
              <span className="key-label text-xs font-bold pointer-events-none select-none">{noteName}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button 
          variant="toggle" 
          onClick={handleOctaveUp} 
          className="p-2"
          onMouseEnter={() => onSetHelpText && onSetHelpText(octaveUpHelpText)}
          onMouseLeave={() => onClearHelpText && onClearHelpText()}
          aria-label="Octave Up"
        >
          <OctaveUpIcon />
        </Button>
        <span 
          className="font-orbitron text-lg font-bold text-green-400 w-8 text-center select-none"
          onMouseEnter={() => onSetHelpText && onSetHelpText(octaveDisplayHelpText)}
          onMouseLeave={() => onClearHelpText && onClearHelpText()}
        >
          {octave}
        </span>
        <Button 
          variant="toggle" 
          onClick={handleOctaveDown} 
          className="p-2"
          onMouseEnter={() => onSetHelpText && onSetHelpText(octaveDownHelpText)}
          onMouseLeave={() => onClearHelpText && onClearHelpText()}
          aria-label="Octave Down"
        >
          <OctaveDownIcon />
        </Button>
      </div>
    </div>
  );
});
