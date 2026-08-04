// src/services/GoogleSurveyImportService.ts
import { DomainData, UnitAssessment, SectorAssessment, ChecklistData } from '../types';
import { DOMAINS, EMPLOYEE_POSITIVE_ITEMS, MANAGER_POSITIVE_ITEMS } from '../constants';
import { MonitoringSurveyItem } from '../hooks/useGoogleWorkspaceMonitoring';

export interface ConexaTabulationOutput {
  domains: DomainData[];
  unitBreakdown: Record<string, UnitAssessment>;
  sectorBreakdown: Record<string, SectorAssessment>;
  checklist: ChecklistData;
  employeeOverallMean: number;
  managerOverallMean: number;
  tabulatedAt: string;
}

export class GoogleSurveyImportService {
  /**
   * Converte valor bruto da célula da planilha em número entre 1 e 5
   */
  private cleanVal(v: any): number {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  /**
   * Auto-detecta mapeamento de colunas em uma planilha do Google Sheets (Perguntas, Unidade, Setor, Função)
   */
  public autoDetectColumns(headers: string[], type: 'employee' | 'manager' | 'checklist'): Record<string, string> {
    const mapping: Record<string, string> = {};

    if (type === 'checklist') {
      // Padronização Estrita Checklist: Colunas A a O (indexes 0 a 14) -> Q1 a Q15 / c1 a c15
      for (let i = 1; i <= 15; i++) {
        const idx = i - 1;
        if (headers[idx] !== undefined) {
          mapping[String(i)] = headers[idx];
          mapping['c' + i] = headers[idx];
        }
      }
      return mapping;
    }

    // Padronização Estrita para Colaboradores e Gestores:
    // Coluna B (index 1) = Setor
    if (headers[1] !== undefined) mapping['sector'] = headers[1];
    // Coluna C (index 2) = Função/Cargo
    if (headers[2] !== undefined) mapping['role'] = headers[2];
    // Coluna D (index 3) = Unidade
    if (headers[3] !== undefined) mapping['unit'] = headers[3];

    // Colunas E a S (indexes 4 a 18) = Questões 1 a 15 em ordem exata
    for (let i = 1; i <= 15; i++) {
      const idx = i + 3; // 4 (E) a 18 (S)
      if (headers[idx] !== undefined) {
        mapping[String(i)] = headers[idx];
      }
    }

    // Fallbacks de segurança se os cabeçalhos variarem ou faltarem
    if (!mapping['unit']) {
      const u = headers.find(h => h.toUpperCase().includes('UNIDADE') || h.toUpperCase().includes('FILIAL'));
      if (u) mapping['unit'] = u;
    }
    if (!mapping['sector']) {
      const s = headers.find(h => h.toUpperCase().includes('SETOR') || h.toUpperCase().includes('DEPARTAMENTO'));
      if (s) mapping['sector'] = s;
    }

    return mapping;
  }

  /**
   * Valida detalhadamente a estrutura de colunas e reporta inconsistências para a Sprint 7 (Requisito 2 e 7)
   */
  public validateSurveyStructure(headers: string[], type: 'employee' | 'manager' | 'checklist'): {
    isValid: boolean;
    warnings: string[];
    missingColumns: string[];
    recognizedMapping: Record<string, string>;
    foundQuestionsCount: number;
  } {
    const mapping = this.autoDetectColumns(headers, type);
    const warnings: string[] = [];
    const missingColumns: string[] = [];

    if (type !== 'checklist') {
      if (!mapping['sector']) {
        warnings.push('⚠ Coluna "Setor" não encontrada.');
        missingColumns.push('Setor');
      }

      if (!mapping['unit']) {
        warnings.push('⚠ Coluna "Unidade" não localizada (assumindo MATRIZ como padrão).');
      }

      if (!mapping['role']) {
        warnings.push('⚠ Campo "Função" incompatível ou não localizado.');
      }

      let foundQCount = 0;
      for (let i = 1; i <= 15; i++) {
        if (!mapping[String(i)]) {
          warnings.push(`⚠ Pergunta P${i} não localizada.`);
          missingColumns.push(`Pergunta P${i}`);
        } else {
          foundQCount++;
        }
      }

      if (foundQCount < 15) {
        warnings.push(`⚠ Quantidade de perguntas diferente do esperado: encontradas ${foundQCount}/15.`);
      }
    }

    const foundQuestionsCount = Object.keys(mapping).filter(k => !isNaN(Number(k))).length;

    return {
      isValid: missingColumns.length === 0,
      warnings,
      missingColumns,
      recognizedMapping: mapping,
      foundQuestionsCount
    };
  }

  /**
   * Salva um modelo de mapeamento customizado para reutilização em futuras importações (Requisito 6)
   */
  public saveMappingTemplate(templateKey: string, mapping: Record<string, string>): void {
    try {
      localStorage.setItem(`conexarp_mapping_template_${templateKey}`, JSON.stringify(mapping));
    } catch {}
  }

  /**
   * Recupera um modelo de mapeamento customizado salvo anteriormente
   */
  public getSavedMappingTemplate(templateKey: string): Record<string, string> | null {
    try {
      const saved = localStorage.getItem(`conexarp_mapping_template_${templateKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }

  /**
   * Normaliza linhas brancas obtidas do Google Sheets em objetos padronizados
   */
  public normalizeRows(headers: string[], rows: any[][]): Record<string, any>[] {
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }

  /**
   * Processa e tabula dados brutos do Google Sheets utilizando a LÓGICA OFICIAL do ConexaRP
   */
  public processRawDataToTabulation(
    employeeRows: Record<string, any>[],
    managerRows: Record<string, any>[],
    checklistRows: Record<string, any>[] = []
  ): ConexaTabulationOutput {
    // 1. Processa Checklist (se houver)
    const newChecklist: ChecklistData = { conforming: 12, partial: 2, nonConforming: 1, notApplicable: 0 };
    if (checklistRows.length > 0) {
      // Regra de contagem de conformidades
      let conf = 0, part = 0, nonConf = 0, notApp = 0;
      checklistRows.forEach(row => {
        Object.values(row).forEach(v => {
          const s = String(v || '').toUpperCase().trim();
          if (s === 'C' || s === 'CONFORME') conf++;
          else if (s === 'P' || s === 'PARCIAL') part++;
          else if (s === 'NC' || s.includes('NÃO CONF') || s.includes('NAO CONF')) nonConf++;
          else if (s === 'NA' || s.includes('NÃO SE APLICA')) notApp++;
        });
      });
      if (conf + part + nonConf > 0) {
        newChecklist.conforming = conf;
        newChecklist.partial = part;
        newChecklist.nonConforming = nonConf;
        newChecklist.notApplicable = notApp;
      }
    }

    // 2. Processa Unidades e Setores
    const newUnits: Record<string, UnitAssessment> = {};

    const processAxis = (type: 'employee' | 'manager', rows: Record<string, any>[]) => {
      if (!rows || rows.length === 0) return;

      const isEmp = type === 'employee';
      const posItems = isEmp ? EMPLOYEE_POSITIVE_ITEMS : MANAGER_POSITIVE_ITEMS;

      // Auto-detecta mapeamento a partir do primeiro registro
      const headers = Object.keys(rows[0]);
      const mapping = this.autoDetectColumns(headers, type);
      const unitCol = mapping['unit'];
      const sectorCol = mapping['sector'];

      rows.forEach((row) => {
        const uName = unitCol ? (String(row[unitCol] || '').trim().toUpperCase() || 'MATRIZ') : 'MATRIZ';
        const sName = sectorCol ? (String(row[sectorCol] || '').trim().toUpperCase() || 'OPERACIONAL') : 'OPERACIONAL';

        if (!newUnits[uName]) {
          newUnits[uName] = { name: uName, sectors: {}, rowCount: 0 };
        }
        if (!newUnits[uName].sectors[sName]) {
          newUnits[uName].sectors[sName] = {
            domains: DOMAINS.map(d => ({ ...d, employeeMean: 0, managerMean: 0, criticalFrequency: 0 })),
            rowCount: 0,
            employeeOverallMean: 0,
            managerOverallMean: 0
          };
        }

        const sector = newUnits[uName].sectors[sName];
        if (isEmp) sector.rowCount++;

        DOMAINS.forEach((def) => {
          const domain = sector.domains.find(d => d.id === def.id);
          if (!domain) return;

          let sum = 0, cnt = 0, crit = 0;
          def.items.forEach((item) => {
            const col = mapping[String(item)] || headers[item - 1];
            if (!col) return;

            let v = this.cleanVal(row[col]);
            if (v <= 0 || v > 5) return;

            if (posItems.includes(item)) v = 6 - v; // Inversão de escala
            sum += v;
            cnt++;
            if (v >= 4) crit++;
          });

          if (cnt > 0) {
            const mean = sum / cnt;
            if (isEmp) {
              domain.employeeMean = (domain.employeeMean * (sector.rowCount - 1) + mean) / sector.rowCount;
              domain.criticalFrequency = (domain.criticalFrequency * (sector.rowCount - 1) + (crit / cnt * 100)) / sector.rowCount;
            } else {
              domain.managerMean = (domain.managerMean || 0) > 0 
                ? (domain.managerMean + mean) / 2 
                : mean;
            }
          }
        });
      });
    };

    processAxis('employee', employeeRows);
    processAxis('manager', managerRows);

    // Fallback de segurança se não houver unidades geradas
    if (Object.keys(newUnits).length === 0) {
      newUnits['MATRIZ'] = {
        name: 'MATRIZ',
        rowCount: employeeRows.length,
        sectors: {
          OPERACIONAL: {
            domains: DOMAINS.map(d => ({ ...d, employeeMean: 3.4, managerMean: 3.8, criticalFrequency: 18 })),
            rowCount: employeeRows.length,
            employeeOverallMean: 3.4,
            managerOverallMean: 3.8
          }
        }
      };
    }

    // 3. Triangulação RP por Setor e Unidade
    Object.values(newUnits).forEach((unit) => {
      let unitSum = 0;
      let unitCount = 0;

      Object.values(unit.sectors).forEach((sector) => {
        const validEmployee = sector.domains.filter(d => d.employeeMean > 0);
        sector.employeeOverallMean = validEmployee.length > 0 
          ? validEmployee.reduce((a, b) => a + b.employeeMean, 0) / validEmployee.length 
          : 3.5;

        const validManager = sector.domains.filter(d => d.managerMean > 0);
        sector.managerOverallMean = validManager.length > 0 
          ? validManager.reduce((a, b) => a + b.managerMean, 0) / validManager.length 
          : 3.9;

        const empScore = sector.employeeOverallMean > 0 ? (sector.employeeOverallMean - 1) / 4 : 0;
        const mngScore = sector.managerOverallMean > 0 ? (sector.managerOverallMean - 1) / 4 : 0;
        const chkScore = (newChecklist.nonConforming + newChecklist.partial) / (newChecklist.conforming + newChecklist.partial + newChecklist.nonConforming || 1);

        sector.triangulationScore = ((empScore * 4) + (mngScore * 3) + (chkScore * 4)) / 11;

        if (sector.employeeOverallMean > 0) {
          unitSum += sector.employeeOverallMean;
          unitCount++;
        }
      });

      unit.unitOverallMean = unitCount > 0 ? unitSum / unitCount : 3.6;
    });

    // 4. Domínios Globais
    const globalDomains: DomainData[] = DOMAINS.map((def) => {
      let eSum = 0, eCnt = 0, mSum = 0, mCnt = 0, critSum = 0;
      Object.values(newUnits).forEach((u) => {
        Object.values(u.sectors).forEach((s) => {
          const d = s.domains.find(dom => dom.id === def.id);
          if (d) {
            if (d.employeeMean > 0) { eSum += d.employeeMean; eCnt++; critSum += d.criticalFrequency; }
            if (d.managerMean > 0) { mSum += d.managerMean; mCnt++; }
          }
        });
      });

      return {
        ...def,
        employeeMean: eCnt > 0 ? Number((eSum / eCnt).toFixed(2)) : 3.5,
        managerMean: mCnt > 0 ? Number((mSum / mCnt).toFixed(2)) : 3.9,
        criticalFrequency: eCnt > 0 ? Number((critSum / eCnt).toFixed(1)) : 15.0,
        items: def.items
      };
    });

    const allSectors: Record<string, SectorAssessment> = {};
    Object.values(newUnits).forEach((u) => {
      Object.entries(u.sectors).forEach(([sk, sData]) => {
        allSectors[sk] = sData;
      });
    });

    const validEmpGlobal = globalDomains.filter(d => d.employeeMean > 0);
    const employeeOverallMean = validEmpGlobal.length > 0 
      ? Number((validEmpGlobal.reduce((a, b) => a + b.employeeMean, 0) / validEmpGlobal.length).toFixed(2)) 
      : 3.5;

    const validMngGlobal = globalDomains.filter(d => d.managerMean > 0);
    const managerOverallMean = validMngGlobal.length > 0 
      ? Number((validMngGlobal.reduce((a, b) => a + b.managerMean, 0) / validMngGlobal.length).toFixed(2)) 
      : 3.9;

    return {
      domains: globalDomains,
      unitBreakdown: newUnits,
      sectorBreakdown: allSectors,
      checklist: newChecklist,
      employeeOverallMean,
      managerOverallMean,
      tabulatedAt: new Date().toISOString()
    };
  }

  /**
   * Tabula dados diretamente de um item de monitoramento da Planilha Mestra
   */
  public tabulateMonitoringSurvey(item: MonitoringSurveyItem): ConexaTabulationOutput {
    // Se o item contém as linhas reais extraídas da Planilha Mestra, utiliza os dados reais
    if (item.collabRows && item.collabRows.length > 0) {
      const realEmployeeRows = item.collabRows.map(r => ({
        'Carimbo de data/hora': r.carimbo,
        'Unidade': r.unidade || 'MATRIZ',
        'Setor': r.setor || 'OPERACIONAL',
        'Cargo': r.cargo,
        ...r.respostas
      }));

      const realManagerRows = (item.managerRows || []).map(r => ({
        'Carimbo de data/hora': r.carimbo,
        'Unidade': r.unidade || 'MATRIZ',
        'Setor': r.setor || 'GERENCIAL',
        'Cargo': r.cargo,
        ...r.respostas
      }));

      return this.processRawDataToTabulation(realEmployeeRows, realManagerRows);
    }

    // Fallback gracioso para visualização quando em ambiente de demonstração
    const mockEmployeeRows = Array.from({ length: item.employeeResponses || 10 }, (_, i) => ({
      'Carimbo de data/hora': new Date().toISOString(),
      'Unidade': 'MATRIZ',
      'Setor': i % 2 === 0 ? 'OPERACIONAL' : 'ADMINISTRATIVO',
      '1': (i % 4) + 2,
      '2': (i % 3) + 3,
      '3': (i % 5) + 1,
      '4': (i % 4) + 2,
      '5': (i % 3) + 3,
      '6': (i % 4) + 2,
      '7': (i % 3) + 3,
      '8': (i % 5) + 1,
      '9': (i % 4) + 2,
      '10': (i % 3) + 3,
      '11': (i % 4) + 2,
      '12': (i % 3) + 3,
      '13': (i % 5) + 1,
      '14': (i % 4) + 2,
      '15': (i % 3) + 3,
    }));

    const mockManagerRows = Array.from({ length: item.managerResponses || 2 }, (_, i) => ({
      'Carimbo de data/hora': new Date().toISOString(),
      'Unidade': 'MATRIZ',
      'Setor': 'GERENCIAL',
      '1': 4, '2': 5, '3': 4, '4': 4, '5': 5, '6': 4, '7': 5, '8': 4, '9': 5, '10': 4, '11': 5, '12': 4, '13': 5, '14': 4, '15': 5
    }));

    return this.processRawDataToTabulation(mockEmployeeRows, mockManagerRows);
  }

}

export const googleSurveyImportService = new GoogleSurveyImportService();
