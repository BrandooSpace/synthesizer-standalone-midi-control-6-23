
import { AudioEffect } from './AudioEffect';
import { LadderFilterParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class LadderFilterEffect extends AudioEffect {
  private driveNode!: GainNode;
  private filterNodes: BiquadFilterNode[] = [];
  private effectOutputLevelGainNode!: GainNode; // For params.outputLevel

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.driveNode = this.audioContext.createGain();
    this.filterNodes = [];
    for (let i = 0; i < 4; i++) {
      const filterNode = this.audioContext.createBiquadFilter();
      filterNode.type = 'lowpass';
      // Moog ladder filters are typically 24dB/octave. Biquad lowpass is 12dB/octave.
      // So, two in series would be 24dB/octave. Four gives 48dB/octave for a very steep slope.
      // The Q of each filter contributes to the overall resonance.
      this.filterNodes.push(filterNode);
    }
    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode -> driveNode -> filter1 -> filter2 -> filter3 -> filter4 -> effectOutputLevelGainNode -> wetSignalFinalGain
    this.wetProcessingNode.connect(this.driveNode);
    
    let currentSource: AudioNode = this.driveNode;
    this.filterNodes.forEach(filterNode => {
      currentSource.connect(filterNode);
      currentSource = filterNode;
    });
    
    currentSource.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: LadderFilterParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    this.driveNode.gain.cancelScheduledValues(t);
    this.driveNode.gain.setValueAtTime(this.driveNode.gain.value, t);
    this.driveNode.gain.linearRampToValueAtTime(params.drive, rampTargetTime);

    this.filterNodes.forEach(filterNode => {
      filterNode.frequency.cancelScheduledValues(t);
      filterNode.frequency.setValueAtTime(filterNode.frequency.value, t);
      filterNode.frequency.linearRampToValueAtTime(params.cutoffFrequency, rampTargetTime);

      filterNode.Q.cancelScheduledValues(t);
      filterNode.Q.setValueAtTime(filterNode.Q.value, t);
      // Resonance (Q) should be applied carefully; high Q on multiple cascaded filters can be intense.
      filterNode.Q.linearRampToValueAtTime(params.resonance, rampTargetTime);
    });

    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);
  }

  public dispose(): void {
    if (this.driveNode) { try { this.driveNode.disconnect(); } catch(e){} }
    this.filterNodes.forEach(node => { try { node.disconnect(); } catch(e){} });
    if (this.effectOutputLevelGainNode) { try { this.effectOutputLevelGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
