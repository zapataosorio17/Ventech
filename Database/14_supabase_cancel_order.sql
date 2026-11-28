-- Ventech - cancelación transaccional de pedidos en Supabase.
-- Ejecutar en Supabase > SQL Editor después de 11_supabase_checkout.sql.

create or replace function public.cancel_order(p_order_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_variants jsonb;
  v_variant_index integer;
  v_variant_stock integer;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para cancelar el pedido.';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and customer_id = v_user_id
  for update;

  if not found then
    raise exception 'El pedido no existe o no pertenece a tu cuenta.';
  end if;

  if lower(v_order.status) = 'cancelado' then
    raise exception 'El pedido ya fue cancelado.';
  end if;

  if lower(v_order.status) <> 'procesando' then
    raise exception 'Solo se pueden cancelar pedidos en estado procesando.';
  end if;

  for v_item in
    select product_id, quantity, selected_color
    from public.order_items
    where order_id = p_order_id
    order by id
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'No se encontro el producto % del pedido.', v_item.product_id;
    end if;

    v_variants := coalesce(v_product.color_variants, '[]'::jsonb);
    v_variant_index := null;
    v_variant_stock := null;

    if jsonb_array_length(v_variants) > 0 then
      select (position - 1)::integer,
             coalesce((variant->>'stock')::integer, 0)
        into v_variant_index, v_variant_stock
      from jsonb_array_elements(v_variants) with ordinality as entry(variant, position)
      where lower(coalesce(variant->>'color', '')) =
            lower(coalesce(v_item.selected_color, ''))
      limit 1;

      if v_variant_index is null then
        raise exception 'No se encontro el color % del producto %.',
          coalesce(v_item.selected_color, '(sin color)'), v_item.product_id;
      end if;

      v_variants := jsonb_set(
        v_variants,
        array[v_variant_index::text, 'stock'],
        to_jsonb(v_variant_stock + v_item.quantity),
        false
      );

      update public.products
      set color_variants = v_variants
      where id = v_item.product_id;
    else
      update public.products
      set stock = coalesce(stock, 0) + v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  update public.orders
  set status = 'cancelado', updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'id', p_order_id,
    'status', 'cancelado',
    'message', 'Pedido cancelado. El inventario fue restaurado.'
  );
end;
$$;

revoke all on function public.cancel_order(bigint) from public;
revoke all on function public.cancel_order(bigint) from anon;
grant execute on function public.cancel_order(bigint) to authenticated;

comment on function public.cancel_order(bigint) is
  'Cancela un pedido procesando del usuario autenticado y restaura su inventario una sola vez.';

-- Solicita a la API REST de Supabase que reconozca la función inmediatamente.
notify pgrst, 'reload schema';

-- La consulta debe devolver cancel_order(bigint), execute_authenticated = true.
select
  to_regprocedure('public.cancel_order(bigint)')::text as funcion,
  has_function_privilege(
    'authenticated',
    'public.cancel_order(bigint)',
    'EXECUTE'
  ) as execute_authenticated;
