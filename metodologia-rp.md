# Guia Técnico de Implementação — Avaliação de Riscos Psicossociais (GRO/PGR)

> **Finalidade:** Referência completa de lógicas de cálculo, metodologia e regras de negócio para implementação do módulo de avaliação de riscos psicossociais no sistema Antigravity.  
> **Base normativa:** NR-1 (cap. 1.5), Portaria MTE nº 1.419/2024, NR-17, NR-7, NR-9, ABNT ISO 45003:2021.

---

## Índice

1. [Visão Geral do Fluxo](#1-visão-geral-do-fluxo)
2. [Fontes de Evidência e Pesos](#2-fontes-de-evidência-e-pesos)
3. [Tabulação — Pesquisa com Colaboradores](#3-tabulação--pesquisa-com-colaboradores)
4. [Tabulação — Pesquisa com Gestores](#4-tabulação--pesquisa-com-gestores)
5. [Tabulação — Checklist da Empresa](#5-tabulação--checklist-da-empresa)
6. [Triangulação de Evidências](#6-triangulação-de-evidências)
7. [Cálculos Adicionais](#7-cálculos-adicionais)
8. [Matriz 5×5 — Probabilidade × Severidade](#8-matriz-5×5--probabilidade--severidade)
9. [Risco Residual e Prioridade de Tratamento](#9-risco-residual-e-prioridade-de-tratamento)
10. [Catálogo de Perigos, Riscos e Danos](#10-catálogo-de-perigos-riscos-e-danos)
11. [Itens com Leitura Invertida](#11-itens-com-leitura-invertida)
12. [Regras de Registro e Saída](#12-regras-de-registro-e-saída)
13. [Estrutura Mínima do Relatório Final](#13-estrutura-mínima-do-relatório-final)

---

## 1. Visão Geral do Fluxo

O sistema deve implementar o seguinte pipeline de avaliação, na ordem abaixo:

```
[1] Coleta das pesquisas (Colaboradores + Gestores + Checklist)
        ↓
[2] Tabulação individual de cada fonte
        ↓
[3] Normalização dos scores (0–1)
        ↓
[4] Triangulação ponderada com intensidade e confiabilidade
        ↓
[5] Cálculo de divergência Colaboradores × Gestores
        ↓
[6] Grau de convergência entre fontes
        ↓
[7] Classificação de Probabilidade (1–5) e Severidade (1–5)
        ↓
[8] Risco Final = Probabilidade × Severidade → Cor matricial
        ↓
[9] Risco Residual após medidas
        ↓
[10] Prioridade de Tratamento → Inventário de Riscos + Plano de Ação
```

---

## 2. Fontes de Evidência e Pesos

| Fonte | Peso |
|---|---|
| Pesquisa com Colaboradores | **4** |
| Pesquisa com Gestores | **3** |
| Checklist da Empresa | **4** |
| Indicadores Complementares (absenteísmo, turnover, afastamentos) | **5** |
| Documentos / Registros Formais | **3** |
| Entrevistas Técnicas | **2** |
| AEP / AET | **5** |
| **Total de pesos** | **26** |

> **Regra:** Nem todas as fontes precisam estar presentes. O denominador da fórmula de triangulação usa apenas a **soma dos pesos das fontes efetivamente disponíveis**.

---

## 3. Tabulação — Pesquisa com Colaboradores

### 3.1 Escala e Inversão

- Escala Likert de **1 (nunca) a 5 (sempre)**.
- Itens **negativos** (exposição ao risco): valores altos → maior risco. Usar pontuação direta.
- Itens **positivos** (proteção): aplicar **leitura invertida antes de qualquer cálculo**:

```
pontuacao_ajustada = 6 - pontuacao_original
```

> Ver seção 11 para a lista completa de itens invertidos.

### 3.2 Cálculo de Médias

```
media_item = MÉDIA(respostas_validas_do_item)
  └─ Ignorar NA se < 10% das respostas; se ≥ 10%, registrar campo como indisponível.

media_dominio = MÉDIA(media_item_1, media_item_2, ...) para todos os itens do domínio

media_geral = MÉDIA(media_dominio_1, media_dominio_2, ...)
```

### 3.3 Classificação por Faixa

| Faixa | Critério | Nível |
|---|---|---|
| Baixo risco | média < 2,0 | 🟢 |
| Médio risco | 2,0 ≤ média < 3,0 | 🟡 |
| Alto risco | 3,0 ≤ média < 4,0 | 🟠 |
| Crítico | média ≥ 4,0 | 🔴 |

### 3.4 Frequência de Respostas Críticas

```
perc_critico_item = CONT.SE(respostas_item, ">=4") / total_respostas_validas * 100
```

> **Sinal crítico:** `perc_critico ≥ 30%` em itens de risco elevado deve ser destacado mesmo que a média não alcance faixa crítica.

### 3.5 Exemplos de Interpretação por Domínio

| Resultado | Interpretação técnica |
|---|---|
| Média ≥ 3,8 em volume de tarefas | Risco de fadiga crônica e redução de performance |
| ≥ 45% com respostas 4-5 em pausas | Perigo de distúrbios musculoesqueléticos psicossomáticos |
| Média ≥ 4,2 em assédio/humilhação | Risco iminente de queixas formais e clima organizacional tóxico |
| ≥ 35% com respostas 4-5 em medo de represália | Perigo de subnotificação e agravamento de riscos não identificados |

---

## 4. Tabulação — Pesquisa com Gestores

### 4.1 Lógica Base

Idêntica à pesquisa com colaboradores:
- Escala Likert 1–5
- Inversão dos itens positivos com `6 - pontuacao_original`
- Médias por item, domínio e geral
- Classificação por faixa (mesmos critérios)

> Ver seção 11 para itens invertidos específicos da pesquisa de gestores.

### 4.2 Cálculo de Divergência

```
divergencia_dominio = |media_colaboradores_dominio - media_gestores_dominio|
```

| Faixa | Classificação | Ação recomendada |
|---|---|---|
| < 0,5 | Baixa (alinhamento) | Monitorar |
| 0,5 a 1,0 | Média (atenção) | Validar com evidências adicionais |
| > 1,0 | Alta (crítica) | Exigir nova validação técnica |

**Perigos associados a divergência alta (> 1,0):**
- Desconfiança mútua
- Subestimação de riscos pela gestão
- Assédio não reconhecido formalmente
- Escalada de conflitos interpessoais
- Risco de judicialização

> **Exemplo:** Divergência 1,5 em 'relacionamentos' → Gestores percebem harmonia, colaboradores relatam assédio → Risco de processo trabalhista e queda de produtividade.

---

## 5. Tabulação — Checklist da Empresa

### 5.1 Opções de Resposta

Cada item do checklist deve aceitar exatamente um dos seguintes valores:

| Valor | Significado |
|---|---|
| `C` | Conforme |
| `P` | Parcialmente conforme |
| `NC` | Não conforme |
| `NA` | Não aplicável |

### 5.2 Proporção de Não Conformidade

```
proporcao_NC_P = (CONT.SE("NC") + CONT.SE("P")) / (total_itens - CONT.SE("NA")) * 100
```

### 5.3 Índice de Criticidade do Checklist

Cada item pode ter um **peso** definido (relevância técnica). Caso não haja pesos diferenciados, todos os itens recebem peso 1.

```
indice_criticidade = SOMA(peso_i * 1 para NC_i + peso_i * 0,5 para P_i) / SOMA(pesos_aplicaveis)
```

| Faixa | Classificação | Ação |
|---|---|---|
| < 20% | Baixo | Monitorar |
| 20% a 50% | Médio | Atenção e acompanhamento |
| > 50% | Alto | Ação imediata |

### 5.4 Interpretação por Área do Checklist

| Área | Sinal crítico | Risco associado |
|---|---|---|
| Pausas | NC > 30% | Fadiga acumulada, acidentes |
| Sobrecarga | NC + P ≥ 60% | Burnout, risco psicossocial crítico |
| Assédio / conduta | Qualquer item NC | Conflitos, ansiedade, depressão |
| Canal de escuta | NC ou P | Cultura de silêncio, subnotificação |

---

## 6. Triangulação de Evidências

### 6.1 Normalização dos Scores

Antes da triangulação, todos os scores de cada fonte devem ser normalizados para a escala **0–1**:

**Para pesquisas (escala 1–5):**
```
score_normalizado = (media_fonte - 1) / (5 - 1)
                  = (media_fonte - 1) / 4
```

**Para checklist (proporção 0–100%):**
```
score_normalizado = proporcao_NC_P / 100
```

**Para indicadores complementares:** Normalizar conforme a métrica (ex.: taxa de absenteísmo relativa ao benchmark setorial).

### 6.2 Modificadores por Fonte

Cada fonte recebe dois modificadores antes de entrar na fórmula ponderada:

**Intensidade do achado:**

| Intensidade | Valor |
|---|---|
| Favorável ao risco (risco confirmado) | 1,0 |
| Parcial (sinal ambíguo) | 0,5 |
| Desfavorável (sem sinal de risco) | 0,0 |

**Confiabilidade da fonte:**

| Confiabilidade | Valor |
|---|---|
| Alta | 1,0 |
| Média | 0,75 |
| Baixa | 0,5 |

### 6.3 Fórmula do Score Triangulado

```
score_final = Σ (score_normalizado_i × peso_i × intensidade_i × confiabilidade_i)
              ─────────────────────────────────────────────────────────────────────
                          Σ pesos_i (apenas fontes presentes)
```

> **Exemplo completo:**
> - Colaboradores: score 0,7 × peso 4 × intensidade 1,0 × confiabilidade 1,0 = 2,8
> - Gestores: score 0,4 × peso 3 × intensidade 0,5 × confiabilidade 0,75 = 0,45
> - Checklist: score 0,6 × peso 4 × intensidade 1,0 × confiabilidade 1,0 = 2,4
> - Total numerador = 5,65 | Total pesos = 11
> - **Score final = 5,65 / 11 ≈ 0,51 → Risco Médio**

### 6.4 Classificação do Score Final

| Faixa | Classificação |
|---|---|
| < 0,3 | 🟢 Baixo |
| 0,3 a 0,6 | 🟡 Médio |
| > 0,6 | 🔴 Alto |

### 6.5 Grau de Convergência Entre Fontes

```
desvio_padrao_fontes = DP(scores_normalizados_de_todas_as_fontes)
```

| Critério | Grau de Convergência |
|---|---|
| Todas as fontes alinhadas (variação ≤ ±0,5) | **Forte** |
| 1–2 fontes divergem | **Moderada** |
| Mais de 2 fontes divergem > 1 desvio padrão | **Fraca** |

> **Regra crítica:** Convergência forte + score > 0,6 → **Prioridade máxima na matriz 5×5 (vermelho).**

---

## 7. Cálculos Adicionais

### 7.1 Índice de Consenso Entre Fontes

```
indice_consenso = 1 - (desvio_padrao(scores_normalizados) / media_geral_normalizada)
```

| Resultado | Interpretação |
|---|---|
| > 0,8 | Alto consenso — triangulação robusta |
| 0,5 a 0,8 | Consenso médio — resultado confiável com ressalvas |
| < 0,5 | Baixo consenso — exige aprofundamento antes de classificar |

### 7.2 Índice de Criticidade por Fator

```
criticidade_fator = média_ponderada(scores_normalizados_dos_dominios_que_compõem_o_fator)
```

> Útil para agrupar domínios correlatos em um mesmo perigo (ex.: "Sobrecarga" agrupa volume de tarefas + ritmo + pausas + jornada).

### 7.3 Ordem de Prioridade de Tratamento

```
prioridade = score_final × fator_convergencia
```

| Grau de Convergência | Fator multiplicador |
|---|---|
| Forte | 1,5 |
| Moderada | 1,0 |
| Fraca | 0,8 |

---

## 8. Matriz 5×5 — Probabilidade × Severidade

### 8.1 Critérios de Probabilidade (1–5)

A probabilidade reflete a chance de ocorrência ou permanência do agravo, considerando:
- Frequência da exposição
- Persistência da condição
- Recorrência do problema
- Abrangência do grupo exposto
- Convergência das evidências
- Eficácia das medidas de prevenção existentes

| Nível | Classificação | Descrição |
|---|---|---|
| **1** | Altamente Improvável | Condição rara, excepcional ou isolada; baixa exposição; controles eficazes. |
| **2** | Improvável | Condição eventual, pouco frequente; exposição limitada; controles razoavelmente eficazes. |
| **3** | Possível | Condição intermitente ou repetida; exposição real de parte do grupo; controles parciais. |
| **4** | Provável | Condição frequente/recorrente; forte convergência de evidências; controles insuficientes. |
| **5** | Altamente Provável | Condição estrutural, persistente ou amplamente disseminada; forte exposição coletiva; falha importante de controle. |

### 8.2 Critérios de Severidade (1–5)

A severidade reflete o potencial de dano, considerando:
- Desconforto, fadiga e sofrimento psíquico
- Impacto sobre atenção, concentração e desempenho seguro
- Possibilidade de erro operacional, incidente ou acidente
- Possibilidade de absenteísmo, afastamento e adoecimento
- Extensão do dano individual ou coletivo
- Reversibilidade do agravo

| Nível | Classificação | Descrição |
|---|---|---|
| **1** | Insignificante / Leve | Desconforto leve, pontual e reversível; sem impacto relevante. |
| **2** | Menor | Desgaste perceptível, mas limitado; baixa repercussão sobre saúde e segurança. |
| **3** | Moderada | Potencial para gerar estresse relevante, fadiga mental, conflitos, erros e necessidade de intervenção organizacional. |
| **4** | Maior | Potencial para gerar sofrimento psíquico importante, adoecimento, afastamentos ou comprometimento relevante do desempenho seguro. |
| **5** | Catastrófica | Potencial para gerar agravos extremamente graves, dano coletivo severo ou consequências críticas e duradouras. |

### 8.3 Cálculo e Cor do Risco

```
risco_final = probabilidade × severidade
```

| Faixa | Classificação | Cor | Ação padrão |
|---|---|---|---|
| 1 a 5 | Trivial | 🟢 Verde | Monitorar |
| 6 a 14 | Tolerável / Moderado | 🟡 Amarelo | Acompanhar; planejar melhoria |
| 15 a 19 | Substancial | 🟠 Laranja | Incluir no PGR; prazo ≤ 30 dias |
| 20 a 25 | Intolerável | 🔴 Vermelho | Ação imediata; bloqueio do risco |

### 8.4 Tabela Visual da Matriz 5×5

```
         SEVERIDADE →
         1    2    3    4    5
    ┌─────────────────────────┐
P 5 │  5   10   15   20   25  │
R 4 │  4    8   12   16   20  │
O 3 │  3    6    9   12   15  │
B 2 │  2    4    6    8   10  │
  1 │  1    2    3    4    5  │
    └─────────────────────────┘
    Verde(<6) Amarelo(6-14) Laranja(15-19) Vermelho(20-25)
```

### 8.5 Regra de Automação para Registro

```
SE risco_final >= 15:
    → "Incluir no PGR com prazo 30 dias"
    → Registrar no Inventário de Riscos Ocupacionais
    → Incluir no Plano de Ação com responsável e prazo
SENÃO SE risco_final >= 6:
    → "Monitorar e acompanhar"
    → Registrar no Inventário
SENÃO:
    → "Risco trivial — manter monitoramento periódico"
```

---

## 9. Risco Residual e Prioridade de Tratamento

### 9.1 Cálculo do Risco Residual

Após a implementação de medidas de controle, o risco residual é calculado como:

```
score_pos_medida = score_inicial × (1 - eficacia_estimada / 100)
```

Onde `eficacia_estimada` é o percentual de redução esperado pela medida (definido pelo responsável técnico, ex.: 60% para revisão de metas + capacitação de lideranças).

Recalcular `probabilidade` e `severidade` com base no score residual para obter o **novo risco final pós-controle**.

### 9.2 Tipos de Medidas de Prevenção

| Tipo | Alvo | Exemplos |
|---|---|---|
| **Primária** | Causa do risco | Redimensionamento de equipe, revisão de metas, adequação da jornada, reorganização do fluxo, prevenção de assédio |
| **Secundária** | Detecção precoce / redução da progressão | Capacitação de lideranças, canais de escuta, monitoramento de indicadores críticos |
| **Terciária** | Casos instalados | Encaminhamento ao PCMSO, readaptação, intervenção corretiva imediata |

---

## 10. Catálogo de Perigos, Riscos e Danos

Use esta tabela como referência para preenchimento automático dos campos "Risco" e "Danos" no inventário, a partir do perigo identificado na triangulação.

| Perigo | Risco (descrição técnica) | Danos / Agravos |
|---|---|---|
| Sobrecarga de trabalho | Exposição a volume excessivo de tarefas, pressão por produtividade e acúmulo de demandas acima da capacidade operacional. | Estresse ocupacional, fadiga mental, erro operacional, adoecimento psíquico, absenteísmo e afastamentos. |
| Ritmo de trabalho excessivo | Exigência de execução acelerada e contínua, com baixa margem para pausas e recuperação. | Fadiga, perda de atenção, irritabilidade, aumento de incidentes, acidentes e esgotamento. |
| Pausas insuficientes ou interrompidas | Ausência de descanso efetivo durante a jornada e impossibilidade de recuperação física e cognitiva. | Exaustão, redução de desempenho, dores e desconfortos associados, erros e adoecimento relacionado ao trabalho. |
| Metas e prazos incompatíveis | Cobrança por resultados sem correspondência com efetivo, recursos e tempo disponíveis. | Ansiedade, pressão psicológica, conflito, retrabalho, adoecimento e afastamento. |
| Baixa autonomia e controle sobre o trabalho | Restrição excessiva para decidir como executar tarefas e priorizar atividades. | Frustração, estresse, perda de motivação, queda de desempenho e sofrimento psíquico. |
| Papéis e responsabilidades mal definidos | Ambiguidade de funções, ordens divergentes e conflito de atribuições. | Retrabalho, insegurança, conflito interpessoal, falhas operacionais e desgaste emocional. |
| Falhas de liderança e apoio gerencial | Ausência de orientação clara, suporte insuficiente e cobrança sem acompanhamento. | Insegurança, tensão, desorganização do trabalho, aumento de erros e adoecimento ocupacional. |
| Relações interpessoais conflituosas | Ambiente com comunicação hostil, tensão recorrente e conflitos frequentes. | Estresse, sofrimento psíquico, queda de engajamento, afastamentos e piora do clima organizacional. |
| Assédio moral, humilhação ou violência psicológica | Exposição a constrangimento, perseguição, intimidação, exposição vexatória ou abuso de poder. | Ansiedade, depressão, sofrimento psíquico importante, afastamento, adoecimento e dano moral organizacional. |
| Discriminação | Tratamento desigual por raça, sexo, idade, religião, condição de saúde, orientação sexual ou outra característica protegida. | Isolamento, sofrimento psíquico, desmotivação, adoecimento, rotatividade e prejuízo à saúde mental. |
| Medo de represália | Ambiente onde relatar problemas, falhas ou abusos gera receio de punição ou retaliação. | Silenciamento, subnotificação, manutenção de riscos, ansiedade e perpetuação do problema. |
| Carga mental elevada | Exigência contínua de atenção, memória, tomada de decisão e processamento simultâneo de informações. | Fadiga cognitiva, erros, lentificação, irritabilidade, estresse e redução do desempenho seguro. |
| Recursos insuficientes para o trabalho | Falta de pessoal, ferramentas, sistemas, materiais ou suporte operacional adequado. | Sobrecarga, improvisação, retrabalho, frustração, erros e adoecimento ocupacional. |
| Jornadas prolongadas ou excessivas | Exposição a horas extras frequentes, longas permanências e recuperação insuficiente entre jornadas. | Fadiga acumulada, distúrbios do sono, perda de atenção, irritabilidade, acidentes e esgotamento. |
| Insegurança organizacional e mudanças mal conduzidas | Alterações frequentes sem comunicação adequada, instabilidade e desorganização do processo de trabalho. | Ansiedade, insegurança, queda de produtividade, conflito, estresse e prejuízo à saúde mental. |

---

## 11. Itens com Leitura Invertida

A metodologia utiliza escala Likert de 1 a 5.

Para garantir que a interpretação dos resultados seja padronizada, a pontuação deve ser ajustada de modo que:

> **Quanto maior a pontuação ajustada, maior o sinal de exposição ao risco psicossocial.**

Assim, os itens com enunciado positivo ou protetivo devem ter **leitura invertida**.

Aplicar:

```ts
pontuacao_ajustada = 6 - pontuacao_original
```

A inversão deve ser aplicada **antes de qualquer cálculo de média, soma, percentual, classificação, score, normalização ou triangulação**.

---

## 11.1. Pesquisa com Colaboradores

Os seguintes itens devem utilizar **leitura invertida**:

| Item | Enunciado | Justificativa |
|---:|---|---|
| 1 | Tenho tempo suficiente para fazer meu trabalho com segurança e qualidade. | Quanto maior a concordância, menor o risco percebido. |
| 3 | As metas e cobranças do meu trabalho são compatíveis com a realidade do que precisa ser feito. | Quanto maior a concordância, menor o risco relacionado a metas incompatíveis. |
| 4 | Consigo fazer as pausas necessárias durante o trabalho. | Quanto maior a concordância, menor o risco relacionado a pausas insuficientes. |
| 6 | Sei claramente o que devo fazer no meu trabalho. | Quanto maior a concordância, menor o risco relacionado à falta de clareza de papel. |
| 7 | Recebo orientações claras da minha liderança. | Quanto maior a concordância, menor o risco relacionado a falhas de orientação. |
| 8 | Tenho apoio da minha liderança quando aparece algum problema no trabalho. | Quanto maior a concordância, menor o risco relacionado à falta de apoio da liderança. |
| 10 | No meu setor, as pessoas se tratam com respeito. | Quanto maior a concordância, menor o risco relacionado a conflitos e desrespeito. |
| 13 | Posso falar sobre problemas do trabalho sem medo de sofrer represália. | Quanto maior a concordância, menor o risco relacionado ao medo de represália. |

---

## 11.2. Itens com Leitura Direta — Colaboradores

Os demais itens da pesquisa com colaboradores devem utilizar **leitura direta**, ou seja, sem inversão de pontuação.

| Item | Enunciado | Justificativa |
|---:|---|---|
| 2 | Preciso trabalhar com muita pressa para dar conta das minhas tarefas. | Quanto maior a concordância, maior o sinal de risco relacionado a ritmo excessivo. |
| 5 | Minha jornada de trabalho me deixa muito cansado física ou mentalmente. | Quanto maior a concordância, maior o sinal de risco relacionado a cansaço físico ou mental. |
| 9 | Falta pessoal, material, ferramenta ou recurso para eu trabalhar bem. | Quanto maior a concordância, maior o sinal de risco relacionado a recursos insuficientes. |
| 11 | Já vivi ou vi situações de humilhação, constrangimento, ameaça ou perseguição no trabalho. | Quanto maior a concordância, maior o sinal de risco relacionado a assédio, humilhação ou violência psicológica. |
| 12 | Já vivi ou vi situações de discriminação no trabalho por cor/raça, sexo, idade, religião, condição de saúde, orientação sexual ou outro motivo. | Quanto maior a concordância, maior o sinal de risco relacionado à discriminação. |
| 14 | Meu trabalho exige muita atenção e isso me deixa mentalmente desgastado. | Quanto maior a concordância, maior o sinal de risco relacionado à carga mental elevada. |
| 15 | Do jeito que o trabalho está organizado hoje, ele pode prejudicar a saúde das pessoas. | Quanto maior a concordância, maior o sinal de risco relacionado à organização do trabalho. |

---

## 11.3. Pesquisa com Gestores

Os seguintes itens devem utilizar **leitura invertida**:

| Item | Enunciado | Justificativa |
|---:|---|---|
| 1 | A equipe tem tempo suficiente para realizar o trabalho com segurança e qualidade. | Quanto maior a concordância, menor o risco percebido. |
| 3 | As metas e cobranças do setor são compatíveis com a capacidade real da equipe. | Quanto maior a concordância, menor o risco relacionado a metas incompatíveis. |
| 4 | A equipe consegue realizar as pausas necessárias durante a jornada. | Quanto maior a concordância, menor o risco relacionado a pausas insuficientes. |
| 6 | As atividades e responsabilidades de cada colaborador estão claramente definidas. | Quanto maior a concordância, menor o risco relacionado à falta de clareza de papel. |
| 7 | As orientações dadas à equipe são claras e consistentes. | Quanto maior a concordância, menor o risco relacionado a falhas de orientação. |
| 8 | A equipe recebe apoio adequado da liderança para resolver problemas do trabalho. | Quanto maior a concordância, menor o risco relacionado à falta de apoio da liderança. |
| 10 | No setor, as relações de trabalho acontecem de forma respeitosa. | Quanto maior a concordância, menor o risco relacionado a conflitos e desrespeito. |
| 13 | Os colaboradores conseguem relatar problemas do trabalho sem medo de represália. | Quanto maior a concordância, menor o risco relacionado ao medo de represália. |

---

## 11.4. Itens com Leitura Direta — Gestores

Os demais itens da pesquisa com gestores devem utilizar **leitura direta**, ou seja, sem inversão de pontuação.

| Item | Enunciado | Justificativa |
|---:|---|---|
| 2 | A equipe precisa trabalhar com muita pressa para cumprir as atividades. | Quanto maior a concordância, maior o sinal de risco relacionado a ritmo excessivo. |
| 5 | A jornada de trabalho tem gerado cansaço físico ou mental excessivo na equipe. | Quanto maior a concordância, maior o sinal de risco relacionado a cansaço físico ou mental. |
| 9 | Faltam pessoas, materiais, ferramentas ou recursos para a equipe trabalhar bem. | Quanto maior a concordância, maior o sinal de risco relacionado a recursos insuficientes. |
| 11 | Já ocorreram situações de humilhação, constrangimento, ameaça ou perseguição no setor. | Quanto maior a concordância, maior o sinal de risco relacionado a assédio, humilhação ou violência psicológica. |
| 12 | Já ocorreram situações de discriminação no setor por cor/raça, sexo, idade, religião, condição de saúde, orientação sexual ou outro motivo. | Quanto maior a concordância, maior o sinal de risco relacionado à discriminação. |
| 14 | O trabalho da equipe exige atenção constante e tem gerado desgaste mental elevado. | Quanto maior a concordância, maior o sinal de risco relacionado à carga mental elevada. |
| 15 | Do jeito que o trabalho está organizado hoje, ele pode prejudicar a saúde das pessoas da equipe. | Quanto maior a concordância, maior o sinal de risco relacionado à organização do trabalho. |

---

## 11.5. Resumo de Configuração

A configuração final para o sistema deve ser:

| Item | Colaboradores | Gestores | Tipo de Leitura |
|---:|---|---|---|
| 1 | Tenho tempo suficiente para fazer meu trabalho com segurança e qualidade. | A equipe tem tempo suficiente para realizar o trabalho com segurança e qualidade. | **Invertida** |
| 2 | Preciso trabalhar com muita pressa para dar conta das minhas tarefas. | A equipe precisa trabalhar com muita pressa para cumprir as atividades. | **Direta** |
| 3 | As metas e cobranças do meu trabalho são compatíveis com a realidade do que precisa ser feito. | As metas e cobranças do setor são compatíveis com a capacidade real da equipe. | **Invertida** |
| 4 | Consigo fazer as pausas necessárias durante o trabalho. | A equipe consegue realizar as pausas necessárias durante a jornada. | **Invertida** |
| 5 | Minha jornada de trabalho me deixa muito cansado física ou mentalmente. | A jornada de trabalho tem gerado cansaço físico ou mental excessivo na equipe. | **Direta** |
| 6 | Sei claramente o que devo fazer no meu trabalho. | As atividades e responsabilidades de cada colaborador estão claramente definidas. | **Invertida** |
| 7 | Recebo orientações claras da minha liderança. | As orientações dadas à equipe são claras e consistentes. | **Invertida** |
| 8 | Tenho apoio da minha liderança quando aparece algum problema no trabalho. | A equipe recebe apoio adequado da liderança para resolver problemas do trabalho. | **Invertida** |
| 9 | Falta pessoal, material, ferramenta ou recurso para eu trabalhar bem. | Faltam pessoas, materiais, ferramentas ou recursos para a equipe trabalhar bem. | **Direta** |
| 10 | No meu setor, as pessoas se tratam com respeito. | No setor, as relações de trabalho acontecem de forma respeitosa. | **Invertida** |
| 11 | Já vivi ou vi situações de humilhação, constrangimento, ameaça ou perseguição no trabalho. | Já ocorreram situações de humilhação, constrangimento, ameaça ou perseguição no setor. | **Direta** |
| 12 | Já vivi ou vi situações de discriminação no trabalho por cor/raça, sexo, idade, religião, condição de saúde, orientação sexual ou outro motivo. | Já ocorreram situações de discriminação no setor por cor/raça, sexo, idade, religião, condição de saúde, orientação sexual ou outro motivo. | **Direta** |
| 13 | Posso falar sobre problemas do trabalho sem medo de sofrer represália. | Os colaboradores conseguem relatar problemas do trabalho sem medo de represália. | **Invertida** |
| 14 | Meu trabalho exige muita atenção e isso me deixa mentalmente desgastado. | O trabalho da equipe exige atenção constante e tem gerado desgaste mental elevado. | **Direta** |
| 15 | Do jeito que o trabalho está organizado hoje, ele pode prejudicar a saúde das pessoas. | Do jeito que o trabalho está organizado hoje, ele pode prejudicar a saúde das pessoas da equipe. | **Direta** |

---

## 11.6. Regra de Implementação

Para itens com **leitura direta**:

```ts
pontuacao_ajustada = pontuacao_original
```

Para itens com **leitura invertida**:

```ts
pontuacao_ajustada = 6 - pontuacao_original
```

---

## 11.7. Exemplo de Conversão

| Pontuação Original | Pontuação Ajustada |
|---:|---:|
| 1 | 5 |
| 2 | 4 |
| 3 | 3 |
| 4 | 2 |
| 5 | 1 |

---

## 11.8. Atenção de Implementação

A inversão deve ocorrer no momento da leitura dos dados brutos, antes de qualquer cálculo de:

- média;
- soma;
- percentual;
- classificação;
- score;
- normalização;
- triangulação;
- geração de painel;
- geração de inventário;
- geração de plano de ação.

Após o ajuste, todas as análises devem considerar que:

> **Médias mais altas indicam maior exposição a fatores de risco psicossociais.**

Itens não marcados como **leitura invertida** devem permanecer com **pontuação direta**.

## 12. Regras de Registro e Saída

### 12.1 Parâmetros que Definem o Risco na Triangulação

Cada fator de risco identificado deve ser documentado com os seguintes parâmetros:

| Parâmetro | O que registrar |
|---|---|
| **Fator identificado** | Nome do perigo (ex.: Sobrecarga de trabalho) |
| **Convergência das fontes** | Fraca / Moderada / Forte |
| **Intensidade do achado** | Favorável ao risco / Parcial / Desfavorável |
| **Frequência** | Rara / Ocasional / Frequente / Contínua |
| **Persistência** | Pontual / Recorrente / Estrutural |
| **Abrangência** | Pessoa / Função / Setor / Múltiplos setores / Empresa toda |
| **Eficácia dos controles existentes** | Funciona / Funciona parcialmente / Não funciona / Inexistente |
| **Confiabilidade das fontes** | Alta / Média / Baixa |
| **Probabilidade (1–5)** | Classificar conforme seção 8.1 |
| **Severidade (1–5)** | Classificar conforme seção 8.2 |
| **Risco final (1–25)** | Probabilidade × Severidade |
| **Cor matricial** | Verde / Amarelo / Laranja / Vermelho |
| **Grau de evidência** | Fraco / Moderado / Forte |
| **Tratamento técnico** | Monitorar / Aprofundar / Registrar no inventário / Priorizar plano de ação |

### 12.2 Interpretação do Grau de Evidência

| Grau | Critério |
|---|---|
| **Fraco** | Evidências pouco convergentes; sinal pontual; sem persistência clara. |
| **Moderado** | Há repetição e alguma convergência, mas ainda com necessidade de aprofundamento. |
| **Forte** | Várias fontes apontam o mesmo fator, com recorrência e impacto relevante. |

### 12.3 Saída Mínima da Triangulação por Fator

Para cada fator identificado, o sistema deve gerar:

```json
{
  "fator": "Sobrecarga de trabalho",
  "convergencia": "Forte",
  "score_triangulado": 0.72,
  "grau_evidencia": "Forte",
  "probabilidade": 4,
  "severidade": 4,
  "risco_final": 16,
  "cor": "Laranja",
  "tratamento": "Incluir no PGR com prazo 30 dias",
  "situacao_geradora": "...",
  "grupo_exposto": "...",
  "medidas_existentes": "...",
  "acoes_requeridas": "...",
  "responsavel": "...",
  "prazo": "..."
}
```

---

## 13. Estrutura Mínima do Relatório Final

O relatório gerado pelo sistema deve conter obrigatoriamente:

1. Identificação da organização
2. Escopo da avaliação (unidades, setores, funções, turnos, GES)
3. Período da avaliação
4. Metodologia utilizada e instrumentos aplicados
5. Critérios de tabulação e interpretação
6. Síntese dos resultados das pesquisas (colaboradores e gestores)
7. Síntese do checklist
8. Indicadores e documentos considerados
9. Matriz de triangulação de evidências
10. Para cada fator identificado:
    - Situação geradora
    - Grupo exposto
    - Critérios adotados para probabilidade e severidade
    - Classificação final na matriz 5×5
    - Medidas existentes
    - Ações requeridas
    - Prioridade de tratamento
    - Responsáveis e prazos
11. Necessidade de AEP/AET complementar (quando aplicável)
12. Conclusão técnica
13. Assinatura do responsável técnico

---

## Referências Normativas

| Norma | Aplicação |
|---|---|
| NR-1 (cap. 1.5) + Portaria MTE 1.419/2024 | Base do GRO/PGR e metodologia de avaliação |
| NR-17 | Ergonomia e fatores psicossociais |
| NR-7 (PCMSO) | Integração com saúde ocupacional |
| NR-9 | Critérios para agentes físicos, químicos e biológicos |
| ABNT ISO 45003:2021 | Gestão de riscos psicossociais |
| ABNT NBR ISO 45001 | Sistema de gestão de SST |
| Manual de Interpretação GRO/MTE | Referência técnica da matriz 5×5 |

---

*Documento gerado para implementação no sistema Antigravity — versão baseada no Procedimento Técnico de Avaliação de Riscos Psicossociais da Conexa.*
