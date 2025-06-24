
import { AudioEffect } from './AudioEffect';
import { RingModParams, Waveform } from '../../types';
import { RAMP_TIME } from '../../constants';
import { PeriodicWaveStore, PeriodicWaveUtils }from '../PeriodicWaves';

export class RingModEffect extends AudioEffect {
  private carrierOsc!: OscillatorNode;
  private carrierAmpGainNode!: GainNode;
  private inputSignalGainNode!: GainNode; // Controls level of signal being modulated
  private modulatedGain!: GainNode; // GainNode whose gain is modulated by carrier

  // No specific effectOutputLevelGainNode is needed here as wetSignalFinalGain (from base) serves this role
  // if the mix is handled by setDryWetLevels.

  private periodicWaves: PeriodicWaveStore;

  constructor(audioContext: AudioContext, periodicWaves: PeriodicWaveStore) {
    super(audioContext, true); // true for analyser
    this.periodicWaves = periodicWaves;
  }

  protected _initializeNodes(): void {
    this.carrierOsc = this.audioContext.createOscillator();
    this.carrierAmpGainNode = this.audioContext.createGain();
    this.inputSignalGainNode = this.audioContext.createGain();
    this.modulatedGain = this.audioContext.createGain();
    
    this.modulatedGain.gain.value = 0; // The gain PARAMETER of this node is the modulator input.
                                     // The signal flowing THROUGH this node is the one being modulated.
    try {
        this.carrierOsc.start();
    } catch(e) {
        // console.warn("RingModEffect: Carrier OSC already started.");
    }
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode (from base) -> inputSignalGainNode (signal to be modulated) -> modulatedGain (actual modulation happens here) -> wetSignalFinalGain (from base)
    this.wetProcessingNode.connect(this.inputSignalGainNode);
    this.inputSignalGainNode.connect(this.modulatedGain);
    
    // Carrier Path feeding the gain input of modulatedGain:
    // carrierOsc -> carrierAmpGainNode -> modulatedGain.gain (control input)
    this.carrierOsc.connect(this.carrierAmpGainNode);
    this.carrierAmpGainNode.connect(this.modulatedGain.gain);

    // Output of modulation:
    this.modulatedGain.connect(this.wetSignalFinalGain);
  }

  public update(params: RingModParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    PeriodicWaveUtils.applyWaveformToNode(this.audioContext, this.carrierOsc, params.carrierWaveform, this.periodicWaves);
    this.carrierOsc.frequency.cancelScheduledValues(t);
    this.carrierOsc.frequency.setValueAtTime(this.carrierOsc.frequency.value, t);
    this.carrierOsc.frequency.linearRampToValueAtTime(params.carrierFrequency, rampTargetTime);

    this.carrierAmpGainNode.gain.cancelScheduledValues(t);
    this.carrierAmpGainNode.gain.setValueAtTime(this.carrierAmpGainNode.gain.value, t);
    this.carrierAmpGainNode.gain.linearRampToValueAtTime(params.carrierAmplitude, rampTargetTime);

    this.inputSignalGainNode.gain.cancelScheduledValues(t);
    this.inputSignalGainNode.gain.setValueAtTime(this.inputSignalGainNode.gain.value, t);
    this.inputSignalGainNode.gain.linearRampToValueAtTime(params.inputSignalGain, rampTargetTime);

    // The dry/wet mix itself (using params.mix) is handled by AudioEngine calling
    // this.setDryWetLevels(dry, wet, time) or this.enable(false, time).
    // This update method only sets the internal parameters of the ring modulation process.
  }

  public dispose(): void {
    if (this.carrierOsc) {
        try { this.carrierOsc.stop(); } catch(e){}
        try { this.carrierOsc.disconnect(); } catch(e){}
    }
    if (this.carrierAmpGainNode) { try { this.carrierAmpGainNode.disconnect(); } catch(e){} }
    if (this.inputSignalGainNode) { try { this.inputSignalGainNode.disconnect(); } catch(e){} }
    if (this.modulatedGain) { try { this.modulatedGain.disconnect(); } catch(e){} }
    super.dispose();
  }
}
