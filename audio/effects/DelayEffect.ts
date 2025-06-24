
import { DelayParams, DelayFeedbackFilterType } from '../../types';
import { MAX_MAIN_DELAY_TIME, RAMP_TIME } from '../../constants';

export class DelayEffect {
  private audioContext: AudioContext;
  public inputNode: GainNode; 
  public outputNode: GainNode;

  private sendLevelGainNode: GainNode; 
  private returnLevelGainNode: GainNode;
  
  private delayNodeL: DelayNode;
  private delayNodeR: DelayNode;
  private delayFeedbackGainL: GainNode;
  private delayFeedbackGainR: GainNode;
  private delayFeedbackFilterL: BiquadFilterNode;
  private delayFeedbackFilterR: BiquadFilterNode;

  // Enhancements for Phase 2
  private saturationNodeL!: WaveShaperNode;
  private saturationNodeR!: WaveShaperNode;
  private flutterLfo!: OscillatorNode;
  private flutterLfoGainL!: GainNode; // Modulates delayTimeL
  private flutterLfoGainR!: GainNode; // Modulates delayTimeR
  
  private isEnabledState: boolean;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.isEnabledState = false;

    this.inputNode = this.audioContext.createGain();
    this.sendLevelGainNode = this.audioContext.createGain();
    
    this.delayNodeL = this.audioContext.createDelay(MAX_MAIN_DELAY_TIME);
    this.delayNodeR = this.audioContext.createDelay(MAX_MAIN_DELAY_TIME);
    this.delayFeedbackGainL = this.audioContext.createGain();
    this.delayFeedbackGainR = this.audioContext.createGain();
    this.delayFeedbackFilterL = this.audioContext.createBiquadFilter();
    this.delayFeedbackFilterR = this.audioContext.createBiquadFilter();

    // Phase 2: Saturation
    this.saturationNodeL = this.audioContext.createWaveShaper();
    this.saturationNodeR = this.audioContext.createWaveShaper();
    this.setSaturationCurve(0); // Initialize with no saturation

    // Phase 2: Flutter LFO
    this.flutterLfo = this.audioContext.createOscillator();
    this.flutterLfo.type = 'sine';
    this.flutterLfoGainL = this.audioContext.createGain();
    this.flutterLfoGainR = this.audioContext.createGain();
    this.flutterLfo.connect(this.flutterLfoGainL);
    this.flutterLfo.connect(this.flutterLfoGainR);
    this.flutterLfoGainL.connect(this.delayNodeL.delayTime);
    this.flutterLfoGainR.connect(this.delayNodeR.delayTime);
    try {
      this.flutterLfo.start();
    } catch(e) {/* already started */}


    this.returnLevelGainNode = this.audioContext.createGain(); 
    this.outputNode = this.audioContext.createGain();

    // Internal connections:
    // inputNode -> sendLevelGainNode -> (split to L/R delays)
    this.inputNode.connect(this.sendLevelGainNode);

    // Left path: sendLevelGain -> delayL -> saturationL -> filterL -> feedbackGainL -> delayL (feedback loop)
    //                                  `-> returnLevelGain (output path)
    this.sendLevelGainNode.connect(this.delayNodeL);
    this.delayNodeL.connect(this.saturationNodeL);
    this.saturationNodeL.connect(this.delayFeedbackFilterL);
    this.delayFeedbackFilterL.connect(this.delayFeedbackGainL);
    this.delayFeedbackGainL.connect(this.delayNodeL); // Feedback
    this.delayNodeL.connect(this.returnLevelGainNode); 

    // Right path: sendLevelGain -> delayR -> saturationR -> filterR -> feedbackGainR -> delayR (feedback loop)
    //                                   `-> returnLevelGain (output path)
    this.sendLevelGainNode.connect(this.delayNodeR);
    this.delayNodeR.connect(this.saturationNodeR);
    this.saturationNodeR.connect(this.delayFeedbackFilterR);
    this.delayFeedbackFilterR.connect(this.delayFeedbackGainR);
    this.delayFeedbackGainR.connect(this.delayNodeR); // Feedback
    this.delayNodeR.connect(this.returnLevelGainNode);

    this.returnLevelGainNode.connect(this.outputNode);

