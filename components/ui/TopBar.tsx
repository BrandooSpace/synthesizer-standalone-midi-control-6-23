import React from 'react';
import { Button } from './Button';
import { MenuIcon } from '../icons/MenuIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { KeyboardIcon } from '../icons/KeyboardIcon';
import { KeyboardHiddenIcon } from '../icons/KeyboardHiddenIcon';
import { MidiIcon } from '../icons/MidiIcon';
import { CogIcon } from '../icons/CogIcon'; // Still used for general settings
import { LinkIcon } from '../icons/LinkIcon'; // New icon for MIDI Learn
import { GlobalClipIndicatorUI } from './GlobalClipIndicatorUI';
import { Select } from './Select'; 
import { PREDEFINED_SIDEBAR_LAYOUTS } from '../../constants'; 

interface TopBarProps {
  isSidebarVisible: boolean; 
  toggleSidebar: () => void;
  isKeyboardVisible: boolean;
  toggleKeyboard: () => void;
  onOpenMidiSettings: () => void; 
  isMidiSystemReady: boolean; 
  midiLearnActive: boolean;
  toggleMidiLearnMode: () => void;
  globalClipActive: boolean;
  currentPresetName: string;
  isPresetDirty: boolean;
  showMidiLearnBanner: boolean;
  specificParamLearnActive: boolean; 
  midiLearnTargetDeviceName: string | null; 
  onDismissMidiLearnBanner: () => void;
  sidebarLayoutOptions: { value: string; label: string }[]; 
  onApplySidebarLayout: (layoutKey: string) => void; 
  onToggleSettingsModal: () => void; 
}

export const TopBar: React.FC<TopBarProps> = ({
  isSidebarVisible,
  toggleSidebar,
  isKeyboardVisible,
  toggleKeyboard,
  onOpenMidiSettings,
  isMidiSystemReady,
  midiLearnActive,
  toggleMidiLearnMode,
  globalClipActive,
  currentPresetName,
  isPresetDirty,
  showMidiLearnBanner,
  specificParamLearnActive,
  midiLearnTargetDeviceName,
  onDismissMidiLearnBanner,
  sidebarLayoutOptions, 
  onApplySidebarLayout, 
  onToggleSettingsModal, 
}) => {
  const commonButtonClass = "transition-all duration-200 ease-in-out p-2";
  const iconSizeClass = "h-5 w-5"; 

  let midiLearnBannerText = "MIDI Learn Active: Click 'Learn' on a control, then move your MIDI controller.";
  if (midiLearnTargetDeviceName) {
    midiLearnBannerText = `MIDI Learn: Listening for CC on "${midiLearnTargetDeviceName}"...`;
  } else if (midiLearnActive && !specificParamLearnActive) {
    midiLearnBannerText = "MIDI Learn Active (Global): Move a CC on any enabled Control Surface or Keyboard to map it if a parameter is in 'Learn' mode.";
  }


  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg border-b border-gray-700 shadow-lg z-40 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarVisible ? "Hide sidebars" : "Show sidebars"}
          className={`${commonButtonClass}`}
          title={isSidebarVisible ? "Hide Sidebars" : "Show Sidebars"}
        >
          {isSidebarVisible ? <CloseIcon className={`text-red-400 ${iconSizeClass}`} /> : <MenuIcon className={iconSizeClass} />}
        </Button>
        <Button
          variant="toggle"
          onClick={toggleKeyboard}
          aria-label={isKeyboardVisible ? "Hide keyboard" : "Show keyboard"}
          className={`${commonButtonClass}`}
           title={isKeyboardVisible ? "Hide Virtual Keyboard" : "Show Virtual Keyboard"}
        >
          {isKeyboardVisible ? <KeyboardHiddenIcon className={`text-red-400 ${iconSizeClass}`} /> : <KeyboardIcon className={iconSizeClass} />}
        </Button>
         <div className="h-6 w-px bg-gray-700 mx-1"></div> 
        <Button 
          variant="toggle"
          onClick={onOpenMidiSettings}
          aria-label="Configure MIDI Devices"
          className={`${commonButtonClass}`}
          title="Configure MIDI Devices"
        >
          <MidiIcon className={`${iconSizeClass} ${isMidiSystemReady ? 'text-green-400' : 'text-gray-400'}`} />
        </Button>
        <Button
          variant="toggle"
          onClick={toggleMidiLearnMode}
          aria-label={midiLearnActive ? "Cancel MIDI Learn" : "Activate MIDI Learn"}
          className={`${commonButtonClass} ${midiLearnActive && !specificParamLearnActive ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400 shadow-lg animate-pulse' : 'hover:bg-gray-600'}`}
          title={midiLearnActive ? "Deactivate MIDI Learn Mode" : "Activate MIDI Learn Mode (Global)"}
        >
          <LinkIcon className={`${iconSizeClass} ${midiLearnActive && !specificParamLearnActive ? 'text-white' : 'text-gray-300'}`} />
        </Button>
         <Button 
          variant="toggle"
          onClick={onToggleSettingsModal} 
          aria-label="Open settings"
          className={`${commonButtonClass} hover:bg-gray-600`}
          title="Open Synthesizer Settings"
        >
          <CogIcon className={`${iconSizeClass} text-gray-300`} /> 
        </Button>
        <div className="h-6 w-px bg-gray-700 mx-1"></div>
        <div className="w-40"> 
            <Select
                id="sidebar-focus-set"
                label="" 
                options={sidebarLayoutOptions}
                value={''} 
                onChange={(e) => onApplySidebarLayout(e.target.value)}
                className="text-xs h-8 py-1" 
                tooltip="Select Sidebar Focus Set"
            />
        </div>
      </div>

      <div className="flex-grow text-center">
        {showMidiLearnBanner && !specificParamLearnActive && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-auto max-w-md px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md shadow-lg flex items-center justify-between z-50 animate-pulse">
            <span>{midiLearnBannerText}</span>
            <button onClick={onDismissMidiLearnBanner} className="ml-2 text-blue-200 hover:text-white" aria-label="Dismiss MIDI Learn banner">&times;</button>
          </div>
        )}
         {specificParamLearnActive && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-auto max-w-lg px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md shadow-lg z-50">
            <span>{`Learning MIDI CC for parameter... Move controller on ${midiLearnTargetDeviceName || 'assigned device'} now.`}</span>
          </div>
        )}
      </div>


      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-300 font-orbitron truncate max-w-[150px] sm:max-w-[250px]" title={currentPresetName}>
          {currentPresetName}
          {isPresetDirty && <span className="text-red-400 font-bold">*</span>}
        </span>
        <GlobalClipIndicatorUI isActive={globalClipActive} className={iconSizeClass} />
      </div>
    </div>
  );
};
