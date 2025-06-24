
import React, { useCallback } from 'react';
import { LowPassFilterInsertParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface LowPassFilterInsertControlsProps {
  params: LowPassFilterInsertParams;
  onChange: (newParams: LowPassFilterInsertParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const LowPassFilterInsertControls: React.FC<LowPassFilterInsertControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof LowPassFilterInsertParams, value: string | number | boolean) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="lowpass-insert-enable-toggle"
        label="Enable LP Filter Insert"
        checked={params.isLowPassInsertEnabled}
        onChange={(e) => handleChange('isLowPassInsertEnabled', e.target.checked)}
        tooltip="Toggles the Low-Pass Filter (Insert) on or off. Attenuates frequencies above the cutoff."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isLowPassInsertEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isLowPassInsertEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="lowpass-insert-cutoff"
          label="CUTOFF FREQUENCY"
          min={20}
          max={20000}
          step={1}
          value={params.cutoffFrequency}
          onChange={(e) => handleChange('cutoffFrequency', e.target.value)}
          paramId="lowPassInsert.cutoffFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "lowPassInsert.cutoffFrequency"}
          tooltip="Frequencies above this point will be attenuated."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="lowpass-insert-resonance"
          label="RESONANCE"
          min={0.01}
          max={30}
          step={0.1}
          value={params.resonance}
          onChange={(e) => handleChange('resonance', e.target.value)}
          paramId="lowPassInsert.resonance"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "lowPassInsert.resonance"}
          tooltip="Emphasizes frequencies around the cutoff point, creating a 'peaking' sound."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="lowpass-insert-output-level"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5}
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="lowPassInsert.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "lowPassInsert.outputLevel"}
          tooltip="Final volume adjustment for the filter effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isLowPassInsertEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
