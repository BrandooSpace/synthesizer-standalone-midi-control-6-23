
import { AudioEffect } from './AudioEffect';
import { StereoWidthParams } from '../../types';
import { RAMP_TIME, MAX_HAAS_DELAY_TIME } from '../../constants';

export class StereoWidthEffect extends AudioEffect {
  private splitterNode!: ChannelSplitterNode;
  private haasDelayNode!: DelayNode;
  private mergerNode!: ChannelMergerNode;
  
  // Gains for mixing dry L with delayed R for the new R channel, and original L for the new L channel
  private leftChannelPassThroughGain!: GainNode; // Carries original L to new L output
  private rightChannelOriginalMixGain!: GainNode; // Carries original R to new R output (mixed with delayed L)
  private rightChannelDelayedMixGain!: GainNode; // Carries delayed L to new R output

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.splitterNode = this.audioContext.createChannelSplitter(2);
    this.haasDelayNode = this.audioContext.createDelay(MAX_HAAS_DELAY_TIME);
    this.mergerNode = this.audioContext.createChannelMerger(2);

    this.leftChannelPassThroughGain = this.audioContext.createGain();
    this.rightChannelOriginalMixGain = this.audioContext.createGain();
    this.rightChannelDelayedMixGain = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path Processing:
    // wetProcessingNode (input) -> splitter
    // Splitter Channel 0 (Left In) -> leftChannelPassThroughGain -> merger Channel 0 (Left Out)
    // Splitter Channel 0 (Left In) -> haasDelayNode -> rightChannelDelayedMixGain -> merger Channel 1 (Right Out)
    // Splitter Channel 1 (Right In) -> rightChannelOriginalMixGain -> merger Channel 1 (Right Out)
    // merger -> wetSignalFinalGain (output of effect)

    this.wetProcessingNode.connect(this.splitterNode);

    // Left channel processing (original L becomes new L)
    this.splitterNode.connect(this.leftChannelPassThroughGain, 0, 0);
    this.leftChannelPassThroughGain.connect(this.mergerNode, 0, 0);

    // Right channel processing (mix of original R and delayed L becomes new R)
    this.splitterNode.connect(this.rightChannelOriginalMixGain, 1, 0); // Original R
    this.rightChannelOriginalMixGain.connect(this.mergerNode, 0, 1);

    this.splitterNode.connect(this.haasDelayNode, 0, 0); // Delayed L
    this.haasDelayNode.connect(this.rightChannelDelayedMixGain);
    this.rightChannelDelayedMixGain.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(this.wetSignalFinalGain);
  }

  public update(params: StereoWidthParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    const delayTime = params.widthAmount * MAX_HAAS_DELAY_TIME;
    this.haasDelayNode.delayTime.cancelScheduledValues(t);
    this.haasDelayNode.delayTime.setValueAtTime(this.haasDelayNode.delayTime.value, t);
    this.haasDelayNode.delayTime.linearRampToValueAtTime(delayTime, rampTargetTime);

    // Intensity controls the mix for the right output channel:
    // intensity = 0 means new R is original R only.
    // intensity = 1 means new R is delayed L only.
    // intensity = 0.5 means new R is 0.5 * original R + 0.5 * delayed L.
    const originalRightLevel = 1.0 - params.intensity;
    const delayedLeftLevel = params.intensity;

    this.rightChannelOriginalMixGain.gain.cancelScheduledValues(t);
    this.rightChannelOriginalMixGain.gain.setValueAtTime(this.rightChannelOriginalMixGain.gain.value, t);
    this.rightChannelOriginalMixGain.gain.linearRampToValueAtTime(originalRightLevel, rampTargetTime);
    
    this.rightChannelDelayedMixGain.gain.cancelScheduledValues(t);
    this.rightChannelDelayedMixGain.gain.setValueAtTime(this.rightChannelDelayedMixGain.gain.value, t);
    this.rightChannelDelayedMixGain.gain.linearRampToValueAtTime(delayedLeftLevel, rampTargetTime);

    // Left channel pass-through is always at full gain when effect is active.
    this.leftChannelPassThroughGain.gain.cancelScheduledValues(t);
    this.leftChannelPassThroughGain.gain.setValueAtTime(this.leftChannelPassThroughGain.gain.value, t);
    this.leftChannelPassThroughGain.gain.linearRampToValueAtTime(1.0, rampTargetTime);

    // Overall enable/disable is handled by AudioEngine calling this.enable()
  }

  public dispose(): void {
    if (this.splitterNode) { try { this.splitterNode.disconnect(); } catch(e){} }
    if (this.haasDelayNode) { try { this.haasDelayNode.disconnect(); } catch(e){} }
    if (this.mergerNode) { try { this.mergerNode.disconnect(); } catch(e){} }
    if (this.leftChannelPassThroughGain) { try { this.leftChannelPassThroughGain.disconnect(); } catch(e){} }
    if (this.rightChannelOriginalMixGain) { try { this.rightChannelOriginalMixGain.disconnect(); } catch(e){} }
    if (this.rightChannelDelayedMixGain) { try { this.rightChannelDelayedMixGain.disconnect(); } catch(e){} }
    super.dispose();
  }
}
