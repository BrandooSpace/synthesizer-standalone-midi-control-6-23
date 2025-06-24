import React from 'react';
import { MasterMixerParams, InsertEffectId } from '../../types';
import { INSERT_EFFECT_DEFINITIONS } from '../../constants';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider'; 
import { PeakMeter } from '../ui/PeakMeter';
import { GainReductionMeter } from '../ui/GainReductionMeter';

interface MasterMixerControlsProps {
  params: MasterMixerParams;
  onChange: (newParams: MasterMixerParams) => void;
  masterPreLimiterAnalyser: AnalyserNode | null;
  masterPostLimiterAnalyser: AnalyserNode | null;
  preInsertChainAnalyser: AnalyserNode | null; 
  getMasterLimiterReduction: () => number;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean; // Added prop
}

export const MasterMixerControls: React.FC<MasterMixerControlsProps> = ({ 
  params, 
  onChange,
  masterPreLimiterAnalyser,
  masterPostLimiterAnalyser,
  preInsertChainAnalyser, 
  getMasterLimiterReduction,
  onRequestLearn,
  paramIdToLearn,
  modulatedParamIds,
  onSetHelpText,
  onClearHelpText,
  globalMidiLearnActive // Destructure new prop
}) => {
  
  const handleMoveEffect = (index: number, direction: 'up' | 'down') => {
    const currentOrder = [...params.insertEffectOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentOrder.length) {
      return; 
    }

    const itemToMove = currentOrder.splice(index, 1)[0];
    currentOrder.splice(targetIndex, 0, itemToMove);
    
    onChange({ ...params, insertEffectOrder: currentOrder });
  };

  const handleSliderChange = (field: keyof MasterMixerParams, value: string) => {
    onChange({ ...params, [field]: parseFloat(value) });
  };

  const getEffectTitle = (id: InsertEffectId): string => {
    return INSERT_EFFECT_DEFINITIONS.find(def => def.id === id)?.title || id;
  }

  return (
    <div className="space-y-4 text-gray-300">
      <p 
        className="text-center font-orbitron font-semibold text-lg text-green-400"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Master Mixer: Controls overall signal flow, insert effect order, send/return levels, and master output metering.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        MASTER MIXER
      </p>
      
      <div 
        className="border-t border-gray-700 my-3 pt-3"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Input/Bus Levels: Visualizes the audio level of the combined synth voices before they enter the insert effect chain.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2 text-center">Input / Bus Levels</h3>
        <div className="flex justify-center p-2 bg-gray-800 rounded-md h-40 items-end">
          <PeakMeter 
            analyserNode={preInsertChainAnalyser} 
            title="Voices (Pre-Insert)" 
            minDb={-48} 
            maxDb={6}
          />
        </div>
      </div>

      <div 
        className="border-t border-gray-700 my-3 pt-3"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Master Output Levels: Shows audio levels before and after the final limiter, and the amount of gain reduction applied by the limiter.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2 text-center">Master Output Levels</h3>
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800 rounded-md h-40 items-end">
          <PeakMeter 
            analyserNode={masterPreLimiterAnalyser} 
            title="Pre-Limiter" 
            minDb={-48} 
            maxDb={6}
          />
          <GainReductionMeter 
            getReductionDb={getMasterLimiterReduction} 
            title="Limiter GR"
            maxReductionDb={-24}
          />
          <PeakMeter 
            analyserNode={masterPostLimiterAnalyser} 
            title="Post-Limiter"
            minDb={-48}
            maxDb={6}
          />
        </div>
      </div>


      <div 
        className="border-t border-gray-700 my-3 pt-3"
        onMouseEnter={() => onSetHelpText && onSetHelpText("Insert Effect Order: Drag and drop to reorder insert effects. Signal flows from top to bottom.")}
        onMouseLeave={() => onClearHelpText && onClearHelpText()}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2 text-center">Insert Effect Order</h3>
        <div className="space-y-2 bg-gray-800 p-3 rounded-md">
          {params.insertEffectOrder.map((effectId, index) => (
            <div key={effectId} className="flex items-center justify-between p-2 bg-gray-700 rounded shadow">
              <span className="text-sm">{index + 1}. {getEffectTitle(effectId)}</span>
              <div className="flex gap-x-1">
                <Button 
                  variant="secondary"
                  onClick={() => handleMoveEffect(index, 'up')}
                  disabled={index === 0}
                  className="px-2 py-1 text-xs effect-btn disabled:opacity-50"
                  aria-label={`Move ${getEffectTitle(effectId)} up`}
                >
                  &uarr; {/* Up arrow */}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleMoveEffect(index, 'down')}
                  disabled={index === params.insertEffectOrder.length - 1}
                  className="px-2 py-1 text-xs effect-btn disabled:opacity-50"
                  aria-label={`Move ${getEffectTitle(effectId)} down`}
                >
                  &darr; {/* Down arrow */}
                </Button>
              </div>
            </div>
          ))}
          {params.insertEffectOrder.length === 0 && (
            <p className="text-xs text-gray-500 text-center italic">No insert effects in chain.</p>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-700 my-3 pt-3">
        <h3 
          className="text-sm font-semibold text-gray-400 uppercase mb-2 text-center"
          onMouseEnter={() => onSetHelpText && onSetHelpText("Global Send/Return Levels: Controls the overall send and return levels for the master Delay and Reverb effects.")}
          onMouseLeave={() => onClearHelpText && onClearHelpText()}
        >Global Send/Return Levels</h3>
        <div className="space-y-3 p-2 bg-gray-800 rounded-md">
          <Slider 
            id="masterDelaySendLevel" 
            label="MASTER DELAY SEND" 
            min={0} max={1.5} step={0.01} 
            value={params.masterDelaySendLevel} 
            onChange={(e) => handleSliderChange('masterDelaySendLevel', e.target.value)} 
            paramId="masterMixer.masterDelaySendLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "masterMixer.masterDelaySendLevel"}
            tooltip="Overall level of signal sent from the main bus to the master Delay effect."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="masterDelayReturnLevel"
            label="MASTER DELAY RETURN"
            min={0} max={1.5} step={0.01}
            value={params.masterDelayReturnLevel}
            onChange={(e) => handleSliderChange('masterDelayReturnLevel', e.target.value)}
            paramId="masterMixer.masterDelayReturnLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "masterMixer.masterDelayReturnLevel"}
            tooltip="Overall level of the processed signal returned from the master Delay effect to the final mix."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider 
            id="masterReverbSendLevel" 
            label="MASTER REVERB SEND" 
            min={0} max={1.5} step={0.01} 
            value={params.masterReverbSendLevel} 
            onChange={(e) => handleSliderChange('masterReverbSendLevel', e.target.value)} 
            paramId="masterMixer.masterReverbSendLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "masterMixer.masterReverbSendLevel"}
            tooltip="Overall level of signal sent from the main bus to the master Reverb effect."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider 
            id="masterReverbReturnLevel"
            label="MASTER REVERB RETURN"
            min={0} max={1.5} step={0.01}
            value={params.masterReverbReturnLevel}
            onChange={(e) => handleSliderChange('masterReverbReturnLevel', e.target.value)}
            paramId="masterMixer.masterReverbReturnLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "masterMixer.masterReverbReturnLevel"}
            tooltip="Overall level of the processed signal returned from the master Reverb effect to the final mix."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>
      </div>
    </div>
  );
};