import { SurveyStatus } from './types';

export interface StatusMeta {
  status: SurveyStatus;
  label: string;
  emoji: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const STATUS_METADATA: Record<SurveyStatus, StatusMeta> = {
  NONE: {
    status: 'NONE',
    label: 'Não Iniciado',
    emoji: '🔴',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500 animate-pulse',
    description: '0 respostas de colaboradores e 0 respostas de gestores',
  },
  IN_PROGRESS: {
    status: 'IN_PROGRESS',
    label: 'Em Andamento',
    emoji: '🟠',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    description: 'Percentual de engajamento inferior a 70%',
  },
  WAITING_MANAGER: {
    status: 'WAITING_MANAGER',
    label: 'Aguardando Gestor',
    emoji: '🟡',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    dotClass: 'bg-yellow-500 animate-bounce',
    description: 'Percentual ≥ 70% e nenhuma resposta de gestor',
  },
  READY: {
    status: 'READY',
    label: 'Liberado para Tabulação',
    emoji: '🟢',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    description: 'Percentual ≥ 70% e pelo menos 1 resposta de gestor',
  },
};

export function getStatusMeta(status: SurveyStatus): StatusMeta {
  return STATUS_METADATA[status] || STATUS_METADATA.NONE;
}
