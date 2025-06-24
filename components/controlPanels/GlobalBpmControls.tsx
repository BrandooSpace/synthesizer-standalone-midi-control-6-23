
import React from 'react';
import { Slider } from '../ui/Slider';

interface GlobalBpmControlsProps {
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void;
  paramIdToLearn?: string | null;
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const GlobalBpmControls: React.FC<GlobalBpmControlsProps> = React.memo(({
  bpm,
  onBpmChange,
  onRequestLearn,
  paramIdToLearn,
  modulatedParamIds,
  onSetHelpText,
  onClearHelpText,
  globalMidiLearnActive
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase text-center">Global Tempo</h3>
      <Slider
        id="globalBpm"
        label="BPM"
        min={20}
        max={300}
        step={0.1}
        value={bpm}
        onChange={(e) => onBpmChange(parseFloat(e.target.value))}
        paramId="global.bpm" 
        onRequestLearn={onRequestLearn}
        isLearning={paramIdToLearn === "global.bpm"}
        tooltip="Global Beats Per Minute. Affects tempo-synced LFOs and potentially other future tempo-based effects."
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive}
      />
    </div>
  );
});
