
import React from 'react';
import { DetectedMidiDevice, MidiDeviceRole, MidiDeviceAssignments } from '../../types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface MidiDeviceSettingsProps {
  detectedMidiInputs: DetectedMidiDevice[];
  midiDeviceAssignments: MidiDeviceAssignments;
  onUpdateMidiDeviceAssignment: (deviceId: string, role: MidiDeviceRole) => void;
  onRefreshMidiDevices: () => void;
  isMidiSystemInitialized: boolean;
}

export const MidiDeviceSettings: React.FC<MidiDeviceSettingsProps> = ({
  detectedMidiInputs,
  midiDeviceAssignments,
  onUpdateMidiDeviceAssignment,
  onRefreshMidiDevices,
  isMidiSystemInitialized,
}) => {
  const roleOptions = [
    { value: MidiDeviceRole.UNASSIGNED, label: 'Unassigned' },
    { value: MidiDeviceRole.KEYBOARD, label: 'Keyboard Input' },
    { value: MidiDeviceRole.CONTROL_SURFACE, label: 'Control Surface' },
  ];

  return (
    <div className="space-y-4 text-gray-300">
      {!isMidiSystemInitialized && (
        <p className="text-sm text-yellow-400">MIDI system not initialized. Please enable MIDI from the top bar first.</p>
      )}

      <Button onClick={onRefreshMidiDevices} variant="secondary" disabled={!isMidiSystemInitialized}>
        Refresh MIDI Device List
      </Button>

      {detectedMidiInputs.length === 0 && isMidiSystemInitialized && (
        <p className="text-sm text-gray-400">No MIDI input devices detected.</p>
      )}

      {detectedMidiInputs.map((device) => (
        <div key={device.id} className="p-3 bg-gray-700 rounded-md border border-gray-600">
          <p className="text-md font-semibold text-gray-100 mb-1 truncate" title={device.name}>
            {device.name || `Unknown Device (ID: ${device.id.substring(0,10)}...)`}
          </p>
          {device.manufacturer && <p className="text-xs text-gray-400 mb-2">Manufacturer: {device.manufacturer}</p>}
          <Select
            id={`midi-role-${device.id}`}
            label="Assign Role:"
            options={roleOptions}
            value={midiDeviceAssignments[device.id] || MidiDeviceRole.UNASSIGNED}
            onChange={(e) => onUpdateMidiDeviceAssignment(device.id, e.target.value as MidiDeviceRole)}
            disabled={!isMidiSystemInitialized}
          />
        </div>
      ))}
    </div>
  );
};
