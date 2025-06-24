import React from 'react'; // Added import for React
import { Waveform, LfoTarget, OscillatorParams, FilterParams, LfoParams, EnvelopeParams, VisualsParams, KeyMap, SymmetryMode, DelayParams, RingModParams, WaveshaperParams, StereoWidthParams, WaveshaperCurveType, NoiseParams, NoiseType, ReverbParams, InsertEffectId, MasterMixerParams, SendMode, OverdriveParams, OverdriveCurveType, FilterNodeType, LowPassFilterInsertParams, HighPassFilterInsertParams, BandPassFilterInsertParams, NotchFilterInsertParams, CompressorParams, ThreeBandEqParams, EqBandParams, LadderFilterParams, ModMatrixParams, ModSource, ModDestination, ModMatrixSlot, DelayFeedbackFilterType, CompressorSidechainSource, ImpulseResponseDefinition, MidiMappings, EffectWindowConfig, MidiDeviceAssignments } from './types';

export const DEFAULT_OSCILLATOR_PARAMS: OscillatorParams = {
  waveformX: Waveform.SINE,
  waveformY: Waveform.SINE,
  xRatio: 1.0,
  yRatio: 1.5,
  phaseShift: 0,
  unisonVoices: 1,
  unisonDetune: 5,
  unisonSpread: 0.3,
  wavetableX: 'basicShapes',
  wavetableY: 'basicShapes',
  wavetablePositionX: 0,
  wavetablePositionY: 0,
};

export const DEFAULT_FILTER_PARAMS: FilterParams = {
  isFilterEnabled: false,
  filterType: FilterNodeType.LOW_PASS,
  cutoffFrequency: 20000,
  resonance: 0,
  keytrackAmount: 0,
};

export const DEFAULT_LFO_PARAMS: LfoParams = {
  rate: 5,
  depth: 0,
  target: LfoTarget.OFF,
  waveform: Waveform.SINE,
  isTempoSynced: false,
  tempoSyncDivision: '1/4',
};

export const DEFAULT_ENVELOPE_PARAMS: EnvelopeParams = {
  isEnvelopeEnabled: false,
  attack: 0.05,
  decay: 0.1,
  sustain: 0.7,
  release: 0.1,
};

export const DEFAULT_VISUALS_PARAMS: VisualsParams = {
  lineWidth: 1,
  decay: 0.1,
  glow: 8,
  multiColorTrails: false,
  symmetryMode: SymmetryMode.OFF,
  rotation: false,
  rotationSpeed: 0.005,

  visualLfoRate: 1,
  visualLfoDepth: 50,
  visualLfoTarget: LfoTarget.OFF,

  baseHue: 150,
  baseSaturation: 100,
  baseLightness: 50,
  zoomX: 1.5,
  zoomY: 1.5,
  panX: 0,
  panY: 0,
};

export const DEFAULT_DELAY_PARAMS: DelayParams = {
  isDelayEnabled: false,
  delayTimeL: 0.3,
  delayTimeR: 0.3,
  feedback: 0.4,
  sendLevel: 0.35,
  returnLevel: 1.0,
  sendMode: 'post',
  saturation: 0.2,
  flutterRate: 0.5,
  flutterDepth: 0.002,
  feedbackFilterType: DelayFeedbackFilterType.LOWPASS,
  feedbackFilterFreq: 3500,
  feedbackFilterQ: 1,
};

export const DEFAULT_REVERB_PARAMS: ReverbParams = {
  isReverbEnabled: false,
  sendLevel: 0.25,
  returnLevel: 1.0,
  irUrl: 'default_spring',
  preDelayTime: 0.01,
  sendMode: 'post',
  customIrBuffer: null,
  customIrName: '',
};

export const DEFAULT_RING_MOD_PARAMS: RingModParams = {
  isRingModEnabled: false,
  carrierFrequency: 100,
  carrierWaveform: Waveform.SINE,
  mix: 0.5,
  carrierAmplitude: 1.0,
  inputSignalGain: 1.0,
};

