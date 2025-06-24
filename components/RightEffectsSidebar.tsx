import React from 'react';
import { EffectWindowConfig, OscillatorParams, FilterParams, LfoParams, EnvelopeParams, VisualsParams, DelayParams, ReverbParams, RingModParams, WaveshaperParams, StereoWidthParams, NoiseParams, MasterMixerParams, OverdriveParams, LowPassFilterInsertParams, HighPassFilterInsertParams, BandPassFilterInsertParams, NotchFilterInsertParams, CompressorParams, ThreeBandEqParams, LadderFilterParams, ModMatrixParams, MidiMappings, SynthPreset, WavetableOption, UserWavetable } from '../../types';
import { EffectAccordionItem } from './EffectAccordionItem';

interface RightEffectsSidebarProps {
  availableEffects: EffectWindowConfig[];
  onToggleEffect: (effectId: string) => void;
  componentMap: Record<string, React.FC<any>>;

  params: {
    oscParams: OscillatorParams;
    filterParams: FilterParams;
    lfoParams: LfoParams;
    envParams: EnvelopeParams;
    visualsParams: VisualsParams;
    delayParams: DelayParams;
    reverbParams: ReverbParams;
    ringModParams: RingModParams;
    waveshaperParams: WaveshaperParams;
    stereoWidthParams: StereoWidthParams;
    noiseParams: NoiseParams;
    overdriveParams: OverdriveParams;
    lowPassFilterInsertParams: LowPassFilterInsertParams;
    highPassFilterInsertParams: HighPassFilterInsertParams;
    bandPassFilterInsertParams: BandPassFilterInsertParams;
    notchFilterInsertParams: NotchFilterInsertParams;
    compressorParams: CompressorParams;
    threeBandEqParams: ThreeBandEqParams;
    ladderFilterParams: LadderFilterParams;
    modMatrixParams: ModMatrixParams;
    userMaxPolyphony: number;
    globalBpm: number;
    midiMappings: MidiMappings;
    modulatedParamIds: Set<string>;
    wavetableOptions: WavetableOption[]; 
    userLoadedWavetableNames: { x?: string, y?: string }; 
    globalMidiLearnActive?: boolean; // Added prop
  };
  handlers: {
    handleOscParamsChange: (newParams: OscillatorParams) => void;
    handleFilterParamsChange: (newParams: FilterParams) => void;
    handleLfoParamsChange: (newParams: LfoParams) => void;
    handleEnvParamsChange: (newParams: EnvelopeParams) => void;
    handleVisualsParamsChange: (newParams: VisualsParams) => void;
    handleDelayParamsChange: (newParams: DelayParams) => void;
    handleReverbParamsChange: (newParams: ReverbParams) => void;
    handleRingModParamsChange: (newParams: RingModParams) => void;
    handleWaveshaperParamsChange: (newParams: WaveshaperParams) => void;
    handleStereoWidthParamsChange: (newParams: StereoWidthParams) => void;
    handleNoiseParamsChange: (newParams: NoiseParams) => void;
    handleOverdriveParamsChange: (newParams: OverdriveParams) => void;
    handleLowPassFilterInsertParamsChange: (newParams: LowPassFilterInsertParams) => void;
    handleHighPassFilterInsertParamsChange: (newParams: HighPassFilterInsertParams) => void;
    handleBandPassFilterInsertParamsChange: (newParams: BandPassFilterInsertParams) => void;
    handleNotchFilterInsertParamsChange: (newParams: NotchFilterInsertParams) => void;
    handleCompressorParamsChange: (newParams: CompressorParams) => void;
    handleThreeBandEqParamsChange: (newParams: ThreeBandEqParams) => void;
    handleLadderFilterParamsChange: (newParams: LadderFilterParams) => void;
    handleModMatrixParamsChange: (newParams: ModMatrixParams) => void;
    handleUserMaxPolyphonyChange: (newLimit: number) => void;
    handleGlobalBpmChange: (newBpm: number) => void;
    saveCurrentPreset: (name: string) => void;
    loadPreset: (preset: SynthPreset) => void;
    deletePreset: (name: string) => void;
    initializePreset: () => void;
    setCurrentPresetName: (name: string) => void;
    handleDeleteMidiMapping: (cc: number) => void;
    onSetHelpText: (text: string) => void;
    onClearHelpText: () => void;
    onCustomWavLoad: (file: File, oscType: 'X' | 'Y') => void; 
  };
  appAnalysers: any;
  insertEffectAnalysers: any;
  getMasterLimiterReduction: () => number;
  presets: SynthPreset[];
  currentPresetName: string;
  isPresetDirty: boolean;
  onRequestLearn?: (paramId: string, min: number, max: number) => void;
  paramIdToLearn?: string | null;
  activeVoiceCount: number;
  voiceStealIndicatorActive: boolean;
  activeEffectIds: Set<string>;
  onSetHelpText: (text: string) => void;
  onClearHelpText: () => void;
}

