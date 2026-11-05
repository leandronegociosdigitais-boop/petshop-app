-- Regression check for the installed migration. Execute the whole file, never a selected fragment.
-- All fixtures, trigger objects and writes are rolled back at the end.
begin;
create function pg_temp.petshop_test_fail_financeiro()
returns trigger language plpgsql as $$
begin
  if new.banco = 'codex_test_failure' then
    raise exception 'Injected financial write failure' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger petshop_test_fail_financeiro
before insert on public.financeiro
for each row execute function pg_temp.petshop_test_fail_financeiro();

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$
declare
  v_id uuid;
  v_before_a bigint;
  v_before_f bigint;
  v_backup jsonb;
begin
  assert public.petshop_finance_sync_ready(), 'Required migration is missing';
  select count(*) into v_before_a from public.atendimentos;
  select count(*) into v_before_f from public.financeiro;
  insert into public.atendimentos (data_hora, status, status_pagamento, valor, valor_2, forma_pagamento_2)
  values ('2026-11-06T02:00:00Z', 'agendado', 'pendente', 50, 20, 'dinheiro') returning id into v_id;
  assert (select count(*) = 0 from public.financeiro where atendimento_id = v_id);
  update public.atendimentos set status = 'concluido' where id = v_id;
  assert (select status_pagamento = 'pendente' from public.atendimentos where id = v_id);
  assert (select count(*) = 0 from public.financeiro where atendimento_id = v_id);
  update public.atendimentos set status_pagamento = 'pago' where id = v_id;
  assert (select count(*) = 2 and sum(valor) = 70 and min(data) = '2026-11-05'::date from public.financeiro where atendimento_id = v_id);
  update public.atendimentos set valor = 60 where id = v_id;
  update public.atendimentos set observacoes = 'Regression check' where id = v_id;
  assert (select count(*) = 2 and sum(valor) = 80 from public.financeiro where atendimento_id = v_id);
  begin
    update public.atendimentos set banco = 'codex_test_failure' where id = v_id;
    raise exception 'Expected financial failure did not occur' using errcode = '22000';
  exception when sqlstate 'P0001' then null;
  end;
  assert (select banco is null from public.atendimentos where id = v_id);
  assert (select count(*) = 2 and sum(valor) = 80 from public.financeiro where atendimento_id = v_id);
  update public.atendimentos set status = 'cancelado' where id = v_id;
  assert (select count(*) = 0 from public.financeiro where atendimento_id = v_id);
  update public.atendimentos set status = 'concluido' where id = v_id;
  delete from public.atendimentos where id = v_id;
  assert (select count(*) = 0 from public.financeiro where atendimento_id = v_id);
  assert (select count(*) = v_before_a from public.atendimentos);
  assert (select count(*) = v_before_f from public.financeiro);
  v_backup := public.export_petshop_backup();
  assert jsonb_array_length(v_backup -> 'clientes') = (select count(*) from public.clientes);
  assert jsonb_array_length(v_backup -> 'pets') = (select count(*) from public.pets);
  assert jsonb_array_length(v_backup -> 'servicos') = (select count(*) from public.servicos);
  assert jsonb_array_length(v_backup -> 'atendimentos') = v_before_a;
  assert jsonb_array_length(v_backup -> 'financeiro') = v_before_f;
  begin
    perform public.restore_petshop_backup('{}'::jsonb);
    raise exception 'Invalid backup accepted' using errcode = '22000';
  exception when sqlstate '22023' then null;
  end;
end;
$$;
reset role;
do $$
begin
  assert not has_function_privilege('anon', 'public.export_petshop_backup()', 'execute');
  assert not has_function_privilege('anon', 'public.restore_petshop_backup(jsonb)', 'execute');
  assert has_function_privilege('authenticated', 'public.export_petshop_backup()', 'execute');
  assert has_function_privilege('authenticated', 'public.restore_petshop_backup(jsonb)', 'execute');
end;
$$;
rollback;
select 'PASS: all test changes rolled back' as result;
