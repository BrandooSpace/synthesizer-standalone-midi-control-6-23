import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import {
  OscillatorParams, FilterParams, LfoParams, EnvelopeParams, VisualsParams, DelayParams, Waveform,
  ReverbParams, RingModParams, WaveshaperParams, StereoWidthParams, NoiseParams,
  EffectWindowConfig, NoteDetails, MasterMixerParams, KeyMap, OverdriveParams, LowPassFilterInsertParams,
  HighPassFilterInsertParams, BandPassFilterInsertParams, NotchFilterInsertParams, InsertEffectId,
  CompressorParams, ThreeBandEqParams, LadderFilterParams, ModMatrixParams, SynthPreset,
  MidiMappings, MidiMappingEntry, ModSource, ModDestination, LfoTarget, UserWavetable, WavetableOption,
  CategorizedSidebarEffectGroup, MidiDeviceRole, DetectedMidiDevice, MidiDeviceAssignments 
} from './types';
import {
  DEFAULT_OSCILLATOR_PARAMS, DEFAULT_FILTER_PARAMS, DEFAULT_LFO_PARAMS, DEFAULT_ENVELOPE_PARAMS,
  DEFAULT_VISUALS_PARAMS, DEFAULT_DELAY_PARAMS, DEFAULT_REVERB_PARAMS, WAVETABLE_OPTIONS,
  DEFAULT_RING_MOD_PARAMS, DEFAULT_WAVESHAPER_PARAMS, DEFAULT_STEREO_WIDTH_PARAMS, DEFAULT_NOISE_PARAMS,
  DEFAULT_MASTER_MIXER_PARAMS, DEFAULT_OVERDRIVE_PARAMS, DEFAULT_LOW_PASS_FILTER_INSERT_PARAMS,
  DEFAULT_HIGH_PASS_FILTER_INSERT_PARAMS, DEFAULT_BAND_PASS_FILTER_INSERT_PARAMS, DEFAULT_NOTCH_FILTER_INSERT_PARAMS,
  DEFAULT_COMPRESSOR_PARAMS, DEFAULT_THREE_BAND_EQ_PARAMS, DEFAULT_LADDER_FILTER_PARAMS,
  DEFAULT_MOD_MATRIX_PARAMS, DEFAULT_USER_MAX_POLYPHONY, DEFAULT_MIDI_MAPPINGS, DEFAULT_GLOBAL_BPM,
  KEY_MAP, OCTAVE_RANGE, INSERT_EFFECT_DEFINITIONS, EQ_EFFECT_WINDOW_WIDTH, MOD_MATRIX_WINDOW_WIDTH,
  DEFAULT_PRESET_NAME, LOCAL_STORAGE_PRESET_KEY, MAX_POLYPHONY, PREDEFINED_SIDEBAR_LAYOUTS,
  OSCILLOSCOPE_DRAW_HOLD_TIME_MS, DEFAULT_TABLE_SIZE,
  DEFAULT_MIDI_DEVICE_ASSIGNMENTS, LOCAL_STORAGE_MIDI_ASSIGNMENTS_KEY 
} from './constants';
import { Sidebar } from './components/Sidebar';
import { RightEffectsSidebar } from './components/RightEffectsSidebar';
import { OscillatorControls } from './components/controlPanels/OscillatorControls';
import { FilterLfoControls } from './components/controlPanels/FilterLfoControls';
import { EnvelopeControls } from './components/controlPanels/EnvelopeControls';
import { VisualsControls } from './components/controlPanels/VisualsControls';
import { DelayControls } from './components/controlPanels/DelayControls';
import { ReverbControls } from './components/controlPanels/ReverbControls';
import { RingModControls } from './components/controlPanels/RingModControls';
import { WaveshaperControls } from './components/controlPanels/WaveshaperControls';
import { StereoWidthControls } from './components/controlPanels/StereoWidthControls';
import { NoiseControls } from './components/controlPanels/NoiseControls';
import { OverdriveControls } from './components/controlPanels/OverdriveControls';
import { LowPassFilterInsertControls } from './components/controlPanels/LowPassFilterInsertControls';
import { HighPassFilterInsertControls } from './components/controlPanels/HighPassFilterInsertControls';
import { BandPassFilterInsertControls } from './components/controlPanels/BandPassFilterInsertControls';
import { NotchFilterInsertControls } from './components/controlPanels/NotchFilterInsertControls';
import { CompressorControls } from './components/controlPanels/CompressorControls';
import { ThreeBandEqControls } from './components/controlPanels/ThreeBandEqControls';
import { LadderFilterControls } from './components/controlPanels/LadderFilterControls';
import { ModulationMatrixControls } from './components/controlPanels/ModulationMatrixControls';
import { PresetControls } from './components/controlPanels/PresetControls';
import { PerformanceControls } from './components/controlPanels/PerformanceControls';
import { GlobalBpmControls } from './components/controlPanels/GlobalBpmControls';
import { MidiMappingControls } from './components/controlPanels/MidiMappingControls';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { OscilloscopeCanvas } from './components/OscilloscopeCanvas';
import { Button } from './components/ui/Button';
import { TopBar } from './components/ui/TopBar';
import { MasterMixerPanel } from './components/MasterMixerPanel';
import { HelpDisplayBox } from './components/ui/HelpDisplayBox';
import { SettingsModal } from './components/ui/SettingsModal';

interface AppAnalysersState {
  masterPreLimiterAnalyser: AnalyserNode | null;
  masterPostLimiterAnalyser: AnalyserNode | null;
  preInsertChainAnalyser: AnalyserNode | null;
  delaySendInputAnalyser: AnalyserNode | null;
  reverbSendInputAnalyser: AnalyserNode | null;
}

const HELP_BOX_HEIGHT_REM = 2.5; 
const DEFAULT_HELP_TEXT = "Hover over a control to see its description.";
const THROTTLE_DELAY_MS = 16; // Approx 60 FPS for smoother updates


const resampleLinear = (originalSamples: Float32Array, targetLength: number): Float32Array => {
  if (!originalSamples || originalSamples.length === 0) {
    return new Float32Array(targetLength).fill(0);
  }
  if (originalSamples.length === targetLength) {
    return originalSamples;
  }

  const resampledSamples = new Float32Array(targetLength);
  const ratio = (originalSamples.length - 1) / (targetLength - 1);

  if (targetLength === 1 && originalSamples.length > 0) { 
    resampledSamples[0] = originalSamples[0];
    return resampledSamples;
  }
   if (originalSamples.length === 1) { 
    resampledSamples.fill(originalSamples[0]);
    return resampledSamples;
  }

  for (let i = 0; i < targetLength; i++) {
    const srcIdxFloat = i * ratio;
    const srcIdx1 = Math.floor(srcIdxFloat);
    const srcIdx2 = Math.min(originalSamples.length - 1, srcIdx1 + 1); 
    const t = srcIdxFloat - srcIdx1;
    if (srcIdx1 >= originalSamples.length) { 
        resampledSamples[i] = originalSamples[originalSamples.length - 1];
        continue;
    }
    if (srcIdx1 === srcIdx2 || srcIdx1 === originalSamples.length -1 ) { 
      resampledSamples[i] = originalSamples[srcIdx1];
    } else {
      resampledSamples[i] = originalSamples[srcIdx1] * (1 - t) + originalSamples[srcIdx2] * t;
    }
  }
  return resampledSamples;
};


