-- A single chat session between an anonymous storefront visitor (or a merchant
-- testing in the playground) and the AI agent.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  visitor_id text not null, -- anonymous id generated client-side and persisted in a cookie/localStorage on the storefront
  customer_email text,
  channel text not null default 'storefront_widget' check (channel in ('storefront_widget', 'playground')),
  status text not null default 'open' check (status in ('open', 'closed', 'escalated')),
  ai_resolved boolean,
  satisfaction_rating smallint check (satisfaction_rating between 1 and 5),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index conversations_store_id_idx on conversations (store_id);
create index conversations_visitor_id_idx on conversations (visitor_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer,
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on messages (conversation_id);

-- Discrete agent actions worth tracking for analytics/attribution.
create table conversation_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  event_type text not null check (event_type in ('product_recommended', 'discount_offered', 'checkout_link_sent', 'escalated_to_human')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index conversation_events_conversation_id_idx on conversation_events (conversation_id);

alter table orders add constraint orders_attributed_conversation_id_fkey
  foreign key (attributed_conversation_id) references conversations (id) on delete set null;
