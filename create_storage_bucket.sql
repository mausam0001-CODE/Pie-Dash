-- Create the 'media' bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Set up RLS policies for the 'media' bucket
-- Allow public access to view media
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'media' );

-- Allow authenticated users to upload media
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'media' 
  and auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete their own media
create policy "Authenticated Owner Update"
on storage.objects for update
using ( 
  bucket_id = 'media' 
  and auth.role() = 'authenticated'
);

create policy "Authenticated Owner Delete"
on storage.objects for delete
using ( 
  bucket_id = 'media' 
  and auth.role() = 'authenticated'
);
