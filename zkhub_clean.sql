--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    entity_label text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_log OWNER TO postgres;

--
-- Name: ad_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    integration_id uuid,
    platform text NOT NULL,
    account_id text NOT NULL,
    account_name text,
    currency text DEFAULT 'ARS'::text,
    timezone text,
    status text DEFAULT 'active'::text,
    is_client_account boolean DEFAULT false,
    client_name text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ad_accounts OWNER TO postgres;

--
-- Name: ad_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_account_id uuid,
    cache_type text NOT NULL,
    data jsonb NOT NULL,
    date_range text,
    cached_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (now() + '01:00:00'::interval)
);


ALTER TABLE public.ad_cache OWNER TO postgres;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    target_type text,
    target_id text,
    details text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_audit_log OWNER TO postgres;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    target_workspace_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: ai_generations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    created_by uuid,
    template_id uuid,
    categoria text NOT NULL,
    input_context jsonb DEFAULT '{}'::jsonb,
    prompt_used text,
    output text NOT NULL,
    tono text,
    contact_id uuid,
    deal_id uuid,
    sent_to_crm boolean DEFAULT false,
    tokens_used integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_generations OWNER TO postgres;

--
-- Name: ai_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    created_by uuid,
    nombre text NOT NULL,
    descripcion text,
    categoria text NOT NULL,
    tipo text NOT NULL,
    prompt_base text NOT NULL,
    tono text DEFAULT 'profesional'::text,
    is_system boolean DEFAULT false,
    uses_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_templates OWNER TO postgres;

--
-- Name: automation_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    automation_id uuid,
    workspace_id uuid,
    trigger_data jsonb,
    status text DEFAULT 'running'::text,
    results jsonb DEFAULT '[]'::jsonb,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    error text
);


ALTER TABLE public.automation_runs OWNER TO postgres;

--
-- Name: automations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    descripcion text,
    is_active boolean DEFAULT false,
    trigger_type text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb,
    actions jsonb DEFAULT '[]'::jsonb,
    run_count integer DEFAULT 0,
    last_run timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.automations OWNER TO postgres;

--
-- Name: billing_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    stripe_event_id text,
    event_type text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    processed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_events OWNER TO postgres;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    created_by uuid,
    titulo text NOT NULL,
    descripcion text,
    tipo text DEFAULT 'reunion'::text,
    fecha_inicio timestamp with time zone NOT NULL,
    fecha_fin timestamp with time zone NOT NULL,
    todo_el_dia boolean DEFAULT false,
    timezone text DEFAULT 'America/Argentina/Buenos_Aires'::text,
    contact_id uuid,
    deal_id uuid,
    google_event_id text,
    google_calendar_id text,
    google_meet_link text,
    google_hangout_link text,
    attendees jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'confirmed'::text,
    recurrence text,
    reminder_minutes integer DEFAULT 30,
    reminder_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: calendar_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    user_id uuid,
    google_access_token text,
    google_refresh_token text,
    google_token_expiry timestamp without time zone,
    google_email text,
    selected_calendars jsonb DEFAULT '[]'::jsonb,
    sync_enabled boolean DEFAULT true,
    last_sync timestamp without time zone,
    sync_token text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.calendar_integrations OWNER TO postgres;

--
-- Name: cobro_pagos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cobro_pagos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cobro_id uuid NOT NULL,
    numero_pago integer NOT NULL,
    fecha_vencimiento date,
    fecha_pago date,
    monto numeric DEFAULT 0,
    estado text DEFAULT 'pendiente'::text,
    notas text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cobro_pagos OWNER TO postgres;

--
-- Name: cobros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cobros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    deal_id uuid,
    contact_id uuid,
    monto_total numeric DEFAULT 0,
    moneda text DEFAULT 'ARS'::text,
    num_pagos integer DEFAULT 1,
    metodo_pago text DEFAULT 'transferencia'::text,
    fecha_primer_pago date,
    frecuencia text DEFAULT 'mensual'::text,
    estado text DEFAULT 'pendiente'::text,
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cobros OWNER TO postgres;

--
-- Name: contact_folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    color text DEFAULT '#6b7280'::text,
    icon text DEFAULT 'folder'::text,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_folders OWNER TO postgres;

--
-- Name: contact_list_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_list_members (
    list_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_list_members OWNER TO postgres;

--
-- Name: contact_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    color text DEFAULT '#6b7280'::text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_lists OWNER TO postgres;

--
-- Name: contact_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    workspace_id uuid,
    contenido text NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_notes OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    email text,
    telefono text,
    empresa text,
    etiquetas text[] DEFAULT '{}'::text[],
    notas text,
    created_at timestamp without time zone DEFAULT now(),
    preferred_currency text,
    maps_url text,
    pais text,
    region text,
    facebook_url text,
    instagram_url text,
    sitio_web text,
    temperatura text DEFAULT 'frio'::text,
    folder_id uuid,
    nicho text,
    dato_relevante text
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    contact_id uuid,
    canal text DEFAULT 'manual'::text,
    estado text DEFAULT 'abierta'::text,
    ultimo_mensaje text,
    ultimo_mensaje_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    integration_id uuid,
    external_thread_id text,
    external_contact_id text,
    platform text DEFAULT 'manual'::text
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    contact_id uuid,
    stage_id uuid,
    titulo text NOT NULL,
    valor numeric DEFAULT '0'::numeric,
    posicion integer DEFAULT 0,
    fecha_cierre date,
    created_at timestamp without time zone DEFAULT now(),
    descripcion text,
    prioridad text DEFAULT 'normal'::text,
    currency text,
    subtipo text,
    reunion_fecha timestamp with time zone,
    reunion_hora text,
    reunion_lugar text,
    reunion_plataforma text,
    reunion_link text,
    reunion_duracion text,
    agendar_en_calendario boolean DEFAULT true
);


ALTER TABLE public.deals OWNER TO postgres;

--
-- Name: external_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    user_id uuid,
    google_event_id text NOT NULL,
    google_calendar_id text NOT NULL,
    titulo text,
    descripcion text,
    fecha_inicio timestamp with time zone,
    fecha_fin timestamp with time zone,
    todo_el_dia boolean DEFAULT false,
    google_meet_link text,
    attendees jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'confirmed'::text,
    organizer jsonb,
    raw_data jsonb,
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.external_events OWNER TO postgres;

--
-- Name: integration_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integration_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    integration_id uuid,
    direction text NOT NULL,
    status text NOT NULL,
    message text,
    payload jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.integration_logs OWNER TO postgres;

