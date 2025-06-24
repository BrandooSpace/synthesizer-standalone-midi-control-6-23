
import React, { useCallback } from 'react';
import { DelayParams, SendMode, DelayFeedbackFilterType } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { SEND_MODE_OPTIONS, DELAY_FEEDBACK_FILTER_TYPE_OPTIONS, MAX_MAIN_DELAY_TIME } from '../../constants';
import { PeakMeter } from '../ui/PeakMeter';

interface DelayControlsProps {
  params: DelayParams;
  onChange: (newParams: DelayParams) => void;
  delaySendInputAnalyser: AnalyserNode | null;
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  paramIdToLearn?: string | null; 
  modulatedParamIds?: Set<string>; 
  onSetHelpText?: (text: string) => void;
  onClearHelpText?: () => void;
  globalMidiLearnActive?: boolean;
}

export const DelayControls: React.FC<DelayControlsProps> = React.memo(({ 
  params, onChange, delaySendInputAnalyser,
  onRequestLearn, paramIdToLearn, modulatedParamIds,
  onSetHelpText, onClearHelpText,
  globalMidiLearnActive
 }) => {
  const handleChange = useCallback((field: keyof DelayParams, value: string | number | boolean | SendMode | DelayFeedbackFilterType) => {
    const newParams = { ...params, [field]: typeof params[field] === 'number' ? parseFloat(value as string) : value };
    onChange(newParams);
  }, [onChange, params]);

  return (
    <div className="space-y-4">
      <Switch
        id="delay-enable-toggle"
        label="Enable Delay"
        checked={params.isDelayEnabled}
        onChange={(e) => handleChange('isDelayEnabled', e.target.checked)}
        tooltip="Toggles the stereo delay effect on or off."
        onSetHelpText={onSetHelpText}
        onClearHelpText={onClearHelpText}
      />
      <fieldset className={`relative space-y-4 pt-2 transition-opacity duration-300 ${params.isDelayEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {!params.isDelayEnabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-md z-10 backdrop-blur-sm">
            <span className="text-gray-500 font-semibold text-base px-4 py-2 bg-gray-800 rounded border border-gray-700 select-none">DISABLED</span>
          </div>
        )}
        
        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase text-center mb-1">Send / Return</h4>
          <Slider
            id="delaySendLevel"
            label="SEND LEVEL"
            min={0}
            max={1}
            step={0.01}
            value={params.sendLevel}
            onChange={(e) => handleChange('sendLevel', e.target.value)}
            paramId="delay.sendLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "delay.sendLevel"}
            tooltip="Amount of signal sent to the delay effect from the main audio path."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <PeakMeter
            analyserNode={delaySendInputAnalyser}
            title="Send Input Level"
            minDb={-48}
            maxDb={6}
            className="mt-2 mx-auto"
          />
          <Select
            id="delaySendMode"
            label="SEND MODE"
            options={SEND_MODE_OPTIONS}
            value={params.sendMode}
            onChange={(e) => handleChange('sendMode', e.target.value as SendMode)}
            tooltip="Determines if the delay send is tapped before (Pre-Fader) or after (Post-Fader) the main voice/insert chain output."
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
          />
           <Slider
            id="delayReturnLevel"
            label="RETURN LEVEL"
            min={0}
            max={1.5} 
            step={0.01}
            value={params.returnLevel}
            onChange={(e) => handleChange('returnLevel', e.target.value)}
            paramId="delay.returnLevel"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "delay.returnLevel"}
            tooltip="Overall volume of the processed delay signal mixed back into the main output."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase text-center mb-1">Time / Feedback</h4>
          <Slider
            id="delayTimeL"
            label="TIME LEFT (s)"
            min={0.001} 
            max={MAX_MAIN_DELAY_TIME} 
            step={0.001}
            value={params.delayTimeL}
            onChange={(e) => handleChange('delayTimeL', e.target.value)}
            paramId="delay.delayTimeL"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "delay.delayTimeL"}
            tooltip="Delay time for the left channel."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="delayTimeR"
            label="TIME RIGHT (s)"
            min={0.001}
            max={MAX_MAIN_DELAY_TIME} 
            step={0.001}
            value={params.delayTimeR}
            onChange={(e) => handleChange('delayTimeR', e.target.value)}
            paramId="delay.delayTimeR"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "delay.delayTimeR"}
            tooltip="Delay time for the right channel."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
          <Slider
            id="delayFeedback"
            label="FEEDBACK"
            min={0}
            max={0.98} 
            step={0.01}
            value={params.feedback}
            onChange={(e) => handleChange('feedback', e.target.value)}
            paramId="delay.feedback"
            onRequestLearn={onRequestLearn}
            isLearning={paramIdToLearn === "delay.feedback"}
            tooltip="Amount of delayed signal fed back into the delay input, creating repeats. High values can self-oscillate."
            modulatedParamIds={modulatedParamIds}
            onSetHelpText={onSetHelpText}
            onClearHelpText={onClearHelpText}
            globalMidiLearnActive={globalMidiLearnActive}
          />
        </div>

        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase text-center">Feedback Loop Shaping</h4>
            <Select
              id="delayFeedbackFilterType"
              label="FEEDBACK FILTER TYPE"
              options={DELAY_FEEDBACK_FILTER_TYPE_OPTIONS}
              value={params.feedbackFilterType}
              onChange={(e) => handleChange('feedbackFilterType', e.target.value as DelayFeedbackFilterType)}
              tooltip="Type of filter applied to the feedback signal, shaping the tone of repeats."
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
            />
            <Slider
              id="delayFeedbackFilterFreq"
              label="FEEDBACK FILTER FREQ (Hz)"
              min={20} 
              max={20000} 
              step={1} 
              value={params.feedbackFilterFreq}
              onChange={(e) => handleChange('feedbackFilterFreq', e.target.value)}
              paramId="delay.feedbackFilterFreq"
              onRequestLearn={onRequestLearn}
              isLearning={paramIdToLearn === "delay.feedbackFilterFreq"}
              tooltip="Cutoff/center frequency of the feedback filter. Shapes the tone of degrading repeats."
              modulatedParamIds={modulatedParamIds}
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
              globalMidiLearnActive={globalMidiLearnActive}
            />
            {params.feedbackFilterType === DelayFeedbackFilterType.BANDPASS && (
              <Slider
                id="delayFeedbackFilterQ"
                label="FEEDBACK FILTER Q"
                min={0.1} 
                max={20} 
                step={0.1}
                value={params.feedbackFilterQ}
                onChange={(e) => handleChange('feedbackFilterQ', e.target.value)}
                paramId="delay.feedbackFilterQ"
                onRequestLearn={onRequestLearn}
                isLearning={paramIdToLearn === "delay.feedbackFilterQ"}
                tooltip="Resonance/Q factor of the band-pass feedback filter. Higher values create a more pronounced resonant peak."
                modulatedParamIds={modulatedParamIds}
                onSetHelpText={onSetHelpText}
                onClearHelpText={onClearHelpText}
                globalMidiLearnActive={globalMidiLearnActive}
              />
            )}
            <Slider
              id="delaySaturation"
              label="FEEDBACK SATURATION"
              min={0} 
              max={1} 
              step={0.01}
              value={params.saturation}
              onChange={(e) => handleChange('saturation', e.target.value)}
              paramId="delay.saturation"
              onRequestLearn={onRequestLearn}
              isLearning={paramIdToLearn === "delay.saturation"}
              tooltip="Amount of saturation applied to the feedback signal, adding warmth or distortion to repeats."
              modulatedParamIds={modulatedParamIds}
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
              globalMidiLearnActive={globalMidiLearnActive}
            />
        </div>

        <div className="p-2 border border-gray-700 rounded-md bg-gray-800 bg-opacity-30 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase text-center">Wow / Flutter</h4>
            <Slider
              id="delayFlutterRate"
              label="FLUTTER RATE (Hz)"
              min={0.05} 
              max={10} 
              step={0.01}
              value={params.flutterRate}
              onChange={(e) => handleChange('flutterRate', e.target.value)}
              paramId="delay.flutterRate"
              onRequestLearn={onRequestLearn}
              isLearning={paramIdToLearn === "delay.flutterRate"}
              tooltip="Rate of pitch modulation applied to the delayed signal (tape-style flutter)."
              modulatedParamIds={modulatedParamIds}
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
              globalMidiLearnActive={globalMidiLearnActive}
            />
            <Slider
              id="delayFlutterDepth"
              label="FLUTTER DEPTH"
              min={0} 
              max={0.01} 
              step={0.0001} 
              value={params.flutterDepth}
              onChange={(e) => handleChange('flutterDepth', e.target.value)}
              paramId="delay.flutterDepth"
              onRequestLearn={onRequestLearn}
              isLearning={paramIdToLearn === "delay.flutterDepth"}
              tooltip="Amount of pitch modulation for the flutter effect. Creates a 'warbling' tape delay sound."
              modulatedParamIds={modulatedParamIds}
              onSetHelpText={onSetHelpText}
              onClearHelpText={onClearHelpText}
              globalMidiLearnActive={globalMidiLearnActive}
            />
        </div>
      </fieldset>
    </div>
  );
});
