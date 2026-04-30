import { DomainData } from './types';

export const DOMAINS = [
  { id: 'ritmo_volume', name: 'Ritmo e Volume de Trabalho', items: [1, 2] },
  { id: 'metas_cobranca', name: 'Metas e Cobrança', items: [3, 4] },
  { id: 'pausas_jornada', name: 'Pausas e Jornada', items: [5, 6] },
  { id: 'lideranca', name: 'Qualidade da Liderança', items: [7, 8] },
  { id: 'relacoes', name: 'Relações Interpessoais', items: [10] },
  { id: 'assedio_violencia', name: 'Assédio e Violência', items: [11, 12] },
  { id: 'medo_represalia', name: 'Medo de Represália', items: [13] },
  { id: 'carga_mental', name: 'Carga Mental', items: [14] },
  { id: 'recursos', name: 'Recursos Disponíveis', items: [9] },
  { id: 'inseguranca', name: 'Insegurança Organizacional', items: [15] }
];

export const INITIAL_DOMAIN_DATA: DomainData[] = DOMAINS.map(d => ({
  id: d.id,
  name: d.name,
  employeeMean: 0,
  managerMean: 0,
  criticalFrequency: 0,
  items: d.items
}));

export const HAZARD_MASTER = [
  {
    id: 'h1',
    domainId: 'ritmo_volume',
    hazard: 'Sobrecarga de trabalho',
    risk: 'Exposição a volume excessivo de tarefas, pressão por produtividade e acúmulo de demandas acima da capacidade operacional.',
    possibleDamages: 'Estresse ocupacional, fadiga mental, erro operacional, adoecimento psíquico, absenteísmo e afastamentos.',
    recommendation: 'Revisar o dimensionamento de pessoal e redistribuir tarefas para evitar picos de sobrecarga.'
  },
  {
    id: 'h2',
    domainId: 'ritmo_volume',
    hazard: 'Ritmo de trabalho excessivo',
    risk: 'Exigência de execução acelerada e contínua, com baixa margem para pausas e recuperação.',
    possibleDamages: 'Fadiga, perda de atenção, irritabilidade, aumento de incidentes, acidentes e esgotamento.',
    recommendation: 'Implementar mecanismos de controle de ritmo e garantir a autonomia dos colaboradores sobre o fluxo de trabalho.'
  },
  {
    id: 'h3',
    domainId: 'pausas_jornada',
    hazard: 'Pausas insuficientes ou interrompidas',
    risk: 'Ausência de descanso efetivo durante a jornada e impossibilidade de recuperação física e cognitiva.',
    possibleDamages: 'Exaustão, redução de desempenho, dores e desconfortos associados, erros e adoecimento relacionado ao trabalho.',
    recommendation: 'Garantir o cumprimento rigoroso das pausas regulamentares e criar áreas de descompressão adequadas.'
  },
  {
    id: 'h4',
    domainId: 'metas_cobranca',
    hazard: 'Metas e prazos incompatíveis',
    risk: 'Cobrança por resultados sem correspondência com efetivo, recursos e tempo disponíveis.',
    possibleDamages: 'Ansiedade, pressão psicológica, conflito, retrabalho, adoecimento e afastamento.',
    recommendation: 'Estabelecer metas baseadas na capacidade real da equipe e revisar prazos de entrega em conjunto com os executores.'
  },
  {
    id: 'h6',
    domainId: 'lideranca',
    hazard: 'Falhas de liderança e apoio gerencial',
    risk: 'Ausência de orientação clara, suporte insuficiente e cobrança sem acompanhamento.',
    possibleDamages: 'Insegurança, tensão, desorganização do trabalho, aumento de erros e adoecimento ocupacional.',
    recommendation: 'Realizar treinamentos de liderança focados em suporte psicossocial e feedback construtivo.'
  },
  {
    id: 'h7',
    domainId: 'relacoes',
    hazard: 'Relações interpessoais conflituosas',
    risk: 'Ambiente com comunicação hostil, tensão recorrente e conflitos frequentes.',
    possibleDamages: 'Estresse, sofrimento psíquico, queda de engajamento, afastamentos e piora do clima organizacional.',
    recommendation: 'Implementar programas de mediação de conflitos e promover atividades de integração e comunicação não-violenta.'
  },
  {
    id: 'h8',
    domainId: 'assedio_violencia',
    hazard: 'Assédio moral, humilhação ou violência psicológica',
    risk: 'Exposição a constrangimento, perseguição, intimidação, exposição vexatória ou abuso de poder.',
    possibleDamages: 'Ansiedade, depressão, sofrimento psíquico importante, afastamento, adoecimento e dano moral organizacional.',
    recommendation: 'Fortalecer os canais de denúncia anônima e aplicar protocolos rígidos de tolerância zero ao assédio.'
  },
  {
    id: 'h9',
    domainId: 'medo_represalia',
    hazard: 'Medo de represália',
    risk: 'Ambiente onde relatar problemas, falhas ou abusos gera receio de punição ou retaliação.',
    possibleDamages: 'Silenciamento, subnotificação, manutenção de riscos, ansiedade e perpetuação do problema.',
    recommendation: 'Criar uma cultura de segurança psicológica onde o erro seja tratado como oportunidade de aprendizado, sem punições injustas.'
  },
  {
    id: 'h10',
    domainId: 'carga_mental',
    hazard: 'Carga mental elevada',
    risk: 'Exigência contínua de atenção, memória, tomada de decisão e processamento simultâneo de informações.',
    possibleDamages: 'Fadiga cognitiva, erros, lentificação, irritabilidade, estresse e redução do desempenho seguro.',
    recommendation: 'Otimizar interfaces de sistemas e fluxos de informação para reduzir a demanda cognitiva desnecessária.'
  },
  {
    id: 'h11',
    domainId: 'recursos',
    hazard: 'Recursos insuficientes para o trabalho',
    risk: 'Falta de pessoal, ferramentas, sistemas, materiais ou suporte operacional adequado.',
    possibleDamages: 'Sobrecarga, improvisação, retrabalho, frustração, erros e adoecimento ocupacional.',
    recommendation: 'Realizar auditoria de recursos e investir na renovação de ferramentas e suporte tecnológico necessário.'
  },
  {
    id: 'h12',
    domainId: 'inseguranca',
    hazard: 'Insegurança organizacional',
    risk: 'Alterações frequentes sem comunicação adequada, instabilidade e desorganização do processo de trabalho.',
    possibleDamages: 'Ansiedade, insegurança, queda de produtividade, conflito, estresse e prejuízo à saúde mental.',
    recommendation: 'Melhorar a transparência da comunicação institucional sobre mudanças e estabilizar processos internos.'
  }
];

export const EMPLOYEE_POSITIVE_ITEMS = [2, 3, 5, 6, 7, 8, 9, 10, 13];
export const MANAGER_POSITIVE_ITEMS = [2, 3, 5, 6, 7, 8, 9, 10, 13];

export const SOURCE_WEIGHTS = {
  colaboradores: 4,
  gestores: 3,
  checklist: 4,
  indicadores: 5,
  documentos: 3,
  entrevistas: 2,
  aet_aep: 5
};
