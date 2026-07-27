import React from 'react';
import { WorkflowState } from '../../domain/types';
import { WORKFLOW_STATES } from '../../domain/workflow';

interface Props {
  state: WorkflowState;
  showStep?: boolean;
}

export const SurveyWorkflowBadge: React.FC<Props> = ({ state, showStep = true }) => {
  const meta = WORKFLOW_STATES[state] || WORKFLOW_STATES.PLANNED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs transition-all ${meta.badgeClass}`}
      title={meta.description}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse"></span>
      <span>
        {showStep ? meta.label : meta.label.replace(/^\d+\.\s*/, '')}
      </span>
    </span>
  );
};
