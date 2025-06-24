import { Waveform, OscillatorParams, FilterParams, EnvelopeParams, NoiseParams, LfoParams, FilterNodeType, LfoTarget, ModMatrixParams, ModSource, ModDestination, UserWavetable, ModMatrixSlot, AllInstrumentParams } from '../types';
import { PeriodicWaveStore, PeriodicWaveUtils } from './PeriodicWaves';
import { RAMP_TIME, MAX_PHASE_DELAY_TIME, C4_FREQ, WAVETABLE_DEFINITIONS, NUM_MOD_SLOTS, DEFAULT_TABLE_SIZE, MIN_ENV_TIME, DEFAULT_LFO_PARAMS, DEFAULT_MOD_MATRIX_PARAMS } from '../constants';
import { WaveformUtils } from './WaveformUtils';

const MAX_UNISON_VOICES_LIMIT = 7;
const MOD_DESTINATION_SCALING_PITCH_CENTS = 1200; 
const MOD_DESTINATION_SCALING_FILTER_HZ = 5000;  
const MOD_DESTINATION_SCALING_PHASE_S = 0.01;    
const MOD_DESTINATION_SCALING_VCA_GAIN = 1.0;    
const MOD_DESTINATION_SCALING_LFO_RATE_HZ = 20;  
const MOD_DESTINATION_SCALING_LFO_DEPTH = 1.0;  
const MOD_DESTINATION_SCALING_WT_POS = 1.0;      
const MOD_DESTINATION_SCALING_RATIO_MOD = 1.0;  
const MOD_DESTINATION_SCALING_ENV_TIME = 2.0;    
const MOD_DESTINATION_SCALING_ENV_SUSTAIN = 0.5; 


interface SubOscillatorUnit {
  osc: OscillatorNode | AudioWorkletNode;
  isWorklet: boolean;
  vca: GainNode;
  panner?: StereoPannerNode;
  workletTableId?: string;
  processorId?: string;
  hasBeenStarted?: boolean;
}

interface ModSlotConnection {
  sourceNode?: AudioNode | null;
  targetParam?: AudioParam | null; // Could be single AudioParam or array for XY targets
  slotGainNode: GainNode;
  isNumericMod?: boolean; // True if this slot modulates a numeric JS param (e.g., envelope times)
  // Store what was connected to properly disconnect
  connectedSourceType?: ModSource;
  connectedDestinationType?: ModDestination;
}

let workletProcessorIdCounter = 0;


export class Voice {
  private audioContext: AudioContext;
  private _noteId: string;
  private _baseFrequency: number;
  private _velocity: number;
  private periodicWaves: PeriodicWaveStore;
  private globalBpm: number;
  private _modWheelValue: number;
  private userWavetables: Record<string, UserWavetable>;


  private subOscsX: SubOscillatorUnit[] = [];
  private subOscsY: SubOscillatorUnit[] = [];

  private phaseDelay: DelayNode;

  private filterX: BiquadFilterNode;
  private filterY: BiquadFilterNode;

  private noiseVcaGain: GainNode;

  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private lfoCustomShapeCurve: Float32Array | null = null;
  private lfoStartTime: number = 0;
  private currentLfoParamsForModulation: LfoParams; // For internal LFO value calculation
  private lfoHasBeenStarted: boolean = false;


  private envelopeSignalOutput: GainNode;

  private mainEnvelopeVcaX: GainNode;
  private mainEnvelopeVcaY: GainNode;

  // Modulation Matrix related
  private modSlotGains: GainNode[];
  private modVcaGainX: GainNode; // VCA level for X path, can be modulated
  private modVcaGainY: GainNode; // VCA level for Y path, can be modulated
  private modSlotConnections: (ModSlotConnection | null)[];
  private velocityModConstantSource: ConstantSourceNode | null = null;
  private modWheelConstantSource: ConstantSourceNode;
  
  private currentModMatrixParams: ModMatrixParams;
  private lastAppliedModMatrixParamsForStructure: ModMatrixParams;


  private postVoiceScalingVcaX: GainNode;
  private postVoiceScalingVcaY: GainNode;

  public outputX: GainNode;
  public outputY: GainNode;

  private isDisposed: boolean = false;

  constructor(
    audioContext: AudioContext,
    noteId: string,
    baseFrequency: number,
    velocity: number,
    periodicWaves: PeriodicWaveStore,
    globalNoiseOutput: AudioNode,
    globalBpm: number,
    initialModWheelValue: number,
    userWavetables: Record<string, UserWavetable>
  ) {
    this.audioContext = audioContext;
    this._noteId = noteId;
    this._baseFrequency = baseFrequency;
    this._velocity = velocity;
    this.periodicWaves = periodicWaves;
    this.globalBpm = globalBpm;
    this._modWheelValue = initialModWheelValue;
    this.userWavetables = userWavetables;
    
    this.currentLfoParamsForModulation = JSON.parse(JSON.stringify(DEFAULT_LFO_PARAMS));
    this.currentModMatrixParams = JSON.parse(JSON.stringify(DEFAULT_MOD_MATRIX_PARAMS));
    this.lastAppliedModMatrixParamsForStructure = JSON.parse(JSON.stringify(DEFAULT_MOD_MATRIX_PARAMS));


    this.filterX = this.audioContext.createBiquadFilter();
    this.filterY = this.audioContext.createBiquadFilter();

    this.phaseDelay = this.audioContext.createDelay(MAX_PHASE_DELAY_TIME);
    this.phaseDelay.connect(this.filterY);

    this.noiseVcaGain = this.audioContext.createGain();
    globalNoiseOutput.connect(this.noiseVcaGain);
    this.noiseVcaGain.connect(this.filterX);
    this.noiseVcaGain.connect(this.filterY);

    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    this.lfo.connect(this.lfoGain);

    this.envelopeSignalOutput = this.audioContext.createGain();
    this.envelopeSignalOutput.gain.value = 0;

    this.mainEnvelopeVcaX = this.audioContext.createGain();
    this.mainEnvelopeVcaY = this.audioContext.createGain();
    this.filterX.connect(this.mainEnvelopeVcaX);
    this.filterY.connect(this.mainEnvelopeVcaY);

    this.modSlotGains = [];
    for (let i = 0; i < NUM_MOD_SLOTS; i++) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0; // Mod amount is set here
      this.modSlotGains.push(gainNode);
    }
    this.modVcaGainX = this.audioContext.createGain(); 
    this.modVcaGainY = this.audioContext.createGain(); 
    this.modSlotConnections = Array(NUM_MOD_SLOTS).fill(null);

    if (this.audioContext.createConstantSource) {
        this.velocityModConstantSource = this.audioContext.createConstantSource();
        this.velocityModConstantSource.offset.value = this._velocity; // Initial velocity
        try { this.velocityModConstantSource.start(); } catch(e) {}
    }

    this.modWheelConstantSource = this.audioContext.createConstantSource();
    this.modWheelConstantSource.offset.value = this._modWheelValue;
    try { this.modWheelConstantSource.start(); } catch(e) {}


    this.postVoiceScalingVcaX = this.audioContext.createGain();
    this.postVoiceScalingVcaY = this.audioContext.createGain();
    this.postVoiceScalingVcaX.gain.value = 1.0;
    this.postVoiceScalingVcaY.gain.value = 1.0;

    this.mainEnvelopeVcaX.connect(this.modVcaGainX);
    this.modVcaGainX.connect(this.postVoiceScalingVcaX);
    this.mainEnvelopeVcaY.connect(this.modVcaGainY);
    this.modVcaGainY.connect(this.postVoiceScalingVcaY);

    this.outputX = this.audioContext.createGain();
    this.outputY = this.audioContext.createGain();
    this.postVoiceScalingVcaX.connect(this.outputX);
    this.postVoiceScalingVcaY.connect(this.outputY);

