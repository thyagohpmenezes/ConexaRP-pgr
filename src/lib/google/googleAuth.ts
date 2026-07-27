// Google Auth & Access Token Manager for Google Drive / Sheets API

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

let accessTokenInMemory: string | null = localStorage.getItem('conexarp_google_access_token');

export function getGoogleAccessToken(): string | null {
  return accessTokenInMemory;
}

export function setGoogleAccessToken(token: string | null) {
  accessTokenInMemory = token;
  if (token) {
    localStorage.setItem('conexarp_google_access_token', token);
  } else {
    localStorage.removeItem('conexarp_google_access_token');
  }
}

/**
 * Helper to initialize Google GIS token client script if available in window,
 * or allows user to prompt token acquisition.
 */
export function initGoogleOAuth(
  clientId: string,
  onTokenReceived: (token: string) => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined') return;

  const windowWithGoogle = window as any;

  if (windowWithGoogle.google?.accounts?.oauth2) {
    const tokenClient = windowWithGoogle.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          setGoogleAccessToken(response.access_token);
          onTokenReceived(response.access_token);
        } else if (onError) {
          onError(response);
        }
      },
    });

    tokenClient.requestAccessToken();
  } else {
    // If GIS script not yet loaded dynamically:
    loadGisScript(() => {
      initGoogleOAuth(clientId, onTokenReceived, onError);
    });
  }
}

function loadGisScript(onLoad: () => void) {
  if (document.getElementById('google-gis-script')) {
    onLoad();
    return;
  }
  const script = document.createElement('script');
  script.id = 'google-gis-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = onLoad;
  document.body.appendChild(script);
}
