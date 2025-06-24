
import React, { useCallback } from 'react';
import { BandPassFilterInsertParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface BandPassFilterInsertControlsProps {
  params: BandPassFilterInsertParams;
  onChange: (newParams: BandPassFilterInsertParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const BandPassFilterInsertControls: React.FC<BandPassFilterInsertControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof BandPassFilterInsertParams, value: string | number | boolean) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="bandpass-insert-enable-toggle"
        label="Enable BP Filter Insert"
        checked={params.isBandPassInsertEnabled}
        onChange={(e) => handleChange('isBandPassInsertEnabled', e.target.checked)}
        tooltip="Toggles the Band-Pass Filter (Insert) on or off. Allows frequencies around the center frequency to pass."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isBandPassInsertEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isBandPassInsertEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="bandpass-insert-cutoff"
          label="CENTER FREQUENCY"
          min={20}
          max={20000}
          step={1}
          value={params.cutoffFrequency}
          onChange={(e) => handleChange('cutoffFrequency', e.target.value)}
          paramId="bandPassInsert.cutoffFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "bandPassInsert.cutoffFrequency"}
          tooltip="Center frequency of the band that is allowed to pass."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="bandpass-insert-resonance"
          label="Q FACTOR (Bandwidth)"
          min={0.1}
          max={100}
          step={0.1}
          value={params.resonance}
          onChange={(e) => handleChange('resonance', e.target.value)}
          paramId="bandPassInsert.resonance"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "bandPassInsert.resonance"}
          tooltip="Quality factor of the filter. Higher Q means a narrower bandwidth."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="bandpass-insert-output-level"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5}
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="bandPassInsert.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "bandPassInsert.outputLevel"}
          tooltip="Final volume adjustment for the filter effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isBandPassInsertEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
