
import {
  OscillatorParams, FilterParams, LfoParams, EnvelopeParams, Waveform, LfoTarget, ActiveNoteNode,
  DelayParams, RingModParams, WaveshaperParams, StereoWidthParams, NoiseParams, NoiseType, ReverbParams,
  MasterMixerParams, InsertEffectId, OverdriveParams, OverdriveCurveType, FilterNodeType, LowPassFilterInsertParams,
  HighPassFilterInsertParams, BandPassFilterInsertParams, NotchFilterInsertParams, CompressorParams,
  ThreeBandEqParams, LadderFilterParams, SendMode, ModMatrixParams, CompressorSidechainSource, UserWavetable
} from '../types';
import { MAX_PHASE_DELAY_TIME, RAMP_TIME, MAX_POLYPHONY, DEFAULT_GLOBAL_BPM } from '../constants';
import { createAllPeriodicWaves, PeriodicWaveStore, PeriodicWaveUtils } from './PeriodicWaves';
import { Voice } from './Voice';
import { NoiseSource } from './sources/NoiseSource';
import { AudioEffect } from './effects/AudioEffect';
import { LowPassInsertFilterEffect } from './effects/LowPassInsertFilterEffect';
import { HighPassInsertFilterEffect } from './effects/HighPassInsertFilterEffect';
import { BandPassInsertFilterEffect } from './effects/BandPassInsertFilterEffect';
import { NotchInsertFilterEffect } from './effects/NotchInsertFilterEffect';
import { RingModEffect } from './effects/RingModEffect';
import { WaveshaperEffect } from './effects/WaveshaperEffect';
import { OverdriveEffect } from './effects/OverdriveEffect';
import { StereoWidthEffect } from './effects/StereoWidthEffect';
import { CompressorEffect } from './effects/CompressorEffect';
import { ThreeBandEqEffect } from './effects/ThreeBandEqEffect';
import { LadderFilterEffect } from './effects/LadderFilterEffect';
import { DelayEffect } from './effects/DelayEffect';
import { ReverbEffect } from './effects/ReverbEffect';


const WAVETABLE_OSCILLATOR_PROCESSOR_CODE = `
// audio/WavetableOscillatorProcessor.js embedded content

const DEFAULT_SAMPLE_TABLE_LENGTH = 2048; // Standard length for sample frames

class WavetableOscillatorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 440, minValue: 0.001, maxValue: 22050, automationRate: 'a-rate' },
      { name: 'detune', defaultValue: 0, minValue: -4800, maxValue: 4800, automationRate: 'a-rate' },
      { name: 'morphPositionX', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'morphPositionY', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    ];
  }

  constructor(options) {
    super(options);
    this.phase = 0;
    this.currentSampleFrames = []; // Expects Float32Array[][]
    this.currentTableId = null;
    this._sampleRate = sampleRate; 
    this.processorId = options?.processorOptions?.processorId || 'unknown-worklet';

    this.port.onmessage = (event) => {
      if (event.data.type === 'loadTable') {
        this.currentSampleFrames = event.data.sampleFrames || [];
        this.currentTableId = event.data.tableId;
        this.phase = 0; 
      }
    };
  }

  _interpolateFrames(frameA, frameB, factor, frameLength) {
    if (!frameA) return frameB || new Float32Array(frameLength).fill(0);
    if (!frameB) return frameA;
    if (factor === 0) return frameA;
    if (factor === 1) return frameB;

    const interpolatedFrame = new Float32Array(frameLength);
    for (let s = 0; s < frameLength; s++) {
      const valA = frameA[s] || 0;
      const valB = frameB[s] || 0;
      interpolatedFrame[s] = valA * (1 - factor) + valB * factor;
    }
    return interpolatedFrame;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const outputChannelL = output[0];
    const outputChannelR = output.length > 1 ? output[1] : null;

    const frequencyParam = parameters.frequency;
    const detuneParam = parameters.detune;
    const morphPositionXParam = parameters.morphPositionX;
    const morphPositionYParam = parameters.morphPositionY;
    
    const numFrames = outputChannelL.length;

    const table2D = this.currentSampleFrames;
    if (!table2D || table2D.length === 0 || !table2D[0] || table2D[0].length === 0) {
      for (let i = 0; i < numFrames; ++i) {
        outputChannelL[i] = 0;
        if (outputChannelR) outputChannelR[i] = 0;
      }
      return true;
    }
    
    const frameLength = table2D[0][0]?.length || DEFAULT_SAMPLE_TABLE_LENGTH;
    const fallbackFrame = new Float32Array(frameLength).fill(0); // Silence

    for (let i = 0; i < numFrames; ++i) {
      const freq = frequencyParam.length > 1 ? frequencyParam[i] : frequencyParam[0];
      const detune = detuneParam.length > 1 ? detuneParam[i] : detuneParam[0];
      const morphX = Math.max(0, Math.min(1, morphPositionXParam.length > 1 ? morphPositionXParam[i] : morphPositionXParam[0]));
      const morphY = Math.max(0, Math.min(1, morphPositionYParam.length > 1 ? morphPositionYParam[i] : morphPositionYParam[0]));

      const currentFrequency = freq * Math.pow(2, detune / 1200);
      
      const numRows = table2D.length;
      const numCols = table2D[0].length;

      const yGlobalIndex = morphY * (numRows - 1);
      const yIdx1 = Math.floor(yGlobalIndex);
      const yIdx2 = Math.min(numRows - 1, yIdx1 + 1);
      const yFactor = yGlobalIndex - yIdx1;

      const xGlobalIndex = morphX * (numCols - 1);
      const xIdx1 = Math.floor(xGlobalIndex);
      const xIdx2 = Math.min(numCols - 1, xIdx1 + 1);
      const xFactor = xGlobalIndex - xIdx1;

      const frameTL = table2D[yIdx1]?.[xIdx1] || fallbackFrame;
      const frameTR = table2D[yIdx1]?.[xIdx2] || frameTL;
      const frameBL = table2D[yIdx2]?.[xIdx1] || frameTL;
      const frameBR = table2D[yIdx2]?.[xIdx2] || frameBL;
      
      let finalInterpolatedFrame;
      if (numRows === 1 && numCols === 1) {
        finalInterpolatedFrame = frameTL;
      } else {
         const topInterpolated = this._interpolateFrames(frameTL, frameTR, xFactor, frameLength);
         const bottomInterpolated = this._interpolateFrames(frameBL, frameBR, xFactor, frameLength);
         finalInterpolatedFrame = this._interpolateFrames(topInterpolated, bottomInterpolated, yFactor, frameLength);
      }
      
      const readIndexUnscaled = this.phase / (2 * Math.PI); // 0 to 1
      const readIndex = readIndexUnscaled * (finalInterpolatedFrame.length -1); // Scale to frame length

      const idxFloor = Math.floor(readIndex);
      const idxCeil = Math.min(finalInterpolatedFrame.length - 1, Math.ceil(readIndex));
      const interpFactor = readIndex - idxFloor;

      const sampleA = finalInterpolatedFrame[idxFloor] || 0;
      const sampleB = finalInterpolatedFrame[idxCeil] || 0;
      
      const sampleValue = sampleA * (1 - interpFactor) + sampleB * interpFactor;

      outputChannelL[i] = sampleValue * 0.5; // Adjust gain if needed
      if (outputChannelR) outputChannelR[i] = outputChannelL[i];

      this.phase += (2 * Math.PI * currentFrequency) / this._sampleRate;
      if (this.phase >= 2 * Math.PI) {
        this.phase -= 2 * Math.PI;
      }
    }
    return true;
  }
}

registerProcessor('wavetable-oscillator-processor', WavetableOscillatorProcessor);
`;


