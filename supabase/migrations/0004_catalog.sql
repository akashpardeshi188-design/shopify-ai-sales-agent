-- Local cache of each store's catalog, synced from the Shopify Admin API.
-- The AI agent reads from here (plus product_embeddings) rather than calling
-- Shopify live on every chat turn.
create table collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  shopify_collection_id bigint not null,
  title text not null,
  handle text,
  created_at timestamptz not null default now(),
  unique (store_id, shopify_collection_id)
);
create index collections_store_id_idx on collections (store_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  shopify_product_id bigint not null,
  title text not null,
  description text,
  vendor text,
  product_type text,
  tags text[] not null default '{}',
  status text not null default 'active',
  handle text,
  image_url text,
  price_min numeric(10, 2),
  price_max numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, shopify_product_id)
);
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create index products_store_id_idx on products (store_id);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  shopify_variant_id bigint not null,
  title text,
  sku text,
  price numeric(10, 2),
  compare_at_price numeric(10, 2),
  inventory_quantity integer,
  available boolean not null default true,
  unique (product_id, shopify_variant_id)
);
create index product_variants_product_id_idx on product_variants (product_id);

create table product_collections (
  product_id uuid not null references products (id) on delete cascade,
  collection_id uuid not null references collections (id) on delete cascade,
  primary key (product_id, collection_id)
);

-- Vector embeddings of product title/description/tags, used by the sales agent
-- for retrieval-augmented product recommendations.
create table product_embeddings (
  product_id uuid primary key references products (id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);
create index product_embeddings_embedding_idx
  on product_embeddings using hnsw (embedding vector_cosine_ops);
