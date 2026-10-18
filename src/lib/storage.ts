import {
  Barber,
  Service,
  HaircutStyle,
  QueueEntry,
  Appointment,
  SalonSettings,
  AuditLog,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_STYLES,
  INITIAL_QUEUES,
  INITIAL_APPOINTMENTS,
} from '../data/seedData';

const STORAGE_KEYS = {
  SETTINGS: 'farhaan_salon_settings_v1',
  BARBERS: 'farhaan_salon_barbers_v1',
  SERVICES: 'farhaan_salon_services_v1',
  STYLES: 'farhaan_salon_styles_v1',
  QUEUES: 'farhaan_salon_queues_v1',
  APPOINTMENTS: 'farhaan_salon_apts_v1',
  AUDIT_LOGS: 'farhaan_salon_audit_v1',
  FAVORITES: 'farhaan_salon_fav_styles_v1',
  USER_ACTIVE_TOKEN: 'farhaan_salon_active_token_v1',
};

export const StorageEngine = {
  getSettings(): SalonSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.address || parsed.address.includes('Shop No. 4') || parsed.address.includes('City Centre Commercial Plaza')) {
          parsed.address = INITIAL_SETTINGS.address;
          parsed.city = INITIAL_SETTINGS.city;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...INITIAL_SETTINGS, ...parsed }));
        }
        return { ...INITIAL_SETTINGS, ...parsed, admin_pin: parsed.admin_pin || '600622' };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: SalonSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getBarbers(): Barber[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BARBERS);
      return data ? JSON.parse(data) : INITIAL_BARBERS;
    } catch {
      return INITIAL_BARBERS;
    }
  },

  saveBarbers(barbers: Barber[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
    } catch (e) {
      console.error('Storage error saving barbers:', e);
      try {
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
      } catch (err2) {
        console.error('Secondary storage error saving barbers:', err2);
      }
    }
  },

  getServices(): Service[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return data ? JSON.parse(data) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  },

  saveServices(services: Service[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getStyles(): HaircutStyle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STYLES);
      return data ? JSON.parse(data) : INITIAL_STYLES;
    } catch {
      return INITIAL_STYLES;
    }
  },

  saveStyles(styles: HaircutStyle[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STYLES, JSON.stringify(styles));
    } catch (e) {
      console.error('Storage error saving styles:', e);
      try {
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        localStorage.setItem(STORAGE_KEYS.STYLES, JSON.stringify(styles));
      } catch (err2) {
        console.error('Secondary storage error saving styles:', err2);
      }
    }
  },

  getQueues(): QueueEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUEUES);
      return data ? JSON.parse(data) : INITIAL_QUEUES;
    } catch {
      return INITIAL_QUEUES;
    }
  },

  saveQueues(queues: QueueEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getAppointments(): Appointment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  },

  saveAppointments(apts: Appointment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(apts));
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logAction(action_type: string, entity_type: string, entity_id?: string, notes: string = ''): void {
    try {
      const logs = this.getAuditLogs();
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action_type,
        entity_type,
        entity_id,
        notes,
        timestamp: new Date().toISOString(),
      };
      logs.unshift(newLog);
      // Keep last 100 entries
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Audit log error', e);
    }
  },

  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(styleId: string): string[] {
    try {
      const favs = this.getFavorites();
      const exists = favs.includes(styleId);
      const updated = exists ? favs.filter((id) => id !== styleId) : [...favs, styleId];
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  getUserActiveToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_ACTIVE_TOKEN);
    } catch {
      return null;
    }
  },

  setUserActiveToken(secureToken: string | null): void {
    try {
      if (secureToken) {
        localStorage.setItem(STORAGE_KEYS.USER_ACTIVE_TOKEN, secureToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_ACTIVE_TOKEN);
      }
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  resetToDemo(): void {
    localStorage.clear();
    window.location.reload();
  },
};