--
-- Name: integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    tipo text NOT NULL,
    nombre text,
    status text DEFAULT 'disconnected'::text,
    credentials text DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    webhook_secret text,
    last_sync timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.integrations OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid,
    workspace_id uuid,
    contenido text NOT NULL,
    direccion text NOT NULL,
    canal text DEFAULT 'manual'::text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    external_message_id text,
    platform text DEFAULT 'manual'::text,
    status text DEFAULT 'sent'::text,
    media_url text,
    media_type text,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    workspace_id uuid,
    deal_overdue boolean DEFAULT true,
    deal_won boolean DEFAULT true,
    deal_created boolean DEFAULT false,
    contact_created boolean DEFAULT false,
    conversation_stale boolean DEFAULT true,
    teammate_joined boolean DEFAULT true,
    weekly_summary boolean DEFAULT true
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: onboarding_checklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_checklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    logo_uploaded boolean DEFAULT false,
    first_contact_created boolean DEFAULT false,
    first_deal_created boolean DEFAULT false,
    first_conversation_created boolean DEFAULT false,
    teammate_invited boolean DEFAULT false,
    pipeline_customized boolean DEFAULT false
);


ALTER TABLE public.onboarding_checklist OWNER TO postgres;

--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    posicion integer NOT NULL,
    color text DEFAULT '#8B7355'::text
);


ALTER TABLE public.pipeline_stages OWNER TO postgres;

--
-- Name: plan_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    slug text NOT NULL,
    precio_usd numeric DEFAULT 0,
    stripe_price_id_monthly text,
    stripe_price_id_yearly text,
    max_contacts integer DEFAULT 250,
    max_deals integer DEFAULT 50,
    max_members integer DEFAULT 1,
    max_automations integer DEFAULT 0,
    max_ai_generations integer DEFAULT 5,
    max_ad_accounts integer DEFAULT 0,
    max_sub_workspaces integer DEFAULT 0,
    feature_whatsapp boolean DEFAULT false,
    feature_email boolean DEFAULT false,
    feature_instagram boolean DEFAULT false,
    feature_ads boolean DEFAULT false,
    feature_automations boolean DEFAULT false,
    feature_ai boolean DEFAULT false,
    feature_white_label boolean DEFAULT false,
    feature_calendar boolean DEFAULT true,
    feature_api_access boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plan_definitions OWNER TO postgres;

--
-- Name: presupuesto_envios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presupuesto_envios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    presupuesto_id uuid,
    workspace_id uuid,
    contact_id uuid,
    conversation_id uuid,
    canal text DEFAULT 'whatsapp'::text,
    view_url text,
    sent_at timestamp without time zone DEFAULT now(),
    viewed_at timestamp without time zone,
    viewed boolean DEFAULT false
);


ALTER TABLE public.presupuesto_envios OWNER TO postgres;

--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presupuestos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    created_by uuid,
    nombre text NOT NULL,
    descripcion text,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    version text DEFAULT '1.0'::text,
    tags text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    sent_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.presupuestos OWNER TO postgres;

--
-- Name: proposal_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposal_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposal_id uuid,
    viewed_at timestamp without time zone DEFAULT now(),
    ip_address text
);


ALTER TABLE public.proposal_views OWNER TO postgres;

--
-- Name: proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    contact_id uuid,
    deal_id uuid,
    created_by uuid,
    titulo text NOT NULL,
    descripcion text,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    status text DEFAULT 'borrador'::text,
    sent_at timestamp without time zone,
    sent_via text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.proposals OWNER TO postgres;

--
-- Name: reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    created_by uuid,
    contact_id uuid,
    deal_id uuid,
    titulo text NOT NULL,
    descripcion text,
    fecha_recordatorio timestamp with time zone NOT NULL,
    tipo text DEFAULT 'seguimiento'::text,
    canal text DEFAULT 'app'::text,
    status text DEFAULT 'pendiente'::text,
    notified boolean DEFAULT false,
    notified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reminders OWNER TO postgres;

--
-- Name: sub_workspaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_workspace_id uuid,
    workspace_id uuid,
    client_name text,
    client_email text,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sub_workspaces OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    text text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    contact_id uuid,
    due_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    assigned_to uuid,
    assignee_slot text,
    notes text
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    nombre text NOT NULL,
    logo_url text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    metric text NOT NULL,
    value integer DEFAULT 0,
    period text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.usage_tracking OWNER TO postgres;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workspace_id uuid,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info'::text,
    icon_url text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    nombre text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    avatar_url text,
    phone text,
    role_title text,
    last_seen timestamp without time zone DEFAULT now(),
    is_superadmin boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    integration_id uuid,
    tipo text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false,
    error text,
    received_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone
);


ALTER TABLE public.webhook_events OWNER TO postgres;

--
-- Name: workspace_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    email text NOT NULL,
    rol text DEFAULT 'member'::text,
    token text NOT NULL,
    invited_by uuid,
    status text DEFAULT 'pending'::text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workspace_invitations OWNER TO postgres;

--
-- Name: workspace_tone_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_tone_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    nombre text NOT NULL,
    descripcion text,
    instrucciones text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workspace_tone_profiles OWNER TO postgres;

--
-- Name: workspace_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid,
    user_id uuid,
    rol text DEFAULT 'member'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workspace_users OWNER TO postgres;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    plan text DEFAULT 'free'::text,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    logo_url text,
    accent_color text DEFAULT '#6366f1'::text,
    website text,
    industry text,
    timezone text DEFAULT 'America/Argentina/Buenos_Aires'::text,
    plan_status text DEFAULT 'active'::text,
    trial_ends_at timestamp without time zone DEFAULT (now() + '14 days'::interval),
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    cancel_at_period_end boolean DEFAULT false,
    parent_workspace_id uuid,
    white_label jsonb DEFAULT '{}'::jsonb,
    is_white_label boolean DEFAULT false,
    currency text DEFAULT 'USD'::text
);


ALTER TABLE public.workspaces OWNER TO postgres;

