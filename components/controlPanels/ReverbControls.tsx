
import React, { useState, useCallback, useEffect } from 'react';
import { ReverbParams, SendMode } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { SEND_MODE_OPTIONS, BUILT_IN_IRS, DEFAULT_REVERB_PARAMS } from '../../constants';
import { PeakMeter } from '../ui/PeakMeter';

interface ReverbControlsProps {
  params: ReverbParams;
  onChange: (newParams: ReverbParams) => void;
  reverbSendInputAnalyser: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const ReverbControls: React.FC<ReverbControlsProps> = React.memo(({ 
  params, onChange, reverbSendInputAnalyser,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
}) => {
  const [localCustomIrName, setLocalCustomIrName] = useState<string>(params.customIrName || "No custom IR loaded");

  const handleChange = useCallback((field: keyof ReverbParams, value: string | number | boolean | SendMode | AudioBuffer | null) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams as ReverbParams);
  }, [onChange, params]);

  const handleIrFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLocalCustomIrName(`Loading: ${file.name}...`);
      if (onSetHelpText) onSetHelpText(`Loading Impulse Response: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close(); 

        onChange({
          ...params,
          irUrl: 'custom_loaded_ir', 
          customIrBuffer: decodedBuffer,
          customIrName: file.name, 
        });
        setLocalCustomIrName(file.name);
        if (onSetHelpText) onSetHelpText(`Loaded Custom IR: ${file.name}. This is the acoustic fingerprint used for reverb.`);
      } catch (error) {
        console.error("Error loading or decoding IR file:", error);
        alert(`Failed to load IR: ${error instanceof Error ? error.message : String(error)}`);
        setLocalCustomIrName("Failed to load IR");
        if (onSetHelpText) onSetHelpText("Failed to load Impulse Response file.");
        const defaultIr = BUILT_IN_IRS.find(ir => ir.url === DEFAULT_REVERB_PARAMS.irUrl) || BUILT_IN_IRS[0];
        onChange({
            ...params,
            irUrl: defaultIr.url,
            customIrBuffer: null,
            customIrName: '',
        });
      }
    }
  }, [onChange, params, onSetHelpText]);

  const irOptions = BUILT_IN_IRS.map(ir => ({ value: ir.url, label: ir.name }));
  
  useEffect(() => {
    if (params.irUrl === 'custom_loaded_ir' && params.customIrName) {
      setLocalCustomIrName(params.customIrName);
    } else if (params.irUrl !== 'custom_loaded_ir') {
      const builtIn = BUILT_IN_IRS.find(ir => ir.url === params.irUrl);
      setLocalCustomIrName(builtIn ? builtIn.name : "No custom IR loaded");
    }
  }, [params.irUrl, params.customIrName]);


  return (
    <div className="space-y-4">
      <Switch
        id="reverb-enable-toggle"
        label="Enable Reverb"
        checked={params.isReverbEnabled}
        onChange={(e) => handleChange('isReverbEnabled', e.target.checked)}
        tooltip="Toggles the convolution reverb effect on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isReverbEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isReverbEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        
        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase text-center mb-1">Send / Return</h4>
          <Slider
            id="reverbSendLevel"
            label="SEND LEVEL"
            min={0}
            max={1}
            step={0.01}
            value={params.sendLevel}
            onChange={(e) => handleChange('sendLevel', e.target.value)}
            paramId="reverb.sendLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "reverb.sendLevel"}
            tooltip="Amount of signal sent to the reverb effect from the main audio path."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <PeakMeter
            analyserNode={reverbSendInputAnalyser}
            title="Send Input Level"
            minDb={-48}
            maxDb={6}
            className="mt-2 mx-auto"
          />
          <Select
            id="reverbSendMode"
            label="SEND MODE"
            options={SEND_MODE_OPTIONS}
            value={params.sendMode}
            onChange={(e) => handleChange('sendMode', e.target.value as SendMode)}
            tooltip="Determines if the reverb send is tapped before (Pre-Fader) or after (Post-Fader) the main voice/insert chain output."
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
          />
          <Slider
            id="reverbReturnLevel"
            label="RETURN LEVEL"
            min={0}
            max={1.5} 
            step={0.01}
            value={params.returnLevel}
            onChange={(e) => handleChange('returnLevel', e.target.value)}
            paramId="reverb.returnLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "reverb.returnLevel"}
            tooltip="Overall volume of the processed reverb signal mixed back into the main output."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        <div 
          className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3"
          onMouseEnter={() => onSetHelpText && onSetHelpText("Impulse Response (IR) selection for reverb character. Load a WAV file for custom IRs.")}
          onMouseLeave={() => onClearHelpText && onClearHelpText()}
        >
            <h4 className="text-xs font-semibold text-gray-400 uppercase text-center mb-1">Impulse Response</h4>
            <Select
              id="reverbIrSelector"
              label="IR SELECTION"
              options={irOptions}
              value={params.irUrl}
              onChange={(e) => {
                  const selectedIrUrl = e.target.value;
                  onChange({
                      ...params,
                      irUrl: selectedIrUrl,
                      customIrBuffer: selectedIrUrl === 'custom_loaded_ir' ? params.customIrBuffer : null,
                      customIrName: selectedIrUrl === 'custom_loaded_ir' ? params.customIrName : '',
                  });
              }}
              tooltip="Selects the impulse response (acoustic fingerprint) for the reverb character. Use 'Custom' to load your own WAV."
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
            />
            <div 
              className="flex flex-col items-center"
              onMouseEnter={() => onSetHelpText && onSetHelpText("Load a custom Impulse Response WAV file. This audio file defines the reverb's sound.")}
              onMouseLeave={() => onClearHelpText && onClearHelpText()}
            >
                <label htmlFor="ir-file-input" className="text-sm text-gray-300 mb-1">Load Custom IR (.wav):</label>
                <input 
                    type="file" 
                    id="ir-file-input"
                    accept=".wav,.aiff,.flac,.mp3" 
                    onChange={handleIrFileChange}
                    className="text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-gray-600 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 w-full"
                />
                {params.irUrl === 'custom_loaded_ir' && params.customIrName && (
                     <p className="text-xs text-green-400 mt-1 truncate w-full text-center" title={params.customIrName}>{params.customIrName}</p>
                )}
                 {params.irUrl === 'custom_loaded_ir' && !params.customIrName && (
                     <p className="text-xs text-yellow-400 mt-1 truncate w-full text-center">Custom IR (No Name)</p>
                )}
            </div>
        </div>
        
        <Slider
          id="reverbPreDelay"
          label="PRE-DELAY (s)"
          min={0}
          max={0.5} 
          step={0.001}
          value={params.preDelayTime}
          onChange={(e) => handleChange('preDelayTime', e.target.value)}
          paramId="reverb.preDelayTime"
          onRequestLearn={onRequestLearn}
          isLearning={paramIdToLearn === "reverb.preDelayTime"}
          tooltip="Initial delay before the reverberant sound begins. Adds a sense of distance."
          modulatedParamIds={modulatedParamIds}
          onSetHelpText={onSetHelpText}
          onClearHelpText={onClearHelpText}
          globalMidiLearnActive={globalMidiLearnActive}
        />
      </fieldset>
    </div>
  );
});
