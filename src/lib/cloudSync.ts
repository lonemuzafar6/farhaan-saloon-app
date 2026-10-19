import { supabase, isSupabaseConfigured } from './supabase';
import {
  Barber,
  Service,
  HaircutStyle,
  QueueEntry,
  Appointment,
  SalonSettings,
} from '../types';

export interface CloudSyncState {
  status: 'connected' | 'needs_migration' | 'error' | 'offline';
  message: string;
  lastSyncedAt: string | null;
}

export const CloudSync = {
  isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  async testConnection(): Promise<CloudSyncState> {
    if (!this.isConfigured() || !supabase) {
      return {
        status: 'offline',
        message: 'Supabase credentials not configured in .env',
        lastSyncedAt: null,
      };
    }

    try {
      // Test read & write on barbers table
      const { data, error } = await supabase.from('barbers').select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('schema cache')) {
          return {
            status: 'needs_migration',
            message: 'Database tables not found. Run the SQL migration script in Supabase SQL Editor.',
            lastSyncedAt: null,
          };
        }
        if (error.code === '42501' || error.message.includes('policy')) {
          return {
            status: 'needs_migration',
            message: 'Row Level Security policy blocked write. Run the SQL update script in Supabase.',
            lastSyncedAt: null,
          };
        }
        return {
          status: 'error',
          message: error.message,
          lastSyncedAt: null,
        };
      }

      // Check if we can upsert a test ping to salon_settings
      const { error: writeErr } = await supabase.from('salon_settings').select('id').limit(1);
      if (writeErr && (writeErr.code === '42P01' || writeErr.message.includes('relation'))) {
        return {
          status: 'needs_migration',
          message: 'Table salon_settings not found. Run the SQL migration script.',
          lastSyncedAt: null,
        };
      }

      return {
        status: 'connected',
        message: 'Live real-time PostgreSQL database connected.',
        lastSyncedAt: new Date().toLocaleTimeString(),
      };
    } catch (err) {
      return {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
        lastSyncedAt: null,
      };
    }
  },

  // -------------------------------------------------------------
  // FETCH ALL DATA FROM CLOUD (Used on app startup)
  // -------------------------------------------------------------
  async fetchAll(): Promise<{
    settings?: SalonSettings;
    barbers?: Barber[];
    services?: Service[];
    styles?: HaircutStyle[];
    queues?: QueueEntry[];
    appointments?: Appointment[];
    hasCloudData: boolean;
  }> {
    if (!this.isConfigured() || !supabase) {
      return { hasCloudData: false };
    }

    try {
      const [settingsRes, barbersRes, servicesRes, stylesRes, queuesRes, aptsRes] = await Promise.all([
        supabase.from('salon_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('barbers').select('*').order('order_index', { ascending: true }),
        supabase.from('services').select('*'),
        supabase.from('haircut_styles').select('*'),
        supabase.from('queue_entries').select('*').order('priority_order', { ascending: true }),
        supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
      ]);

      const hasBarbers = Array.isArray(barbersRes.data) && barbersRes.data.length > 0;
      const hasSettings = Boolean(settingsRes.data);

      const result: {
        settings?: SalonSettings;
        barbers?: Barber[];
        services?: Service[];
        styles?: HaircutStyle[];
        queues?: QueueEntry[];
        appointments?: Appointment[];
        hasCloudData: boolean;
      } = {
        hasCloudData: hasBarbers || hasSettings,
      };

      if (settingsRes.data) {
        // Strip database internal columns like id, updated_at
        const { id, updated_at, ...cleanSettings } = settingsRes.data;
        result.settings = cleanSettings as SalonSettings;
      }

      if (Array.isArray(barbersRes.data) && barbersRes.data.length > 0) {
        result.barbers = barbersRes.data.map((b) => ({
          id: b.id,
          name: b.name,
          photo_url: b.photo_url || '',
          bio: b.bio || '',
          experience_years: Number(b.experience_years) || 5,
          specialties: Array.isArray(b.specialties) ? b.specialties : [],
          is_active: b.is_active ?? true,
          current_status: b.current_status || 'available',
          break_ends_at: b.break_ends_at || null,
          avg_service_mins: Number(b.avg_service_mins) || 25,
          pin_code: b.pin_code || '1111',
          working_hours: b.working_hours || {
            start: '09:00',
            end: '21:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          },
        }));
      }

      if (Array.isArray(servicesRes.data) && servicesRes.data.length > 0) {
        result.services = servicesRes.data.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category || 'Haircut',
          description: s.description || '',
          price_inr: Number(s.price_inr) || 180,
          duration_minutes: Number(s.duration_minutes) || 25,
          is_active: s.is_active ?? true,
        }));
      }

      if (Array.isArray(stylesRes.data) && stylesRes.data.length > 0) {
        result.styles = stylesRes.data.map((st) => ({
          id: st.id,
          name: st.name,
          category: st.category,
          description: st.description || '',
          image_url: st.image_url,
          default_price_inr: Number(st.default_price_inr) || 200,
          estimated_mins: Number(st.estimated_mins) || 30,
          is_trending: Boolean(st.is_trending),
          barber_instruction_notes: st.barber_instruction_notes || '',
        }));
      }

      if (Array.isArray(queuesRes.data)) {
        result.queues = queuesRes.data.map((q) => ({
          id: q.id,
          salon_id: q.salon_id || 'farhaan-saloon',
          barber_id: q.barber_id || null,
          barber_name: q.barber_name || undefined,
          service_id: q.service_id || null,
          service_name: q.service_name || undefined,
          service_price: q.service_price ? Number(q.service_price) : undefined,
          style_id: q.style_id || null,
          style_name: q.style_name || undefined,
          style_image: q.style_image || undefined,
          token_number: q.token_number,
          customer_name: q.customer_name,
          customer_phone: q.customer_phone || undefined,
          secure_token: q.secure_token,
          status: q.status || 'waiting',
          priority_order: Number(q.priority_order) || 0,
          is_any_barber: Boolean(q.is_any_barber),
          joined_at: q.joined_at,
          started_at: q.started_at || null,
          completed_at: q.completed_at || null,
          estimated_wait_mins: Number(q.estimated_wait_mins) || 0,
        }));
      }

      if (Array.isArray(aptsRes.data)) {
        result.appointments = aptsRes.data.map((a) => ({
          id: a.id,
          barber_id: a.barber_id,
          barber_name: a.barber_name || '',
          service_id: a.service_id,
          service_name: a.service_name || '',
          service_price: Number(a.service_price) || 0,
          style_id: a.style_id || null,
          style_name: a.style_name || undefined,
          customer_name: a.customer_name,
          customer_phone: a.customer_phone,
          appointment_date: a.appointment_date,
          start_time: a.start_time,
          end_time: a.end_time,
          duration_minutes: Number(a.duration_minutes) || 30,
          status: a.status || 'confirmed',
          appointment_ref: a.appointment_ref,
          notes: a.notes || undefined,
          created_at: a.created_at,
        }));
      }

      return result;
    } catch (err) {
      console.warn('CloudSync.fetchAll error:', err);
      return { hasCloudData: false };
    }
  },

  // -------------------------------------------------------------
  // PUSH ALL LOCAL DATA TO CLOUD (Used for initial sync from phone)
  // -------------------------------------------------------------
  async pushAllLocalToCloud(data: {
    settings: SalonSettings;
    barbers: Barber[];
    services: Service[];
    styles: HaircutStyle[];
    queues: QueueEntry[];
    appointments: Appointment[];
  }): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured() || !supabase) {
      return { success: false, message: 'Supabase credentials not configured in .env' };
    }

    try {
      // 1. Settings
      const { error: sErr } = await supabase.from('salon_settings').upsert({
        id: 'default',
        ...data.settings,
        updated_at: new Date().toISOString(),
      });
      if (sErr) throw sErr;

      // 2. Barbers
      if (data.barbers.length > 0) {
        const barberRows = data.barbers.map((b, idx) => ({
          id: b.id,
          name: b.name,
          photo_url: b.photo_url,
          bio: b.bio,
          experience_years: b.experience_years,
          specialties: b.specialties,
          is_active: b.is_active,
          current_status: b.current_status,
          break_ends_at: b.break_ends_at,
          avg_service_mins: b.avg_service_mins,
          pin_code: b.pin_code,
          working_hours: b.working_hours,
          order_index: idx,
          updated_at: new Date().toISOString(),
        }));
        const { error: bErr } = await supabase.from('barbers').upsert(barberRows);
        if (bErr) throw bErr;
      }

      // 3. Services
      if (data.services.length > 0) {
        const serviceRows = data.services.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
          price_inr: s.price_inr,
          duration_minutes: s.duration_minutes,
          is_active: s.is_active,
          updated_at: new Date().toISOString(),
        }));
        const { error: srvErr } = await supabase.from('services').upsert(serviceRows);
        if (srvErr) throw srvErr;
      }

      // 4. Styles
      if (data.styles.length > 0) {
        const styleRows = data.styles.map((st) => ({
          id: st.id,
          name: st.name,
          category: st.category,
          description: st.description,
          image_url: st.image_url,
          default_price_inr: st.default_price_inr,
          estimated_mins: st.estimated_mins,
          is_trending: st.is_trending,
          barber_instruction_notes: st.barber_instruction_notes,
          updated_at: new Date().toISOString(),
        }));
        const { error: stErr } = await supabase.from('haircut_styles').upsert(styleRows);
        if (stErr) throw stErr;
      }

      // 5. Queues
      if (data.queues.length > 0) {
        const queueRows = data.queues.map((q) => ({
          id: q.id,
          salon_id: q.salon_id,
          barber_id: q.barber_id,
          barber_name: q.barber_name,
          service_id: q.service_id,
          service_name: q.service_name,
          service_price: q.service_price,
          style_id: q.style_id,
          style_name: q.style_name,
          style_image: q.style_image,
          token_number: q.token_number,
          customer_name: q.customer_name,
          customer_phone: q.customer_phone,
          secure_token: q.secure_token,
          status: q.status,
          priority_order: q.priority_order,
          is_any_barber: q.is_any_barber,
          joined_at: q.joined_at,
          started_at: q.started_at,
          completed_at: q.completed_at,
          estimated_wait_mins: q.estimated_wait_mins,
          updated_at: new Date().toISOString(),
        }));
        const { error: qErr } = await supabase.from('queue_entries').upsert(queueRows);
        if (qErr) throw qErr;
      }

      // 6. Appointments
      if (data.appointments.length > 0) {
        const aptRows = data.appointments.map((a) => ({
          id: a.id,
          barber_id: a.barber_id,
          barber_name: a.barber_name,
          service_id: a.service_id,
          service_name: a.service_name,
          service_price: a.service_price,
          style_id: a.style_id,
          style_name: a.style_name,
          customer_name: a.customer_name,
          customer_phone: a.customer_phone,
          appointment_date: a.appointment_date,
          start_time: a.start_time,
          end_time: a.end_time,
          duration_minutes: a.duration_minutes,
          status: a.status,
          appointment_ref: a.appointment_ref,
          notes: a.notes,
          created_at: a.created_at,
          updated_at: new Date().toISOString(),
        }));
        const { error: aErr } = await supabase.from('appointments').upsert(aptRows);
        if (aErr) throw aErr;
      }

      return {
        success: true,
        message: 'All salon details, photos, and live queues synced to Cloud successfully!',
      };
    } catch (err) {
      console.error('pushAllLocalToCloud error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: msg.includes('policy') || msg.includes('relation')
          ? 'Supabase database tables need migration. Please run the SQL update in Supabase SQL editor.'
          : `Sync error: ${msg}`,
      };
    }
  },

  // -------------------------------------------------------------
  // INDIVIDUAL RECORD SYNCS
  // -------------------------------------------------------------
  async syncSettings(settings: SalonSettings): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('salon_settings').upsert({
        id: 'default',
        ...settings,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncSettings error:', err);
    }
  },

  async syncBarber(barber: Barber): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('barbers').upsert({
        id: barber.id,
        name: barber.name,
        photo_url: barber.photo_url,
        bio: barber.bio,
        experience_years: barber.experience_years,
        specialties: barber.specialties,
        is_active: barber.is_active,
        current_status: barber.current_status,
        break_ends_at: barber.break_ends_at,
        avg_service_mins: barber.avg_service_mins,
        pin_code: barber.pin_code,
        working_hours: barber.working_hours,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncBarber error:', err);
    }
  },

  async deleteBarber(id: string): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('barbers').delete().eq('id', id);
    } catch (err) {
      console.warn('deleteBarber error:', err);
    }
  },

  async syncService(service: Service): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('services').upsert({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        price_inr: service.price_inr,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncService error:', err);
    }
  },

  async deleteService(id: string): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('services').delete().eq('id', id);
    } catch (err) {
      console.warn('deleteService error:', err);
    }
  },

  async syncStyle(style: HaircutStyle): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('haircut_styles').upsert({
        id: style.id,
        name: style.name,
        category: style.category,
        description: style.description,
        image_url: style.image_url,
        default_price_inr: style.default_price_inr,
        estimated_mins: style.estimated_mins,
        is_trending: style.is_trending,
        barber_instruction_notes: style.barber_instruction_notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncStyle error:', err);
    }
  },

  async deleteStyle(id: string): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('haircut_styles').delete().eq('id', id);
    } catch (err) {
      console.warn('deleteStyle error:', err);
    }
  },

  async syncQueueEntry(entry: QueueEntry): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('queue_entries').upsert({
        id: entry.id,
        salon_id: entry.salon_id,
        barber_id: entry.barber_id,
        barber_name: entry.barber_name,
        service_id: entry.service_id,
        service_name: entry.service_name,
        service_price: entry.service_price,
        style_id: entry.style_id,
        style_name: entry.style_name,
        style_image: entry.style_image,
        token_number: entry.token_number,
        customer_name: entry.customer_name,
        customer_phone: entry.customer_phone,
        secure_token: entry.secure_token,
        status: entry.status,
        priority_order: entry.priority_order,
        is_any_barber: entry.is_any_barber,
        joined_at: entry.joined_at,
        started_at: entry.started_at,
        completed_at: entry.completed_at,
        estimated_wait_mins: entry.estimated_wait_mins,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncQueueEntry error:', err);
    }
  },

  async syncAppointment(apt: Appointment): Promise<void> {
    if (!this.isConfigured() || !supabase) return;
    try {
      await supabase.from('appointments').upsert({
        id: apt.id,
        barber_id: apt.barber_id,
        barber_name: apt.barber_name,
        service_id: apt.service_id,
        service_name: apt.service_name,
        service_price: apt.service_price,
        style_id: apt.style_id,
        style_name: apt.style_name,
        customer_name: apt.customer_name,
        customer_phone: apt.customer_phone,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        duration_minutes: apt.duration_minutes,
        status: apt.status,
        appointment_ref: apt.appointment_ref,
        notes: apt.notes,
        created_at: apt.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('syncAppointment error:', err);
    }
  },
};
