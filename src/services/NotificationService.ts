import { WorkflowState } from '../domain/types';
import { WORKFLOW_STATES } from '../domain/workflow';

export interface SystemNotification {
  id: string;
  projectId: string;
  projectTitle: string;
  companyName: string;
  state: WorkflowState;
  message: string;
  timestamp: string;
  read: boolean;
}

/**
 * Serviço de Notificações Operacionais e Alertas do Workflow de Pesquisas.
 */
export class NotificationService {
  private notifications: SystemNotification[] = [];

  public notifyStateChange(
    projectId: string,
    projectTitle: string,
    companyName: string,
    newState: WorkflowState
  ): SystemNotification {
    const stateInfo = WORKFLOW_STATES[newState];
    const notification: SystemNotification = {
      id: `notif-${Date.now()}`,
      projectId,
      projectTitle,
      companyName,
      state: newState,
      message: `A pesquisa "${projectTitle}" da empresa ${companyName} mudou para o estado: ${stateInfo.label}.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    this.notifications.unshift(notification);
    return notification;
  }

  public getUnreadNotifications(): SystemNotification[] {
    return this.notifications.filter((n) => !n.read);
  }

  public markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }
}

export const notificationService = new NotificationService();
