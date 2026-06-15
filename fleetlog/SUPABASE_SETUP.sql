-- ============================================================
-- FleetLog — Supabase Setup
-- Cole isso no SQL Editor do Supabase e execute
-- ============================================================

-- 1. VEHICLES
create table vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null default 'car',
  name        text not null,
  year        text,
  plate       text,
  color       text,
  fuel        text,
  km          integer default 0,
  next_service integer default 10000,
  fipe_price  text,
  fipe_ref    text,
  fipe_code   text,
  photos      jsonb default '{}',
  created_at  timestamptz default now()
);

-- 2. RECORDS (manutenções, revisões, abastecimentos...)
create table records (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid references vehicles(id) on delete cascade not null,
  type        text not null default 'maintenance',
  title       text not null,
  date        date not null,
  km          integer default 0,
  cost        numeric(10,2) default 0,
  notes       text,
  parts       text,
  receipt_url text,
  created_at  timestamptz default now()
);

-- 3. TRANSFERS (transferência de histórico para novo dono)
create table transfers (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid references vehicles(id) on delete cascade not null,
  from_user_id uuid references auth.users(id) not null,
  to_email     text not null,
  token        text unique not null,
  status       text default 'pending',
  created_at   timestamptz default now()
);

-- ============================================================
-- SEGURANÇA: Row Level Security (cada user vê só os seus dados)
-- ============================================================

alter table vehicles  enable row level security;
alter table records   enable row level security;
alter table transfers enable row level security;

-- Vehicles: usuário vê só os próprios
create policy "vehicles_own" on vehicles
  for all using (auth.uid() = user_id);

-- Records: usuário vê só registros dos próprios veículos
create policy "records_own" on records
  for all using (
    vehicle_id in (select id from vehicles where user_id = auth.uid())
  );

-- Transfers: quem criou pode ver; destinatário pode resgatar pelo token
create policy "transfers_own" on transfers
  for all using (auth.uid() = from_user_id);

-- ============================================================
-- STORAGE: bucket para fotos
-- ============================================================

-- No painel do Supabase: Storage → New bucket
-- Nome: vehicle-photos
-- Public: SIM (para as imagens carregarem no app)

-- Política de storage (cole separadamente se necessário):
-- insert: auth.uid()::text = (storage.foldername(name))[1]
-- select: true (público para leitura)

