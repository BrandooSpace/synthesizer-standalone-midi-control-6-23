
import React, { useCallback } from 'react';
import { CompressorParams, CompressorSidechainSource } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { PeakMeter } from '../ui/PeakMeter';
import { COMPRESSOR_SIDECHAIN_SOURCE_OPTIONS } from '../../constants';

interface CompressorControlsProps {
  params: CompressorParams;
  onChange: (newParams: CompressorParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const CompressorControls: React.FC<CompressorControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof CompressorParams, value: string | number | boolean | CompressorSidechainSource) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="compressor-enable-toggle"
        label="Enable Compressor"
        checked={params.isCompressorEnabled}
        onChange={(e) => handleChange('isCompressorEnabled', e.target.checked)}
        tooltip="Toggles the Compressor (Insert) effect on or off. Reduces dynamic range."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isCompressorEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isCompressorEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <Slider
          id="compressor-threshold"
          label="THRESHOLD (dB)"
          min={-100}
          max={0}
          step={1}
          value={params.threshold}
          onChange={(e) => handleChange('threshold', e.target.value)}
          paramId="compressor.threshold"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.threshold"}
          tooltip="Signal level (in dBFS) above which compression starts."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="compressor-knee"
          label="KNEE (dB)"
          min={0}
          max={40}
          step={1}
          value={params.knee}
          onChange={(e) => handleChange('knee', e.target.value)}
          paramId="compressor.knee"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.knee"}
          tooltip="Range (in dB) above the threshold where compression occurs gradually (soft knee) instead of abruptly."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="compressor-ratio"
          label="RATIO (:1)"
          min={1}
          max={20}
          step={0.1}
          value={params.ratio}
          onChange={(e) => handleChange('ratio', e.target.value)}
          paramId="compressor.ratio"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.ratio"}
          tooltip="Amount of gain reduction. E.g., 4:1 means for every 4dB over threshold, output increases by 1dB."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="compressor-attack"
          label="ATTACK (s)"
          min={0.000} 
          max={1}
          step={0.001}
          value={params.attack}
          onChange={(e) => handleChange('attack', e.target.value)}
          paramId="compressor.attack"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.attack"}
          tooltip="Time (in seconds) taken for compression to engage after signal exceeds threshold."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="compressor-release"
          label="RELEASE (s)"
          min={0.001} 
          max={1}
          step={0.001}
          value={params.release}
          onChange={(e) => handleChange('release', e.target.value)}
          paramId="compressor.release"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.release"}
          tooltip="Time (in seconds) taken for compression to disengage after signal falls below threshold."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="compressor-makeupGain"
          label="MAKEUP GAIN (dB)"
          min={0}
          max={30} 
          step={0.1}
          value={params.makeupGain}
          onChange={(e) => handleChange('makeupGain', e.target.value)}
          paramId="compressor.makeupGain"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "compressor.makeupGain"}
          tooltip="Boosts overall output level to compensate for gain reduction caused by compression."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />

        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3 mt-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase text-center mb-1">Sidechain Settings</h4>
            <Select
              id="compressor-sidechain-source"
              label="SIDECHAIN SOURCE"
              options={COMPRESSOR_SIDECHAIN_SOURCE_OPTIONS}
              value={params.sidechainSource}
              onChange={(e) => handleChange('sidechainSource', e.target.value as CompressorSidechainSource)}
              tooltip="External signal used to trigger the compressor instead of the main input. 'None' uses the main input."
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
            />
            <Slider
              id="compressor-sidechain-sensitivity"
              label="SIDECHAIN SENSITIVITY"
              min={0}
              max={1}
              step={0.01}
              value={params.sidechainSensitivity}
              onChange={(e) => handleChange('sidechainSensitivity', e.target.value)}
              className={`${params.sidechainSource === 'none' ? 'opacity-50 pointer-events-none' : ''}`}
              paramId="compressor.sidechainSensitivity"
              onRequestLearn={onRequestLearn}
              isLearning={paramIdToLearn === "compressor.sidechainSensitivity"}
              tooltip="How much the sidechain signal level influences the compression threshold. Only active if Sidechain Source is not 'None'."
              modulatedParamIds={modulatedParamIds}
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
              globalMidiLearnActive={globalMidiLearnActive}
            />
        </div>

        {analyserNode && params.isCompressorEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="Effect Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
