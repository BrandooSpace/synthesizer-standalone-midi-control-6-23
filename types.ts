
import { Voice } from './audio/Voice';

export enum Waveform {
  SINE = 'sine',
  SQUARE = 'square',
  SAWTOOTH = 'sawtooth',
  TRIANGLE = 'triangle',
  PULSE = 'pulse', // Custom
  PHASOR = 'phasor', // Custom
  HARMONICS = 'harmonics', // Custom
  WAVETABLE = 'wavetable', // Phase 4: Wavetable
  SAMPLE_HOLD = 'sample_hold', // Phase 4: LFO Shape
  RANDOM_SMOOTH = 'random_smooth', // Phase 4: LFO Shape
}

export enum LfoTarget {
  OFF = 'off',
  PITCH_X = 'pitch_x', // Target Osc X pitch
  PITCH_Y = 'pitch_y', // Target Osc Y pitch
  PITCH_XY = 'pitch_xy', // Target Osc X & Y pitch
  FILTER_X = 'filter_x',   // Target Filter X cutoff
  FILTER_Y = 'filter_y',   // Target Filter Y cutoff
  FILTER_XY = 'filter_xy', // Target Filter X & Y cutoff
  PHASE = 'phase',     // Target Y-oscillator phase shift (via delay)
  VISUAL_HUE = 'visual_hue',
  VISUAL_SATURATION = 'visual_saturation',
  VISUAL_LIGHTNESS = 'visual_lightness',
  OSC_X_WAVETABLE_POS = 'osc_x_wavetable_pos', // Phase 4
  OSC_Y_WAVETABLE_POS = 'osc_y_wavetable_pos', // Phase 4
}

export enum SymmetryMode {
  OFF = 'off',
  X = 'x', // Mirror across X-axis (flips Y)
  Y = 'y', // Mirror across Y-axis (flips X)
  XY = 'xy', // Mirror across both X and Y axes
}

export enum NoiseType {
  WHITE = 'white',
  PINK = 'pink',
}

export type SendMode = 'pre' | 'post';

export interface OscillatorParams {
  waveformX: Waveform;
  waveformY: Waveform;
  xRatio: number; // Frequency ratio for X oscillator
  yRatio: number; // Frequency ratio for Y oscillator
  phaseShift: number; // In degrees
  unisonVoices: number; // 1 to N (e.g., 7)
  unisonDetune: number; // 0 to 100 cents
  unisonSpread: number; // 0 to 1 (stereo panning)
  wavetableX: string; // Phase 4: ID of the selected conceptual wavetable for X
  wavetableY: string; // Phase 4: ID of the selected conceptual wavetable for Y
  wavetablePositionX: number; // Phase 4: 0-1 position in the conceptual wavetable for X
  wavetablePositionY: number; // Phase 4: 0-1 position in the conceptual wavetable for Y
}

export enum FilterNodeType {
  LOW_PASS = 'lowpass',
  HIGH_PASS = 'highpass',
  BAND_PASS = 'bandpass',
  NOTCH = 'notch',
}

export interface FilterParams {
  isFilterEnabled: boolean;
  filterType: FilterNodeType;
  cutoffFrequency: number;
  resonance: number;
  keytrackAmount: number; // -200% to 200%
}

export interface LfoParams {
  rate: number;
  depth: number;
  target: LfoTarget;
  waveform: Waveform;
  isTempoSynced?: boolean; // Phase 4
  tempoSyncDivision?: string; // Phase 4: e.g., "1/4", "1/8T"
}

