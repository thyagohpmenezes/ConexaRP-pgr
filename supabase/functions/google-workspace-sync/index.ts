// supabase/functions/google-workspace-sync/index.ts
import { GoogleAuthService } from "./GoogleAuthService.ts";
import { GoogleWorkspaceScanner, DiscoveredFolder } from "./GoogleWorkspaceScanner.ts";
import { SurveyMetricsService } from "./SurveyMetricsService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  rootFolderId: string;
}

interface EnrichedForm {
  id: string;
  name: string;
  formType: 'EMPLOYEE' | 'MANAGER' | 'CHECKLIST' | 'UNKNOWN';
  folderId: string;
  folderPath: string[];
  linkedSheetId?: string;
  linkedSheetName?: string;
  webViewLink?: string;
  metrics?: {
    totalRows: number;
    responseCount: number;
  };
}

interface EnrichedFolder {
  id: string;
  name: string;
  path: string[];
  forms: EnrichedForm[];
  subFolders: EnrichedFolder[];
}

function countFoldersAndForms(node: EnrichedFolder): { totalFolders: number; totalForms: number; employeeForms: number; managerForms: number; totalResponses: number } {
  let totalFolders = 1;
  let totalForms = node.forms.length;
  let employeeForms = node.forms.filter(f => f.formType === 'EMPLOYEE').length;
  let managerForms = node.forms.filter(f => f.formType === 'MANAGER').length;
  let totalResponses = node.forms.reduce((acc, f) => acc + (f.metrics?.responseCount || 0), 0);

  for (const sub of node.subFolders) {
    const subCounts = countFoldersAndForms(sub);
    totalFolders += subCounts.totalFolders;
    totalForms += subCounts.totalForms;
    employeeForms += subCounts.employeeForms;
    managerForms += subCounts.managerForms;
    totalResponses += subCounts.totalResponses;
  }

  return { totalFolders, totalForms, employeeForms, managerForms, totalResponses };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método HTTP não permitido. Use POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body: RequestPayload = await req.json();
    if (!body || !body.rootFolderId) {
      return new Response(JSON.stringify({ error: "O parâmetro 'rootFolderId' é obrigatório no corpo da requisição." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Autentica via Service Account GCP
    const authService = new GoogleAuthService();
    const accessToken = await authService.getAccessToken();

    // 2. Varredura recursiva do Drive
    const scanner = new GoogleWorkspaceScanner(accessToken);
    const rawTree: DiscoveredFolder = await scanner.scanTreeRecursively(body.rootFolderId);

    // 3. Leitura de métricas das planilhas vinculadas
    const metricsService = new SurveyMetricsService(accessToken);

    async function enrichTreeWithMetrics(folderNode: DiscoveredFolder): Promise<EnrichedFolder> {
      const enrichedForms: EnrichedForm[] = [];

      for (const form of folderNode.forms) {
        let metrics: { totalRows: number; responseCount: number } | undefined = undefined;

        if (form.linkedSheetId) {
          const m = await metricsService.getSpreadsheetMetrics(form.linkedSheetId);
          metrics = {
            totalRows: m.totalRows,
            responseCount: m.responseCount
          };
        }

        enrichedForms.push({
          ...form,
          metrics
        });
      }

      const enrichedSubFolders: EnrichedFolder[] = [];
      for (const sub of folderNode.subFolders) {
        const enrichedSub = await enrichTreeWithMetrics(sub);
        enrichedSubFolders.push(enrichedSub);
      }

      return {
        id: folderNode.id,
        name: folderNode.name,
        path: folderNode.path,
        forms: enrichedForms,
        subFolders: enrichedSubFolders
      };
    }

    const enrichedRootTree = await enrichTreeWithMetrics(rawTree);
    const summary = countFoldersAndForms(enrichedRootTree);

    const resultPayload = {
      success: true,
      scannedAt: new Date().toISOString(),
      rootFolderId: body.rootFolderId,
      summary,
      tree: enrichedRootTree
    };

    return new Response(JSON.stringify(resultPayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Erro na Supabase Edge Function google-workspace-sync:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Erro interno na sincronização do Google Workspace."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
