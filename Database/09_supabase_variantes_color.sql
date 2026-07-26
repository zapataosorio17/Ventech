-- Ventech - variantes de color e imágenes por producto (Supabase/PostgreSQL)
alter table public.products
  add column if not exists color_variants jsonb not null default '[]'::jsonb;

alter table public.products
  drop constraint if exists products_color_variants_array;
alter table public.products
  add constraint products_color_variants_array
  check (jsonb_typeof(color_variants) = 'array');

comment on column public.products.color_variants is
  'Arreglo JSON: [{"color":"Negro","stock":5,"images":["https://..."]}]';