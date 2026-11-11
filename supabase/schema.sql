create extension if not exists pgcrypto;

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null unique check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  password_hash text not null,
  role text not null default 'admin' check (role in ('admin', 'consultant', 'editor', 'farmer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text check (char_length(phone) <= 30),
  organization text check (char_length(organization) <= 150),
  service text check (char_length(service) <= 150),
  location text check (char_length(location) <= 200),
  challenge text not null check (char_length(challenge) between 1 and 5000),
  consultation_method text not null check (consultation_method in ('Physical farm visit', 'Online consultation', 'Telephone consultation', 'Office appointment')),
  status text not null default 'Pending' check (status in ('Pending', 'Under Review', 'Approved', 'In Progress', 'Completed', 'Rejected')),
  assigned_to uuid references public.staff_users(id) on delete set null,
  internal_notes text check (char_length(internal_notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists consultations_status_created_idx on public.consultations(status, created_at desc);

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text check (char_length(phone) <= 30),
  organization text check (char_length(organization) <= 150),
  subject text check (char_length(subject) <= 180),
  type text not null default 'enquiry' check (char_length(type) <= 40),
  service text check (char_length(service) <= 150),
  location text check (char_length(location) <= 200),
  consultation_method text check (char_length(consultation_method) <= 50),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'New' check (status in ('New', 'In Progress', 'Resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_enquiries_created_idx on public.contact_enquiries(created_at desc);

create table if not exists public.training_programmes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text not null check (char_length(description) between 1 and 5000),
  objectives jsonb not null default '[]'::jsonb,
  target_participants text check (char_length(target_participants) <= 500),
  category text check (char_length(category) <= 100),
  schedule text check (char_length(schedule) <= 200),
  location text check (char_length(location) <= 200),
  resources jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_programmes_published_created_idx on public.training_programmes(published, created_at desc);

create table if not exists public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.training_programmes(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text not null check (char_length(phone) between 1 and 30),
  location text check (char_length(location) <= 200),
  status text not null default 'Received' check (status in ('Received', 'Contacted', 'Confirmed', 'Declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(programme_id, email)
);

create table if not exists public.job_vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text not null check (char_length(description) between 1 and 8000),
  category text check (char_length(category) <= 100),
  qualifications text check (char_length(qualifications) <= 3000),
  experience text check (char_length(experience) <= 500),
  location text check (char_length(location) <= 200),
  deadline timestamptz,
  published boolean not null default false,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_vacancies_public_idx on public.job_vacancies(published, status, deadline);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.job_vacancies(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text not null check (char_length(phone) between 1 and 30),
  cover_letter text check (char_length(cover_letter) <= 5000),
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'Received' check (status in ('Received', 'Under Review', 'Shortlisted', 'Rejected', 'Hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_applications_vacancy_created_idx on public.job_applications(vacancy_id, created_at desc);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null unique check (char_length(slug) between 1 and 220),
  excerpt text check (char_length(excerpt) <= 500),
  body text not null check (char_length(body) <= 30000),
  category text check (char_length(category) <= 100),
  author text check (char_length(author) <= 120),
  image text check (char_length(image) <= 1000),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_public_idx on public.blog_posts(published, published_at desc);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text not null check (char_length(description) between 1 and 5000),
  location text check (char_length(location) <= 200),
  category text check (char_length(category) <= 100),
  objectives jsonb not null default '[]'::jsonb,
  outcomes text check (char_length(outcomes) <= 3000),
  images jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_public_idx on public.projects(published, verified, created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.staff_users(id) on delete set null,
  action text not null check (char_length(action) <= 160),
  resource text check (char_length(resource) <= 100),
  resource_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

create table if not exists public.api_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_requests integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  insert into public.api_rate_limits as limits (bucket, window_started_at, request_count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
  set window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else limits.request_count + 1
      end
  returning request_count into current_count;
  return current_count <= p_max_requests;
end;
$$;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

alter table public.staff_users enable row level security;
alter table public.consultations enable row level security;
alter table public.contact_enquiries enable row level security;
alter table public.training_programmes enable row level security;
alter table public.training_registrations enable row level security;
alter table public.job_vacancies enable row level security;
alter table public.job_applications enable row level security;
alter table public.blog_posts enable row level security;
alter table public.projects enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.activity_logs enable row level security;
alter table public.api_rate_limits enable row level security;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applications',
  'applications',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
