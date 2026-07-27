// supabase/functions/google-workspace-sync/GoogleAuthService.ts

function base64UrlEncode(buffer: Uint8Array): string {
  let str = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    str += String.fromCharCode(buffer[i]);
  }
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function stringToBase64Url(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

function pemToBinary(pem: string): Uint8Array {
  const cleanPem = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/[\s\r\n]/g, "");
  
  const raw = atob(cleanPem);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer;
}

export class GoogleAuthService {
  private clientEmail: string;
  private privateKey: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientEmail?: string, privateKey?: string) {
    this.clientEmail = clientEmail || Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") || "";
    this.privateKey = privateKey || Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || "";
    
    if (!this.clientEmail || !this.privateKey) {
      console.warn("GoogleAuthService: Credenciais da Service Account GCP não configuradas em variáveis de ambiente.");
    }
  }

  async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.tokenExpiry > now + 60) {
      return this.cachedToken;
    }

    if (!this.clientEmail || !this.privateKey) {
      throw new Error("Credenciais GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY são obrigatórias no Supabase.");
    }

    const header = { alg: "RS256", typ: "JWT" };
    const scopes = [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly"
    ].join(" ");

    const claimSet = {
      iss: this.clientEmail,
      scope: scopes,
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = stringToBase64Url(JSON.stringify(header));
    const encodedClaimSet = stringToBase64Url(JSON.stringify(claimSet));
    const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

    const keyBuffer = pemToBinary(this.privateKey);
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
    const jwt = `${unsignedToken}.${encodedSignature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha de autenticação na Service Account do Google: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.cachedToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in || 3600);

    return this.cachedToken;
  }
}
