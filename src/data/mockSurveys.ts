import { CompanySurveyMetric, SurveyStatus } from '../types/survey';

export function calculateStatus(
  collabResponses: number,
  managerResponses: number,
  employeeCount: number
): SurveyStatus {
  if (collabResponses === 0 && managerResponses === 0) {
    return 'NONE';
  }
  if (employeeCount <= 0) {
    return 'IN_PROGRESS';
  }
  const total = collabResponses + managerResponses;
  const pct = (total / employeeCount) * 100;

  if (pct >= 70) {
    return managerResponses >= 1 ? 'READY' : 'WAITING_MANAGER';
  }
  return 'IN_PROGRESS';
}

export function buildMetricItem(
  id: string,
  clientName: string,
  economicGroup: string | undefined,
  companyName: string,
  employeeCount: number,
  collabResponses: number,
  managerResponses: number,
  lastUpdated: string | null,
  hasCollabForm = true,
  hasManagerForm = true
): CompanySurveyMetric {
  const totalResponses = collabResponses + managerResponses;
  const participationPercentage = employeeCount > 0 ? (totalResponses / employeeCount) * 100 : 0;
  const missingResponses = Math.max(0, employeeCount - totalResponses);
  const status = calculateStatus(collabResponses, managerResponses, employeeCount);

  return {
    id,
    clientName,
    economicGroup,
    companyName,
    employeeCount,
    collabResponses,
    managerResponses,
    totalResponses,
    participationPercentage,
    missingResponses,
    status,
    lastUpdated,
    hasCollabForm,
    hasManagerForm,
    collabFormUrl: hasCollabForm ? `https://docs.google.com/forms/d/mock-collab-${id}` : undefined,
    managerFormUrl: hasManagerForm ? `https://docs.google.com/forms/d/mock-manager-${id}` : undefined,
    collabSheetUrl: hasCollabForm ? `https://docs.google.com/spreadsheets/d/mock-sheet-collab-${id}` : undefined,
    managerSheetUrl: hasManagerForm ? `https://docs.google.com/spreadsheets/d/mock-sheet-manager-${id}` : undefined,
  };
}

