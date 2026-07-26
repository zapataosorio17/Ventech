-- Ventech - inventario administrado exclusivamente por variante de color.
-- Ejecutar una sola vez en Supabase > SQL Editor.

-- Conserva products.stock como total derivado para mantener compatibles
-- el catálogo, los filtros y los reportes existentes.
create or replace function public.valid_color_variants(variants jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(coalesce(variants, '[]'::jsonb)) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(variants, '[]'::jsonb)) as variant
      where jsonb_typeof(variant) <> 'object'
         or btrim(coalesce(variant->>'color', '')) = ''
         or jsonb_typeof(variant->'images') <> 'array'
         or case
              when jsonb_typeof(variant->'stock') = 'number'
                then (variant->>'stock')::numeric < 0
                  or trunc((variant->>'stock')::numeric) <> (variant->>'stock')::numeric
              else true
            end
    );
$$;

-- Convierte datos anteriores: el stock general se asigna al primer color.
update public.products as product
set color_variants = coalesce((
  select jsonb_agg(
    variant || jsonb_build_object(
      'stock',
      case when position = 1 then greatest(product.stock, 0) else 0 end
    )
    order by position
  )
  from jsonb_array_elements(product.color_variants) with ordinality as item(variant, position)
), '[]'::jsonb)
where jsonb_array_length(product.color_variants) > 0
  and exists (
    select 1
    from jsonb_array_elements(product.color_variants) as variant
    where not (variant ? 'stock')
  );

alter table public.products
  drop constraint if exists products_color_variants_array;
alter table public.products
  drop constraint if exists products_color_variants_valid;
alter table public.products
  add constraint products_color_variants_valid
  check (public.valid_color_variants(color_variants));

create or replace function public.sync_product_inventory_from_colors()
returns trigger
language plpgsql
as $$
begin
  new.stock := coalesce((
    select sum((variant->>'stock')::integer)
    from jsonb_array_elements(coalesce(new.color_variants, '[]'::jsonb)) as variant
  ), 0);

  new.available_colors := coalesce((
    select array_agg(variant->>'color' order by position)
    from jsonb_array_elements(coalesce(new.color_variants, '[]'::jsonb))
      with ordinality as item(variant, position)
  ), '{}'::text[]);

  return new;
end;
$$;

drop trigger if exists sync_product_inventory on public.products;
create trigger sync_product_inventory
before insert or update of color_variants
on public.products
for each row execute procedure public.sync_product_inventory_from_colors();

-- Recalcula inmediatamente los totales de los productos existentes.
update public.products
set color_variants = color_variants;

alter table public.order_items
  add column if not exists selected_color text;

comment on column public.products.stock is
  'Total derivado automáticamente de color_variants[*].stock; no se captura manualmente.';
comment on column public.products.color_variants is
  'Arreglo JSON: [{"color":"Negro","stock":5,"images":["https://..."]}].';
comment on column public.order_items.selected_color is
  'Color seleccionado por el cliente al realizar la compra.';
