
import React, { useCallback } from 'react';
import { LadderFilterParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface LadderFilterControlsProps {
  params: LadderFilterParams;
  onChange: (newParams: LadderFilterParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const LadderFilterControls: React.FC<LadderFilterControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof LadderFilterParams, value: string | number | boolean) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="ladderFilter-enable-toggle"
        label="Enable Ladder Filter"
        checked={params.isLadderFilterEnabled}
        onChange={(e) => handleChange('isLadderFilterEnabled', e.target.checked)}
        tooltip="Toggles the 'Moog-style' Ladder Filter (Insert) on or off. Known for its warm, resonant character."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isLadderFilterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isLadderFilterEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="ladderFilter-cutoff"
          label="CUTOFF FREQ (Hz)"
          min={20}
          max={20000}
          step={1} 
          value={params.cutoffFrequency}
          onChange={(e) => handleChange('cutoffFrequency', e.target.value)}
          paramId="ladderFilter.cutoffFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ladderFilter.cutoffFrequency"}
          tooltip="Cutoff frequency of the ladder filter. Frequencies above this point are attenuated."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="ladderFilter-resonance"
          label="RESONANCE (Q)"
          min={0.01} 
          max={30} 
          step={0.1}
          value={params.resonance}
          onChange={(e) => handleChange('resonance', e.target.value)}
          paramId="ladderFilter.resonance"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ladderFilter.resonance"}
          tooltip="Resonance of the filter. Higher values create a more pronounced peak at the cutoff, capable of self-oscillation."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="ladderFilter-drive"
          label="DRIVE"
          min={0.1} 
          max={10}  
          step={0.1}
          value={params.drive}
          onChange={(e) => handleChange('drive', e.target.value)}
          paramId="ladderFilter.drive"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ladderFilter.drive"}
          tooltip="Amount of signal drive into the filter, can add saturation and warmth."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="ladderFilter-outputLevel"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5} 
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="ladderFilter.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ladderFilter.outputLevel"}
          tooltip="Final volume adjustment for the ladder filter effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
         {analyserNode && params.isLadderFilterEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Filter Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