export const DEFAULT_WAVESHAPER_PARAMS: WaveshaperParams = {
  isWaveshaperEnabled: false,
  drive: 5,
  outputLevel: 0.7,
  curveType: 'tanh',
};

export const DEFAULT_STEREO_WIDTH_PARAMS: StereoWidthParams = {
  isStereoWidthEnabled: false,
  widthAmount: 0.25,
  intensity: 0.5,
};

export const DEFAULT_NOISE_PARAMS: NoiseParams = {
  isNoiseEnabled: false,
  noiseType: NoiseType.WHITE,
  noiseLevel: 0.1,
};

export const DEFAULT_OVERDRIVE_PARAMS: OverdriveParams = {
  isOverdriveEnabled: false,
  drive: 15,
  outputLevel: 0.7,
  tone: 0.5,
  curveType: 'softClip',
};

export const DEFAULT_LOW_PASS_FILTER_INSERT_PARAMS: LowPassFilterInsertParams = {
  isLowPassInsertEnabled: false,
  cutoffFrequency: 10000,
  resonance: 1,
  outputLevel: 0.7,
};

export const DEFAULT_HIGH_PASS_FILTER_INSERT_PARAMS: HighPassFilterInsertParams = {
  isHighPassInsertEnabled: false,
  cutoffFrequency: 100,
  resonance: 1,
  outputLevel: 0.7,
};

export const DEFAULT_BAND_PASS_FILTER_INSERT_PARAMS: BandPassFilterInsertParams = {
  isBandPassInsertEnabled: false,
  cutoffFrequency: 1000,
  resonance: 5,
  outputLevel: 0.7,
};

export const DEFAULT_NOTCH_FILTER_INSERT_PARAMS: NotchFilterInsertParams = {
  isNotchInsertEnabled: false,
  cutoffFrequency: 1000,
  resonance: 10,
  outputLevel: 1.0,
};

export const DEFAULT_COMPRESSOR_PARAMS: CompressorParams = {
  isCompressorEnabled: false,
  threshold: -24,
  knee: 30,
  ratio: 12,
  attack: 0.003,
  release: 0.25,
  makeupGain: 0,
  sidechainSource: 'none',
  sidechainSensitivity: 0.5,
};

const DEFAULT_EQ_BAND_LOW_SHELF: EqBandParams = { frequency: 120, gain: 0 };
const DEFAULT_EQ_BAND_MID_PEAK: EqBandParams = { frequency: 1000, gain: 0, q: 1 };
const DEFAULT_EQ_BAND_HIGH_SHELF: EqBandParams = { frequency: 5000, gain: 0 };

export const DEFAULT_THREE_BAND_EQ_PARAMS: ThreeBandEqParams = {
  isThreeBandEqEnabled: false,
  lowShelf: { ...DEFAULT_EQ_BAND_LOW_SHELF },
  midPeak: { ...DEFAULT_EQ_BAND_MID_PEAK },
  highShelf: { ...DEFAULT_EQ_BAND_HIGH_SHELF },
  outputLevel: 1.0,
};

export const DEFAULT_LADDER_FILTER_PARAMS: LadderFilterParams = {
  isLadderFilterEnabled: false,
  cutoffFrequency: 5000,
  resonance: 1,
  drive: 1,
  outputLevel: 0.7,
};


export const DEFAULT_MASTER_MIXER_PARAMS: MasterMixerParams = {
  insertEffectOrder: [
    'ringmod',
    'lowpassInsert',
    'highpassInsert',
    'bandpassInsert',
    'notchInsert',
    'waveshaper',
    'overdrive',
    'compressor',
    'threeBandEq',
    'ladderFilter',
    'stereowidth'
  ],
  masterDelaySendLevel: 0.75,
  masterDelayReturnLevel: 1.0,
  masterReverbSendLevel: 0.5,
  masterReverbReturnLevel: 1.0,
};

export const NUM_MOD_SLOTS = 4;
export const DEFAULT_MOD_MATRIX_PARAMS: ModMatrixParams = {
  isEnabled: false,
  slots: Array(NUM_MOD_SLOTS).fill(null).map(() => ({
    source: ModSource.NONE,
    destination: ModDestination.NONE,
    amount: 0,
    isEnabled: false,
  })),
};

