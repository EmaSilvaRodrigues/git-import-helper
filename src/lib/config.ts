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
  'https://sixtypenny-pseudonymously-randall.ngrok-free.dev';

const DEFAULT_DIARY_API_KEY =
  'e81f7f0421f39c243691c78e518b07d8f692f90f3e89ec0d53d0d2467adfb5a9';

export const DIARY_BASE_URL = (
  import.meta.env.VITE_DIARY_API_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_DIARY_BASE_URL
).replace(/\/$/, '');

export const DIARY_API_KEY =
  import.meta.env.VITE_DIARY_API_KEY || DEFAULT_DIARY_API_KEY;

/** Common headers that every diary request must send. */
export const diaryAuthHeaders = (): Record<string, string> => ({
  'x-api-key': DIARY_API_KEY,
  'ngrok-skip-browser-warning': 'true',
});

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
