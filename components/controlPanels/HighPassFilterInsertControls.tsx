
import React, { useCallback } from 'react';
import { HighPassFilterInsertParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface HighPassFilterInsertControlsProps {
  params: HighPassFilterInsertParams;
  onChange: (newParams: HighPassFilterInsertParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const HighPassFilterInsertControls: React.FC<HighPassFilterInsertControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof HighPassFilterInsertParams, value: string | number | boolean) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="highpass-insert-enable-toggle"
        label="Enable HP Filter Insert"
        checked={params.isHighPassInsertEnabled}
        onChange={(e) => handleChange('isHighPassInsertEnabled', e.target.checked)}
        tooltip="Toggles the High-Pass Filter (Insert) on or off. Attenuates frequencies below the cutoff."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isHighPassInsertEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isHighPassInsertEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="highpass-insert-cutoff"
          label="CUTOFF FREQUENCY"
          min={20}
          max={20000}
          step={1}
          value={params.cutoffFrequency}
          onChange={(e) => handleChange('cutoffFrequency', e.target.value)}
          paramId="highPassInsert.cutoffFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "highPassInsert.cutoffFrequency"}
          tooltip="Frequencies below this point will be attenuated."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="highpass-insert-resonance"
          label="RESONANCE"
          min={0.01}
          max={30}
          step={0.1}
          value={params.resonance}
          onChange={(e) => handleChange('resonance', e.target.value)}
          paramId="highPassInsert.resonance"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "highPassInsert.resonance"}
          tooltip="Emphasizes frequencies around the cutoff point."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="highpass-insert-output-level"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5}
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="highPassInsert.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "highPassInsert.outputLevel"}
          tooltip="Final volume adjustment for the filter effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isHighPassInsertEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
