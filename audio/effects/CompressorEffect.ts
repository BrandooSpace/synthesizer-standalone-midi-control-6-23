
import { AudioEffect } from './AudioEffect';
import { CompressorParams } from '../../types';
import { RAMP_TIME } from '../../constants';

const dbToGain = (db: number) => Math.pow(10, db / 20);

export class CompressorEffect extends AudioEffect {
  private compressorNode!: DynamicsCompressorNode;
  private makeupGainNode!: GainNode;

  // Sidechain enhancements
  private sidechainAnalyserNode: AnalyserNode | null = null;
  private sidechainSourceNode: AudioNode | null = null;
  private sidechainDataArray: Float32Array | null = null;
  private sidechainProcessingInterval: number | null = null;
  private lastAppliedThreshold: number = 0; // To avoid redundant updates

  constructor(audioContext: AudioContext) {
    super(audioContext, true); 
    this.lastAppliedThreshold = -24; // Default threshold
  }

  protected _initializeNodes(): void {
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.makeupGainNode = this.audioContext.createGain();

    // Sidechain Analyser (not connected initially)
    this.sidechainAnalyserNode = this.audioContext.createAnalyser();
    this.sidechainAnalyserNode.fftSize = 256; // Smaller FFT for faster level detection
    this.sidechainDataArray = new Float32Array(this.sidechainAnalyserNode.frequencyBinCount);
  }

  protected _connectInternal(): void {
    this.wetProcessingNode.connect(this.compressorNode);
    this.compressorNode.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.wetSignalFinalGain);
  }
  
  public setSidechainSource(sourceNode: AudioNode | null): void {
    if (this.sidechainSourceNode && this.sidechainAnalyserNode) {
        try {
            this.sidechainSourceNode.disconnect(this.sidechainAnalyserNode);
        } catch(e) {}
    }
    this.sidechainSourceNode = sourceNode;
    if (this.sidechainSourceNode && this.sidechainAnalyserNode) {
        this.sidechainSourceNode.connect(this.sidechainAnalyserNode);
        if (!this.sidechainProcessingInterval) {
            this.startSidechainProcessing();
        }
    } else {
        this.stopSidechainProcessing();
         // Reset threshold to its base value if sidechain is removed
        if (this.audioContext) {
            const now = this.audioContext.currentTime;
            this.compressorNode.threshold.cancelScheduledValues(now);
            this.compressorNode.threshold.setValueAtTime(this.compressorNode.threshold.value, now);
            this.compressorNode.threshold.linearRampToValueAtTime(this.lastAppliedThreshold, now + RAMP_TIME);
        }
    }
  }

  private startSidechainProcessing(): void {
    if (this.sidechainProcessingInterval) return;
    this.sidechainProcessingInterval = window.setInterval(() => {
        this.processSidechainSignal();
    }, 30); // Process ~33 times per second
  }

  private stopSidechainProcessing(): void {
    if (this.sidechainProcessingInterval) {
        window.clearInterval(this.sidechainProcessingInterval);
        this.sidechainProcessingInterval = null;
    }
  }

  private processSidechainSignal(): void {
    if (!this.sidechainAnalyserNode || !this.sidechainDataArray || !this.sidechainSourceNode || !this.audioContext) {
      return;
    }

    this.sidechainAnalyserNode.getFloatTimeDomainData(this.sidechainDataArray);
    let peak = 0;
    for (let i = 0; i < this.sidechainDataArray.length; i++) {
      const absSample = Math.abs(this.sidechainDataArray[i]);
      if (absSample > peak) {
        peak = absSample;
      }
    }
    
    // Convert peak to dBFS. Peak is 0-1.
    const sidechainDb = peak > 0 ? 20 * Math.log10(peak) : -100; // -100dB for silence

    // Modulate threshold based on sidechainDb and sensitivity
    // A louder sidechain signal should lower the threshold (make compressor act more)
    // Base threshold is from params.threshold.
    // Sensitivity (0-1) determines how much sidechainDb affects threshold.
    // Example: If sidechainDb is -6dB, and sensitivity is 0.5, threshold reduction is -3dB.
    // If params.threshold is -24dB, new threshold is -27dB.
    const currentParams = (this as any)._currentParams as CompressorParams | undefined; // Hack to get current params
    const baseThreshold = currentParams ? currentParams.threshold : this.lastAppliedThreshold;
    const sensitivityFactor = currentParams ? currentParams.sidechainSensitivity : 0.5;

    let thresholdModulation = 0;
    if (sidechainDb > -60) { // Only modulate if sidechain signal is significant
        // Map sidechainDb (e.g., -60 to 0 dB) to a modulation range (e.g., 0 to -24 dB)
        // This mapping can be tweaked for desired response.
        // Let's say a 0dBFS sidechain signal with max sensitivity pushes threshold down by 24dB.
        const maxThresholdReduction = -24; 
        thresholdModulation = (sidechainDb / 60) * maxThresholdReduction * sensitivityFactor;
    }
    
    const newThreshold = Math.max(-100, Math.min(0, baseThreshold + thresholdModulation));
    
    const now = this.audioContext.currentTime;
    // Apply modulation smoothly
    this.compressorNode.threshold.cancelScheduledValues(now);
    this.compressorNode.threshold.setValueAtTime(this.compressorNode.threshold.value, now);
    this.compressorNode.threshold.linearRampToValueAtTime(newThreshold, now + 0.03); // Quick ramp for sidechain effect
  }


  public update(params: CompressorParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    // Store current params for sidechain processing access (a bit of a workaround)
    (this as any)._currentParams = params;
    this.lastAppliedThreshold = params.threshold;

    // If not using sidechain, or sidechain source is 'none', set threshold directly.
    // Otherwise, sidechainProcessing will handle threshold.
    if (!this.sidechainSourceNode || params.sidechainSource === 'none') {
        this.compressorNode.threshold.cancelScheduledValues(t);
        this.compressorNode.threshold.setValueAtTime(this.compressorNode.threshold.value, t);
        this.compressorNode.threshold.linearRampToValueAtTime(params.threshold, rampTargetTime);
    }
    
    this.compressorNode.knee.cancelScheduledValues(t);
    this.compressorNode.knee.setValueAtTime(this.compressorNode.knee.value, t);
    this.compressorNode.knee.linearRampToValueAtTime(params.knee, rampTargetTime);

    this.compressorNode.ratio.cancelScheduledValues(t);
    this.compressorNode.ratio.setValueAtTime(this.compressorNode.ratio.value, t);
    this.compressorNode.ratio.linearRampToValueAtTime(params.ratio, rampTargetTime);

    this.compressorNode.attack.setValueAtTime(Math.max(0, params.attack), t);
    this.compressorNode.release.setValueAtTime(Math.max(0.001, params.release), t);

    this.makeupGainNode.gain.cancelScheduledValues(t);
    this.makeupGainNode.gain.setValueAtTime(this.makeupGainNode.gain.value, t);
    this.makeupGainNode.gain.linearRampToValueAtTime(dbToGain(params.makeupGain), rampTargetTime);
  }

  public dispose(): void {
    this.stopSidechainProcessing();
    if (this.sidechainAnalyserNode) { try { this.sidechainAnalyserNode.disconnect(); } catch(e){} }
    if (this.compressorNode) { try { this.compressorNode.disconnect(); } catch(e){} }
    if (this.makeupGainNode) { try { this.makeupGainNode.disconnect(); } catch(e){} }
    super.dispose();
  }
}
