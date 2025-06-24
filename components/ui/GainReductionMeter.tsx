
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface GainReductionMeterProps {
  getReductionDb: () => number;
  title: string;
  maxReductionDb?: number; // e.g., -20 (displays 0 down to -20dB)
  className?: string;
  compact?: boolean; // Phase 4: Added compact prop
}

export const GainReductionMeter: React.FC<GainReductionMeterProps> = React.memo(({
  getReductionDb,
  title,
  maxReductionDb = -24, // Show reduction up to 24dB
  className,
  compact = false, // Phase 4: Default to false
}) => {
  const animationFrameIdRef = useRef<number | null>(null);
  const [currentReductionDb, setCurrentReductionDb] = useState<number>(0);

  const processReduction = useCallback(() => {
    const reduction = getReductionDb(); // This is typically 0 or negative
    setCurrentReductionDb(reduction);
    animationFrameIdRef.current = requestAnimationFrame(processReduction);
  }, [getReductionDb]);

  useEffect(() => {
    animationFrameIdRef.current = requestAnimationFrame(processReduction);
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [processReduction]);

  const displayRange = Math.abs(maxReductionDb); 
  const clampedReduction = Math.max(maxReductionDb, Math.min(0, currentReductionDb));
  const meterHeightPercentage = Math.min(100, (Math.abs(clampedReduction) / displayRange) * 100);

  const meterHeightClass = compact ? 'h-20' : 'h-28';
  const titleTextSizeClass = compact ? 'text-[0.65rem] leading-tight' : 'text-xs';
  const dbTextSizeClass = compact ? 'text-[0.6rem]' : 'text-xs';
  const clipIndicatorPlaceholderSizeClass = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';


  return (
    <div className={`flex flex-col items-center space-y-1 ${className || ''}`}
         title={title} // Phase 4: Added tooltip
         aria-label={`${title} Gain Reduction Meter`}
         role="meter"
         aria-valuemin={maxReductionDb}
         aria-valuemax={0}
         aria-valuenow={parseFloat(currentReductionDb.toFixed(1))}>
      <div className={`${titleTextSizeClass} text-gray-400 font-mono select-none text-center`}>{title}</div>
      <div className={`w-8 ${meterHeightClass} bg-gray-700 rounded overflow-hidden relative border border-gray-600`}>
        <div 
          className="absolute bottom-0 w-full bg-orange-500" 
          style={{ height: `${meterHeightPercentage}%` }}
        />
      </div>
       <div className={`${clipIndicatorPlaceholderSizeClass} rounded-full bg-transparent`}> {/* Placeholder for alignment with PeakMeter */}
      </div>
      <div className={`${dbTextSizeClass} text-orange-400 font-mono select-none min-h-[1.25em]`}>
        {currentReductionDb < -0.05 ? currentReductionDb.toFixed(1) : '0.0'} dB
      </div>
    </div>
  );
});
