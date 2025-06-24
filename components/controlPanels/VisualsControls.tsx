
import React from 'react';
import { VisualsParams, SymmetryMode, LfoTarget } from '../../types';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { SYMMETRY_MODE_OPTIONS, VISUAL_LFO_MOD_TARGET_OPTIONS } from '../../constants'; // Import new options

interface VisualsControlsProps {
  params: VisualsParams;
  onChange: (newParams: VisualsParams) => void;
}

export const VisualsControls: React.FC<VisualsControlsProps> = ({ params, onChange }) => {
  
  const handleParamChange = (field: keyof VisualsParams, value: unknown) => {
    let processedValue = value;
    if (typeof params[field] === 'number') {
        processedValue = parseFloat(value as string);
    } else if (typeof params[field] === 'boolean') {
        processedValue = value as boolean;
    }
    const newParams = { ...params, [field]: processedValue };
    onChange(newParams);
  };

  return (
    <div className="space-y-4 pt-2">
      <Slider
        id="lineWidth"
        label="LINE WIDTH"
        min={0.5}
        max={10}
        step={0.1}
        value={params.lineWidth}
        onChange={(e) => handleParamChange('lineWidth', e.target.value)}
      />
      <Slider
        id="decay"
        label="VISUAL DECAY (Trail)"
        min={0.01}
        max={0.99} 
        step={0.01}
        value={params.decay}
        onChange={(e) => handleParamChange('decay', e.target.value)}
      />
      <Slider
        id="glow"
        label="GLOW INTENSITY"
        min={0}
        max={30}
        step={1}
        value={params.glow}
        onChange={(e) => handleParamChange('glow', e.target.value)}
      />
      <Switch
        id="multiColorTrails"
        label="Multi-Color Trails"
        checked={params.multiColorTrails}
        onChange={(e) => handleParamChange('multiColorTrails', e.target.checked)}
        className="mt-2"
      />
      <Select
        id="symmetryMode"
        label="Symmetry Mode"
        options={SYMMETRY_MODE_OPTIONS}
        value={params.symmetryMode}
        onChange={(e) => handleParamChange('symmetryMode', e.target.value as SymmetryMode)}
        className="mt-2"
      />
      <Switch
        id="rotation"
        label="Enable Rotation"
        checked={params.rotation}
        onChange={(e) => handleParamChange('rotation', e.target.checked)}
        className="mt-2"
      />
      <fieldset className={`transition-opacity duration-300 ${params.rotation ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <Slider
          id="rotationSpeed"
          label="ROTATION SPEED"
          min={-0.05}
          max={0.05}
          step={0.001}
          value={params.rotationSpeed}
          onChange={(e) => handleParamChange('rotationSpeed', e.target.value)}
          className="mt-2"
        />
      </fieldset>

      <h3 className="text-xs font-semibold text-gray-400 uppercase pt-3 border-t border-gray-700 mt-3">View Control</h3>
      <Slider
        id="zoomX"
        label="Zoom X"
        min={0.1}
        max={5}
        step={0.01}
        value={params.zoomX}
        onChange={(e) => handleParamChange('zoomX', e.target.value)}
        className="mt-1"
      />
      <Slider
        id="zoomY"
        label="Zoom Y"
        min={0.1}
        max={5}
        step={0.01}
        value={params.zoomY}
        onChange={(e) => handleParamChange('zoomY', e.target.value)}
      />
      <Slider
        id="panX"
        label="Pan X (-1 to 1)"
        min={-1}
        max={1}
        step={0.01}
        value={params.panX}
        onChange={(e) => handleParamChange('panX', e.target.value)}
      />
      <Slider
        id="panY"
        label="Pan Y (-1 to 1)"
        min={-1}
        max={1}
        step={0.01}
        value={params.panY}
        onChange={(e) => handleParamChange('panY', e.target.value)}
      />

      <h3 className="text-xs font-semibold text-gray-400 uppercase pt-3 border-t border-gray-700 mt-3">Visual LFO & Color</h3>
      <Slider
        id="visualLfoRate"
        label="Visual LFO Rate (Hz)"
        min={0.01}
        max={10} // Rate for visual LFO can be slower or faster than audio
        step={0.01}
        value={params.visualLfoRate}
        onChange={(e) => handleParamChange('visualLfoRate', e.target.value)}
        className="mt-1"
      />
       <Slider
        id="visualLfoDepth"
        label="Visual LFO Depth"
        min={0}
        max={100} // Depth for visual LFO (e.g., 0-100 for percentage)
        step={1}
        value={params.visualLfoDepth}
        onChange={(e) => handleParamChange('visualLfoDepth', e.target.value)}
      />
       <Select
        id="visualLfoTarget"
        label="Visual LFO Target"
        options={VISUAL_LFO_MOD_TARGET_OPTIONS}
        value={params.visualLfoTarget}
        onChange={(e) => handleParamChange('visualLfoTarget', e.target.value as LfoTarget)}
        className="mt-1"
      />
      <fieldset className={`space-y-3 pt-1 transition-opacity duration-300 ${params.visualLfoTarget !== LfoTarget.OFF ? 'opacity-100' : 'opacity-60'}`}>
        {/* Base color sliders are always active, LFO modulates them if target is set */}
      </fieldset>
      <Slider
          id="baseHue"
          label="Base Hue"
          min={0}
          max={360}
          step={1}
          value={params.baseHue}
          onChange={(e) => handleParamChange('baseHue', e.target.value)}
          className="mt-2"
        />
        <Slider
          id="baseSaturation"
          label="Base Saturation (%)"
          min={0}
          max={100}
          step={1}
          value={params.baseSaturation}
          onChange={(e) => handleParamChange('baseSaturation', e.target.value)}
        />
        <Slider
          id="baseLightness"
          label="Base Lightness (%)"
          min={0}
          max={100}
          step={1}
          value={params.baseLightness}
          onChange={(e) => handleParamChange('baseLightness', e.target.value)}
        />
    </div>
  );
};