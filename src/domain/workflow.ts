import { WorkflowState, ResearchProject } from './types';

export interface WorkflowStateMetadata {
  state: WorkflowState;
  label: string;
  badgeClass: string;
  description: string;
  stepNumber: number;
}

export const WORKFLOW_STATES: Record<WorkflowState, WorkflowStateMetadata> = {
  PLANNED: {
    state: 'PLANNED',
    label: '1. Planejada',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Projeto de pesquisa criado e aguardando definição das fontes de coleta.',
    stepNumber: 1,
  },
  CONFIGURING: {
    state: 'CONFIGURING',
    label: '2. Em Configuração',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Formulários e links das fontes de coleta sendo gerados e configurados.',
    stepNumber: 2,
  },
  COLLECTING: {
    state: 'COLLECTING',
    label: '3. Coleta Ativa',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Coleta de respostas dos colaboradores em andamento.',
    stepNumber: 3,
  },
  WAITING_MANAGER: {
    state: 'WAITING_MANAGER',
    label: '4. Aguardando Gestor',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Amostra de colaboradores atingida (≥70%). Aguardando resposta da liderança.',
    stepNumber: 4,
  },
  READY_FOR_TABULATION: {
    state: 'READY_FOR_TABULATION',
    label: '5. Liberada p/ Tabulação',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Metas atingidas e gestor respondeu. Pronta para tabulação automatizada.',
    stepNumber: 5,
  },
  TABULATING: {
    state: 'TABULATING',
    label: '6. Tabulando Dados',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Processando respostas brutas e calculando médias dos domínios psicossociais.',
    stepNumber: 6,
  },
  ASSESSMENT_CREATED: {
    state: 'ASSESSMENT_CREATED',
    label: '7. Avaliação Gerada',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Médias psicossociais injetadas no fluxo de Avaliação GRO/PGR.',
    stepNumber: 7,
  },
  RISK_INVENTORY_UPDATED: {
    state: 'RISK_INVENTORY_UPDATED',
    label: '8. Inventário Atualizado',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Matriz de riscos e inventário da empresa atualizados com sucesso.',
    stepNumber: 8,
  },
  FINISHED: {
    state: 'FINISHED',
    label: '9. Concluída',
    badgeClass: 'bg-emerald-600 text-white border-emerald-700',
    description: 'Ciclo completo da pesquisa finalizado e arquivado para consulta.',
    stepNumber: 9,
  },
  ARCHIVED: {
    state: 'ARCHIVED',
    label: 'Arquivada',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    description: 'Projeto arquivado para histórico temporal.',
    stepNumber: 10,
  },
};

/**
  Matriz estrita de transições permitidas entre estados do Workflow
 */
export const ALLOWED_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  PLANNED: ['CONFIGURING', 'ARCHIVED'],
  CONFIGURING: ['COLLECTING', 'PLANNED', 'ARCHIVED'],
  COLLECTING: ['WAITING_MANAGER', 'READY_FOR_TABULATION', 'CONFIGURING', 'ARCHIVED'],
  WAITING_MANAGER: ['READY_FOR_TABULATION', 'COLLECTING', 'ARCHIVED'],
  READY_FOR_TABULATION: ['TABULATING', 'WAITING_MANAGER', 'ARCHIVED'],
  TABULATING: ['ASSESSMENT_CREATED', 'READY_FOR_TABULATION'],
  ASSESSMENT_CREATED: ['RISK_INVENTORY_UPDATED', 'FINISHED'],
  RISK_INVENTORY_UPDATED: ['FINISHED'],
  FINISHED: ['ARCHIVED'],
  ARCHIVED: ['PLANNED'],
};

/**
 * Avalia se uma transição de estado é válida com base no estado do projeto
 */
export function canTransition(
  currentState: WorkflowState,
  targetState: WorkflowState,
  project: ResearchProject,
  currentEmployeeCount?: number
): { allowed: boolean; reason?: string } {
  const allowedNext = ALLOWED_TRANSITIONS[currentState] || [];
  if (!allowedNext.includes(targetState)) {
    return {
      allowed: false,
      reason: `Transição direta de ${WORKFLOW_STATES[currentState].label} para ${WORKFLOW_STATES[targetState].label} não é permitida pelo Workflow.`,
    };
  }

  // Validação de regras de negócio por transição
  if (targetState === 'COLLECTING' && project.sources.length === 0 && !project.workspaceBinding) {
    return {
      allowed: false,
      reason: 'O projeto precisa estar vinculado a uma pasta de pesquisa no Google Workspace para iniciar a coleta.',
    };
  }

  if (targetState === 'READY_FOR_TABULATION') {
    const collabSource = project.sources.find((s) => s.formType === 'COLABORADOR');
    const managerSource = project.sources.find((s) => s.formType === 'GESTOR');

    const collabCount = collabSource?.responseCount || 0;
    const managerCount = managerSource?.responseCount || 0;
    // Cálculo estritamente dinâmico perante o cadastro em tempo real da empresa
    const target = currentEmployeeCount ?? project.targetEmployeeCount ?? 1;
    const pct = (collabCount / target) * 100;

    if (pct < 70) {
      return {
        allowed: false,
        reason: `Mínimo de 70% de responses dos colaboradores necessário (Atual: ${Math.round(pct)}% sobre o quadro dinâmico de ${target} funcionários).`,
      };
    }

    if (managerSource && managerCount === 0) {
      return {
        allowed: false,
        reason: 'A resposta da liderança (Formulário de Gestor) é obrigatória para liberar a tabulação.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Calcula o próximo estado automático do projeto com base nas métricas das fontes de coleta e quadro dinâmico
 */
export function evaluateAutoState(
  project: ResearchProject,
  currentEmployeeCount?: number
): WorkflowState {
  // Estados finais não sofrem recálculo automático (bloqueio protetor da tabulação concluída)
  if (
    project.status === 'TABULATING' ||
    project.status === 'ASSESSMENT_CREATED' ||
    project.status === 'RISK_INVENTORY_UPDATED' ||
    project.status === 'FINISHED' ||
    project.status === 'ARCHIVED'
  ) {
    return project.status;
  }

  if (project.sources.length === 0 && !project.workspaceBinding) {
    return 'PLANNED';
  }

  const collabSource = project.sources.find((s) => s.formType === 'COLABORADOR');
  const managerSource = project.sources.find((s) => s.formType === 'GESTOR');

  const collabCount = collabSource?.responseCount || 0;
  const managerCount = managerSource?.responseCount || 0;
  const totalResponses = collabCount + managerCount;

  if (totalResponses === 0 && !project.workspaceBinding) {
    return 'CONFIGURING';
  }

  // Meta dinamicamente obtida contra o cadastro ativo da empresa
  const target = currentEmployeeCount ?? project.targetEmployeeCount ?? 1;
  const pct = (collabCount / target) * 100;

  if (pct >= 70) {
    if (managerSource && managerCount === 0) {
      return 'WAITING_MANAGER';
    }
    return 'READY_FOR_TABULATION';
  }

  return 'COLLECTING';
}
