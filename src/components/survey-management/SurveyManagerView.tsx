// src/components/survey-management/SurveyManagerView.tsx
import React from 'react';
import { Company } from '../../domain/types';
import { WorkspaceMonitoringDashboard } from './WorkspaceMonitoringDashboard';
import { MOCK_COMPANIES } from '../../data/mockData';

interface Props {
  companies?: Company[];
  assessments?: any[];
  onCreateCompany?: (newCompany: Omit<Company, 'id'>) => void;
  onUpdateCompany?: (id: string, updates: Partial<Company>) => Promise<any>;
  onNavigateToAssessments?: (companyId?: string) => void;
  onNavigateToInventory?: (companyId?: string) => void;
}

export const SurveyManagerView: React.FC<Props> = ({
  companies = MOCK_COMPANIES,
  assessments = [],
  onCreateCompany,
  onUpdateCompany,
  onNavigateToAssessments,
  onNavigateToInventory,
}) => {
  return (
    <div className="space-y-6 w-full pb-12">
      <WorkspaceMonitoringDashboard 
        companies={companies}
        assessments={assessments}
        onCreateCompany={onCreateCompany}
        onUpdateCompany={onUpdateCompany}
        onNavigateToAssessments={onNavigateToAssessments}
        onNavigateToInventory={onNavigateToInventory}
      />
    </div>
  );
};

export default SurveyManagerView;
