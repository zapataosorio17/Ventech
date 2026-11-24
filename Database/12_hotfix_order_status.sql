-- Corrige instalaciones donde place_order todavía usa 'Procesando'.
-- No modifica pedidos existentes ni inventario.

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.place_order(text,text,text,text,text,jsonb)'::regprocedure
  )
  into function_definition;

  if position('''Procesando''' in function_definition) = 0 then
    raise notice 'place_order ya utiliza el estado compatible.';
    return;
  end if;

  function_definition := replace(
    function_definition,
    '''Procesando''',
    '''procesando'''
  );

  execute function_definition;
  raise notice 'place_order fue actualizado para usar procesando.';
end;
$$;

select
  position(
    '''Procesando''' in pg_get_functiondef(
      'public.place_order(text,text,text,text,text,jsonb)'::regprocedure
    )
  ) = 0 as corregido;
