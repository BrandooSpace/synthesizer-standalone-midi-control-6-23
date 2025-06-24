
import { AudioEffect } from './AudioEffect';
import { NotchFilterInsertParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class NotchInsertFilterEffect extends AudioEffect {
  private filterNode!: BiquadFilterNode;
  private effectOutputLevelGainNode!: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'notch';
    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode -> filterNode -> effectOutputLevelGainNode -> wetSignalFinalGain
    this.wetProcessingNode.connect(this.filterNode);
    this.filterNode.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: NotchFilterInsertParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    this.filterNode.frequency.cancelScheduledValues(t);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, t);
    this.filterNode.frequency.linearRampToValueAtTime(params.cutoffFrequency, rampTargetTime);

    this.filterNode.Q.cancelScheduledValues(t);
    this.filterNode.Q.setValueAtTime(this.filterNode.Q.value, t);
    this.filterNode.Q.linearRampToValueAtTime(params.resonance, rampTargetTime);

    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);
  }

  public dispose(): void {
    if (this.filterNode) { try { this.filterNode.disconnect(); } catch(e){} }
    if (this.effectOutputLevelGainNode) { try { this.effectOutputLevelGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
