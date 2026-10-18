export type BarberStatus = 'available' | 'serving' | 'on_break' | 'unavailable';

export type StyleCategory =
  | 'fade_taper'
  | 'classic'
  | 'modern_textured'
  | 'crew_short'
  | 'long_hair'
  | 'beard_shaping'
  | 'moustache'
  | 'combo';

export type QueueStatus = 'waiting' | 'in_service' | 'completed' | 'skipped' | 'cancelled';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Barber {
  id: string;
  name: string;
  photo_url: string;
  bio: string;
  experience_years: number;
  specialties: string[];
  is_active: boolean;
  current_status: BarberStatus;
  break_ends_at?: string | null;
  avg_service_mins: number;
  pin_code: string; // 4-digit PIN for rapid mobile auth
  working_hours: {
    start: string; // "09:00"
    end: string;   // "21:00"
    days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  };
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price_inr: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface HaircutStyle {
  id: string;
  name: string;
  category: StyleCategory;
  description: string;
  image_url: string;
  default_price_inr: number;
  estimated_mins: number;
  is_trending: boolean;
  barber_instruction_notes?: string;
}

export interface QueueEntry {
  id: string;
  salon_id: string;
  barber_id: string | null; // null if customer chose 'Any Available'
  barber_name?: string;
  service_id: string | null;
  service_name?: string;
  service_price?: number;
  style_id: string | null;
  style_name?: string;
  style_image?: string;
  token_number: string;     // e.g. "F-102" or "A-015"
  customer_name: string;
  customer_phone?: string;
  secure_token: string;     // Unguessable key for sharing/retrieving status
  status: QueueStatus;
  priority_order: number;
  is_any_barber: boolean;
  joined_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  estimated_wait_mins: number;
}

export interface Appointment {
  id: string;
  barber_id: string;
  barber_name: string;
  service_id: string;
  service_name: string;
  service_price: number;
  style_id?: string | null;
  style_name?: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:mm (24h)
  end_time: string;         // HH:mm (24h)
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_ref: string;  // e.g. "APT-8821"
  notes?: string;
  created_at: string;
}

export interface SalonSettings {
  name: string;
  slug: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  is_open: boolean;
  is_queue_paused: boolean;
  online_booking_enabled: boolean;
  accept_walkins_when_booking_on: boolean;
  max_daily_tokens: number;
  buffer_minutes: number;
  advance_booking_days: number;
  creator_name: string;
  creator_phone: string;
  admin_pin: string; // 6-digit security PIN for owner admin
}

export interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  notes: string;
  timestamp: string;
}

export interface WaitTimeEstimate {
  barber_id: string;
  barber_name: string;
  queue_length: number;
  min_wait_mins: number;
  max_wait_mins: number;
  active_service_remaining_mins: number;
  status: BarberStatus;
}
