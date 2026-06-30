-- PhotoPewPew schema: shoots, photos, photo_edits, RLS, unlock RPC, storage bucket.
-- Run once in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table shoots (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  client_name text not null,
  passcode text not null,
  admin_email text not null,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references shoots (id) on delete cascade,
  storage_path text not null,
  width int not null,
  height int not null,
  sort_order int not null default 0,
  original_filename text not null
);

create table photo_edits (
  photo_id uuid primary key references photos (id) on delete cascade,
  crop_x double precision not null default 0,
  crop_y double precision not null default 0,
  crop_w double precision not null default 1,
  crop_h double precision not null default 1,
  rotation int not null default 0,
  is_favorite boolean not null default false
);

alter table shoots enable row level security;
alter table photos enable row level security;
alter table photo_edits enable row level security;

-- Admin (the single authenticated user) has full access to manage shoots/photos.
create policy "admin full access to shoots" on shoots
  for all to authenticated using (true) with check (true);

create policy "admin full access to photos" on photos
  for all to authenticated using (true) with check (true);

-- Clients (anon) can read/write edits freely; this is low-stakes metadata,
-- not a security boundary. They never query shoots/photos directly.
create policy "anyone can read photo_edits" on photo_edits
  for select to anon, authenticated using (true);

create policy "anyone can upsert photo_edits" on photo_edits
  for insert to anon, authenticated with check (true);

create policy "anyone can update photo_edits" on photo_edits
  for update to anon, authenticated using (true) with check (true);

-- RPC: the only way the static client app reads shoot/photo data.
-- SECURITY DEFINER bypasses RLS internally; only returns data if the passcode matches.
create or replace function unlock_shoot(p_slug text, p_passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shoot shoots;
  v_result jsonb;
begin
  select * into v_shoot from shoots where slug = p_slug and passcode = p_passcode;

  if v_shoot.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'shoot', jsonb_build_object(
      'id', v_shoot.id,
      'slug', v_shoot.slug,
      'client_name', v_shoot.client_name,
      'admin_email', v_shoot.admin_email
    ),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'storage_path', p.storage_path,
        'width', p.width,
        'height', p.height,
        'sort_order', p.sort_order,
        'original_filename', p.original_filename,
        'edit', (
          select jsonb_build_object(
            'crop_x', pe.crop_x, 'crop_y', pe.crop_y,
            'crop_w', pe.crop_w, 'crop_h', pe.crop_h,
            'rotation', pe.rotation, 'is_favorite', pe.is_favorite
          )
          from photo_edits pe where pe.photo_id = p.id
        )
      ) order by p.sort_order)
      from photos p
      where p.shoot_id = v_shoot.id
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function unlock_shoot(text, text) to anon, authenticated;

-- Storage: compressed photos only, public read, admin-only write.
insert into storage.buckets (id, name, public)
values ('shoot-photos', 'shoot-photos', true)
on conflict (id) do nothing;

create policy "public read shoot-photos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'shoot-photos');

create policy "admin write shoot-photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'shoot-photos')
  with check (bucket_id = 'shoot-photos');
