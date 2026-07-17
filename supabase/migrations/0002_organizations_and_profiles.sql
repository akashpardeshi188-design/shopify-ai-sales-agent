-- Tenant account. One organization can own multiple Shopify stores.
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stripe_customer_id text unique,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'growth', 'pro')),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();

-- Mirrors auth.users for the columns the app actually needs to join against/display.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Keeps profiles in sync with auth.users automatically on signup.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (organization_id, user_id)
);
create index organization_members_user_id_idx on organization_members (user_id);
create index organization_members_org_id_idx on organization_members (organization_id);

-- Creates an organization and its first owner membership atomically. Direct inserts into
-- `organizations` are not exposed to clients (see RLS migration) precisely because a lone
-- org row with no membership row would be permanently unreadable under RLS.
create or replace function create_organization_with_owner(org_name text, org_slug text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  insert into organizations (name, slug) values (org_name, org_slug)
    returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role, joined_at)
    values (new_org_id, auth.uid(), 'owner', now());

  return new_org_id;
end;
$$;
