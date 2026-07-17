-- A connected Shopify store. Auth model is the custom-app Admin API access token
-- (merchant generates it in their own Shopify admin and pastes it in) rather than
-- public OAuth, so there is no installation/session table here.
create table stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  shop_domain text not null unique, -- e.g. my-shop.myshopify.com
  store_name text,
  access_token text not null, -- encrypt at rest at the application layer before insert; never expose to the client
  scopes text,
  webhook_secret text, -- per-store webhook signing secret, set when the merchant configures webhooks on their custom app
  currency text,
  timezone text,
  shopify_plan_name text,
  widget_public_key text not null unique default encode(extensions.gen_random_bytes(24), 'hex'), -- safe to expose; identifies the store to the public widget API
  status text not null default 'active' check (status in ('active', 'disconnected', 'error')),
  last_synced_at timestamptz,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger stores_set_updated_at before update on stores
  for each row execute function set_updated_at();
create index stores_organization_id_idx on stores (organization_id);

create table store_sync_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  sync_type text not null check (sync_type in ('products', 'orders', 'customers', 'collections', 'full')),
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  records_synced integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index store_sync_logs_store_id_idx on store_sync_logs (store_id);
