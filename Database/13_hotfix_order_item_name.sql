-- Agrega product_name a place_order para instalaciones donde la columna
-- order_items.product_name es obligatoria. No modifica datos existentes.

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.place_order(text,text,text,text,text,jsonb)'::regprocedure
  )
  into function_definition;

  if position('product_name' in function_definition) > 0 then
    raise notice 'place_order ya guarda product_name.';
    return;
  end if;

  function_definition := replace(
    function_definition,
    'order_id, product_id, quantity, unit_price, discount_percent,',
    'order_id, product_id, product_name, quantity, unit_price, discount_percent,'
  );

  function_definition := replace(
    function_definition,
    'v_order_id, v_product.id, v_quantity, v_product.price,',
    'v_order_id, v_product.id, v_product.name, v_quantity, v_product.price,'
  );

  if position('product_name' in function_definition) = 0 then
    raise exception 'No se encontró la sección esperada de order_items.';
  end if;

  execute function_definition;
  raise notice 'place_order fue actualizado para guardar product_name.';
end;
$$;

select
  position(
    'product_name' in pg_get_functiondef(
      'public.place_order(text,text,text,text,text,jsonb)'::regprocedure
    )
  ) > 0 as corregido;
