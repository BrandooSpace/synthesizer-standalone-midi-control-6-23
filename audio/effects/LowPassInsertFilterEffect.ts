
import { AudioEffect } from './AudioEffect';
import { LowPassFilterInsertParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class LowPassInsertFilterEffect extends AudioEffect {
  private filterNode!: BiquadFilterNode; 
  private effectOutputLevelGainNode!: GainNode; // Controls the final output level of the wet signal for this effect

  constructor(audioContext: AudioContext) {
    // true for connectOutputToAnalyser, meaning this effect will have an analyser on its wet path output
    super(audioContext, true); 
    // The effect is initialized in a disabled state by the base class.
    // AudioEngine will call `update` and `enable` after construction to set initial parameters.
  }

  protected _initializeNodes(): void {
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // The wet signal path for this effect:
    // wetProcessingNode (from base class) -> filterNode -> effectOutputLevelGainNode -> wetSignalFinalGain (from base class)
    this.wetProcessingNode.connect(this.filterNode);
    this.filterNode.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: LowPassFilterInsertParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    // Update filter parameters
    this.filterNode.frequency.cancelScheduledValues(t);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, t);
    this.filterNode.frequency.linearRampToValueAtTime(params.cutoffFrequency, rampTargetTime);

    this.filterNode.Q.cancelScheduledValues(t);
    this.filterNode.Q.setValueAtTime(this.filterNode.Q.value, t);
    this.filterNode.Q.linearRampToValueAtTime(params.resonance, rampTargetTime);

    // Update the effect's specific output level gain
    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);
    
    // The overall enable/disable (dry/wet mix) is handled by AudioEngine calling this.enable() on this instance,
    // which controls dryGainNode and wetSignalFinalGain in the base AudioEffect class.
  }

  public dispose(): void {
    // Disconnect nodes specific to this effect class first
    if (this.filterNode) {
        try { this.filterNode.disconnect(); } catch(e){}
    }
    if (this.effectOutputLevelGainNode) {
        try { this.effectOutputLevelGainNode.disconnect(); } catch(e){}
    }
    // Call super.dispose() to handle base class node disconnections
    super.dispose();
  }
}
