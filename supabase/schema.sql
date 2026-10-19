-- Farhaan Men's Saloon - Production Supabase Real-Time PostgreSQL Schema
-- Compatible with Frontend Text IDs ('barber-farhaan', 'srv-haircut-classic', 'style-xxx', 'q-xxx')
-- Fully supports Realtime WebSockets, Base64 compressed photos, and cross-device live sync

-- 1. Drop old tables if they exist with conflicting UUID types
DROP TABLE IF EXISTS public.barber_services CASCADE;
DROP TABLE IF EXISTS public.barber_breaks CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.queue_entries CASCADE;
DROP TABLE IF EXISTS public.haircut_styles CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;
DROP TABLE IF EXISTS public.salon_settings CASCADE;

-- 2. Salon Settings Table
CREATE TABLE public.salon_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name VARCHAR(255) NOT NULL DEFAULT 'Farhaan Men''s Saloon',
    slug VARCHAR(100) NOT NULL DEFAULT 'farhaan-mens-saloon',
    tagline VARCHAR(255) DEFAULT 'Premium Grooming & Traditional Mastery',
    address TEXT NOT NULL DEFAULT 'Handwara New Bus Stand Road, Near SRS textiles, Opposite City Choice Handwara',
    city VARCHAR(100) NOT NULL DEFAULT 'Handwara',
    state VARCHAR(100) NOT NULL DEFAULT 'Jammu & Kashmir',
    phone VARCHAR(30) NOT NULL DEFAULT '+916006225007',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    is_open BOOLEAN NOT NULL DEFAULT true,
    is_queue_paused BOOLEAN NOT NULL DEFAULT false,
    online_booking_enabled BOOLEAN NOT NULL DEFAULT true,
    accept_walkins_when_booking_on BOOLEAN NOT NULL DEFAULT true,
    max_daily_tokens INTEGER NOT NULL DEFAULT 150,
    buffer_minutes INTEGER NOT NULL DEFAULT 10,
    advance_booking_days INTEGER NOT NULL DEFAULT 7,
    creator_name VARCHAR(255) DEFAULT 'Dr. Mohd Muzzafar Lone',
    creator_phone VARCHAR(30) DEFAULT '+916006225007',
    admin_pin VARCHAR(10) NOT NULL DEFAULT '600622',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Barbers Table (ID is TEXT matching frontend IDs: 'barber-farhaan', 'barber-sameer', etc.)
CREATE TABLE public.barbers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 5,
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_status VARCHAR(20) NOT NULL DEFAULT 'available',
    break_ends_at TIMESTAMP WITH TIME ZONE,
    avg_service_mins INTEGER NOT NULL DEFAULT 25,
    pin_code VARCHAR(10) NOT NULL DEFAULT '1111',
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "21:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}',
    order_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Services Catalog Table
CREATE TABLE public.services (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Haircut',
    description TEXT,
    price_inr NUMERIC(10, 2) NOT NULL DEFAULT 180,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Haircut & Beard Styles Lookbook Table
CREATE TABLE public.haircut_styles (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    default_price_inr NUMERIC(10, 2) DEFAULT 200,
    estimated_mins INTEGER DEFAULT 30,
    is_trending BOOLEAN DEFAULT false,
    barber_instruction_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Live Queue Entries Table
CREATE TABLE public.queue_entries (
    id TEXT PRIMARY KEY,
    salon_id VARCHAR(100) NOT NULL DEFAULT 'farhaan-saloon',
    barber_id TEXT,
    barber_name VARCHAR(255),
    service_id TEXT,
    service_name VARCHAR(255),
    service_price NUMERIC(10, 2),
    style_id TEXT,
    style_name VARCHAR(255),
    style_image TEXT,
    token_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30),
    secure_token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    priority_order INTEGER NOT NULL DEFAULT 0,
    is_any_barber BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_wait_mins INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Appointments Table
CREATE TABLE public.appointments (
    id TEXT PRIMARY KEY,
    barber_id TEXT NOT NULL,
    barber_name VARCHAR(255),
    service_id TEXT NOT NULL,
    service_name VARCHAR(255),
    service_price NUMERIC(10, 2),
    style_id TEXT,
    style_name VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    appointment_ref VARCHAR(30) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Disable RLS or Grant Full Access to Anon & Authenticated for Seamless Web App Operation
ALTER TABLE public.salon_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.haircut_styles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 10. Enable Full Replication Identity for Realtime WebSockets
ALTER TABLE public.salon_settings REPLICA IDENTITY FULL;
ALTER TABLE public.barbers REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.haircut_styles REPLICA IDENTITY FULL;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

-- 11. Add All Tables to Supabase Realtime Publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_settings, public.barbers, public.services, public.haircut_styles, public.queue_entries, public.appointments, public.audit_logs;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
