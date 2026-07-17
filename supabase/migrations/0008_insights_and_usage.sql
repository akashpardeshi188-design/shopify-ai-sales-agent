-- AI-generated merchant-facing insights (weekly summaries, trends, recommendations)
-- shown on the dashboard.
create table insights (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  type text not null check (type in ('weekly_summary', 'trend', 'recommendation', 'anomaly')),
  title text not null,
  content text not null,
  data jsonb not null default '{}',
  period_start date,
  period_end date,
  generated_at timestamptz not null default now()
);
create index insights_store_id_idx on insights (store_id);

-- Usage rollups for plan-limit enforcement and (eventually) Stripe metered billing.
create table usage_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  store_id uuid references stores (id) on delete cascade,
  metric text not null check (metric in ('agent_messages', 'insights_generated', 'tokens')),
  quantity integer not null default 1,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);
create index usage_records_org_period_idx on usage_records (organization_id, period_start, period_end);
