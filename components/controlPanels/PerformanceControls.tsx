
import React from 'react';
import { Slider } from '../ui/Slider';
import { MAX_POLYPHONY } from '../../constants';

interface PerformanceControlsProps {
  userMaxPolyphony: number;
  onUserMaxPolyphonyChange: (newLimit: number) => void;
  activeVoiceCount: number;
  voiceStealIndicatorActive: boolean;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const PerformanceControls: React.FC<PerformanceControlsProps> = React.memo(({
  userMaxPolyphony,
  onUserMaxPolyphonyChange,
  activeVoiceCount,
  voiceStealIndicatorActive,
  onRequestLearn,
  paramIdToLearn,
  modulatedParamIds,
  onSetHelpText,
  onClearHelpText,
  globalMidiLearnActive
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase text-center">Performance Settings</h3>
      
      <Slider
        id="userMaxPolyphony"
        label="MAX POLYPHONY"
        min={1}
        max={MAX_POLYPHONY} 
        step={1}
        value={userMaxPolyphony}
        onChange={(e) => onUserMaxPolyphonyChange(parseInt(e.target.value, 10))}
        paramId="performance.userMaxPolyphony"
        onRequestLearn={onRequestLearn}
        isLearning={paramIdToLearn === "performance.userMaxPolyphony"}
        tooltip={`Maximum number of simultaneous notes (voices) the synth can play. System hard limit is ${MAX_POLYPHONY}.`}
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive}
      />

      <div 
        className="flex justify-between items-center p-2 bg-gray-700 rounded-md"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Displays the current number of active voices out of the user-set maximum polyphony.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        <span className="text-sm text-gray-300">Active Voices:</span>
        <span className="text-lg font-orbitron text-green-400">{activeVoiceCount} / {userMaxPolyphony}</span>
      </div>

      <div 
        className="flex items-center space-x-2 p-2"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Indicates if voice stealing (cutting off oldest notes to play new ones) has recently occurred.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        <span className="text-sm text-gray-300">Voice Steal Indicator:</span>
        <div
          className={`w-4 h-4 rounded-full transition-all duration-150 ease-in-out border-2 border-gray-500 ${
            voiceStealIndicatorActive ? 'bg-yellow-400 shadow-[0_0_8px_2px_rgba(250,204,21,0.7)]' : 'bg-gray-600'
          }`}
          title={voiceStealIndicatorActive ? "Voice Stealing Occurred!" : "Nominal"}
          aria-live="polite"
        >
          {voiceStealIndicatorActive && <span className="sr-only">Voice stealing occurred</span>}
        </div>
      </div>
       <p 
        className="text-xs text-gray-500 text-center italic"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Note: Actual polyphony may be limited by your system's performance. The synth engine has a hard limit of 18 voices.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
       >
        Note: Actual polyphony may be limited by system performance. The hard limit is {MAX_POLYPHONY}.
      </p>
    </div>
  );
});
