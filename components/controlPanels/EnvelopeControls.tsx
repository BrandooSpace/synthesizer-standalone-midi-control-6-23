
import React, { useCallback } from 'react';
import { EnvelopeParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';

interface EnvelopeControlsProps {
  params: EnvelopeParams;
  onChange: (newParams: EnvelopeParams) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const EnvelopeControls: React.FC<EnvelopeControlsProps> = React.memo(({ 
  params, onChange, onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof EnvelopeParams, value: string | number | boolean) => {
    onChange({ ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value });
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="envelope-enable-toggle"
        label="Enable Envelope"
        checked={params.isEnvelopeEnabled}
        onChange={(e) => handleChange('isEnvelopeEnabled', e.target.checked)}
        tooltip="Toggles the amplitude envelope on or off. If off, sound plays at a fixed level."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isEnvelopeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isEnvelopeEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="attack"
          label="ATTACK (s)"
          min={0.001}
          max={5}
          step={0.001}
          value={params.attack}
          onChange={(e) => handleChange('attack', e.target.value)}
          paramId="env.attack"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "env.attack"}
          tooltip="Time taken for the sound to reach peak level after a note is triggered."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="decay"
          label="DECAY (s)"
          min={0.001}
          max={5}
          step={0.001}
          value={params.decay}
          onChange={(e) => handleChange('decay', e.target.value)}
          paramId="env.decay"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "env.decay"}
          tooltip="Time taken for the sound to drop from peak level to the sustain level."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="sustain"
          label="SUSTAIN (0-1)"
          min={0.0}
          max={1.0}
          step={0.01}
          value={params.sustain}
          onChange={(e) => handleChange('sustain', e.target.value)}
          paramId="env.sustain"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "env.sustain"}
          tooltip="Level at which the sound is held while a note is pressed (after attack and decay)."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="release"
          label="RELEASE (s)"
          min={0.001}
          max={5}
          step={0.001}
          value={params.release}
          onChange={(e) => handleChange('release', e.target.value)}
          paramId="env.release"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "env.release"}
          tooltip="Time taken for the sound to fade out after a note is released."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
      </fieldset>
    </div>
  );
});
