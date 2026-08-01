// supabase/functions/google-workspace-sync/SurveyMetricsService.ts

export interface SheetMetrics {
  spreadsheetId: string;
  spreadsheetName?: string;
  totalRows: number;
  responseCount: number;
  lastUpdated?: string;
  error?: string;
}

export class SurveyMetricsService {
  private accessToken: string;
  private interRequestDelayMs: number;

  constructor(accessToken: string, interRequestDelayMs = 100) {
    this.accessToken = accessToken;
    this.interRequestDelayMs = interRequestDelayMs;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Requisição resiliente com backoff em 429 para garantir 100% de precisão sem perder leituras
   */
  private async fetchWithBackoff(url: string, maxRetries = 4): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.interRequestDelayMs > 0 && attempt === 0) {
          await this.delay(this.interRequestDelayMs);
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json"
          }
        });

        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempt === maxRetries) {
            const errText = await response.text();
            throw new Error(`Google Sheets API HTTP ${response.status}: ${errText}`);
          }

          const backoff = Math.pow(2, attempt) * 600 + Math.random() * 200;
          console.warn(`[Google Sheets API] Rate Limit HTTP ${response.status} (Tentativa ${attempt + 1}/${maxRetries}). Pausando ${(backoff / 1000).toFixed(2)}s...`);
          await this.delay(backoff);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google Sheets API Error (${response.status}): ${errText}`);
        }

        return await response.json();
      } catch (err: any) {
        if (attempt === maxRetries) throw err;
        const backoff = Math.pow(2, attempt) * 600 + Math.random() * 200;
        await this.delay(backoff);
      }
    }
  }

  /**
   * Obtém a contagem exata de respostas de uma planilha Google Sheets (Intervalo A1:A5000)
   */
  async getSpreadsheetMetrics(spreadsheetId: string): Promise<SheetMetrics> {
    if (!spreadsheetId) {
      return { spreadsheetId: "", totalRows: 0, responseCount: 0 };
    }

    try {
      const range = encodeURIComponent("A1:A5000");
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`;

      const valuesData = await this.fetchWithBackoff(valuesUrl);
      const rows = valuesData?.values || [];
      const totalRows = rows.length;
      const responseCount = Math.max(0, totalRows - 1);

      return {
        spreadsheetId,
        totalRows,
        responseCount
      };
    } catch (error: any) {
      console.warn(`[Google Workspace Sync] Falha na leitura da planilha ${spreadsheetId}: ${error.message || error}`);
      return {
        spreadsheetId,
        totalRows: 0,
        responseCount: 0,
        error: error?.message || String(error)
      };
    }
  }
}
