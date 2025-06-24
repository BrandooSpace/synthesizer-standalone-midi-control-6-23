
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SynthPreset } from '../../types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DEFAULT_PRESET_NAME } from '../../constants';

interface PresetControlsProps {
  presets: SynthPreset[];
  currentPresetName: string;
  isPresetDirty: boolean; 
  onSave: (name: string) => void;
  onLoad: (preset: SynthPreset) => void;
  onDelete: (name: string) => void;
  onInitialize: () => void;
  onCurrentNameChange: (name: string) => void; 
}

export const PresetControls: React.FC<PresetControlsProps> = React.memo(({
  presets,
  currentPresetName,
  isPresetDirty,
  onSave,
  onLoad,
  onDelete,
  onInitialize,
  onCurrentNameChange,
}) => {
  const [selectedPresetToLoad, setSelectedPresetToLoad] = useState<string>('');
  const [presetNameToSave, setPresetNameToSave] = useState<string>(currentPresetName);
  const presetNameInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    if (presets.length > 0 && !presets.find(p => p.name === selectedPresetToLoad)) {
      setSelectedPresetToLoad(presets[0].name);
    } else if (presets.length === 0) {
      setSelectedPresetToLoad('');
    }
  }, [presets, selectedPresetToLoad]);

  useEffect(() => {
    setPresetNameToSave(currentPresetName);
  }, [currentPresetName]);


  const handleSaveClick = useCallback(() => {
    if (presetNameToSave.trim()) {
      onSave(presetNameToSave.trim());
    } else {
      alert("Preset name cannot be empty.");
    }
  }, [presetNameToSave, onSave]);

  const handleLoadClick = useCallback(() => {
    const presetToLoad = presets.find(p => p.name === selectedPresetToLoad);
    if (presetToLoad) {
      onLoad(presetToLoad);
      onCurrentNameChange(presetToLoad.name); 
      setTimeout(() => { 
        presetNameInputRef.current?.focus();
        presetNameInputRef.current?.select();
      }, 0);
    }
  }, [presets, selectedPresetToLoad, onLoad, onCurrentNameChange]);

  const handleDeleteClick = useCallback(() => {
    if (selectedPresetToLoad && window.confirm(`Are you sure you want to delete preset "${selectedPresetToLoad}"?`)) {
      onDelete(selectedPresetToLoad);
      if (presetNameToSave === selectedPresetToLoad) {
        setPresetNameToSave(DEFAULT_PRESET_NAME);
        onCurrentNameChange(DEFAULT_PRESET_NAME);
      }
    }
  }, [selectedPresetToLoad, onDelete, presetNameToSave, onCurrentNameChange]);

  const presetOptions = presets.map(p => ({ value: p.name, label: p.name }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase text-center">Preset Management</h3>
      
      <div className="flex flex-col space-y-2">
        <label htmlFor="preset-name-input" className="text-xs text-gray-300">
          Preset Name: {isPresetDirty && <span className="text-red-400 font-bold">*</span>}
        </label>
        <input
          ref={presetNameInputRef} 
          id="preset-name-input"
          type="text"
          value={presetNameToSave}
          onChange={(e) => {
            setPresetNameToSave(e.target.value);
            onCurrentNameChange(e.target.value); 
          }}
          placeholder="Enter preset name"
          className="bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 text-sm focus-visible:ring-green-500 focus-visible:border-green-500"
        />
        <Button onClick={handleSaveClick} variant="primary" className="w-full">
          Save Current
        </Button>
      </div>

      {presets.length > 0 && (
        <div className="pt-3 border-t border-gray-700 mt-3 space-y-2">
          <Select
            id="preset-load-select"
            label="Load Preset:"
            options={presetOptions}
            value={selectedPresetToLoad}
            onChange={(e) => setSelectedPresetToLoad(e.target.value)}
          />
          <div className="flex gap-x-2">
            <Button onClick={handleLoadClick} variant="secondary" className="flex-grow">
              Load Selected
            </Button>
            <Button onClick={handleDeleteClick} variant="secondary" className="bg-red-700 hover:bg-red-600 text-white">
              Delete
            </Button>
          </div>
        </div>
      )}
      {presets.length === 0 && (
         <p className="text-xs text-gray-500 text-center italic mt-2">No saved presets yet.</p>
      )}

      <div className="pt-3 border-t border-gray-700 mt-3">
        <Button onClick={onInitialize} variant="secondary" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black">
          Initialize to Default Settings
        </Button>
      </div>
    </div>
  );
});
