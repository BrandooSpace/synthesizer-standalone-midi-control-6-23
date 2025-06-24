
import { AudioEffect } from './AudioEffect';
import { WaveshaperParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class WaveshaperEffect extends AudioEffect {
  private driveGainNode!: GainNode;
  private shaperNode!: WaveShaperNode;
  private effectOutputLevelGainNode!: GainNode; // Controls the final output level of the wet signal

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.driveGainNode = this.audioContext.createGain();
    this.shaperNode = this.audioContext.createWaveShaper();
    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode (from base) -> driveGainNode -> shaperNode -> effectOutputLevelGainNode -> wetSignalFinalGain (from base)
    this.wetProcessingNode.connect(this.driveGainNode);
    this.driveGainNode.connect(this.shaperNode);
    this.shaperNode.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: WaveshaperParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    this.driveGainNode.gain.cancelScheduledValues(t);
    this.driveGainNode.gain.setValueAtTime(this.driveGainNode.gain.value, t);
    this.driveGainNode.gain.linearRampToValueAtTime(params.drive, rampTargetTime);

    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);

    const k = 2048; // Standard curve size
    const curve = new Float32Array(k);
    const drive = params.drive; // Use the same drive for curve calculation if it influences shape

    for (let i = 0; i < k; i++) {
      let x = (i * 2 / k) - 1; // Input signal range -1 to 1
      switch (params.curveType) {
        case 'tanh':
          curve[i] = Math.tanh(x * drive); // Applying drive to shape intensity
          break;
        case 'hardClip':
          curve[i] = Math.max(-1, Math.min(1, x * drive));
          break;
        case 'fold':
          let val = x * drive;
          curve[i] = Math.abs((val % 4) - 2) - 1; // Foldback distortion
          break;
        default:
          curve[i] = Math.tanh(x * drive);
      }
    }
    this.shaperNode.curve = curve;
    this.shaperNode.oversample = '4x';

    // The overall enable/disable (dry/wet mix for bypass) is handled by AudioEngine calling
    // this.enable(params.isWaveshaperEnabled, time) on this instance.
  }

  public dispose(): void {
    if (this.driveGainNode) { try { this.driveGainNode.disconnect(); } catch(e){} }
    if (this.shaperNode) { try { this.shaperNode.disconnect(); } catch(e){} }
    if (this.effectOutputLevelGainNode) { try { this.effectOutputLevelGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
