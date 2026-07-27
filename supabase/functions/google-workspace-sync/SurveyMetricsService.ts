// supabase/functions/google-workspace-sync/SurveyMetricsService.ts

export interface SheetMetrics {
  spreadsheetId: string;
  spreadsheetName?: string;
  totalRows: number;
  responseCount: number;
  lastUpdated?: string;
}

export class SurveyMetricsService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchWithBackoff(url: string, retries = 3): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json"
          }
        });

        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempt === retries) {
            throw new Error(`Google Sheets API HTTP ${response.status} após retentativas.`);
          }
          const backoff = Math.pow(2, attempt) * 300;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google Sheets API Error (${response.status}): ${errText}`);
        }

        return await response.json();
      } catch (err) {
        if (attempt === retries) throw err;
        const backoff = Math.pow(2, attempt) * 300;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  async getSpreadsheetMetrics(spreadsheetId: string): Promise<SheetMetrics> {
    try {
      // 1. Obtém metadados da planilha
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;
      const meta = await this.fetchWithBackoff(metaUrl);
      const spreadsheetName = meta.properties?.title || "Planilha de Respostas";

      // 2. Consulta a primeira coluna da primeira aba para obter o número total de registros
      const sheetTitle = meta.sheets?.[0]?.properties?.title || "Respostas ao formulário 1";
      const range = encodeURIComponent(`'${sheetTitle}'!A:A`);
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`;

      const valuesData = await this.fetchWithBackoff(valuesUrl);
      const rows = valuesData.values || [];
      const totalRows = rows.length;
      // Subtrai 1 para ignorar a linha do cabeçalho ("Carimbo de data/hora")
      const responseCount = Math.max(0, totalRows - 1);

      return {
        spreadsheetId,
        spreadsheetName,
        totalRows,
        responseCount
      };
    } catch (error: any) {
      console.warn(`Aviso ao obter métricas da planilha ${spreadsheetId}:`, error.message);
      return {
        spreadsheetId,
        totalRows: 0,
        responseCount: 0
      };
    }
  }
}
