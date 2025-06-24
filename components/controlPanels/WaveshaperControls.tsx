
import React, { useCallback } from 'react';
import { WaveshaperParams, WaveshaperCurveType } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { WAVESHAPER_CURVE_TYPE_OPTIONS } from '../../constants';
import { PeakMeter } from '../ui/PeakMeter';

interface WaveshaperControlsProps {
  params: WaveshaperParams;
  onChange: (newParams: WaveshaperParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const WaveshaperControls: React.FC<WaveshaperControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
 }) => {
  const handleChange = useCallback((field: keyof WaveshaperParams, value: string | number | boolean | WaveshaperCurveType) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="waveshaper-enable-toggle"
        label="Enable Waveshaper"
        checked={params.isWaveshaperEnabled}
        onChange={(e) => handleChange('isWaveshaperEnabled', e.target.checked)}
        tooltip="Toggles the Waveshaper distortion effect on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isWaveshaperEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isWaveshaperEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="waveshaper-drive"
          label="DRIVE"
          min={0.1} 
          max={100}
          step={0.1} 
          value={params.drive}
          onChange={(e) => handleChange('drive', e.target.value)}
          paramId="waveshaper.drive"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "waveshaper.drive"}
          tooltip="Amount of gain applied to the signal before shaping, increasing distortion intensity."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Select
          id="waveshaper-curve-type"
          label="CURVE TYPE"
          options={WAVESHAPER_CURVE_TYPE_OPTIONS}
          value={params.curveType}
          onChange={(e) => handleChange('curveType', e.target.value as WaveshaperCurveType)}
          tooltip="Mathematical function used to distort the waveform. Each type offers a different distortion character."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Slider
          id="waveshaper-output-level"
          label="OUTPUT LEVEL"
          min={0}
          max={1.5} 
          step={0.01}
          value={params.outputLevel}
          onChange={(e) => handleChange('outputLevel', e.target.value)}
          paramId="waveshaper.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "waveshaper.outputLevel"}
          tooltip="Final volume adjustment for the waveshaper effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        {analyserNode && params.isWaveshaperEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