    // Initialize gains
    this.noiseVcaGain.gain.value = 0;
    this.mainEnvelopeVcaX.gain.value = 0;
    this.mainEnvelopeVcaY.gain.value = 0;
    this.lfoGain.gain.value = 0; // LFO depth controls this
  }
  
  private _getOscParam(
    unit: SubOscillatorUnit,
    paramName: 'frequency' | 'detune' | 'morphPositionX' | 'morphPositionY'
  ): AudioParam | undefined {
    if (unit.isWorklet) {
      return (unit.osc as AudioWorkletNode).parameters.get(paramName);
    } else {
      if (paramName === 'frequency' || paramName === 'detune') {
        return (unit.osc as OscillatorNode)[paramName];
      }
    }
    return undefined;
  }


  private _createSubOscillatorUnits(
    params: OscillatorParams,
    oscPath: 'X' | 'Y',
    time: number
  ): SubOscillatorUnit[] {
    const units: SubOscillatorUnit[] = [];
    const numVoices = Math.max(1, Math.min(params.unisonVoices, MAX_UNISON_VOICES_LIMIT));
    const targetFilter = oscPath === 'X' ? this.filterX : this.phaseDelay;
    const waveformType = oscPath === 'X' ? params.waveformX : params.waveformY;
    const processorIdBase = `voice-${this._noteId}-osc${oscPath}`;


    for (let i = 0; i < numVoices; i++) {
      let oscNode: OscillatorNode | AudioWorkletNode;
      let isWorklet = false;
      let workletTableId: string | undefined = undefined;
      const processorId = `${processorIdBase}-unison${i}-${workletProcessorIdCounter++}`;


      if (waveformType === Waveform.WAVETABLE) {
        isWorklet = true;
        oscNode = new AudioWorkletNode(this.audioContext, 'wavetable-oscillator-processor', { processorOptions: { processorId } });
        workletTableId = oscPath === 'X' ? params.wavetableX : params.wavetableY;
      } else {
        oscNode = this.audioContext.createOscillator();
      }

      const vca = this.audioContext.createGain();
      vca.gain.value = 1.0 / Math.sqrt(numVoices); // Apply gain compensation for unison

      let panner: StereoPannerNode | undefined;
      if (params.unisonSpread > 0 && numVoices > 1 && this.audioContext.createStereoPanner) {
        panner = this.audioContext.createStereoPanner();
        (oscNode as AudioNode).connect(vca).connect(panner).connect(targetFilter);
      } else {
        (oscNode as AudioNode).connect(vca).connect(targetFilter);
      }
      units.push({ osc: oscNode, isWorklet, vca, panner, workletTableId, processorId, hasBeenStarted: false });
    }
    return units;
  }

  public noteOn(params: AllInstrumentParams, time: number): void {
    if (this.isDisposed) return;
    const t = time;
    this.lfoStartTime = t;
    this.currentLfoParamsForModulation = { ...params.lfo }; // Store for internal LFO calculations
    this.currentModMatrixParams = {...params.modMatrix}; // Store for modulation logic


    const numVoicesX = Math.max(1, Math.min(params.osc.unisonVoices, MAX_UNISON_VOICES_LIMIT));
    const numVoicesY = Math.max(1, Math.min(params.osc.unisonVoices, MAX_UNISON_VOICES_LIMIT));

    // Recreate oscillator units if unison count or worklet status changes
    if (this.subOscsX.length !== numVoicesX || this.subOscsX.some(u => u.isWorklet !== (params.osc.waveformX === Waveform.WAVETABLE))) {
        this.subOscsX.forEach(unit => {
            if (!unit.isWorklet && unit.hasBeenStarted) { // Only stop standard oscillators
                try { (unit.osc as OscillatorNode).stop(t); } catch(e) {}
                unit.hasBeenStarted = false;
            }
            unit.osc.disconnect(); unit.vca.disconnect(); unit.panner?.disconnect();
        });
        this.subOscsX = this._createSubOscillatorUnits(params.osc, 'X', t);
    }
    if (this.subOscsY.length !== numVoicesY || this.subOscsY.some(u => u.isWorklet !== (params.osc.waveformY === Waveform.WAVETABLE))) {
        this.subOscsY.forEach(unit => {
            if (!unit.isWorklet && unit.hasBeenStarted) {
                try { (unit.osc as OscillatorNode).stop(t); } catch(e) {}
                unit.hasBeenStarted = false;
            }
            unit.osc.disconnect(); unit.vca.disconnect(); unit.panner?.disconnect();
        });
        this.subOscsY = this._createSubOscillatorUnits(params.osc, 'Y', t);
    }

    // Apply all parameters
    this.updateOscillatorParams(params.osc, t);
    this.updateFilterParams(params.filter, t);
    this.updateLfoParams(params.lfo, params.filter, t); // LFO depends on filter state (target)
    this.updateNoiseMix(params.noise, t);
    this._applyModulations(params.modMatrix, params.osc, params.filter, params.lfo, params.envelope, this._modWheelValue, t);

    // Calculate effective envelope parameters considering modulation
    const { effectiveAttack, effectiveDecay, effectiveSustain } = this._getModulatedEnvelopeParams(
        params.envelope, params.modMatrix, this._modWheelValue, this._velocity, t
    );

    // Apply envelope
    const isEnvelopeEnabled = params.envelope.isEnvelopeEnabled;
    const attackTime = Math.max(MIN_ENV_TIME, effectiveAttack);
    const decayTime = Math.max(MIN_ENV_TIME, effectiveDecay);
    let sustainLevel = Math.max(0.0001, Math.min(1.0, effectiveSustain));


    this.mainEnvelopeVcaX.gain.cancelScheduledValues(t);
    this.mainEnvelopeVcaX.gain.setValueAtTime(0, t);
    this.mainEnvelopeVcaY.gain.cancelScheduledValues(t);
    this.mainEnvelopeVcaY.gain.setValueAtTime(0, t);
    this.envelopeSignalOutput.gain.cancelScheduledValues(t);
    this.envelopeSignalOutput.gain.setValueAtTime(0,t);

    if (params.noise.isNoiseEnabled && isEnvelopeEnabled) {
        this.noiseVcaGain.gain.cancelScheduledValues(t);
        this.noiseVcaGain.gain.setValueAtTime(0, t);
    }


    if (isEnvelopeEnabled) {
      // Ramp up to 1.0 then down to sustain
      this.mainEnvelopeVcaX.gain.linearRampToValueAtTime(1.0, t + attackTime);
      this.mainEnvelopeVcaX.gain.linearRampToValueAtTime(sustainLevel, t + attackTime + decayTime);
      this.mainEnvelopeVcaY.gain.linearRampToValueAtTime(1.0, t + attackTime);
      this.mainEnvelopeVcaY.gain.linearRampToValueAtTime(sustainLevel, t + attackTime + decayTime);

      this.envelopeSignalOutput.gain.linearRampToValueAtTime(1.0, t + attackTime);
      this.envelopeSignalOutput.gain.linearRampToValueAtTime(sustainLevel, t + attackTime + decayTime);

      if (params.noise.isNoiseEnabled) {
        // Noise follows the same envelope shape, scaled by its own level
        this.noiseVcaGain.gain.linearRampToValueAtTime(params.noise.noiseLevel, t + attackTime);
        this.noiseVcaGain.gain.linearRampToValueAtTime(params.noise.noiseLevel * sustainLevel, t + attackTime + decayTime);
      }
    } else {
      // No envelope, ramp to fixed level (e.g., 0.7 for full sustain)
      const fixedLevel = 0.7; // Arbitrary fixed level if envelope is off
      this.mainEnvelopeVcaX.gain.linearRampToValueAtTime(fixedLevel, t + RAMP_TIME);
      this.mainEnvelopeVcaY.gain.linearRampToValueAtTime(fixedLevel, t + RAMP_TIME);
      this.envelopeSignalOutput.gain.linearRampToValueAtTime(fixedLevel, t + RAMP_TIME);
      if (params.noise.isNoiseEnabled) {
          this.noiseVcaGain.gain.linearRampToValueAtTime(params.noise.noiseLevel * fixedLevel, t + RAMP_TIME);
      }
    }

    // Start oscillators
    this.subOscsX.forEach(unit => { if (!unit.isWorklet) { try {(unit.osc as OscillatorNode).start(t);} catch(e){} unit.hasBeenStarted = true; }});
    this.subOscsY.forEach(unit => { if (!unit.isWorklet) { try {(unit.osc as OscillatorNode).start(t);} catch(e){} unit.hasBeenStarted = true; }});

    // Start LFO
    try { this.lfo.start(t); } catch(e){}
    this.lfoHasBeenStarted = true;
  }

  public noteOff(envParams: EnvelopeParams, time: number, immediateDispose: boolean = false): void {
    if (this.isDisposed) return;
    const t = time;

    const { effectiveRelease } = this._getModulatedEnvelopeParams(
        envParams, // Base envelope params
        this.currentModMatrixParams, // Current mod matrix state
        this._modWheelValue,
        this._velocity,
        t // Current time for LFO calculation if needed
    );

    let actualAudibleReleaseTime;
    if (immediateDispose) {
        actualAudibleReleaseTime = MIN_ENV_TIME; // Force a very short audible release
    } else {
        actualAudibleReleaseTime = envParams.isEnvelopeEnabled ? Math.max(MIN_ENV_TIME, effectiveRelease) : RAMP_TIME;
    }
    
    const gainStopTime = t + actualAudibleReleaseTime;

    // Determine when to stop the audio nodes and schedule disposal
    let nodeStopTime: number;
    let timeUntilDisposeMs: number;

    if (immediateDispose) {
      nodeStopTime = gainStopTime + 0.001; // Oscs stop almost immediately after gain ramp for fast dispose
      timeUntilDisposeMs = (nodeStopTime - this.audioContext.currentTime + 0.01) * 1000; // Small buffer
    } else {
      nodeStopTime = gainStopTime + 0.05; // Normal: oscs stop 50ms after gain reaches zero
      timeUntilDisposeMs = (nodeStopTime - this.audioContext.currentTime + 0.1) * 1000; // Larger buffer
    }


    this.mainEnvelopeVcaX.gain.cancelScheduledValues(t);
    this.mainEnvelopeVcaX.gain.setValueAtTime(this.mainEnvelopeVcaX.gain.value, t); // Hold current value
    this.mainEnvelopeVcaX.gain.linearRampToValueAtTime(0, gainStopTime);

    this.mainEnvelopeVcaY.gain.cancelScheduledValues(t);
    this.mainEnvelopeVcaY.gain.setValueAtTime(this.mainEnvelopeVcaY.gain.value, t);
    this.mainEnvelopeVcaY.gain.linearRampToValueAtTime(0, gainStopTime);

    this.envelopeSignalOutput.gain.cancelScheduledValues(t);
    this.envelopeSignalOutput.gain.setValueAtTime(this.envelopeSignalOutput.gain.value, t);
    this.envelopeSignalOutput.gain.linearRampToValueAtTime(0, gainStopTime);

    this.noiseVcaGain.gain.cancelScheduledValues(t);
    this.noiseVcaGain.gain.setValueAtTime(this.noiseVcaGain.gain.value, t);
    this.noiseVcaGain.gain.linearRampToValueAtTime(0, gainStopTime);

    // Schedule stop for standard oscillators
    this.subOscsX.forEach(unit => {
      if (!unit.isWorklet && unit.hasBeenStarted) {
        const actualOscStopTime = Math.max((unit.osc as OscillatorNode).context.currentTime, nodeStopTime);
        try { (unit.osc as OscillatorNode).stop(actualOscStopTime); } catch(e){}
        unit.hasBeenStarted = false; // Mark as stopped
      }
    });
    this.subOscsY.forEach(unit => {
      if (!unit.isWorklet && unit.hasBeenStarted) {
        const actualOscStopTime = Math.max((unit.osc as OscillatorNode).context.currentTime, nodeStopTime);
        try { (unit.osc as OscillatorNode).stop(actualOscStopTime); } catch(e){}
        unit.hasBeenStarted = false;
      }
    });

    // Schedule stop for LFO
    if (this.lfoHasBeenStarted) {
        const actualLfoStopTime = Math.max(this.lfo.context.currentTime, nodeStopTime);
        try { this.lfo.stop(actualLfoStopTime); } catch(e) {}
        this.lfoHasBeenStarted = false;
    }
    
    // Schedule disposal of the voice object
    if (timeUntilDisposeMs > 0) {
        setTimeout(() => this.dispose(), timeUntilDisposeMs);
    } else {
        // Ensure dispose is async if calculated time is immediate or negative
        setTimeout(() => this.dispose(), 10); 
    }
  }

  public updateUserWavetables(newUserWavetables: Record<string, UserWavetable>): void {
    this.userWavetables = newUserWavetables;
    // No immediate audio graph changes needed here, will be picked up on next osc update
  }

  public updateOscillatorParams(params: OscillatorParams, time: number): void {
    if (this.isDisposed) return;
    const t = time;
    const rampTargetTime = t + RAMP_TIME;
    const numVoices = Math.max(1, Math.min(params.unisonVoices, MAX_UNISON_VOICES_LIMIT));

    const recreateOscsIfNeeded = (
        currentUnits: SubOscillatorUnit[],
        oscPath: 'X' | 'Y',
        waveformType: Waveform
    ): SubOscillatorUnit[] => {
        const needsRecreation = currentUnits.length !== numVoices ||
                                currentUnits.some(u => u.isWorklet !== (waveformType === Waveform.WAVETABLE));
        if (needsRecreation) {
            currentUnits.forEach(unit => {
                if (!unit.isWorklet && unit.hasBeenStarted) {
                    try { (unit.osc as OscillatorNode).stop(t); } catch(e){}
                    unit.hasBeenStarted = false;
                }
                unit.osc.disconnect(); unit.vca.disconnect(); unit.panner?.disconnect();
            });
            const newUnits = this._createSubOscillatorUnits(params, oscPath, t);
            // Start new standard oscillators if they are part of new units
            newUnits.forEach(unit => {
                if (!unit.isWorklet) { // Worklets are implicitly "started" by existing or don't have a start method
                    try { (unit.osc as OscillatorNode).start(t); } catch(e){}
                    unit.hasBeenStarted = true;
                }
            });
            return newUnits;
        }
        return currentUnits;
    };

    this.subOscsX = recreateOscsIfNeeded(this.subOscsX, 'X', params.waveformX);
    this.subOscsY = recreateOscsIfNeeded(this.subOscsY, 'Y', params.waveformY);

    const detuneRangeCents = params.unisonDetune;

    const processOscillatorUnits = (
        units: SubOscillatorUnit[],
        waveformType: Waveform,
        ratio: number,
        wavetableId: string,
        wavetablePosX: number,
        wavetablePosY: number,
        oscPath: 'X' | 'Y'
    ) => {
        units.forEach((unit, i) => {
            let detuneOffset = 0;
            // FIX: Guard against division by zero when numVoices is 1
            if (numVoices > 1) {
                detuneOffset = (i / (numVoices - 1) - 0.5) * 2 * detuneRangeCents;
                if (oscPath === 'Y') detuneOffset *= 0.9; // Slightly different detune for Y
            }
            const freq = this._baseFrequency * ratio;

            if (unit.isWorklet) {
                const workletNode = unit.osc as AudioWorkletNode;
                const freqParam = this._getOscParam(unit, 'frequency')!;
                const detuneParam = this._getOscParam(unit, 'detune')!;
                const morphXParam = this._getOscParam(unit, 'morphPositionX')!;
                const morphYParam = this._getOscParam(unit, 'morphPositionY')!;


                freqParam.cancelScheduledValues(t);
                freqParam.setValueAtTime(freqParam.value, t);
                freqParam.linearRampToValueAtTime(freq, rampTargetTime);

                detuneParam.cancelScheduledValues(t);
                detuneParam.setValueAtTime(detuneParam.value, t);
                detuneParam.linearRampToValueAtTime(detuneOffset, rampTargetTime);

                morphXParam.linearRampToValueAtTime(wavetablePosX, rampTargetTime);
                morphYParam.linearRampToValueAtTime(wavetablePosY, rampTargetTime);


                if (unit.workletTableId !== wavetableId || !unit.workletTableId) { // if table ID changed or was never set
                    let sampleFrames2D: Float32Array[][] = [];
                    if (wavetableId.startsWith('user_')) {
                        const userTable = this.userWavetables[wavetableId];
                        if (userTable && userTable.data) {
                            sampleFrames2D = [[userTable.data]]; // Assume 1D user wavetable for now
                        } else {
                            // Fallback if user table data is missing
                            sampleFrames2D = [[WaveformUtils.getSamples(Waveform.SINE, DEFAULT_TABLE_SIZE).fill(0)]];
                        }
                    } else {
                        // Load from predefined WAVETABLE_DEFINITIONS
                        const tableDefinition2D = WAVETABLE_DEFINITIONS[wavetableId];
                        if (tableDefinition2D && tableDefinition2D.length > 0) {
                            sampleFrames2D = tableDefinition2D.map(rowWaveforms => {
                                if (!rowWaveforms || rowWaveforms.length === 0) {
                                    // Fallback for empty row
                                    return [WaveformUtils.getSamples(Waveform.SINE, DEFAULT_TABLE_SIZE)];
                                }
                                return rowWaveforms.map(wfType => WaveformUtils.getSamples(wfType, DEFAULT_TABLE_SIZE));
                            });
                        } else {
                            // Fallback if table definition not found
                                sampleFrames2D = [[WaveformUtils.getSamples(Waveform.SINE, DEFAULT_TABLE_SIZE)]];
                        }
                    }

                    workletNode.port.postMessage({
                        type: 'loadTable',
                        tableId: wavetableId, // Send the new table ID
                        sampleFrames: sampleFrames2D,
                    });
                    unit.workletTableId = wavetableId; // Update stored table ID
                }
            } else {
                const standardOscNode = unit.osc as OscillatorNode;
                PeriodicWaveUtils.applyWaveformToNode(this.audioContext, standardOscNode, waveformType, this.periodicWaves);

                standardOscNode.frequency.cancelScheduledValues(t);
                standardOscNode.frequency.setValueAtTime(standardOscNode.frequency.value, t);
                standardOscNode.frequency.linearRampToValueAtTime(freq, rampTargetTime);

                standardOscNode.detune.cancelScheduledValues(t);
                standardOscNode.detune.setValueAtTime(standardOscNode.detune.value, t);
                standardOscNode.detune.linearRampToValueAtTime(detuneOffset, rampTargetTime);
            }

            if (unit.panner) {
                // FIX: Guard against division by zero when numVoices is 1
                let panValue = 0;
                if (numVoices > 1 && params.unisonSpread > 0) {
                    panValue = (i / (numVoices - 1) - 0.5) * 2 * params.unisonSpread;
                    if (oscPath === 'Y') panValue *= -1;
                }
                unit.panner.pan.cancelScheduledValues(t);
                unit.panner.pan.setValueAtTime(unit.panner.pan.value, t);
                unit.panner.pan.linearRampToValueAtTime(panValue, rampTargetTime);
            }
        });
    };

    processOscillatorUnits(this.subOscsX, params.waveformX, params.xRatio, params.wavetableX, params.wavetablePositionX, params.wavetablePositionY, 'X');
    processOscillatorUnits(this.subOscsY, params.waveformY, params.yRatio, params.wavetableY, params.wavetablePositionX, params.wavetablePositionY, 'Y');

    // Update phase shift
    const actualYBaseFreq = this._baseFrequency * params.yRatio || 1; // Avoid division by zero
    const phaseDelayTime = (params.phaseShift / 360) / actualYBaseFreq;
    this.phaseDelay.delayTime.cancelScheduledValues(t);
    this.phaseDelay.delayTime.setValueAtTime(this.phaseDelay.delayTime.value, t);
    this.phaseDelay.delayTime.linearRampToValueAtTime(
      Math.min(MAX_PHASE_DELAY_TIME, Math.max(0, phaseDelayTime)),
      rampTargetTime
    );
  }

  public updateFilterParams(params: FilterParams, time: number): void {
    if (this.isDisposed) return;
    const t = time;
    const rampTargetTime = t + RAMP_TIME;
    const { isFilterEnabled, filterType, cutoffFrequency, resonance, keytrackAmount } = params;

    // Calculate keytracked cutoff
    let finalCutoffFrequency = cutoffFrequency;
    if (keytrackAmount !== 0) {
      const pitchDeltaHalftones = 12 * Math.log2(this._baseFrequency / C4_FREQ);
      const cutoffOffsetOctaves = (pitchDeltaHalftones / 12) * (keytrackAmount / 100);
      finalCutoffFrequency = cutoffFrequency * Math.pow(2, cutoffOffsetOctaves);
      finalCutoffFrequency = Math.max(20, Math.min(this.audioContext.sampleRate / 2, finalCutoffFrequency));
    }

    if (isFilterEnabled) {
      this.filterX.type = filterType as BiquadFilterType;
      this.filterY.type = filterType as BiquadFilterType;

      this.filterX.frequency.cancelScheduledValues(t);
      this.filterX.frequency.setValueAtTime(this.filterX.frequency.value, t);
      this.filterX.frequency.linearRampToValueAtTime(finalCutoffFrequency, rampTargetTime);

      this.filterY.frequency.cancelScheduledValues(t);
      this.filterY.frequency.setValueAtTime(this.filterY.frequency.value, t);
      this.filterY.frequency.linearRampToValueAtTime(finalCutoffFrequency, rampTargetTime);

      this.filterX.Q.cancelScheduledValues(t);
      this.filterX.Q.setValueAtTime(this.filterX.Q.value, t);
      this.filterX.Q.linearRampToValueAtTime(resonance, rampTargetTime);

      this.filterY.Q.cancelScheduledValues(t);
      this.filterY.Q.setValueAtTime(this.filterY.Q.value, t);
      this.filterY.Q.linearRampToValueAtTime(resonance, rampTargetTime);

    } else {
      // Bypass filter by setting it to a transparent state (e.g., lowpass wide open)
      const bypassFreq = this.audioContext.sampleRate / 2; // Max frequency
      const bypassRes = 0.0001; // Minimal resonance
      this.filterX.type = FilterNodeType.LOW_PASS as BiquadFilterType; // Default to LP for bypass
      this.filterX.frequency.cancelScheduledValues(t);
      this.filterX.frequency.setValueAtTime(this.filterX.frequency.value, t);
      this.filterX.frequency.linearRampToValueAtTime(bypassFreq, rampTargetTime);
      this.filterX.Q.cancelScheduledValues(t);
      this.filterX.Q.setValueAtTime(this.filterX.Q.value, t);
      this.filterX.Q.linearRampToValueAtTime(bypassRes, rampTargetTime);

      this.filterY.type = FilterNodeType.LOW_PASS as BiquadFilterType;
      this.filterY.frequency.cancelScheduledValues(t);
      this.filterY.frequency.setValueAtTime(this.filterY.frequency.value, t);
      this.filterY.frequency.linearRampToValueAtTime(bypassFreq, rampTargetTime);
      this.filterY.Q.cancelScheduledValues(t);
      this.filterY.Q.setValueAtTime(this.filterY.Q.value, t);
      this.filterY.Q.linearRampToValueAtTime(bypassRes, rampTargetTime);
    }
  }

  private getTempoSyncedRate(division: string, bpm: number): number {
    const parts = division.split('/');
    if (parts.length !== 2) return 1; // Default to 1 Hz if format is wrong

    const numerator = parseInt(parts[0], 10);
    let denominator = parseInt(parts[1].replace(/[TD]/, ''), 10); // Remove T or D for parsing

    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return 1;

    let multiplier = 1.0;
    if (parts[1].includes('T')) multiplier = 2/3; // Triplet
    if (parts[1].includes('D')) multiplier = 1.5; // Dotted

    // Calculate duration of one such note division in seconds
    const beatsPerBar = 4; // Assuming 4/4 time for simplicity of "bar" reference
    const noteDurationInBeats = (beatsPerBar / denominator) * numerator * multiplier;
    const noteDurationInSeconds = (60 / bpm) * noteDurationInBeats;
    
    return noteDurationInSeconds > 0 ? 1 / noteDurationInSeconds : 1; // Avoid division by zero
  }

  private generateLfoCurve(shape: Waveform, durationSeconds: number, rateHz: number): Float32Array {
    // Duration here is one cycle of the LFO
    // Number of points in the curve. More points = smoother for complex shapes, but more memory.
    // For low frequency LFOs, fewer points might be fine. Let's aim for decent resolution.
    const numPoints = Math.max(32, Math.floor(this.audioContext.sampleRate * durationSeconds / 20)); // At least 32 points, or ~50 samples per LFO cycle at 20Hz LFO
    const curve = new Float32Array(numPoints);
    const stepDuration = durationSeconds / numPoints;

    if (shape === Waveform.SAMPLE_HOLD) {
      let lastValue = Math.random() * 2 - 1;
      for (let i = 0; i < numPoints; i++) {
        // Change value at the start of each "sample" period
        if (i === 0 || (i * stepDuration * rateHz) % 1 < (stepDuration * rateHz)) { // Approximation of sample change
            lastValue = Math.random() * 2 - 1;
        }
        curve[i] = lastValue;
      }
    } else if (shape === Waveform.RANDOM_SMOOTH) {
        // Generate a few random points and interpolate between them for one LFO cycle
        const numRandomPoints = Math.max(2, Math.floor(durationSeconds * rateHz * 2) +1); // At least 2 points, more for faster LFOs
        const randomValues = Array.from({ length: numRandomPoints }, () => Math.random() * 2 - 1);
        
        for (let i = 0; i < numPoints; i++) {
            const positionInCycle = (i / (numPoints -1 )) * (numRandomPoints -1); // Map current point to randomValues index
            const index1 = Math.floor(positionInCycle);
            const index2 = Math.min(numRandomPoints -1, Math.ceil(positionInCycle));
            const t_interp = positionInCycle - index1;
            curve[i] = randomValues[index1] * (1 - t_interp) + randomValues[index2] * t_interp;
        }
    }
    // Other custom shapes could be added here.
    return curve;
  }


  public updateLfoParams(lfoParams: LfoParams, filterParams: FilterParams, time: number): void {
    if (this.isDisposed) return;
    const t = time;
    const rampTargetTime = t + RAMP_TIME;
    this.currentLfoParamsForModulation = { ...lfoParams }; // Store for internal calculations


    let lfoRate = lfoParams.rate || 1;
    if (lfoParams.isTempoSynced && lfoParams.tempoSyncDivision) {
      lfoRate = this.getTempoSyncedRate(lfoParams.tempoSyncDivision, this.globalBpm);
    }

    // Handle LFO waveform type
    if (lfoParams.waveform === Waveform.SINE || lfoParams.waveform === Waveform.SQUARE ||
        lfoParams.waveform === Waveform.SAWTOOTH || lfoParams.waveform === Waveform.TRIANGLE) {
      PeriodicWaveUtils.applyWaveformToNode(this.audioContext, this.lfo, lfoParams.waveform, this.periodicWaves);
      this.lfo.frequency.cancelScheduledValues(t);
      this.lfo.frequency.setValueAtTime(this.lfo.frequency.value, t);
      this.lfo.frequency.linearRampToValueAtTime(lfoRate, rampTargetTime);
      this.lfoCustomShapeCurve = null; // Clear custom curve if not used
    } else if (lfoParams.waveform === Waveform.SAMPLE_HOLD || lfoParams.waveform === Waveform.RANDOM_SMOOTH) {
      // For custom shapes, we might not use the OscillatorNode's frequency directly if we're driving it via setValueCurveAtTime.
      // However, setting frequency helps if setValueCurveAtTime is not supported or for timing calculations.
      this.lfo.frequency.cancelScheduledValues(t);
      this.lfo.frequency.setValueAtTime(this.lfo.frequency.value, t);
      this.lfo.frequency.linearRampToValueAtTime(lfoRate, rampTargetTime); // LFO rate sets the cycle speed

      const cycleDuration = lfoRate > 0 ? 1.0 / lfoRate : 1.0; // Duration of one LFO cycle
      this.lfoCustomShapeCurve = this.generateLfoCurve(lfoParams.waveform, cycleDuration, lfoRate);
      // The actual application of this curve happens in _applyLfoToTargets or similar logic, potentially via setValueCurveAtTime on lfoGain.
    }
    // else: other custom waveforms could be handled here

    // Disconnect LFO from all previous targets before reconnecting
    try { this.lfoGain.disconnect(); } catch (e) {}

    let targetGainValue = 0;
    if (lfoParams.target !== LfoTarget.OFF && filterParams.isFilterEnabled) { // Only modulate if filter (and LFO section) is enabled
      targetGainValue = lfoParams.depth;

      const connectLfoToParam = (param: AudioParam | undefined) => {
        if (this.isDisposed || !param) return;
        try { this.lfoGain.connect(param); } catch(e) { console.error("Failed to connect LFO to param", param, e); }
      };

      switch (lfoParams.target) {
        case LfoTarget.PITCH_X: this.subOscsX.forEach(u => connectLfoToParam(this._getOscParam(u, 'detune'))); break;
        case LfoTarget.PITCH_Y: this.subOscsY.forEach(u => connectLfoToParam(this._getOscParam(u, 'detune'))); break;
        case LfoTarget.PITCH_XY:
          this.subOscsX.forEach(u => connectLfoToParam(this._getOscParam(u, 'detune')));
          this.subOscsY.forEach(u => connectLfoToParam(this._getOscParam(u, 'detune')));
          break;
        case LfoTarget.FILTER_X: connectLfoToParam(this.filterX.frequency); break;
        case LfoTarget.FILTER_Y: connectLfoToParam(this.filterY.frequency); break;
        case LfoTarget.FILTER_XY:
            connectLfoToParam(this.filterX.frequency);
            connectLfoToParam(this.filterY.frequency);
            break;
        case LfoTarget.PHASE:
          targetGainValue = lfoParams.depth * 0.01; // Scale depth for phase (e.g. 0-1 depth -> 0-0.01s delay)
          connectLfoToParam(this.phaseDelay.delayTime);
          break;
        case LfoTarget.OSC_X_WAVETABLE_POS:
            this.subOscsX.forEach(unit => {
                if (unit.isWorklet) connectLfoToParam(this._getOscParam(unit, 'morphPositionX'));
            });
            break;
        case LfoTarget.OSC_Y_WAVETABLE_POS:
            this.subOscsY.forEach(unit => {
                if (unit.isWorklet) connectLfoToParam(this._getOscParam(unit, 'morphPositionY'));
            });
            break;
        default: targetGainValue = 0; break; // LfoTarget.OFF or unhandled
      }
    }

    // Apply depth to lfoGain
    this.lfoGain.gain.cancelScheduledValues(t);
    this.lfoGain.gain.setValueAtTime(this.lfoGain.gain.value, t);

    if (this.lfoCustomShapeCurve && this.lfoCustomShapeCurve.length > 0 &&
        (lfoParams.waveform === Waveform.SAMPLE_HOLD || lfoParams.waveform === Waveform.RANDOM_SMOOTH) &&
        filterParams.isFilterEnabled && lfoParams.target !== LfoTarget.OFF) {
      // For custom curve LFOs, the lfoGain's value is shaped by the curve directly.
      // The 'targetGainValue' (depth) scales the curve.
      const scaledCurve = this.lfoCustomShapeCurve.map(val => val * targetGainValue);
      const cycleDuration = lfoRate > 0 ? 1.0 / lfoRate : 1.0; // Recalculate for safety
      try {
        // Attempt to use setValueCurveAtTime for smoother custom LFOs if supported and needed.
        // This is complex because the lfoGain is *already connected* to the target param.
        // What we want is for the *output* of the LFO (before lfoGain) to be shaped, then scaled by lfoGain.
        // The current setup is Oscillator -> lfoGain -> Target.
        // If lfoGain's value itself is shaped by setValueCurveAtTime, it scales the LFO oscillator's output.
        this.lfoGain.gain.setValueCurveAtTime(scaledCurve, t, cycleDuration);
      } catch (e) {
        // Fallback if setValueCurveAtTime fails or for simpler implementation for now
        this.lfoGain.gain.linearRampToValueAtTime(targetGainValue, rampTargetTime);
      }
    } else {
      this.lfoGain.gain.linearRampToValueAtTime(targetGainValue, rampTargetTime);
    }
  }

  private _disconnectSlot(slotIndex: number): void {
    if (this.isDisposed || slotIndex < 0 || slotIndex >= this.modSlotConnections.length) return;

    const connection = this.modSlotConnections[slotIndex];
    if (connection) {
      const slotGainNode = connection.slotGainNode;
      try {
        if (connection.sourceNode) {
          connection.sourceNode.disconnect(slotGainNode);
        }
        // Disconnect from the specific target(s) it was connected to
        if (connection.targetParam) {
          slotGainNode.disconnect(connection.targetParam);
        } else {
          // Fallback: If no specific targetParam was stored (e.g., for XY combined targets),
          // try to disconnect from all potential previous targets based on last applied config.
          // This part can be made more precise if _connectSlot stores more info.
          const lastSlotConfig = this.lastAppliedModMatrixParamsForStructure.slots[slotIndex];
          if (lastSlotConfig) {
            switch (lastSlotConfig.destination) {
              case ModDestination.OSC_XY_PITCH:
                this.subOscsX.forEach(u => {const p = this._getOscParam(u,'detune'); if(p) try {slotGainNode.disconnect(p);}catch(e){}});
                this.subOscsY.forEach(u => {const p = this._getOscParam(u,'detune'); if(p) try {slotGainNode.disconnect(p);}catch(e){}});
                break;
              case ModDestination.FILTER_XY_CUTOFF:
                try { slotGainNode.disconnect(this.filterX.frequency); } catch(e) {}
                try { slotGainNode.disconnect(this.filterY.frequency); } catch(e) {}
                break;
              case ModDestination.VCA_XY_LEVEL:
                try { slotGainNode.disconnect(this.modVcaGainX.gain); } catch(e) {}
                try { slotGainNode.disconnect(this.modVcaGainY.gain); } catch(e) {}
                break;
              // Add other multi-target cases if any
            }
          }
        }
      } catch (e) {
        // console.warn(`Error disconnecting slot ${slotIndex}:`, e);
      }
    }
    // Reset gain and clear connection info
    this.modSlotGains[slotIndex].gain.cancelScheduledValues(this.audioContext.currentTime);
    this.modSlotGains[slotIndex].gain.setValueAtTime(0, this.audioContext.currentTime);
    this.modSlotConnections[slotIndex] = null;
  }


  private _connectSlot(
    slotIndex: number,
    slotConfig: ModMatrixSlot,
    currentOscParams: OscillatorParams,
    // currentFilterParams: FilterParams, // Not directly needed for connections, but for scaling
    // currentLfoParams: LfoParams,
    // currentEnvParams: EnvelopeParams,
    // currentModWheelValue: number,
    timeValue: number
  ): void {
    if (this.isDisposed || !slotConfig.isEnabled || slotConfig.source === ModSource.NONE || slotConfig.destination === ModDestination.NONE) {
      return;
    }

    const t = timeValue;
    const slotGainNode = this.modSlotGains[slotIndex];
    let sourceAudioNode: AudioNode | null = null;

    switch (slotConfig.source) {
      case ModSource.LFO1: sourceAudioNode = this.lfoGain; break;
      case ModSource.ENV1: sourceAudioNode = this.envelopeSignalOutput; break;
      case ModSource.VELOCITY:
        if (this.velocityModConstantSource) {
          this.velocityModConstantSource.offset.setValueAtTime(this._velocity, t);
          sourceAudioNode = this.velocityModConstantSource;
        }
        break;
      case ModSource.MODWHEEL:
        this.modWheelConstantSource.offset.setValueAtTime(this._modWheelValue, t);
        sourceAudioNode = this.modWheelConstantSource;
        break;
    }

    if (!sourceAudioNode) {
        this.modSlotConnections[slotIndex] = null; // Ensure connection is cleared
        return;
    }

    // Check if this destination is a numeric JS parameter (e.g., envelope times)
    if (slotConfig.destination === ModDestination.ENV1_ATTACK ||
        slotConfig.destination === ModDestination.ENV1_DECAY ||
        slotConfig.destination === ModDestination.ENV1_SUSTAIN ||
        slotConfig.destination === ModDestination.ENV1_RELEASE) {
      // For numeric modulations, we don't connect AudioNodes.
      // The effect is calculated in _getModulatedEnvelopeParams.
      // We store it as a numeric mod for potential later updates if amount changes.
      this.modSlotConnections[slotIndex] = { sourceNode: null, targetParam: null, slotGainNode, isNumericMod: true, connectedSourceType: slotConfig.source, connectedDestinationType: slotConfig.destination };
      // The slotGainNode.gain will represent the "amount" for these, scaled by source value,
      // but it doesn't connect anywhere. It's just for tracking.
      // The actual calculation happens in _getModulatedEnvelopeParams.
      // Let's set its gain to the slot amount for consistency, though it's not used in an audio path.
      slotGainNode.gain.setValueAtTime(slotConfig.amount, t); // This might not be strictly necessary
      return;
    }

    let targetAudioParam: AudioParam | null | undefined = null;
    let destinationScaling = 1.0;
    let multipleTargets = false;

    // Determine target and scaling
    switch (slotConfig.destination) {
        case ModDestination.OSC_X_PITCH: this.subOscsX.forEach(u => { targetAudioParam = this._getOscParam(u, 'detune'); }); destinationScaling = MOD_DESTINATION_SCALING_PITCH_CENTS; break;
        case ModDestination.OSC_Y_PITCH: this.subOscsY.forEach(u => { targetAudioParam = this._getOscParam(u, 'detune'); }); destinationScaling = MOD_DESTINATION_SCALING_PITCH_CENTS; break;
        case ModDestination.OSC_XY_PITCH: multipleTargets = true; destinationScaling = MOD_DESTINATION_SCALING_PITCH_CENTS; break;
        case ModDestination.OSC_X_RATIO: this.subOscsX.forEach(u => { targetAudioParam = this._getOscParam(u, 'frequency'); }); destinationScaling = MOD_DESTINATION_SCALING_RATIO_MOD * this._baseFrequency * currentOscParams.xRatio; break;
        case ModDestination.OSC_Y_RATIO: this.subOscsY.forEach(u => { targetAudioParam = this._getOscParam(u, 'frequency'); }); destinationScaling = MOD_DESTINATION_SCALING_RATIO_MOD * this._baseFrequency * currentOscParams.yRatio; break;
        case ModDestination.OSC_Y_PHASE: targetAudioParam = this.phaseDelay.delayTime; destinationScaling = MOD_DESTINATION_SCALING_PHASE_S; break;
        case ModDestination.FILTER_X_CUTOFF: targetAudioParam = this.filterX.frequency; destinationScaling = MOD_DESTINATION_SCALING_FILTER_HZ; break;
        case ModDestination.FILTER_Y_CUTOFF: targetAudioParam = this.filterY.frequency; destinationScaling = MOD_DESTINATION_SCALING_FILTER_HZ; break;
        case ModDestination.FILTER_XY_CUTOFF: multipleTargets = true; destinationScaling = MOD_DESTINATION_SCALING_FILTER_HZ; break;
        case ModDestination.VCA_X_LEVEL: targetAudioParam = this.modVcaGainX.gain; destinationScaling = MOD_DESTINATION_SCALING_VCA_GAIN; break;
        case ModDestination.VCA_Y_LEVEL: targetAudioParam = this.modVcaGainY.gain; destinationScaling = MOD_DESTINATION_SCALING_VCA_GAIN; break;
        case ModDestination.VCA_XY_LEVEL: multipleTargets = true; destinationScaling = MOD_DESTINATION_SCALING_VCA_GAIN; break;
        case ModDestination.LFO1_RATE: targetAudioParam = this.lfo.frequency; destinationScaling = MOD_DESTination_SCALING_LFO_RATE_HZ; break;
        case ModDestination.LFO1_DEPTH: targetAudioParam = this.lfoGain.gain; destinationScaling = MOD_DESTINATION_SCALING_LFO_DEPTH; break;
        case ModDestination.OSC_X_WAVETABLE_POS: this.subOscsX.forEach(u => { if (u.isWorklet) targetAudioParam = this._getOscParam(u, 'morphPositionX'); }); destinationScaling = MOD_DESTINATION_SCALING_WT_POS; break;
        case ModDestination.OSC_Y_WAVETABLE_POS: this.subOscsY.forEach(u => { if (u.isWorklet) targetAudioParam = this._getOscParam(u, 'morphPositionY'); }); destinationScaling = MOD_DESTINATION_SCALING_WT_POS; break;
    }

    slotGainNode.gain.cancelScheduledValues(t);
    slotGainNode.gain.setValueAtTime(slotConfig.amount * destinationScaling, t);

    this.modSlotConnections[slotIndex] = { sourceNode: sourceAudioNode, targetParam: null, slotGainNode, connectedSourceType: slotConfig.source, connectedDestinationType: slotConfig.destination }; // Store source for potential future precise disconnect

    if (multipleTargets) {
        sourceAudioNode.connect(slotGainNode);
        switch (slotConfig.destination) {
            case ModDestination.OSC_XY_PITCH:
                this.subOscsX.forEach(u => {const p = this._getOscParam(u,'detune'); if(p) slotGainNode.connect(p);});
                this.subOscsY.forEach(u => {const p = this._getOscParam(u,'detune'); if(p) slotGainNode.connect(p);});
                break;
            case ModDestination.FILTER_XY_CUTOFF:
                slotGainNode.connect(this.filterX.frequency);
                slotGainNode.connect(this.filterY.frequency);
                break;
            case ModDestination.VCA_XY_LEVEL:
                slotGainNode.connect(this.modVcaGainX.gain);
                slotGainNode.connect(this.modVcaGainY.gain);
                break;
        }
    } else if (targetAudioParam) {
        sourceAudioNode.connect(slotGainNode);
        slotGainNode.connect(targetAudioParam);
        if (this.modSlotConnections[slotIndex]) { // Update targetParam if connection was successful
            (this.modSlotConnections[slotIndex] as ModSlotConnection).targetParam = targetAudioParam;
        }
    } else {
        // If no targetAudioParam was found (e.g., trying to mod WT pos on non-worklet osc), clear connection
       this.modSlotConnections[slotIndex] = null;
    }
  }
  
  private _updateSlotAmount(
    slotIndex: number,
    slotConfig: ModMatrixSlot,
    currentOscParams: OscillatorParams,
    // ... other current params if needed for scaling ...
    timeValue: number
  ): void {
      if (this.isDisposed || !this.modSlotConnections[slotIndex] || (this.modSlotConnections[slotIndex] as ModSlotConnection).isNumericMod) {
        // If it's a numeric mod, its amount is handled by _getModulatedEnvelopeParams
        // or if the connection doesn't exist, do nothing.
        return;
      }
      const t = timeValue;
      const slotGainNode = this.modSlotGains[slotIndex];
      let destinationScaling = 1.0;

      // Recalculate destinationScaling (copied from _connectSlot, can be refactored)
      switch (slotConfig.destination) {
        case ModDestination.OSC_X_PITCH: case ModDestination.OSC_Y_PITCH: case ModDestination.OSC_XY_PITCH: destinationScaling = MOD_DESTINATION_SCALING_PITCH_CENTS; break;
        case ModDestination.OSC_X_RATIO: destinationScaling = MOD_DESTINATION_SCALING_RATIO_MOD * this._baseFrequency * currentOscParams.xRatio; break;
        case ModDestination.OSC_Y_RATIO: destinationScaling = MOD_DESTINATION_SCALING_RATIO_MOD * this._baseFrequency * currentOscParams.yRatio; break;
        case ModDestination.OSC_Y_PHASE: destinationScaling = MOD_DESTINATION_SCALING_PHASE_S; break;
        case ModDestination.FILTER_X_CUTOFF: case ModDestination.FILTER_Y_CUTOFF: case ModDestination.FILTER_XY_CUTOFF: destinationScaling = MOD_DESTINATION_SCALING_FILTER_HZ; break;
        case ModDestination.VCA_X_LEVEL: case ModDestination.VCA_Y_LEVEL: case ModDestination.VCA_XY_LEVEL: destinationScaling = MOD_DESTINATION_SCALING_VCA_GAIN; break;
        case ModDestination.LFO1_RATE: destinationScaling = MOD_DESTINATION_SCALING_LFO_RATE_HZ; break;
        case ModDestination.LFO1_DEPTH: destinationScaling = MOD_DESTINATION_SCALING_LFO_DEPTH; break;
        case ModDestination.OSC_X_WAVETABLE_POS: case ModDestination.OSC_Y_WAVETABLE_POS: destinationScaling = MOD_DESTINATION_SCALING_WT_POS; break;
      }
      slotGainNode.gain.cancelScheduledValues(t);
      slotGainNode.gain.setValueAtTime(slotGainNode.gain.value, t); // Ensure smooth transition if already ramping
      slotGainNode.gain.linearRampToValueAtTime(slotConfig.amount * destinationScaling, t + RAMP_TIME * 0.5); // Faster ramp for amount changes
  }


  private _applyModulations(
    newModMatrixParams: ModMatrixParams,
    currentOscParams: OscillatorParams,
    currentFilterParams: FilterParams,
    currentLfoParams: LfoParams,
    currentEnvParams: EnvelopeParams,
    currentModWheelValue: number, // Note: this._modWheelValue is already updated by updateModWheelValue
    timeValue: number
  ): void {
    if (this.isDisposed) return;

    const t = timeValue;

    newModMatrixParams.slots.forEach((newSlotConfig, slotIndex) => {
      const lastSlotConfig = this.lastAppliedModMatrixParamsForStructure.slots[slotIndex];
      const currentConnection = this.modSlotConnections[slotIndex];

      const hasStructurallyChanged = 
        newSlotConfig.isEnabled !== lastSlotConfig.isEnabled ||
        newSlotConfig.source !== lastSlotConfig.source ||
        newSlotConfig.destination !== lastSlotConfig.destination;
        
      const isNumericMod = 
        newSlotConfig.destination === ModDestination.ENV1_ATTACK ||
        newSlotConfig.destination === ModDestination.ENV1_DECAY ||
        newSlotConfig.destination === ModDestination.ENV1_SUSTAIN ||
        newSlotConfig.destination === ModDestination.ENV1_RELEASE;

      if (hasStructurallyChanged || (newSlotConfig.isEnabled && !currentConnection && !isNumericMod)) {
        // If structure changed, or if it's newly enabled and wasn't connected (and not a numeric mod)
        this._disconnectSlot(slotIndex); // Disconnect old if any
        if (newSlotConfig.isEnabled && newSlotConfig.source !== ModSource.NONE && newSlotConfig.destination !== ModDestination.NONE) {
          this._connectSlot(slotIndex, newSlotConfig, currentOscParams, t);
        }
      } else if (newSlotConfig.isEnabled && currentConnection && !isNumericMod) {
        // Structure is the same, slot is enabled, connection exists, and not numeric mod: update amount
        if (newSlotConfig.amount !== lastSlotConfig.amount) {
          this._updateSlotAmount(slotIndex, newSlotConfig, currentOscParams, t);
        }
      } else if (!newSlotConfig.isEnabled && currentConnection) {
        // Slot was enabled and connected, now it's disabled
        this._disconnectSlot(slotIndex);
      }
      // For numeric mods, their effect is re-evaluated by _getModulatedEnvelopeParams,
      // which is called during noteOn/noteOff based on the current modMatrixParams.
      // The "connection" for numeric mods is conceptual.
    });
    
    this.lastAppliedModMatrixParamsForStructure = JSON.parse(JSON.stringify(newModMatrixParams));
  }

  public updateModMatrixParams(
    modMatrixParams: ModMatrixParams,
    currentOscParams: OscillatorParams,
    currentFilterParams: FilterParams,
    currentLfoParams: LfoParams,
    currentEnvParams: EnvelopeParams,
    currentModWheelValue: number,
    timeValue: number
  ): void {
    if (this.isDisposed) return;
    
    this.currentModMatrixParams = { ...modMatrixParams }; 
    this.updateModWheelValue(currentModWheelValue, timeValue); 

    this._applyModulations(
        this.currentModMatrixParams, // Use the just updated internal matrix
        currentOscParams,
        currentFilterParams,
        currentLfoParams,
        currentEnvParams,
        this._modWheelValue, 
        timeValue
    );
  }

  public updateModWheelValue(newValue: number, timeValue: number): void {
    if (this.isDisposed) return;
    this._modWheelValue = newValue;
    this.modWheelConstantSource.offset.cancelScheduledValues(timeValue);
    this.modWheelConstantSource.offset.setValueAtTime(this.modWheelConstantSource.offset.value, timeValue);
    this.modWheelConstantSource.offset.linearRampToValueAtTime(newValue, timeValue + RAMP_TIME * 0.1); // Fast ramp for mod wheel
  }

  public updateNoiseMix(params: NoiseParams, timeValue: number): void {
    if (this.isDisposed) return;
    const t = timeValue;
    const rampTargetTime = t + RAMP_TIME;
    const targetGain = params.isNoiseEnabled ? params.noiseLevel : 0;

    // This gain is applied within the voice, assuming globalNoiseOutput is a shared source
    this.noiseVcaGain.gain.cancelScheduledValues(t);
    this.noiseVcaGain.gain.setValueAtTime(this.noiseVcaGain.gain.value, t);
    this.noiseVcaGain.gain.linearRampToValueAtTime(targetGain, rampTargetTime);
  }

  public setDynamicScale(scaleFactor: number, timeValue: number): void {
    if (this.isDisposed) return;
    const t = timeValue;
    const rampTargetTime = t + RAMP_TIME * 0.5; // Faster ramp for dynamic scaling

    this.postVoiceScalingVcaX.gain.cancelScheduledValues(t);
    this.postVoiceScalingVcaX.gain.setValueAtTime(this.postVoiceScalingVcaX.gain.value, t);
    this.postVoiceScalingVcaX.gain.linearRampToValueAtTime(scaleFactor, rampTargetTime);

    this.postVoiceScalingVcaY.gain.cancelScheduledValues(t);
    this.postVoiceScalingVcaY.gain.setValueAtTime(this.postVoiceScalingVcaY.gain.value, t);
    this.postVoiceScalingVcaY.gain.linearRampToValueAtTime(scaleFactor, rampTargetTime);
  }


  // Calculates the current LFO value for control-rate modulations (like ENV params)
  private _calculateLfoValue(currentTime: number): number {
    if (this.isDisposed || !this.currentLfoParamsForModulation) return 0;

    const lfoParams = this.currentLfoParamsForModulation;
    let effectiveRate = lfoParams.rate;
    if (lfoParams.isTempoSynced && lfoParams.tempoSyncDivision) {
        effectiveRate = this.getTempoSyncedRate(lfoParams.tempoSyncDivision, this.globalBpm);
    }

    if (effectiveRate <= 0) return 0;

    const timeSinceLfoStart = currentTime - this.lfoStartTime;
    const phase = (timeSinceLfoStart * effectiveRate) % 1.0; // Normalized phase (0 to 1)

    switch (lfoParams.waveform) {
        case Waveform.SINE: return Math.sin(phase * 2 * Math.PI);
        case Waveform.SQUARE: return (phase < 0.5 ? 1 : -1);
        case Waveform.SAWTOOTH: return (phase * 2) - 1; // Ramps from -1 to 1
        case Waveform.TRIANGLE: return (Math.abs(phase - 0.5) * 4) - 1; // Symmetrical triangle -1 to 1
        case Waveform.SAMPLE_HOLD:
            // For S&H, if lfoCustomShapeCurve is generated, it would ideally be sampled here.
            // This requires lfoCustomShapeCurve to be updated whenever rate or shape changes.
            // For simplicity in this direct calculation, we might just return a new random value
            // or use a simplified logic if lfoCustomShapeCurve is not directly usable here.
                if (this.lfoCustomShapeCurve && this.lfoCustomShapeCurve.length > 0) {
                    const idx = Math.floor(phase * this.lfoCustomShapeCurve.length);
                    return this.lfoCustomShapeCurve[idx]; // Assumes curve is -1 to 1
                }
                return Math.random() * 2 - 1; // Fallback
        case Waveform.RANDOM_SMOOTH:
            if (this.lfoCustomShapeCurve && this.lfoCustomShapeCurve.length > 0) {
                const idx = phase * (this.lfoCustomShapeCurve.length -1); // Interpolate
                const idxFloor = Math.floor(idx);
                const idxCeil = Math.min(this.lfoCustomShapeCurve.length - 1, Math.ceil(idx));
                const t_interp = idx - idxFloor;
                return this.lfoCustomShapeCurve[idxFloor] * (1-t_interp) + this.lfoCustomShapeCurve[idxCeil] * t_interp;
            }
            return Math.random() * 2 -1; // Fallback
        default: return 0;
    }
  }

  // Calculates effective envelope parameters considering modulation
  private _getModulatedEnvelopeParams(
    baseEnvParams: EnvelopeParams,
    modMatrixParams: ModMatrixParams,
    modWheelValue: number,
    velocity: number,
    currentTime: number // For LFO calculation
  ): { effectiveAttack: number; effectiveDecay: number; effectiveSustain: number; effectiveRelease: number } {
    let effectiveAttack = baseEnvParams.attack;
    let effectiveDecay = baseEnvParams.decay;
    let effectiveSustain = baseEnvParams.sustain;
    let effectiveRelease = baseEnvParams.release;

    if (!modMatrixParams.isEnabled) {
        return { effectiveAttack, effectiveDecay, effectiveSustain, effectiveRelease };
    }

    modMatrixParams.slots.forEach(slot => {
        if (!slot.isEnabled || slot.source === ModSource.NONE || slot.destination === ModDestination.NONE) {
            return;
        }

        // Check if this slot targets an envelope parameter
        const isEnvParamDest = slot.destination === ModDestination.ENV1_ATTACK ||
                                slot.destination === ModDestination.ENV1_DECAY ||
                                slot.destination === ModDestination.ENV1_SUSTAIN ||
                                slot.destination === ModDestination.ENV1_RELEASE;
        if (!isEnvParamDest) return;

        let sourceValue = 0;
        switch (slot.source) {
            case ModSource.LFO1:
                // LFO state (this.currentLfoParamsForModulation) should be up-to-date
                sourceValue = this._calculateLfoValue(currentTime);
                break;
            case ModSource.VELOCITY:
                sourceValue = velocity; // Use the voice's velocity
                break;
            case ModSource.MODWHEEL:
                sourceValue = modWheelValue; // Use current mod wheel value
                break;
            case ModSource.ENV1: // Envelope modulating itself is usually not standard or can cause issues.
                return; // Skip self-modulation for simplicity.
        }

        const modulationAmount = slot.amount * sourceValue;

        switch (slot.destination) {
            case ModDestination.ENV1_ATTACK:
                effectiveAttack += modulationAmount * MOD_DESTINATION_SCALING_ENV_TIME;
                break;
            case ModDestination.ENV1_DECAY:
                effectiveDecay += modulationAmount * MOD_DESTINATION_SCALING_ENV_TIME;
                break;
            case ModDestination.ENV1_SUSTAIN:
                effectiveSustain += modulationAmount * MOD_DESTINATION_SCALING_ENV_SUSTAIN;
                break;
            case ModDestination.ENV1_RELEASE:
                effectiveRelease += modulationAmount * MOD_DESTINATION_SCALING_ENV_TIME;
                break;
        }
    });

    // Clamp results to valid ranges
    return {
        effectiveAttack: Math.max(MIN_ENV_TIME, effectiveAttack),
        effectiveDecay: Math.max(MIN_ENV_TIME, effectiveDecay),
        effectiveSustain: Math.max(0.0, Math.min(1.0, effectiveSustain)),
        effectiveRelease: Math.max(MIN_ENV_TIME, effectiveRelease),
    };
  }


  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Disconnect modulation matrix paths first
    for (let i_slot = 0; i_slot < NUM_MOD_SLOTS; i_slot++) {
      this._disconnectSlot(i_slot); // This handles disconnecting from targets
      try { this.modSlotGains[i_slot].disconnect(); } catch(e) {} // Disconnect source from slotGain
    }
    try { this.modVcaGainX.disconnect(); } catch(e) {}
    try { this.modVcaGainY.disconnect(); } catch(e) {}

    // Stop and disconnect constant sources for modulation
    if (this.velocityModConstantSource) {
        try { this.velocityModConstantSource.stop(); } catch(e) {}
        try { this.velocityModConstantSource.disconnect(); } catch(e) {}
    }
    if (this.modWheelConstantSource) {
        try { this.modWheelConstantSource.stop(); } catch(e) {}
        try { (this.modWheelConstantSource.disconnect as any)(); } catch(e) {} // Type assertion for older TS versions
    }


    const nodesToDisconnect: (AudioNode | undefined)[] = [
      ...this.subOscsX.flatMap(u => [u.osc, u.vca, u.panner]),
      ...this.subOscsY.flatMap(u => [u.osc, u.vca, u.panner]),
      this.phaseDelay, this.filterX, this.filterY,
      this.mainEnvelopeVcaX, this.postVoiceScalingVcaX, this.outputX,
      this.mainEnvelopeVcaY, this.postVoiceScalingVcaY, this.outputY,
      this.noiseVcaGain, this.lfo, this.lfoGain, this.envelopeSignalOutput,
      // modVcaGainX/Y are already handled if they were part of a mod connection
    ];

    nodesToDisconnect.forEach(node => {
      try {
        if (node) node.disconnect();
      } catch (e) {}
    });

    // Stop LFO explicitly if it was started
    if (this.lfoHasBeenStarted) {
        try {
            this.lfo.stop(this.audioContext.currentTime); // Stop now
        } catch(e) {} // Might have already been stopped
        this.lfoHasBeenStarted = false;
    }

    // Clear oscillator arrays
    this.subOscsX = [];
    this.subOscsY = [];
  }

  public getNoteId(): string {
    return this._noteId;
  }
}