const App: React.FC = () => {
  const [audioEngine, setAudioEngine] = useState<AudioEngine | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Parameter States
  const [oscParams, setOscParams] = useState<OscillatorParams>(DEFAULT_OSCILLATOR_PARAMS);
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);
  const [lfoParams, setLfoParams] = useState<LfoParams>(DEFAULT_LFO_PARAMS);
  const [envParams, setEnvParams] = useState<EnvelopeParams>(DEFAULT_ENVELOPE_PARAMS);
  const [visualsParams, setVisualsParams] = useState<VisualsParams>(DEFAULT_VISUALS_PARAMS);
  const [delayParams, setDelayParams] = useState<DelayParams>(DEFAULT_DELAY_PARAMS);
  const [reverbParams, setReverbParams] = useState<ReverbParams>(DEFAULT_REVERB_PARAMS);
  const [ringModParams, setRingModParams] = useState<RingModParams>(DEFAULT_RING_MOD_PARAMS);
  const [waveshaperParams, setWaveshaperParams] = useState<WaveshaperParams>(DEFAULT_WAVESHAPER_PARAMS);
  const [stereoWidthParams, setStereoWidthParams] = useState<StereoWidthParams>(DEFAULT_STEREO_WIDTH_PARAMS);
  const [noiseParams, setNoiseParams] = useState<NoiseParams>(DEFAULT_NOISE_PARAMS);
  const [masterMixerParams, setMasterMixerParams] = useState<MasterMixerParams>(DEFAULT_MASTER_MIXER_PARAMS);
  const [overdriveParams, setOverdriveParams] = useState<OverdriveParams>(DEFAULT_OVERDRIVE_PARAMS);
  const [lowPassFilterInsertParams, setLowPassFilterInsertParams] = useState<LowPassFilterInsertParams>(DEFAULT_LOW_PASS_FILTER_INSERT_PARAMS);
  const [highPassFilterInsertParams, setHighPassFilterInsertParams] = useState<HighPassFilterInsertParams>(DEFAULT_HIGH_PASS_FILTER_INSERT_PARAMS);
  const [bandPassFilterInsertParams, setBandPassFilterInsertParams] = useState<BandPassFilterInsertParams>(DEFAULT_BAND_PASS_FILTER_INSERT_PARAMS);
  const [notchFilterInsertParams, setNotchFilterInsertParams] = useState<NotchFilterInsertParams>(DEFAULT_NOTCH_FILTER_INSERT_PARAMS);
  const [compressorParams, setCompressorParams] = useState<CompressorParams>(DEFAULT_COMPRESSOR_PARAMS);
  const [threeBandEqParams, setThreeBandEqParams] = useState<ThreeBandEqParams>(DEFAULT_THREE_BAND_EQ_PARAMS);
  const [ladderFilterParams, setLadderFilterParams] = useState<LadderFilterParams>(DEFAULT_LADDER_FILTER_PARAMS);
  const [modMatrixParams, setModMatrixParams] = useState<ModMatrixParams>(DEFAULT_MOD_MATRIX_PARAMS);
  const [userMaxPolyphony, setUserMaxPolyphony] = useState<number>(DEFAULT_USER_MAX_POLYPHONY);
  const [globalBpm, setGlobalBpm] = useState<number>(DEFAULT_GLOBAL_BPM);
  const [modWheelValue, setModWheelValue] = useState<number>(0);
  const [userWavetables, setUserWavetables] = useState<Record<string, UserWavetable>>({});
  const [userLoadedWavetableNames, setUserLoadedWavetableNames] = useState<{ x?: string, y?: string }>({});

  // Analyser and UI States
  const [appAnalysers, setAppAnalysers] = useState<AppAnalysersState>({ masterPreLimiterAnalyser: null, masterPostLimiterAnalyser: null, preInsertChainAnalyser: null, delaySendInputAnalyser: null, reverbSendInputAnalyser: null });
  const [insertEffectAnalysers, setInsertEffectAnalysers] = useState<Map<InsertEffectId, AnalyserNode | null>>(new Map());
  const [areSidebarsVisible, setAreSidebarsVisible] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [octave, setOctave] = useState<number>(0);
  const [activeEffectsInSidebar, setActiveEffectsInSidebar] = useState<Set<string>>(new Set(['oscillators']));
  const [isOscilloscopeDrawingActive, setIsOscilloscopeDrawingActive] = useState(false);
  const oscilloscopeHoldTimerRef = useRef<number | null>(null);
  const [currentHelpText, setCurrentHelpText] = useState<string>(DEFAULT_HELP_TEXT);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  // MIDI States
  const [isMidiSystemInitialized, setIsMidiSystemInitialized] = useState(false);
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const activeMidiInputsRef = useRef<Map<string, MIDIInput>>(new Map());
  const [detectedMidiInputs, setDetectedMidiInputs] = useState<DetectedMidiDevice[]>([]);
  const [midiDeviceAssignments, setMidiDeviceAssignments] = useState<MidiDeviceAssignments>(DEFAULT_MIDI_DEVICE_ASSIGNMENTS);
  const [isMidiSystemReady, setIsMidiSystemReady] = useState(false); 
  const [globalClipActive, setGlobalClipActive] = useState(false);
  const globalClipTimeoutRef = useRef<number | null>(null);
  const [showMidiLearnBanner, setShowMidiLearnBanner] = useState(false);
  const [midiLearnTargetDeviceName, setMidiLearnTargetDeviceName] = useState<string | null>(null);
  const [midiMappings, setMidiMappings] = useState<MidiMappings>(DEFAULT_MIDI_MAPPINGS);
  const [midiLearnActive, setMidiLearnActive] = useState<boolean>(false);
  const [paramIdToLearn, setParamIdToLearn] = useState<string | null>(null);
  const [paramMinMaxToLearn, setParamMinMaxToLearn] = useState<{min: number, max: number} | null>(null);

  // Voice and Preset States
  const [activeVoiceCount, setActiveVoiceCount] = useState<number>(0);
  const [voiceStealIndicatorActive, setVoiceStealIndicatorActive] = useState<boolean>(false);
  const voiceStealTimeoutRef = useRef<number | null>(null);
  const [presets, setPresets] = useState<SynthPreset[]>([]);
  const [currentPresetName, setCurrentPresetName] = useState<string>(DEFAULT_PRESET_NAME);
  const [isPresetDirty, setIsPresetDirty] = useState<boolean>(false);
  
  // Performance and Modulation States
  const [modulatedParamIds, setModulatedParamIds] = useState<Set<string>>(new Set());
  const [masterVolumeTrimDb, setMasterVolumeTrimDb] = useState<number>(0);
  const [currentSampleRate, setCurrentSampleRate] = useState<number>(0);
  const [isMasterLimiterEnabled, setIsMasterLimiterEnabled] = useState<boolean>(true);
  const [limiterThresholdDb, setLimiterThresholdDb] = useState<number>(-6);
  const throttledParamUpdatesRef = useRef<Record<string, { value: number; sourceDeviceId?: string }>>({});
  const throttleTimeoutRef = useRef<number | null>(null);

  // Show a non-blocking notification
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

  useEffect(() => {
    const savedAssignments = localStorage.getItem(LOCAL_STORAGE_MIDI_ASSIGNMENTS_KEY);
    if (savedAssignments) {
      try {
        setMidiDeviceAssignments(JSON.parse(savedAssignments));
      } catch (e) {
        console.error("Failed to parse MIDI assignments from localStorage", e);
      }
    }
  }, []);
  
  useEffect(() => {
    const hasAssignedDevice = Object.values(midiDeviceAssignments).some(
      role => role === MidiDeviceRole.KEYBOARD || role === MidiDeviceRole.CONTROL_SURFACE
    );
    setIsMidiSystemReady(isMidiSystemInitialized && hasAssignedDevice);
  }, [isMidiSystemInitialized, midiDeviceAssignments]);

  const handleSetHelpText = useCallback((text: string) => { setCurrentHelpText(text); }, []);
  const handleClearHelpText = useCallback(() => { setCurrentHelpText(DEFAULT_HELP_TEXT); }, []);
  const handleToggleSettingsModal = useCallback(() => { setIsSettingsModalOpen(prev => !prev);}, []);
  const handleMasterVolumeTrimDbChange = useCallback((newTrimDb: number) => { setMasterVolumeTrimDb(newTrimDb); audioEngine?.setMasterVolumeTrimDb(newTrimDb);}, [audioEngine]);
  const handleToggleMasterLimiter = useCallback(() => { setIsMasterLimiterEnabled(prev => { const newState = !prev; audioEngine?.setMasterLimiterEnabled(newState); return newState; }); }, [audioEngine]);
  const handleLimiterThresholdDbChange = useCallback((newThresholdDb: number) => { setLimiterThresholdDb(newThresholdDb); audioEngine?.setMasterLimiterThreshold(newThresholdDb);}, [audioEngine]);


  useEffect(() => {
    const newModulatedIds = new Set<string>();
    if (lfoParams.target !== LfoTarget.OFF && lfoParams.depth !== 0 && filterParams.isFilterEnabled) {
        switch (lfoParams.target) {
            case LfoTarget.PITCH_X: newModulatedIds.add('osc.xRatio'); break;
            case LfoTarget.PITCH_Y: newModulatedIds.add('osc.yRatio'); break;
            case LfoTarget.PITCH_XY: newModulatedIds.add('osc.xRatio'); newModulatedIds.add('osc.yRatio'); break;
            case LfoTarget.FILTER_X: case LfoTarget.FILTER_Y: case LfoTarget.FILTER_XY: newModulatedIds.add('filter.cutoffFrequency'); break;
            case LfoTarget.PHASE: newModulatedIds.add('osc.phaseShift'); break;
            case LfoTarget.OSC_X_WAVETABLE_POS: newModulatedIds.add('osc.wavetablePositionX'); break;
            case LfoTarget.OSC_Y_WAVETABLE_POS: newModulatedIds.add('osc.wavetablePositionY'); break;
        }
    }
    if (modMatrixParams.isEnabled) {
        modMatrixParams.slots.forEach(slot => {
            if (slot.isEnabled && slot.source !== ModSource.NONE && slot.destination !== ModDestination.NONE && slot.amount !== 0) {
                switch (slot.destination) {
                    case ModDestination.OSC_X_PITCH: newModulatedIds.add('osc.xRatio'); break;
                    case ModDestination.OSC_Y_PITCH: newModulatedIds.add('osc.yRatio'); break;
                    case ModDestination.OSC_XY_PITCH: newModulatedIds.add('osc.xRatio'); newModulatedIds.add('osc.yRatio'); break;
                    case ModDestination.OSC_X_RATIO: newModulatedIds.add('osc.xRatio'); break; 
                    case ModDestination.OSC_Y_RATIO: newModulatedIds.add('osc.yRatio'); break; 
                    case ModDestination.OSC_Y_PHASE: newModulatedIds.add('osc.phaseShift'); break;
                    case ModDestination.OSC_X_WAVETABLE_POS: newModulatedIds.add('osc.wavetablePositionX'); break;
                    case ModDestination.OSC_Y_WAVETABLE_POS: newModulatedIds.add('osc.wavetablePositionY'); break;
                    case ModDestination.FILTER_X_CUTOFF: case ModDestination.FILTER_Y_CUTOFF: case ModDestination.FILTER_XY_CUTOFF: newModulatedIds.add('filter.cutoffFrequency'); break;
                    case ModDestination.LFO1_RATE: newModulatedIds.add('lfo.rate'); break;
                    case ModDestination.LFO1_DEPTH: newModulatedIds.add('lfo.depth'); break;
                    case ModDestination.ENV1_ATTACK: newModulatedIds.add('env.attack'); break;
                    case ModDestination.ENV1_DECAY: newModulatedIds.add('env.decay'); break;
                    case ModDestination.ENV1_SUSTAIN: newModulatedIds.add('env.sustain'); break;
                    case ModDestination.ENV1_RELEASE: newModulatedIds.add('env.release'); break;
                }
            }
        });
    }
    setModulatedParamIds(newModulatedIds);
  }, [lfoParams, modMatrixParams, filterParams.isFilterEnabled, envParams]); 

  const allAvailableEffects = useMemo<EffectWindowConfig[]>(() => [
    { id: 'oscillators', title: 'OSCILLATORS', component: OscillatorControls },
    { id: 'filter-lfo', title: 'FILTER / LFO', component: FilterLfoControls },
    { id: 'envelope', title: 'ENVELOPE / VCA', component: EnvelopeControls },
    { id: 'noise', title: 'NOISE GENERATOR', component: NoiseControls },
    { id: 'modMatrix', title: 'MODULATION MATRIX', component: ModulationMatrixControls, width: MOD_MATRIX_WINDOW_WIDTH },
    { id: 'masterMixer', title: 'MASTER MIXER & ROUTING', component: () => <></> },
    { id: 'presets', title: 'PRESET MANAGER', component: PresetControls },
    { id: 'performance', title: 'PERFORMANCE', component: PerformanceControls },
    { id: 'globalBpm', title: 'GLOBAL BPM', component: GlobalBpmControls, width: 220 },
    { id: 'visuals', title: 'VISUALS', component: VisualsControls },
    { id: 'delay', title: 'STEREO DELAY (Send 1)', component: DelayControls },
    { id: 'reverb', title: 'CONVOLUTION REVERB (Send 2)', component: ReverbControls },
    { id: 'ringmod', title: 'RING MODULATOR (Insert)', component: RingModControls },
    { id: 'lowpassInsert', title: 'LOW-PASS FILTER (Insert)', component: LowPassFilterInsertControls },
    { id: 'highpassInsert', title: 'HIGH-PASS FILTER (Insert)', component: HighPassFilterInsertControls },
    { id: 'bandpassInsert', title: 'BAND-PASS FILTER (Insert)', component: BandPassFilterInsertControls },
    { id: 'notchInsert', title: 'NOTCH FILTER (Insert)', component: NotchFilterInsertControls },
    { id: 'waveshaper', title: 'WAVESHAPER (Insert)', component: WaveshaperControls },
    { id: 'overdrive', title: 'OVERDRIVE/DISTORTION (Insert)', component: OverdriveControls },
    { id: 'compressor', title: 'COMPRESSOR (Insert)', component: CompressorControls },
    { id: 'threeBandEq', title: '3-BAND EQ (Insert)', component: ThreeBandEqControls, width: EQ_EFFECT_WINDOW_WIDTH },
    { id: 'ladderFilter', title: '"MOOG" LADDER FILTER (Insert)', component: LadderFilterControls },
    { id: 'stereowidth', title: 'STEREO WIDTH (Insert)', component: StereoWidthControls },
    { id: 'midiMappings', title: 'MIDI MAPPINGS', component: MidiMappingControls },
  ], []);

  const sidebarAvailableEffects = useMemo(() => allAvailableEffects, [allAvailableEffects]);

  const categorizedSidebarEffects = useMemo<CategorizedSidebarEffectGroup[]>(() => {
    const mainSynthesisIds = new Set(['oscillators', 'filter-lfo', 'envelope', 'noise', 'modMatrix']);
    const insertEffectIds = new Set<string>(INSERT_EFFECT_DEFINITIONS.map(def => def.id));
    const sendEffectIds = new Set(['delay', 'reverb']);
    const mainSynthesisEffects = sidebarAvailableEffects.filter(e => mainSynthesisIds.has(e.id));
    const insertEffects = sidebarAvailableEffects.filter(e => insertEffectIds.has(e.id));
    const sendEffects = sidebarAvailableEffects.filter(e => sendEffectIds.has(e.id));
    const globalUtilityEffects = sidebarAvailableEffects.filter(e => !mainSynthesisIds.has(e.id) && !insertEffectIds.has(e.id) && !sendEffectIds.has(e.id));
    const categories: CategorizedSidebarEffectGroup[] = [];
    if (mainSynthesisEffects.length > 0) categories.push({ categoryName: 'MAIN SYNTHESIS', effects: mainSynthesisEffects, defaultOpen: true });
    if (insertEffects.length > 0) categories.push({ categoryName: 'INSERT EFFECTS', effects: insertEffects });
    if (sendEffects.length > 0) categories.push({ categoryName: 'SEND EFFECTS', effects: sendEffects });
    if (globalUtilityEffects.length > 0) categories.push({ categoryName: 'GLOBAL & UTILITY', effects: globalUtilityEffects });
    return categories;
  }, [sidebarAvailableEffects]);

  const toggleEffectInSidebar = useCallback((effectId: string) => { setActiveEffectsInSidebar(prev => { const newSet = new Set(prev); if (newSet.has(effectId)) newSet.delete(effectId); else newSet.add(effectId); return newSet; }); }, []);
  const applySidebarLayout = useCallback((layoutKey: string) => { const layout = PREDEFINED_SIDEBAR_LAYOUTS[layoutKey]; if (layout) { const effectsToActivate = layout.effects.filter(id => id !== 'masterMixer'); setActiveEffectsInSidebar(new Set(effectsToActivate)); } }, []);
  const handleVoiceCountChange = useCallback((count: number) => { setActiveVoiceCount(count); }, []);
  const handleVoiceSteal = useCallback(() => { setVoiceStealIndicatorActive(true); if (voiceStealTimeoutRef.current) clearTimeout(voiceStealTimeoutRef.current); voiceStealTimeoutRef.current = window.setTimeout(() => setVoiceStealIndicatorActive(false), 500); }, []);
  
  // UNISON BUG FIX: This handler now ONLY sets state.
  const handleOscParamsChange = useCallback((newParams: OscillatorParams | ((prev: OscillatorParams) => OscillatorParams)) => {
    setOscParams(newParams);
    setIsPresetDirty(true);
  }, []);

  // UNISON BUG FIX: This useEffect pushes the confirmed state to the audio engine.
  useEffect(() => {
    audioEngine?.updateOscillatorParams(oscParams);
  }, [oscParams, audioEngine]);


  const initAudio = useCallback(async () => {
    if (isAudioInitialized) return;
    try {
      const engine = new AudioEngine(oscParams, filterParams, lfoParams, envParams, delayParams, reverbParams, ringModParams, waveshaperParams, stereoWidthParams, noiseParams, masterMixerParams, overdriveParams, lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams, notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams, userMaxPolyphony, handleVoiceCountChange, handleVoiceSteal, globalBpm, userWavetables);
      const success = await engine.init();
      if (success) {
        setAudioEngine(engine); setIsAudioInitialized(true);
        const fetchedAnalysers = engine.getAnalysers();
        setAppAnalysers({ masterPreLimiterAnalyser: fetchedAnalysers.masterPreLimiterAnalyser, masterPostLimiterAnalyser: fetchedAnalysers.masterPostLimiterAnalyser, preInsertChainAnalyser: fetchedAnalysers.preInsertChainAnalyser, delaySendInputAnalyser: fetchedAnalysers.delaySendInputAnalyser, reverbSendInputAnalyser: fetchedAnalysers.reverbSendInputAnalyser });
        setCurrentSampleRate(engine.getSampleRate());
        engine.setMasterVolumeTrimDb(masterVolumeTrimDb); engine.setMasterLimiterEnabled(isMasterLimiterEnabled); engine.setMasterLimiterThreshold(limiterThresholdDb);
        const newInsertAnalysers = new Map<InsertEffectId, AnalyserNode | null>();
        INSERT_EFFECT_DEFINITIONS.forEach(def => { const effectId = def.id as InsertEffectId; if (engine.isInsertEffect(effectId)) newInsertAnalysers.set(effectId, engine.getInsertEffectAnalyser(effectId)); });
        setInsertEffectAnalysers(newInsertAnalysers);
      } else { showNotification('Failed to initialize Web Audio API. Please use a modern browser.', 'error'); }
    } catch(e) {
      showNotification(`Audio engine failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  }, [isAudioInitialized, oscParams, filterParams, lfoParams, envParams, delayParams, reverbParams, ringModParams, waveshaperParams, stereoWidthParams, noiseParams, masterMixerParams, overdriveParams, lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams, notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams, userMaxPolyphony, globalBpm, handleVoiceCountChange, handleVoiceSteal, masterVolumeTrimDb, isMasterLimiterEnabled, limiterThresholdDb, userWavetables, showNotification]);

  useEffect(() => { if (audioEngine) audioEngine.updateUserWavetables(userWavetables); }, [userWavetables, audioEngine]);
  const handleCustomWavLoad = useCallback(async (file: File, oscType: 'X' | 'Y') => {
    if (!audioEngine || !audioEngine.isInitialized()) { showNotification("Audio engine not ready for loading wavetables.", 'error'); return; }
    const tempAudioContext = new AudioContext();
    try {
      const arrayBuffer = await file.arrayBuffer(); const decodedBuffer = await tempAudioContext.decodeAudioData(arrayBuffer); await tempAudioContext.close();
      const rawSamples = decodedBuffer.getChannelData(0); const resampledSamples = resampleLinear(rawSamples, DEFAULT_TABLE_SIZE);
      const tableId = `user_osc${oscType}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const newUserWavetable: UserWavetable = { id: tableId, name: file.name, data: resampledSamples };
      setUserWavetables(prev => ({ ...prev, [tableId]: newUserWavetable })); setUserLoadedWavetableNames(prev => ({ ...prev, [oscType.toLowerCase()]: file.name }));
      handleOscParamsChange(prevOscParams => { const newOscParams = { ...prevOscParams, ...(oscType === 'X' ? { waveformX: Waveform.WAVETABLE, wavetableX: tableId } : {}), ...(oscType === 'Y' ? { waveformY: Waveform.WAVETABLE, wavetableY: tableId } : {}), }; return newOscParams; });
      showNotification(`Loaded and resampled "${file.name}" for Oscillator ${oscType}.`);
    } catch (error) { console.error("Error loading or decoding custom WAV:", error); showNotification(`Failed to load custom WAV: ${error instanceof Error ? error.message : String(error)}`, 'error'); if (tempAudioContext.state !== 'closed') await tempAudioContext.close(); }
  }, [audioEngine, showNotification, handleOscParamsChange]); 
  const dynamicWavetableOptions = useMemo<WavetableOption[]>(() => { const builtInOptions = WAVETABLE_OPTIONS.map(opt => ({ ...opt, isUser: false })); const userOptions: WavetableOption[] = Object.values(userWavetables).map(uw => ({ value: uw.id, label: `User: ${uw.name}`, isUser: true, })); return [...builtInOptions, ...userOptions]; }, [userWavetables]);
  const handleFilterParamsChange = useCallback((newParams: FilterParams | ((prev: FilterParams) => FilterParams)) => { setFilterParams(newParams); audioEngine?.updateFilterParams(typeof newParams === 'function' ? newParams(filterParams) : newParams); setIsPresetDirty(true); }, [audioEngine, filterParams]);
  const handleLfoParamsChange = useCallback((newParams: LfoParams | ((prev: LfoParams) => LfoParams)) => { setLfoParams(newParams); audioEngine?.updateLfoParams(typeof newParams === 'function' ? newParams(lfoParams) : newParams); setIsPresetDirty(true); }, [audioEngine, lfoParams]);
  const handleEnvParamsChange = useCallback((newParams: EnvelopeParams | ((prev: EnvelopeParams) => EnvelopeParams)) => { setEnvParams(newParams); audioEngine?.updateEnvelopeParams(typeof newParams === 'function' ? newParams(envParams) : newParams); setIsPresetDirty(true); }, [audioEngine, envParams]);
  const handleVisualsParamsChange = useCallback((newParams: VisualsParams) => { setVisualsParams(newParams); setIsPresetDirty(true);}, []);
  const handleDelayParamsChange = useCallback((newParams: DelayParams | ((prev: DelayParams) => DelayParams)) => { setDelayParams(newParams); audioEngine?.updateDelayParams(typeof newParams === 'function' ? newParams(delayParams) : newParams); setIsPresetDirty(true); }, [audioEngine, delayParams]);
  const handleReverbParamsChange = useCallback((newParams: ReverbParams | ((prev: ReverbParams) => ReverbParams)) => { setReverbParams(newParams); audioEngine?.updateReverbParams(typeof newParams === 'function' ? newParams(reverbParams) : newParams); setIsPresetDirty(true); }, [audioEngine, reverbParams]);
  const handleRingModParamsChange = useCallback((newParams: RingModParams | ((prev: RingModParams) => RingModParams)) => { setRingModParams(newParams); audioEngine?.updateRingModParams(typeof newParams === 'function' ? newParams(ringModParams) : newParams); setIsPresetDirty(true); }, [audioEngine, ringModParams]);
  const handleWaveshaperParamsChange = useCallback((newParams: WaveshaperParams | ((prev: WaveshaperParams) => WaveshaperParams)) => { setWaveshaperParams(newParams); audioEngine?.updateWaveshaperParams(typeof newParams === 'function' ? newParams(waveshaperParams) : newParams); setIsPresetDirty(true); }, [audioEngine, waveshaperParams]);
  const handleStereoWidthParamsChange = useCallback((newParams: StereoWidthParams | ((prev: StereoWidthParams) => StereoWidthParams)) => { setStereoWidthParams(newParams); audioEngine?.updateStereoWidthParams(typeof newParams === 'function' ? newParams(stereoWidthParams) : newParams); setIsPresetDirty(true); }, [audioEngine, stereoWidthParams]);
  const handleNoiseParamsChange = useCallback((newParams: NoiseParams | ((prev: NoiseParams) => NoiseParams)) => { setNoiseParams(newParams); audioEngine?.updateNoiseParams(typeof newParams === 'function' ? newParams(noiseParams) : newParams); setIsPresetDirty(true); }, [audioEngine, noiseParams]);
  const handleOverdriveParamsChange = useCallback((newParams: OverdriveParams | ((prev: OverdriveParams) => OverdriveParams)) => { setOverdriveParams(newParams); audioEngine?.updateOverdriveParams(typeof newParams === 'function' ? newParams(overdriveParams) : newParams); setIsPresetDirty(true); }, [audioEngine, overdriveParams]);
  const handleLowPassFilterInsertParamsChange = useCallback((newParams: LowPassFilterInsertParams | ((prev: LowPassFilterInsertParams) => LowPassFilterInsertParams)) => { setLowPassFilterInsertParams(newParams); audioEngine?.updateLowPassFilterInsertParams(typeof newParams === 'function' ? newParams(lowPassFilterInsertParams) : newParams); setIsPresetDirty(true); }, [audioEngine, lowPassFilterInsertParams]);
  const handleHighPassFilterInsertParamsChange = useCallback((newParams: HighPassFilterInsertParams | ((prev: HighPassFilterInsertParams) => HighPassFilterInsertParams)) => { setHighPassFilterInsertParams(newParams); audioEngine?.updateHighPassFilterInsertParams(typeof newParams === 'function' ? newParams(highPassFilterInsertParams) : newParams); setIsPresetDirty(true); }, [audioEngine, highPassFilterInsertParams]);
  const handleBandPassFilterInsertParamsChange = useCallback((newParams: BandPassFilterInsertParams | ((prev: BandPassFilterInsertParams) => BandPassFilterInsertParams)) => { setBandPassFilterInsertParams(newParams); audioEngine?.updateBandPassFilterInsertParams(typeof newParams === 'function' ? newParams(bandPassFilterInsertParams) : newParams); setIsPresetDirty(true); }, [audioEngine, bandPassFilterInsertParams]);
  const handleNotchFilterInsertParamsChange = useCallback((newParams: NotchFilterInsertParams | ((prev: NotchFilterInsertParams) => NotchFilterInsertParams)) => { setNotchFilterInsertParams(newParams); audioEngine?.updateNotchFilterInsertParams(typeof newParams === 'function' ? newParams(notchFilterInsertParams) : newParams); setIsPresetDirty(true); }, [audioEngine, notchFilterInsertParams]);
  const handleCompressorParamsChange = useCallback((newParams: CompressorParams | ((prev: CompressorParams) => CompressorParams)) => { setCompressorParams(newParams); audioEngine?.updateCompressorParams(typeof newParams === 'function' ? newParams(compressorParams) : newParams); setIsPresetDirty(true); }, [audioEngine, compressorParams]);
  const handleThreeBandEqParamsChange = useCallback((newParams: ThreeBandEqParams | ((prev: ThreeBandEqParams) => ThreeBandEqParams)) => { setThreeBandEqParams(newParams); audioEngine?.updateThreeBandEqParams(typeof newParams === 'function' ? newParams(threeBandEqParams) : newParams); setIsPresetDirty(true); }, [audioEngine, threeBandEqParams]);
  const handleLadderFilterParamsChange = useCallback((newParams: LadderFilterParams | ((prev: LadderFilterParams) => LadderFilterParams)) => { setLadderFilterParams(newParams); audioEngine?.updateLadderFilterParams(typeof newParams === 'function' ? newParams(ladderFilterParams) : newParams); setIsPresetDirty(true); }, [audioEngine, ladderFilterParams]);
  const handleModMatrixParamsChange = useCallback((newParams: ModMatrixParams | ((prev: ModMatrixParams) => ModMatrixParams)) => { setModMatrixParams(newParams); audioEngine?.updateModMatrixParams(typeof newParams === 'function' ? newParams(modMatrixParams) : newParams, modWheelValue); setIsPresetDirty(true); }, [audioEngine, modWheelValue, modMatrixParams]);
  const handleUserMaxPolyphonyChange = useCallback((newLimit: number) => { const clampedLimit = Math.max(1, Math.min(MAX_POLYPHONY, newLimit)); setUserMaxPolyphony(clampedLimit); audioEngine?.setUserMaxPolyphony(clampedLimit); setIsPresetDirty(true); }, [audioEngine]);
  const handleGlobalBpmChange = useCallback((newBpm: number) => { const clampedBpm = Math.max(20, Math.min(300, newBpm)); setGlobalBpm(clampedBpm); audioEngine?.updateGlobalBpm(clampedBpm); setIsPresetDirty(true); }, [audioEngine]);
  const handleMasterMixerParamsChange = useCallback((newParams: MasterMixerParams | ((prev: MasterMixerParams) => MasterMixerParams)) => { setMasterMixerParams(newParams); audioEngine?.updateMasterMixerParams(typeof newParams === 'function' ? newParams(masterMixerParams) : newParams); setIsPresetDirty(true); }, [audioEngine, masterMixerParams]);
  
  const dispatchParameterUpdate = useCallback((paramId: string, value: number) => {
    setIsPresetDirty(true);
    const [groupKey, fieldKey, indexStrOrSubKey, subFieldKeyIfPresent] = paramId.split('.');
    const boolValue = value > 0.5;
    
    switch (groupKey) {
        case 'osc':
            if (!['waveformX', 'waveformY', 'wavetableX', 'wavetableY'].includes(fieldKey)) {
                handleOscParamsChange(prev => ({ ...prev, [fieldKey]: value }));
            }
            break;
        case 'filter':
            handleFilterParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isFilterEnabled' ? boolValue : value }));
            break;
        case 'lfo':
            if (!['waveform', 'target', 'tempoSyncDivision'].includes(fieldKey)) {
                handleLfoParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isTempoSynced' ? boolValue : value }));
            }
            break;
        case 'env':
            handleEnvParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isEnvelopeEnabled' ? boolValue : value }));
            break;
        case 'delay':
            handleDelayParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isDelayEnabled' ? boolValue : value }));
            break;
        case 'reverb':
            handleReverbParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isReverbEnabled' ? boolValue : value }));
            break;
        case 'ringMod':
            handleRingModParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isRingModEnabled' ? boolValue : value }));
            break;
        case 'waveshaper':
            handleWaveshaperParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isWaveshaperEnabled' ? boolValue : value }));
            break;
        case 'stereoWidth':
            handleStereoWidthParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isStereoWidthEnabled' ? boolValue : value }));
            break;
        case 'noise':
            handleNoiseParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isNoiseEnabled' ? boolValue : value }));
            break;
        case 'overdrive':
            handleOverdriveParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isOverdriveEnabled' ? boolValue : value }));
            break;
        case 'lowPassInsert':
            handleLowPassFilterInsertParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isLowPassInsertEnabled' ? boolValue : value }));
            break;
        case 'highPassInsert':
            handleHighPassFilterInsertParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isHighPassInsertEnabled' ? boolValue : value }));
            break;
        case 'bandPassInsert':
            handleBandPassFilterInsertParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isBandPassInsertEnabled' ? boolValue : value }));
            break;
        case 'notchInsert':
            handleNotchFilterInsertParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isNotchInsertEnabled' ? boolValue : value }));
            break;
        case 'compressor':
            handleCompressorParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isCompressorEnabled' ? boolValue : value }));
            break;
        case 'ladderFilter':
            handleLadderFilterParamsChange(prev => ({ ...prev, [fieldKey]: fieldKey === 'isLadderFilterEnabled' ? boolValue : value }));
            break;
        case 'masterMixer':
            handleMasterMixerParamsChange(prev => ({ ...prev, [fieldKey]: value }));
            break;
        case 'performance':
            if (fieldKey === 'userMaxPolyphony') handleUserMaxPolyphonyChange(value);
            break;
        case 'global':
            if (fieldKey === 'bpm') handleGlobalBpmChange(value);
            break;
        case 'modMatrix':
            handleModMatrixParamsChange(prev => {
                if (fieldKey === 'slots' && indexStrOrSubKey && subFieldKeyIfPresent === 'amount') {
                    const slotIndex = parseInt(indexStrOrSubKey, 10);
                    const newSlots = [...prev.slots];
                    newSlots[slotIndex] = { ...newSlots[slotIndex], amount: value };
                    return { ...prev, slots: newSlots };
                }
                if (fieldKey === 'isEnabled') {
                    return { ...prev, isEnabled: boolValue };
                }
                return prev;
            });
            break;
        case 'threeBandEq':
            handleThreeBandEqParamsChange(prev => {
                if (fieldKey === 'isThreeBandEqEnabled') return { ...prev, isThreeBandEqEnabled: boolValue };
                if (fieldKey === 'outputLevel') return { ...prev, outputLevel: value };
                if (['lowShelf', 'midPeak', 'highShelf'].includes(fieldKey) && indexStrOrSubKey) {
                    const bandKey = fieldKey as 'lowShelf' | 'midPeak' | 'highShelf';
                    const actualSubFieldKey = indexStrOrSubKey;
                    const updatedBand = { ...prev[bandKey], [actualSubFieldKey]: value };
                    return { ...prev, [bandKey]: updatedBand };
                }
                return prev;
            });
            break;
        default:
            console.warn(`MIDI Learn: Unknown paramId group: ${groupKey}`);
    }
  }, [handleOscParamsChange, handleFilterParamsChange, handleLfoParamsChange, handleEnvParamsChange, handleDelayParamsChange, handleReverbParamsChange, handleRingModParamsChange, handleWaveshaperParamsChange, handleStereoWidthParamsChange, handleNoiseParamsChange, handleMasterMixerParamsChange, handleOverdriveParamsChange, handleLowPassFilterInsertParamsChange, handleHighPassFilterInsertParamsChange, handleBandPassFilterInsertParamsChange, handleNotchFilterInsertParamsChange, handleCompressorParamsChange, handleLadderFilterParamsChange, handleUserMaxPolyphonyChange, handleGlobalBpmChange, handleModMatrixParamsChange, handleThreeBandEqParamsChange ]);
  
  useEffect(() => { const savedPresets = localStorage.getItem(LOCAL_STORAGE_PRESET_KEY); if (savedPresets) setPresets(JSON.parse(savedPresets)); }, []);
  const saveCurrentPreset = useCallback((name: string) => {
    if (!name.trim()) { showNotification("Preset name cannot be empty.", "error"); return; }
    const newPreset: SynthPreset = { name: name.trim(), oscParams, filterParams, lfoParams, envParams, visualsParams, delayParams, reverbParams: { ...reverbParams, customIrBuffer: undefined }, ringModParams, waveshaperParams, stereoWidthParams, noiseParams, masterMixerParams, overdriveParams, lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams, notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams, userMaxPolyphony, midiMappings, globalBpm, midiDeviceAssignments };
    setPresets(prev => { const existingIndex = prev.findIndex(p => p.name === newPreset.name); let updatedPresets; if (existingIndex > -1) { if (!window.confirm(`A preset named "${newPreset.name}" already exists. Overwrite?`)) return prev; updatedPresets = [...prev]; updatedPresets[existingIndex] = newPreset; } else updatedPresets = [...prev, newPreset]; localStorage.setItem(LOCAL_STORAGE_PRESET_KEY, JSON.stringify(updatedPresets)); setCurrentPresetName(newPreset.name); setIsPresetDirty(false); showNotification(`Preset "${newPreset.name}" saved!`); return updatedPresets; });
  }, [oscParams, filterParams, lfoParams, envParams, visualsParams, delayParams, reverbParams, ringModParams, waveshaperParams, stereoWidthParams, noiseParams, masterMixerParams, overdriveParams, lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams, notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams, userMaxPolyphony, midiMappings, globalBpm, midiDeviceAssignments, showNotification]);
  const loadPreset = useCallback((preset: SynthPreset) => {
    handleOscParamsChange(preset.oscParams); handleFilterParamsChange(preset.filterParams); handleLfoParamsChange(preset.lfoParams); handleEnvParamsChange(preset.envParams); handleVisualsParamsChange(preset.visualsParams); handleDelayParamsChange(preset.delayParams);
    const reverbToLoad: ReverbParams = { ...preset.reverbParams, customIrBuffer: preset.reverbParams.irUrl === 'custom_loaded_ir' && reverbParams.customIrBuffer ? reverbParams.customIrBuffer : null, };
    handleReverbParamsChange(reverbToLoad);
    handleRingModParamsChange(preset.ringModParams); handleWaveshaperParamsChange(preset.waveshaperParams); handleStereoWidthParamsChange(preset.stereoWidthParams); handleNoiseParamsChange(preset.noiseParams); handleMasterMixerParamsChange(preset.masterMixerParams); handleOverdriveParamsChange(preset.overdriveParams); handleLowPassFilterInsertParamsChange(preset.lowPassFilterInsertParams); handleHighPassFilterInsertParamsChange(preset.highPassFilterInsertParams); handleBandPassFilterInsertParamsChange(preset.bandPassFilterInsertParams); handleNotchFilterInsertParamsChange(preset.notchFilterInsertParams); handleCompressorParamsChange(preset.compressorParams); handleThreeBandEqParamsChange(preset.threeBandEqParams); handleLadderFilterParamsChange(preset.ladderFilterParams); handleModMatrixParamsChange(preset.modMatrixParams); handleUserMaxPolyphonyChange(preset.userMaxPolyphony || DEFAULT_USER_MAX_POLYPHONY); setMidiMappings(preset.midiMappings || DEFAULT_MIDI_MAPPINGS); handleGlobalBpmChange(preset.globalBpm || DEFAULT_GLOBAL_BPM);
    setMidiDeviceAssignments(preset.midiDeviceAssignments || DEFAULT_MIDI_DEVICE_ASSIGNMENTS); 
    setCurrentPresetName(preset.name); setIsPresetDirty(false);
  }, [handleOscParamsChange, handleFilterParamsChange, handleLfoParamsChange, handleEnvParamsChange, handleVisualsParamsChange, handleDelayParamsChange, handleReverbParamsChange, handleRingModParamsChange, handleWaveshaperParamsChange, handleStereoWidthParamsChange, handleNoiseParamsChange, handleMasterMixerParamsChange, handleOverdriveParamsChange, handleLowPassFilterInsertParamsChange, handleHighPassFilterInsertParamsChange, handleBandPassFilterInsertParamsChange, handleNotchFilterInsertParamsChange, handleCompressorParamsChange, handleThreeBandEqParamsChange, handleLadderFilterParamsChange, handleModMatrixParamsChange, handleUserMaxPolyphonyChange, reverbParams.customIrBuffer, handleGlobalBpmChange]);
  const deletePreset = useCallback((presetName: string) => { setPresets(prev => { const updatedPresets = prev.filter(p => p.name !== presetName); localStorage.setItem(LOCAL_STORAGE_PRESET_KEY, JSON.stringify(updatedPresets)); return updatedPresets; }); if (currentPresetName === presetName) { setCurrentPresetName(DEFAULT_PRESET_NAME); setIsPresetDirty(true); } }, [currentPresetName]);
  const initializePreset = useCallback(() => { loadPreset({ name: DEFAULT_PRESET_NAME, oscParams: DEFAULT_OSCILLATOR_PARAMS, filterParams: DEFAULT_FILTER_PARAMS, lfoParams: DEFAULT_LFO_PARAMS, envParams: DEFAULT_ENVELOPE_PARAMS, visualsParams: DEFAULT_VISUALS_PARAMS, delayParams: DEFAULT_DELAY_PARAMS, reverbParams: DEFAULT_REVERB_PARAMS, ringModParams: DEFAULT_RING_MOD_PARAMS, waveshaperParams: DEFAULT_WAVESHAPER_PARAMS, stereoWidthParams: DEFAULT_STEREO_WIDTH_PARAMS, noiseParams: DEFAULT_NOISE_PARAMS, masterMixerParams: DEFAULT_MASTER_MIXER_PARAMS, overdriveParams: DEFAULT_OVERDRIVE_PARAMS, lowPassFilterInsertParams: DEFAULT_LOW_PASS_FILTER_INSERT_PARAMS, highPassFilterInsertParams: DEFAULT_HIGH_PASS_FILTER_INSERT_PARAMS, bandPassFilterInsertParams: DEFAULT_BAND_PASS_FILTER_INSERT_PARAMS, notchFilterInsertParams: DEFAULT_NOTCH_FILTER_INSERT_PARAMS, compressorParams: DEFAULT_COMPRESSOR_PARAMS, threeBandEqParams: DEFAULT_THREE_BAND_EQ_PARAMS, ladderFilterParams: DEFAULT_LADDER_FILTER_PARAMS, modMatrixParams: DEFAULT_MOD_MATRIX_PARAMS, userMaxPolyphony: DEFAULT_USER_MAX_POLYPHONY, midiMappings: DEFAULT_MIDI_MAPPINGS, globalBpm: DEFAULT_GLOBAL_BPM, midiDeviceAssignments: DEFAULT_MIDI_DEVICE_ASSIGNMENTS }); setIsPresetDirty(false); }, [loadPreset]);
  const handleDeleteMidiMapping = useCallback((cc: number) => { if (window.confirm(`Are you sure you want to delete the mapping for MIDI CC ${cc}?`)) { setMidiMappings(prev => { const newMappings = { ...prev }; delete newMappings[cc]; return newMappings; }); setIsPresetDirty(true); } }, []);
  const getFrequencyWithOctave = (baseFreq: number, currentOctave: number): number => baseFreq * Math.pow(2, currentOctave);
  const handleQwertyNoteOn = useCallback((key: string, baseFrequency: number) => { if (!isAudioInitialized || !audioEngine) return; const frequency = getFrequencyWithOctave(baseFrequency, octave); audioEngine.playNote(key, frequency, 0.75, modWheelValue); setActiveKeys(prev => new Set(prev).add(key)); }, [audioEngine, isAudioInitialized, octave, modWheelValue]);
  const handleQwertyNoteOff = useCallback((key: string) => { if (!isAudioInitialized || !audioEngine) return; audioEngine.stopNote(key); setActiveKeys(prev => { const newSet = new Set(prev); newSet.delete(key); return newSet; }); }, [audioEngine, isAudioInitialized]);
  const handleOctaveChange = useCallback((newOctave: number) => { setOctave(Math.max(OCTAVE_RANGE[0], Math.min(OCTAVE_RANGE[1], newOctave))); }, []);
  useEffect(() => {
    if (!isAudioInitialized) return;
    const handleKeyDown = (event: KeyboardEvent) => { const targetElement = event.target as HTMLElement; if (['input', 'select', 'textarea'].includes(targetElement.tagName.toLowerCase()) || targetElement.isContentEditable) return; if (midiLearnActive) return; const key = event.key.toLowerCase(); if (KEY_MAP[key as keyof KeyMap] && !activeKeys.has(key)) { event.preventDefault(); const noteDetails = KEY_MAP[key as keyof KeyMap]; handleQwertyNoteOn(noteDetails.key, noteDetails.freq); } else if (key === 'z') { event.preventDefault(); handleOctaveChange(octave - 1); } else if (key === 'x') { event.preventDefault(); handleOctaveChange(octave + 1); } };
    const handleKeyUp = (event: KeyboardEvent) => { const targetElement = event.target as HTMLElement; if (['input', 'select', 'textarea'].includes(targetElement.tagName.toLowerCase()) || targetElement.isContentEditable) return; if (midiLearnActive) return; const key = event.key.toLowerCase(); if (KEY_MAP[key as keyof KeyMap] && activeKeys.has(key)) { event.preventDefault(); handleQwertyNoteOff(key); } };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [isAudioInitialized, activeKeys, octave, handleQwertyNoteOn, handleQwertyNoteOff, handleOctaveChange, midiLearnActive]);

  const processThrottledUpdates = useCallback(() => {
    Object.entries(throttledParamUpdatesRef.current).forEach(([paramId, data]) => {
        dispatchParameterUpdate(paramId, data.value);
    });
    throttledParamUpdatesRef.current = {};
    if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
    }
  }, [dispatchParameterUpdate]);

  useEffect(() => {
    return () => {
        if (throttleTimeoutRef.current) {
            clearTimeout(throttleTimeoutRef.current);
        }
    };
  }, []);

  const handleMidiMessage = useCallback((message: MIDIMessageEvent, sourceDeviceId: string) => {
    if (!audioEngine) return;
    const command = message.data[0];
    const ccOrNote = message.data[1];
    const rawValue = (message.data.length > 2) ? message.data[2] : 0;
    const deviceRole = midiDeviceAssignments[sourceDeviceId] || MidiDeviceRole.UNASSIGNED;

    if (midiLearnActive && paramIdToLearn && paramMinMaxToLearn && (command & 0xF0) === 0xB0) {
      if (deviceRole === MidiDeviceRole.CONTROL_SURFACE || (deviceRole === MidiDeviceRole.KEYBOARD && !Object.values(midiDeviceAssignments).includes(MidiDeviceRole.CONTROL_SURFACE)) ) {
          
          const ccNumber = ccOrNote;
          const newMapping: MidiMappingEntry = {
              cc: ccNumber,
              paramId: paramIdToLearn,
              min: paramMinMaxToLearn.min,
              max: paramMinMaxToLearn.max,
              sourceDeviceId,
          };
  
          setMidiMappings((prev) => ({ ...prev, [ccNumber]: newMapping }));
          setIsPresetDirty(true);
  
          // Turn off learn mode immediately
          setMidiLearnActive(false);
          setParamIdToLearn(null);
          setParamMinMaxToLearn(null);
          setShowMidiLearnBanner(false);
          setMidiLearnTargetDeviceName(null);
  
          // Show non-blocking notification instead of alert
          showNotification(
              `MIDI CC ${ccNumber} on "${
                  activeMidiInputsRef.current.get(sourceDeviceId)?.name || 'Unknown Device'
              }" learned for parameter ${paramIdToLearn}!`
          );
  
          return; // Exit after handling the learned event
      }
    }

    if (deviceRole === MidiDeviceRole.KEYBOARD) {
      if ((command & 0xF0) === 0x90) { 
        const velocity = parseFloat((rawValue / 127.0).toFixed(2));
        const keyString = `midi_${ccOrNote}`;
        const frequency = 440 * Math.pow(2, (ccOrNote - 69) / 12);
        if (rawValue > 0) { audioEngine.playNote(keyString, frequency, velocity, modWheelValue); setActiveKeys(prev => new Set(prev).add(keyString)); } 
        else { audioEngine.stopNote(keyString); setActiveKeys(prev => { const newSet = new Set(prev); newSet.delete(keyString); return newSet; }); }
      } else if ((command & 0xF0) === 0x80) { 
        const keyString = `midi_${ccOrNote}`;
        audioEngine.stopNote(keyString); setActiveKeys(prev => { const newSet = new Set(prev); newSet.delete(keyString); return newSet; });
      } else if ((command & 0xF0) === 0xE0) { 
        // Pitch bend logic can go here
      } else if ((command & 0xF0) === 0xB0 && ccOrNote === 1) { 
        const newModWheelValue = rawValue / 127.0;
        setModWheelValue(newModWheelValue); audioEngine.updateGlobalModWheelValue(newModWheelValue);
      }
    }
    
    if (deviceRole === MidiDeviceRole.CONTROL_SURFACE && (command & 0xF0) === 0xB0) { 
      const ccNumber = ccOrNote;
      const mapping = midiMappings[ccNumber];
      if (mapping && (!mapping.sourceDeviceId || mapping.sourceDeviceId === sourceDeviceId)) {
        const normalizedValue = rawValue / 127.0;
        const denormalizedValue = mapping.min + normalizedValue * (mapping.max - mapping.min);
        
        throttledParamUpdatesRef.current[mapping.paramId] = {
            value: denormalizedValue,
            sourceDeviceId,
        };

        if (throttleTimeoutRef.current === null) {
            throttleTimeoutRef.current = window.setTimeout(processThrottledUpdates, THROTTLE_DELAY_MS);
        }
      }
    }
  }, [audioEngine, midiLearnActive, paramIdToLearn, paramMinMaxToLearn, midiMappings, dispatchParameterUpdate, modWheelValue, midiDeviceAssignments, processThrottledUpdates, showNotification]);

  const refreshMidiDeviceList = useCallback(async (requestNewAccess = false) => {
    if (requestNewAccess && midiAccessRef.current) {
        activeMidiInputsRef.current.forEach(input => input.onmidimessage = null);
        activeMidiInputsRef.current.clear();
        midiAccessRef.current = null; 
    }

    if (!navigator.requestMIDIAccess) {
      showNotification("Web MIDI API not supported in this browser.", "error");
      setIsMidiSystemInitialized(false);
      return;
    }

    try {
      if (!midiAccessRef.current) {
          midiAccessRef.current = await navigator.requestMIDIAccess({ sysex: false });
      }
      const midi = midiAccessRef.current;
      const inputs: DetectedMidiDevice[] = [];
      midi.inputs.forEach(input => {
        inputs.push({ id: input.id, name: input.name || 'Unknown MIDI Device', manufacturer: input.manufacturer || 'Unknown' });
        
        if (!activeMidiInputsRef.current.has(input.id) || requestNewAccess) {
            input.onmidimessage = (event) => handleMidiMessage(event, input.id);
            activeMidiInputsRef.current.set(input.id, input);
        }
      });
      setDetectedMidiInputs(inputs);
      if (!isMidiSystemInitialized && inputs.length > 0) setIsMidiSystemInitialized(true);
      else if (inputs.length === 0) setIsMidiSystemInitialized(false); 

      midi.onstatechange = () => {
        refreshMidiDeviceList(); 
      };

    } catch (error) {
      console.error("Failed to get MIDI access or process devices:", error);
      showNotification(`Failed to access MIDI devices: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setIsMidiSystemInitialized(false);
    }
  }, [handleMidiMessage, isMidiSystemInitialized, showNotification]);


  useEffect(() => {
    if (isAudioInitialized) { 
        refreshMidiDeviceList(true); 
    }
  }, [isAudioInitialized, refreshMidiDeviceList]);

  const handleUpdateMidiDeviceAssignment = useCallback((deviceId: string, role: MidiDeviceRole) => {
    setMidiDeviceAssignments(prev => {
      const newAssignments = { ...prev, [deviceId]: role };
      localStorage.setItem(LOCAL_STORAGE_MIDI_ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
      setIsPresetDirty(true); 
      return newAssignments;
    });
  }, []);
  
  const handleRequestMidiLearn = useCallback((paramId: string, min: number, max: number) => {
    if (!isMidiSystemReady) { showNotification("Configure and enable a MIDI Control Surface or Keyboard in Settings to use MIDI Learn.", 'error'); return; }
    setParamIdToLearn(paramId); setParamMinMaxToLearn({ min, max }); setMidiLearnActive(true); 
    setShowMidiLearnBanner(false); // Specific learn, so global banner off
    
    const controlSurfaceDevice = detectedMidiInputs.find(d => midiDeviceAssignments[d.id] === MidiDeviceRole.CONTROL_SURFACE);
    if (controlSurfaceDevice) { setMidiLearnTargetDeviceName(controlSurfaceDevice.name); return; }
    const keyboardDevice = detectedMidiInputs.find(d => midiDeviceAssignments[d.id] === MidiDeviceRole.KEYBOARD);
    if (keyboardDevice) { setMidiLearnTargetDeviceName(keyboardDevice.name); return; }
    setMidiLearnTargetDeviceName("any assigned device");

  }, [isMidiSystemReady, detectedMidiInputs, midiDeviceAssignments, showNotification]);

  const toggleMidiLearnMode = useCallback(() => {
    if (midiLearnActive) { // Turning OFF
      setMidiLearnActive(false); setParamIdToLearn(null); setParamMinMaxToLearn(null); 
      setShowMidiLearnBanner(false); setMidiLearnTargetDeviceName(null);
    } else { // Turning ON (Global)
      if (!isMidiSystemReady) { showNotification("Configure and enable a MIDI Control Surface or Keyboard in Settings to use MIDI Learn.", "error"); return; }
      setMidiLearnActive(true); setShowMidiLearnBanner(true); // Show global banner
      setParamIdToLearn(null); // Ensure no specific param is being learned
      
      const controlSurfaceDevice = detectedMidiInputs.find(d => midiDeviceAssignments[d.id] === MidiDeviceRole.CONTROL_SURFACE);
      const keyboardDevice = detectedMidiInputs.find(d => midiDeviceAssignments[d.id] === MidiDeviceRole.KEYBOARD);
      if (controlSurfaceDevice) setMidiLearnTargetDeviceName(controlSurfaceDevice.name);
      else if (keyboardDevice) setMidiLearnTargetDeviceName(keyboardDevice.name);
      else setMidiLearnTargetDeviceName("any assigned device");
    }
  }, [midiLearnActive, isMidiSystemReady, detectedMidiInputs, midiDeviceAssignments, showNotification]);

  useEffect(() => { if (midiLearnActive && !paramIdToLearn) setShowMidiLearnBanner(true); else if (!midiLearnActive) setShowMidiLearnBanner(false); }, [midiLearnActive, paramIdToLearn]);
  useEffect(() => {
    if (!audioEngine || !isAudioInitialized) return;
    const intervalId = setInterval(() => { if (audioEngine.checkFastGlobalClip()) { setGlobalClipActive(true); if (globalClipTimeoutRef.current) clearTimeout(globalClipTimeoutRef.current); globalClipTimeoutRef.current = window.setTimeout(() => setGlobalClipActive(false), 1000); } }, 250);
    return () => { clearInterval(intervalId); if (globalClipTimeoutRef.current) clearTimeout(globalClipTimeoutRef.current); };
  }, [audioEngine, isAudioInitialized]);

  useEffect(() => {
    const currentAudioEngine = audioEngine;
    const currentMidiAccess = midiAccessRef.current;
    const currentActiveInputs = activeMidiInputsRef.current;

    return () => {
      if (currentAudioEngine) currentAudioEngine.dispose();
      if (currentMidiAccess) {
        currentActiveInputs.forEach(input => input.onmidimessage = null);
      }
      activeMidiInputsRef.current.clear();
    };
  }, [audioEngine]); 

  const toggleSidebars = () => setAreSidebarsVisible(!areSidebarsVisible);
  const componentMap: Record<string, React.FC<any>> = { oscillators: OscillatorControls, 'filter-lfo': FilterLfoControls, envelope: EnvelopeControls, visuals: VisualsControls, delay: DelayControls, reverb: ReverbControls, ringmod: RingModControls, waveshaper: WaveshaperControls, stereowidth: StereoWidthControls, noise: NoiseControls, overdrive: OverdriveControls, lowpassInsert: LowPassFilterInsertControls, highpassInsert: HighPassFilterInsertControls, bandpassInsert: BandPassFilterInsertControls, notchInsert: NotchFilterInsertControls, compressor: CompressorControls, threeBandEq: ThreeBandEqControls, ladderFilter: LadderFilterControls, modMatrix: ModulationMatrixControls, presets: PresetControls, performance: PerformanceControls, globalBpm: GlobalBpmControls, midiMappings: MidiMappingControls };
  
  const mainContentClass = `flex-grow`;
  
  const currentHandlers = useMemo(() => ({ 
    handleOscParamsChange, handleFilterParamsChange, handleLfoParamsChange, handleEnvParamsChange, 
    handleVisualsParamsChange, handleDelayParamsChange, handleReverbParamsChange, handleRingModParamsChange, 
    handleWaveshaperParamsChange, handleStereoWidthParamsChange, handleNoiseParamsChange, 
    handleOverdriveParamsChange, handleLowPassFilterInsertParamsChange, handleHighPassFilterInsertParamsChange, 
    handleBandPassFilterInsertParamsChange, handleNotchFilterInsertParamsChange, handleCompressorParamsChange, 
    handleThreeBandEqParamsChange, handleLadderFilterParamsChange, handleModMatrixParamsChange, 
    handleUserMaxPolyphonyChange, handleGlobalBpmChange, saveCurrentPreset, loadPreset, deletePreset, 
    initializePreset, setCurrentPresetName, handleDeleteMidiMapping, onSetHelpText: handleSetHelpText, 
    onClearHelpText: handleClearHelpText, onCustomWavLoad: handleCustomWavLoad 
  }), [
    handleOscParamsChange, handleFilterParamsChange, handleLfoParamsChange, handleEnvParamsChange,
    handleVisualsParamsChange, handleDelayParamsChange, handleReverbParamsChange, handleRingModParamsChange,
    handleWaveshaperParamsChange, handleStereoWidthParamsChange, handleNoiseParamsChange,
    handleOverdriveParamsChange, handleLowPassFilterInsertParamsChange, handleHighPassFilterInsertParamsChange,
    handleBandPassFilterInsertParamsChange, handleNotchFilterInsertParamsChange, handleCompressorParamsChange,
    handleThreeBandEqParamsChange, handleLadderFilterParamsChange, handleModMatrixParamsChange,
    handleUserMaxPolyphonyChange, handleGlobalBpmChange, saveCurrentPreset, loadPreset, deletePreset,
    initializePreset, setCurrentPresetName, handleDeleteMidiMapping, handleSetHelpText, handleClearHelpText, handleCustomWavLoad
  ]);

  const currentParamsSnapshot = useMemo(() => ({ 
    oscParams, filterParams, lfoParams, envParams, visualsParams, delayParams, reverbParams, 
    ringModParams, waveshaperParams, stereoWidthParams, noiseParams, overdriveParams, 
    lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams, 
    notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams, 
    userMaxPolyphony, globalBpm, midiMappings, modulatedParamIds, wavetableOptions: dynamicWavetableOptions, 
    userLoadedWavetableNames, globalMidiLearnActive: midiLearnActive 
  }), [
    oscParams, filterParams, lfoParams, envParams, visualsParams, delayParams, reverbParams,
    ringModParams, waveshaperParams, stereoWidthParams, noiseParams, overdriveParams,
    lowPassFilterInsertParams, highPassFilterInsertParams, bandPassFilterInsertParams,
    notchFilterInsertParams, compressorParams, threeBandEqParams, ladderFilterParams, modMatrixParams,
    userMaxPolyphony, globalBpm, midiMappings, modulatedParamIds, dynamicWavetableOptions,
    userLoadedWavetableNames, midiLearnActive
  ]);


  const hasActiveAudioNotes = audioEngine?.hasActiveNotes() ?? false;
  useEffect(() => { if (hasActiveAudioNotes) { if (oscilloscopeHoldTimerRef.current) { clearTimeout(oscilloscopeHoldTimerRef.current); oscilloscopeHoldTimerRef.current = null; } setIsOscilloscopeDrawingActive(true); } else if (isOscilloscopeDrawingActive) { if (oscilloscopeHoldTimerRef.current) clearTimeout(oscilloscopeHoldTimerRef.current); oscilloscopeHoldTimerRef.current = window.setTimeout(() => { setIsOscilloscopeDrawingActive(false); oscilloscopeHoldTimerRef.current = null; }, OSCILLOSCOPE_DRAW_HOLD_TIME_MS); } return () => { if (oscilloscopeHoldTimerRef.current) clearTimeout(oscilloscopeHoldTimerRef.current); }; }, [hasActiveAudioNotes, isOscilloscopeDrawingActive]);

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen flex flex-col relative overflow-hidden">
      {!isAudioInitialized && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50">
          <p className="font-orbitron text-2xl text-green-400 mb-6">Pro Audio Synthesizer</p>
          <Button variant="primary" onClick={initAudio} className="text-xl px-8 py-4">CLICK TO START AUDIO</Button>
          <p className="mt-8 text-sm text-gray-400">Please use headphones for the best experience.</p>
        </div>
      )}
      
      {/* --- Notification Banner --- */}
      {notification && (
        <div 
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-2xl transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
          } text-white font-semibold`}
        >
          {notification.message}
        </div>
      )}

      {isAudioInitialized && (
        <>
          <TopBar
            isSidebarVisible={areSidebarsVisible}
            toggleSidebar={toggleSidebars}
            isKeyboardVisible={isKeyboardVisible}
            toggleKeyboard={() => setIsKeyboardVisible(!isKeyboardVisible)}
            onOpenMidiSettings={handleToggleSettingsModal}
            isMidiSystemReady={isMidiSystemReady}
            midiLearnActive={midiLearnActive && !paramIdToLearn}
            toggleMidiLearnMode={toggleMidiLearnMode}
            globalClipActive={globalClipActive}
            currentPresetName={currentPresetName}
            isPresetDirty={isPresetDirty}
            showMidiLearnBanner={showMidiLearnBanner}
            specificParamLearnActive={midiLearnActive && !!paramIdToLearn}
            midiLearnTargetDeviceName={midiLearnTargetDeviceName}
            onDismissMidiLearnBanner={() => { setShowMidiLearnBanner(false); setMidiLearnActive(false); }}
            sidebarLayoutOptions={Object.entries(PREDEFINED_SIDEBAR_LAYOUTS).map(([key, val]) => ({value: key, label: val.name}))}
            onApplySidebarLayout={applySidebarLayout}
            onToggleSettingsModal={handleToggleSettingsModal}
          />

          <div className="flex flex-1 pt-14"> {/* Main content area below TopBar */}
            <Sidebar
              isVisible={areSidebarsVisible}
              categorizedEffects={categorizedSidebarEffects}
              onToggleEffectInRightSidebar={toggleEffectInSidebar}
              activeEffectsInRightSidebarIds={activeEffectsInSidebar}
            />
            <main className={mainContentClass}> {/* Canvas will overlay this due to fixed positioning */}
              <OscilloscopeCanvas
                analyserX={audioEngine?.getAnalysers().analyserX || null}
                analyserY={audioEngine?.getAnalysers().analyserY || null}
                visualsParams={visualsParams}
                isAudioActive={isOscilloscopeDrawingActive}
              />
            </main>
            {areSidebarsVisible && (
              <RightEffectsSidebar
                availableEffects={sidebarAvailableEffects.filter(effect => activeEffectsInSidebar.has(effect.id) && effect.id !== 'masterMixer')}
                onToggleEffect={toggleEffectInSidebar}
                componentMap={componentMap}
                params={currentParamsSnapshot}
                handlers={currentHandlers}
                appAnalysers={appAnalysers}
                insertEffectAnalysers={insertEffectAnalysers}
                getMasterLimiterReduction={() => audioEngine?.getMasterLimiterReduction() || 0}
                presets={presets}
                currentPresetName={currentPresetName}
                isPresetDirty={isPresetDirty}
                onRequestLearn={handleRequestMidiLearn}
                paramIdToLearn={paramIdToLearn}
                activeVoiceCount={activeVoiceCount}
                voiceStealIndicatorActive={voiceStealIndicatorActive}
                activeEffectIds={activeEffectsInSidebar}
                onSetHelpText={handleSetHelpText}
                onClearHelpText={handleClearHelpText}
              />
            )}
          </div>
          {activeEffectsInSidebar.has('masterMixer') && (
            <div className={`fixed bottom-12 left-1/2 transform -translate-x-1/2 z-30 transition-opacity duration-300 ${isKeyboardVisible ? 'mb-0' : 'mb-0'}`}>
                <MasterMixerPanel
                    params={masterMixerParams}
                    onChange={handleMasterMixerParamsChange}
                    masterPreLimiterAnalyser={appAnalysers.masterPreLimiterAnalyser}
                    masterPostLimiterAnalyser={appAnalysers.masterPostLimiterAnalyser}
                    preInsertChainAnalyser={appAnalysers.preInsertChainAnalyser}
                    getMasterLimiterReduction={() => audioEngine?.getMasterLimiterReduction() || 0}
                    onRequestLearn={handleRequestMidiLearn}
                    paramIdToLearn={paramIdToLearn}
                    modulatedParamIds={currentParamsSnapshot.modulatedParamIds}
                    onSetHelpText={handleSetHelpText}
                    onClearHelpText={handleClearHelpText}
                    globalMidiLearnActive={currentParamsSnapshot.globalMidiLearnActive}
                />
            </div>
          )}
          {isKeyboardVisible && (
            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-30" style={{ marginBottom: `${HELP_BOX_HEIGHT_REM}rem` }}>
              <VirtualKeyboard
                octave={octave}
                onOctaveChange={handleOctaveChange}
                onNoteOn={handleQwertyNoteOn}
                onNoteOff={handleQwertyNoteOff}
                activeNotes={activeKeys}
                onSetHelpText={handleSetHelpText}
                onClearHelpText={handleClearHelpText}
              />
            </div>
          )}
           <HelpDisplayBox helpText={currentHelpText} />
           <SettingsModal
              isOpen={isSettingsModalOpen}
              onClose={handleToggleSettingsModal}
              masterVolumeTrimDb={masterVolumeTrimDb}
              onMasterVolumeTrimDbChange={handleMasterVolumeTrimDbChange}
              currentSampleRate={currentSampleRate}
              isMasterLimiterEnabled={isMasterLimiterEnabled}
              onToggleMasterLimiter={handleToggleMasterLimiter}
              limiterThresholdDb={limiterThresholdDb}
              onLimiterThresholdDbChange={handleLimiterThresholdDbChange}
              detectedMidiInputs={detectedMidiInputs}
              midiDeviceAssignments={midiDeviceAssignments}
              onUpdateMidiDeviceAssignment={handleUpdateMidiDeviceAssignment}
              onRefreshMidiDevices={() => refreshMidiDeviceList(true)}
              isMidiSystemInitialized={isMidiSystemInitialized}
            />
        </>
      )}
    </div>
  );
};

export default App;
