
import { AudioEffect } from './AudioEffect';
import { OverdriveParams } from '../../types';
import { RAMP_TIME } from '../../constants';

export class OverdriveEffect extends AudioEffect {
  private driveGainNode!: GainNode;
  private shaperNode!: WaveShaperNode;
  private toneFilterNode!: BiquadFilterNode;
  private effectOutputLevelGainNode!: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext, true); // true for analyser
  }

  protected _initializeNodes(): void {
    this.driveGainNode = this.audioContext.createGain();
    this.shaperNode = this.audioContext.createWaveShaper();
    this.toneFilterNode = this.audioContext.createBiquadFilter();
    this.toneFilterNode.type = 'lowpass';
    this.effectOutputLevelGainNode = this.audioContext.createGain();
  }

  protected _connectInternal(): void {
    // Wet Path:
    // wetProcessingNode -> driveGainNode -> shaperNode -> toneFilterNode -> effectOutputLevelGainNode -> wetSignalFinalGain
    this.wetProcessingNode.connect(this.driveGainNode);
    this.driveGainNode.connect(this.shaperNode);
    this.shaperNode.connect(this.toneFilterNode);
    this.toneFilterNode.connect(this.effectOutputLevelGainNode);
    this.effectOutputLevelGainNode.connect(this.wetSignalFinalGain);
  }

  public update(params: OverdriveParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    // Drive gain scales the input before shaping.
    // The params.drive (1-100) is scaled down for more controllable gain.
    const scaledDriveGain = params.drive / 5.0; 
    this.driveGainNode.gain.cancelScheduledValues(t);
    this.driveGainNode.gain.setValueAtTime(this.driveGainNode.gain.value, t);
    this.driveGainNode.gain.linearRampToValueAtTime(scaledDriveGain, rampTargetTime);

    this.effectOutputLevelGainNode.gain.cancelScheduledValues(t);
    this.effectOutputLevelGainNode.gain.setValueAtTime(this.effectOutputLevelGainNode.gain.value, t);
    this.effectOutputLevelGainNode.gain.linearRampToValueAtTime(params.outputLevel, rampTargetTime);

    const k = 4096; // Curve resolution
    const curve = new Float32Array(k);
    // Curve intensity factor, adjust as needed for different curve types
    // This value can be tuned based on how params.drive is intended to interact with the shape
    const curveIntensity = 5; 

    for (let i = 0; i < k; i++) {
      let x = (i * 2 / k) - 1; // Normalized input signal (-1 to 1)
      switch (params.curveType) {
        case 'softClip':
          curve[i] = Math.tanh(x * curveIntensity);
          break;
        case 'hardClip':
          curve[i] = Math.max(-1, Math.min(1, x * curveIntensity));
          break;
        case 'fuzz':
          // A common fuzz formula (can be tweaked)
          const y_fuzz_input = x * curveIntensity * 1.5; // Additional scaling for fuzz
          curve[i] = Math.max(-1, Math.min(1, y_fuzz_input - (y_fuzz_input * y_fuzz_input * y_fuzz_input / 3)));
          break;
        default:
          curve[i] = Math.tanh(x * curveIntensity);
      }
    }
    this.shaperNode.curve = curve;
    this.shaperNode.oversample = '4x';

    const minToneFreq = 200;
    const maxToneFreq = 10000;
    const toneFreq = minToneFreq + (params.tone * (maxToneFreq - minToneFreq));
    this.toneFilterNode.frequency.cancelScheduledValues(t);
    this.toneFilterNode.frequency.setValueAtTime(this.toneFilterNode.frequency.value, t);
    this.toneFilterNode.frequency.linearRampToValueAtTime(toneFreq, rampTargetTime);
    this.toneFilterNode.Q.setValueAtTime(0.707, t); // Neutral Q for tone control
  }

  public dispose(): void {
    if (this.driveGainNode) { try { this.driveGainNode.disconnect(); } catch(e){} }
    if (this.shaperNode) { try { this.shaperNode.disconnect(); } catch(e){} }
    if (this.toneFilterNode) { try { this.toneFilterNode.disconnect(); } catch(e){} }
    if (this.effectOutputLevelGainNode) { try { this.effectOutputLevelGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
