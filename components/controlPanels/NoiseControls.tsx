
import React, { useCallback } from 'react';
import { NoiseParams, NoiseType } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { NOISE_TYPE_OPTIONS } from '../../constants';

interface NoiseControlsProps {
  params: NoiseParams;
  onChange: (newParams: NoiseParams) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const NoiseControls: React.FC<NoiseControlsProps> = React.memo(({ 
  params, onChange,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof NoiseParams, value: string | number | boolean | NoiseType) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="noise-enable-toggle"
        label="Enable Noise"
        checked={params.isNoiseEnabled}
        onChange={(e) => handleChange('isNoiseEnabled', e.target.checked)}
        tooltip="Toggles the noise generator on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isNoiseEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isNoiseEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Select
          id="noise-type"
          label="NOISE TYPE"
          options={NOISE_TYPE_OPTIONS}
          value={params.noiseType}
          onChange={(e) => handleChange('noiseType', e.target.value as NoiseType)}
          tooltip="Selects the type of noise: White (flat spectrum) or Pink (equal energy per octave)."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Slider
          id="noise-level"
          label="NOISE LEVEL"
          min={0}
          max={1} 
          step={0.01}
          value={params.noiseLevel}
          onChange={(e) => handleChange('noiseLevel', e.target.value)}
          paramId="noise.noiseLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "noise.noiseLevel"}
          tooltip="Volume of the noise generator mixed into the sound."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
      </fieldset>
    </div>
  );
});
