-- Run this in Supabase SQL Editor

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  username text unique,
  phone_number text,
  role text default 'PATIENT' check (role in ('ADMIN', 'PATIENT', 'DENTIST')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, username, phone_number, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone_number',
    coalesce(new.raw_user_meta_data->>'role', 'PATIENT')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Patients
create table patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  full_name text not null,
  email text,
  phone text,
  gender text,
  date_of_birth date,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at timestamptz default now()
);

-- Dentists
create table dentists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  full_name text not null,
  email text,
  phone text,
  specialization text,
  license_number text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  created_at timestamptz default now()
);

-- Services
create table services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2),
  duration_minutes int,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Appointments
create table appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id),
  dentist_id uuid references dentists(id),
  service_id uuid references services(id),
  appointment_date date not null,
  appointment_time time not null,
  reason text,
  status text default 'PENDING' check (status in ('PENDING','CONFIRMED','COMPLETED','CANCELLED')),
  notes text,
  created_at timestamptz default now()
);

-- Treatments
create table treatments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id),
  dentist_id uuid references dentists(id),
  service_id uuid references services(id),
  appointment_id uuid references appointments(id),
  diagnosis text,
  treatment_notes text,
  treatment_date date,
  created_at timestamptz default now()
);

-- Payments
create table payments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id),
  appointment_id uuid references appointments(id),
  amount numeric(10,2),
  payment_date date,
  payment_method text default 'CASH' check (payment_method in ('CASH','GCASH','BANK_TRANSFER','OTHER')),
  payment_status text default 'PENDING' check (payment_status in ('PENDING','PAID','CANCELLED')),
  reference_number text,
  notes text,
  created_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users,
  receiver_id uuid references auth.users,
  subject text,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Activity Logs
create table activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  action text,
  description text,
  ip_address text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table patients enable row level security;
alter table dentists enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table treatments enable row level security;
alter table payments enable row level security;
alter table messages enable row level security;
alter table activity_logs enable row level security;

-- RLS Policies (allow authenticated users full access for now)
create policy "Allow authenticated" on profiles for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on patients for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on dentists for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on services for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on appointments for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on treatments for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on payments for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on messages for all using (auth.role() = 'authenticated');
create policy "Allow authenticated" on activity_logs for all using (auth.role() = 'authenticated');
