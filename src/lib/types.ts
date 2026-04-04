// User Types
export type UserId = 1 | 2 | 3 | 4;
export type UserName = 'João' | 'Bruna' | 'Ema' | 'André';

export interface User {
  id: UserId;
  name: UserName;
  avatar_color: string;
  created_at: string;
}

// Check-in Types
export interface CheckIn {
  id: number;
  user_id: UserId;
  name: UserName;
  avatar_color: string;
  week_number: number;
  year: number;
  best_moment: string;
  strange_thing: string;
  learned: string;
  image_filename: string | null;
  is_locked: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface CreateCheckInRequest {
  user_id: UserId;
  week_number: number;
  year: number;
  best_moment: string;
  strange_thing: string;
  learned: string;
}

export interface UpdateCheckInRequest {
  best_moment?: string;
  strange_thing?: string;
  learned?: string;
}

// Week Types
export interface CurrentWeek {
  current_week: number;
  current_year: number;
  week_start: string;
  week_end: string;
  iso_format: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Mapping
export const USER_MAPPING: Record<UserName, { id: UserId; color: string; emoji: string }> = {
  'João': { id: 1, color: '#3B82F6', emoji: '🌊' },
  'Bruna': { id: 2, color: '#EC4899', emoji: '🌻' },
  'Ema': { id: 3, color: '#10B981', emoji: '🌷' },
  'André': { id: 4, color: '#F59E0B', emoji: '🌴' },
} as const;

export const ID_TO_USER: Record<UserId, { name: UserName; color: string; emoji: string }> = {
  1: { name: 'João', color: '#3B82F6', emoji: '🌊' },
  2: { name: 'Bruna', color: '#EC4899', emoji: '🌻' },
  3: { name: 'Ema', color: '#10B981', emoji: '🌷' },
  4: { name: 'André', color: '#F59E0B', emoji: '🌴' },
} as const;

export const USERS: UserName[] = ['João', 'Bruna', 'Ema', 'André'];

export const QUESTIONS = [
  { key: 'best_moment', label: 'Melhor momento da semana', emoji: '✨' },
  { key: 'strange_thing', label: 'Coisa estranha que aconteceu', emoji: '🤔' },
  { key: 'learned', label: 'Algo que aprendi esta semana', emoji: '💡' },
] as const;

// Image Upload Types
export interface ImageUploadResponse {
  id?: number;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

// Stats Types
export interface UserStats {
  name: UserName;
  checkin_count: number;
  images_count: number;
}

export interface Stats {
  total_checkins: number;
  checkins_with_images: number;
  unique_weeks: number;
  by_user: UserStats[];
}

// History Types
export interface WeekTimeline {
  week_number: number;
  year: number;
  checkin_count: number;
  first_checkin: string;
  checkins: CheckIn[];
}
