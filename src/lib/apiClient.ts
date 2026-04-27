import type {
  User,
  CheckIn,
  CreateCheckInRequest,
  UpdateCheckInRequest,
  CurrentWeek,
  UserId,
  ImageUploadResponse,
  Stats,
  WeekTimeline,
} from './types';
import {
  RESOLVED_DIARY_BASE_URL,
  DIARY_REQUEST_TIMEOUT_MS,
  diaryAuthHeaders,
  diaryErrorMessage,
} from './config';

const createTimeoutSignal = (timeoutMs: number): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => globalThis.clearTimeout(timeoutId),
  };
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');

    // Hard guard: the diary frontend MUST talk to a URL ending in /diary.
    // If the bundle was built with an older base URL (no /diary), force-fix it
    // here so the deployed site never silently calls the wrong backend path.
    if (!/\/diary$/.test(this.baseUrl)) {
      const fixed = this.baseUrl.replace(/\/+$/, '') + '/diary';
      console.error(
        '[Diary API] Base URL missing /diary prefix. Forcing:',
        this.baseUrl,
        '->',
        fixed
      );
      this.baseUrl = fixed;
    }
  }

  get base(): string {
    return this.baseUrl;
  }

  private buildUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/${normalizedEndpoint}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const { signal, cleanup } = createTimeoutSignal(DIARY_REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...options,
        signal: options.signal || signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Pedido ao diário excedeu ${DIARY_REQUEST_TIMEOUT_MS / 1000}s`);
      }

      throw error;
    } finally {
      cleanup();
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = {
      'Content-Type': 'application/json',
      ...diaryAuthHeaders(),
      ...options.headers,
    };

    console.info('[Diary API] Request URL:', url);
    console.info('[Diary API] x-api-key header attached:', Boolean(headers['x-api-key']));

    try {
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          diaryErrorMessage(
            response.status,
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('[Diary API] Error:', error);
      throw error;
    }
  }

  // ============ USERS ============
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ success: boolean; users: User[] }>('api/users');
    return response.users;
  }

  async getUser(userId: UserId): Promise<User> {
    const response = await this.request<{ success: boolean; user: User }>(`api/users/${userId}`);
    return response.user;
  }

  // ============ CHECK-INS ============
  async createCheckIn(data: CreateCheckInRequest): Promise<CheckIn> {
    const response = await this.request<{ success: boolean; checkin: CheckIn }>('api/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.checkin;
  }

  async getCheckIn(userId: UserId, weekNumber: number, year: number): Promise<CheckIn | null> {
    try {
      const response = await this.request<{ success: boolean; checkin: CheckIn }>(
        `api/checkins/${userId}/${weekNumber}/${year}`
      );
      return response.checkin;
    } catch {
      return null;
    }
  }

  async getCheckInsForWeek(weekNumber: number, year: number): Promise<CheckIn[]> {
    const response = await this.request<{ success: boolean; checkins: CheckIn[] }>(
      `api/checkins/week/${weekNumber}/${year}`
    );
    return response.checkins || [];
  }

  async updateCheckIn(checkinId: number, data: UpdateCheckInRequest): Promise<CheckIn> {
    const response = await this.request<{ success: boolean; checkin: CheckIn }>(
      `api/checkins/${checkinId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.checkin;
  }

  async getHistory(limit: number = 10, offset: number = 0): Promise<{ timeline: WeekTimeline[]; count: number }> {
    const response = await this.request<{ success: boolean; timeline: WeekTimeline[]; count: number }>(
      `api/checkins/history?limit=${limit}&offset=${offset}`
    );
    return { timeline: response.timeline || [], count: response.count || 0 };
  }

  // ============ IMAGES ============
  async uploadImage(
    checkinId: number,
    file: File
  ): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('checkin_id', checkinId.toString());

    const url = this.buildUrl('api/images/upload');
    console.info('[Diary API] Request URL:', url);
    console.info('[Diary API] x-api-key header attached:', Boolean(diaryAuthHeaders()['x-api-key']));

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      body: formData,
      headers: diaryAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        diaryErrorMessage(
          response.status,
          errorData.error || `Upload failed: ${response.statusText}`
        )
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.image;
  }

  async getCheckInImages(checkinId: number): Promise<ImageUploadResponse[]> {
    try {
      const response = await this.request<{ success: boolean; images: ImageUploadResponse[] }>(
        `api/images/checkin/${checkinId}`
      );
      return response.images || [];
    } catch {
      return [];
    }
  }

  async deleteImage(imageId: number): Promise<void> {
    await this.request(`api/images/${imageId}`, { method: 'DELETE' });
  }

  getImageUrl(filename: string): string {
    if (!filename) return '';
    return `${this.baseUrl}/uploads/${filename}`;
  }

  // ============ UTILS ============
  async getCurrentWeek(): Promise<CurrentWeek> {
    const response = await this.request<CurrentWeek & { success: boolean }>('api/utils/current-week');
    return {
      current_week: response.current_week,
      current_year: response.current_year,
      week_start: response.week_start,
      week_end: response.week_end,
      iso_format: response.iso_format,
    };
  }

  async getStats(): Promise<Stats> {
    const response = await this.request<{ success: boolean; stats: Stats }>('api/utils/stats');
    return response.stats;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    // The diary backend exposes /health at the root (not under /api/utils).
    const url = this.buildUrl('health');
    const headers = diaryAuthHeaders();
    console.info('[Diary API] Request URL:', url);
    console.info('[Diary API] x-api-key header attached:', Boolean(headers['x-api-key']));
    const res = await this.fetchWithTimeout(url, { headers });
    if (!res.ok) {
      throw new Error(diaryErrorMessage(res.status, `Health check failed (HTTP ${res.status})`));
    }
    return res.json();
  }
}

export const apiClient = new ApiClient(RESOLVED_DIARY_BASE_URL);
export type { ImageUploadResponse };

// ---- Startup health check ----------------------------------------------
// Runs once on app load so misconfiguration (wrong backend URL or wrong API
// key) shows up immediately in the console instead of failing silently per
// request.
if (typeof window !== 'undefined') {
  console.info(`[Diary API] Using base URL: ${RESOLVED_DIARY_BASE_URL}`);
  apiClient
    .healthCheck()
    .then((h) => console.info('[Diary API] /health OK', h))
    .catch((err) => console.warn('[Diary API] /health failed:', err.message));

  apiClient
    .getHistory(1, 0)
    .then(() => console.info('[Diary API] /api/checkins/history OK'))
    .catch((err) =>
      console.warn('[Diary API] /api/checkins/history failed:', err.message)
    );
}
