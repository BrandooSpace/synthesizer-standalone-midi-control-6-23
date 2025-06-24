
import React, { useCallback } from 'react';
import { RingModParams, Waveform } from '../../types'; 
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select'; 
import { AVAILABLE_WAVEFORMS } from '../../constants'; 
import { PeakMeter } from '../ui/PeakMeter';

interface RingModControlsProps {
  params: RingModParams;
  onChange: (newParams: RingModParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const RingModControls: React.FC<RingModControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof RingModParams, value: string | number | boolean | Waveform) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="ringmod-enable-toggle"
        label="Enable Ring Mod"
        checked={params.isRingModEnabled}
        onChange={(e) => handleChange('isRingModEnabled', e.target.checked)}
        tooltip="Toggles the Ring Modulator effect on or off. Multiplies the input signal with a carrier oscillator."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isRingModEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isRingModEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="ringmod-carrier-freq"
          label="CARRIER FREQ (Hz)"
          min={1} 
          max={5000} 
          step={1}
          value={params.carrierFrequency}
          onChange={(e) => handleChange('carrierFrequency', e.target.value)}
          paramId="ringMod.carrierFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ringMod.carrierFrequency"}
          tooltip="Frequency of the internal carrier oscillator used for modulation."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Select
          id="ringmod-carrier-waveform"
          label="CARRIER WAVEFORM"
          options={AVAILABLE_WAVEFORMS}
          value={params.carrierWaveform}
          onChange={(e) => handleChange('carrierWaveform', e.target.value as Waveform)}
          tooltip="Waveform shape of the internal carrier oscillator."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Slider
          id="ringmod-carrier-amplitude"
          label="CARRIER AMPLITUDE"
          min={0}
          max={2} 
          step={0.01}
          value={params.carrierAmplitude}
          onChange={(e) => handleChange('carrierAmplitude', e.target.value)}
          paramId="ringMod.carrierAmplitude"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ringMod.carrierAmplitude"}
          tooltip="Amplitude (volume) of the internal carrier oscillator."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="ringmod-input-signal-gain"
          label="INPUT SIGNAL GAIN"
          min={0}
          max={2} 
          step={0.01}
          value={params.inputSignalGain}
          onChange={(e) => handleChange('inputSignalGain', e.target.value)}
          paramId="ringMod.inputSignalGain"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ringMod.inputSignalGain"}
          tooltip="Gain applied to the incoming audio signal before modulation."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="ringmod-mix"
          label="MIX (Dry/Wet)"
          min={0}
          max={1}
          step={0.01}
          value={params.mix}
          onChange={(e) => handleChange('mix', e.target.value)}
          paramId="ringMod.mix"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "ringMod.mix"}
          tooltip="Balance between the original (dry) and modulated (wet) signal. 0 is fully dry, 1 is fully wet."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
         {analyserNode && params.isRingModEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
