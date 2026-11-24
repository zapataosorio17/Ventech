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

  function_definition := regexp_replace(
    function_definition,
    '(order_id,\s*product_id,\s*)quantity',
    '\1product_name, quantity'
  );

  function_definition := regexp_replace(
    function_definition,
    '(v_order_id,\s*v_product\.id,\s*)v_quantity',
    '\1v_product.name, v_quantity'
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
