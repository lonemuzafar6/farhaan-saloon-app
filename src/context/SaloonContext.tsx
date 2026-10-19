import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Barber,
  BarberStatus,
  Service,
  HaircutStyle,
  QueueEntry,
  Appointment,
  SalonSettings,
  AuditLog,
} from '../types';
import { StorageEngine } from '../lib/storage';
import {
  calculateBarberWaitTime,
  selectBestAvailableBarber,
  generateTokenNumber,
  isSlotAvailable,
} from '../lib/queueAlgorithm';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CloudSync, CloudSyncState } from '../lib/cloudSync';

interface SaloonContextType {
  settings: SalonSettings;
  updateSettings: (newSettings: Partial<SalonSettings>) => void;
  barbers: Barber[];
  updateBarberStatus: (barberId: string, status: BarberStatus, breakMinutes?: number) => void;
  updateBarber: (barber: Barber) => void;
  addBarber: (barberData: Omit<Barber, 'id'>) => Barber;
  deleteBarber: (id: string) => void;
  services: Service[];
  addService: (serviceData: Omit<Service, 'id'>) => Service;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;
  styles: HaircutStyle[];
  addStyle: (styleData: Omit<HaircutStyle, 'id'>) => HaircutStyle;
  updateStyle: (style: HaircutStyle) => void;
  deleteStyle: (id: string) => void;
  queues: QueueEntry[];
  appointments: Appointment[];
  auditLogs: AuditLog[];
  favorites: string[];
  toggleFavorite: (styleId: string) => void;
  userActiveToken: string | null;
  activeCustomerQueueEntry: QueueEntry | null;
  joinQueue: (data: {
    customerName: string;
    customerPhone?: string;
    barberId: string | null;
    serviceId?: string | null;
    styleId?: string | null;
  }) => QueueEntry;
  cancelToken: (tokenOrSecure: string) => void;
  startService: (queueEntryId: string) => void;
  completeService: (queueEntryId: string) => void;
  skipCustomer: (queueEntryId: string) => void;
  recallCustomer: (queueEntryId: string) => void;
  reassignBarber: (queueEntryId: string, newBarberId: string, reason?: string) => void;
  addManualWalkin: (data: {
    customerName: string;
    customerPhone?: string;
    barberId: string;
    serviceId?: string | null;
    styleId?: string | null;
    priority?: boolean;
  }) => QueueEntry;
  bookAppointment: (data: {
    barberId: string;
    serviceId: string;
    styleId?: string | null;
    customerName: string;
    customerPhone: string;
    appointmentDate: string;
    startTime: string;
    notes?: string;
  }) => Appointment;
  cancelAppointment: (appointmentId: string, reason?: string) => void;
  isOnline: boolean;
  activeRole: 'customer' | 'barber' | 'admin';
  setActiveRole: (role: 'customer' | 'barber' | 'admin') => void;
  activeBarberId: string;
  setActiveBarberId: (id: string) => void;
  selectedBarberForDashboard: Barber | null;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string) => void;
  resetAllDemoData: () => void;
  // Cloud Real-Time Synchronization
  cloudSyncState: CloudSyncState;
  pushPhoneDataToCloud: () => Promise<{ success: boolean; message: string }>;
  pullCloudData: () => Promise<void>;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;
}

const SaloonContext = createContext<SaloonContextType | undefined>(undefined);

