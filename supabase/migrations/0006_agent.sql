-- Per-store configuration for the AI sales agent (persona, behavior, widget appearance).
create table agent_configs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores (id) on delete cascade,
  display_name text not null default 'Store Assistant',
  system_prompt text not null default 'You are a helpful, friendly sales assistant for this Shopify store. Help customers find products, answer questions, and encourage them to complete their purchase.',
  tone text not null default 'friendly' check (tone in ('friendly', 'professional', 'playful', 'concise')),
  welcome_message text not null default 'Hi! How can I help you find the right product today?',
  model text not null default 'gpt-5.4-mini',
  temperature numeric(3, 2) not null default 0.70,
  escalation_email text,
  theme jsonb not null default '{}', -- widget colors/position/avatar, rendered by the embeddable widget
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agent_configs_set_updated_at before update on agent_configs
  for each row execute function set_updated_at();

-- Merchant-authored knowledge (FAQs, shipping/return policy, etc.) the agent can
-- retrieve from in addition to the product catalog.
create table agent_knowledge (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  question text not null,
  answer text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agent_knowledge_set_updated_at before update on agent_knowledge
  for each row execute function set_updated_at();
create index agent_knowledge_store_id_idx on agent_knowledge (store_id);
create index agent_knowledge_embedding_idx
  on agent_knowledge using hnsw (embedding vector_cosine_ops);
