-- Run as one transaction. Existing records are deliberately not rewritten.
begin;

create or replace function public.petshop_sync_atendimento_financeiro()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_servico text;
  v_pet text;
  v_cliente text;
  v_descricao text;
  v_data date;
begin
  if current_setting('petshop.restoring_backup', true) = 'on' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'DELETE' then
    delete from public.financeiro where atendimento_id = old.id;
    return old;
  end if;

  if coalesce(new.valor, 0) < 0 or coalesce(new.valor_2, 0) < 0 then
    raise exception 'Valores de pagamento não podem ser negativos.' using errcode = '22023';
  end if;
  if coalesce(new.valor_2, 0) > 0 and nullif(new.forma_pagamento_2, '') is null then
    raise exception 'Informe a segunda forma de pagamento.' using errcode = '22023';
  end if;

  -- Deletion and replacement share the attendance transaction. Any failure rolls back all writes.
  delete from public.financeiro where atendimento_id = new.id;
  if new.status is distinct from 'concluido' or new.status_pagamento is distinct from 'pago' then
    return new;
  end if;

  select nome into v_servico from public.servicos where id = new.servico_id;
  select nome into v_pet from public.pets where id = new.pet_id;
  select nome into v_cliente from public.clientes where id = new.cliente_id;
  v_descricao := coalesce(v_servico, 'Serviço') || ' - ' || coalesce(v_pet, '') || ' (' || coalesce(v_cliente, '') || ')';
  -- Financial dates use the same explicit business timezone regardless of the DB session.
  v_data := (new.data_hora at time zone 'America/Manaus')::date;

  if coalesce(new.valor, 0) > 0 then
    insert into public.financeiro
      (tipo, categoria, descricao, valor, data, forma_pagamento, banco, grupo, atendimento_id, status_pagamento)
    values
      ('entrada', 'Servicos', v_descricao, new.valor, v_data, coalesce(new.forma_pagamento, 'pix'), new.banco, 'Servicos', new.id, 'pago');
  end if;
  if coalesce(new.valor_2, 0) > 0 then
    insert into public.financeiro
      (tipo, categoria, descricao, valor, data, forma_pagamento, banco, grupo, atendimento_id, status_pagamento)
    values
      ('entrada', 'Servicos', v_descricao || ' (2a forma)', new.valor_2, v_data, new.forma_pagamento_2, coalesce(new.banco_2, new.banco), 'Servicos', new.id, 'pago');
  end if;
  return new;
end;
$$;

drop trigger if exists petshop_finance_sync_write on public.atendimentos;
create trigger petshop_finance_sync_write
after insert or update on public.atendimentos
for each row execute function public.petshop_sync_atendimento_financeiro();

drop trigger if exists petshop_finance_sync_delete on public.atendimentos;
create trigger petshop_finance_sync_delete
before delete on public.atendimentos
for each row execute function public.petshop_sync_atendimento_financeiro();

create or replace function public.petshop_finance_sync_ready()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null and (
    select count(*) = 2 from pg_trigger
    where tgrelid = 'public.atendimentos'::regclass
      and tgname in ('petshop_finance_sync_write', 'petshop_finance_sync_delete')
      and tgenabled = 'O'
  );
$$;

revoke all on function public.petshop_finance_sync_ready() from public, anon;
grant execute on function public.petshop_finance_sync_ready() to authenticated;

-- Export all related tables from one consistent statement snapshot.
create or replace function public.export_petshop_backup()
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória para exportar backup.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'clientes', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]'::jsonb) from public.clientes t),
    'pets', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]'::jsonb) from public.pets t),
    'servicos', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]'::jsonb) from public.servicos t),
    'atendimentos', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]'::jsonb) from public.atendimentos t),
    'financeiro', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]'::jsonb) from public.financeiro t)
  );
end;
$$;
revoke all on function public.export_petshop_backup() from public, anon;
grant execute on function public.export_petshop_backup() to authenticated;

-- Restore must preserve the exported financial ledger instead of regenerating it.
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
    raise exception 'Autenticação obrigatória para restaurar backup.' using errcode = '42501';
  end if;
  if jsonb_typeof(backup_data) is distinct from 'object' then
    raise exception 'Formato de backup inválido.' using errcode = '22023';
  end if;
  foreach v_table_name in array array['clientes', 'pets', 'servicos', 'atendimentos', 'financeiro'] loop
    if jsonb_typeof(backup_data -> v_table_name) is distinct from 'array' then
      raise exception 'Dados ausentes ou inválidos para a tabela %.', v_table_name using errcode = '22023';
    end if;
  end loop;

  perform set_config('petshop.restoring_backup', 'on', true);
  foreach v_table_name in array array['financeiro', 'atendimentos', 'pets', 'servicos', 'clientes'] loop
    execute format('delete from public.%I', v_table_name);
  end loop;
  foreach v_table_name in array array['clientes', 'pets', 'servicos', 'atendimentos', 'financeiro'] loop
    select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position),
           string_agg(format('row_data.%I', c.column_name), ', ' order by c.ordinal_position)
    into v_column_names, v_selected_columns
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = v_table_name and c.is_generated = 'NEVER';
    if v_column_names is null then raise exception 'Tabela inválida: %.', v_table_name; end if;
    execute format(
      'insert into public.%I (%s) overriding system value select %s from jsonb_populate_recordset(null::public.%I, $1) as row_data',
      v_table_name, v_column_names, v_selected_columns, v_table_name
    ) using backup_data -> v_table_name;
    v_sequence_name := pg_get_serial_sequence(format('public.%I', v_table_name), 'id');
    if v_sequence_name is not null then
      execute format('select setval(%L::regclass, coalesce(max(id)::bigint, 1), count(*) > 0) from public.%I', v_sequence_name, v_table_name);
    end if;
  end loop;
  perform set_config('petshop.restoring_backup', 'off', true);
end;
$$;

revoke all on function public.restore_petshop_backup(jsonb) from public, anon;
grant execute on function public.restore_petshop_backup(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
