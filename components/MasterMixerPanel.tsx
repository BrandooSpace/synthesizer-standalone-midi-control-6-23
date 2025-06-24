import React from 'react';
import { MasterMixerParams, ModMatrixParams } from '../../types'; 
import { MasterMixerControls } from './controlPanels/MasterMixerControls';

interface MasterMixerPanelProps {
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

export const MasterMixerPanel: React.FC<MasterMixerPanelProps> = ({
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
  globalMidiLearnActive, // Destructure new prop
}) => {
  return (
    <div 
      id="master-mixer-panel"
      className="p-3 bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-md rounded-lg shadow-xl custom-scrollbar"
      style={{
        width: '350px', 
        maxHeight: '20rem', 
        overflowY: 'auto', 
      }}
    >
      <MasterMixerControls
        params={params}
        onChange={onChange}
        masterPreLimiterAnalyser={masterPreLimiterAnalyser}
        masterPostLimiterAnalyser={masterPostLimiterAnalyser}
        preInsertChainAnalyser={preInsertChainAnalyser}
        getMasterLimiterReduction={getMasterLimiterReduction}
        onRequestLearn={onRequestLearn}
        paramIdToLearn={paramIdToLearn}
        modulatedParamIds={modulatedParamIds}
        onSetHelpText={onSetHelpText} 
        onClearHelpText={onClearHelpText}
        globalMidiLearnActive={globalMidiLearnActive} // Pass down
      />
    </div>
  );
};