export const INITIAL_MOCK_SURVEYS: CompanySurveyMetric[] = [
  // ================= CLIENT 1: Grupo Sertão S.A. (12 empresas) =================
  // --- Grupo Econômico 1: Sertão Industrial & Metalurgia ---
  buildMetricItem('c1-g1-e1', 'Grupo Sertão S.A.', 'Sertão Industrial', 'Metalúrgica Sertão - Matriz', 120, 85, 5, '2026-07-27 11:45'), // 🟢 Liberada (90/120 = 75%)
  buildMetricItem('c1-g1-e2', 'Grupo Sertão S.A.', 'Sertão Industrial', 'Metalúrgica Sertão - Filial Recife', 60, 50, 0, '2026-07-27 09:12'), // 🟡 Aguardando Gestor (50/60 = 83.3%)
  buildMetricItem('c1-g1-e3', 'Grupo Sertão S.A.', 'Sertão Industrial', 'Fundição Sertão Norte', 85, 30, 2, '2026-07-26 18:30'), // 🟠 Em Andamento (32/85 = 37.6%)
  buildMetricItem('c1-g1-e4', 'Grupo Sertão S.A.', 'Sertão Industrial', 'Usinagem de Precisão Sertão', 40, 0, 0, null), // 🔴 Sem Respostas
  buildMetricItem('c1-g1-e5', 'Grupo Sertão S.A.', 'Sertão Industrial', 'Estamparia Sertão Sul', 50, 42, 3, '2026-07-27 14:00'), // 🟢 Liberada (45/50 = 90%)

  // --- Grupo Econômico 2: Sertão Logística & Serviços ---
  buildMetricItem('c1-g2-e1', 'Grupo Sertão S.A.', 'Sertão Logística', 'Sertão Transportes & Cargas', 210, 160, 12, '2026-07-27 13:05'), // 🟢 Liberada (172/210 = 81.9%)
  buildMetricItem('c1-g2-e2', 'Grupo Sertão S.A.', 'Sertão Logística', 'Armazéns Gerais Sertão', 95, 75, 0, '2026-07-27 10:20'), // 🟡 Aguardando Gestor (75/95 = 78.9%)
  buildMetricItem('c1-g2-e3', 'Grupo Sertão S.A.', 'Sertão Logística', 'Sertão Frota & Manutenção', 70, 25, 1, '2026-07-25 16:40'), // 🟠 Em Andamento (26/70 = 37.1%)
  buildMetricItem('c1-g2-e4', 'Grupo Sertão S.A.', 'Sertão Logística', 'Sertão Distribuidora Express', 110, 0, 0, null), // 🔴 Sem Respostas

  // --- Independentes (Cliente 1) ---
  buildMetricItem('c1-ind-e1', 'Grupo Sertão S.A.', undefined, 'Sertão Corretora de Seguros', 30, 26, 2, '2026-07-27 08:30'), // 🟢 Liberada (28/30 = 93.3%)
  buildMetricItem('c1-ind-e2', 'Grupo Sertão S.A.', undefined, 'Sertão Serviços Ambientais', 45, 38, 0, '2026-07-26 19:15'), // 🟡 Aguardando Gestor (38/45 = 84.4%)
  buildMetricItem('c1-ind-e3', 'Grupo Sertão S.A.', undefined, 'Sertão Treinamento Operacional', 25, 20, 0, '2026-07-27 12:00', true, false), // Sem form gestor - 🟡 Aguardando Gestor (20/25 = 80%)

  // ================= CLIENT 2: Holding Apex Brasil (10 empresas) =================
  // --- Grupo Econômico: Apex Retail & Varejo ---
  buildMetricItem('c2-g1-e1', 'Holding Apex Brasil', 'Apex Retail', 'Apex Lojas de Departamento', 350, 280, 20, '2026-07-27 14:10'), // 🟢 Liberada (300/350 = 85.7%)
  buildMetricItem('c2-g1-e2', 'Holding Apex Brasil', 'Apex Retail', 'Apex Supermercados Centro', 180, 140, 0, '2026-07-27 11:00'), // 🟡 Aguardando Gestor (140/180 = 77.7%)
  buildMetricItem('c2-g1-e3', 'Holding Apex Brasil', 'Apex Retail', 'Apex Eletrônicos & Modas', 90, 45, 3, '2026-07-26 15:20'), // 🟠 Em Andamento (48/90 = 53.3%)
  buildMetricItem('c2-g1-e4', 'Holding Apex Brasil', 'Apex Retail', 'Apex Conveniência 24h', 65, 0, 0, null), // 🔴 Sem Respostas

  // --- Independentes (Cliente 2) ---
  buildMetricItem('c2-ind-e1', 'Holding Apex Brasil', undefined, 'Apex Digital Tech Lab', 80, 72, 8, '2026-07-27 13:50'), // 🟢 Liberada (80/80 = 100%)
  buildMetricItem('c2-ind-e2', 'Holding Apex Brasil', undefined, 'Apex Serviços Financeiros', 140, 115, 0, '2026-07-27 09:40'), // 🟡 Aguardando Gestor (115/140 = 82.1%)
  buildMetricItem('c2-ind-e3', 'Holding Apex Brasil', undefined, 'Apex Consultoria Imobiliária', 55, 20, 1, '2026-07-25 17:00'), // 🟠 Em Andamento (21/55 = 38.1%)
  buildMetricItem('c2-ind-e4', 'Holding Apex Brasil', undefined, 'Apex Gestão de Ativos', 35, 0, 0, null), // 🔴 Sem Respostas
  buildMetricItem('c2-ind-e5', 'Holding Apex Brasil', undefined, 'Apex Pesquisa de Mercado', 20, 0, 2, '2026-07-26 10:30', false, true), // Sem form collab (apenas gestores) - 🟠 Em Andamento (2/20 = 10%)
  buildMetricItem('c2-ind-e6', 'Holding Apex Brasil', undefined, 'Apex Educação Corporativa', 40, 32, 3, '2026-07-27 12:45'), // 🟢 Liberada (35/40 = 87.5%)

  // ================= CLIENT 3: Rede Viva Saúde & Care (8 empresas) =================
  buildMetricItem('c3-ind-e1', 'Rede Viva Saúde', undefined, 'Hospital Viva Saúde - Unidade Central', 500, 420, 35, '2026-07-27 14:15'), // 🟢 Liberada (455/500 = 91%)
  buildMetricItem('c3-ind-e2', 'Rede Viva Saúde', undefined, 'Hospital Viva Saúde - Unidade Sul', 280, 210, 0, '2026-07-27 10:50'), // 🟡 Aguardando Gestor (210/280 = 75%)
  buildMetricItem('c3-ind-e3', 'Rede Viva Saúde', undefined, 'Clínica Viva Diagnósticos por Imagem', 110, 60, 4, '2026-07-26 14:30'), // 🟠 Em Andamento (64/110 = 58.1%)
  buildMetricItem('c3-ind-e4', 'Rede Viva Saúde', undefined, 'Laboratório Viva Análises Clínicas', 160, 135, 10, '2026-07-27 13:20'), // 🟢 Liberada (145/160 = 90.6%)
  buildMetricItem('c3-ind-e5', 'Rede Viva Saúde', undefined, 'Viva Odontologia Especializada', 45, 0, 0, null), // 🔴 Sem Respostas
  buildMetricItem('c3-ind-e6', 'Rede Viva Saúde', undefined, 'Viva Pronto Atendimento 24h', 130, 98, 0, '2026-07-27 08:15'), // 🟡 Aguardando Gestor (98/130 = 75.3%)
  buildMetricItem('c3-ind-e7', 'Rede Viva Saúde', undefined, 'Viva Farmácia Hospitalar', 75, 30, 2, '2026-07-25 11:20'), // 🟠 Em Andamento (32/75 = 42.6%)
  buildMetricItem('c3-ind-e8', 'Rede Viva Saúde', undefined, 'Viva Home Care & Atendimento', 90, 78, 6, '2026-07-27 12:10'), // 🟢 Liberada (84/90 = 93.3%)
];
