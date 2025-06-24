
import React from 'react';
import { Slider } from '../ui/Slider';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch'; // Import Switch

interface AudioSettingsProps {
  masterVolumeTrimDb: number;
  onMasterVolumeTrimDbChange: (newTrimDb: number) => void;
  currentSampleRate: number;
  isMasterLimiterEnabled: boolean;
  onToggleMasterLimiter: () => void;
  limiterThresholdDb: number;
  onLimiterThresholdDbChange: (newThresholdDb: number) => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  masterVolumeTrimDb,
  onMasterVolumeTrimDbChange,
  currentSampleRate,
  isMasterLimiterEnabled,
  onToggleMasterLimiter,
  limiterThresholdDb,
  onLimiterThresholdDbChange,
}) => {
  const outputDeviceOptions = [
    { value: 'default', label: 'Default System Output (Not Selectable)' },
    // Future: Populate with actual devices if API allows
  ];

  return (
    <div className="space-y-4 text-gray-300">
      <Select
        id="audio-output-device"
        label="AUDIO OUTPUT DEVICE"
        options={outputDeviceOptions}
        value="default"
        onChange={() => {}} // Non-functional for now
        className="opacity-50 pointer-events-none" // Visually indicate non-functionality
        tooltip="Select your audio output device (browser/OS support for this feature varies and is often limited)."
      />

      <Slider
        id="master-volume-trim"
        label="MASTER VOLUME TRIM (dB)"
        min={-12}
        max={6}
        step={0.5}
        value={masterVolumeTrimDb}
        onChange={(e) => onMasterVolumeTrimDbChange(parseFloat(e.target.value))}
        tooltip="Fine-tunes the global output volume of the synthesizer after the main mixer."
      />
      
      <div className="p-2 border border-gray-600 rounded-md bg-gray-700 bg-opacity-50 space-y-3">
        <Switch
            id="master-limiter-enable"
            label="Enable Master Limiter"
            checked={isMasterLimiterEnabled}
            onChange={onToggleMasterLimiter}
            tooltip="Toggles the master output limiter on/off. Prevents digital clipping."
        />
        <fieldset className={`transition-opacity duration-300 ${isMasterLimiterEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <Slider
                id="limiter-threshold"
                label="LIMITER THRESHOLD (dBFS)"
                min={-24}
                max={0}
                step={0.5}
                value={limiterThresholdDb}
                onChange={(e) => onLimiterThresholdDbChange(parseFloat(e.target.value))}
                className="mt-2"
                tooltip="Sets the level at which the limiter begins to reduce gain. Only active if Master Limiter is enabled."
                // No paramId/onRequestLearn for settings for now
            />
        </fieldset>
      </div>


      <div 
        className="p-3 bg-gray-700 rounded-md border border-gray-600"
        title="The audio sample rate currently used by the synthesizer's audio context."
      >
        <p className="text-sm text-gray-300">
          Current Sample Rate: <span className="font-mono text-green-400">{currentSampleRate > 0 ? currentSampleRate : 'N/A'} Hz</span>
        </p>
      </div>
    </div>
  );
};
