
import { RAMP_TIME } from '../../constants';

export abstract class AudioEffect {
  protected audioContext: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;
  protected dryGainNode: GainNode;
  protected wetProcessingNode: GainNode; // Input to the subclass's effect chain (receives signal from inputNode)
  protected wetSignalFinalGain: GainNode; // Output gain of the subclass's effect chain, before analyser/outputNode
  protected isEnabledState: boolean;
  protected analyserNode: AnalyserNode | null = null;

  constructor(audioContext: AudioContext, connectOutputToAnalyser: boolean = true) {
    this.audioContext = audioContext;
    this.isEnabledState = false; // Effects are typically initialized as disabled

    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGainNode = this.audioContext.createGain();
    this.wetProcessingNode = this.audioContext.createGain();
    this.wetSignalFinalGain = this.audioContext.createGain();

    // Dry path: input -> dryGain -> output
    this.inputNode.connect(this.dryGainNode);
    this.dryGainNode.connect(this.outputNode);

    // Wet path setup: input -> wetProcessingNode -> [SUBCLASS NODES] -> wetSignalFinalGain -> (analyser) -> output
    this.inputNode.connect(this.wetProcessingNode);
    // Subclass will connect its processing chain:
    // from: this.wetProcessingNode 
    // to:   this.wetSignalFinalGain

    if (connectOutputToAnalyser) {
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048; // Standard FFT size
      // Wet signal passes through analyser before reaching the common output node
      this.wetSignalFinalGain.connect(this.analyserNode);
      this.analyserNode.connect(this.outputNode);
    } else {
      this.wetSignalFinalGain.connect(this.outputNode);
    }
    
    // Initialize to bypass state: dry signal at full, wet signal at zero.
    this.dryGainNode.gain.value = 1;
    this.wetSignalFinalGain.gain.value = 0;
    // wetProcessingNode usually stays at unity gain; enable() controls wetSignalFinalGain.
    this.wetProcessingNode.gain.value = 1; 

    // Abstract methods to be implemented by subclasses
    this._initializeNodes(); // Create specific nodes for the effect
    this._connectInternal(); // Connect these specific nodes internally
  }

  public connect(destination: AudioNode, outputIndex?: number, inputIndex?: number): AudioNode {
    this.outputNode.connect(destination, outputIndex, inputIndex);
    return destination;
  }

  public disconnect(): void {
    try {
      this.outputNode.disconnect();
    } catch (e) {
      // console.warn('Error disconnecting AudioEffect outputNode:', e);
    }
  }

  public enable(shouldEnable: boolean, time?: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;
    
    const targetDryGain = shouldEnable ? 0 : 1;
    const targetWetGain = shouldEnable ? 1 : 0;

    this.isEnabledState = shouldEnable;

    this.dryGainNode.gain.cancelScheduledValues(t);
    this.dryGainNode.gain.setValueAtTime(this.dryGainNode.gain.value, t); // Start ramp from current value
    this.dryGainNode.gain.linearRampToValueAtTime(targetDryGain, rampTargetTime);

    this.wetSignalFinalGain.gain.cancelScheduledValues(t);
    this.wetSignalFinalGain.gain.setValueAtTime(this.wetSignalFinalGain.gain.value, t);
    this.wetSignalFinalGain.gain.linearRampToValueAtTime(targetWetGain, rampTargetTime);
  }

  public setDryWetLevels(dryValue: number, wetValue: number, time?: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;
    
    // An effect is considered "enabled" if it's contributing any signal (wet or dry through its own control)
    this.isEnabledState = dryValue > 0 || wetValue > 0;

    this.dryGainNode.gain.cancelScheduledValues(t);
    this.dryGainNode.gain.setValueAtTime(this.dryGainNode.gain.value, t);
    this.dryGainNode.gain.linearRampToValueAtTime(dryValue, rampTargetTime);

    this.wetSignalFinalGain.gain.cancelScheduledValues(t);
    this.wetSignalFinalGain.gain.setValueAtTime(this.wetSignalFinalGain.gain.value, t);
    this.wetSignalFinalGain.gain.linearRampToValueAtTime(wetValue, rampTargetTime);
  }


  public isEnabled(): boolean {
    return this.isEnabledState;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public dispose(): void {
    this.disconnect(); // Disconnect outputNode from any downstream nodes
    
    // Disconnect internal nodes specific to AudioEffect base class
    // These are safe to call even if already disconnected.
    try { this.inputNode.disconnect(); } catch(e){}
    try { this.dryGainNode.disconnect(); } catch(e){}
    try { this.wetProcessingNode.disconnect(); } catch(e){}
    try { this.wetSignalFinalGain.disconnect(); } catch(e){}
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch(e){}
    }
    // Subclasses should override this method to disconnect their own internal nodes
    // and call super.dispose()
  }

  // Abstract methods for subclasses to implement
  protected abstract _initializeNodes(): void;
  protected abstract _connectInternal(): void; // Connect chain: wetProcessingNode -> ... -> wetSignalFinalGain
  abstract update(params: any, time: number): void;
}