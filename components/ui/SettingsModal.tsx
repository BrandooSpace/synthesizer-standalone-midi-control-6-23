
import React, { useState } from 'react';
import { CloseIcon } from '../icons/CloseIcon';
import { Button } from './Button';
import { AboutSettings } from '../settings/AboutSettings'; 
import { AudioSettings } from '../settings/AudioSettings';
import { MidiDeviceSettings } from '../settings/MidiDeviceSettings'; // New import
import { DetectedMidiDevice, MidiDeviceRole, MidiDeviceAssignments } from '../../types'; // New import

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Audio Settings Props
  masterVolumeTrimDb: number;
  onMasterVolumeTrimDbChange: (newTrimDb: number) => void;
  currentSampleRate: number;
  isMasterLimiterEnabled: boolean;
  onToggleMasterLimiter: () => void;
  limiterThresholdDb: number;
  onLimiterThresholdDbChange: (newThresholdDb: number) => void;
  // MIDI Settings Props
  detectedMidiInputs: DetectedMidiDevice[];
  midiDeviceAssignments: MidiDeviceAssignments;
  onUpdateMidiDeviceAssignment: (deviceId: string, role: MidiDeviceRole) => void;
  onRefreshMidiDevices: () => void;
  isMidiSystemInitialized: boolean; // To enable/disable MIDI settings UI elements
}

type SettingsTab = 'about' | 'audio' | 'midi';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  masterVolumeTrimDb,
  onMasterVolumeTrimDbChange,
  currentSampleRate,
  isMasterLimiterEnabled,
  onToggleMasterLimiter,
  limiterThresholdDb,
  onLimiterThresholdDbChange,
  detectedMidiInputs,
  midiDeviceAssignments,
  onUpdateMidiDeviceAssignment,
  onRefreshMidiDevices,
  isMidiSystemInitialized,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('about');

  if (!isOpen) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutSettings />;
      case 'audio':
        return (
          <AudioSettings
            masterVolumeTrimDb={masterVolumeTrimDb}
            onMasterVolumeTrimDbChange={onMasterVolumeTrimDbChange}
            currentSampleRate={currentSampleRate}
            isMasterLimiterEnabled={isMasterLimiterEnabled}
            onToggleMasterLimiter={onToggleMasterLimiter}
            limiterThresholdDb={limiterThresholdDb}
            onLimiterThresholdDbChange={onLimiterThresholdDbChange}
          />
        );
      case 'midi':
        return (
          <MidiDeviceSettings
            detectedMidiInputs={detectedMidiInputs}
            midiDeviceAssignments={midiDeviceAssignments}
            onUpdateMidiDeviceAssignment={onUpdateMidiDeviceAssignment}
            onRefreshMidiDevices={onRefreshMidiDevices}
            isMidiSystemInitialized={isMidiSystemInitialized}
          />
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: SettingsTab, label: string}> = ({tab, label}) => (
    <Button
        variant="toggle"
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-1.5 text-sm rounded-md ${activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        aria-pressed={activeTab === tab}
    >
        {label}
    </Button>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose} 
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-700"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="settings-modal-title" className="font-orbitron text-xl text-green-400">
            SETTINGS
          </h2>
          <Button
            variant="secondary"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Close settings"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </header>
        <nav className="flex space-x-2 p-3 bg-gray-850 border-b border-gray-700">
            <TabButton tab="about" label="About" />
            <TabButton tab="audio" label="Audio" />
            <TabButton tab="midi" label="MIDI Devices" />
        </nav>
        <main className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};
