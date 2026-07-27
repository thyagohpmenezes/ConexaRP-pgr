import React from 'react';
import { SurveyStatus } from '../../domain/types';
import { getStatusMeta } from '../../domain/status';

interface Props {
  status: SurveyStatus;
  className?: string;
}

export const SurveyStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const meta = getStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${meta.badgeClass} ${className}`}
      title={meta.description}
    >
      <span className={`w-2 h-2 rounded-full ${meta.dotClass}`}></span>
      {meta.emoji} {meta.label}
    </span>
  );
};
