
import { AudioEffect } from './AudioEffect';
import { ThreeBandEqParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class ThreeBandEqEffect extends AudioEffect {
  private lowShelfNode!: BiquadFilterNode;
  private midPeakNode!: BiquadFilterNode;
  private highShelfNode!: BiquadFilterNode;
  private effectOutputLevelGainNode!: GainNode; // For params.outputLevel

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.lowShelfNode = this.audioContext.createBiquadFilter();
    this.lowShelfNode.type = 'lowshelf';

    this.midPeakNode = this.audioContext.createBiquadFilter();
    this.midPeakNode.type = 'peaking';

    this.highShelfNode = this.audioContext.createBiquadFilter();
    this.highShelfNode.type = 'highshelf';

    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode -> lowShelf -> midPeak -> highShelf -> effectOutputLevelGainNode -> wetSignalFinalGain
    this.wetProcessingNode.connect(this.lowShelfNode);
    this.lowShelfNode.connect(this.midPeakNode);
    this.midPeakNode.connect(this.highShelfNode);
    this.highShelfNode.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: ThreeBandEqParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    // Low Shelf
    this.lowShelfNode.frequency.cancelScheduledValues(t);
    this.lowShelfNode.frequency.setValueAtTime(this.lowShelfNode.frequency.value, t);
    this.lowShelfNode.frequency.linearRampToValueAtTime(params.lowShelf.frequency, rampTargetTime);
    this.lowShelfNode.gain.cancelScheduledValues(t);
    this.lowShelfNode.gain.setValueAtTime(this.lowShelfNode.gain.value, t);
    this.lowShelfNode.gain.linearRampToValueAtTime(params.lowShelf.gain, rampTargetTime);

    // Mid Peak
    this.midPeakNode.frequency.cancelScheduledValues(t);
    this.midPeakNode.frequency.setValueAtTime(this.midPeakNode.frequency.value, t);
    this.midPeakNode.frequency.linearRampToValueAtTime(params.midPeak.frequency, rampTargetTime);
    this.midPeakNode.gain.cancelScheduledValues(t);
    this.midPeakNode.gain.setValueAtTime(this.midPeakNode.gain.value, t);
    this.midPeakNode.gain.linearRampToValueAtTime(params.midPeak.gain, rampTargetTime);
    this.midPeakNode.Q.cancelScheduledValues(t);
    this.midPeakNode.Q.setValueAtTime(this.midPeakNode.Q.value, t);
    this.midPeakNode.Q.linearRampToValueAtTime(params.midPeak.q || 1, rampTargetTime);

    // High Shelf
    this.highShelfNode.frequency.cancelScheduledValues(t);
    this.highShelfNode.frequency.setValueAtTime(this.highShelfNode.frequency.value, t);
    this.highShelfNode.frequency.linearRampToValueAtTime(params.highShelf.frequency, rampTargetTime);
    this.highShelfNode.gain.cancelScheduledValues(t);
    this.highShelfNode.gain.setValueAtTime(this.highShelfNode.gain.value, t);
    this.highShelfNode.gain.linearRampToValueAtTime(params.highShelf.gain, rampTargetTime);

    // Output Level
    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);
  }

  public dispose(): void {
    if (this.lowShelfNode) { try { this.lowShelfNode.disconnect(); } catch(e){} }
    if (this.midPeakNode) { try { this.midPeakNode.disconnect(); } catch(e){} }
    if (this.highShelfNode) { try { this.highShelfNode.disconnect(); } catch(e){} }
    if (this.effectOutputLevelGainNode) { try { this.effectOutputLevelGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
