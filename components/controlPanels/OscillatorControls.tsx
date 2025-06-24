
import React, { useCallback } from 'react';
import { OscillatorParams, Waveform, WavetableOption } from '../../types'; 
import { Slider } from '../ui/Slider';
import { Select } from '../ui/Select';
import { AVAILABLE_WAVEFORMS } from '../../constants';

interface OscillatorControlsProps {
  params: OscillatorParams;
  onChange: (newParams: OscillatorParams) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void;
  paramIdToLearn?: string | null;
  modulatedParamIds?: Set<string>;
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  wavetableOptions: WavetableOption[]; 
  onCustomWavLoad: (file: File, oscType: 'X' | 'Y') => void; 
  userLoadedWavetableNames: { x?: string, y?: string }; 
  globalMidiLearnActive?: boolean;
}

export const OscillatorControls: React.FC<OscillatorControlsProps> = React.memo(({
  params, onChange, onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText, wavetableOptions, onCustomWavLoad, userLoadedWavetableNames,
  globalMidiLearnActive
}) => {
  const handleChange = useCallback((field: keyof OscillatorParams, value: string | number) => {
    onChange({ ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value });
  }, [onChange, params]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, oscType: 'X' | 'Y') => {
    if (event.target.files && event.target.files[0]) {
      onCustomWavLoad(event.target.files[0], oscType);
      event.target.value = ''; 
    }
  }, [onCustomWavLoad]);

  return (
    <div className="space-y-4">
      {/* X-Axis Controls */}
      <Select
        id="waveformX"
        label="X-AXIS WAVEFORM"
        options={AVAILABLE_WAVEFORMS}
        value={params.waveformX}
        onChange={(e) => handleChange('waveformX', e.target.value as Waveform)}
        tooltip="Select the primary waveform shape for the X-axis oscillator."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      {params.waveformX === Waveform.WAVETABLE && (
        <div className="pl-4 border-l-2 border-green-700 space-y-3 my-2">
          <Select
            id="wavetableX"
            label="X Wavetable Select"
            options={wavetableOptions}
            value={params.wavetableX}
            onChange={(e) => handleChange('wavetableX', e.target.value)}
            tooltip="Select the conceptual wavetable for the X-axis oscillator. User-loaded tables appear here."
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
          />
          <Slider
            id="wavetablePositionX"
            label="X WT Position (Morph X)"
            min={0} max={1} step={0.001}
            value={params.wavetablePositionX}
            onChange={(e) => handleChange('wavetablePositionX', e.target.value)}
            paramId="osc.wavetablePositionX"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "osc.wavetablePositionX"}
            tooltip="Scans X-axis of selected wavetable. For 1D tables, this is the main morph control."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
           <Slider
            id="wavetablePositionY_ForX" 
            label="X WT Y-Axis (Morph Y)"
            min={0} max={1} step={0.001}
            value={params.wavetablePositionY} 
            onChange={(e) => handleChange('wavetablePositionY', e.target.value)} 
            paramId="osc.wavetablePositionY_ForX" 
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "osc.wavetablePositionY_ForX"}
            tooltip="Scans Y-axis of selected wavetable for X-Osc. Shared with Y-Osc Y-morph if it also uses a 2D table."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <div className="mt-2">
            <label htmlFor="oscX-wav-load" className="text-xs text-gray-400 block mb-1">Load Custom .wav for X-Osc:</label>
            <input
              type="file"
              id="oscX-wav-load"
              accept=".wav,.wave"
              className="text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-gray-600 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 w-full"
              onChange={(e) => handleFileChange(e, 'X')}
            />
            {params.wavetableX.startsWith('user_') && userLoadedWavetableNames.x && (
              <p className="text-xs text-green-400 mt-1 truncate" title={userLoadedWavetableNames.x}>
                Loaded: {userLoadedWavetableNames.x}
              </p>
            )}
          </div>
        </div>
      )}
      <Slider
        id="xRatio"
        label="X-AXIS FREQ RATIO"
        min={0.1} max={8} step={0.01}
        value={params.xRatio}
        onChange={(e) => handleChange('xRatio', e.target.value)}
        paramId="osc.xRatio"
        onRequestLearn={onRequestLearn}
        isLearning={paramIdToLearn === "osc.xRatio"}
        tooltip="Frequency multiplier for the X-axis oscillator."
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive}
      />

      {/* Y-Axis Controls */}
      <Select
        id="waveformY"
        label="Y-AXIS WAVEFORM"
        options={AVAILABLE_WAVEFORMS}
        value={params.waveformY}
        onChange={(e) => handleChange('waveformY', e.target.value as Waveform)}
        tooltip="Select the primary waveform shape for the Y-axis oscillator."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      {params.waveformY === Waveform.WAVETABLE && (
        <div className="pl-4 border-l-2 border-green-700 space-y-3 my-2">
          <Select
            id="wavetableY"
            label="Y Wavetable Select"
            options={wavetableOptions}
            value={params.wavetableY}
            onChange={(e) => handleChange('wavetableY', e.target.value)}
            tooltip="Select the conceptual wavetable for the Y-axis oscillator. User-loaded tables appear here."
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
          />
           <Slider
            id="wavetablePositionX_ForY" 
            label="Y WT X-Axis (Morph X)"
            min={0} max={1} step={0.001}
            value={params.wavetablePositionX} 
            onChange={(e) => handleChange('wavetablePositionX', e.target.value)} 
            paramId="osc.wavetablePositionX_ForY"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "osc.wavetablePositionX_ForY"}
            tooltip="Scans X-axis of selected wavetable for Y-Osc. Shared with X-Osc X-morph."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="wavetablePositionY"
            label="Y WT Position (Morph Y)"
            min={0} max={1} step={0.001}
            value={params.wavetablePositionY}
            onChange={(e) => handleChange('wavetablePositionY', e.target.value)}
            paramId="osc.wavetablePositionY"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "osc.wavetablePositionY"}
            tooltip="Scans Y-axis of selected wavetable for Y-Osc. For 1D tables, this is main morph. Shared if X-Osc also uses 2D table."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <div className="mt-2">
            <label htmlFor="oscY-wav-load" className="text-xs text-gray-400 block mb-1">Load Custom .wav for Y-Osc:</label>
            <input
              type="file"
              id="oscY-wav-load"
              accept=".wav,.wave"
              className="text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-gray-600 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 w-full"
              onChange={(e) => handleFileChange(e, 'Y')}
            />
             {params.wavetableY.startsWith('user_') && userLoadedWavetableNames.y && (
              <p className="text-xs text-green-400 mt-1 truncate" title={userLoadedWavetableNames.y}>
                Loaded: {userLoadedWavetableNames.y}
              </p>
            )}
          </div>
        </div>
      )}
      <Slider
        id="yRatio"
        label="Y-AXIS FREQ RATIO"
        min={0.1} max={8} step={0.01}
        value={params.yRatio}
        onChange={(e) => handleChange('yRatio', e.target.value)}
        paramId="osc.yRatio"
        onRequestLearn={onRequestLearn}
        isLearning={paramIdToLearn === "osc.yRatio"}
        tooltip="Frequency multiplier for the Y-axis oscillator."
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive}
      />
      <Slider
        id="phaseShift"
        label="PHASE SHIFT (DEGREES)"
        min={0} max={360} step={1}
        value={params.phaseShift}
        onChange={(e) => handleChange('phaseShift', e.target.value)}
        paramId="osc.phaseShift"
        onRequestLearn={onRequestLearn}
        isLearning={paramIdToLearn === "osc.phaseShift"}
        tooltip="Phase offset of the Y-axis oscillator relative to the X-axis."
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive}
      />
      {/* Unison Settings */}
      <div className="pt-3 border-t border-gray-700 mt-3 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase text-center">Unison Settings</h3>
        <Slider
          id="unisonVoices"
          label="UNISON VOICES"
          min={1} max={7} step={1}
          value={params.unisonVoices}
          onChange={(e) => handleChange('unisonVoices', e.target.value)}
          paramId="osc.unisonVoices"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "osc.unisonVoices"}
          tooltip="Number of unison voices per oscillator."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="unisonDetune"
          label="UNISON DETUNE (CENTS)"
          min={0} max={100} step={0.1}
          value={params.unisonDetune}
          onChange={(e) => handleChange('unisonDetune', e.target.value)}
          paramId="osc.unisonDetune"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "osc.unisonDetune"}
          tooltip="Pitch detuning between unison voices."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="unisonSpread"
          label="UNISON SPREAD (STEREO)"
          min={0} max={1} step={0.01}
          value={params.unisonSpread}
          onChange={(e) => handleChange('unisonSpread', e.target.value)}
          paramId="osc.unisonSpread"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "osc.unisonSpread"}
          tooltip="Stereo spread of unison voices."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
      </div>
    </div>
  );
});
