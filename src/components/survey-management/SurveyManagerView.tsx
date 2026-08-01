// src/components/survey-management/SurveyManagerView.tsx
import React from 'react';
import { Company } from '../../domain/types';
import { WorkspaceMonitoringDashboard } from './WorkspaceMonitoringDashboard';
import { MOCK_COMPANIES } from '../../data/mockData';

interface Props {
  companies?: Company[];
  assessments?: any[];
  onCreateCompany?: (newCompany: Omit<Company, 'id'>) => void;
  onNavigateToAssessments?: (companyId?: string) => void;
  onNavigateToInventory?: (companyId?: string) => void;
}

export const SurveyManagerView: React.FC<Props> = ({
  companies = MOCK_COMPANIES,
  assessments = [],
  onCreateCompany,
  onNavigateToAssessments,
  onNavigateToInventory,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <WorkspaceMonitoringDashboard 
        companies={companies}
        assessments={assessments}
        onCreateCompany={onCreateCompany}
        onNavigateToAssessments={onNavigateToAssessments}
        onNavigateToInventory={onNavigateToInventory}
      />
    </div>
  );
};

export default SurveyManagerView;