export const DEFAULT_MIDI_MAPPINGS: MidiMappings = {};
export const DEFAULT_MIDI_DEVICE_ASSIGNMENTS: MidiDeviceAssignments = {};
export const DEFAULT_GLOBAL_BPM = 120;
export const DEFAULT_PRESET_NAME = "Default Init";
export const LOCAL_STORAGE_PRESET_KEY = 'webXYSynthPresets_v1';
export const LOCAL_STORAGE_MIDI_ASSIGNMENTS_KEY = 'webXYSynthMidiAssignments_v1';


export const KEY_MAP: KeyMap = {
  'a': { key: 'a', freq: 261.63, type: 'white' }, // C4
  'w': { key: 'w', freq: 277.18, type: 'black' }, // C#4
  's': { key: 's', freq: 293.66, type: 'white' }, // D4
  'e': { key: 'e', freq: 311.13, type: 'black' }, // D#4
  'd': { key: 'd', freq: 329.63, type: 'white' }, // E4
  'f': { key: 'f', freq: 349.23, type: 'white' }, // F4
  't': { key: 't', freq: 369.99, type: 'black' }, // F#4
  'g': { key: 'g', freq: 392.00, type: 'white' }, // G4
  'y': { key: 'y', freq: 415.30, type: 'black' }, // G#4
  'h': { key: 'h', freq: 440.00, type: 'white' }, // A4
  'u': { key: 'u', freq: 466.16, type: 'black' }, // A#4
  'j': { key: 'j', freq: 493.88, type: 'white' }, // B4
  'k': { key: 'k', freq: 523.25, type: 'white' }, // C5
};

export const OCTAVE_RANGE = [-2, 2];
export const MAX_PHASE_DELAY_TIME = 1.0;
export const MAX_MAIN_DELAY_TIME = 5.0;
export const MAX_HAAS_DELAY_TIME = 0.05;
export const RAMP_TIME = 0.01;
export const MIN_ENV_TIME = 0.001; // Added this constant
export const MAX_POLYPHONY = 18;
export const DEFAULT_USER_MAX_POLYPHONY = 12;
export const C4_FREQ = 261.63;
export const OSCILLOSCOPE_DRAW_HOLD_TIME_MS = 2000;
export const DEFAULT_TABLE_SIZE = 2048; // Added constant


export const EFFECT_WINDOW_WIDTH = 280;
export const EQ_EFFECT_WINDOW_WIDTH = 320;
export const MOD_MATRIX_WINDOW_WIDTH = 360;


export const AVAILABLE_WAVEFORMS: { value: Waveform; label: string }[] = [
  { value: Waveform.SINE, label: 'Sine' },
  { value: Waveform.SQUARE, label: 'Square' },
  { value: Waveform.SAWTOOTH, label: 'Sawtooth' },
  { value: Waveform.TRIANGLE, label: 'Triangle' },
  { value: Waveform.PULSE, label: 'Pulse' },
  { value: Waveform.PHASOR, label: 'Phasor' },
  { value: Waveform.HARMONICS, label: 'Harmonics' },
  { value: Waveform.WAVETABLE, label: 'Wavetable' },
];

export const LFO_WAVEFORM_OPTIONS: { value: Waveform; label: string }[] = [
  { value: Waveform.SINE, label: 'Sine' },
  { value: Waveform.SQUARE, label: 'Square' },
  { value: Waveform.SAWTOOTH, label: 'Sawtooth' },
  { value: Waveform.TRIANGLE, label: 'Triangle' },
  { value: Waveform.SAMPLE_HOLD, label: 'Sample & Hold' },
  { value: Waveform.RANDOM_SMOOTH, label: 'Random (Smooth)' },
];

