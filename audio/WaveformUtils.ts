import { Waveform } from '../types';

const NUM_COEFFICIENTS = 32; // Standard length for coefficients array (0 is DC offset)
const DEFAULT_TABLE_SIZE = 2048; // Default size for generated sample tables

export class WaveformUtils {
  public static getCoefficients(waveformType: Waveform): { real: Float32Array, imag: Float32Array } {
    const real = new Float32Array(NUM_COEFFICIENTS); 
    const imag = new Float32Array(NUM_COEFFICIENTS); 

    switch (waveformType) {
      case Waveform.SINE:
        imag[1] = 1; 
        break;
      case Waveform.SQUARE:
        for (let i = 1; i < NUM_COEFFICIENTS; i += 2) { 
          imag[i] = 4 / (i * Math.PI);
        }
        break;
      case Waveform.SAWTOOTH:
        for (let i = 1; i < NUM_COEFFICIENTS; i++) {
          imag[i] = (2 / (i * Math.PI)) * ((i % 2 !== 0) ? 1 : -1);
        }
        break;
      case Waveform.TRIANGLE:
        for (let i = 1; i < NUM_COEFFICIENTS; i += 2) { 
          imag[i] = (8 / (Math.PI * Math.PI * i * i)) * (((i - 1) / 2) % 2 === 0 ? 1 : -1);
        }
        break;
      case Waveform.PULSE: 
        for (let i = 1; i < NUM_COEFFICIENTS; i += 2) {
          imag[i] = 4 / (i * Math.PI);
        }
        break;
      case Waveform.PHASOR: 
        for (let i = 1; i < NUM_COEFFICIENTS; i++) {
          imag[i] = (2 / (i * Math.PI)) * (i % 2 === 0 ? -1 : 1);
        }
        break;
      case Waveform.HARMONICS: 
        for (let i = 1; i < NUM_COEFFICIENTS; i += 2) { 
            imag[i] = 1 / i;
        }
        break;
      default:
        console.warn(`WaveformUtils.getCoefficients: Unsupported waveform type ${waveformType}, defaulting to SINE.`);
        imag[1] = 1; 
        break;
    }
    return { real, imag };
  }

  public static getSamples(waveformType: Waveform, tableSize: number = DEFAULT_TABLE_SIZE): Float32Array {
    const { real, imag } = this.getCoefficients(waveformType);
    const samples = new Float32Array(tableSize);
    let maxValue = 0;

    for (let i = 0; i < tableSize; i++) {
      const time = i / tableSize; // Normalized time (0 to 1 for one cycle)
      let sampleVal = 0;
      for (let h = 1; h < NUM_COEFFICIENTS; h++) { // Start from 1, skip DC offset
        if (real[h] !== 0 || imag[h] !== 0) {
            sampleVal += real[h] * Math.cos(2 * Math.PI * h * time);
            sampleVal += imag[h] * Math.sin(2 * Math.PI * h * time);
        }
      }
      samples[i] = sampleVal;
      if (Math.abs(sampleVal) > maxValue) {
        maxValue = Math.abs(sampleVal);
      }
    }

    // Normalize the waveform to peak at +/- 1.0 if maxValue is not zero
    if (maxValue > 1e-6) { // Avoid division by zero or tiny numbers
      for (let i = 0; i < tableSize; i++) {
        samples[i] /= maxValue;
      }
    }
    return samples;
  }
}