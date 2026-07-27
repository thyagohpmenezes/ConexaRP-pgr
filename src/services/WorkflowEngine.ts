import { WorkflowState, ResearchProject } from '../domain/types';
import { canTransition, evaluateAutoState, WORKFLOW_STATES } from '../domain/workflow';

export { canTransition, evaluateAutoState, WORKFLOW_STATES };

export interface WorkflowTransitionResult {
  success: boolean;
  previousState: WorkflowState;
  newState: WorkflowState;
  reason?: string;
}

/**
 * Motor de Workflow para Gerenciamento de Ciclo de Vida da Pesquisa Organizacional.
 */
export class WorkflowEngine {
  /**
   * Tenta transicionar um projeto para um novo estado com base em regras e quadro dinâmico
   */
  public transitionTo(
    project: ResearchProject,
    targetState: WorkflowState,
    currentEmployeeCount?: number
  ): WorkflowTransitionResult {
    const currentState = project.status;

    if (currentState === targetState) {
      return {
        success: true,
        previousState: currentState,
        newState: targetState,
      };
    }

    const check = canTransition(currentState, targetState, project, currentEmployeeCount);

    if (!check.allowed) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        reason: check.reason,
      };
    }

    project.status = targetState;
    project.updatedAt = new Date().toISOString();

    return {
      success: true,
      previousState: currentState,
      newState: targetState,
    };
  }

  /**
   * Recalcula o estado do projeto automaticamente com base nas métricas e quadro estritamente dinâmico
   */
  public evaluateAndPromote(
    project: ResearchProject,
    currentEmployeeCount?: number
  ): WorkflowTransitionResult {
    const previousState = project.status;
    const recommendedState = evaluateAutoState(project, currentEmployeeCount);

    if (previousState !== recommendedState) {
      project.status = recommendedState;
      project.updatedAt = new Date().toISOString();
    }

    return {
      success: true,
      previousState,
      newState: project.status,
    };
  }

  /**
   * Retorna os metadados do estado atual
   */
  public getStateInfo(state: WorkflowState) {
    return WORKFLOW_STATES[state];
  }
}

export const workflowEngine = new WorkflowEngine();
