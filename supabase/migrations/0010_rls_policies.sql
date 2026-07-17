-- Helper functions (security definer: they need to read tables that RLS would
-- otherwise block the calling user from reading directly, e.g. organization_members).

create or replace function is_org_member(org_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function org_id_for_store(p_store_id uuid)
returns uuid
language sql security definer set search_path = public stable
as $$
  select organization_id from stores where id = p_store_id;
$$;

create or replace function org_id_for_product(p_product_id uuid)
returns uuid
language sql security definer set search_path = public stable
as $$
  select s.organization_id
  from products p
  join stores s on s.id = p.store_id
  where p.id = p_product_id;
$$;

create or replace function org_id_for_conversation(p_conversation_id uuid)
returns uuid
language sql security definer set search_path = public stable
as $$
  select s.organization_id
  from conversations c
  join stores s on s.id = c.store_id
  where c.id = p_conversation_id;
$$;

-- Enable RLS everywhere.
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table stores enable row level security;
alter table store_sync_logs enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_collections enable row level security;
alter table product_embeddings enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table agent_configs enable row level security;
alter table agent_knowledge enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table conversation_events enable row level security;
alter table insights enable row level security;
alter table usage_records enable row level security;
alter table subscriptions enable row level security;
alter table webhook_events enable row level security;

-- profiles: a user can only see/edit their own profile.
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- organizations: members can read; admins/owners can update. No client-facing insert
-- policy — creation goes through create_organization_with_owner() only (see 0002),
-- which is security definer and bypasses RLS internally.
create policy "organizations_select_member" on organizations for select using (is_org_member(id));
create policy "organizations_update_admin" on organizations for update using (is_org_admin(id));

-- organization_members: members can see fellow members; admins manage membership.
create policy "org_members_select" on organization_members for select using (is_org_member(organization_id));
create policy "org_members_insert_admin" on organization_members for insert with check (is_org_admin(organization_id));
create policy "org_members_update_admin" on organization_members for update using (is_org_admin(organization_id));
create policy "org_members_delete_admin" on organization_members for delete using (is_org_admin(organization_id));

-- stores: members read; admins/owners manage the connection.
create policy "stores_select" on stores for select using (is_org_member(organization_id));
create policy "stores_insert_admin" on stores for insert with check (is_org_admin(organization_id));
create policy "stores_update_admin" on stores for update using (is_org_admin(organization_id));
create policy "stores_delete_admin" on stores for delete using (is_org_admin(organization_id));

create policy "store_sync_logs_select" on store_sync_logs for select
  using (is_org_member(org_id_for_store(store_id)));

create policy "collections_select" on collections for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "products_select" on products for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "product_variants_select" on product_variants for select
  using (is_org_member(org_id_for_product(product_id)));
create policy "product_collections_select" on product_collections for select
  using (is_org_member(org_id_for_product(product_id)));
create policy "product_embeddings_select" on product_embeddings for select
  using (is_org_member(org_id_for_product(product_id)));

create policy "customers_select" on customers for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "orders_select" on orders for select
  using (is_org_member(org_id_for_store(store_id)));

create policy "agent_configs_select" on agent_configs for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "agent_configs_insert_admin" on agent_configs for insert
  with check (is_org_admin(org_id_for_store(store_id)));
create policy "agent_configs_update_admin" on agent_configs for update
  using (is_org_admin(org_id_for_store(store_id)));

create policy "agent_knowledge_select" on agent_knowledge for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "agent_knowledge_write_admin" on agent_knowledge for all
  using (is_org_admin(org_id_for_store(store_id)));

create policy "conversations_select" on conversations for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "messages_select" on messages for select
  using (is_org_member(org_id_for_conversation(conversation_id)));
create policy "conversation_events_select" on conversation_events for select
  using (is_org_member(org_id_for_conversation(conversation_id)));

create policy "insights_select" on insights for select
  using (is_org_member(org_id_for_store(store_id)));
create policy "usage_records_select" on usage_records for select
  using (is_org_member(organization_id));
create policy "subscriptions_select" on subscriptions for select
  using (is_org_member(organization_id));

-- No policies are defined granting clients insert/update/delete on synced or
-- system-generated data (products, variants, customers, orders, conversations,
-- messages, insights, usage_records, webhook_events, etc.). Those rows are only
-- ever written by trusted server code (sync jobs, webhook handlers, the chat API)
-- using the Supabase service-role key, which bypasses RLS by design — so no
-- policy is needed or wanted for those write paths.
