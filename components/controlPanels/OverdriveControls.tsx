
import React, { useCallback } from 'react';
import { OverdriveParams, OverdriveCurveType } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { OVERDRIVE_CURVE_TYPE_OPTIONS } from '../../constants';
import { PeakMeter } from '../ui/PeakMeter';

interface OverdriveControlsProps {
  params: OverdriveParams;
  onChange: (newParams: OverdriveParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const OverdriveControls: React.FC<OverdriveControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
 }) => {
  const handleChange = useCallback((field: keyof OverdriveParams, value: string | number | boolean | OverdriveCurveType) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="overdrive-enable-toggle"
        label="Enable Overdrive"
        checked={params.isOverdriveEnabled}
        onChange={(e) => handleChange('isOverdriveEnabled', e.target.checked)}
        tooltip="Toggles the Overdrive/Distortion effect on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isOverdriveEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isOverdriveEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="overdrive-drive"
          label="DRIVE"
          min={1} 
          max={100}
          step={1}
          value={params.drive}
          onChange={(e) => handleChange('drive', e.target.value)}
          paramId="overdrive.drive"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "overdrive.drive"}
          tooltip="Amount of gain applied to the signal before distortion, increasing saturation and harmonic content."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Select
          id="overdrive-curve-type"
          label="CURVE TYPE"
          options={OVERDRIVE_CURVE_TYPE_OPTIONS}
          value={params.curveType}
          onChange={(e) => handleChange('curveType', e.target.value as OverdriveCurveType)}
          tooltip="Type of distortion curve applied. 'Soft Clip' is smoother, 'Hard Clip' is aggressive, 'Fuzz' is more extreme."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Slider
          id="overdrive-tone"
          label="TONE (Dark/Bright)"
          min={0} 
          max={1} 
          step={0.01}
          value={params.tone}
          onChange={(e) => handleChange('tone', e.target.value)}
          paramId="overdrive.tone"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "overdrive.tone"}
          tooltip="Controls the brightness of the distorted signal. 0 is darker, 1 is brighter."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="overdrive-output-level"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5} 
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="overdrive.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "overdrive.outputLevel"}
          tooltip="Final volume adjustment for the overdrive effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isOverdriveEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
