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

  private async fetchWithBackoff(url: string, retries = 4): Promise<any> {
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
            throw new Error(`Google API HTTP ${response.status} após ${retries} tentativas.`);
          }
          const backoff = Math.pow(2, attempt) * 250 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google Drive API Error (${response.status}): ${errText}`);
        }

        return await response.json();
      } catch (err) {
        if (attempt === retries) throw err;
        const backoff = Math.pow(2, attempt) * 250 + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  async listFolderContents(folderId: string): Promise<DiscoveredFile[]> {
    const files: DiscoveredFile[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent("nextPageToken,files(id,name,mimeType,parents,createdTime,modifiedTime,webViewLink)");
      let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const data = await this.fetchWithBackoff(url);
      if (data.files && Array.isArray(data.files)) {
        files.push(...data.files);
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return files;
  }

  classifyForm(fileName: string): 'EMPLOYEE' | 'MANAGER' | 'CHECKLIST' | 'UNKNOWN' {
    const upper = fileName.toUpperCase();
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

  async scanTreeRecursively(folderId: string, currentPath: string[] = []): Promise<DiscoveredFolder> {
    const items = await this.listFolderContents(folderId);

    const folderInfoUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`;
    let folderName = "Pasta Raiz";
    try {
      const info = await this.fetchWithBackoff(folderInfoUrl);
      folderName = info.name || folderName;
    } catch {
      // Usa o fallback
    }

    const updatedPath = [...currentPath, folderName];

    const childFolders = items.filter((i) => i.mimeType === "application/vnd.google-apps.folder");
    const rawForms = items.filter((i) => i.mimeType === "application/vnd.google-apps.form");
    const rawSheets = items.filter((i) => i.mimeType === "application/vnd.google-apps.spreadsheet");

    // Associa planilhas aos formulários encontrados na mesma pasta por proximidade de nomenclatura
    const forms: DiscoveredForm[] = rawForms.map((form) => {
      const formType = this.classifyForm(form.name);
      
      // Busca a planilha correspondente na mesma pasta
      let matchedSheet = rawSheets.find((sheet) => {
        const sUpper = sheet.name.toUpperCase();
        const fUpper = form.name.toUpperCase();
        return sUpper.includes(fUpper) || fUpper.includes(sUpper) || sUpper.includes("RESPOSTAS");
      });

      if (!matchedSheet && rawSheets.length === 1) {
        matchedSheet = rawSheets[0];
      }

      return {
        id: form.id,
        name: form.name,
        formType,
        folderId,
        folderPath: updatedPath,
        linkedSheetId: matchedSheet?.id,
        linkedSheetName: matchedSheet?.name,
        webViewLink: form.webViewLink
      };
    });

    const subFolders: DiscoveredFolder[] = [];
    for (const sub of childFolders) {
      const subTree = await this.scanTreeRecursively(sub.id, updatedPath);
      subFolders.push(subTree);
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
