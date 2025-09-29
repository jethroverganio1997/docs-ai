-- First, remove the existing blog-images bucket if it exists
do $$
begin
  if exists (
    select 1 from storage.buckets where id = 'media'
  ) then
    -- Delete all objects in bucket first
    delete from storage.objects where bucket_id = 'media';
    -- Then delete bucket
    delete from storage.buckets where id = 'media';
  end if;
end $$;

-- Create storage bucket for media
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'media',
  'media',
  true, -- public bucket can see images
  10000000, -- 10MB limit
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
);

-- Policy: Public can view media
create policy "Public can view media"
on storage.objects for select
using (bucket_id = 'media');

create policy "Authenticated users can upload media"
on storage.objects for insert to authenticated with check (
  bucket_id = 'media' and owner = auth.uid() 
);

create policy "Users can update their own media"
on storage.objects for update to authenticated with check (
  bucket_id = 'media' and owner = auth.uid()
);

create policy "Users can delete their own media"
on storage.objects for delete to authenticated using (
  bucket_id = 'media' and owner = auth.uid()
);


create or replace function get_media_by_user(user_id uuid)
returns table (
    id uuid,
    name text,
    created_at timestamptz
)
language sql
as $$
    select id, name, created_at
    from storage.objects       -- fully qualified schema.table
    where bucket_id = 'media' and owner = user_id
    order by created_at desc;
$$;
