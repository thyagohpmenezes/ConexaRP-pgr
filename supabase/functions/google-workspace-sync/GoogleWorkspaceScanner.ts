// supabase/functions/google-workspace-sync/GoogleWorkspaceScanner.ts

export interface DiscoveredFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DiscoveredForm {
  id: string;
  name: string;
  formType: 'EMPLOYEE' | 'MANAGER' | 'CHECKLIST' | 'UNKNOWN';
  folderId: string;
  folderPath: string[];
  linkedSheetId?: string;
  linkedSheetName?: string;
  webViewLink?: string;
}

export interface DiscoveredFolder {
  id: string;
  name: string;
  path: string[];
  forms: DiscoveredForm[];
  spreadsheets: DiscoveredFile[];
  subFolders: DiscoveredFolder[];
}

export class GoogleWorkspaceScanner {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Sanitiza a string do ID da pasta removendo caminhos de URL, parâmetros de query ou barras no final
   */
  public cleanFolderId(rawFolderId: string): string {
    if (!rawFolderId) return "";
    let clean = rawFolderId.trim();

    if (clean.includes("/folders/")) {
      clean = clean.split("/folders/")[1];
    }
    if (clean.includes("?")) {
      clean = clean.split("?")[0];
    }
    if (clean.includes("#")) {
      clean = clean.split("#")[0];
    }
    return clean.replace(/\/+$/, "");
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
            const errText = await response.text();
            throw new Error(`Google Drive API HTTP ${response.status} após ${retries} tentativas: ${errText}`);
          }

          const retryAfter = response.headers.get("retry-after");
          let backoff = Math.pow(2, attempt) * 400 + Math.random() * 150;
          if (retryAfter) {
            const sec = parseInt(retryAfter, 10);
            if (!isNaN(sec) && sec > 0) backoff = sec * 1000;
          }

          console.warn(`[Google Drive API] Rate limit HTTP ${response.status} (Tentativa ${attempt + 1}/${retries}). Pausando ${(backoff / 1000).toFixed(2)}s...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google Drive API Error (${response.status}): ${errText}`);
        }

        return await response.json();
      } catch (err: any) {
        if (attempt === retries) throw err;
        const backoff = Math.pow(2, attempt) * 400 + Math.random() * 150;
        console.warn(`[Google Drive API] Aviso na varredura: ${err?.message || err}. Retentando em ${(backoff / 1000).toFixed(2)}s...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  async listFolderContents(rawFolderId: string): Promise<DiscoveredFile[]> {
    const folderId = this.cleanFolderId(rawFolderId);
    const files: DiscoveredFile[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent("nextPageToken,files(id,name,mimeType,parents,createdTime,modifiedTime,webViewLink)");
      // Garante suporte a Shared Drives e pastas compartilhadas em todas as chamadas
      let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const data = await this.fetchWithBackoff(url);
      if (data && data.files && Array.isArray(data.files)) {
        files.push(...data.files);
      }
      pageToken = data?.nextPageToken;
    } while (pageToken);

    return files;
  }

  classifyForm(fileName: string = ""): 'EMPLOYEE' | 'MANAGER' | 'CHECKLIST' | 'UNKNOWN' {
    const upper = (fileName || "").toUpperCase();
    if (upper.includes("GEST") || upper.includes("LIDER") || upper.includes("DIRETOR") || upper.includes("GERENTE")) {
      return "MANAGER";
    }
    if (upper.includes("COLAB") || upper.includes("FUNCIO") || upper.includes("OPERACIONAL") || upper.includes("EQUIPE")) {
      return "EMPLOYEE";
    }
    if (upper.includes("CHECKLIST") || upper.includes("EMPRESA") || upper.includes("CONFORMIDADE")) {
      return "CHECKLIST";
    }
    return "UNKNOWN";
  }

  /**
   * Normaliza o nome do arquivo removendo espaços extras e convertendo para minúsculas
   */
  private normalizeName(name: string = ""): string {
    return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  async scanTreeRecursively(rawFolderId: string, currentPath: string[] = [], depth = 0): Promise<DiscoveredFolder> {
    const folderId = this.cleanFolderId(rawFolderId);
    console.log(`[Google Workspace Scanner] Varrendo pasta ID: "${folderId}" (profundidade ${depth})...`);

    let items: DiscoveredFile[] = [];
    try {
      items = await this.listFolderContents(folderId);
    } catch (err: any) {
      console.warn(`[Google Workspace Scanner] Falha ao listar conteúdo da pasta "${folderId}": ${err?.message || err}`);
    }

    const folderInfoUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`;
    let folderName = "Pasta Raiz";
    try {
      const info = await this.fetchWithBackoff(folderInfoUrl);
      folderName = info?.name || folderName;
    } catch {
      // Usa o fallback gracioso
    }

    const updatedPath = [...currentPath, folderName];

    const childFolders = items.filter((i) => i && i.mimeType === "application/vnd.google-apps.folder");
    const rawForms = items.filter((i) => i && i.mimeType === "application/vnd.google-apps.form");
    const rawSheets = items.filter((i) => i && i.mimeType === "application/vnd.google-apps.spreadsheet");

    const forms: DiscoveredForm[] = rawForms.map((form) => {
      const formType = this.classifyForm(form?.name || "");
      const formNameNormalized = this.normalizeName(form?.name);
      
      // Nome exato esperado da planilha conforme convenção: "<nome do formulário> (respostas)"
      const expectedSheetNameNormalized = `${formNameNormalized} (respostas)`;

      // 1. Tenta correspondência exata determinística por convenção de nome
      let matchedSheet = rawSheets.find((sheet) => {
        const sheetNameNormalized = this.normalizeName(sheet?.name);
        return sheetNameNormalized === expectedSheetNameNormalized;
      });

      // 2. Fallback determinístico por tipo de formulário caso a nomenclatura tenha pequenas variações sem usar includes genérico
      if (!matchedSheet && rawSheets.length > 0) {
        matchedSheet = rawSheets.find((sheet) => {
          const sNorm = this.normalizeName(sheet?.name);
          if (formType === 'MANAGER') {
            return (sNorm.includes("gestor") || sNorm.includes("gestores") || sNorm.includes("lider")) && sNorm.includes("respostas");
          }
          if (formType === 'EMPLOYEE') {
            return (sNorm.includes("colaborador") || sNorm.includes("colaboradores") || sNorm.includes("funcio")) && sNorm.includes("respostas");
          }
          return false;
        });
      }

      return {
        id: form.id,
        name: form.name || "Formulário sem nome",
        formType,
        folderId,
        folderPath: updatedPath,
        linkedSheetId: matchedSheet?.id,
        linkedSheetName: matchedSheet?.name,
        webViewLink: form.webViewLink
      };
    });

    const subFolders: DiscoveredFolder[] = [];
    // Limite máximo de profundidade de 3 níveis para evitar estouro de timeout
    if (depth < 3) {
      for (const sub of childFolders) {
        try {
          const subTree = await this.scanTreeRecursively(sub.id, updatedPath, depth + 1);
          subFolders.push(subTree);
        } catch (subErr: any) {
          console.warn(`[Google Workspace Scanner] Pulo na subpasta "${sub.name}" (${sub.id}): ${subErr?.message || subErr}`);
        }
      }
    }

    return {
      id: folderId,
      name: folderName,
      path: updatedPath,
      forms,
      spreadsheets: rawSheets,
      subFolders
    };
  }
}
