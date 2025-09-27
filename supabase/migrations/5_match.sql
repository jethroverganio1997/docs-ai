-- Matches document embeddings using vector similarity search on embeddings
--
-- Returns a setof document_embeddings so that we can use PostgREST resource embeddings (joins with other tables)
-- Additional filtering like limits can be chained to this function call
-- 768
-- create or replace function match_document_embeddings(
--   query_embedding extensions.vector(768), 
--   match_threshold float, 
--   match_count int default 10
-- )
-- returns setof document_embeddings
-- language plpgsql
-- as $$
-- #variable_conflict use_variable
-- begin
--   return query
--   select *
--   from document_embeddings
--   where 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
--   order by document_embeddings.embedding <=> query_embedding asc
--   limit match_count;
-- end;
-- $$;

create or replace function match_document_embeddings(
  query_embedding extensions.vector(768), 
  match_threshold float, 
  match_count int default 10
)
returns setof document_embeddings
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from document_embeddings
  where document_embeddings.embedding <#> query_embedding < -match_threshold
  order by document_embeddings.embedding <#> query_embedding asc
  limit match_count;
end;
$$;