export interface EnvelopeParams {
  isEnvelopeEnabled: boolean;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface VisualsParams {
  lineWidth: number;
  decay: number;
  glow: number;
  multiColorTrails: boolean;
  symmetryMode: SymmetryMode;
  rotation: boolean;
  rotationSpeed: number;

  visualLfoRate: number;
  visualLfoDepth: number;
  visualLfoTarget: LfoTarget;

  baseHue: number;
  baseSaturation: number;
  baseLightness: number;
  zoomX: number;
  zoomY: number;
  panX: number;
  panY: number;
}

export enum DelayFeedbackFilterType {
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  BANDPASS = 'bandpass',
}

export interface DelayParams {
  isDelayEnabled: boolean;
  delayTimeL: number;
  delayTimeR: number;
  feedback: number;
  sendLevel: number;
  returnLevel: number;
  sendMode: SendMode;
  saturation: number;
  flutterRate: number;
  flutterDepth: number;
  feedbackFilterType: DelayFeedbackFilterType;
  feedbackFilterFreq: number;
  feedbackFilterQ: number;
}

export interface ReverbParams {
  isReverbEnabled: boolean;
  sendLevel: number;
  returnLevel: number;
  irUrl: string;
  preDelayTime: number;
  sendMode: SendMode;
  customIrBuffer?: AudioBuffer | null;
  customIrName?: string; // Added for preset handling
}

export interface RingModParams {
  isRingModEnabled: boolean;
  carrierFrequency: number;
  carrierWaveform: Waveform;
  mix: number;
  carrierAmplitude: number;
  inputSignalGain: number;
}

export type WaveshaperCurveType = 'tanh' | 'hardClip' | 'fold';

export interface WaveshaperParams {
  isWaveshaperEnabled: boolean;
  drive: number;
  outputLevel: number;
  curveType: WaveshaperCurveType;
}

export interface StereoWidthParams {
  isStereoWidthEnabled: boolean;
  widthAmount: number;
  intensity: number;
}

export interface NoiseParams {
  isNoiseEnabled: boolean;
  noiseType: NoiseType;
  noiseLevel: number;
}

export type OverdriveCurveType = 'softClip' | 'hardClip' | 'fuzz';

export interface OverdriveParams {
  isOverdriveEnabled: boolean;
  drive: number;
  outputLevel: number;
  tone: number;
  curveType: OverdriveCurveType;
}

export interface LowPassFilterInsertParams {
  isLowPassInsertEnabled: boolean;
  cutoffFrequency: number;
  resonance: number;
  outputLevel: number;
}

export interface HighPassFilterInsertParams {
  isHighPassInsertEnabled: boolean;
  cutoffFrequency: number;
  resonance: number;
  outputLevel: number;
}

export interface BandPassFilterInsertParams {
  isBandPassInsertEnabled: boolean;
  cutoffFrequency: number;
  resonance: number;
  outputLevel: number;
}

export interface NotchFilterInsertParams {
  isNotchInsertEnabled: boolean;
  cutoffFrequency: number;
  resonance: number;
  outputLevel: number;
}

export type CompressorSidechainSource = 'none' | 'voiceBus' | 'noiseBus';

export interface CompressorParams {
  isCompressorEnabled: boolean;
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
  makeupGain: number;
  sidechainSource: CompressorSidechainSource;
  sidechainSensitivity: number; // Scales how much sidechain signal affects threshold
}

export interface EqBandParams {
  frequency: number;
  gain: number;
  q?: number;
}

export interface ThreeBandEqParams {
  isThreeBandEqEnabled: boolean;
  lowShelf: EqBandParams;
  midPeak: EqBandParams;
  highShelf: EqBandParams;
  outputLevel: number;
}

export interface LadderFilterParams {
  isLadderFilterEnabled: boolean;
  cutoffFrequency: number;
  resonance: number;
  drive: number;
  outputLevel: number;
}


export type InsertEffectId =
  'ringmod' |
  'waveshaper' |
  'stereowidth' |
  'overdrive' |
  'lowpassInsert' |
  'highpassInsert' |
  'bandpassInsert' |
  'notchInsert' |
  'compressor' |
  'threeBandEq' |
  'ladderFilter';

export interface MasterMixerParams {
  insertEffectOrder: InsertEffectId[];
  masterDelaySendLevel: number;
  masterDelayReturnLevel: number;
  masterReverbSendLevel: number;
  masterReverbReturnLevel: number;
}

// --- Modulation Matrix Types ---
export enum ModSource {
  NONE = 'none',
  LFO1 = 'lfo1',
  ENV1 = 'env1',
  VELOCITY = 'velocity',
  MODWHEEL = 'modwheel',
}

export enum ModDestination {
  NONE = 'none',
  OSC_X_PITCH = 'osc_x_pitch',
  OSC_Y_PITCH = 'osc_y_pitch',
  OSC_XY_PITCH = 'osc_xy_pitch',
  OSC_X_RATIO = 'osc_x_ratio',
  OSC_Y_RATIO = 'osc_y_ratio',
  OSC_Y_PHASE = 'osc_y_phase',
  FILTER_X_CUTOFF = 'filter_x_cutoff',
  FILTER_Y_CUTOFF = 'filter_y_cutoff',
  FILTER_XY_CUTOFF = 'filter_xy_cutoff',
  VCA_X_LEVEL = 'vca_x_level',
  VCA_Y_LEVEL = 'vca_y_level',
  VCA_XY_LEVEL = 'vca_xy_level',
  LFO1_RATE = 'lfo1_rate',
  LFO1_DEPTH = 'lfo1_depth',
  OSC_X_WAVETABLE_POS = 'osc_x_wavetable_pos', 
  OSC_Y_WAVETABLE_POS = 'osc_y_wavetable_pos', 
  ENV1_ATTACK = 'env1_attack',
  ENV1_DECAY = 'env1_decay',
  ENV1_SUSTAIN = 'env1_sustain',
  ENV1_RELEASE = 'env1_release',
}

export interface ModMatrixSlot {
  source: ModSource;
  destination: ModDestination;
  amount: number;
  isEnabled: boolean;
}

export interface ModMatrixParams {
  isEnabled: boolean;
  slots: ModMatrixSlot[];
}
// --- End Modulation Matrix Types ---


export interface EffectWindowConfig {
  id: string;
  title: string;
  component: React.FC<any>;
  initialPosition?: { x: number; y: number };
  width?: number;
}

export interface CategorizedSidebarEffectGroup {
  categoryName: string;
  effects: EffectWindowConfig[];
  defaultOpen?: boolean;
}

export interface NoteDetails {
  key: string;
  freq: number;
  type: 'white' | 'black';
}

export type KeyMap = Record<string, NoteDetails>;

export interface ActiveNoteNode {
  voiceInstance: Voice;
  baseFrequency: number;
  startTime: number;
  velocity: number;
}

export interface ImpulseResponseDefinition {
    name: string;
    url: string;
}

// --- MIDI Types ---
export enum MidiDeviceRole {
  KEYBOARD = 'keyboard', // For note input, mod wheel, pitch bend
  CONTROL_SURFACE = 'control-surface', // For CCs, knobs, faders
  UNASSIGNED = 'unassigned', // Device detected but not assigned a role
}

export interface DetectedMidiDevice {
  id: string;
  name: string;
  manufacturer?: string; // Optional, as not always available
}

export interface MidiMappingEntry {
  cc: number;          // The MIDI CC number
  paramId: string;     // Unique identifier for the parameter (e.g., "osc.xRatio")
  min: number;         // Minimum value of the parameter
  max: number;         // Maximum value of the parameter
  sourceDeviceId?: string; // Optional: ID of the device this mapping was learned from
}

export type MidiMappings = Record<number, MidiMappingEntry>; // Keyed by CC number

export interface MidiDeviceAssignments {
  [deviceId: string]: MidiDeviceRole;
}
// --- End MIDI Types ---

export interface SynthPreset {
  name: string;
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
  masterMixerParams: MasterMixerParams;
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
  midiMappings: MidiMappings;
  midiDeviceAssignments?: MidiDeviceAssignments; // Added for dual MIDI device support
  globalBpm?: number; // Phase 4
}

// Added for User Wavetables and OscillatorControls options
export interface UserWavetable {
  id: string; // Unique ID, e.g., 'user_oscX_filename_timestamp'
  name: string; // Original filename or user-given name
  data: Float32Array; // The raw sample data for the wavetable frame
}

export interface WavetableOption {
  value: string; // Corresponds to OscillatorParams.wavetableX/Y (e.g., 'basicShapes', 'user_...')
  label: string; // User-friendly display name (e.g., "Basic Shapes (1D)", "User: MyKick.wav")
  isUser?: boolean; // Optional flag to distinguish user-loaded tables
}