const dbToGain = (db: number): number => Math.pow(10, db / 20);

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyserX: AnalyserNode | null = null;
  private analyserY: AnalyserNode | null = null;

  private activeNotes: Map<string, ActiveNoteNode> = new Map();
  private periodicWaves: PeriodicWaveStore = {};

  private currentOscillatorParams: OscillatorParams;
  private currentFilterParams: FilterParams;
  private currentLfoParams: LfoParams;
  private currentEnvelopeParams: EnvelopeParams;
  private currentDelayParams: DelayParams;
  private currentReverbParams: ReverbParams;
  private currentRingModParams: RingModParams;
  private currentWaveshaperParams: WaveshaperParams;
  private currentStereoWidthParams: StereoWidthParams;
  private currentNoiseParams: NoiseParams;
  private currentMasterMixerParams: MasterMixerParams;
  private currentOverdriveParams: OverdriveParams;
  private currentLowPassFilterInsertParams: LowPassFilterInsertParams;
  private currentHighPassFilterInsertParams: HighPassFilterInsertParams;
  private currentBandPassFilterInsertParams: BandPassFilterInsertParams;
  private currentNotchFilterInsertParams: NotchFilterInsertParams;
  private currentCompressorParams: CompressorParams;
  private currentThreeBandEqParams: ThreeBandEqParams;
  private currentLadderFilterParams: LadderFilterParams;
  private currentModMatrixParams: ModMatrixParams;
  private currentGlobalBpm: number;
  private currentModWheelValue: number = 0;
  private userWavetables: Record<string, UserWavetable>;


  private voiceBus: GainNode | null = null;
  private finalMixBusNode: GainNode | null = null;
  private postInsertChainTapNode: GainNode | null = null;

  private masterDelaySendGainNode: GainNode | null = null;
  private delayReturnGainNode: GainNode | null = null;
  private masterReverbSendGainNode: GainNode | null = null;
  private reverbReturnGainNode: GainNode | null = null;

  private delayEffect: DelayEffect | null = null;
  private reverbEffect: ReverbEffect | null = null;

  private lowPassInsertEffect: LowPassInsertFilterEffect | null = null;
  private highPassInsertEffect: HighPassInsertFilterEffect | null = null;
  private bandPassInsertEffect: BandPassInsertFilterEffect | null = null;
  private notchInsertEffect: NotchInsertFilterEffect | null = null;
  private ringModEffect: RingModEffect | null = null;
  private waveshaperEffect: WaveshaperEffect | null = null;
  private overdriveEffect: OverdriveEffect | null = null;
  private stereoWidthEffect: StereoWidthEffect | null = null;
  private compressorEffect: CompressorEffect | null = null;
  private threeBandEqEffect: ThreeBandEqEffect | null = null;
  private ladderFilterEffect: LadderFilterEffect | null = null;

  private allInsertEffects: Map<InsertEffectId, AudioEffect> = new Map();

  private noiseSource: NoiseSource | null = null;

  private masterPreLimiterAnalyser: AnalyserNode | null = null;
  private masterPostLimiterAnalyser: AnalyserNode | null = null;

  private preInsertChainAnalyser: AnalyserNode | null = null;
  private delaySendInputAnalyser: AnalyserNode | null = null;
  private reverbSendInputAnalyser: AnalyserNode | null = null;

  private fastClipCheckDataArray: Float32Array | null = null;
  private isAudioEngineInitialized: boolean = false;

  private currentUserMaxPolyphony: number;
  private onVoiceCountChangeCallback: (count: number) => void;
  private onVoiceStealCallback: () => void;

  private baseMasterLevel: number = 0.8;
  private currentMasterTrimDb: number = 0;
  private isLimiterCurrentlyEnabled: boolean = true;
  private currentLimiterThresholdDb: number = -6;
  
  private wavetableWorkletBlobUrl: string | null = null;


  constructor(
    initialOscParams: OscillatorParams, initialFilterParams: FilterParams, initialLfoParams: LfoParams,
    initialEnvelopeParams: EnvelopeParams, initialDelayParams: DelayParams, initialReverbParams: ReverbParams,
    initialRingModParams: RingModParams, initialWaveshaperParams: WaveshaperParams, initialStereoWidthParams: StereoWidthParams,
    initialNoiseParams: NoiseParams, initialMasterMixerParams: MasterMixerParams, initialOverdriveParams: OverdriveParams,
    initialLowPassFilterInsertParams: LowPassFilterInsertParams, initialHighPassFilterInsertParams: HighPassFilterInsertParams,
    initialBandPassFilterInsertParams: BandPassFilterInsertParams, initialNotchFilterInsertParams: NotchFilterInsertParams,
    initialCompressorParams: CompressorParams, initialThreeBandEqParams: ThreeBandEqParams, initialLadderFilterParams: LadderFilterParams,
    initialModMatrixParams: ModMatrixParams,
    initialUserMaxPolyphony: number,
    onVoiceCountChange: (count: number) => void,
    onVoiceSteal: () => void,
    initialGlobalBpm: number,
    initialUserWavetables: Record<string, UserWavetable> 
  ) {
    this.currentOscillatorParams = { ...initialOscParams };
    this.currentFilterParams = { ...initialFilterParams };
    this.currentLfoParams = { ...initialLfoParams };
    this.currentEnvelopeParams = { ...initialEnvelopeParams };
    this.currentDelayParams = { ...initialDelayParams };
    this.currentReverbParams = { ...initialReverbParams };
    this.currentRingModParams = { ...initialRingModParams };
    this.currentWaveshaperParams = { ...initialWaveshaperParams };
    this.currentStereoWidthParams = { ...initialStereoWidthParams };
    this.currentNoiseParams = { ...initialNoiseParams };
    this.currentMasterMixerParams = { ...initialMasterMixerParams };
    this.currentOverdriveParams = { ...initialOverdriveParams };
    this.currentLowPassFilterInsertParams = { ...initialLowPassFilterInsertParams };
    this.currentHighPassFilterInsertParams = { ...initialHighPassFilterInsertParams };
    this.currentBandPassFilterInsertParams = { ...initialBandPassFilterInsertParams };
    this.currentNotchFilterInsertParams = { ...initialNotchFilterInsertParams };
    this.currentCompressorParams = { ...initialCompressorParams };
    this.currentThreeBandEqParams = { ...initialThreeBandEqParams };
    this.currentLadderFilterParams = { ...initialLadderFilterParams };
    this.currentModMatrixParams = { ...initialModMatrixParams };
    this.currentUserMaxPolyphony = initialUserMaxPolyphony;
    this.onVoiceCountChangeCallback = onVoiceCountChange;
    this.onVoiceStealCallback = onVoiceSteal;
    this.currentGlobalBpm = initialGlobalBpm;
    this.userWavetables = { ...initialUserWavetables }; 
  }

  public setUserMaxPolyphony(limit: number): void {
    this.currentUserMaxPolyphony = limit;
  }

  public updateUserWavetables(newUserWavetables: Record<string, UserWavetable>): void {
    this.userWavetables = { ...newUserWavetables };
    this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.updateUserWavetables(this.userWavetables);
    });
  }


  public updateGlobalBpm(newBpm: number): void {
    this.currentGlobalBpm = newBpm;
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach(noteNode => noteNode.voiceInstance.updateLfoParams(this.currentLfoParams, this.currentFilterParams, now));
     if (this.activeNotes.size > 0) {
      this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.updateModMatrixParams(
          this.currentModMatrixParams,
          this.currentOscillatorParams,
          this.currentFilterParams,
          this.currentLfoParams,
          this.currentEnvelopeParams,
          this.currentModWheelValue,
          now
        );
      });
    }
  }

  public updateGlobalModWheelValue(newValue: number): void {
    this.currentModWheelValue = newValue;
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.updateModWheelValue(newValue, now);
    });
    this.updateModMatrixDueToParamChange(now, true);
  }


  private updateDynamicScalingForAllNotes(time: number): void {
    if (!this.audioContext) return;
    const numActiveNotes = this.activeNotes.size;
    if (numActiveNotes === 0) return;
    const scaleFactor = Math.min(1.0, 1.0 / Math.sqrt(numActiveNotes * 0.75));
    this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.setDynamicScale(scaleFactor, time);
    });
  }

  public async init(): Promise<boolean> {
    if (this.isAudioEngineInitialized || this.audioContext) return true;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();

      // Load AudioWorklet module using Blob URL
      try {
        const blob = new Blob([WAVETABLE_OSCILLATOR_PROCESSOR_CODE], { type: 'application/javascript' });
        this.wavetableWorkletBlobUrl = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(this.wavetableWorkletBlobUrl);
      } catch (e) {
        console.error('Failed to load WavetableOscillatorProcessor module via Blob URL:', e);
        if (this.wavetableWorkletBlobUrl) {
            URL.revokeObjectURL(this.wavetableWorkletBlobUrl);
            this.wavetableWorkletBlobUrl = null;
        }
      }

      this.isAudioEngineInitialized = true;

      this.masterGain = this.audioContext.createGain();
      const initialMasterGainValue = this.baseMasterLevel * dbToGain(this.currentMasterTrimDb);
      this.masterGain.gain.setValueAtTime(initialMasterGainValue, this.audioContext.currentTime);

      this.limiter = this.audioContext.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(this.currentLimiterThresholdDb, 0);
      this.limiter.knee.setValueAtTime(0, 0);
      this.limiter.ratio.setValueAtTime(20, 0);
      (this.limiter.attack as AudioParam).setValueAtTime(0.003, 0);
      (this.limiter.release as AudioParam).setValueAtTime(0.1, 0);

      this.analyserX = this.audioContext.createAnalyser(); this.analyserX.fftSize = 2048;
      this.analyserY = this.audioContext.createAnalyser(); this.analyserY.fftSize = 2048;

      this.preInsertChainAnalyser = this.audioContext.createAnalyser(); this.preInsertChainAnalyser.fftSize = 2048;

      this.voiceBus = this.audioContext.createGain();
      this.voiceBus.connect(this.preInsertChainAnalyser);
      this.preInsertChainAnalyser.connect(this.masterGain);

      this.finalMixBusNode = this.audioContext.createGain();
      this.postInsertChainTapNode = this.audioContext.createGain();

      this.periodicWaves = createAllPeriodicWaves(this.audioContext);
      this.noiseSource = new NoiseSource(this.audioContext);
      this.noiseSource.start();

      this.masterDelaySendGainNode = this.audioContext.createGain();
      this.delayReturnGainNode = this.audioContext.createGain();
      this.delayEffect = new DelayEffect(this.audioContext);
      this.delaySendInputAnalyser = this.audioContext.createAnalyser(); this.delaySendInputAnalyser.fftSize = 2048;
      this.masterDelaySendGainNode.connect(this.delaySendInputAnalyser).connect(this.delayEffect.getInputNode());
      this.delayEffect.getOutputNode().connect(this.delayReturnGainNode);
      this.delayReturnGainNode.connect(this.finalMixBusNode);

      this.masterReverbSendGainNode = this.audioContext.createGain();
      this.reverbReturnGainNode = this.audioContext.createGain();
      this.reverbEffect = new ReverbEffect(this.audioContext);
      this.reverbSendInputAnalyser = this.audioContext.createAnalyser(); this.reverbSendInputAnalyser.fftSize = 2048;
      this.masterReverbSendGainNode.connect(this.reverbSendInputAnalyser).connect(this.reverbEffect.getInputNode());
      this.reverbEffect.getOutputNode().connect(this.reverbReturnGainNode);
      this.reverbReturnGainNode.connect(this.finalMixBusNode);

      this.lowPassInsertEffect = new LowPassInsertFilterEffect(this.audioContext);
      this.allInsertEffects.set('lowpassInsert', this.lowPassInsertEffect);
      this.highPassInsertEffect = new HighPassInsertFilterEffect(this.audioContext);
      this.allInsertEffects.set('highpassInsert', this.highPassInsertEffect);
      this.bandPassInsertEffect = new BandPassInsertFilterEffect(this.audioContext);
      this.allInsertEffects.set('bandpassInsert', this.bandPassInsertEffect);
      this.notchInsertEffect = new NotchInsertFilterEffect(this.audioContext);
      this.allInsertEffects.set('notchInsert', this.notchInsertEffect);
      this.ringModEffect = new RingModEffect(this.audioContext, this.periodicWaves);
      this.allInsertEffects.set('ringmod', this.ringModEffect);
      this.waveshaperEffect = new WaveshaperEffect(this.audioContext);
      this.allInsertEffects.set('waveshaper', this.waveshaperEffect);
      this.overdriveEffect = new OverdriveEffect(this.audioContext);
      this.allInsertEffects.set('overdrive', this.overdriveEffect);
      this.stereoWidthEffect = new StereoWidthEffect(this.audioContext);
      this.allInsertEffects.set('stereowidth', this.stereoWidthEffect);
      this.compressorEffect = new CompressorEffect(this.audioContext);
      this.allInsertEffects.set('compressor', this.compressorEffect);
      this.threeBandEqEffect = new ThreeBandEqEffect(this.audioContext);
      this.allInsertEffects.set('threeBandEq', this.threeBandEqEffect);
      this.ladderFilterEffect = new LadderFilterEffect(this.audioContext);
      this.allInsertEffects.set('ladderFilter', this.ladderFilterEffect);

      this.masterPreLimiterAnalyser = this.audioContext.createAnalyser(); this.masterPreLimiterAnalyser.fftSize = 2048;
      this.masterPostLimiterAnalyser = this.audioContext.createAnalyser(); this.masterPostLimiterAnalyser.fftSize = 2048;

      // Initial limiter connection based on isLimiterCurrentlyEnabled
      this.finalMixBusNode.connect(this.masterPreLimiterAnalyser);
      if (this.isLimiterCurrentlyEnabled) {
        this.masterPreLimiterAnalyser.connect(this.limiter);
        this.limiter.connect(this.masterPostLimiterAnalyser);
      } else {
        this.masterPreLimiterAnalyser.connect(this.masterPostLimiterAnalyser);
      }
      this.masterPostLimiterAnalyser.connect(this.audioContext.destination);


      this.fastClipCheckDataArray = new Float32Array(2048);

      this._patchAudioFlow();

      this.updateNoiseParams(this.currentNoiseParams);
      this.updateDelayParams(this.currentDelayParams);
      this.updateReverbParams(this.currentReverbParams);
      this.updateRingModParams(this.currentRingModParams);
      this.updateWaveshaperParams(this.currentWaveshaperParams);
      this.updateStereoWidthParams(this.currentStereoWidthParams);
      this.updateOverdriveParams(this.currentOverdriveParams);
      this.updateLowPassFilterInsertParams(this.currentLowPassFilterInsertParams);
      this.updateHighPassFilterInsertParams(this.currentHighPassFilterInsertParams);
      this.updateBandPassFilterInsertParams(this.currentBandPassFilterInsertParams);
      this.updateNotchFilterInsertParams(this.currentNotchFilterInsertParams);
      this.updateCompressorParams(this.currentCompressorParams);
      this.updateThreeBandEqParams(this.currentThreeBandEqParams);
      this.updateLadderFilterParams(this.currentLadderFilterParams);
      this.updateMasterMixerParams(this.currentMasterMixerParams);
      this.updateModMatrixParams(this.currentModMatrixParams, this.currentModWheelValue);
      this.updateGlobalBpm(this.currentGlobalBpm);

      return true;
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
      this.audioContext = null;
      this.isAudioEngineInitialized = false;
      return false;
    }
  }

  private _patchAudioFlow(): void {
    if (!this.audioContext || !this.masterGain || !this.postInsertChainTapNode || !this.finalMixBusNode ||
        !this.masterDelaySendGainNode || !this.masterReverbSendGainNode || !this.voiceBus || !this.preInsertChainAnalyser) {
      console.warn("AudioEngine: Cannot patch audio flow, essential nodes missing.");
      return;
    }

    try { this.masterGain.disconnect(); } catch(e) {}
    this.allInsertEffects.forEach(effect => { try { effect.disconnect(); } catch(e){} });
    try { this.postInsertChainTapNode.disconnect(); } catch(e){}

    let currentChainOutput: AudioNode = this.masterGain;
    for (const effectId of this.currentMasterMixerParams.insertEffectOrder) {
      const effectInstance = this.allInsertEffects.get(effectId);
      if (effectInstance) {
        currentChainOutput.connect(effectInstance.inputNode);
        currentChainOutput = effectInstance.outputNode;
      }
    }
    currentChainOutput.connect(this.postInsertChainTapNode);

    this.postInsertChainTapNode.connect(this.finalMixBusNode);

    this._updateSendSource(this.currentDelayParams.sendMode, this.masterDelaySendGainNode, this.masterGain, this.postInsertChainTapNode);
    this._updateSendSource(this.currentReverbParams.sendMode, this.masterReverbSendGainNode, this.masterGain, this.postInsertChainTapNode);
  }

  private _updateSendSource(
    sendMode: SendMode,
    masterSendNode: GainNode,
    preFaderSource: AudioNode,
    postFaderSource: AudioNode
  ): void {
    try { preFaderSource.disconnect(masterSendNode); } catch(e) {}
    try { postFaderSource.disconnect(masterSendNode); } catch(e) {}

    if (sendMode === 'pre') {
      preFaderSource.connect(masterSendNode);
    } else {
      postFaderSource.connect(masterSendNode);
    }
  }


  public isInitialized(): boolean { return this.isAudioEngineInitialized && !!this.audioContext; }

  public getAnalysers(): {
    analyserX: AnalyserNode | null; analyserY: AnalyserNode | null;
    masterPreLimiterAnalyser: AnalyserNode | null; masterPostLimiterAnalyser: AnalyserNode | null;
    preInsertChainAnalyser: AnalyserNode | null; delaySendInputAnalyser: AnalyserNode | null;
    reverbSendInputAnalyser: AnalyserNode | null;
  } {
    return {
      analyserX: this.analyserX, analyserY: this.analyserY,
      masterPreLimiterAnalyser: this.masterPreLimiterAnalyser, masterPostLimiterAnalyser: this.masterPostLimiterAnalyser,
      preInsertChainAnalyser: this.preInsertChainAnalyser,
      delaySendInputAnalyser: this.delaySendInputAnalyser, reverbSendInputAnalyser: this.reverbSendInputAnalyser,
    };
  }
  public getMasterLimiterReduction(): number {
    if (!this.isLimiterCurrentlyEnabled) return 0;
    return this.limiter?.reduction ?? 0;
  }

  public getInsertEffectAnalyser(id: InsertEffectId): AnalyserNode | null {
    return this.allInsertEffects.get(id)?.getAnalyser() || null;
  }
  public isInsertEffect(id: InsertEffectId): boolean {
    return this.allInsertEffects.has(id);
  }
  public hasActiveNotes(): boolean { return this.activeNotes.size > 0; }

  public checkFastGlobalClip(threshold: number = 0.98): boolean {
    if (!this.audioContext || !this.fastClipCheckDataArray || !this.masterPreLimiterAnalyser) return false;

    if (this.masterPreLimiterAnalyser.fftSize > this.fastClipCheckDataArray.length) {
        this.fastClipCheckDataArray = new Float32Array(this.masterPreLimiterAnalyser.fftSize);
    }

    const analysersToCheck: (AnalyserNode | null)[] = [
      this.masterPreLimiterAnalyser, this.delaySendInputAnalyser, this.reverbSendInputAnalyser,
      this.preInsertChainAnalyser,
    ];
    this.allInsertEffects.forEach(effect => {
        const analyser = effect.getAnalyser();
        if (analyser) analysersToCheck.push(analyser);
    });

    for (const analyser of analysersToCheck.filter(a => a != null)) {
      if (analyser) {
        const currentAnalyserFftSize = analyser.fftSize;
        let tempArray = this.fastClipCheckDataArray;
        if (currentAnalyserFftSize > tempArray.length) {
            tempArray = new Float32Array(currentAnalyserFftSize);
        }

        analyser.getFloatTimeDomainData(tempArray);
        const relevantLength = Math.min(currentAnalyserFftSize, tempArray.length);

        for (let i = 0; i < relevantLength; i++) {
          if (Math.abs(tempArray[i]) >= threshold) { return true; }
        }
      }
    }
    return false;
  }

  public playNote(noteId: string, baseFrequency: number, velocity: number = 0.75, modWheelValue: number): void {
    if (!this.audioContext || !this.voiceBus || !this.analyserX || !this.analyserY || !this.noiseSource) return;
    const now = this.audioContext.currentTime;
    const effectiveMaxPolyphony = Math.min(MAX_POLYPHONY, this.currentUserMaxPolyphony);

    if (this.activeNotes.has(noteId)) {
        const existingNoteNode = this.activeNotes.get(noteId)!;
        existingNoteNode.voiceInstance.noteOff(this.currentEnvelopeParams, now, true);
        this.activeNotes.delete(noteId);
    }
    else if (this.activeNotes.size >= effectiveMaxPolyphony) {
        let oldestNoteKey: string | null = null;
        let oldestNoteStartTime = Number.MAX_VALUE;

        this.activeNotes.forEach((noteNode, key) => {
            if (noteNode.startTime < oldestNoteStartTime) {
                oldestNoteStartTime = noteNode.startTime;
                oldestNoteKey = key;
            }
        });

        if (oldestNoteKey) {
            const voiceToSteal = this.activeNotes.get(oldestNoteKey)!;
            const minimalReleaseEnvelope: EnvelopeParams = {
                ...this.currentEnvelopeParams,
                release: 0.005,
                isEnvelopeEnabled: true
            };
            voiceToSteal.voiceInstance.noteOff(minimalReleaseEnvelope, now, true);
            this.activeNotes.delete(oldestNoteKey);
            this.onVoiceStealCallback();
        }
    }

    const voiceInstance = new Voice(
        this.audioContext, noteId, baseFrequency, velocity,
        this.periodicWaves, this.noiseSource.getOutputNode(),
        this.currentGlobalBpm, modWheelValue,
        this.userWavetables 
    );
    const newNoteNode: ActiveNoteNode = { voiceInstance, baseFrequency, startTime: now, velocity };

    voiceInstance.outputX.connect(this.analyserX!).connect(this.voiceBus);
    voiceInstance.outputY.connect(this.analyserY!).connect(this.voiceBus);

    voiceInstance.noteOn({
      osc: this.currentOscillatorParams,
      filter: this.currentFilterParams,
      lfo: this.currentLfoParams,
      envelope: this.currentEnvelopeParams,
      noise: this.currentNoiseParams,
      modMatrix: this.currentModMatrixParams,
    }, now);

    this.activeNotes.set(noteId, newNoteNode);
    this.updateDynamicScalingForAllNotes(now);
    this.onVoiceCountChangeCallback(this.activeNotes.size);
  }

  public stopNote(noteId: string): void {
    if (!this.audioContext || !this.activeNotes.has(noteId)) return;
    const now = this.audioContext.currentTime;
    const noteNodeInstance = this.activeNotes.get(noteId)!;

    noteNodeInstance.voiceInstance.noteOff(this.currentEnvelopeParams, now, false);

    const releaseTime = this.currentEnvelopeParams.isEnvelopeEnabled ? Math.max(0.001, this.currentEnvelopeParams.release) : RAMP_TIME;
    const voiceInternalNodeStopTime = releaseTime + 0.05;
    const timeUntilMapRemovalMs = (voiceInternalNodeStopTime - now + 0.1) * 1000;

    setTimeout(() => {
        const currentNoteInMap = this.activeNotes.get(noteId);
        if (currentNoteInMap && currentNoteInMap.voiceInstance === noteNodeInstance.voiceInstance) {
            this.activeNotes.delete(noteId);
            if (this.audioContext) {
              this.updateDynamicScalingForAllNotes(this.audioContext.currentTime);
            }
            this.onVoiceCountChangeCallback(this.activeNotes.size);
        }
    }, Math.max(10, timeUntilMapRemovalMs));
  }

  public updateOscillatorParams(params: OscillatorParams): void {
    this.currentOscillatorParams = { ...params };
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach(noteNode => noteNode.voiceInstance.updateOscillatorParams(params, now));
    this.updateModMatrixDueToParamChange(now);
  }

  public updateFilterParams(params: FilterParams): void {
    this.currentFilterParams = { ...params };
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach(noteNode => {
      noteNode.voiceInstance.updateFilterParams(params, now);
      noteNode.voiceInstance.updateLfoParams(this.currentLfoParams, params, now);
    });
    this.updateModMatrixDueToParamChange(now);
  }

  public updateLfoParams(params: LfoParams): void {
    this.currentLfoParams = { ...params };
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach(noteNode => noteNode.voiceInstance.updateLfoParams(params, this.currentFilterParams, now));
    this.updateModMatrixDueToParamChange(now);
  }

  public updateEnvelopeParams(params: EnvelopeParams): void {
    this.currentEnvelopeParams = { ...params };
    if (!this.audioContext) return;
    this.updateModMatrixDueToParamChange(this.audioContext.currentTime);
  }

  public updateNoiseParams(params: NoiseParams): void {
    this.currentNoiseParams = { ...params };
    if (!this.audioContext || !this.noiseSource) return;
    const now = this.audioContext.currentTime;
    this.noiseSource.update(params, now);
    this.activeNotes.forEach(noteNode => noteNode.voiceInstance.updateNoiseMix(params, now));
  }

  private updateModMatrixDueToParamChange(time: number, isModWheelUpdate: boolean = false): void {
    if (this.audioContext && this.activeNotes.size > 0) {
      this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.updateModMatrixParams(
          this.currentModMatrixParams,
          this.currentOscillatorParams,
          this.currentFilterParams,
          this.currentLfoParams,
          this.currentEnvelopeParams,
          this.currentModWheelValue,
          time
        );
      });
    }
  }

  public updateModMatrixParams(params: ModMatrixParams, modWheelValue: number): void {
    this.currentModMatrixParams = { ...params };
    this.currentModWheelValue = modWheelValue;
    if (this.audioContext && this.activeNotes.size > 0) {
      const now = this.audioContext.currentTime;
      this.activeNotes.forEach(noteNode => {
        noteNode.voiceInstance.updateModMatrixParams(
          params,
          this.currentOscillatorParams,
          this.currentFilterParams,
          this.currentLfoParams,
          this.currentEnvelopeParams,
          this.currentModWheelValue,
          now
        );
      });
    }
  }


  public updateDelayParams(params: DelayParams): void {
    this.currentDelayParams = { ...params };
    if (!this.audioContext || !this.delayEffect || !this.masterDelaySendGainNode ||
        !this.delayReturnGainNode || !this.masterGain || !this.postInsertChainTapNode) return;

    const now = this.audioContext.currentTime;
    const rampTargetTime = now + RAMP_TIME;

    this.delayEffect.update(params, now);
    this.delayEffect.enable(params.isDelayEnabled, now);

    this._updateSendSource(params.sendMode, this.masterDelaySendGainNode, this.masterGain, this.postInsertChainTapNode);

    this.masterDelaySendGainNode.gain.cancelScheduledValues(now);
    this.masterDelaySendGainNode.gain.setValueAtTime(this.masterDelaySendGainNode.gain.value, now);
    this.masterDelaySendGainNode.gain.linearRampToValueAtTime(this.currentMasterMixerParams.masterDelaySendLevel, rampTargetTime);

    const targetMasterReturn = params.isDelayEnabled ? this.currentMasterMixerParams.masterDelayReturnLevel : 0;
    this.delayReturnGainNode.gain.cancelScheduledValues(now);
    this.delayReturnGainNode.gain.setValueAtTime(this.delayReturnGainNode.gain.value, now);
    this.delayReturnGainNode.gain.linearRampToValueAtTime(targetMasterReturn, rampTargetTime);
  }

  public updateReverbParams(params: ReverbParams): void {
    this.currentReverbParams = { ...params };
     if (!this.audioContext || !this.reverbEffect || !this.masterReverbSendGainNode ||
        !this.reverbReturnGainNode || !this.masterGain || !this.postInsertChainTapNode) return;

    const now = this.audioContext.currentTime;
    const rampTargetTime = now + RAMP_TIME;

    this.reverbEffect.update(params, now);
    this.reverbEffect.enable(params.isReverbEnabled, now);

    this._updateSendSource(params.sendMode, this.masterReverbSendGainNode, this.masterGain, this.postInsertChainTapNode);

    this.masterReverbSendGainNode.gain.cancelScheduledValues(now);
    this.masterReverbSendGainNode.gain.setValueAtTime(this.masterReverbSendGainNode.gain.value, now);
    this.masterReverbSendGainNode.gain.linearRampToValueAtTime(this.currentMasterMixerParams.masterReverbSendLevel, rampTargetTime);

    const targetMasterReturn = params.isReverbEnabled ? this.currentMasterMixerParams.masterReverbReturnLevel : 0;
    this.reverbReturnGainNode.gain.cancelScheduledValues(now);
    this.reverbReturnGainNode.gain.setValueAtTime(this.reverbReturnGainNode.gain.value, now);
    this.reverbReturnGainNode.gain.linearRampToValueAtTime(targetMasterReturn, rampTargetTime);
  }

  public updateRingModParams(params: RingModParams): void {
    this.currentRingModParams = { ...params };
    if (!this.audioContext || !this.ringModEffect) return;
    const now = this.audioContext.currentTime;
    this.ringModEffect.update(params, now);
    if (params.isRingModEnabled) {
        const wetLevel = Math.sin(params.mix * Math.PI / 2);
        const dryLevel = Math.cos(params.mix * Math.PI / 2);
        this.ringModEffect.setDryWetLevels(dryLevel, wetLevel, now);
    } else {
        this.ringModEffect.enable(false, now);
    }
  }
  public updateWaveshaperParams(params: WaveshaperParams): void {
    this.currentWaveshaperParams = { ...params };
    if (!this.audioContext || !this.waveshaperEffect) return;
    const now = this.audioContext.currentTime;
    this.waveshaperEffect.update(params, now);
    this.waveshaperEffect.enable(params.isWaveshaperEnabled, now);
  }
  public updateStereoWidthParams(params: StereoWidthParams): void {
    this.currentStereoWidthParams = { ...params };
    if (!this.audioContext || !this.stereoWidthEffect) return;
    const now = this.audioContext.currentTime;
    this.stereoWidthEffect.update(params, now);
    this.stereoWidthEffect.enable(params.isStereoWidthEnabled, now);
  }
  public updateOverdriveParams(params: OverdriveParams): void {
    this.currentOverdriveParams = { ...params };
    if (!this.audioContext || !this.overdriveEffect) return;
    const now = this.audioContext.currentTime;
    this.overdriveEffect.update(params, now);
    this.overdriveEffect.enable(params.isOverdriveEnabled, now);
  }
  public updateLowPassFilterInsertParams(params: LowPassFilterInsertParams): void {
    this.currentLowPassFilterInsertParams = { ...params };
    if (!this.audioContext || !this.lowPassInsertEffect) return;
    const now = this.audioContext.currentTime;
    this.lowPassInsertEffect.update(params, now);
    this.lowPassInsertEffect.enable(params.isLowPassInsertEnabled, now);
  }
  public updateHighPassFilterInsertParams(params: HighPassFilterInsertParams): void {
    this.currentHighPassFilterInsertParams = { ...params };
    if (!this.audioContext || !this.highPassInsertEffect) return;
    const now = this.audioContext.currentTime;
    this.highPassInsertEffect.update(params, now);
    this.highPassInsertEffect.enable(params.isHighPassInsertEnabled, now);
  }
  public updateBandPassFilterInsertParams(params: BandPassFilterInsertParams): void {
    this.currentBandPassFilterInsertParams = { ...params };
    if (!this.audioContext || !this.bandPassInsertEffect) return;
    const now = this.audioContext.currentTime;
    this.bandPassInsertEffect.update(params, now);
    this.bandPassInsertEffect.enable(params.isBandPassInsertEnabled, now);
  }
  public updateNotchFilterInsertParams(params: NotchFilterInsertParams): void {
    this.currentNotchFilterInsertParams = { ...params };
    if (!this.audioContext || !this.notchInsertEffect) return;
    const now = this.audioContext.currentTime;
    this.notchInsertEffect.update(params, now);
    this.notchInsertEffect.enable(params.isNotchInsertEnabled, now);
  }
  public updateCompressorParams(params: CompressorParams): void {
    this.currentCompressorParams = { ...params };
    if (!this.audioContext || !this.compressorEffect) return;
    const now = this.audioContext.currentTime;

    let sidechainNodeToConnect: AudioNode | null = null;
    if (params.sidechainSource === 'voiceBus' && this.voiceBus) {
        sidechainNodeToConnect = this.voiceBus;
    } else if (params.sidechainSource === 'noiseBus' && this.noiseSource) {
        sidechainNodeToConnect = this.noiseSource.getOutputNode();
    }
    this.compressorEffect.setSidechainSource(sidechainNodeToConnect);

    this.compressorEffect.update(params, now);
    this.compressorEffect.enable(params.isCompressorEnabled, now);
  }
  public updateThreeBandEqParams(params: ThreeBandEqParams): void {
    this.currentThreeBandEqParams = { ...params };
    if (!this.audioContext || !this.threeBandEqEffect) return;
    const now = this.audioContext.currentTime;
    this.threeBandEqEffect.update(params, now);
    this.threeBandEqEffect.enable(params.isThreeBandEqEnabled, now);
  }
  public updateLadderFilterParams(params: LadderFilterParams): void {
    this.currentLadderFilterParams = { ...params };
    if (!this.audioContext || !this.ladderFilterEffect) return;
    const now = this.audioContext.currentTime;
    this.ladderFilterEffect.update(params, now);
    this.ladderFilterEffect.enable(params.isLadderFilterEnabled, now);
  }

  public updateMasterMixerParams(params: MasterMixerParams): void {
    const oldOrderString = this.currentMasterMixerParams.insertEffectOrder.join(',');
    const newOrderString = params.insertEffectOrder.join(',');

    this.currentMasterMixerParams = { ...params };

    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const rampTimeTarget = now + RAMP_TIME;

    if (this.masterDelaySendGainNode) {
        this.masterDelaySendGainNode.gain.cancelScheduledValues(now);
        this.masterDelaySendGainNode.gain.setValueAtTime(this.masterDelaySendGainNode.gain.value, now);
        this.masterDelaySendGainNode.gain.linearRampToValueAtTime(params.masterDelaySendLevel, rampTimeTarget);
    }
    if (this.masterReverbSendGainNode) {
        this.masterReverbSendGainNode.gain.cancelScheduledValues(now);
        this.masterReverbSendGainNode.gain.setValueAtTime(this.masterReverbSendGainNode.gain.value, now);
        this.masterReverbSendGainNode.gain.linearRampToValueAtTime(params.masterReverbSendLevel, rampTimeTarget);
    }
    if (this.delayReturnGainNode) {
      const targetDelayReturn = this.currentDelayParams.isDelayEnabled ? params.masterDelayReturnLevel : 0;
      this.delayReturnGainNode.gain.cancelScheduledValues(now);
      this.delayReturnGainNode.gain.setValueAtTime(this.delayReturnGainNode.gain.value, now);
      this.delayReturnGainNode.gain.linearRampToValueAtTime(targetDelayReturn, rampTimeTarget);
    }
    if (this.reverbReturnGainNode) {
      const targetReverbReturn = this.currentReverbParams.isReverbEnabled ? params.masterReverbReturnLevel : 0;
      this.reverbReturnGainNode.gain.cancelScheduledValues(now);
      this.reverbReturnGainNode.gain.setValueAtTime(this.reverbReturnGainNode.gain.value, now);
      this.reverbReturnGainNode.gain.linearRampToValueAtTime(targetReverbReturn, rampTimeTarget);
    }

    if (oldOrderString !== newOrderString) {
      this._patchAudioFlow();
    }
  }

  public setMasterVolumeTrimDb(dbValue: number): void {
    if (!this.audioContext || !this.masterGain) return;
    this.currentMasterTrimDb = dbValue;
    const newGain = this.baseMasterLevel * dbToGain(this.currentMasterTrimDb);
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(newGain, now + RAMP_TIME);
  }

  public setMasterLimiterEnabled(enabled: boolean): void {
    if (!this.audioContext || !this.limiter || !this.finalMixBusNode || !this.masterPreLimiterAnalyser || !this.masterPostLimiterAnalyser) return;
    this.isLimiterCurrentlyEnabled = enabled;

    // Disconnect relevant nodes before re-patching
    try { this.masterPreLimiterAnalyser.disconnect(); } catch(e) {}
    try { this.limiter.disconnect(); } catch(e) {}

    if (enabled) {
      this.masterPreLimiterAnalyser.connect(this.limiter);
      this.limiter.connect(this.masterPostLimiterAnalyser);
    } else {
      this.masterPreLimiterAnalyser.connect(this.masterPostLimiterAnalyser);
    }
  }

  public setMasterLimiterThreshold(thresholdDb: number): void {
    if (!this.audioContext || !this.limiter) return;
    this.currentLimiterThresholdDb = thresholdDb;
    if (this.isLimiterCurrentlyEnabled) {
      const now = this.audioContext.currentTime;
      this.limiter.threshold.cancelScheduledValues(now);
      this.limiter.threshold.setValueAtTime(this.limiter.threshold.value, now);
      this.limiter.threshold.linearRampToValueAtTime(thresholdDb, now + RAMP_TIME);
    }
  }

  public getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 0;
  }

  public getAudioContextTime(): number { return this.audioContext?.currentTime ?? 0; }

  public dispose(): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    this.activeNotes.forEach(noteNode => {
      noteNode.voiceInstance.noteOff({ ...this.currentEnvelopeParams, release: 0.01 }, now, true);
    });

    const voiceDisposeBufferImmediate = 0.01 + 0.001 + 0.01;
    const overallDisposeTimeout = (voiceDisposeBufferImmediate) * 1000 + 100;

    this.onVoiceCountChangeCallback = () => {};
    this.onVoiceStealCallback = () => {};


    setTimeout(() => {
        if (!this.audioContext) return;

        this.activeNotes.clear();

        this.allInsertEffects.forEach(effect => effect.dispose());
        this.allInsertEffects.clear();
        this.delayEffect?.dispose();
        this.reverbEffect?.dispose();
        this.noiseSource?.dispose();

        const masterNodesAndAnalysers: (AudioNode | null)[] = [
            this.masterGain, this.limiter, this.analyserX, this.analyserY,
            this.voiceBus, this.finalMixBusNode, this.postInsertChainTapNode,
            this.masterDelaySendGainNode, this.delayReturnGainNode,
            this.masterReverbSendGainNode, this.reverbReturnGainNode,
            this.masterPreLimiterAnalyser, this.masterPostLimiterAnalyser,
            this.preInsertChainAnalyser, this.delaySendInputAnalyser, this.reverbSendInputAnalyser
        ];
        masterNodesAndAnalysers.forEach(node => {
            try {
                if (node) node.disconnect();
            } catch (e) { }
        });

        if (this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(e => console.warn("Error closing AudioContext:", e));
        }
        
        if (this.wavetableWorkletBlobUrl) {
            URL.revokeObjectURL(this.wavetableWorkletBlobUrl);
            this.wavetableWorkletBlobUrl = null;
        }

        this.audioContext = null;
        this.isAudioEngineInitialized = false;

    }, overallDisposeTimeout);
  }
}
