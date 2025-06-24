
import { Waveform } from '../types';
import { WAVETABLE_DEFINITIONS } from '../constants'; // Phase 4

export function createCustomPeriodicWave(context: AudioContext, type: Waveform): PeriodicWave | null {
  let real: Float32Array;
  let imag: Float32Array;
  const length = 32; // Standard length for coefficients array (0 is DC offset)

  switch (type) {
    case Waveform.PULSE:
      real = new Float32Array(length); // All zeros for real part
      imag = new Float32Array(length);
      // Fourier series for a square wave (approximates pulse)
      for (let i = 1; i < length; i++) {
        if (i % 2 !== 0) { // Odd harmonics
          imag[i] = 4 / (i * Math.PI);
        } else {
          imag[i] = 0;
        }
      }
      return context.createPeriodicWave(real, imag, { disableNormalization: false });

    case Waveform.PHASOR: 
      real = new Float32Array(length);
      imag = new Float32Array(length);
      for (let i = 1; i < length; i++) {
        imag[i] = 2 / (i * Math.PI) * (i % 2 === 0 ? -1 : 1); 
      }
      return context.createPeriodicWave(real, imag, { disableNormalization: false });
    
    case Waveform.HARMONICS: 
        real = new Float32Array(length);
        imag = new Float32Array(length);
        for (let i = 1; i < length; i++) {
            if (i % 2 !== 0) { 
                imag[i] = 1 / i;
            }
        }
        return context.createPeriodicWave(real, imag, { disableNormalization: false });

    default:
      // For SINE, SQUARE, SAWTOOTH, TRIANGLE, WAVETABLE, SAMPLE_HOLD, RANDOM_SMOOTH, these are either native types
      // or handled differently (e.g., LFO custom shapes, wavetable logic).
      // This function is specifically for generating PeriodicWave for custom oscillator shapes.
      return null;
  }
}

export type PeriodicWaveStore = {
  [key in Waveform]?: PeriodicWave;
};

export function createAllPeriodicWaves(context: AudioContext): PeriodicWaveStore {
    const store: PeriodicWaveStore = {};
    const customWaveTypes = [Waveform.PULSE, Waveform.PHASOR, Waveform.HARMONICS];
    for (const type of customWaveTypes) {
        const wave = createCustomPeriodicWave(context, type);
        if (wave) {
            store[type] = wave;
        }
    }
    return store;
}

export class PeriodicWaveUtils {
  public static applyWaveformToNode(
    audioContext: AudioContext,
    osc: OscillatorNode,
    waveform: Waveform,
    periodicWaves: PeriodicWaveStore,
    // Phase 4: Added for conceptual wavetable
    wavetableId?: string, 
    wavetablePosition?: number 
  ): void {
    let finalWaveform = waveform;

    if (waveform === Waveform.WAVETABLE && wavetableId && wavetablePosition !== undefined) {
      const tableDefinition = WAVETABLE_DEFINITIONS[wavetableId];
      if (tableDefinition && tableDefinition.length > 0) {
        const rowIndex = Math.min(tableDefinition.length - 1, Math.floor(wavetablePosition * tableDefinition.length));
        const selectedRow = tableDefinition[rowIndex];
        if (selectedRow && selectedRow.length > 0) {
          finalWaveform = selectedRow[0]; // Pick the first waveform from the selected row
        } else {
          console.warn(`Wavetable ${wavetableId}, row ${rowIndex} is empty. Defaulting to sine.`);
          finalWaveform = Waveform.SINE;
        }
      } else {
        console.warn(`Wavetable ID ${wavetableId} not found or empty. Defaulting to sine.`);
        finalWaveform = Waveform.SINE;
      }
    }

    if (finalWaveform === Waveform.PULSE || finalWaveform === Waveform.PHASOR || finalWaveform === Waveform.HARMONICS) {
      let wave = periodicWaves[finalWaveform];
      if (!wave) {
          const tempWave = createCustomPeriodicWave(audioContext, finalWaveform);
          if (tempWave) {
            wave = tempWave;
          }
      }
      if (wave) {
        osc.setPeriodicWave(wave);
      } else {
        console.warn(`PeriodicWave ${finalWaveform} not found or creatable, defaulting to sine.`);
        osc.type = 'sine';
      }
    } else if (finalWaveform === Waveform.SINE || finalWaveform === Waveform.SQUARE || finalWaveform === Waveform.SAWTOOTH || finalWaveform === Waveform.TRIANGLE) {
      osc.type = finalWaveform as OscillatorType;
    } else {
      // For LFO custom shapes like SAMPLE_HOLD, RANDOM_SMOOTH, or if WAVETABLE didn't resolve,
      // the OscillatorNode type isn't set here. Voice.ts handles these custom LFO behaviors.
      // If it's an oscillator and not a special LFO shape, default.
      if (osc.detune) { // Heuristic: if it has detune, it's likely a main oscillator
        console.warn(`Unsupported waveform ${finalWaveform} for direct OscillatorNode type, defaulting to sine.`);
        osc.type = 'sine';
      }
    }
  }
}