export const SaloonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SalonSettings>(StorageEngine.getSettings());
  const [barbers, setBarbers] = useState<Barber[]>(StorageEngine.getBarbers());
  const [services, setServices] = useState<Service[]>(StorageEngine.getServices());
  const [styles, setStyles] = useState<HaircutStyle[]>(StorageEngine.getStyles());
  const [queues, setQueues] = useState<QueueEntry[]>(StorageEngine.getQueues());
  const [appointments, setAppointments] = useState<Appointment[]>(StorageEngine.getAppointments());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageEngine.getAuditLogs());
  const [favorites, setFavorites] = useState<string[]>(StorageEngine.getFavorites());
  const [userActiveToken, setUserActiveToken] = useState<string | null>(StorageEngine.getUserActiveToken());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [activeRole, setActiveRole] = useState<'customer' | 'barber' | 'admin'>('customer');
  const [activeBarberId, setActiveBarberId] = useState<string>('barber-farhaan');

  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    status: isSupabaseConfigured ? 'connected' : 'offline',
    message: isSupabaseConfigured ? 'Connecting to real-time cloud...' : 'Offline-first Local Storage mode',
    lastSyncedAt: null,
  });

  // Keep a ref to latest state for pushPhoneDataToCloud
  const stateRef = useRef({ settings, barbers, services, styles, queues, appointments });
  useEffect(() => {
    stateRef.current = { settings, barbers, services, styles, queues, appointments };
  }, [settings, barbers, services, styles, queues, appointments]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to URL token param (?token=xyz) for direct QR code scanning or link recovery
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setUserActiveToken(urlToken);
      StorageEngine.setUserActiveToken(urlToken);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // INITIAL CLOUD SYNC & DATA RECONCILIATION
  // ---------------------------------------------------------------------------
  const pullCloudData = useCallback(async () => {
    if (!CloudSync.isConfigured()) return;

    const connTest = await CloudSync.testConnection();
    setCloudSyncState(connTest);
    if (connTest.status !== 'connected') return;

    const cloudData = await CloudSync.fetchAll();

    if (cloudData.hasCloudData) {
      // Supabase has data: update state & localStorage
      if (cloudData.settings) {
        setSettings(cloudData.settings);
        StorageEngine.saveSettings(cloudData.settings);
      }
      if (cloudData.barbers && cloudData.barbers.length > 0) {
        setBarbers(cloudData.barbers);
        StorageEngine.saveBarbers(cloudData.barbers);
      }
      if (cloudData.services && cloudData.services.length > 0) {
        setServices(cloudData.services);
        StorageEngine.saveServices(cloudData.services);
      }
      if (cloudData.styles && cloudData.styles.length > 0) {
        setStyles(cloudData.styles);
        StorageEngine.saveStyles(cloudData.styles);
      }
      if (cloudData.queues) {
        setQueues(cloudData.queues);
        StorageEngine.saveQueues(cloudData.queues);
      }
      if (cloudData.appointments) {
        setAppointments(cloudData.appointments);
        StorageEngine.saveAppointments(cloudData.appointments);
      }

      setCloudSyncState({
        status: 'connected',
        message: 'Loaded latest cloud data & live updates active.',
        lastSyncedAt: new Date().toLocaleTimeString(),
      });
    } else {
      // Cloud database is empty: Seed it with local data so all devices can see it!
      console.log('Cloud database is empty. Auto-seeding local data to Supabase...');
      const pushRes = await CloudSync.pushAllLocalToCloud(stateRef.current);
      if (pushRes.success) {
        setCloudSyncState({
          status: 'connected',
          message: 'Local data synced to cloud database.',
          lastSyncedAt: new Date().toLocaleTimeString(),
        });
      }
    }
  }, []);

  // Run initial pull on mount
  useEffect(() => {
    pullCloudData();
  }, [pullCloudData]);

  // ---------------------------------------------------------------------------
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('farhaan-realtime-all')
      // 1. Queue entries changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEntry = payload.new as QueueEntry;
          setQueues((prev) => {
            if (prev.some((q) => q.id === newEntry.id)) return prev;
            const updated = [...prev, newEntry];
            StorageEngine.saveQueues(updated);
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedEntry = payload.new as QueueEntry;
          setQueues((prev) => {
            const updated = prev.map((q) => (q.id === updatedEntry.id ? { ...q, ...updatedEntry } : q));
            StorageEngine.saveQueues(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setQueues((prev) => {
              const updated = prev.filter((q) => q.id !== deletedId);
              StorageEngine.saveQueues(updated);
              return updated;
            });
          }
        }
      })
      // 2. Barbers changes (photo, name, status, break)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barbers' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const b = payload.new as Barber;
          setBarbers((prev) => {
            const exists = prev.some((item) => item.id === b.id);
            const updated = exists
              ? prev.map((item) => (item.id === b.id ? { ...item, ...b } : item))
              : [...prev, b];
            StorageEngine.saveBarbers(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setBarbers((prev) => {
              const updated = prev.filter((b) => b.id !== deletedId);
              StorageEngine.saveBarbers(updated);
              return updated;
            });
          }
        }
      })
      // 3. Salon Settings changes (name, phone, address, is_open, etc.)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_settings' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { id, updated_at, ...newSettings } = payload.new as SalonSettings & { id?: string; updated_at?: string };
          setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            StorageEngine.saveSettings(updated);
            return updated;
          });
        }
      })
      // 4. Haircut styles changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'haircut_styles' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const st = payload.new as HaircutStyle;
          setStyles((prev) => {
            const exists = prev.some((item) => item.id === st.id);
            const updated = exists
              ? prev.map((item) => (item.id === st.id ? { ...item, ...st } : item))
              : [st, ...prev];
            StorageEngine.saveStyles(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setStyles((prev) => {
              const updated = prev.filter((s) => s.id !== deletedId);
              StorageEngine.saveStyles(updated);
              return updated;
            });
          }
        }
      })
      // 5. Services changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const s = payload.new as Service;
          setServices((prev) => {
            const exists = prev.some((item) => item.id === s.id);
            const updated = exists
              ? prev.map((item) => (item.id === s.id ? { ...item, ...s } : item))
              : [...prev, s];
            StorageEngine.saveServices(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setServices((prev) => {
              const updated = prev.filter((item) => item.id !== deletedId);
              StorageEngine.saveServices(updated);
              return updated;
            });
          }
        }
      })
      // 6. Appointments changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const a = payload.new as Appointment;
          setAppointments((prev) => {
            const exists = prev.some((item) => item.id === a.id);
            const updated = exists
              ? prev.map((item) => (item.id === a.id ? { ...item, ...a } : item))
              : [a, ...prev];
            StorageEngine.saveAppointments(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setAppointments((prev) => {
              const updated = prev.filter((item) => item.id !== deletedId);
              StorageEngine.saveAppointments(updated);
              return updated;
            });
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setCloudSyncState((prev) => ({
            ...prev,
            status: 'connected',
            message: 'Real-time WebSocket active. Instant multi-device sync ready.',
          }));
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // EXPLICIT PUSH FROM PHONE TO CLOUD
  // ---------------------------------------------------------------------------
  const pushPhoneDataToCloud = useCallback(async () => {
    const result = await CloudSync.pushAllLocalToCloud(stateRef.current);
    if (result.success) {
      setCloudSyncState({
        status: 'connected',
        message: 'Phone data successfully pushed to Supabase!',
        lastSyncedAt: new Date().toLocaleTimeString(),
      });
    } else {
      setCloudSyncState((prev) => ({
        ...prev,
        status: result.message.includes('migration') ? 'needs_migration' : 'error',
        message: result.message,
      }));
    }
    return result;
  }, []);

  // ---------------------------------------------------------------------------
  // JSON BACKUP EXPORT / IMPORT
  // ---------------------------------------------------------------------------
  const exportBackupJson = useCallback(() => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: stateRef.current.settings,
      barbers: stateRef.current.barbers,
      services: stateRef.current.services,
      styles: stateRef.current.styles,
      queues: stateRef.current.queues,
      appointments: stateRef.current.appointments,
    };
    return JSON.stringify(backup, null, 2);
  }, []);

  const importBackupJson = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) {
        setSettings(data.settings);
        StorageEngine.saveSettings(data.settings);
      }
      if (Array.isArray(data.barbers) && data.barbers.length > 0) {
        setBarbers(data.barbers);
        StorageEngine.saveBarbers(data.barbers);
      }
      if (Array.isArray(data.services) && data.services.length > 0) {
        setServices(data.services);
        StorageEngine.saveServices(data.services);
      }
      if (Array.isArray(data.styles) && data.styles.length > 0) {
        setStyles(data.styles);
        StorageEngine.saveStyles(data.styles);
      }
      if (Array.isArray(data.queues)) {
        setQueues(data.queues);
        StorageEngine.saveQueues(data.queues);
      }
      if (Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
        StorageEngine.saveAppointments(data.appointments);
      }
      // Also try syncing imported data to cloud
      CloudSync.pushAllLocalToCloud({
        settings: data.settings || stateRef.current.settings,
        barbers: data.barbers || stateRef.current.barbers,
        services: data.services || stateRef.current.services,
        styles: data.styles || stateRef.current.styles,
        queues: data.queues || stateRef.current.queues,
        appointments: data.appointments || stateRef.current.appointments,
      }).catch(console.warn);

      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CORE APP MUTATIONS WITH DUAL-SYNC (LOCAL STORAGE + SUPABASE)
  // ---------------------------------------------------------------------------
  const updateSettings = useCallback((newSettings: Partial<SalonSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      StorageEngine.saveSettings(updated);
      StorageEngine.logAction('UPDATE_SETTINGS', 'SALON_SETTINGS', undefined, 'Updated salon configuration');
      setAuditLogs(StorageEngine.getAuditLogs());
      CloudSync.syncSettings(updated);
      return updated;
    });
  }, []);

  const updateBarber = useCallback((barber: Barber) => {
    setBarbers((prev) => {
      const updated = prev.map((b) => (b.id === barber.id ? barber : b));
      StorageEngine.saveBarbers(updated);
      StorageEngine.logAction('UPDATE_BARBER', 'BARBER', barber.id, `Updated barber ${barber.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });

    // Also update any active queues and appointments referencing this barber
    setQueues((prev) => {
      const updated = prev.map((q) => {
        if (q.barber_id === barber.id) {
          return { ...q, barber_name: barber.name };
        }
        return q;
      });
      StorageEngine.saveQueues(updated);
      return updated;
    });

    setAppointments((prev) => {
      const updated = prev.map((apt) => {
        if (apt.barber_id === barber.id) {
          return { ...apt, barber_name: barber.name };
        }
        return apt;
      });
      StorageEngine.saveAppointments(updated);
      return updated;
    });

    // Sync to cloud
    CloudSync.syncBarber(barber);
  }, []);

  const addBarber = useCallback((barberData: Omit<Barber, 'id'>): Barber => {
    const newBarber: Barber = {
      ...barberData,
      id: `barber-${Date.now()}`,
    };
    setBarbers((prev) => {
      const updated = [...prev, newBarber];
      StorageEngine.saveBarbers(updated);
      StorageEngine.logAction('ADD_BARBER', 'BARBER', newBarber.id, `Added new barber ${newBarber.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.syncBarber(newBarber);
    return newBarber;
  }, []);

  const deleteBarber = useCallback((id: string) => {
    setBarbers((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      StorageEngine.saveBarbers(updated);
      StorageEngine.logAction('DELETE_BARBER', 'BARBER', id, `Removed barber`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.deleteBarber(id);
  }, []);

  const updateBarberStatus = useCallback((barberId: string, status: BarberStatus, breakMinutes?: number) => {
    setBarbers((prev) => {
      let changedBarber: Barber | undefined;
      const updated = prev.map((b) => {
        if (b.id !== barberId) return b;
        let breakEndsAt: string | null = null;
        if (status === 'on_break' && breakMinutes) {
          breakEndsAt = new Date(Date.now() + breakMinutes * 60000).toISOString();
        }
        changedBarber = {
          ...b,
          current_status: status,
          break_ends_at: breakEndsAt,
        };
        return changedBarber;
      });
      StorageEngine.saveBarbers(updated);
      StorageEngine.logAction('BARBER_STATUS_CHANGE', 'BARBER', barberId, `Changed status to ${status}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      if (changedBarber) {
        CloudSync.syncBarber(changedBarber);
      }
      return updated;
    });
  }, []);

  const addService = useCallback((serviceData: Omit<Service, 'id'>): Service => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => {
      const updated = [...prev, newService];
      StorageEngine.saveServices(updated);
      StorageEngine.logAction('ADD_SERVICE', 'SERVICE', newService.id, `Added service ${newService.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.syncService(newService);
    return newService;
  }, []);

  const updateService = useCallback((service: Service) => {
    setServices((prev) => {
      const updated = prev.map((s) => (s.id === service.id ? service : s));
      StorageEngine.saveServices(updated);
      StorageEngine.logAction('UPDATE_SERVICE', 'SERVICE', service.id, `Updated service ${service.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.syncService(service);
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      StorageEngine.saveServices(updated);
      StorageEngine.logAction('DELETE_SERVICE', 'SERVICE', id, `Deleted service`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.deleteService(id);
  }, []);

  const addStyle = useCallback((styleData: Omit<HaircutStyle, 'id'>): HaircutStyle => {
    const newStyle: HaircutStyle = {
      ...styleData,
      id: `style-${Date.now()}`,
    };
    setStyles((prev) => {
      const updated = [newStyle, ...prev];
      StorageEngine.saveStyles(updated);
      StorageEngine.logAction('ADD_STYLE', 'HAIRCUT_STYLE', newStyle.id, `Added style ${newStyle.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.syncStyle(newStyle);
    return newStyle;
  }, []);

  const updateStyle = useCallback((style: HaircutStyle) => {
    setStyles((prev) => {
      const updated = prev.map((s) => (s.id === style.id ? style : s));
      StorageEngine.saveStyles(updated);
      StorageEngine.logAction('UPDATE_STYLE', 'HAIRCUT_STYLE', style.id, `Updated style ${style.name}`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.syncStyle(style);
  }, []);

  const deleteStyle = useCallback((id: string) => {
    setStyles((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      StorageEngine.saveStyles(updated);
      StorageEngine.logAction('DELETE_STYLE', 'HAIRCUT_STYLE', id, `Deleted style`);
      setAuditLogs(StorageEngine.getAuditLogs());
      return updated;
    });
    CloudSync.deleteStyle(id);
  }, []);

  const toggleFavorite = useCallback((styleId: string) => {
    const updated = StorageEngine.toggleFavorite(styleId);
    setFavorites(updated);
  }, []);

  // Web push / notification requester
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  };

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/favicon.svg',
        });
      } catch {
        // Fallback or ignore in unsupported environments
      }
    }
  }, []);

  // Customer queue entry lookup
  const activeCustomerQueueEntry = useMemo(() => {
    if (!userActiveToken) return null;
    return (
      queues.find(
        (q) =>
          (q.secure_token === userActiveToken || q.token_number === userActiveToken) &&
          (q.status === 'waiting' || q.status === 'in_service')
      ) || null
    );
  }, [userActiveToken, queues]);

  // Join Queue Workflow
  const joinQueue = useCallback(
    (data: {
      customerName: string;
      customerPhone?: string;
      barberId: string | null;
      serviceId?: string | null;
      styleId?: string | null;
    }): QueueEntry => {
      let targetBarber: Barber | null = null;
      let isAnyBarber = false;

      if (data.barberId) {
        targetBarber = barbers.find((b) => b.id === data.barberId) || null;
      } else {
        isAnyBarber = true;
        targetBarber = selectBestAvailableBarber(barbers, queues, appointments);
      }

      if (!targetBarber) {
        targetBarber = barbers[0];
      }

      const service = services.find((s) => s.id === data.serviceId);
      const style = styles.find((s) => s.id === data.styleId);

      const tokenNumber = generateTokenNumber(targetBarber, queues);
      const secureToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const existingInBarberQueue = queues.filter((q) => q.barber_id === targetBarber?.id);
      const priorityOrder = existingInBarberQueue.length + 1;

      const waitEst = calculateBarberWaitTime(targetBarber, queues, appointments);

      const newEntry: QueueEntry = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        salon_id: 'farhaan-saloon',
        barber_id: targetBarber.id,
        barber_name: targetBarber.name,
        service_id: service?.id || null,
        service_name: service?.name || (style ? style.name : 'Haircut & Styling'),
        service_price: service?.price_inr || style?.default_price_inr || 180,
        style_id: style?.id || null,
        style_name: style?.name,
        style_image: style?.image_url,
        token_number: tokenNumber,
        customer_name: data.customerName.trim() || 'Guest Customer',
        customer_phone: data.customerPhone?.trim(),
        secure_token: secureToken,
        status: 'waiting',
        priority_order: priorityOrder,
        is_any_barber: isAnyBarber,
        joined_at: new Date().toISOString(),
        estimated_wait_mins: waitEst.min_wait_mins,
      };

      setQueues((prev) => {
        const updated = [...prev, newEntry];
        StorageEngine.saveQueues(updated);
        return updated;
      });

      setUserActiveToken(secureToken);
      StorageEngine.setUserActiveToken(secureToken);

      StorageEngine.logAction(
        'JOIN_QUEUE',
        'QUEUE_ENTRY',
        newEntry.id,
        `Token ${tokenNumber} issued to ${newEntry.customer_name} for ${targetBarber.name}`
      );
      setAuditLogs(StorageEngine.getAuditLogs());

      sendNotification(
        "You're in the Queue!",
        `Token ${tokenNumber} assigned for ${targetBarber.name}. Est wait: ${waitEst.min_wait_mins}-${waitEst.max_wait_mins} mins.`
      );

      // Realtime Cloud sync
      CloudSync.syncQueueEntry(newEntry);

      return newEntry;
    },
    [barbers, queues, appointments, services, styles, sendNotification]
  );

  // Manual Walk-in addition by owner or barber
  const addManualWalkin = useCallback(
    (data: {
      customerName: string;
      customerPhone?: string;
      barberId: string;
      serviceId?: string | null;
      styleId?: string | null;
      priority?: boolean;
    }): QueueEntry => {
      const barber = barbers.find((b) => b.id === data.barberId) || barbers[0];
      const service = services.find((s) => s.id === data.serviceId);
      const style = styles.find((s) => s.id === data.styleId);

      const tokenNumber = generateTokenNumber(barber, queues);
      const secureToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newEntry: QueueEntry = {
        id: `q-${Date.now()}`,
        salon_id: 'farhaan-saloon',
        barber_id: barber.id,
        barber_name: barber.name,
        service_id: service?.id || null,
        service_name: service?.name || (style ? style.name : 'Walk-in Haircut'),
        service_price: service?.price_inr || style?.default_price_inr || 180,
        style_id: style?.id || null,
        style_name: style?.name,
        style_image: style?.image_url,
        token_number: tokenNumber,
        customer_name: data.customerName.trim() || 'Walk-in Customer',
        customer_phone: data.customerPhone?.trim(),
        secure_token: secureToken,
        status: 'waiting',
        priority_order: data.priority ? 0 : queues.filter((q) => q.barber_id === barber.id).length + 1,
        is_any_barber: false,
        joined_at: new Date().toISOString(),
        estimated_wait_mins: 15,
      };

      setQueues((prev) => {
        const updated = data.priority ? [newEntry, ...prev] : [...prev, newEntry];
        StorageEngine.saveQueues(updated);
        return updated;
      });

      StorageEngine.logAction(
        'MANUAL_WALKIN',
        'QUEUE_ENTRY',
        newEntry.id,
        `Walk-in token ${tokenNumber} added manually for ${barber.name}`
      );
      setAuditLogs(StorageEngine.getAuditLogs());

      CloudSync.syncQueueEntry(newEntry);

      return newEntry;
    },
    [barbers, services, styles, queues]
  );

  // Start Service
  const startService = useCallback(
    (queueEntryId: string) => {
      let changedEntry: QueueEntry | undefined;

      setQueues((prev) => {
        const updated = prev.map((q) => {
          if (q.id === queueEntryId) {
            changedEntry = {
              ...q,
              status: 'in_service' as const,
              started_at: new Date().toISOString(),
            };
            return changedEntry;
          }
          return q;
        });
        StorageEngine.saveQueues(updated);
        return updated;
      });

      const entry = queues.find((q) => q.id === queueEntryId);
      if (entry && entry.barber_id) {
        updateBarberStatus(entry.barber_id, 'serving');
        StorageEngine.logAction(
          'START_SERVICE',
          'QUEUE_ENTRY',
          queueEntryId,
          `Started service for ${entry.customer_name} (Token ${entry.token_number})`
        );
        setAuditLogs(StorageEngine.getAuditLogs());
      }

      if (changedEntry) {
        CloudSync.syncQueueEntry(changedEntry);
      }
    },
    [queues, updateBarberStatus]
  );

  // Complete Service & Advance Queue automatically
  const completeService = useCallback(
    (queueEntryId: string) => {
      let targetBarberId: string | null = null;
      let completedCustomerName = '';
      let completedToken = '';
      let changedEntry: QueueEntry | undefined;

      setQueues((prev) => {
        const updated = prev.map((q) => {
          if (q.id === queueEntryId) {
            targetBarberId = q.barber_id;
            completedCustomerName = q.customer_name;
            completedToken = q.token_number;
            changedEntry = {
              ...q,
              status: 'completed' as const,
              completed_at: new Date().toISOString(),
            };
            return changedEntry;
          }
          return q;
        });
        StorageEngine.saveQueues(updated);
        return updated;
      });

      const currentActive = queues.find((q) => q.id === queueEntryId);
      if (currentActive && (currentActive.secure_token === userActiveToken || currentActive.token_number === userActiveToken)) {
        setUserActiveToken(null);
        StorageEngine.setUserActiveToken(null);
      }

      if (targetBarberId) {
        const remainingWaiting = queues.filter(
          (q) => q.barber_id === targetBarberId && q.id !== queueEntryId && q.status === 'waiting'
        );

        if (remainingWaiting.length === 0) {
          updateBarberStatus(targetBarberId, 'available');
        }

        StorageEngine.logAction(
          'COMPLETE_SERVICE',
          'QUEUE_ENTRY',
          queueEntryId,
          `Completed service for ${completedCustomerName} (Token ${completedToken})`
        );
        setAuditLogs(StorageEngine.getAuditLogs());
      }

      if (changedEntry) {
        CloudSync.syncQueueEntry(changedEntry);
      }
    },
    [queues, userActiveToken, updateBarberStatus]
  );

  // Skip Customer (recoverable)
  const skipCustomer = useCallback((queueEntryId: string) => {
    let changedEntry: QueueEntry | undefined;

    setQueues((prev) => {
      const updated = prev.map((q) => {
        if (q.id === queueEntryId) {
          changedEntry = {
            ...q,
            status: 'skipped' as const,
          };
          return changedEntry;
        }
        return q;
      });
      StorageEngine.saveQueues(updated);
      return updated;
    });

    const entry = queues.find((q) => q.id === queueEntryId);
    if (entry) {
      StorageEngine.logAction(
        'SKIP_CUSTOMER',
        'QUEUE_ENTRY',
        queueEntryId,
        `Customer ${entry.customer_name} (Token ${entry.token_number}) marked as skipped`
      );
      setAuditLogs(StorageEngine.getAuditLogs());
    }

    if (changedEntry) {
      CloudSync.syncQueueEntry(changedEntry);
    }
  }, [queues]);

  // Recall a skipped customer
  const recallCustomer = useCallback((queueEntryId: string) => {
    let changedEntry: QueueEntry | undefined;

    setQueues((prev) => {
      const updated = prev.map((q) => {
        if (q.id === queueEntryId) {
          changedEntry = {
            ...q,
            status: 'waiting' as const,
            priority_order: 1,
          };
          return changedEntry;
        }
        return q;
      });
      StorageEngine.saveQueues(updated);
      return updated;
    });

    const entry = queues.find((q) => q.id === queueEntryId);
    if (entry) {
      StorageEngine.logAction(
        'RECALL_CUSTOMER',
        'QUEUE_ENTRY',
        queueEntryId,
        `Recalled skipped customer ${entry.customer_name} (Token ${entry.token_number}) back to active queue`
      );
      setAuditLogs(StorageEngine.getAuditLogs());
    }

    if (changedEntry) {
      CloudSync.syncQueueEntry(changedEntry);
    }
  }, [queues]);

  // Transfer / Reassign customer to another barber
  const reassignBarber = useCallback(
    (queueEntryId: string, newBarberId: string, reason: string = 'Operational reassignment') => {
      const newBarber = barbers.find((b) => b.id === newBarberId);
      if (!newBarber) return;
      let changedEntry: QueueEntry | undefined;

      setQueues((prev) => {
        const updated = prev.map((q) => {
          if (q.id === queueEntryId) {
            changedEntry = {
              ...q,
              barber_id: newBarber.id,
              barber_name: newBarber.name,
              priority_order: prev.filter((item) => item.barber_id === newBarber.id).length + 1,
            };
            return changedEntry;
          }
          return q;
        });
        StorageEngine.saveQueues(updated);
        return updated;
      });

      const entry = queues.find((q) => q.id === queueEntryId);
      StorageEngine.logAction(
        'REASSIGN_BARBER',
        'QUEUE_ENTRY',
        queueEntryId,
        `Reassigned ${entry?.customer_name} to ${newBarber.name}. Reason: ${reason}`
      );
      setAuditLogs(StorageEngine.getAuditLogs());

      if (changedEntry) {
        CloudSync.syncQueueEntry(changedEntry);
      }
    },
    [barbers, queues]
  );

  // Customer cancels their own token
  const cancelToken = useCallback(
    (tokenOrSecure: string) => {
      let changedEntry: QueueEntry | undefined;

      setQueues((prev) => {
        const updated = prev.map((q) => {
          if (q.secure_token === tokenOrSecure || q.token_number === tokenOrSecure) {
            changedEntry = {
              ...q,
              status: 'cancelled' as const,
            };
            return changedEntry;
          }
          return q;
        });
        StorageEngine.saveQueues(updated);
        return updated;
      });

      if (userActiveToken === tokenOrSecure) {
        setUserActiveToken(null);
        StorageEngine.setUserActiveToken(null);
      }

      StorageEngine.logAction('CANCEL_TOKEN', 'QUEUE_ENTRY', undefined, `Token cancelled by customer: ${tokenOrSecure}`);
      setAuditLogs(StorageEngine.getAuditLogs());

      if (changedEntry) {
        CloudSync.syncQueueEntry(changedEntry);
      }
    },
    [userActiveToken]
  );

  // Book Online Appointment
  const bookAppointment = useCallback(
    (data: {
      barberId: string;
      serviceId: string;
      styleId?: string | null;
      customerName: string;
      customerPhone: string;
      appointmentDate: string;
      startTime: string;
      notes?: string;
    }): Appointment => {
      const barber = barbers.find((b) => b.id === data.barberId) || barbers[0];
      const service = services.find((s) => s.id === data.serviceId) || services[0];
      const style = styles.find((s) => s.id === data.styleId);

      const durationMinutes = service.duration_minutes || 30;
      const [h, m] = data.startTime.split(':').map(Number);
      const endTotalMins = h * 60 + m + durationMinutes;
      const endH = Math.floor(endTotalMins / 60);
      const endM = endTotalMins % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const available = isSlotAvailable(
        barber.id,
        data.appointmentDate,
        data.startTime,
        durationMinutes,
        appointments
      );

      if (!available) {
        throw new Error('This time slot is no longer available. Please select another slot.');
      }

      const appointmentRef = `APT-${Math.floor(1000 + Math.random() * 9000)}`;

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        barber_id: barber.id,
        barber_name: barber.name,
        service_id: service.id,
        service_name: service.name,
        service_price: service.price_inr,
        style_id: style?.id || null,
        style_name: style?.name,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        appointment_date: data.appointmentDate,
        start_time: data.startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        status: 'confirmed',
        appointment_ref: appointmentRef,
        notes: data.notes,
        created_at: new Date().toISOString(),
      };

      setAppointments((prev) => {
        const updated = [newApt, ...prev];
        StorageEngine.saveAppointments(updated);
        return updated;
      });

      StorageEngine.logAction(
        'BOOK_APPOINTMENT',
        'APPOINTMENT',
        newApt.id,
        `Ref ${appointmentRef} booked for ${newApt.customer_name} with ${barber.name} on ${data.appointmentDate} at ${data.startTime}`
      );
      setAuditLogs(StorageEngine.getAuditLogs());

      sendNotification(
        'Appointment Confirmed!',
        `Your appointment ${appointmentRef} with ${barber.name} is confirmed for ${data.appointmentDate} at ${data.startTime}.`
      );

      CloudSync.syncAppointment(newApt);

      return newApt;
    },
    [barbers, services, styles, appointments, sendNotification]
  );

  // Cancel Appointment
  const cancelAppointment = useCallback(
    (appointmentId: string, reason: string = 'Customer cancellation') => {
      let changedApt: Appointment | undefined;

      setAppointments((prev) => {
        const updated = prev.map((apt) => {
          if (apt.id === appointmentId) {
            changedApt = {
              ...apt,
              status: 'cancelled' as const,
              notes: `${apt.notes ? apt.notes + ' | ' : ''}Cancelled: ${reason}`,
            };
            return changedApt;
          }
          return apt;
        });
        StorageEngine.saveAppointments(updated);
        return updated;
      });

      StorageEngine.logAction('CANCEL_APPOINTMENT', 'APPOINTMENT', appointmentId, `Cancelled. Reason: ${reason}`);
      setAuditLogs(StorageEngine.getAuditLogs());

      if (changedApt) {
        CloudSync.syncAppointment(changedApt);
      }
    },
    []
  );

  const selectedBarberForDashboard = useMemo(() => {
    return barbers.find((b) => b.id === activeBarberId) || barbers[0] || null;
  }, [barbers, activeBarberId]);

  const resetAllDemoData = useCallback(() => {
    StorageEngine.resetToDemo();
  }, []);

  return (
    <SaloonContext.Provider
      value={{
        settings,
        updateSettings,
        barbers,
        updateBarberStatus,
        updateBarber,
        addBarber,
        deleteBarber,
        services,
        addService,
        updateService,
        deleteService,
        styles,
        addStyle,
        updateStyle,
        deleteStyle,
        queues,
        appointments,
        auditLogs,
        favorites,
        toggleFavorite,
        userActiveToken,
        activeCustomerQueueEntry,
        joinQueue,
        cancelToken,
        startService,
        completeService,
        skipCustomer,
        recallCustomer,
        reassignBarber,
        addManualWalkin,
        bookAppointment,
        cancelAppointment,
        isOnline,
        activeRole,
        setActiveRole,
        activeBarberId,
        setActiveBarberId,
        selectedBarberForDashboard,
        requestNotificationPermission,
        sendNotification,
        resetAllDemoData,
        // Cloud Sync additions
        cloudSyncState,
        pushPhoneDataToCloud,
        pullCloudData,
        exportBackupJson,
        importBackupJson,
      }}
    >
      {children}
    </SaloonContext.Provider>
  );
};

export const useSaloon = () => {
  const context = useContext(SaloonContext);
  if (!context) {
    throw new Error('useSaloon must be used within a SaloonProvider');
  }
  return context;
};
