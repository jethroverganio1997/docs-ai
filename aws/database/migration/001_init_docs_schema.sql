create extension if not exists vector;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'section_type'
  ) then
    create type section_type as enum ('heading', 'text', 'page');
  end if;
end
$$;

create table if not exists documents (
  id bigint primary key generated always as identity,
  name varchar(255) not null,
  storage_key text not null unique,
  bucket_name text,
  url text not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index if not exists documents_fts_idx on documents using gin (fts);
create index if not exists documents_storage_key_idx on documents (storage_key);

create table if not exists document_sections (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id) on delete cascade,
  type section_type not null,
  content text not null,
  anchor_id text not null,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(content, ''))
  ) stored
);

create index if not exists document_sections_document_idx on document_sections (document_id);
create index if not exists document_sections_fts_idx on document_sections using gin (fts);

create table if not exists document_embeddings (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id) on delete cascade,
  content text not null,
  embedding vector(768)
);

create index if not exists document_embeddings_document_idx on document_embeddings (document_id);
create index if not exists document_embeddings_hnsw_idx
  on document_embeddings using hnsw (embedding vector_cosine_ops);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on documents;
create trigger documents_set_updated_at
before update on documents
for each row
execute function set_updated_at();

create or replace function search_documents(search_term text)
returns table (
  id bigint,
  url text,
  type text,
  content text,
  "contentWithHighlights" text,
  rank real
)
language plpgsql
as $$
declare
  normalized_term text := trim(search_term);
  query tsquery;
begin
  if normalized_term = '' then
    return;
  end if;

  query := websearch_to_tsquery('english', normalized_term);

  return query
  select *
  from (
    select
      ds.id,
      d.url || case when ds.anchor_id <> '' then '#' || ds.anchor_id else '' end as url,
      ds.type::text,
      ds.content,
      ts_headline(
        'english',
        ds.content,
        query,
        'StartSel=<mark>, StopSel=</mark>'
      ) as "contentWithHighlights",
      ts_rank(ds.fts, query)::real as rank
    from document_sections ds
    join documents d on d.id = ds.document_id
    where ds.fts @@ query

    union all

    select
      d.id,
      d.url,
      'page'::text as type,
      d.title as content,
      ts_headline(
        'english',
        d.title,
        query,
        'StartSel=<mark>, StopSel=</mark>'
      ) as "contentWithHighlights",
      (ts_rank(d.fts, query) * 1.5)::real as rank
    from documents d
    where d.fts @@ query
  ) as combined_results (
    id,
    url,
    type,
    content,
    "contentWithHighlights",
    rank
  )
  order by rank desc
  limit 20;
end;
$$;

create or replace function match_document_embeddings(
  query_embedding vector(768),
  match_threshold double precision default 0.4,
  match_count integer default 5
)
returns table (
  content text,
  url text,
  similarity double precision
)
language sql
as $$
  select
    de.content,
    d.url,
    1 - (de.embedding <=> query_embedding) as similarity
  from document_embeddings de
  join documents d on d.id = de.document_id
  where 1 - (de.embedding <=> query_embedding) >= match_threshold
  order by de.embedding <=> query_embedding asc
  limit match_count;
$$;
