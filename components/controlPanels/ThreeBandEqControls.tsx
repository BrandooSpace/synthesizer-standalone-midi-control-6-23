
import React, { useCallback } from 'react';
import { ThreeBandEqParams, EqBandParams } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { PeakMeter } from '../ui/PeakMeter';

interface ThreeBandEqControlsProps {
  params: ThreeBandEqParams;
  onChange: (newParams: ThreeBandEqParams) => void;
  analyserNode?: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const ThreeBandEqControls: React.FC<ThreeBandEqControlsProps> = React.memo(({ 
  params, onChange, analyserNode,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const handleBandChange = useCallback((band: 'lowShelf' | 'midPeak' | 'highShelf', field: keyof EqBandParams, value: string | number) => {
    const bandParams = { ...params[band], [field]: parseFloat(value as string) };
    onChange({ ...params, [band]: bandParams });
  }, [onChange, params]);

  const handleGlobalChange = useCallback((field: keyof ThreeBandEqParams, value: string | number | boolean) => {
    onChange({ ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value });
  }, [onChange, params]);

  return (
    <div className="space-y-3">
      <Switch
        id="threeBandEq-enable-toggle"
        label="Enable 3-Band EQ"
        checked={params.isThreeBandEqEnabled}
        onChange={(e) => handleGlobalChange('isThreeBandEqEnabled', e.target.checked)}
        className="mb-3"
        tooltip="Toggles the 3-Band Equalizer (Insert) on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isThreeBandEqEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isThreeBandEqEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        {/* Low Shelf */}
        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1 text-center">Low Shelf</h4>
          <Slider
            id="eq-lowShelf-freq"
            label="Frequency (Hz)"
            min={20} max={1000} step={1}
            value={params.lowShelf.frequency}
            onChange={(e) => handleBandChange('lowShelf', 'frequency', e.target.value)}
            paramId="threeBandEq.lowShelf.frequency"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.lowShelf.frequency"}
            tooltip="Low-shelf filter frequency. Boosts or cuts frequencies below this point."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="eq-lowShelf-gain"
            label="Gain (dB)"
            min={-24} max={24} step={0.1}
            value={params.lowShelf.gain}
            onChange={(e) => handleBandChange('lowShelf', 'gain', e.target.value)}
            className="mt-2"
            paramId="threeBandEq.lowShelf.gain"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.lowShelf.gain"}
            tooltip="Amount of boost or cut (in dB) for the low-shelf filter."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        {/* Mid Peak */}
        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1 text-center">Mid Peak</h4>
          <Slider
            id="eq-midPeak-freq"
            label="Frequency (Hz)"
            min={200} max={10000} step={1}
            value={params.midPeak.frequency}
            onChange={(e) => handleBandChange('midPeak', 'frequency', e.target.value)}
            paramId="threeBandEq.midPeak.frequency"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.midPeak.frequency"}
            tooltip="Center frequency for the mid-range peaking filter."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="eq-midPeak-gain"
            label="Gain (dB)"
            min={-24} max={24} step={0.1}
            value={params.midPeak.gain}
            onChange={(e) => handleBandChange('midPeak', 'gain', e.target.value)}
            className="mt-2"
            paramId="threeBandEq.midPeak.gain"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.midPeak.gain"}
            tooltip="Amount of boost or cut (in dB) for the mid-range peaking filter."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="eq-midPeak-q"
            label="Q Factor"
            min={0.1} max={20} step={0.1}
            value={params.midPeak.q || 1}
            onChange={(e) => handleBandChange('midPeak', 'q', e.target.value)}
            className="mt-2"
            paramId="threeBandEq.midPeak.q"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.midPeak.q"}
            tooltip="Quality factor (bandwidth) of the mid-range peaking filter. Higher Q affects a narrower range of frequencies."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        {/* High Shelf */}
         <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1 text-center">High Shelf</h4>
          <Slider
            id="eq-highShelf-freq"
            label="Frequency (Hz)"
            min={1000} max={20000} step={1}
            value={params.highShelf.frequency}
            onChange={(e) => handleBandChange('highShelf', 'frequency', e.target.value)}
            paramId="threeBandEq.highShelf.frequency"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.highShelf.frequency"}
            tooltip="High-shelf filter frequency. Boosts or cuts frequencies above this point."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="eq-highShelf-gain"
            label="Gain (dB)"
            min={-24} max={24} step={0.1}
            value={params.highShelf.gain}
            onChange={(e) => handleBandChange('highShelf', 'gain', e.target.value)}
            className="mt-2"
            paramId="threeBandEq.highShelf.gain"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "threeBandEq.highShelf.gain"}
            tooltip="Amount of boost or cut (in dB) for the high-shelf filter."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        {/* Output Level */}
        <Slider
          id="eq-outputLevel"
          label="OUTPUT LEVEL"
          min={0} max={1.5} step={0.01} 
          value={params.outputLevel}
          onChange={(e) => handleGlobalChange('outputLevel', e.target.value)}
          className="mt-3 pt-3 border-t border-gray-600"
          paramId="threeBandEq.outputLevel"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "threeBandEq.outputLevel"}
          tooltip="Overall output level adjustment for the EQ effect."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        
        {analyserNode && params.isThreeBandEqEnabled && (
          <div className="pt-2 border-t border-gray-700">
            <PeakMeter analyserNode={analyserNode} title="EQ Output" minDb={-48} maxDb={6} className="mx-auto" compact={true} />
          </div>
        )}
      </fieldset>
    </div>
  );
});
