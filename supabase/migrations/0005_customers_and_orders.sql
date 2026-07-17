create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  shopify_customer_id bigint not null,
  email text,
  first_name text,
  last_name text,
  total_spent numeric(10, 2) not null default 0,
  orders_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, shopify_customer_id)
);
create index customers_store_id_idx on customers (store_id);
create index customers_email_idx on customers (email);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  shopify_order_id bigint not null,
  order_number text,
  total_price numeric(10, 2),
  currency text,
  financial_status text,
  fulfillment_status text,
  line_items jsonb not null default '[]',
  attributed_conversation_id uuid, -- FK added in 0007 once `conversations` exists; set when the order originated from an agent chat
  created_at timestamptz not null default now(),
  unique (store_id, shopify_order_id)
);
create index orders_store_id_idx on orders (store_id);
create index orders_customer_id_idx on orders (customer_id);
create index orders_attributed_conversation_id_idx on orders (attributed_conversation_id);