--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.activity_log (id, workspace_id, user_id, action, entity_type, entity_id, entity_label, metadata, created_at) VALUES ('316f51ed-fd0e-4df3-a192-573fd96d453b', '8e90587b-c9a2-449f-bc17-666fb2383167', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'deal.created', 'deal', '2f0f1150-62e1-4d87-907a-9df8d1ab87e8', 'Test Deal Visual', '{}', '2026-04-14 17:55:29.57806');
INSERT INTO public.activity_log (id, workspace_id, user_id, action, entity_type, entity_id, entity_label, metadata, created_at) VALUES ('4a3a8b4f-65e1-4e23-abc7-fc36d4458219', '8e90587b-c9a2-449f-bc17-666fb2383167', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'deal.moved', 'deal', '2f0f1150-62e1-4d87-907a-9df8d1ab87e8', 'Test Deal Visual', '{"stage": "Nuevo lead"}', '2026-04-22 23:05:41.661714');
INSERT INTO public.activity_log (id, workspace_id, user_id, action, entity_type, entity_id, entity_label, metadata, created_at) VALUES ('2669673c-4651-4c4b-94dd-83fe8d67e445', '8e90587b-c9a2-449f-bc17-666fb2383167', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'deal.moved', 'deal', '2f0f1150-62e1-4d87-907a-9df8d1ab87e8', 'Test Deal Visual', '{"stage": "En cobro"}', '2026-04-22 23:11:07.434218');
INSERT INTO public.activity_log (id, workspace_id, user_id, action, entity_type, entity_id, entity_label, metadata, created_at) VALUES ('d3127073-db8a-4e89-b15f-120562845308', '8e90587b-c9a2-449f-bc17-666fb2383167', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'deal.moved', 'deal', '2f0f1150-62e1-4d87-907a-9df8d1ab87e8', 'Test Deal Visual', '{"stage": "En cobro"}', '2026-05-01 13:49:42.555797');


