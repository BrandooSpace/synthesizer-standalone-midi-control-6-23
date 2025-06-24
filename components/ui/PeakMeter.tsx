
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PeakMeterProps {
  analyserNode: AnalyserNode | null;
  title: string;
  minDb?: number;
  maxDb?: number;
  className?: string;
  compact?: boolean; // Phase 4: Added compact prop
}

const PEAK_HOLD_TIME_MS = 1500;
const CLIP_INDICATOR_TIME_MS = 1000;

export const PeakMeter: React.FC<PeakMeterProps> = React.memo(({
  analyserNode,
  title,
  minDb = -60,
  maxDb = 6,
  className,
  compact = false, // Phase 4: Default to false
}) => {
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [currentDb, setCurrentDb] = useState<number>(minDb);
  const [peakDb, setPeakDb] = useState<number>(minDb);
  const [isClipping, setIsClipping] = useState<boolean>(false);

  const peakHoldTimeoutRef = useRef<number | null>(null);
  const clipIndicatorTimeoutRef = useRef<number | null>(null);

  const processAudio = useCallback(() => {
    if (!analyserNode) {
      setCurrentDb(minDb);
      setPeakDb(minDb);
      setIsClipping(false);
      animationFrameIdRef.current = requestAnimationFrame(processAudio);
      return;
    }

    if (!dataArrayRef.current || dataArrayRef.current.length !== analyserNode.fftSize) {
      dataArrayRef.current = new Float32Array(analyserNode.fftSize);
    }

    analyserNode.getFloatTimeDomainData(dataArrayRef.current);
    
    let peakSample = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const absSample = Math.abs(dataArrayRef.current[i]);
      if (absSample > peakSample) {
        peakSample = absSample;
      }
    }

    let dbValue = minDb;
    if (peakSample > 0) {
      dbValue = 20 * Math.log10(peakSample);
    }
    
    dbValue = Math.max(minDb, Math.min(maxDb, dbValue)); // Clamp to display range for the bar
    setCurrentDb(dbValue);

    if (dbValue > peakDb || dbValue === minDb) { // Update peak if higher or if signal is silent
      setPeakDb(dbValue);
      if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
      peakHoldTimeoutRef.current = window.setTimeout(() => setPeakDb(minDb), PEAK_HOLD_TIME_MS);
    }
    
    // Check for actual clipping (>= 0 dBFS)
    const rawDbValue = 20 * Math.log10(peakSample); // Use un-clamped value for clip detection
    if (rawDbValue >= 0) {
      setIsClipping(true);
      if (clipIndicatorTimeoutRef.current) clearTimeout(clipIndicatorTimeoutRef.current);
      clipIndicatorTimeoutRef.current = window.setTimeout(() => setIsClipping(false), CLIP_INDICATOR_TIME_MS);
    }

    animationFrameIdRef.current = requestAnimationFrame(processAudio);
  }, [analyserNode, minDb, maxDb, peakDb]);

  useEffect(() => {
    animationFrameIdRef.current = requestAnimationFrame(processAudio);
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (peakHoldTimeoutRef.current) clearTimeout(peakHoldTimeoutRef.current);
      if (clipIndicatorTimeoutRef.current) clearTimeout(clipIndicatorTimeoutRef.current);
    };
  }, [processAudio]);

  const totalDbRange = maxDb - minDb;
  const meterHeightPercentage = Math.max(0, Math.min(100, ((currentDb - minDb) / totalDbRange) * 100));
  const peakPositionPercentage = Math.max(0, Math.min(100, ((peakDb - minDb) / totalDbRange) * 100));
  
  let barColorClass = 'bg-green-500';
  if (currentDb > -6) barColorClass = 'bg-yellow-400';
  if (currentDb >= 0) barColorClass = 'bg-red-500';

  const meterHeightClass = compact ? 'h-20' : 'h-28';
  const titleTextSizeClass = compact ? 'text-[0.65rem] leading-tight' : 'text-xs';
  const dbTextSizeClass = compact ? 'text-[0.6rem]' : 'text-xs';
  const clipIndicatorSizeClass = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';


  return (
    <div className={`flex flex-col items-center space-y-1 ${className || ''}`} 
         title={title} // Phase 4: Added tooltip
         aria-label={`${title} Peak Meter`}
         role="meter"
         aria-valuemin={minDb}
         aria-valuemax={maxDb}
         aria-valuenow={parseFloat(currentDb.toFixed(1))}>
      <div className={`${titleTextSizeClass} text-gray-400 font-mono select-none text-center`}>{title}</div>
      <div className={`w-8 ${meterHeightClass} bg-gray-700 rounded overflow-hidden relative border border-gray-600`}>
        <div 
          className={`absolute bottom-0 w-full transition-colors duration-100 ${barColorClass}`} 
          style={{ height: `${meterHeightPercentage}%` }}
        />
        {peakDb > minDb && (
            <div 
            className="absolute w-full h-0.5 bg-gray-400 opacity-70"
            style={{ bottom: `${peakPositionPercentage}%`}}
            />
        )}
      </div>
      <div className={`${clipIndicatorSizeClass} rounded-full ${isClipping ? 'bg-red-600 animate-pulse' : 'bg-gray-600'} transition-colors duration-150`} 
           title={isClipping ? "CLIP!" : "No Clip"}
           aria-live="polite"
           aria-atomic="true">
           {isClipping && <span className="sr-only">Clipping</span>}
      </div>
      <div className={`${dbTextSizeClass} text-green-400 font-mono select-none min-h-[1.25em]`}>
        {currentDb > minDb ? currentDb.toFixed(1) : '-inf'} dB
      </div>
    </div>
  );
});
