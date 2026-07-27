export interface SheetResponseMetrics {
  responseCount: number;
  lastResponseDate: string | null;
}

/**
 * Reads row count and timestamp of last response from Google Spreadsheet.
 * Uses Google Sheets API v4 (spreadsheets.values.get).
 */
export async function fetchSheetMetrics(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetResponseMetrics> {
  try {
    // Fetch values from Sheet 1 (range A:Z or A:A)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z?valueRenderOption=FORMATTED_VALUE`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Limite de requisições do Google Sheets excedido (Quota 429). Tente novamente em instantes.');
      }
      throw new Error(`Erro ao acessar planilha ${spreadsheetId}: ${res.statusText}`);
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];

    if (rows.length <= 1) {
      // Only header row or empty
      return {
        responseCount: 0,
        lastResponseDate: null,
      };
    }

    // Response count excludes header (row 0)
    const responseCount = rows.length - 1;

    // Get last row timestamp (usually Column A: Carimbo de data/hora)
    const lastRow = rows[rows.length - 1];
    const lastResponseDate = lastRow && lastRow[0] ? lastRow[0] : null;

    return {
      responseCount,
      lastResponseDate,
    };
  } catch (error) {
    console.error(`Error fetching metrics for sheet ${spreadsheetId}:`, error);
    return {
      responseCount: 0,
      lastResponseDate: null,
    };
  }
}
