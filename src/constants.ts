import { DomainData } from './types';

export const DOMAINS = [
  { id: 'ritmo_volume', name: 'Ritmo e Volume de Trabalho', items: [1, 2] },
  { id: 'metas_cobranca', name: 'Metas e Cobrança', items: [3] },
  { id: 'pausas_jornada', name: 'Pausas e Jornada', items: [4, 5] },
  { id: 'lideranca', name: 'Qualidade da Liderança e Papéis', items: [6, 7, 8] },
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
    risk: 'Pressão ocupacional excessiva',
    possibleDamages: 'Tensão psicológica, fadiga mental',
    recommendation: 'Revisar o dimensionamento de pessoal e redistribuir tarefas para evitar picos de sobrecarga.'
  },
  {
    id: 'h2',
    domainId: 'ritmo_volume',
    hazard: 'Ritmo de trabalho excessivo',
    risk: 'Exigência de desempenho contínuo',
    possibleDamages: 'Estresse ocupacional, fadiga mental',
    recommendation: 'Implementar mecanismos de controle de ritmo e garantir a autonomia dos colaboradores sobre o fluxo de trabalho.'
  },
  {
    id: 'h2b',
    domainId: 'ritmo_volume',
    hazard: 'Volume elevado de atividades',
    risk: 'Sobrecarga de trabalho',
    possibleDamages: 'Estresse, fadiga mental, redução da concentração',
    recommendation: 'Reavaliar prioridades de entrega e otimizar processos operacionais.'
  },
  {
    id: 'h3',
    domainId: 'pausas_jornada',
    hazard: 'Pausas insuficientes',
    risk: 'Recuperação inadequada durante a jornada',
    possibleDamages: 'Fadiga física e mental',
    recommendation: 'Garantir o cumprimento rigoroso das pausas regulamentares e criar áreas de descompressão adequadas.'
  },
  {
    id: 'h4',
    domainId: 'metas_cobranca',
    hazard: 'Sobrecarga de trabalho',
    risk: 'Pressão ocupacional excessiva',
    possibleDamages: 'Tensão psicológica, fadiga mental',
    recommendation: 'Estabelecer metas baseadas na capacidade real da equipe e revisar prazos de entrega em conjunto com os executores.'
  },
  {
    id: 'h6',
    domainId: 'lideranca',
    hazard: 'Comunicação insuficiente da gestão',
    risk: 'Falhas de liderança e apoio gerencial',
    possibleDamages: 'Estresse, fadiga',
    recommendation: 'Realizar treinamentos de liderança focados em suporte psicossocial e comunicação clara.'
  },
  {
    id: 'h7',
    domainId: 'relacoes',
    hazard: 'Relações interpessoais conflituosas',
    risk: 'Ambiente com tensão e falhas de comunicação',
    possibleDamages: 'Estresse, fadiga, Transtornos mentais e comportamentais',
    recommendation: 'Implementar programas de mediação de conflitos e promover atividades de integração e comunicação não-violenta.'
  },
  {
    id: 'h7b',
    domainId: 'relacoes',
    hazard: 'Ambiente de trabalho pouco colaborativo',
    risk: 'Comunicação inadequada entre equipes e Dificuldade de cooperação',
    possibleDamages: 'Estresse, fadiga mental, Transtornos mentais e comportamentais',
    recommendation: 'Fomentar cultura colaborativa e canais abertos de diálogo entre equipes.'
  },
  {
    id: 'h8',
    domainId: 'assedio_violencia',
    hazard: 'Exigências extremas de carga de trabalho e/ou relações abusivas',
    risk: 'Relações interpessoais nocivas: situações de assédio moral e sexual',
    possibleDamages: 'Transtornos mentais e comportamentais',
    recommendation: 'Fortalecer os canais de denúncia anônima e aplicar protocolos rígidos de tolerância zero ao assédio.'
  },
  {
    id: 'h9',
    domainId: 'medo_represalia',
    hazard: 'Ambiente de trabalho pouco colaborativo',
    risk: 'Comunicação inadequada entre equipes e Dificuldade de cooperação',
    possibleDamages: 'Estresse, fadiga mental, Transtornos mentais e comportamentais',
    recommendation: 'Criar uma cultura de segurança psicológica onde o erro seja tratado como oportunidade de aprendizado.'
  },
  {
    id: 'h10',
    domainId: 'carga_mental',
    hazard: 'Carga mental elevada',
    risk: 'Exposição a alto nível de concentração, atenção ou memória',
    possibleDamages: 'Estresse, fadiga mental',
    recommendation: 'Otimizar interfaces de sistemas e fluxos de informação para reduzir a demanda cognitiva desnecessária.'
  },
  {
    id: 'h11',
    domainId: 'recursos',
    hazard: 'Recursos insuficientes para o trabalho',
    risk: 'Sobrecarga operacional',
    possibleDamages: 'Estresse, fadiga',
    recommendation: 'Realizar auditoria de recursos e investir na renovação de ferramentas e suporte tecnológico necessário.'
  },
  {
    id: 'h12',
    domainId: 'inseguranca',
    hazard: 'Insegurança organizacional',
    risk: 'Desorganização operacional',
    possibleDamages: 'Estresse, retrabalho, fadiga',
    recommendation: 'Melhorar a transparência da comunicação institucional sobre mudanças e estabilizar processos internos.'
  }
];

export const EMPLOYEE_POSITIVE_ITEMS = [1, 3, 4, 6, 7, 8, 10, 13];
export const MANAGER_POSITIVE_ITEMS = [1, 3, 4, 6, 7, 8, 10, 13];

export const SOURCE_WEIGHTS = {
  colaboradores: 4,
  gestores: 3,
  checklist: 4,
  indicadores: 5,
  documentos: 3,
  entrevistas: 2,
  aet_aep: 5
};