export const LFO_TEMPO_SYNC_DIVISIONS: { value: string; label: string }[] = [
  { value: "1/64", label: "1/64 Note" },
  { value: "1/32T", label: "1/32 Triplet" },
  { value: "1/32", label: "1/32 Note" },
  { value: "1/16T", label: "1/16 Triplet" },
  { value: "1/16", label: "1/16 Note" },
  { value: "1/8T", label: "1/8 Triplet" },
  { value: "1/8", label: "1/8 Note" },
  { value: "1/4T", label: "1/4 Triplet" },
  { value: "1/4", label: "1/4 Note (Quarter)" },
  { value: "1/2T", label: "1/2 Triplet" },
  { value: "1/2", label: "1/2 Note (Half)" },
  { value: "1/1", label: "1 Bar (Whole)" },
  { value: "2/1", label: "2 Bars" },
  { value: "4/1", label: "4 Bars" },
  { value: "8/1", label: "8 Bars" },
];


export const WAVETABLE_DEFINITIONS: Record<string, Waveform[][]> = {
  basicShapes: [[Waveform.SINE, Waveform.TRIANGLE, Waveform.SAWTOOTH, Waveform.SQUARE]],
  harmonicSweep: [[Waveform.SINE, Waveform.HARMONICS, Waveform.PULSE]],
  phasorFun: [[Waveform.PHASOR, Waveform.SAWTOOTH, Waveform.SINE]],
  vocalFormants: [ // Simple 2x2 example for 2D morphing
    [Waveform.SINE, Waveform.PULSE], // Row 1: Sine -> Pulse (like 'ah' to 'ee' width)
    [Waveform.TRIANGLE, Waveform.HARMONICS]  // Row 2: Triangle -> Harmonics (like 'oo' to 'ih' brightness)
  ],
};
export const WAVETABLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'basicShapes', label: 'Basic Shapes (1D)' },
  { value: 'harmonicSweep', label: 'Harmonic Sweep (1D)' },
  { value: 'phasorFun', label: 'Phasor Fun (1D)' },
  { value: 'vocalFormants', label: 'Vocal Formants (2D)' },
];


export const FILTER_TYPE_OPTIONS: { value: FilterNodeType; label: string }[] = [
  { value: FilterNodeType.LOW_PASS, label: 'Low-Pass' },
  { value: FilterNodeType.HIGH_PASS, label: 'High-Pass' },
  { value: FilterNodeType.BAND_PASS, label: 'Band-Pass' },
  { value: FilterNodeType.NOTCH, label: 'Notch' },
];

export const DELAY_FEEDBACK_FILTER_TYPE_OPTIONS: { value: DelayFeedbackFilterType; label: string }[] = [
  { value: DelayFeedbackFilterType.LOWPASS, label: 'Low-Pass' },
  { value: DelayFeedbackFilterType.HIGHPASS, label: 'High-Pass' },
  { value: DelayFeedbackFilterType.BANDPASS, label: 'Band-Pass' },
];

export const AUDIO_LFO_TARGET_OPTIONS: { value: LfoTarget; label: string }[] = [
  { value: LfoTarget.OFF, label: 'Off' },
  { value: LfoTarget.PITCH_X, label: 'Osc X Pitch' },
  { value: LfoTarget.PITCH_Y, label: 'Osc Y Pitch' },
  { value: LfoTarget.PITCH_XY, label: 'Osc X & Y Pitch' },
  { value: LfoTarget.FILTER_X, label: 'Filter X Freq' },
  { value: LfoTarget.FILTER_Y, label: 'Filter Y Freq' },
  { value: LfoTarget.FILTER_XY, label: 'Filter X & Y Freq' },
  { value: LfoTarget.PHASE, label: 'Y-Osc Phase Shift' },
  { value: LfoTarget.OSC_X_WAVETABLE_POS, label: 'Osc X Wavetable Pos' },
  { value: LfoTarget.OSC_Y_WAVETABLE_POS, label: 'Osc Y Wavetable Pos' },
];

export const VISUAL_LFO_MOD_TARGET_OPTIONS: { value: LfoTarget; label: string }[] = [
  { value: LfoTarget.OFF, label: 'Off' },
  { value: LfoTarget.VISUAL_HUE, label: 'Hue' },
  { value: LfoTarget.VISUAL_SATURATION, label: 'Saturation' },
  { value: LfoTarget.VISUAL_LIGHTNESS, label: 'Lightness' },
];


