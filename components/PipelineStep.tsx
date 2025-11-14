
import React from 'react';
import type { PipelineStep } from '../types';
import { PipelineStepStatus } from '../types';
import { CheckIcon, SpinnerIcon } from './icons';

interface PipelineStepProps {
  text: string;
  status: PipelineStep['status'];
}

const PipelineStepComponent: React.FC<PipelineStepProps> = ({ text, status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case PipelineStepStatus.RUNNING:
        return <SpinnerIcon className="w-5 h-5 text-white" />;
      case PipelineStepStatus.COMPLETED:
        return <CheckIcon className="w-5 h-5 text-white" />;
      case PipelineStepStatus.PENDING:
        return <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-4 bg-black/50 p-3 rounded-lg transition-all duration-300">
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <p className={`text-sm ${
        status === PipelineStepStatus.COMPLETED ? 'text-gray-300' : 
        status === PipelineStepStatus.RUNNING ? 'text-white' : 'text-gray-500'
      }`}>
        {text}
      </p>
    </div>
  );
};

export default PipelineStepComponent;