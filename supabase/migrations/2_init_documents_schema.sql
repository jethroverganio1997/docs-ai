-- Enable extensions add manually in dashboard
-- if error find which namespace it locate cause user only read in public
create extension if not exists pg_net with schema extensions;
create extension if not exists vector with schema extensions;

-- Documents table
create table documents (
  id bigint primary key generated always as identity,
  name text not null,
  storage_object_id uuid not null references storage.objects (id) on delete cascade,
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamp with time zone not null default now()
);

-- Documents view
create view documents_with_storage_path
with (security_invoker=true)
as
  select documents.*, storage.objects.name as storage_object_path
  from documents
  join storage.objects
    on storage.objects.id = documents.storage_object_id;

-- Document sections table with ON DELETE CASCADE
create table document_sections (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id) on delete cascade,
  content text not null,
  embedding extensions.vector(768)
);

-- Index for vector search
create index on document_sections using hnsw (embedding extensions.vector_ip_ops);

-- Enable RLS
alter table documents enable row level security;
alter table document_sections enable row level security;

-- Policies for documents
create policy "Users can insert documents"
on documents for insert to authenticated with check (
  auth.uid() = created_by
);

create policy "Users can query their own documents"
on documents for select to authenticated using (
  auth.uid() = created_by
);


-- Policies for document_sections
create policy "Users can insert document sections"
on document_sections for insert to authenticated with check (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can update their own document sections"
on document_sections for update to authenticated using (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
) with check (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can query their own document sections"
on document_sections for select to authenticated using (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

-- Function to fetch supabase_url from vault
create function supabase_url()
returns text
language plpgsql
security definer
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value from vault.decrypted_secrets where name = 'supabase_url';
  return secret_value;
end;
$$;

-- [2] Trigger function for storage uploads
create function private.handle_storage_update() 
returns trigger 
language plpgsql
as $$
declare
  document_id bigint;
  result int;
begin
  insert into documents (name, storage_object_id, created_by)
    values (new.path_tokens[3], new.id, new.owner)
    returning id into document_id;

  -- select
  --   net.http_post(
  --     url := supabase_url() || '/functions/v1/process',
  --     headers := jsonb_build_object(
  --       'Content-Type', 'application/json',
  --       'Authorization', current_setting('request.headers')::json->>'authorization'
  --     ),
  --     body := jsonb_build_object(
  --       'document_id', document_id
  --     )
  --   )
  -- into result;

  return null;
end;
$$;

-- [1] Trigger to call function after file upload
create trigger on_file_upload
  after insert on storage.objects
  for each row
  execute procedure private.handle_storage_update();