    this.sendLevelGainNode.gain.value = 0;
    this.returnLevelGainNode.gain.value = 0;
    this.outputNode.gain.value = 0;
  }

  private setSaturationCurve(amount: number): void { // amount 0-1
    const k = 1024; // Curve resolution
    const curve = new Float32Array(k);
    // Simple tanh-like saturation, scaled by amount
    // More pronounced effect as amount approaches 1
    const drive = 1 + amount * 4; // Scale drive from 1 to 5
    for (let i = 0; i < k; i++) {
      let x = (i * 2 / k) - 1;
      curve[i] = Math.tanh(x * drive);
    }
    this.saturationNodeL.curve = curve;
    this.saturationNodeL.oversample = '2x';
    this.saturationNodeR.curve = curve; // Same curve for L/R
    this.saturationNodeR.oversample = '2x';
  }

  public update(params: DelayParams, time: number): void {
    const t = time !== undefined ? time : this.audioContext.currentTime;
    const rampTargetTime = t + RAMP_TIME;

    this.sendLevelGainNode.gain.cancelScheduledValues(t);
    this.sendLevelGainNode.gain.setValueAtTime(this.sendLevelGainNode.gain.value, t);
    this.sendLevelGainNode.gain.linearRampToValueAtTime(params.sendLevel, rampTargetTime);
    
    this.returnLevelGainNode.gain.cancelScheduledValues(t);
    this.returnLevelGainNode.gain.setValueAtTime(this.returnLevelGainNode.gain.value, t);
    this.returnLevelGainNode.gain.linearRampToValueAtTime(params.returnLevel, rampTargetTime);

    if (this.isEnabledState) {
      this.delayNodeL.delayTime.setValueAtTime( // Base delay time, flutter LFO modulates this
        Math.max(0.001, Math.min(MAX_MAIN_DELAY_TIME, params.delayTimeL)),
        t
      );
      this.delayNodeR.delayTime.setValueAtTime(
        Math.max(0.001, Math.min(MAX_MAIN_DELAY_TIME, params.delayTimeR)),
        t
      );

      const feedbackValue = Math.max(0, Math.min(0.98, params.feedback));
      this.delayFeedbackGainL.gain.cancelScheduledValues(t);
      this.delayFeedbackGainL.gain.setValueAtTime(this.delayFeedbackGainL.gain.value, t);
      this.delayFeedbackGainL.gain.linearRampToValueAtTime(feedbackValue, rampTargetTime);
      this.delayFeedbackGainR.gain.cancelScheduledValues(t);
      this.delayFeedbackGainR.gain.setValueAtTime(this.delayFeedbackGainR.gain.value, t);
      this.delayFeedbackGainR.gain.linearRampToValueAtTime(feedbackValue, rampTargetTime);

      // Feedback Filters
      this.delayFeedbackFilterL.type = params.feedbackFilterType as BiquadFilterType;
      this.delayFeedbackFilterR.type = params.feedbackFilterType as BiquadFilterType;

      this.delayFeedbackFilterL.frequency.cancelScheduledValues(t);
      this.delayFeedbackFilterL.frequency.setValueAtTime(this.delayFeedbackFilterL.frequency.value, t);
      this.delayFeedbackFilterL.frequency.linearRampToValueAtTime(params.feedbackFilterFreq, rampTargetTime);
      this.delayFeedbackFilterL.Q.cancelScheduledValues(t);
      this.delayFeedbackFilterL.Q.setValueAtTime(this.delayFeedbackFilterL.Q.value, t);
      this.delayFeedbackFilterL.Q.linearRampToValueAtTime(params.feedbackFilterQ, rampTargetTime);

      this.delayFeedbackFilterR.frequency.cancelScheduledValues(t);
      this.delayFeedbackFilterR.frequency.setValueAtTime(this.delayFeedbackFilterR.frequency.value, t);
      this.delayFeedbackFilterR.frequency.linearRampToValueAtTime(params.feedbackFilterFreq, rampTargetTime);
      this.delayFeedbackFilterR.Q.cancelScheduledValues(t);
      this.delayFeedbackFilterR.Q.setValueAtTime(this.delayFeedbackFilterR.Q.value, t);
      this.delayFeedbackFilterR.Q.linearRampToValueAtTime(params.feedbackFilterQ, rampTargetTime);

      // Saturation
      this.setSaturationCurve(params.saturation);

      // Flutter
      this.flutterLfo.frequency.cancelScheduledValues(t);
      this.flutterLfo.frequency.setValueAtTime(this.flutterLfo.frequency.value, t);
      this.flutterLfo.frequency.linearRampToValueAtTime(params.flutterRate, rampTargetTime);
      
      // Flutter depth is the amplitude of LFO modulating delayTime.
      // Small values (e.g., 0.001 to 0.005s) are typical.
      const flutterModAmount = params.flutterDepth * 0.005; // Scale depth for subtle effect
      this.flutterLfoGainL.gain.cancelScheduledValues(t);
      this.flutterLfoGainL.gain.setValueAtTime(this.flutterLfoGainL.gain.value, t);
      this.flutterLfoGainL.gain.linearRampToValueAtTime(flutterModAmount, rampTargetTime);

      this.flutterLfoGainR.gain.cancelScheduledValues(t);
      this.flutterLfoGainR.gain.setValueAtTime(this.flutterLfoGainR.gain.value, t);
      // Slightly different flutter depth for R channel for stereo interest
      this.flutterLfoGainR.gain.linearRampToValueAtTime(flutterModAmount * 0.9, rampTargetTime); 
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
      this.inputNode, this.sendLevelGainNode, this.delayNodeL, this.delayFeedbackFilterL,
      this.delayFeedbackGainL, this.delayNodeR, this.delayFeedbackFilterR,
      this.delayFeedbackGainR, this.returnLevelGainNode, this.outputNode,
      this.saturationNodeL, this.saturationNodeR, this.flutterLfo, 
      this.flutterLfoGainL, this.flutterLfoGainR
    ];
    nodesToDisconnect.forEach(node => {
      try { node.disconnect(); } catch (e) {}
    });
    try {this.flutterLfo.stop()} catch(e) {}
  }
}
