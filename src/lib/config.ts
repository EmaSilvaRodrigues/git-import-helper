/**
 * Diary / Check-in backend configuration.
 *
 * IMPORTANT: This app talks ONLY to the diary check-in backend (port 3000 on
 * the Raspberry Pi, exposed via ngrok). It must NOT call the INVST backend
 * and must NOT use the INVST API key.
 *
 * Diary routes live under:
 *   - /api/checkins
 *   - /api/users
 *   - /api/images
 *   - /api/utils
 *   - /health
 */

const DEFAULT_DIARY_BASE_URL =
  'https://sixtypenny-pseudonymously-randall.ngrok-free.dev/diary';

const DEFAULT_DIARY_API_KEY =
  'e81f7f0421f39c243691c78e518b07d8f692f90f3e89ec0d53d0d2467adfb5a9';

export const DIARY_BASE_URL = (
  import.meta.env.VITE_DIARY_API_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_DIARY_BASE_URL
).replace(/\/$/, '');

export const DIARY_API_KEY =
  import.meta.env.VITE_DIARY_API_KEY || DEFAULT_DIARY_API_KEY;

// Hard guarantee: the diary backend lives under /diary. If somehow a base URL
// without that suffix is configured (old env var, root-domain leftover), force
// it back so production/mobile never call the wrong backend.
export const RESOLVED_DIARY_BASE_URL = /\/diary$/.test(DIARY_BASE_URL)
  ? DIARY_BASE_URL
  : `${DIARY_BASE_URL.replace(/\/$/, '')}/diary`;

/** Common headers that every diary request must send. */
export const diaryAuthHeaders = (): Record<string, string> => ({
  'x-api-key': DIARY_API_KEY,
  'ngrok-skip-browser-warning': 'true',
});

if (typeof window !== 'undefined') {
  console.info('[Diary Config] Resolved base URL:', RESOLVED_DIARY_BASE_URL);
  console.info(
    '[Diary Config] x-api-key header attached:',
    Boolean(DIARY_API_KEY),
    DIARY_API_KEY ? `(length ${DIARY_API_KEY.length})` : '(MISSING!)'
  );
  console.info('[Diary Config] Mode:', import.meta.env.MODE, '| PROD:', import.meta.env.PROD);
}

/** Human-readable error for HTTP status codes from the diary backend. */
export function diaryErrorMessage(status: number, fallback?: string): string {
  switch (status) {
    case 401:
      return 'Diary authentication failed';
    case 403:
      return 'Diary key does not have access to this route';
    case 404:
      return 'Diary backend route not found or wrong backend URL';
    default:
      return fallback || `Diary backend error (HTTP ${status})`;
  }
}
