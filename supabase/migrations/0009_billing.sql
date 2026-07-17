create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();
create index subscriptions_organization_id_idx on subscriptions (organization_id);

-- Raw inbound webhook log, shared by both providers, keyed for idempotent processing.
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('shopify', 'stripe')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  unique (source, event_id)
);
