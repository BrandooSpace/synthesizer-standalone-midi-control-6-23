import { NoiseParams, NoiseType } from '../../types';
import { RAMP_TIME } from '../../constants';

export class NoiseSource {
  private audioContext: AudioContext;
  private whiteNoiseBufferSource: AudioBufferSourceNode;
  private pinkNoiseFilter: BiquadFilterNode;
  public outputGain: GainNode; // This node will be connected to each Voice's noiseVcaGain

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    this.outputGain = this.audioContext.createGain();
    this.outputGain.gain.value = 0; // Start with noise off globally

    // White Noise Generation
    this.whiteNoiseBufferSource = this.audioContext.createBufferSource();
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise buffer
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Generate white noise samples
    }
    this.whiteNoiseBufferSource.buffer = noiseBuffer;
    this.whiteNoiseBufferSource.loop = true;

    // Pink Noise Filter (approximate)
    // Using a simple low-pass, a more accurate pink noise filter would involve cascading multiple filters
    this.pinkNoiseFilter = this.audioContext.createBiquadFilter();
    this.pinkNoiseFilter.type = 'lowpass';
    this.pinkNoiseFilter.frequency.value = 800; // Adjust for desired pink noise character
    this.pinkNoiseFilter.Q.value = 0.707; // Butterworth

    // Initial connection: white noise -> output (if white is default)
    // The update method will switch this.
  }

  public start(): void {
    try {
      this.whiteNoiseBufferSource.start();
    } catch (e) {
      console.error("NoiseSource: Error starting white noise buffer source:", e);
    }
  }

  public update(params: NoiseParams, time?: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    // Disconnect previous noise path from outputGain
    try { this.whiteNoiseBufferSource.disconnect(this.outputGain); } catch (e) {}
    try { this.pinkNoiseFilter.disconnect(this.outputGain); } catch (e) {}
    try { this.whiteNoiseBufferSource.disconnect(this.pinkNoiseFilter); } catch(e) {}


    if (params.isNoiseEnabled) {
      if (params.noiseType === NoiseType.PINK) {
        this.whiteNoiseBufferSource.connect(this.pinkNoiseFilter);
        this.pinkNoiseFilter.connect(this.outputGain);
      } else { // White noise
        this.whiteNoiseBufferSource.connect(this.outputGain);
      }
      // The actual noise level per voice is handled by the Voice class's noiseVcaGain.
      // This global outputGain is generally kept at 1 when enabled, or can act as an additional master noise trim.
      // For now, let's keep it at 1 if noise is enabled, and 0 if disabled.
      // The `params.noiseLevel` from UI will control per-voice `noiseVcaGain`.
      this.outputGain.gain.cancelScheduledValues(t);
      this.outputGain.gain.setValueAtTime(this.outputGain.gain.value, t);
      this.outputGain.gain.linearRampToValueAtTime(1.0, rampTargetTime);
    } else {
      this.outputGain.gain.cancelScheduledValues(t);
      this.outputGain.gain.setValueAtTime(this.outputGain.gain.value, t);
      this.outputGain.gain.linearRampToValueAtTime(0, rampTargetTime);
    }
  }

  public getOutputNode(): GainNode {
    return this.outputGain;
  }

  public dispose(): void {
    try { this.whiteNoiseBufferSource.stop(); } catch(e) {}
    try { this.whiteNoiseBufferSource.disconnect(); } catch(e) {}
    try { this.pinkNoiseFilter.disconnect(); } catch(e) {}
    try { this.outputGain.disconnect(); } catch(e) {}
  }
}