export const SYMMETRY_MODE_OPTIONS: { value: SymmetryMode; label: string }[] = [
  { value: SymmetryMode.OFF, label: 'Off' },
  { value: SymmetryMode.X, label: 'X-Axis (Flip Y)' },
  { value: SymmetryMode.Y, label: 'Y-Axis (Flip X)' },
  { value: SymmetryMode.XY, label: 'X & Y Axes' },
];

export const WAVESHAPER_CURVE_TYPE_OPTIONS: { value: WaveshaperCurveType; label: string }[] = [
  { value: 'tanh', label: 'Tanh (Soft Clip)' },
  { value: 'hardClip', label: 'Hard Clip' },
  { value: 'fold', label: 'Fold' },
];

export const OVERDRIVE_CURVE_TYPE_OPTIONS: { value: OverdriveCurveType; label: string }[] = [
  { value: 'softClip', label: 'Soft Clip (Tanh-like)' },
  { value: 'hardClip', label: 'Hard Clip' },
  { value: 'fuzz', label: 'Fuzz' },
];

export const NOISE_TYPE_OPTIONS: { value: NoiseType; label: string }[] = [
  { value: NoiseType.WHITE, label: 'White Noise' },
  { value: NoiseType.PINK, label: 'Pink Noise (Approx.)' },
];

export const COMPRESSOR_SIDECHAIN_SOURCE_OPTIONS: { value: CompressorSidechainSource; label: string}[] = [
    { value: 'none', label: 'None (Self)' },
    { value: 'voiceBus', label: 'Voice Bus (Synth Output)' },
    { value: 'noiseBus', label: 'Noise Bus' },
];

export const BUILT_IN_IRS: ImpulseResponseDefinition[] = [
    { name: "Default Spring", url: "default_spring" },
    { name: "Small Room", url: "small_room" },
    { name: "Large Hall", url: "large_hall" },
    { name: "Plate Reverb", url: "plate_reverb" },
    { name: "Cosmic Swirl", url: "cosmic_swirl" },
    { name: "Custom Loaded IR", url: "custom_loaded_ir"},
];


export const BUILT_IN_IR_DATA: Record<string, string> = {
  "default_spring": "UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAAAA/w==", // Minimal
  "small_room": "UklGRlAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA", // Short impulse example
  "large_hall": "UklGRlYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACAgICAgICAgA==", // Slightly longer example
  "plate_reverb": "UklGRkoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYAAACAgICAgICA", // Another example
  "cosmic_swirl": "UklGRmAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRQAAACAgICAgICAgICAgICAgICAgICAgIA=", // Example synthetic
  // "custom_loaded_ir" will not have data here, it's loaded by the user.
};


export const SEND_MODE_OPTIONS: { value: SendMode; label: string }[] = [
  { value: 'pre', label: 'Pre-Fader' },
  { value: 'post', label: 'Post-Fader' },
];

export const MOD_SOURCE_OPTIONS: { value: ModSource; label: string }[] = [
  { value: ModSource.NONE, label: 'None' },
  { value: ModSource.LFO1, label: 'LFO 1' },
  { value: ModSource.ENV1, label: 'Envelope 1' },
  { value: ModSource.VELOCITY, label: 'Velocity' },
  { value: ModSource.MODWHEEL, label: 'Mod Wheel' },
];

