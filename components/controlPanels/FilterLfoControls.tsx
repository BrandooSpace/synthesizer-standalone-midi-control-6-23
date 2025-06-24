
import React, { useCallback } from 'react';
import { FilterParams, LfoParams, LfoTarget, FilterNodeType, Waveform } from '../../types';
import { Slider } from '../ui/Slider';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { AUDIO_LFO_TARGET_OPTIONS, FILTER_TYPE_OPTIONS, LFO_WAVEFORM_OPTIONS, LFO_TEMPO_SYNC_DIVISIONS } from '../../constants'; 

interface FilterLfoControlsProps {
  filterParams: FilterParams;
  lfoParams: LfoParams;
  onFilterChange: (newParams: FilterParams) => void;
  onLfoChange: (newParams: LfoParams) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const FilterLfoControls: React.FC<FilterLfoControlsProps> = React.memo(({ 
  filterParams, lfoParams, onFilterChange, onLfoChange, 
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  
  const handleFilterChange = useCallback((field: keyof FilterParams, value: string | number | boolean | FilterNodeType) => {
    let processedValue = value;
    if (typeof filterParams[field] === 'number' && typeof value === 'string') {
      processedValue = parseFloat(value);
    } else if (typeof filterParams[field] === 'boolean' && typeof value !== 'boolean') {
      processedValue = Boolean(value);
    }
    onFilterChange({ ...filterParams, [field]: processedValue as any });
  }, [onFilterChange, filterParams]);

  const handleLfoChange = useCallback((field: keyof LfoParams, value: string | number | boolean) => {
    onLfoChange({ ...lfoParams, [field]: typeof lfoParams[field] === 'number' ? parseFloat(value as string) : value });
  }, [onLfoChange, lfoParams]);

  return (
    <div className="space-y-4">
      <Switch
        id="filter-enable-toggle"
        label="Enable Filter/LFO" 
        checked={filterParams.isFilterEnabled} 
        onChange={(e) => handleFilterChange('isFilterEnabled', e.target.checked)}
        tooltip="Toggles the main filter and LFO section on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${filterParams.isFilterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!filterParams.isFilterEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        <p className="text-xs font-semibold text-gray-400 uppercase text-center border-b border-gray-700 pb-1">Filter Settings</p>
        <Select
          id="filter-type"
          label="FILTER TYPE (X & Y)"
          options={FILTER_TYPE_OPTIONS}
          value={filterParams.filterType}
          onChange={(e) => handleFilterChange('filterType', e.target.value as FilterNodeType)}
          tooltip="Type of filter applied to both X and Y oscillator paths."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Slider
          id="filter-cutoff"
          label="CUTOFF FREQUENCY"
          min={20}
          max={20000}
          step={1} 
          value={filterParams.cutoffFrequency}
          onChange={(e) => handleFilterChange('cutoffFrequency', e.target.value)}
          paramId="filter.cutoffFrequency"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "filter.cutoffFrequency"}
          tooltip="Base cutoff frequency for the filter."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="resonance"
          label="RESONANCE"
          min={0.01}
          max={30} 
          step={0.1}
          value={filterParams.resonance}
          onChange={(e) => handleFilterChange('resonance', e.target.value)}
          paramId="filter.resonance"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "filter.resonance"}
          tooltip="Emphasis (Q factor) at the cutoff frequency."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Slider
          id="filterKeytracking"
          label="FILTER KEYTRACKING (%)"
          min={-200} 
          max={200}
          step={1}
          value={filterParams.keytrackAmount}
          onChange={(e) => handleFilterChange('keytrackAmount', e.target.value)}
          paramId="filter.keytrackAmount"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "filter.keytrackAmount"}
          tooltip="How much the filter cutoff follows the pitch of the played note."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <p className="text-xs font-semibold text-gray-400 uppercase text-center border-b border-gray-700 pb-1 pt-2">LFO Settings</p>
        <Select
          id="lfo-waveform"
          label="LFO WAVEFORM"
          options={LFO_WAVEFORM_OPTIONS} 
          value={lfoParams.waveform}
          onChange={(e) => handleLfoChange('waveform', e.target.value as Waveform)}
          tooltip="Shape of the Low-Frequency Oscillator."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        <Switch
          id="lfo-tempo-sync"
          label="Tempo Sync"
          checked={lfoParams.isTempoSynced || false}
          onChange={(e) => handleLfoChange('isTempoSynced', e.target.checked)}
          tooltip="Syncs the LFO rate to the global BPM."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
        {lfoParams.isTempoSynced ? (
          <Select
            id="lfo-tempo-division"
            label="Sync Division"
            options={LFO_TEMPO_SYNC_DIVISIONS}
            value={lfoParams.tempoSyncDivision || '1/4'}
            onChange={(e) => handleLfoChange('tempoSyncDivision', e.target.value)}
            tooltip="LFO rate synced to musical divisions of the global BPM."
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
          />
        ) : (
          <Slider
            id="lfo-rate"
            label="LFO RATE (Hz)"
            min={0.01}
            max={30}
            step={0.01}
            value={lfoParams.rate}
            onChange={(e) => handleLfoChange('rate', e.target.value)}
            paramId="lfo.rate"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "lfo.rate"}
            tooltip="Speed of the LFO in Hertz (cycles per second)."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        )}
        <Slider
          id="lfo-depth"
          label="LFO DEPTH"
          min={0}
          max={ (lfoParams.target === LfoTarget.FILTER_X || lfoParams.target === LfoTarget.FILTER_Y || lfoParams.target === LfoTarget.FILTER_XY) ? 10000 : 
                (lfoParams.target === LfoTarget.PITCH_X || lfoParams.target === LfoTarget.PITCH_Y || lfoParams.target === LfoTarget.PITCH_XY) ? 1200 : 
                (lfoParams.target === LfoTarget.PHASE) ? 0.1 : 
                (lfoParams.target === LfoTarget.OSC_X_WAVETABLE_POS || lfoParams.target === LfoTarget.OSC_Y_WAVETABLE_POS) ? 1 :
                100 
              } 
          step={ (lfoParams.target === LfoTarget.PHASE || lfoParams.target === LfoTarget.OSC_X_WAVETABLE_POS || lfoParams.target === LfoTarget.OSC_Y_WAVETABLE_POS) ? 0.001 : 1}
          value={lfoParams.depth}
          onChange={(e) => handleLfoChange('depth', e.target.value)}
          paramId="lfo.depth"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "lfo.depth"}
          tooltip="Amount of LFO modulation applied to the target."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
        <Select
          id="lfo-target"
          label="LFO TARGET"
          options={AUDIO_LFO_TARGET_OPTIONS}
          value={lfoParams.target}
          onChange={(e) => handleLfoChange('target', e.target.value as LfoTarget)}
          tooltip="Parameter to be modulated by the LFO."
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
        />
      </fieldset>
    </div>
  );
});
