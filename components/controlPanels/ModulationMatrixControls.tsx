
import React, { useCallback } from 'react';
import { ModMatrixParams, ModMatrixSlot, ModSource, ModDestination } from '../../types';
import { Slider } from '../ui/Slider';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { MOD_SOURCE_OPTIONS, MOD_DESTINATION_OPTIONS } from '../../constants';

interface ModulationMatrixControlsProps {
  params: ModMatrixParams;
  onChange: (newParams: ModMatrixParams) => void;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const ModulationMatrixControls: React.FC<ModulationMatrixControlsProps> = React.memo(({ 
  params, onChange,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
 }) => {
  
  const handleGlobalEnableChange = useCallback((isEnabled: boolean) => {
    onChange({ ...params, isEnabled });
  }, [onChange, params]);

  const handleSlotChange = useCallback((slotIndex: number, field: keyof ModMatrixSlot, value: any) => {
    const newSlots = [...params.slots];
    const slotToUpdate = { ...newSlots[slotIndex] };

    if (field === 'amount') {
      slotToUpdate.amount = parseFloat(value as string);
    } else if (field === 'isEnabled') {
      slotToUpdate.isEnabled = value as boolean;
    } else if (field === 'source') {
      slotToUpdate.source = value as ModSource;
    } else if (field === 'destination') {
      slotToUpdate.destination = value as ModDestination;
    }
    
    newSlots[slotIndex] = slotToUpdate;
    onChange({ ...params, slots: newSlots });
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="mod-matrix-enable"
        label="Enable Modulation Matrix"
        checked={params.isEnabled}
        onChange={(e) => handleGlobalEnableChange(e.target.checked)}
        className="mb-3"
        tooltip="Toggles the entire Modulation Matrix on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset 
        className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        aria-disabled={!params.isEnabled}
      >
        {!params.isEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">MATRIX DISABLED</span>
          </div>
        )}
        {params.slots.map((slot, index) => (
          <div 
            key={index} 
            className="relative p-3 border border-gray-700 rounded-md bg-gray-800 bg-opacity-40 space-y-3"
            onMouseEnter={() => onSetHelpText && onSetHelpText(`Modulation Slot ${index + 1}: Configure a source to control a destination parameter.`)}
            onMouseLeave={() => onClearHelpText && onClearHelpText()}
          >
            <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-gray-400 uppercase">SLOT {index + 1}</p>
                <Switch
                    id={`mod-slot-enable-${index}`}
                    label="Active"
                    checked={slot.isEnabled}
                    onChange={(e) => handleSlotChange(index, 'isEnabled', e.target.checked)}
                    tooltip={`Enable or disable this specific modulation slot ${index + 1}.`}
                    onSetHelpText={onSetHelpText}
                    onClearHelpText={onClearHelpText}
                />
            </div>
            <fieldset 
              className={`relative space-y-3 transition-opacity duration-300 ${slot.isEnabled ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}
              aria-disabled={!slot.isEnabled}
            >
              {!slot.isEnabled && params.isEnabled && ( 
                <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center rounded-md z-10 backdrop-blur-xs">
                  <span className="text-gray-500 font-semibold text-sm px-3 py-1 bg-gray-700 rounded border border-gray-600 select-none">SLOT INACTIVE</span>
                </div>
              )}
              <Select
                id={`mod-source-${index}`}
                label="Source"
                options={MOD_SOURCE_OPTIONS}
                value={slot.source}
                onChange={(e) => handleSlotChange(index, 'source', e.target.value)}
                tooltip="Modulation Source: The signal that will control the destination (e.g., LFO, Envelope)."
                onSetHelpText={onSetHelpText}
                onClearHelpText={onClearHelpText}
              />
              <Select
                id={`mod-destination-${index}`}
                label="Destination"
                options={MOD_DESTINATION_OPTIONS}
                value={slot.destination}
                onChange={(e) => handleSlotChange(index, 'destination', e.target.value)}
                tooltip="Modulation Destination: The parameter that will be controlled by the source."
                onSetHelpText={onSetHelpText}
                onClearHelpText={onClearHelpText}
              />
              <Slider
                id={`mod-amount-${index}`}
                label="Amount"
                min={-1.0}
                max={1.0}
                step={0.01}
                value={slot.amount}
                onChange={(e) => handleSlotChange(index, 'amount', e.target.value)}
                paramId={`modMatrix.slots[${index}].amount`}
                onRequestLearn={onRequestLearn}
                isLearning={paramIdToLearn === `modMatrix.slots[${index}].amount`}
                tooltip="Modulation Amount: Strength and direction of the modulation. Negative values invert the source."
                modulatedParamIds={modulatedParamIds} 
                onSetHelpText={onSetHelpText}
                onClearHelpText={onClearHelpText}
                globalMidiLearnActive={globalMidiLearnActive}
              />
            </fieldset>
          </div>
        ))}
      </fieldset>
    </div>
  );
});
