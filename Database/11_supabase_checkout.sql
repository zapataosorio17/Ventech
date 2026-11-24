-- Ventech - checkout transaccional para la publicacion en Cloudflare Pages.
-- Ejecutar una sola vez en Supabase > SQL Editor.

create or replace function public.place_order(
  p_department text,
  p_city text,
  p_address text,
  p_neighborhood text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id bigint;
  v_order_number text := 'PED-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_color text;
  v_variant_index integer;
  v_variant_stock integer;
  v_variants jsonb;
  v_base numeric;
  v_discount numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_discount_total numeric := 0;
  v_vat_total numeric := 0;
  v_total numeric := 0;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para confirmar el pedido.';
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'El carrito esta vacio.';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id and coalesce(active, true)
  ) then
    raise exception 'La cuenta no existe o esta deshabilitada.';
  end if;

  insert into public.orders (
    customer_id, order_number, status, subtotal, discount_total, vat_total, total,
    department, city, address, neighborhood, payment_method
  ) values (
    v_user_id, v_order_number, 'Procesando', 0, 0, 0, 0,
    coalesce(p_department, ''), coalesce(p_city, ''),
    coalesce(p_address, ''), coalesce(p_neighborhood, ''),
    coalesce(p_payment_method, 'PSE')
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    v_color := nullif(btrim(coalesce(v_item->>'color', '')), '');

    if v_quantity < 1 then
      raise exception 'La cantidad de cada producto debe ser mayor que cero.';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'productId')::bigint and status = 'activo'
    for update;

    if not found then
      raise exception 'Producto no disponible.';
    end if;

    v_variants := coalesce(v_product.color_variants, '[]'::jsonb);
    v_variant_index := null;
    v_variant_stock := null;

    if jsonb_array_length(v_variants) > 0 then
      if v_color is not null then
        select (position - 1)::integer, (variant->>'stock')::integer
          into v_variant_index, v_variant_stock
        from jsonb_array_elements(v_variants) with ordinality as entry(variant, position)
        where lower(variant->>'color') = lower(v_color)
        limit 1;
      else
        select (position - 1)::integer, (variant->>'stock')::integer, variant->>'color'
          into v_variant_index, v_variant_stock, v_color
        from jsonb_array_elements(v_variants) with ordinality as entry(variant, position)
        where coalesce((variant->>'stock')::integer, 0) >= v_quantity
        order by position
        limit 1;
      end if;

      if v_variant_index is null or coalesce(v_variant_stock, 0) < v_quantity then
        raise exception 'Producto no disponible o sin stock suficiente para el color seleccionado.';
      end if;

      v_variants := jsonb_set(
        v_variants,
        array[v_variant_index::text, 'stock'],
        to_jsonb(v_variant_stock - v_quantity),
        false
      );
      update public.products set color_variants = v_variants where id = v_product.id;
    else
      if coalesce(v_product.stock, 0) < v_quantity then
        raise exception 'Producto no disponible o sin stock suficiente.';
      end if;
      update public.products set stock = stock - v_quantity where id = v_product.id;
    end if;

    v_base := v_product.price * v_quantity;
    v_discount := v_base * coalesce(v_product.discount_percent, 0) / 100;
    v_line_total := v_base - v_discount;
    v_subtotal := v_subtotal + v_base;
    v_discount_total := v_discount_total + v_discount;
    v_vat_total := v_vat_total + round(
      v_line_total * coalesce(v_product.vat_percent, 0) / 100,
      2
    );
    v_total := v_total + v_line_total
      + round(v_line_total * coalesce(v_product.vat_percent, 0) / 100, 2);

    insert into public.order_items (
      order_id, product_id, quantity, unit_price, discount_percent,
      vat_percent, line_total, selected_color
    ) values (
      v_order_id, v_product.id, v_quantity, v_product.price,
      coalesce(v_product.discount_percent, 0),
      coalesce(v_product.vat_percent, 0), v_line_total, v_color
    );
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      discount_total = v_discount_total,
      vat_total = v_vat_total,
      total = v_total,
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'number', v_order_number,
    'total', v_total,
    'status', 'Procesando'
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, jsonb) from public;
revoke all on function public.place_order(text, text, text, text, text, jsonb) from anon;
grant execute on function public.place_order(text, text, text, text, text, jsonb) to authenticated;

comment on function public.place_order(text, text, text, text, text, jsonb) is
  'Crea un pedido y descuenta el inventario por color en una unica transaccion.';
