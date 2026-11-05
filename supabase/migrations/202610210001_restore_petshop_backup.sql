create or replace function public.restore_petshop_backup(backup_data jsonb)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_table_name text;
  v_column_names text;
  v_selected_columns text;
  v_sequence_name text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória para restaurar backup.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(backup_data) is distinct from 'object' then
    raise exception 'Formato de backup inválido.' using errcode = '22023';
  end if;

  foreach v_table_name in array array['clientes', 'pets', 'servicos', 'atendimentos', 'financeiro'] loop
    if jsonb_typeof(backup_data -> v_table_name) is distinct from 'array' then
      raise exception 'Dados ausentes ou inválidos para a tabela %.', v_table_name
        using errcode = '22023';
    end if;
  end loop;

  -- Apaga primeiro as tabelas dependentes para respeitar as chaves estrangeiras.
  foreach v_table_name in array array['financeiro', 'atendimentos', 'pets', 'servicos', 'clientes'] loop
    execute format('delete from public.%I', v_table_name);
  end loop;

  -- Reinsere os dados na ordem pai/filho e ignora colunas geradas pelo banco.
  foreach v_table_name in array array['clientes', 'pets', 'servicos', 'atendimentos', 'financeiro'] loop
    select
      string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position),
      string_agg(format('row_data.%I', c.column_name), ', ' order by c.ordinal_position)
    into v_column_names, v_selected_columns
    from information_schema.columns as c
    where c.table_schema = 'public'
      and c.table_name = v_table_name
      and c.is_generated = 'NEVER';

    if v_column_names is null then
      raise exception 'Nenhuma coluna gravável encontrada para a tabela %.', v_table_name;
    end if;

    execute format(
      'insert into public.%I (%s) overriding system value select %s from jsonb_populate_recordset(null::public.%I, $1) as row_data',
      v_table_name,
      v_column_names,
      v_selected_columns,
      v_table_name
    ) using backup_data -> v_table_name;

    v_sequence_name := pg_get_serial_sequence(format('public.%I', v_table_name), 'id');
    if v_sequence_name is not null then
      execute format(
        'select setval(%L::regclass, coalesce(max(id)::bigint, 1), count(*) > 0) from public.%I',
        v_sequence_name,
        v_table_name
      );
    end if;
  end loop;
end;
$$;

-- Permite que o RPC reposicione somente sequências ligadas aos IDs destas tabelas.
do $$
declare
  v_table_name text;
  v_sequence_name text;
begin
  foreach v_table_name in array array['clientes', 'pets', 'servicos', 'atendimentos', 'financeiro'] loop
    v_sequence_name := pg_get_serial_sequence(format('public.%I', v_table_name), 'id');
    if v_sequence_name is not null then
      execute format(
        'grant usage, select, update on sequence %s to authenticated',
        v_sequence_name::regclass
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.restore_petshop_backup(jsonb) from public;
revoke all on function public.restore_petshop_backup(jsonb) from anon;
grant execute on function public.restore_petshop_backup(jsonb) to authenticated;
