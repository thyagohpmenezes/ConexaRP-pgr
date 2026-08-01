// supabase/functions/google-workspace-sync/index.ts
import { GoogleAuthService } from "./GoogleAuthService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

const DEFAULT_SPREADSHEET_ID = "1oeP_TJk4es0gbeBAPnebYkGecVAjzFG5EkC1dSUSde0";

export interface MonitoringSheetRow {
  empresa: string;
  colab: number;
  gestor: number;
  totalColaboradores: number;
  percentual: number;
  ultimaResposta: string;
}

export interface MasterCompanySummary {
  empresaName: string;
  economicGroup: string;
  employeeResponses: number;
  managerResponses: number;
  totalResponses: number;
  totalEmployees?: number;
  lastResponseDate?: string;
  percentual?: number;
  collabRows: any[];
  managerRows: any[];
}

function cleanId(rawId?: string): string {
  if (!rawId) return "";
  let trimmed = rawId.trim();
  if (trimmed.includes("/d/")) {
    const parts = trimmed.split("/d/");
    if (parts[1]) {
      trimmed = parts[1].split("/")[0];
    }
  } else if (trimmed.includes("id=")) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) trimmed = match[1];
  }
  return trimmed;
}

function parseNum(val: any): number {
  if (val === undefined || val === null) return 0;
  const s = String(val).replace(/[^0-9.,]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        success: false,
        message: "Método HTTP não permitido. Use POST."
      }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body opcional
    }

    let rawId = body.masterSheetId || body.spreadsheetId || body.rootFolderId || Deno.env.get("MASTER_SHEET_ID") || DEFAULT_SPREADSHEET_ID;
    let masterSheetId = cleanId(rawId) || DEFAULT_SPREADSHEET_ID;

    // 1. Autenticação JWT com a Service Account configurada (conexarp-sync@...)
    const authService = new GoogleAuthService();
    const accessToken = await authService.getAccessToken();

    // 2. Lê metadados para encontrar a aba "Painel" ou "Página1"
    let metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}?includeGridData=false`;
    let metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
    });

    // Se falhar com o ID informado (por ser ID antigo de pasta), tenta fallback automático para a Planilha Mestra Oficial
    if (!metaRes.ok && masterSheetId !== DEFAULT_SPREADSHEET_ID) {
      console.warn(`[Google Sheets Sync] Falha ao acessar ID informado (${masterSheetId}). Tentando fallback automático para a Planilha Mestra Oficial (${DEFAULT_SPREADSHEET_ID})...`);
      masterSheetId = DEFAULT_SPREADSHEET_ID;
      metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}?includeGridData=false`;
      metaRes = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
      });
    }

    const metaJson = await metaRes.json();

    if (!metaRes.ok) {
      console.error("[Google Sheets Sync] Erro ao acessar planilha mestra:", metaJson);
      return new Response(JSON.stringify({
        success: false,
        message: `Falha ao acessar a Planilha ID: ${masterSheetId}`,
        details: metaJson?.error?.message || "Verifique se a planilha foi compartilhada com a Service Account (conexarp-sync@...)."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sheetsInfo = metaJson.sheets || [];
    const painelSheet = sheetsInfo.find((s: any) => {
      const title = (s.properties?.title || '').toUpperCase().trim();
      return title.includes('PAINEL') || title.includes('MONITORAMENTO') || title.includes('DASHBOARD');
    }) || sheetsInfo.find((s: any) => {
      const title = (s.properties?.title || '').toUpperCase().trim();
      return !title.includes('CONFIGURAC') && !title.includes('CONFIGURAÇÃO');
    }) || sheetsInfo[0];

    const activeSheetTitle = painelSheet?.properties?.title || "Painel";

    // -------------------------------------------------------------
    // AÇÃO: Atualizar Coluna D (Total de Colaboradores) na Planilha
    // -------------------------------------------------------------
    if (body.action === 'update_total_employees' || body.action === 'update_column_d') {
      const targetEmpresa = String(body.empresa || '').toUpperCase().trim();
      const newTotal = parseNum(body.totalEmployees);

      if (!targetEmpresa) {
        return new Response(JSON.stringify({
          success: false,
          message: "Nome da empresa é obrigatório para atualizar o Total de Colaboradores."
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Lê a coluna A (Empresas) para localizar a linha correspondente
      const colARange = encodeURIComponent(`'${activeSheetTitle}'!A2:A2000`);
      const colAUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/${colARange}?majorDimension=ROWS`;
      const colARes = await fetch(colAUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
      });
      const colAJson = await colARes.json();

      const colARows: any[][] = colAJson.values || [];
      let foundRowIndex = -1;

      for (let i = 0; i < colARows.length; i++) {
        const cellVal = String(colARows[i][0] || '').toUpperCase().trim();
        if (cellVal === targetEmpresa || cellVal.includes(targetEmpresa) || targetEmpresa.includes(cellVal)) {
          foundRowIndex = i + 2; // Linha real no Google Sheets (1-indexed + 1 de cabeçalho = i + 2)
          break;
        }
      }

      if (foundRowIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          message: `Empresa "${body.empresa}" não encontrada na Coluna A da aba '${activeSheetTitle}'.`
        }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Atualiza a célula correspondente na Coluna D (ex: Painel!D5)
      const updateRange = encodeURIComponent(`'${activeSheetTitle}'!D${foundRowIndex}`);
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;
      
      const updateRes = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          range: `'${activeSheetTitle}'!D${foundRowIndex}`,
          majorDimension: "ROWS",
          values: [[ newTotal ]]
        })
      });

      const updateJson = await updateRes.json();

      if (!updateRes.ok) {
        return new Response(JSON.stringify({
          success: false,
          message: `Erro ao atualizar célula D${foundRowIndex} no Google Sheets.`,
          details: updateJson?.error?.message || JSON.stringify(updateJson)
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`[Google Sheets Sync] ✅ Coluna D da empresa "${body.empresa}" atualizada para ${newTotal} na linha ${foundRowIndex}`);

      return new Response(JSON.stringify({
        success: true,
        empresa: body.empresa,
        rowUpdated: foundRowIndex,
        totalEmployees: newTotal,
        message: `Coluna D (Total Colaboradores) da empresa "${body.empresa}" atualizada com sucesso no Google Sheets!`
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // -------------------------------------------------------------
    // AÇÃO: Leitura Principal do Intervalo A2:F
    // -------------------------------------------------------------
    console.log(`[Google Sheets Sync] Lendo aba mestra: "${activeSheetTitle}" a partir da linha 2 (A2:F)`);

    const range = encodeURIComponent(`'${activeSheetTitle}'!A2:F2000`);
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/${range}?majorDimension=ROWS`;
    const valuesRes = await fetch(valuesUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
    });
    const valuesJson = await valuesRes.json();

    if (!valuesRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        message: `Erro ao ler intervalo A2:F da aba '${activeSheetTitle}'.`,
        details: valuesJson?.error?.message || JSON.stringify(valuesJson)
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawRows: any[][] = valuesJson.values || [];
    const rows: MonitoringSheetRow[] = [];
    const companiesSummary: Record<string, MasterCompanySummary> = {};

    rawRows.forEach((rowValues) => {
      if (!rowValues || rowValues.length === 0) return;

      const empresa = String(rowValues[0] || '').trim();
      if (!empresa || empresa.toUpperCase() === 'EMPRESA' || empresa.toUpperCase().includes('TOTAL')) return;

      const colab = parseNum(rowValues[1]);
      const gestor = parseNum(rowValues[2]);
      let totalColaboradores = parseNum(rowValues[3]);

      if (totalColaboradores === 0 && colab > 0) {
        totalColaboradores = colab;
      }

      // Calcula percentual: se a célula da coluna E tiver um valor numérico válido, usa ela; senão calcula (colab / totalColaboradores) * 100
      let percentual = 0;
      const rawPercentStr = rowValues[4] !== undefined ? String(rowValues[4]).trim() : '';
      if (rawPercentStr && !rawPercentStr.includes('#') && !rawPercentStr.includes('N/A')) {
        percentual = parseNum(rawPercentStr);
      }
      if (percentual === 0 && totalColaboradores > 0) {
        percentual = Number(((colab / totalColaboradores) * 100).toFixed(1));
      }

      const ultimaResposta = rowValues[5] !== undefined ? String(rowValues[5]).trim() : '';

      const parsedRow: MonitoringSheetRow = {
        empresa,
        colab,
        gestor,
        totalColaboradores,
        percentual,
        ultimaResposta
      };

      rows.push(parsedRow);

      const empKey = empresa.toUpperCase();
      companiesSummary[empKey] = {
        empresaName: empresa,
        economicGroup: 'Corporativo',
        employeeResponses: colab,
        managerResponses: gestor,
        totalResponses: colab + gestor,
        totalEmployees: totalColaboradores,
        lastResponseDate: ultimaResposta,
        percentual,
        collabRows: [],
        managerRows: []
      };
    });

    const totalResponses = rows.reduce((acc, r) => acc + r.colab + r.gestor, 0);

    console.log(`[Google Sheets Sync] ✅ Sincronização concluída da aba "${activeSheetTitle}". Total de empresas lidas: ${rows.length}`);

    return new Response(JSON.stringify({
      success: true,
      scannedAt: new Date().toISOString(),
      masterSheetId,
      sheetTitle: activeSheetTitle,
      totalRowsRead: rows.length,
      totalResponses,
      companiesCount: rows.length,
      rows,
      companiesSummary,
      summary: {
        totalFolders: rows.length,
        totalForms: rows.length * 2,
        employeeForms: rows.filter(r => r.colab > 0).length,
        managerForms: rows.filter(r => r.gestor > 0).length,
        totalResponses
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Erro na Supabase Edge Function google-workspace-sync:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error?.message || "Erro na sincronização com a Planilha Mestra.",
      details: error?.toString() || "Nenhum detalhe adicional."
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
