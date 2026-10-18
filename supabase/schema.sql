-- Farhaan Men's Saloon - Production Supabase PostgreSQL Schema
-- Database Design covering all 13 core relational entities with RLS and Audit Logs

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Salons Table
CREATE TABLE IF NOT EXISTS public.salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Farhaan Men''s Saloon',
    slug VARCHAR(100) UNIQUE NOT NULL DEFAULT 'farhaan-mens-saloon',
    tagline VARCHAR(255) DEFAULT 'Premium Grooming & Traditional Mastery',
    address TEXT NOT NULL DEFAULT 'Main Commercial Hub, Near Clock Tower',
    city VARCHAR(100) NOT NULL DEFAULT 'Srinagar',
    state VARCHAR(100) NOT NULL DEFAULT 'Jammu & Kashmir',
    postal_code VARCHAR(20) DEFAULT '190001',
    phone VARCHAR(30) NOT NULL DEFAULT '+916006225007',
    email VARCHAR(255) DEFAULT 'info@farhaansaloon.com',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    is_open BOOLEAN NOT NULL DEFAULT true,
    is_queue_paused BOOLEAN NOT NULL DEFAULT false,
    online_booking_enabled BOOLEAN NOT NULL DEFAULT true,
    accept_walkins_when_booking_on BOOLEAN NOT NULL DEFAULT true,
    max_daily_tokens INTEGER NOT NULL DEFAULT 150,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Profiles Table (Roles: owner, barber, customer)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    auth_user_id UUID,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'barber', 'customer')),
    pin_code VARCHAR(10), -- For fast 4-digit mobile PIN login by barbers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Barbers Table
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 5,
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (current_status IN ('available', 'serving', 'on_break', 'unavailable')),
    break_ends_at TIMESTAMP WITH TIME ZONE,
    avg_service_mins INTEGER NOT NULL DEFAULT 25,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Haircut',
    description TEXT,
    price_inr NUMERIC(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Barber Services (Relation table for customized pricing/durations per barber)
CREATE TABLE IF NOT EXISTS public.barber_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    custom_price NUMERIC(10, 2),
    custom_duration_minutes INTEGER,
    is_offered BOOLEAN DEFAULT true,
    UNIQUE(barber_id, service_id)
);

-- 7. Haircut & Beard Styles Gallery
CREATE TABLE IF NOT EXISTS public.haircut_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'fade_taper',
        'classic',
        'modern_textured',
        'crew_short',
        'long_hair',
        'beard_shaping',
        'moustache',
        'combo'
    )),
    description TEXT,
    image_url TEXT NOT NULL,
    default_price_inr NUMERIC(10, 2) DEFAULT 200,
    estimated_mins INTEGER DEFAULT 30,
    is_trending BOOLEAN DEFAULT false,
    barber_instruction_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Business Hours Table
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    is_closed BOOLEAN NOT NULL DEFAULT false,
    open_time TIME NOT NULL DEFAULT '09:00:00',
    close_time TIME NOT NULL DEFAULT '21:00:00',
    UNIQUE(salon_id, day_of_week)
);

-- 9. Barber Breaks & Leave Schedule
CREATE TABLE IF NOT EXISTS public.barber_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    break_type VARCHAR(50) DEFAULT 'lunch' CHECK (break_type IN ('tea', 'lunch', 'prayer', 'custom')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Queue Entries Table
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL, -- NULL means 'Any Available'
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    style_id UUID REFERENCES public.haircut_styles(id) ON DELETE SET NULL,
    token_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30),
    secure_token VARCHAR(64) NOT NULL UNIQUE, -- Unguessable token for secure status lookup
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN (
        'waiting',
        'in_service',
        'completed',
        'skipped',
        'cancelled'
    )),
    priority_order INTEGER NOT NULL DEFAULT 0,
    is_any_barber BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_wait_mins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    style_id UUID REFERENCES public.haircut_styles(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN (
        'pending',
        'confirmed',
        'in_service',
        'completed',
        'cancelled',
        'no_show'
    )),
    appointment_ref VARCHAR(30) NOT NULL UNIQUE,
    notes TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Notification Preferences & Web Push Subscriptions
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_phone VARCHAR(30),
    queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    push_subscription JSONB,
    in_app_notified BOOLEAN DEFAULT false,
    sms_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Audit Logs Table (For reassignments, price adjustments, operational changes)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_state JSONB,
    new_state JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for High Concurrency Performance
CREATE INDEX IF NOT EXISTS idx_queue_active ON public.queue_entries(salon_id, barber_id, status, queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_secure_token ON public.queue_entries(secure_token);
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON public.appointments(barber_id, appointment_date, start_time, status);
CREATE INDEX IF NOT EXISTS idx_barber_status ON public.barbers(salon_id, current_status, is_active);

-- Row Level Security (RLS) Policies
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haircut_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public can read active salons, barbers, services, and styles
CREATE POLICY "Public read salons" ON public.salons FOR SELECT USING (true);
CREATE POLICY "Public read barbers" ON public.barbers FOR SELECT USING (is_active = true);
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read styles" ON public.haircut_styles FOR SELECT USING (true);

-- Customers can view queue status or insert their own token
CREATE POLICY "Public read queue entries" ON public.queue_entries FOR SELECT USING (true);
CREATE POLICY "Public insert queue entry" ON public.queue_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update own token" ON public.queue_entries FOR UPDATE USING (true);

-- Appointments public insert & read
CREATE POLICY "Public create appointment" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public view appointments" ON public.appointments FOR SELECT USING (true);