export const RightEffectsSidebar: React.FC<RightEffectsSidebarProps> = ({
  availableEffects,
  onToggleEffect,
  componentMap,
  params,
  handlers,
  appAnalysers,
  insertEffectAnalysers,
  getMasterLimiterReduction,
  presets,
  currentPresetName,
  isPresetDirty,
  onRequestLearn,
  paramIdToLearn,
  activeVoiceCount,
  voiceStealIndicatorActive,
  activeEffectIds,
  onSetHelpText,
  onClearHelpText,
}) => {

  const getPropsForEffect = (effectId: string) => {
    const commonProps = {
        onRequestLearn,
        paramIdToLearn,
        modulatedParamIds: params.modulatedParamIds,
        onSetHelpText,
        onClearHelpText,
        globalMidiLearnActive: params.globalMidiLearnActive, // Pass down globalMidiLearnActive
    };
    switch (effectId) {
      case 'oscillators': return { ...commonProps, params: params.oscParams, onChange: handlers.handleOscParamsChange, wavetableOptions: params.wavetableOptions, onCustomWavLoad: handlers.onCustomWavLoad, userLoadedWavetableNames: params.userLoadedWavetableNames };
      case 'filter-lfo': return { ...commonProps, filterParams: params.filterParams, lfoParams: params.lfoParams, onFilterChange: handlers.handleFilterParamsChange, onLfoChange: handlers.handleLfoParamsChange };
      case 'envelope': return { ...commonProps, params: params.envParams, onChange: handlers.handleEnvParamsChange };
      case 'visuals': return { ...commonProps, params: params.visualsParams, onChange: handlers.handleVisualsParamsChange };
      case 'delay': return { ...commonProps, params: params.delayParams, onChange: handlers.handleDelayParamsChange, delaySendInputAnalyser: appAnalysers.delaySendInputAnalyser };
      case 'reverb': return { ...commonProps, params: params.reverbParams, onChange: handlers.handleReverbParamsChange, reverbSendInputAnalyser: appAnalysers.reverbSendInputAnalyser };
      case 'ringmod': return { ...commonProps, params: params.ringModParams, onChange: handlers.handleRingModParamsChange, analyserNode: insertEffectAnalysers.get('ringmod') };
      case 'waveshaper': return { ...commonProps, params: params.waveshaperParams, onChange: handlers.handleWaveshaperParamsChange, analyserNode: insertEffectAnalysers.get('waveshaper') };
      case 'stereowidth': return { ...commonProps, params: params.stereoWidthParams, onChange: handlers.handleStereoWidthParamsChange, analyserNode: insertEffectAnalysers.get('stereowidth') };
      case 'noise': return { ...commonProps, params: params.noiseParams, onChange: handlers.handleNoiseParamsChange };
      case 'overdrive': return { ...commonProps, params: params.overdriveParams, onChange: handlers.handleOverdriveParamsChange, analyserNode: insertEffectAnalysers.get('overdrive') };
      case 'lowpassInsert': return { ...commonProps, params: params.lowPassFilterInsertParams, onChange: handlers.handleLowPassFilterInsertParamsChange, analyserNode: insertEffectAnalysers.get('lowpassInsert') };
      case 'highpassInsert': return { ...commonProps, params: params.highPassFilterInsertParams, onChange: handlers.handleHighPassFilterInsertParamsChange, analyserNode: insertEffectAnalysers.get('highpassInsert') };
      case 'bandpassInsert': return { ...commonProps, params: params.bandPassFilterInsertParams, onChange: handlers.handleBandPassFilterInsertParamsChange, analyserNode: insertEffectAnalysers.get('bandpassInsert') };
      case 'notchInsert': return { ...commonProps, params: params.notchFilterInsertParams, onChange: handlers.handleNotchFilterInsertParamsChange, analyserNode: insertEffectAnalysers.get('notchInsert') };
      case 'compressor': return { ...commonProps, params: params.compressorParams, onChange: handlers.handleCompressorParamsChange, analyserNode: insertEffectAnalysers.get('compressor') };
      case 'threeBandEq': return { ...commonProps, params: params.threeBandEqParams, onChange: handlers.handleThreeBandEqParamsChange, analyserNode: insertEffectAnalysers.get('threeBandEq') };
      case 'ladderFilter': return { ...commonProps, params: params.ladderFilterParams, onChange: handlers.handleLadderFilterParamsChange, analyserNode: insertEffectAnalysers.get('ladderFilter') };
      case 'modMatrix': return { ...commonProps, params: params.modMatrixParams, onChange: handlers.handleModMatrixParamsChange };
      case 'presets': return { ...commonProps, presets, currentPresetName, isPresetDirty, onSave: handlers.saveCurrentPreset, onLoad: handlers.loadPreset, onDelete: handlers.deletePreset, onInitialize: handlers.initializePreset, onCurrentNameChange: handlers.setCurrentPresetName };
      case 'performance': return { ...commonProps, userMaxPolyphony: params.userMaxPolyphony, onUserMaxPolyphonyChange: handlers.handleUserMaxPolyphonyChange, activeVoiceCount, voiceStealIndicatorActive };
      case 'globalBpm': return { ...commonProps, bpm: params.globalBpm, onBpmChange: handlers.handleGlobalBpmChange };
      case 'midiMappings': return { ...commonProps, mappings: params.midiMappings, onDeleteMapping: handlers.handleDeleteMidiMapping };
      default: return commonProps;
    }
  };

  return (
    <aside className="right-effects-sidebar custom-scrollbar">
      <div className="space-y-2">
        {availableEffects.map((effect) => {
          const SpecificControlPanel = componentMap[effect.id];
          if (!SpecificControlPanel) return null;

          return (
            <EffectAccordionItem
              key={effect.id}
              id={effect.id}
              title={effect.title}
              isOpen={activeEffectIds.has(effect.id)}
              onToggle={() => onToggleEffect(effect.id)}
            >
              <SpecificControlPanel {...getPropsForEffect(effect.id)} />
            </EffectAccordionItem>
          );
        })}
      </div>
    </aside>
  );
};