export const MOD_DESTINATION_OPTIONS: { value: ModDestination; label: string }[] = [
  { value: ModDestination.NONE, label: 'None' },
  { value: ModDestination.OSC_X_PITCH, label: 'Osc X Pitch' },
  { value: ModDestination.OSC_Y_PITCH, label: 'Osc Y Pitch' },
  { value: ModDestination.OSC_XY_PITCH, label: 'Osc X/Y Pitch' },
  { value: ModDestination.OSC_X_RATIO, label: 'Osc X Ratio' },
  { value: ModDestination.OSC_Y_RATIO, label: 'Osc Y Ratio' },
  { value: ModDestination.OSC_Y_PHASE, label: 'Osc Y Phase' },
  { value: ModDestination.FILTER_X_CUTOFF, label: 'Filter X Cutoff' },
  { value: ModDestination.FILTER_Y_CUTOFF, label: 'Filter Y Cutoff' },
  { value: ModDestination.FILTER_XY_CUTOFF, label: 'Filter X/Y Cutoff' },
  { value: ModDestination.VCA_X_LEVEL, label: 'VCA X Level' },
  { value: ModDestination.VCA_Y_LEVEL, label: 'VCA Y Level' },
  { value: ModDestination.VCA_XY_LEVEL, label: 'VCA X/Y Level' },
  { value: ModDestination.LFO1_RATE, label: 'LFO 1 Rate' },
  { value: ModDestination.LFO1_DEPTH, label: 'LFO 1 Depth' },
  { value: ModDestination.OSC_X_WAVETABLE_POS, label: 'Osc X WT Pos' },
  { value: ModDestination.OSC_Y_WAVETABLE_POS, label: 'Osc Y WT Pos' },
  { value: ModDestination.ENV1_ATTACK, label: 'Env 1 Attack' },
  { value: ModDestination.ENV1_DECAY, label: 'Env 1 Decay' },
  { value: ModDestination.ENV1_SUSTAIN, label: 'Env 1 Sustain' },
  { value: ModDestination.ENV1_RELEASE, label: 'Env 1 Release' },
];

// Dummy component to satisfy type, actual components are in App.tsx componentMap
const DummyComponent: React.FC<any> = () => React.createElement('div');

export const INSERT_EFFECT_DEFINITIONS: EffectWindowConfig[] = [
  { id: 'ringmod', title: 'RING MODULATOR (Insert)', component: DummyComponent },
  { id: 'waveshaper', title: 'WAVESHAPER (Insert)', component: DummyComponent },
  { id: 'stereowidth', title: 'STEREO WIDTH (Insert)', component: DummyComponent },
  { id: 'overdrive', title: 'OVERDRIVE/DISTORTION (Insert)', component: DummyComponent },
  { id: 'lowpassInsert', title: 'LOW-PASS FILTER (Insert)', component: DummyComponent },
  { id: 'highpassInsert', title: 'HIGH-PASS FILTER (Insert)', component: DummyComponent },
  { id: 'bandpassInsert', title: 'BAND-PASS FILTER (Insert)', component: DummyComponent },
  { id: 'notchInsert', title: 'NOTCH FILTER (Insert)', component: DummyComponent },
  { id: 'compressor', title: 'COMPRESSOR (Insert)', component: DummyComponent },
  { id: 'threeBandEq', title: '3-BAND EQ (Insert)', component: DummyComponent, width: EQ_EFFECT_WINDOW_WIDTH },
  { id: 'ladderFilter', title: '"MOOG" LADDER FILTER (Insert)', component: DummyComponent },
];


export const PREDEFINED_SIDEBAR_LAYOUTS: Record<string, { name: string; effects: string[] }> = {
  default: {
    name: 'Default Synth',
    effects: ['oscillators', 'filter-lfo', 'envelope', 'noise', 'presets'],
  },
  effectsFocused: {
    name: 'Effects Rack',
    effects: ['delay', 'reverb', 'overdrive', 'compressor', 'threeBandEq', 'ladderFilter', 'ringmod', 'waveshaper', 'stereowidth'],
  },
  modulation: {
    name: 'Modulation Hub',
    effects: ['modMatrix', 'lfoParams', 'envParams', 'oscillators'],
  },
  allOpen: {
    name: 'Show All Panels',
    effects: [
      'oscillators', 'filter-lfo', 'envelope', 'noise', 'modMatrix',
      'delay', 'reverb', 'ringmod', 'waveshaper', 'stereowidth', 'overdrive',
      'lowpassInsert', 'highpassInsert', 'bandpassInsert', 'notchInsert',
      'compressor', 'threeBandEq', 'ladderFilter',
      'presets', 'performance', 'globalBpm', 'visuals', 'midiMappings'
    ].filter(id => id !== 'masterMixer') // masterMixer is not a sidebar panel
  },
   minimal: {
    name: 'Minimal Synth',
    effects: ['oscillators', 'envelope', 'presets'],
  }
};