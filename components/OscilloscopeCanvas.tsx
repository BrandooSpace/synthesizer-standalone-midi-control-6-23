
import React, { useRef, useEffect, useCallback } from 'react';
import { VisualsParams, SymmetryMode, LfoTarget } from '../types';

interface OscilloscopeCanvasProps {
  analyserX: AnalyserNode | null;
  analyserY: AnalyserNode | null;
  visualsParams: VisualsParams;
  isAudioActive: boolean;
  // Props below are no longer needed as canvas is full-screen behind UI
  // leftSidebarWidth: number; 
  // rightSidebarWidth: number;
  // areSidebarsVisible: boolean; 
}

const TRAIL_COLORS = ['#34d399', '#facc15', '#ec4899', '#8b5cf6', '#22d3ee', '#ef4444']; // Green, Yellow, Pink, Purple, Cyan, Red
const TOP_BAR_HEIGHT = '3.5rem'; // Equivalent to h-14 in Tailwind (14 * 0.25rem)

export const OscilloscopeCanvas: React.FC<OscilloscopeCanvasProps> = React.memo(({
    analyserX, analyserY, visualsParams, isAudioActive,
    // leftSidebarWidth, rightSidebarWidth, areSidebarsVisible // No longer used
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | undefined>(undefined);
  const dataArrayXRef = useRef<Uint8Array | null>(null);
  const dataArrayYRef = useRef<Uint8Array | null>(null);

  const currentRotationAngleRef = useRef(0);
  const currentTrailColorIndexRef = useRef(0);
  const visualLfoPhaseRef = useRef(0);
  const lastTimeRef = useRef(0);

  const draw = useCallback((time: DOMHighResTimeStamp) => {
    if (!canvasRef.current) {
      animationFrameIdRef.current = window.requestAnimationFrame(draw);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
        animationFrameIdRef.current = window.requestAnimationFrame(draw);
        return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
      animationFrameIdRef.current = window.requestAnimationFrame(draw);
      return;
    }
    const deltaTime = (time - lastTimeRef.current) / 1000.0;
    lastTimeRef.current = time;

    if (!analyserX || !analyserY || !isAudioActive) {
      ctx.fillStyle = 'rgba(10, 10, 10, 1)'; // Use opaque clear color if not active
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      animationFrameIdRef.current = window.requestAnimationFrame(draw);
      return;
    }
    
    try {
        if (!dataArrayXRef.current || dataArrayXRef.current.length !== analyserX.frequencyBinCount) {
            dataArrayXRef.current = new Uint8Array(analyserX.frequencyBinCount);
        }
        if (!dataArrayYRef.current || dataArrayYRef.current.length !== analyserY.frequencyBinCount) {
            dataArrayYRef.current = new Uint8Array(analyserY.frequencyBinCount);
        }

        analyserX.getByteTimeDomainData(dataArrayXRef.current);
        analyserY.getByteTimeDomainData(dataArrayYRef.current);
        
    } catch (e) {
        console.error('[Oscilloscope] Error getting or initializing data arrays:', e);
        animationFrameIdRef.current = window.requestAnimationFrame(draw);
        return;
    }

    ctx.fillStyle = `rgba(10, 10, 10, ${1.0 - visualsParams.decay})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (visualsParams.rotation) {
      ctx.save();
      currentRotationAngleRef.current += visualsParams.rotationSpeed;
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.rotate(currentRotationAngleRef.current);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    }

    visualLfoPhaseRef.current += visualsParams.visualLfoRate * deltaTime * 2 * Math.PI;
    if (visualLfoPhaseRef.current > 2 * Math.PI) visualLfoPhaseRef.current -= 2 * Math.PI;
    const lfoValue = Math.sin(visualLfoPhaseRef.current) * visualsParams.visualLfoDepth;

    let currentHue = visualsParams.baseHue;
    let currentSaturation = visualsParams.baseSaturation;
    let currentLightness = visualsParams.baseLightness;

    if (visualsParams.visualLfoTarget !== LfoTarget.OFF) {
        switch (visualsParams.visualLfoTarget) {
            case LfoTarget.VISUAL_HUE:
                currentHue = (visualsParams.baseHue + lfoValue * 1.8) % 360; 
                if (currentHue < 0) currentHue += 360;
                break;
            case LfoTarget.VISUAL_SATURATION:
                currentSaturation = Math.max(0, Math.min(100, visualsParams.baseSaturation + lfoValue));
                break;
            case LfoTarget.VISUAL_LIGHTNESS:
                currentLightness = Math.max(0, Math.min(100, visualsParams.baseLightness + lfoValue / 2));
                break;
        }
    }

    ctx.lineWidth = visualsParams.lineWidth;
    ctx.shadowBlur = visualsParams.glow;

    ctx.beginPath();
    const bufferLength = dataArrayXRef.current.length;

    for (let i = 0; i < bufferLength; i++) {
      let x = (dataArrayXRef.current[i] / 128.0) * (ctx.canvas.width / 2); 
      let y = (dataArrayYRef.current[i] / 128.0) * (ctx.canvas.height / 2); 
      
      x = (x - ctx.canvas.width / 2) / visualsParams.zoomX + ctx.canvas.width / 2 + visualsParams.panX * ctx.canvas.width;
      y = (y - ctx.canvas.height / 2) / visualsParams.zoomY + ctx.canvas.height / 2 + visualsParams.panY * ctx.canvas.height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      if (visualsParams.symmetryMode !== SymmetryMode.OFF) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const dx = x - centerX;
        const dy = y - centerY;

        if (visualsParams.symmetryMode === SymmetryMode.X || visualsParams.symmetryMode === SymmetryMode.XY) {
          if (i === 0) ctx.moveTo(centerX + dx, centerY - dy); else ctx.lineTo(centerX + dx, centerY - dy);
        }
        if (visualsParams.symmetryMode === SymmetryMode.Y || visualsParams.symmetryMode === SymmetryMode.XY) {
           if (i === 0) ctx.moveTo(centerX - dx, centerY + dy); else ctx.lineTo(centerX - dx, centerY + dy);
        }
        if (visualsParams.symmetryMode === SymmetryMode.XY) {
           if (i === 0) ctx.moveTo(centerX - dx, centerY - dy); else ctx.lineTo(centerX - dx, centerY - dy);
        }
      }
    }

    if (visualsParams.multiColorTrails) {
        currentTrailColorIndexRef.current = (currentTrailColorIndexRef.current + 1) % TRAIL_COLORS.length;
        ctx.strokeStyle = TRAIL_COLORS[currentTrailColorIndexRef.current];
        ctx.shadowColor = TRAIL_COLORS[currentTrailColorIndexRef.current];
    } else {
        const colorString = `hsl(${currentHue}, ${currentSaturation}%, ${currentLightness}%)`;
        ctx.strokeStyle = colorString;
        ctx.shadowColor = colorString;
    }
    
    ctx.stroke();

    if (visualsParams.rotation) {
      ctx.restore();
    }
    
    animationFrameIdRef.current = window.requestAnimationFrame(draw);
  }, [analyserX, analyserY, visualsParams, isAudioActive]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) { // Ensure positive dimensions
                canvas.width = width;
                canvas.height = height;
            }
        }
    });

    resizeObserver.observe(canvas);
    
    animationFrameIdRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      lastTimeRef.current = 0;
    };
  }, [draw]);
  

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0" // Removed w-auto h-auto, will be controlled by style
      style={{
        top: TOP_BAR_HEIGHT,
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100vw', // Full viewport width
        height: `calc(100vh - ${TOP_BAR_HEIGHT})`, // Full viewport height minus top bar
        // Removed transition for size/position
        backgroundColor: 'rgb(10, 10, 10)',
        zIndex: 1, // Ensure it's above body background but below UI overlays
      }}
      aria-label="Oscilloscope display"
    />
  );
});
