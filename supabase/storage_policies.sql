-- Storage policies for bucket supplement-images

-- Allow authenticated users to read their own files
create policy "read_own_supplement_images" on storage.objects
for select to authenticated
using (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload into their own folder
create policy "insert_own_supplement_images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "delete_own_supplement_images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