--
-- Data for Name: ad_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ad_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at) VALUES ('bd71644c-760d-4e3d-9abd-1ff156fac211', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'delete_user', 'user', '20b7c63d-9b86-495a-b66c-366da02e8700', NULL, '2026-04-03 01:56:08.528755');
INSERT INTO public.admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at) VALUES ('ec31e783-232a-4b11-af73-3f609957ec55', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'delete_user', 'user', 'e0fe3382-6211-4b48-83d0-eedfd07cc4b4', NULL, '2026-04-03 01:56:13.962652');
INSERT INTO public.admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at) VALUES ('3f56f160-3301-4a35-82f7-e7e4daa3d41d', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'delete_user', 'user', 'f35187b5-0c6a-4b72-a9e9-8e9e001d72cd', NULL, '2026-04-03 01:56:17.300618');
INSERT INTO public.admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at) VALUES ('a36b6bdc-4ea9-40bb-9abe-2c59b535cada', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'delete_user', 'user', '9dd0a5fb-2a1a-4fc2-a91d-3b74165c4b79', NULL, '2026-04-03 01:56:24.138492');
INSERT INTO public.admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at) VALUES ('066df6eb-1de3-437f-b249-df9ab385fbe2', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'impersonate_workspace', 'workspace', '3abf0c46-13bc-43d1-9326-448078f6ec65', 'Impersonated workspace "Workspace Free" as free@zktest.com', '2026-04-03 01:56:47.736176');


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_generations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('b78b427d-1d54-4494-80f8-80bf2ca3add5', NULL, NULL, 'Follow-up después de reunión', 'Email de seguimiento post-reunión', 'email', 'followup', 'Escribí un email de follow-up para {{contact_nombre}} después de una reunión. El deal {{deal_titulo}} está en etapa {{deal_etapa}} con un valor de {{deal_valor}}. Resumí los próximos pasos y mostrá entusiasmo.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('c0026e1c-041f-478d-9669-a7afda4e8ce3', NULL, NULL, 'Propuesta comercial', 'Propuesta estructurada completa', 'propuesta', 'propuesta_completa', 'Creá una propuesta comercial estructurada para {{contact_empresa}}. El deal es {{deal_titulo}} con valor aproximado {{deal_valor}}. Incluí: resumen ejecutivo, problema que resolvemos, solución propuesta, inversión y próximos pasos.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('60d8c8e1-6819-4af0-88d9-bcbb13edf0bf', NULL, NULL, 'Mensaje WhatsApp inicial', 'Primer contacto por WhatsApp', 'whatsapp', 'primer_contacto', 'Escribí un mensaje de WhatsApp corto (máximo 3 párrafos) para iniciar contacto con {{contact_nombre}} de {{contact_empresa}}. Que sea directo, amigable y con una pregunta al final para abrir conversación.', 'amigable', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('3531454c-70ca-402b-b184-a93a6acf96c9', NULL, NULL, 'WhatsApp seguimiento', 'Seguimiento no invasivo por WhatsApp', 'whatsapp', 'seguimiento', 'Escribí un mensaje de WhatsApp de seguimiento para {{contact_nombre}}. Es el segundo o tercer contacto. Que sea breve, no invasivo, y genere una respuesta.', 'amigable', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('a64fd8ec-ab25-4367-a17b-81769887ea4c', NULL, NULL, 'Estructura de sitio web', 'Briefing completo de arquitectura web', 'web', 'estructura', 'Creá la estructura completa de un sitio web para {{contact_empresa}}. Incluí: páginas, secciones de cada página, textos clave de cada sección, llamadas a la acción y jerarquía de información. Pensalo como briefing para un diseñador web.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('710eb57b-306d-4b6a-8f10-771a59f9ebb8', NULL, NULL, 'Post para LinkedIn', 'Post con gancho y llamada a la acción', 'contenido', 'linkedin', 'Escribí un post de LinkedIn para {{workspace_nombre}} sobre el tema: {{instruccion_libre}}. Que genere interacción, tenga gancho en la primera línea y termine con una pregunta o llamada a la acción.', 'amigable', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('98e28969-9b33-4b7c-92b5-bfd5eed32226', NULL, NULL, 'Secuencia de 3 emails', 'Secuencia de nurturing completa', 'secuencia', 'nurturing', 'Creá una secuencia de 3 emails de nurturing para {{contact_nombre}} de {{contact_empresa}}. Email 1: valor sin vender. Email 2: caso de éxito relevante. Email 3: propuesta con urgencia suave. Cada email debe tener asunto y cuerpo.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('477fb2c1-7d04-42bd-bbdf-d6ed0a07050f', NULL, NULL, 'Email de reactivación', 'Reactivar contactos fríos', 'email', 'reactivacion', 'Escribí un email para reactivar el contacto con {{contact_nombre}}, con quien no hemos hablado en un tiempo. El deal {{deal_titulo}} quedó sin cerrar. Que sea honesto, sin presión, y abra la puerta a retomar.', 'amigable', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('0a648506-18b7-4bb4-8863-572540c94dec', NULL, NULL, 'Propuesta de agencia de marketing', 'Propuesta de servicios de marketing digital', 'propuesta', 'agencia', 'Creá una propuesta de servicios de marketing digital para {{contact_empresa}}. Incluí: diagnóstico rápido del negocio, servicios recomendados (redes, web, ads, contenido), metodología de trabajo, plazos y estructura de inversión.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('26a39154-eef9-46b0-b152-f41a1efe137b', NULL, NULL, 'Descripción de producto/servicio', 'Descripción persuasiva lista para usar', 'contenido', 'descripcion', 'Escribí una descripción persuasiva de {{instruccion_libre}} para usar en web, propuesta o redes sociales. Que comunique el valor real, no solo las features. Tono: {{tono}}.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('eba20e3e-98e3-4cc3-98d7-002a68d70cf8', NULL, NULL, 'Brief para diseñador', 'Brief completo para proyectos de diseño', 'web', 'brief', 'Creá un brief detallado para un diseñador que va a trabajar en un proyecto para {{contact_empresa}}. Incluí: objetivos, público objetivo, referencias de estilo, entregables esperados, plazos sugeridos y consideraciones técnicas.', 'profesional', 't', '0', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');
INSERT INTO public.ai_templates (id, workspace_id, created_by, nombre, descripcion, categoria, tipo, prompt_base, tono, is_system, uses_count, created_at, updated_at) VALUES ('b722722f-b7dc-498c-bb1c-e09e03fde11a', NULL, NULL, 'Email de presentación', 'Presentación de servicios personalizada', 'email', 'presentacion', 'Escribí un email profesional presentando nuestros servicios a {{contact_nombre}} de {{contact_empresa}}. Mencioná que podemos ayudarlos con [servicio]. Tono: {{tono}}. Incluí asunto y cuerpo del email.', 'profesional', 't', '1', '2026-04-01 02:29:17.027333', '2026-04-01 02:29:17.027333');


--
-- Data for Name: automation_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: billing_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: calendar_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cobro_pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cobro_pagos (id, cobro_id, numero_pago, fecha_vencimiento, fecha_pago, monto, estado, notas, created_at) VALUES ('b224426c-0beb-4e67-accd-cd7653a82566', 'd5efb339-653e-420e-8e63-565a57e42c51', '1', '2026-05-01', NULL, '2950', 'pendiente', NULL, '2026-04-22 23:11:07.463868+00');
INSERT INTO public.cobro_pagos (id, cobro_id, numero_pago, fecha_vencimiento, fecha_pago, monto, estado, notas, created_at) VALUES ('01900f20-6340-48b2-9817-cdc5c9da4459', 'd5efb339-653e-420e-8e63-565a57e42c51', '2', '2026-06-01', NULL, '2950', 'pendiente', NULL, '2026-04-22 23:11:07.467261+00');


--
-- Data for Name: cobros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cobros (id, workspace_id, deal_id, contact_id, monto_total, moneda, num_pagos, metodo_pago, fecha_primer_pago, frecuencia, estado, notas, created_at, updated_at) VALUES ('d5efb339-653e-420e-8e63-565a57e42c51', '8e90587b-c9a2-449f-bc17-666fb2383167', '2f0f1150-62e1-4d87-907a-9df8d1ab87e8', NULL, '5900', 'USD', '2', 'stripe', '2026-05-01', 'mensual', 'pendiente', NULL, '2026-04-22 23:11:07.447711+00', '2026-04-22 23:11:07.459+00');


--
-- Data for Name: contact_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.contact_folders (id, workspace_id, nombre, color, icon, order_index, created_at) VALUES ('f0b5f2c2-7da7-42e1-83d1-106208010756', '8e90587b-c9a2-449f-bc17-666fb2383167', 'General', '#6b7280', 'folder', '0', '2026-04-03 15:30:03.042569');


--
-- Data for Name: contact_list_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contact_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contact_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.deals (id, workspace_id, contact_id, stage_id, titulo, valor, posicion, fecha_cierre, created_at, descripcion, prioridad, currency, subtipo, reunion_fecha, reunion_hora, reunion_lugar, reunion_plataforma, reunion_link, reunion_duracion, agendar_en_calendario) VALUES ('2f0f1150-62e1-4d87-907a-9df8d1ab87e8', '8e90587b-c9a2-449f-bc17-666fb2383167', NULL, 'dd8943b6-8d7f-4eb4-b1f5-af613eb612fc', 'Test Deal Visual', '0', '0', NULL, '2026-04-14 17:55:29.543634', NULL, 'normal', 'USD', 'general', NULL, NULL, NULL, NULL, NULL, NULL, 'f');


--
-- Data for Name: external_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: integration_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notification_preferences (id, user_id, workspace_id, deal_overdue, deal_won, deal_created, contact_created, conversation_stale, teammate_joined, weekly_summary) VALUES ('8719775a-3872-411b-921f-7e97af12b2bb', '2a9e8d2c-15cb-4182-a617-a6da7693a564', '8e90587b-c9a2-449f-bc17-666fb2383167', 't', 't', 'f', 'f', 't', 't', 't');


--
-- Data for Name: onboarding_checklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.onboarding_checklist (id, workspace_id, logo_uploaded, first_contact_created, first_deal_created, first_conversation_created, teammate_invited, pipeline_customized) VALUES ('a58bf48d-eec0-4c64-88c7-5eb2fd4789f9', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'f', 'f', 'f', 'f', 'f', 'f');
INSERT INTO public.onboarding_checklist (id, workspace_id, logo_uploaded, first_contact_created, first_deal_created, first_conversation_created, teammate_invited, pipeline_customized) VALUES ('5b1a8e01-2cfd-441a-8396-7a6c54f07972', '159bd09d-706b-412f-b170-da7d33a4b282', 'f', 'f', 'f', 'f', 'f', 'f');
INSERT INTO public.onboarding_checklist (id, workspace_id, logo_uploaded, first_contact_created, first_deal_created, first_conversation_created, teammate_invited, pipeline_customized) VALUES ('a3b8e282-a98a-4333-b333-adb9d11bdc13', '712a8e9f-c620-4f95-882a-ba101297bc85', 'f', 'f', 'f', 'f', 'f', 'f');
INSERT INTO public.onboarding_checklist (id, workspace_id, logo_uploaded, first_contact_created, first_deal_created, first_conversation_created, teammate_invited, pipeline_customized) VALUES ('074889c8-2195-4030-b3b3-e046b14100dc', '21103768-bb0f-460a-93c1-4a92a4a56178', 'f', 'f', 'f', 'f', 'f', 'f');


--
-- Data for Name: pipeline_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('dd8943b6-8d7f-4eb4-b1f5-af613eb612fc', '8e90587b-c9a2-449f-bc17-666fb2383167', 'En cobro', '6', '#0ea5e9');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('c13b5ccb-9bfc-493e-9ce3-80d72c62cca2', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'En cobro', '6', '#0ea5e9');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('f2cdd7d7-5f90-4fe0-b5bf-f50e42a8613b', '159bd09d-706b-412f-b170-da7d33a4b282', 'En cobro', '6', '#0ea5e9');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('510bdf83-4d00-4cdd-ba84-f51c720996c5', '712a8e9f-c620-4f95-882a-ba101297bc85', 'En cobro', '6', '#0ea5e9');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('4b93e315-ef38-43fe-80ea-07336bef7d6b', '21103768-bb0f-460a-93c1-4a92a4a56178', 'En cobro', '6', '#0ea5e9');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('3b7aff80-4555-4dd1-945e-c19dc8e67478', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Nuevo lead', '0', '#6366f1');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('06956c6a-9aa8-4978-973e-1c52de9c0770', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Contactado', '1', '#f59e0b');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('2c670baf-6a2f-43c8-b191-3f3b26c521b3', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Propuesta', '2', '#3b82f6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('a9b446fc-9da9-4424-b6b1-03afee71e8d0', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Negociación', '3', '#8b5cf6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('7dda459e-e9cf-4c74-b004-04f0c1c1a133', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Cerrado ganado', '4', '#10b981');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('defb1ae5-1f40-4ebb-90af-ce4f72da7e59', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Cerrado perdido', '5', '#ef4444');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('ddbe7df5-72ab-4feb-be48-0f3b4fc6e7be', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Nuevo lead', '0', '#6366f1');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('3c5b9d47-dcfa-432a-addb-4c1eb6e5011c', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Contactado', '1', '#f59e0b');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('4c9ff08b-c78a-4ff8-8bff-1a5c0a36fbb4', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Propuesta', '2', '#3b82f6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('8e683eaf-3fa5-43ca-8a24-fbcb92100efc', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Negociación', '3', '#8b5cf6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('cbb6eb57-bb51-4d51-964e-e4bfca918229', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Cerrado ganado', '4', '#10b981');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('503687dc-35dd-41c0-aa58-d2e970713e79', 'e2df1796-dbf3-46c2-b417-c67e58d151db', 'Cerrado perdido', '5', '#ef4444');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('82dc2a2d-2572-4f17-bdbc-e5f1310f0664', '159bd09d-706b-412f-b170-da7d33a4b282', 'Nuevo lead', '0', '#6366f1');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('9a9b4e27-e44b-401c-97fb-4be2028d14e3', '159bd09d-706b-412f-b170-da7d33a4b282', 'Contactado', '1', '#f59e0b');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('d76a2de2-7ba9-4984-b6a3-d564802c1034', '159bd09d-706b-412f-b170-da7d33a4b282', 'Propuesta', '2', '#3b82f6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('48b82aed-4ef2-48fd-a666-80f3a4b7ef32', '159bd09d-706b-412f-b170-da7d33a4b282', 'Negociación', '3', '#8b5cf6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('df15d871-d7a1-46e7-b9db-80a9f835a5df', '159bd09d-706b-412f-b170-da7d33a4b282', 'Cerrado ganado', '4', '#10b981');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('857382d5-68fb-4e9f-bd1b-067f679cf56c', '159bd09d-706b-412f-b170-da7d33a4b282', 'Cerrado perdido', '5', '#ef4444');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('0e61ad52-56e8-4e08-ba5b-fb4918607f43', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Nuevo lead', '0', '#6366f1');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('c8931e68-edea-4de0-91f9-294cf7e4a09e', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Contactado', '1', '#f59e0b');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('59bd47e4-47ec-47ac-a618-1bdf0cb1230e', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Propuesta', '2', '#3b82f6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('a20b6b0a-bff1-462d-88f4-dd80d6b588a4', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Negociación', '3', '#8b5cf6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('bb2ca4cc-6e55-49a4-a657-f970cc09f455', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Cerrado ganado', '4', '#10b981');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('c37a929a-edd4-4ff8-ae72-01285aba7f34', '712a8e9f-c620-4f95-882a-ba101297bc85', 'Cerrado perdido', '5', '#ef4444');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('575bd386-217b-4455-9477-332473934f97', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Nuevo lead', '0', '#6366f1');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('b7752028-5808-492c-85df-26bf407def59', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Contactado', '1', '#f59e0b');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('e60c7e71-e18d-4d18-8805-ff94770f98d1', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Propuesta', '2', '#3b82f6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('ea02fa6d-fcf7-4f83-ae02-b7b343715d8f', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Negociación', '3', '#8b5cf6');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('3bcc7296-a35f-4929-b1ce-9dc150e1060a', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Cerrado ganado', '4', '#10b981');
INSERT INTO public.pipeline_stages (id, workspace_id, nombre, posicion, color) VALUES ('0cb36bb7-6473-4b02-bdde-864e618c9ba5', '21103768-bb0f-460a-93c1-4a92a4a56178', 'Cerrado perdido', '5', '#ef4444');


--
-- Data for Name: plan_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.plan_definitions (id, nombre, slug, precio_usd, stripe_price_id_monthly, stripe_price_id_yearly, max_contacts, max_deals, max_members, max_automations, max_ai_generations, max_ad_accounts, max_sub_workspaces, feature_whatsapp, feature_email, feature_instagram, feature_ads, feature_automations, feature_ai, feature_white_label, feature_calendar, feature_api_access, is_active, created_at) VALUES ('706d49d6-e4fe-472e-86dd-5162c786476e', 'Free', 'free', '0', NULL, NULL, '250', '50', '1', '0', '5', '0', '0', 'f', 'f', 'f', 'f', 'f', 't', 'f', 't', 'f', 't', '2026-04-01 12:51:21.283044');
INSERT INTO public.plan_definitions (id, nombre, slug, precio_usd, stripe_price_id_monthly, stripe_price_id_yearly, max_contacts, max_deals, max_members, max_automations, max_ai_generations, max_ad_accounts, max_sub_workspaces, feature_whatsapp, feature_email, feature_instagram, feature_ads, feature_automations, feature_ai, feature_white_label, feature_calendar, feature_api_access, is_active, created_at) VALUES ('713a907b-18d4-4bf9-9ab6-d6dac5fe3ee1', 'Pro', 'pro', '29', NULL, NULL, '2500', '-1', '5', '10', '200', '2', '0', 't', 't', 't', 't', 't', 't', 'f', 't', 'f', 't', '2026-04-01 12:51:21.283044');
INSERT INTO public.plan_definitions (id, nombre, slug, precio_usd, stripe_price_id_monthly, stripe_price_id_yearly, max_contacts, max_deals, max_members, max_automations, max_ai_generations, max_ad_accounts, max_sub_workspaces, feature_whatsapp, feature_email, feature_instagram, feature_ads, feature_automations, feature_ai, feature_white_label, feature_calendar, feature_api_access, is_active, created_at) VALUES ('f8ef56c6-6080-4925-a272-4580e446f90f', 'Agency', 'agency', '79', NULL, NULL, '-1', '-1', '-1', '-1', '-1', '-1', '10', 't', 't', 't', 't', 't', 't', 't', 't', 'f', 't', '2026-04-01 12:51:21.283044');


--
-- Data for Name: presupuesto_envios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: proposal_views; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sub_workspaces; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tasks (id, workspace_id, text, done, contact_id, due_date, created_at, assigned_to, assignee_slot, notes) VALUES ('aae06b7a-9a39-46fa-aec2-e20b6f007d4d', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Revisar propuesta final', 'f', NULL, '2026-04-13', '2026-04-13 16:39:31.687512', NULL, 'fabri', NULL);
INSERT INTO public.tasks (id, workspace_id, text, done, contact_id, due_date, created_at, assigned_to, assignee_slot, notes) VALUES ('9fb7f7ea-2782-4e23-a379-bce52833cb7a', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Llamar a cliente importante', 't', NULL, '2026-04-13', '2026-04-13 16:39:17.623714', NULL, 'inmi', NULL);
INSERT INTO public.tasks (id, workspace_id, text, done, contact_id, due_date, created_at, assigned_to, assignee_slot, notes) VALUES ('8286b235-a9b2-4094-880e-676259ff6d86', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Tarea de prueba equipo', 'f', NULL, '2026-04-13', '2026-04-13 16:18:24.971825', NULL, NULL, NULL);


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.team_members (id, team_id, user_id, added_at) VALUES ('87547294-ab07-4e78-93a4-da05e4cf382d', 'c801d0b8-9fbd-4cbe-895f-ace021cc6ac0', '2a9e8d2c-15cb-4182-a617-a6da7693a564', '2026-04-13 16:16:46.031743');


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.teams (id, workspace_id, nombre, logo_url, created_by, created_at) VALUES ('c801d0b8-9fbd-4cbe-895f-ace021cc6ac0', '8e90587b-c9a2-449f-bc17-666fb2383167', 'Equipo Test', NULL, '2a9e8d2c-15cb-4182-a617-a6da7693a564', '2026-04-13 16:13:37.230591');


--
-- Data for Name: usage_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, password_hash, nombre, created_at, avatar_url, phone, role_title, last_seen, is_superadmin, status, last_login) VALUES ('9d3a3afb-ab16-468a-937a-c35d421d12dd', 'free@zktest.com', '$2b$10$6SZSe.Du6F6.VHYFDbADWexB42PPekC7b5WuUKOoqQE85veSaUa7.', 'Test Free', '2026-04-14 16:36:15.149427', NULL, NULL, NULL, '2026-04-14 16:36:15.149427', 'f', 'active', NULL);
INSERT INTO public.users (id, email, password_hash, nombre, created_at, avatar_url, phone, role_title, last_seen, is_superadmin, status, last_login) VALUES ('881cbb1a-839c-438c-8df2-23d8d219a9b5', 'pro@zktest.com', '$2b$10$z6bVyBUWBTfBU7B0ocEYGOCwRNXYcm/Qldm7ngW1/JJHCGGn81xc2', 'Test Pro', '2026-04-14 16:36:15.258302', NULL, NULL, NULL, '2026-04-14 16:36:15.258302', 'f', 'active', NULL);
INSERT INTO public.users (id, email, password_hash, nombre, created_at, avatar_url, phone, role_title, last_seen, is_superadmin, status, last_login) VALUES ('330afaff-ae31-4b0d-9239-6ae688941f74', 'agency@zktest.com', '$2b$10$Y5b1G7TDSJWIHxUXbyhdJeRNkouwDj6j4vwRpYuCJS838fTfAJny6', 'Test Agency', '2026-04-14 16:36:15.370256', NULL, NULL, NULL, '2026-04-14 16:36:15.370256', 'f', 'active', NULL);
INSERT INTO public.users (id, email, password_hash, nombre, created_at, avatar_url, phone, role_title, last_seen, is_superadmin, status, last_login) VALUES ('2a9e8d2c-15cb-4182-a617-a6da7693a564', 'admin@zkmarketing.es', '$2b$10$/cD3O/5CpuYp9S4ZSYIv8uhH9nLuW6uYMI1QI3BATuqiGzHRSIeU2', 'Admin ZK', '2026-04-01 13:55:02.757969', NULL, NULL, NULL, '2026-04-13 16:38:55.755', 't', 'active', '2026-05-01 13:47:58.505193');
INSERT INTO public.users (id, email, password_hash, nombre, created_at, avatar_url, phone, role_title, last_seen, is_superadmin, status, last_login) VALUES ('5f81e44d-2d50-42a1-9822-05921aabcb22', 'inmaolmo@gmail.com', '$2b$10$JKvEB90iq4rRJhItOl7zM.EoEyxri98C2PokzfVXbiguq1BXSPL2S', 'Inma Olmo', '2026-04-14 16:36:15.030311', NULL, NULL, NULL, '2026-04-14 16:36:15.030311', 't', 'active', NULL);


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: workspace_tone_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: workspace_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.workspace_users (id, workspace_id, user_id, rol, created_at) VALUES ('85d75256-bb75-4c4e-89e4-6d0b23cfad6b', '8e90587b-c9a2-449f-bc17-666fb2383167', '2a9e8d2c-15cb-4182-a617-a6da7693a564', 'owner', '2026-04-01 13:55:23.645609');
INSERT INTO public.workspace_users (id, workspace_id, user_id, rol, created_at) VALUES ('04a6da0f-94ee-4a44-adeb-3db846a19cdf', 'e2df1796-dbf3-46c2-b417-c67e58d151db', '5f81e44d-2d50-42a1-9822-05921aabcb22', 'owner', '2026-04-14 16:36:15.040138');
INSERT INTO public.workspace_users (id, workspace_id, user_id, rol, created_at) VALUES ('beadce35-5651-426a-aeb5-10945a0b1513', '159bd09d-706b-412f-b170-da7d33a4b282', '9d3a3afb-ab16-468a-937a-c35d421d12dd', 'owner', '2026-04-14 16:36:15.154989');
INSERT INTO public.workspace_users (id, workspace_id, user_id, rol, created_at) VALUES ('34f60aeb-354b-4d00-9801-dcaa9919cd7c', '712a8e9f-c620-4f95-882a-ba101297bc85', '881cbb1a-839c-438c-8df2-23d8d219a9b5', 'owner', '2026-04-14 16:36:15.264923');
INSERT INTO public.workspace_users (id, workspace_id, user_id, rol, created_at) VALUES ('9ce47e22-a829-420c-b8a4-27c5a6e11057', '21103768-bb0f-460a-93c1-4a92a4a56178', '330afaff-ae31-4b0d-9239-6ae688941f74', 'owner', '2026-04-14 16:36:15.375525');


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.workspaces (id, nombre, plan, owner_id, created_at, logo_url, accent_color, website, industry, timezone, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, parent_workspace_id, white_label, is_white_label, currency) VALUES ('8e90587b-c9a2-449f-bc17-666fb2383167', 'ZK Marketing', 'agency', '2a9e8d2c-15cb-4182-a617-a6da7693a564', '2026-04-01 13:55:19.518989', NULL, '#6366f1', NULL, NULL, 'America/Argentina/Buenos_Aires', 'active', '2026-04-15 13:55:19.518989', NULL, NULL, NULL, NULL, NULL, 'f', NULL, '{}', 'f', 'USD');
INSERT INTO public.workspaces (id, nombre, plan, owner_id, created_at, logo_url, accent_color, website, industry, timezone, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, parent_workspace_id, white_label, is_white_label, currency) VALUES ('e2df1796-dbf3-46c2-b417-c67e58d151db', 'ZK Marketing - Inma', 'agency', '5f81e44d-2d50-42a1-9822-05921aabcb22', '2026-04-14 16:36:15.036199', NULL, '#6366f1', NULL, NULL, 'America/Argentina/Buenos_Aires', 'active', '2026-04-28 16:36:15.036199', NULL, NULL, NULL, NULL, NULL, 'f', NULL, '{}', 'f', 'USD');
INSERT INTO public.workspaces (id, nombre, plan, owner_id, created_at, logo_url, accent_color, website, industry, timezone, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, parent_workspace_id, white_label, is_white_label, currency) VALUES ('159bd09d-706b-412f-b170-da7d33a4b282', 'Workspace Free', 'free', '9d3a3afb-ab16-468a-937a-c35d421d12dd', '2026-04-14 16:36:15.151595', NULL, '#6366f1', NULL, NULL, 'America/Argentina/Buenos_Aires', 'active', '2026-04-28 16:36:15.151595', NULL, NULL, NULL, NULL, NULL, 'f', NULL, '{}', 'f', 'USD');
INSERT INTO public.workspaces (id, nombre, plan, owner_id, created_at, logo_url, accent_color, website, industry, timezone, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, parent_workspace_id, white_label, is_white_label, currency) VALUES ('712a8e9f-c620-4f95-882a-ba101297bc85', 'Workspace Pro', 'pro', '881cbb1a-839c-438c-8df2-23d8d219a9b5', '2026-04-14 16:36:15.261638', NULL, '#6366f1', NULL, NULL, 'America/Argentina/Buenos_Aires', 'active', '2026-04-28 16:36:15.261638', NULL, NULL, NULL, NULL, NULL, 'f', NULL, '{}', 'f', 'USD');
INSERT INTO public.workspaces (id, nombre, plan, owner_id, created_at, logo_url, accent_color, website, industry, timezone, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end, parent_workspace_id, white_label, is_white_label, currency) VALUES ('21103768-bb0f-460a-93c1-4a92a4a56178', 'Workspace Agency', 'agency', '330afaff-ae31-4b0d-9239-6ae688941f74', '2026-04-14 16:36:15.372987', NULL, '#6366f1', NULL, NULL, 'America/Argentina/Buenos_Aires', 'active', '2026-04-28 16:36:15.372987', NULL, NULL, NULL, NULL, NULL, 'f', NULL, '{}', 'f', 'USD');


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: ad_accounts ad_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_accounts
    ADD CONSTRAINT ad_accounts_pkey PRIMARY KEY (id);


--
-- Name: ad_cache ad_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_cache
    ADD CONSTRAINT ad_cache_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: ai_generations ai_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_pkey PRIMARY KEY (id);


--
-- Name: ai_templates ai_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_templates
    ADD CONSTRAINT ai_templates_pkey PRIMARY KEY (id);


--
-- Name: automation_runs automation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_pkey PRIMARY KEY (id);


--
-- Name: automations automations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);


--
-- Name: billing_events billing_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_pkey PRIMARY KEY (id);


--
-- Name: billing_events billing_events_stripe_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_stripe_event_id_key UNIQUE (stripe_event_id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: calendar_integrations calendar_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_pkey PRIMARY KEY (id);


--
-- Name: calendar_integrations calendar_integrations_workspace_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_workspace_id_user_id_key UNIQUE (workspace_id, user_id);


--
-- Name: cobro_pagos cobro_pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobro_pagos
    ADD CONSTRAINT cobro_pagos_pkey PRIMARY KEY (id);


--
-- Name: cobros cobros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_pkey PRIMARY KEY (id);


--
-- Name: contact_folders contact_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_folders
    ADD CONSTRAINT contact_folders_pkey PRIMARY KEY (id);


--
-- Name: contact_list_members contact_list_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_pkey PRIMARY KEY (list_id, contact_id);


--
-- Name: contact_lists contact_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_lists
    ADD CONSTRAINT contact_lists_pkey PRIMARY KEY (id);


--
-- Name: contact_notes contact_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_notes
    ADD CONSTRAINT contact_notes_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: external_events external_events_google_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_events
    ADD CONSTRAINT external_events_google_event_id_user_id_key UNIQUE (google_event_id, user_id);


--
-- Name: external_events external_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_events
    ADD CONSTRAINT external_events_pkey PRIMARY KEY (id);


--
-- Name: integration_logs integration_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_workspace_tipo_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_workspace_tipo_uq UNIQUE (workspace_id, tipo);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_workspace_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_workspace_id_unique UNIQUE (user_id, workspace_id);


--
-- Name: onboarding_checklist onboarding_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklist
    ADD CONSTRAINT onboarding_checklist_pkey PRIMARY KEY (id);


--
-- Name: onboarding_checklist onboarding_checklist_workspace_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklist
    ADD CONSTRAINT onboarding_checklist_workspace_id_unique UNIQUE (workspace_id);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: plan_definitions plan_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_definitions
    ADD CONSTRAINT plan_definitions_pkey PRIMARY KEY (id);


--
-- Name: plan_definitions plan_definitions_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_definitions
    ADD CONSTRAINT plan_definitions_slug_key UNIQUE (slug);


--
-- Name: presupuesto_envios presupuesto_envios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuesto_envios
    ADD CONSTRAINT presupuesto_envios_pkey PRIMARY KEY (id);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: proposal_views proposal_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_views
    ADD CONSTRAINT proposal_views_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: sub_workspaces sub_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_workspaces
    ADD CONSTRAINT sub_workspaces_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_workspace_id_metric_period_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_workspace_id_metric_period_key UNIQUE (workspace_id, metric, period);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id);


--
-- Name: workspace_invitations workspace_invitations_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_unique UNIQUE (token);


--
-- Name: workspace_tone_profiles workspace_tone_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_tone_profiles
    ADD CONSTRAINT workspace_tone_profiles_pkey PRIMARY KEY (id);


--
-- Name: workspace_users workspace_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_users
    ADD CONSTRAINT workspace_users_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: idx_calendar_events_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_contact ON public.calendar_events USING btree (contact_id);


--
-- Name: idx_calendar_events_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_dates ON public.calendar_events USING btree (fecha_inicio, fecha_fin);


--
-- Name: idx_calendar_events_deal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_deal ON public.calendar_events USING btree (deal_id);


--
-- Name: idx_calendar_events_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_events_workspace ON public.calendar_events USING btree (workspace_id);


--
-- Name: idx_contacts_workspace_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_workspace_id ON public.contacts USING btree (workspace_id);


--
-- Name: idx_deals_stage_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_stage_id ON public.deals USING btree (stage_id);


--
-- Name: idx_deals_workspace_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_workspace_id ON public.deals USING btree (workspace_id);


--
-- Name: idx_external_events_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_external_events_dates ON public.external_events USING btree (fecha_inicio, fecha_fin);


--
-- Name: idx_external_events_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_external_events_workspace ON public.external_events USING btree (workspace_id);


--
-- Name: idx_tasks_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);


--
-- Name: idx_tasks_assignee_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_assignee_slot ON public.tasks USING btree (assignee_slot) WHERE (assignee_slot IS NOT NULL);


--
-- Name: idx_tasks_done; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_done ON public.tasks USING btree (done);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_workspace ON public.tasks USING btree (workspace_id);


--
-- Name: idx_tasks_workspace_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_workspace_id ON public.tasks USING btree (workspace_id);


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- Name: idx_teams_workspace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teams_workspace ON public.teams USING btree (workspace_id);


--
-- Name: idx_user_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_created ON public.user_notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_user_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user ON public.user_notifications USING btree (user_id, is_read);


--
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id, is_read);


--
-- Name: activity_log activity_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_log activity_log_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: ad_accounts ad_accounts_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_accounts
    ADD CONSTRAINT ad_accounts_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;


--
-- Name: ad_accounts ad_accounts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_accounts
    ADD CONSTRAINT ad_accounts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: ad_cache ad_cache_ad_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_cache
    ADD CONSTRAINT ad_cache_ad_account_id_fkey FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id) ON DELETE CASCADE;


--
-- Name: admin_audit_log admin_audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: admin_notifications admin_notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: admin_notifications admin_notifications_target_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_target_workspace_id_fkey FOREIGN KEY (target_workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: ai_generations ai_generations_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: ai_generations ai_generations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ai_generations ai_generations_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: ai_generations ai_generations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ai_templates(id) ON DELETE SET NULL;


--
-- Name: ai_generations ai_generations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: ai_templates ai_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_templates
    ADD CONSTRAINT ai_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ai_templates ai_templates_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_templates
    ADD CONSTRAINT ai_templates_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: automation_runs automation_runs_automation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE CASCADE;


--
-- Name: automation_runs automation_runs_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: automations automations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: automations automations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: billing_events billing_events_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: calendar_integrations calendar_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: calendar_integrations calendar_integrations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: cobro_pagos cobro_pagos_cobro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobro_pagos
    ADD CONSTRAINT cobro_pagos_cobro_id_fkey FOREIGN KEY (cobro_id) REFERENCES public.cobros(id) ON DELETE CASCADE;


--
-- Name: cobros cobros_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: cobros cobros_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: cobros cobros_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contact_folders contact_folders_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_folders
    ADD CONSTRAINT contact_folders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: contact_lists contact_lists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_lists
    ADD CONSTRAINT contact_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_lists contact_lists_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_lists
    ADD CONSTRAINT contact_lists_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contact_notes contact_notes_contact_id_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_notes
    ADD CONSTRAINT contact_notes_contact_id_contacts_id_fk FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_notes contact_notes_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_notes
    ADD CONSTRAINT contact_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_notes contact_notes_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_notes
    ADD CONSTRAINT contact_notes_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.contact_folders(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_contact_id_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_contact_id_contacts_id_fk FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: deals deals_contact_id_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_contact_id_contacts_id_fk FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: deals deals_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_stage_id_pipeline_stages_id_fk FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;


--
-- Name: deals deals_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: external_events external_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_events
    ADD CONSTRAINT external_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: external_events external_events_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_events
    ADD CONSTRAINT external_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: integration_logs integration_logs_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE SET NULL;


--
-- Name: integration_logs integration_logs_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: integrations integrations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: onboarding_checklist onboarding_checklist_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklist
    ADD CONSTRAINT onboarding_checklist_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: pipeline_stages pipeline_stages_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: presupuesto_envios presupuesto_envios_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuesto_envios
    ADD CONSTRAINT presupuesto_envios_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: presupuesto_envios presupuesto_envios_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuesto_envios
    ADD CONSTRAINT presupuesto_envios_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;


--
-- Name: presupuesto_envios presupuesto_envios_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuesto_envios
    ADD CONSTRAINT presupuesto_envios_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE CASCADE;


--
-- Name: presupuesto_envios presupuesto_envios_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuesto_envios
    ADD CONSTRAINT presupuesto_envios_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: presupuestos presupuestos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: proposal_views proposal_views_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_views
    ADD CONSTRAINT proposal_views_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reminders reminders_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: reminders reminders_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: sub_workspaces sub_workspaces_parent_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_workspaces
    ADD CONSTRAINT sub_workspaces_parent_workspace_id_fkey FOREIGN KEY (parent_workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: sub_workspaces sub_workspaces_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_workspaces
    ADD CONSTRAINT sub_workspaces_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: teams teams_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: webhook_events webhook_events_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;


--
-- Name: webhook_events webhook_events_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_invitations workspace_invitations_invited_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workspace_invitations workspace_invitations_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_tone_profiles workspace_tone_profiles_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_tone_profiles
    ADD CONSTRAINT workspace_tone_profiles_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_users workspace_users_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_users
    ADD CONSTRAINT workspace_users_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workspace_users workspace_users_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_users
    ADD CONSTRAINT workspace_users_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_parent_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_parent_workspace_id_fkey FOREIGN KEY (parent_workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


