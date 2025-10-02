-- Enable extensions add manually in dashboard
-- if error find which namespace it locate cause user only read in public
create extension if not exists pg_net with schema extensions;
create extension if not exists vector with schema extensions;
CREATE TYPE section_type AS ENUM ('heading', 'text', 'page');
-- Documents table
create table documents (
  id bigint primary key generated always as identity,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  title TEXT,
  description TEXT,
  storage_object_id uuid not null references storage.objects (id) on delete cascade,
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamp with time zone not null default now(),
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      title || ' ' || coalesce(description, '')
    )
  ) STORED
);
CREATE INDEX documents_fts_idx ON public.documents USING GIN (fts);
-- Table to store individual searchable sections of a document.
CREATE TABLE document_sections (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type section_type NOT NULL,
  -- 'heading' or 'text'
  content TEXT NOT NULL,
  -- The slug-like ID from your JSON, used for URL fragments (#)
  anchor_id TEXT NOT NULL,
  -- The generated tsvector column for full-text search.
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);
-- Create a GIN index on the 'fts' column for fast searching.
CREATE INDEX document_sections_fts_idx ON public.document_sections USING GIN (fts);
-- Document sections table with ON DELETE CASCADE
create table document_embeddings (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id) on delete cascade,
  content text not null,
  embedding extensions.vector(768)
);
-- Index for vector search
create index on document_embeddings using hnsw (embedding extensions.vector_ip_ops);
-- Documents view
create view documents_with_storage_path with (security_invoker = true) as
select documents.id,
  documents.name,
  documents.created_at,
  storage.objects.name as storage_object_path,
  storage.objects.updated_at as updated_at
from documents
  join storage.objects on storage.objects.id = documents.storage_object_id
order by storage.objects.updated_at desc
limit 10 

-- Enable RLS
alter table documents enable row level security;
alter table document_embeddings enable row level security;
alter table document_sections enable row level security;
-- Policies for documents
create policy "Users can insert documents" on documents for
insert to authenticated with check (auth.uid() = created_by);
create policy "Users can query their own documents" on documents for
select to authenticated using (auth.uid() = created_by);
CREATE POLICY "Users can update their own document" ON documents FOR
UPDATE TO authenticated USING (auth.uid() = created_by) -- This allows users to find their own rows
  WITH CHECK (auth.uid() = created_by);
-- This ensures the ownership doesn't change
-- Policies for document_sections
create policy "Users can insert document sections" on document_sections for
insert to authenticated with check (
    document_id in (
      select id
      from documents
      where created_by = auth.uid()
    )
  );
create policy "Users can update their own document sections" on document_sections for
update to authenticated using (
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
create policy "Users can query their own document sections" on document_sections for
select to authenticated using (
    document_id in (
      select id
      from documents
      where created_by = auth.uid()
    )
  );
-- Policies for document_embeddings
create policy "Users can insert document embedding" on document_embeddings for
insert to authenticated with check (
    document_id in (
      select id
      from documents
      where created_by = auth.uid()
    )
  );
create policy "Users can update their own document embedding" on document_embeddings for
update to authenticated using (
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
create policy "Users can query their own document embedding" on document_embeddings for
select to authenticated using (
    document_id in (
      select id
      from documents
      where created_by = auth.uid()
    )
  );
-- Function to fetch supabase_url from vault
create function supabase_url() returns text language plpgsql security definer as $$
declare secret_value text;
begin
select decrypted_secret into secret_value
from vault.decrypted_secrets
where name = 'supabase_url';
return secret_value;
end;
$$;
-- [2] Trigger function for storage uploads
create function private.handle_storage_update() returns trigger language plpgsql as $$
declare document_id bigint;
result int;
begin
insert into documents (name, storage_object_id, created_by)
values (new.name, new.id, new.owner)
returning id into document_id;
select net.http_post(
    url := supabase_url() || '/functions/v1/process',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'Authorization',
      current_setting('request.headers')::json->>'authorization'
    ),
    body := jsonb_build_object('document_id', document_id)
  ) into result;
return null;
end;
$$;
CREATE OR REPLACE FUNCTION search_documents(search_term TEXT) RETURNS TABLE (
    id BIGINT,
    url TEXT,
    type TEXT,
    content TEXT,
    "contentWithHighlights" TEXT,
    -- Use quotes to preserve camelCase
    rank REAL
  ) LANGUAGE plpgsql AS $$
DECLARE 
  -- Replace spaces with ' & ' and append ':*' to the last word for prefix matching
  -- e.g., 'hello world' becomes 'hello' & 'world:*'
  formatted_search_term TEXT := regexp_replace(trim(search_term), '\s+', ' & ', 'g') || ':*';
  query TSQUERY := to_tsquery('english', formatted_search_term);
BEGIN RETURN QUERY -- Use a subquery to combine and then order the final results
SELECT *
FROM (
    -- Query 1: Search document sections (headings and text)
    SELECT ds.id,
      d.url || '#' || ds.anchor_id,
      ds.type::TEXT,
      ds.content,
      ts_headline(
        'english',
        ds.content,
        query,
        'StartSel=<mark>, StopSel=</mark>'
      ),
      ts_rank(ds.fts, query)
    FROM public.document_sections AS ds
      JOIN public.documents AS d ON ds.document_id = d.id
    WHERE ds.fts @@ query
    UNION ALL
    -- Query 2: Search document titles and descriptions
    SELECT d.id,
      d.url AS url,
      'page'::TEXT AS type,
      d.title AS content,
      ts_headline(
        'english',
        d.title,
        query,
        'StartSel=<mark>, StopSel=</mark>'
      ) AS "contentWithHighlights",
      (ts_rank(d.fts, query) * 1.5)::real AS rank
    FROM public.documents AS d
    WHERE d.fts @@ query
  ) AS combined_results(
    id,
    url,
    type,
    content,
    "contentWithHighlights",
    rank
  )
ORDER BY rank DESC
LIMIT 20;
END;
$$;
create trigger on_file_upload
after
insert on storage.objects for each row
  when (new.bucket_id = 'files') execute procedure private.handle_storage_update();