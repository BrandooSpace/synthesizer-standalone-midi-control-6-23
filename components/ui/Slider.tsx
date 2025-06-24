
import React, { useState, useEffect, useCallback } from 'react';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  paramId?: string; 
  onRequestLearn?: (paramId: string, min: number, max: number) => void; 
  isLearning?: boolean; 
  tooltip?: string;
  modulatedParamIds?: Set<string>;
  onSetHelpText?: (text: string) => void; 
  onClearHelpText?: () => void;    
  globalMidiLearnActive?: boolean; // New: To control visibility of learn button
}

export const Slider: React.FC<SliderProps> = React.memo(({ 
  id, label, min, max, step, value, onChange, className,
  paramId, onRequestLearn, isLearning, tooltip, modulatedParamIds,
  onSetHelpText, onClearHelpText, globalMidiLearnActive
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const formatDisplayValue = useCallback((val: number): string => {
    if (val % 1 !== 0) {
      const stepPrecision = step % 1 !== 0 ? (step.toString().split('.')[1] || '').length : 0;
      const displayPrecision = Math.max(0, Math.min(2, stepPrecision)); 
      const fixedVal = parseFloat(val.toFixed(displayPrecision));
      return fixedVal.toString();
    }
    return val.toString();
  }, [step]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatDisplayValue(value));
    }
  }, [value, isEditing, formatDisplayValue]);


  const handleSpanClick = () => {
    setInputValue(value.toString()); 
    setIsEditing(true);
  };

  const getStepPrecision = (stepValue: number): number => {
    if (stepValue % 1 === 0) return 0;
    const stepString = stepValue.toString();
    const decimalPart = stepString.split('.')[1];
    return decimalPart ? decimalPart.length : 0;
  };

  const handleCommit = () => {
    let numValue = parseFloat(inputValue);

    if (isNaN(numValue)) {
      numValue = value; 
    } else {
      numValue = Math.max(min, Math.min(max, numValue));
      if (step > 0) {
        const precision = getStepPrecision(step);
        numValue = parseFloat((Math.round(numValue / step) * step).toFixed(precision));
        numValue = Math.max(min, Math.min(max, numValue));
      }
    }
    
    const syntheticEvent = {
      target: { value: numValue.toString(), name: id } 
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setIsEditing(false);
  };

  const handleInputChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(formatDisplayValue(value)); 
      setIsEditing(false);
    }
  };
  
  const handleInputBlur = () => {
    handleCommit();
  };

  const handleLearnClick = () => {
    if (globalMidiLearnActive && onRequestLearn && paramId) {
      onRequestLearn(paramId, min, max);
    }
  };

  const isModulated = paramId && modulatedParamIds ? modulatedParamIds.has(paramId) : false;
  const helpText = tooltip || `${label}: No description available.`;

  return (
    <div 
      className={`flex flex-col ${className || ''} ${isLearning && !isEditing ? 'ring-2 ring-blue-500 rounded-md p-0.5' : ''} ${isModulated ? 'is-modulated' : ''}`}
      onMouseEnter={() => onSetHelpText && onSetHelpText(helpText)}
      onMouseLeave={() => onClearHelpText && onClearHelpText()}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <label htmlFor={id} className="control-label text-sm text-gray-300" title={tooltip}>
            {label}
          </label>
          {globalMidiLearnActive && onRequestLearn && paramId && (
            <button
              onClick={handleLearnClick}
              className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                isLearning 
                  ? 'bg-blue-500 text-white animate-pulse ring-1 ring-blue-300'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
              title={`Learn MIDI CC for ${label}`}
              aria-label={`Learn MIDI for ${label}`}
            >
              Learn
            </button>
          )}
        </div>
        {isEditing ? (
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChangeEvent}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="text-xs text-green-500 font-mono bg-gray-900 border border-green-500 px-1 py-0.5 rounded w-20 text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-300"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <span
            className="text-xs text-green-400 font-mono bg-gray-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-300"
            onClick={handleSpanClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSpanClick(); }}}
            role="button"
            tabIndex={0}
            aria-label={`Edit value for ${label}`}
          >
            {formatDisplayValue(value)}
          </span>
        )}
      </div>
      <input
        type="range"
        id={id}
        name={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-md appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800 focus-visible:ring-green-500"
      />
    </div>
  );
});
