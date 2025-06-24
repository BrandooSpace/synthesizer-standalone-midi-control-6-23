
import React, { useCallback } from 'react';
import { StereoWidthParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface StereoWidthControlsProps {
  params: StereoWidthParams;
  onChange: (newParams: StereoWidthParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const StereoWidthControls: React.FC<StereoWidthControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof StereoWidthParams, value: string | number | boolean) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="stereowidth-enable-toggle"
        label="Enable Stereo Width"
        checked={params.isStereoWidthEnabled}
        onChange={(e) => handleChange('isStereoWidthEnabled', e.target.checked)}
        tooltip="Toggles the Stereo Width effect on or off. Uses Haas effect and channel mixing for width."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isStereoWidthEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isStereoWidthEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="stereowidth-amount"
          label="WIDTH AMOUNT (Delay)"
          min={0}
          max={1} 
          step={0.01}
          value={params.widthAmount}
          onChange={(e) => handleChange('widthAmount', e.target.value)}
          paramId="stereoWidth.widthAmount"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "stereoWidth.widthAmount"}
          tooltip="Controls the Haas effect delay time. Higher values increase perceived width but can introduce phase issues."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="stereowidth-intensity"
          label="INTENSITY (R Channel Mix)"
          min={0} 
          max={1}
          step={0.01}
          value={params.intensity}
          onChange={(e) => handleChange('intensity', e.target.value)}
          paramId="stereoWidth.intensity"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "stereoWidth.intensity"}
          tooltip="Mix balance for the right output channel between original R signal and delayed L signal."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isStereoWidthEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Processed Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
