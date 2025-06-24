
import { ReverbParams } from '../../types';
import { RAMP_TIME, BUILT_IN_IRS, DEFAULT_REVERB_PARAMS, BUILT_IN_IR_DATA } from '../../constants';

export class ReverbEffect {
  private audioContext: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;

  private sendLevelGainNode: GainNode;
  private returnLevelGainNode: GainNode;
  
  private preDelayNode: DelayNode;
  private convolverNode: ConvolverNode;
  private wetGainNode: GainNode; // Controls the wet signal level post-convolution

  private isEnabledState: boolean;
  private currentlyLoadedIrUrl: string | null = null;
  private builtInIrBuffers: Map<string, AudioBuffer> = new Map();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.isEnabledState = false;

    this.inputNode = this.audioContext.createGain();
    this.sendLevelGainNode = this.audioContext.createGain();
    
    this.preDelayNode = this.audioContext.createDelay(1.0); // Max 1s pre-delay
    this.convolverNode = this.audioContext.createConvolver();
    this.wetGainNode = this.audioContext.createGain();

    this.returnLevelGainNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();

    this.inputNode.connect(this.sendLevelGainNode);
    this.sendLevelGainNode.connect(this.preDelayNode);
    this.preDelayNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGainNode);
    this.wetGainNode.connect(this.returnLevelGainNode);
    this.returnLevelGainNode.connect(this.outputNode);

    this.sendLevelGainNode.gain.value = 0;
    this.returnLevelGainNode.gain.value = 0;
    this.outputNode.gain.value = 0; 
    this.wetGainNode.gain.value = 1;

    this.loadBuiltInIRs();
  }

  private _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async loadBuiltInIRs(): Promise<void> {
    for (const ir of BUILT_IN_IRS) {
      if (ir.url === 'custom_loaded_ir') continue;

      const base64Data = BUILT_IN_IR_DATA[ir.url];
      
      if (typeof base64Data === 'string' && base64Data.length > 0) { // Check if base64Data is a valid string
        try {
          const arrayBuffer = this._base64ToArrayBuffer(base64Data);
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.builtInIrBuffers.set(ir.url, audioBuffer);
        } catch (error) {
          console.error(`ReverbEffect: Error decoding base64 IR ${ir.name} (${ir.url}):`, error);
        }
      } else {
        console.warn(`ReverbEffect: Base64 data not found or invalid for built-in IR: ${ir.name} (${ir.url}). It will not be available.`);
      }
    }
    
    const defaultIrKey = DEFAULT_REVERB_PARAMS.irUrl;
    if (this.builtInIrBuffers.has(defaultIrKey)) {
        this.convolverNode.buffer = this.builtInIrBuffers.get(defaultIrKey)!;
        this.currentlyLoadedIrUrl = defaultIrKey;
    } else {
        const firstAvailableKey = Array.from(this.builtInIrBuffers.keys())[0];
        if (firstAvailableKey) {
            this.convolverNode.buffer = this.builtInIrBuffers.get(firstAvailableKey)!;
            this.currentlyLoadedIrUrl = firstAvailableKey;
            console.warn(`ReverbEffect: Default IR "${defaultIrKey}" not loaded. Fallback IR "${firstAvailableKey}" applied.`);
        } else {
            console.warn(`ReverbEffect: No default or fallback built-in IRs could be applied. Reverb will be silent for built-in options.`);
        }
    }
  }
  
  public async setImpulseResponse(irUrlOrIdentifier: string, customBuffer?: AudioBuffer | null): Promise<void> {
    if (customBuffer && irUrlOrIdentifier === 'custom_loaded_ir') {
        this.convolverNode.buffer = customBuffer;
        this.currentlyLoadedIrUrl = 'custom_loaded_ir';
        return;
    }

    if (this.currentlyLoadedIrUrl === irUrlOrIdentifier && irUrlOrIdentifier !== 'custom_loaded_ir') return; 

    const buffer = this.builtInIrBuffers.get(irUrlOrIdentifier);
    if (buffer) {
        this.convolverNode.buffer = buffer;
        this.currentlyLoadedIrUrl = irUrlOrIdentifier;
    } else if (irUrlOrIdentifier === 'custom_loaded_ir') {
        console.warn("ReverbEffect: 'custom_loaded_ir' selected but no custom buffer provided. Clearing reverb.");
        this.convolverNode.buffer = null;
        this.currentlyLoadedIrUrl = 'custom_loaded_ir'; 
    } else {
        console.warn(`ReverbEffect: Pre-loaded IR for "${irUrlOrIdentifier}" not found. Clearing reverb.`);
        this.convolverNode.buffer = null; 
        this.currentlyLoadedIrUrl = irUrlOrIdentifier; 
    }
  }

  public update(params: ReverbParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    this.sendLevelGainNode.gain.cancelScheduledValues(t);
    this.sendLevelGainNode.gain.setValueAtTime(this.sendLevelGainNode.gain.value, t);
    this.sendLevelGainNode.gain.linearRampToValueAtTime(params.sendLevel, rampTargetTime);

    this.returnLevelGainNode.gain.cancelScheduledValues(t);
    this.returnLevelGainNode.gain.setValueAtTime(this.returnLevelGainNode.gain.value, t);
    this.returnLevelGainNode.gain.linearRampToValueAtTime(params.returnLevel, rampTargetTime);
    
    if (this.isEnabledState) {
      this.preDelayNode.delayTime.cancelScheduledValues(t);
      this.preDelayNode.delayTime.setValueAtTime(this.preDelayNode.delayTime.value, t);
      this.preDelayNode.delayTime.linearRampToValueAtTime(Math.max(0, params.preDelayTime), rampTargetTime);
      
      if (params.irUrl === 'custom_loaded_ir') {
        if (params.customIrBuffer && this.convolverNode.buffer !== params.customIrBuffer) {
             this.setImpulseResponse(params.irUrl, params.customIrBuffer);
        } else if (!params.customIrBuffer && this.currentlyLoadedIrUrl !== 'custom_loaded_ir') {
            this.setImpulseResponse(params.irUrl, null);
        }
      } else if (params.irUrl !== this.currentlyLoadedIrUrl) {
        this.setImpulseResponse(params.irUrl);
      }
    }
  }

  public enable(shouldEnable: boolean, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;
    this.isEnabledState = shouldEnable;

    const targetOutputGain = shouldEnable ? 1.0 : 0.0;
    this.outputNode.gain.cancelScheduledValues(t);
    this.outputNode.gain.setValueAtTime(this.outputNode.gain.value, t);
    this.outputNode.gain.linearRampToValueAtTime(targetOutputGain, rampTargetTime);
  }

  public getInputNode(): GainNode { return this.inputNode; }
  public getOutputNode(): GainNode { return this.outputNode; }

  public dispose(): void {
    const nodesToDisconnect = [
      this.inputNode, this.sendLevelGainNode, this.preDelayNode, 
      this.convolverNode, this.wetGainNode,
      this.returnLevelGainNode, this.outputNode,
    ];
    nodesToDisconnect.forEach(node => {
      try { 
        if (node) node.disconnect(); 
      } catch (e) {}
    });
    this.builtInIrBuffers.clear();
  }
}
