import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowDownLeft, ArrowUpRight, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RefreshCw, Scissors, Wallet, CircleAlert, CheckCheck, PawPrint, Users, Receipt, CalendarCheck2 } from 'lucide-react'
import { fetchDashboardData } from '../lib/dashboard-data'
import { appointmentsLink, financialLink, buildDashboard, appointmentAmount, shiftDay, shiftMonth } from '../lib/dashboard'
import { formatCurrency, formatDate, formatTime, getLocalDateISO, extractDateKey } from '../lib/dates'
import { FORMA_PAGAMENTO_LABEL } from '../lib/constants'
import { mutateAtendimento } from '../lib/atendimentos'
import { useAuth } from '../hooks/useAuthContext'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import '../styles/dashboard.css'

const statusNames = { agendado: 'Agendado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado' }
const palette = ['#5865ef', '#24b6a4', '#f5b44c', '#9c78df', '#f18498', '#8796b1']
const dateLabel = date => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' })
const monthLabel = month => new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
const compactNumber = value => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

function Metric({ label, value, detail, icon: Icon, tone, to }) {
  return <Link to={to} className="dv-metric" data-tone={tone}>
    <div className="dv-metric-top"><span className="dv-icon"><Icon size={19} /></span><ArrowUpRight size={16} className="dv-muted" /></div>
    <p className="dv-metric-label">{label}</p><strong className="dv-metric-value">{value}</strong><div className="dv-metric-detail">{detail}</div>
  </Link>
}

function Empty({ icon: Icon = CalendarDays, title, description, children }) {
  return <div className="dv-empty"><span><Icon size={25} /></span><strong>{title}</strong><p>{description}</p>{children}</div>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const today = getLocalDateISO(now)
  const [month, setMonth] = useState(() => getLocalDateISO().slice(0, 7))
  const [day, setDay] = useState(() => getLocalDateISO())
  const [agendaStatus, setAgendaStatus] = useState('todos')
  const [attentionTab, setAttentionTab] = useState('pagar')
  const [chartScale, setChartScale] = useState('dia')
  const queryClient = useQueryClient()
  const { toast, showToast, closeToast } = useToast()
  const year = Number(month.slice(0, 4))
  const query = useQuery({
    queryKey: ['dashboard', user?.id, year],
    queryFn: ({ signal }) => fetchDashboardData(year, signal),
    enabled: !!user,
    staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: true, refetchOnMount: 'always',
  })
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer) }, [])
  const model = useMemo(() => query.data ? buildDashboard(query.data, month, day, now) : null, [query.data, month, day, now])
  const changeStatus = useMutation({
    mutationFn: async ({ id, status, expectedStatus }) => {
      const result = await mutateAtendimento({ id, payload: { status }, expectedStatus })
      if (result.error?.code === 'PGRST116') throw new Error('O atendimento mudou em outra tela. Atualize a agenda e tente novamente.')
      if (result.error) throw result.error
    },
    onSuccess: async () => {
      showToast('Atendimento atualizado. O status do pagamento foi preservado.')
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: error => showToast('Não foi possível atualizar: ' + error.message, 'error'),
  })

  function changeMonth(value) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return
    setMonth(value)
    setDay(value === today.slice(0, 7) ? today : value + '-01')
    setAgendaStatus('todos')
  }
  function changeDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return
    setDay(value)
    setMonth(value.slice(0, 7))
  }

  const newAppointment = appointmentsLink({ date: day, create: true })
  const agenda = model?.agenda.filter(row => agendaStatus === 'todos' || row.status === agendaStatus) || []
  const pendingRows = model ? attentionTab === 'pagar' ? model.bills : model.receivables : []
  const overdueCount = model ? model.overdueBills.length + model.overdueReceivables.length : 0
  const chartData = model
    ? chartScale === 'dia'
      ? model.currentMonth ? model.days.filter(row => row.key <= today) : model.days
      : model.annual.slice(0, year === now.getFullYear() ? now.getMonth() + 1 : 12)
    : []

  return <>
    <Toast toast={toast} onClose={closeToast} />
    <div className="dashboard-v2">
      <header className="dv-header">
        <div><div className="dv-eyebrow"><PawPrint size={15} /> PAINEL DE GESTÃO</div><h1>Visão geral<span>.</span></h1><p>{dateLabel(today)} <span className="dv-header-divider">/</span> Seu pet shop, sob controle.</p></div>
        <div className="dv-header-actions"><button type="button" className="dv-refresh" onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Atualizar indicadores" title="Atualizar indicadores"><RefreshCw size={18} className={query.isFetching ? 'dv-spin' : ''} /></button><Link to={newAppointment} className="dv-button dv-primary"><Plus size={17} /> Novo atendimento</Link></div>
      </header>

      <div className="dv-toolbar"><div className="dv-period"><CalendarDays size={17} /><button type="button" aria-label="Mês anterior" onClick={() => changeMonth(shiftMonth(month, -1))}><ChevronLeft size={16} /></button><input type="month" aria-label="Mês dos indicadores" min="2000-01" max="2100-12" value={month} onChange={event => changeMonth(event.target.value)} /><button type="button" aria-label="Próximo mês" onClick={() => changeMonth(shiftMonth(month, 1))}><ChevronRight size={16} /></button></div><div className="dv-updated"><span className={query.isError ? 'dv-dot dv-dot-warning' : 'dv-dot'} />{query.isFetching ? 'Atualizando indicadores…' : query.isError ? 'Atualização indisponível' : query.dataUpdatedAt ? `Atualizado às ${new Date(query.dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Conectando…'}</div></div>

      {query.isError && <div role="alert" className="dv-error"><CircleAlert size={20} /><div><strong>Não foi possível atualizar os indicadores.</strong><p>{model ? 'Exibindo a última leitura disponível. Tente atualizar novamente.' : 'Os dados deste período não estão disponíveis. Verifique sua conexão e tente novamente.'}</p></div><button type="button" onClick={() => query.refetch()}>Tentar novamente</button></div>}

      {!model ? !query.isError && <div className="dv-loading" role="status" aria-label="Carregando dashboard"><div className="dv-kpis">{[0, 1, 2, 3].map(key => <div key={key} className="dv-skeleton dv-skeleton-card" />)}</div><div className="dv-skeleton dv-skeleton-panel" /></div> : <>
        <section className="dv-kpis" aria-label="Indicadores do mês">
          <Metric label="Receita de serviços" value={formatCurrency(model.revenue)} tone="indigo" icon={Scissors} to={appointmentsLink({ month, status: 'concluido' })} detail={model.comparison === null ? <span>Serviços concluídos no período</span> : <><span className={model.comparison >= 0 ? 'dv-positive' : 'dv-negative'}>{model.comparison >= 0 ? '↗' : '↘'} {Math.abs(model.comparison).toFixed(1)}%</span><span>{model.currentMonth ? `vs. até dia ${Number(model.previousEnd.slice(8))} do mês anterior` : 'vs. mês anterior'}</span></>} />
          <Metric label="Saldo do período" value={formatCurrency(model.balance)} tone="teal" icon={Wallet} to={financialLink(month)} detail={<span>Entradas {formatCurrency(model.receipts)}<br />Saídas pagas {formatCurrency(model.expenses)}</span>} />
          <Metric label="A receber no mês" value={formatCurrency(model.receiveMonth)} tone="amber" icon={ArrowDownLeft} to={appointmentsLink({ month, payment: 'pendente' })} detail={<span>{model.receiveMonthCount} atendimento{model.receiveMonthCount !== 1 ? 's' : ''} com pagamento em aberto</span>} />
          <Metric label="Serviços realizados" value={String(model.completed).padStart(2, '0')} tone="violet" icon={CalendarCheck2} to={appointmentsLink({ month, status: 'concluido' })} detail={<span>Ticket médio <b>{formatCurrency(model.ticket)}</b></span>} />
        </section>

        {(overdueCount > 0 || model.lateAppointments.length > 0) && <div className="dv-notice"><span className="dv-notice-icon"><CircleAlert size={19} /></span><div><strong>Alguns itens precisam da sua atenção</strong><p>{overdueCount > 0 ? `${overdueCount} pagamento${overdueCount !== 1 ? 's' : ''} com vencimento anterior a hoje` : 'Nenhum pagamento vencido'}{model.lateAppointments.length > 0 ? ` · ${model.lateAppointments.length} atendimento${model.lateAppointments.length !== 1 ? 's' : ''} de dias anteriores ainda em aberto` : ''}.</p></div><a href={overdueCount > 0 ? '#pendencias-dashboard' : appointmentsLink({ date: extractDateKey(model.lateAppointments[0].data_hora), status: model.lateAppointments[0].status })}>Revisar <ArrowRight size={15} /></a></div>}

        <div className="dv-main-grid">
          <section className="dv-panel dv-agenda" aria-labelledby="agenda-heading">
            <div className="dv-panel-heading"><div><span className="dv-section-icon"><CalendarDays size={19} /></span><div><h2 id="agenda-heading">Agenda do dia</h2><p>{day === today ? 'Hoje' : formatDate(day)} · {model.agendaCounts.todos} atendimento{model.agendaCounts.todos !== 1 ? 's' : ''}</p></div></div><Link className="dv-text-link" to={appointmentsLink({ date: day })}>Ver agenda <ArrowUpRight size={15} /></Link></div>
            <div className="dv-agenda-controls"><div className="dv-day-picker"><button type="button" aria-label="Dia anterior" onClick={() => changeDay(shiftDay(day, -1))}><ChevronLeft size={16} /></button><input type="date" aria-label="Data da agenda" value={day} onChange={event => changeDay(event.target.value)} /><button type="button" aria-label="Próximo dia" onClick={() => changeDay(shiftDay(day, 1))}><ChevronRight size={16} /></button></div><button type="button" className="dv-today" onClick={() => changeDay(today)}>Hoje</button></div>
            <div className="dv-tabs" role="group" aria-label="Filtrar agenda">{[['todos', 'Todos'], ['agendado', 'Agendados'], ['em_andamento', 'Em andamento'], ['concluido', 'Concluídos']].map(([key, label]) => <button type="button" key={key} aria-pressed={agendaStatus === key} className={agendaStatus === key ? 'is-active' : ''} onClick={() => setAgendaStatus(key)}>{label}<span>{model.agendaCounts[key]}</span></button>)}</div>
            <div className="dv-agenda-list">{agenda.length ? agenda.slice(0, 6).map(row => <div className="dv-agenda-row" key={row.id}>
              <div className="dv-time"><Clock3 size={13} /><strong>{formatTime(row.data_hora)}</strong></div>
              <Link className="dv-appointment-info" to={appointmentsLink({ date: day, query: row.pet?.nome || row.cliente?.nome })}><strong>{row.pet?.nome || 'Pet sem nome'}</strong><span>{row.servico?.nome || 'Serviço'} <span className="dv-bullet">·</span> {row.cliente?.nome || 'Cliente'}</span></Link>
              <div className="dv-appointment-meta"><span className="dv-status" data-status={row.status}>{statusNames[row.status] || row.status}</span><strong>{formatCurrency(appointmentAmount(row))}</strong></div>
              <div className="dv-appointment-action">{['agendado', 'em_andamento'].includes(row.status) ? <button type="button" disabled={changeStatus.isPending} className="dv-start" onClick={() => changeStatus.mutate({ id: row.id, expectedStatus: row.status, status: row.status === 'agendado' ? 'em_andamento' : 'concluido' })}>{changeStatus.isPending && changeStatus.variables?.id === row.id ? 'Salvando…' : row.status === 'agendado' ? 'Iniciar' : 'Concluir'}<ArrowRight size={13} /></button> : <Link to={appointmentsLink({ date: day, query: row.pet?.nome || row.cliente?.nome })} aria-label={`Ver atendimento de ${row.pet?.nome || 'pet'}`}><ArrowUpRight size={17} /></Link>}</div>
            </div>) : <Empty title={agendaStatus === 'todos' ? 'Um espaço livre na agenda' : 'Nenhum atendimento neste status'} description={agendaStatus === 'todos' ? 'Organize o próximo atendimento deste dia.' : 'Selecione outro status ou outra data para consultar.'}>{agendaStatus === 'todos' && <Link className="dv-button dv-secondary" to={newAppointment}><Plus size={15} /> Agendar neste dia</Link>}</Empty>}</div>
            {agenda.length > 6 && <Link className="dv-panel-footer" to={appointmentsLink({ date: day, status: agendaStatus === 'todos' ? '' : agendaStatus })}>Ver os {agenda.length} atendimentos <ArrowRight size={15} /></Link>}
            <div className="dv-agenda-bottom"><CheckCheck size={16} /><span>{model.agendaCounts.concluido} concluído{model.agendaCounts.concluido !== 1 ? 's' : ''} neste dia</span><span className="dv-progress"><i style={{ width: `${model.agendaCounts.todos ? model.agendaCounts.concluido / model.agendaCounts.todos * 100 : 0}%` }} /></span></div>
          </section>

          <section className="dv-panel dv-attention" id="pendencias-dashboard" aria-labelledby="attention-heading">
            <div className="dv-panel-heading"><div><span className="dv-section-icon dv-warm"><Receipt size={19} /></span><div><h2 id="attention-heading">Precisa de atenção</h2><p>Em aberto, inclusive de outros meses</p></div></div></div>
            <div className="dv-attention-tabs">{[['pagar', 'A pagar', model.bills.length], ['receber', 'A receber', model.receivables.length]].map(([key, label, count]) => <button type="button" key={key} className={attentionTab === key ? 'is-active' : ''} aria-pressed={attentionTab === key} onClick={() => setAttentionTab(key)}>{label}<span>{count}</span></button>)}</div>
            <div className="dv-attention-total"><span>Total em aberto</span><strong>{formatCurrency(attentionTab === 'pagar' ? model.payTotal : model.receiveTotal)}</strong></div>
            <div className="dv-pending-list">{pendingRows.length ? pendingRows.slice(0, 5).map(row => {
              const overdue = row.data_vencimento && row.data_vencimento < today
              const to = attentionTab === 'pagar' ? financialLink((row.data || today).slice(0, 7), row.descricao) : appointmentsLink({ date: extractDateKey(row.data_hora), payment: 'pendente', query: row.pet?.nome || row.cliente?.nome })
              return <Link key={row.id} to={to} className="dv-pending-row"><span className="dv-pending-dot" data-overdue={!!overdue} /><div><strong>{attentionTab === 'pagar' ? row.descricao || 'Despesa' : row.cliente?.nome || row.pet?.nome || 'Atendimento'}</strong><span className={overdue ? 'dv-negative' : ''}>{row.data_vencimento ? `${overdue ? 'Venceu em' : 'Vence em'} ${formatDate(row.data_vencimento)}` : 'Sem vencimento informado'}</span></div><b>{formatCurrency(attentionTab === 'pagar' ? row.valor : appointmentAmount(row))}</b><ArrowUpRight size={15} /></Link>
            }) : <Empty icon={CheckCheck} title="Tudo em dia por aqui" description={attentionTab === 'pagar' ? 'Nenhuma despesa pendente cadastrada.' : 'Nenhum atendimento com valor a receber.'} />}</div>
            {pendingRows.length > 5 && <p className="dv-showing">Exibindo as 5 primeiras de {pendingRows.length} pendências. Abra cada item no módulo correspondente.</p>}
          </section>
        </div>

        <section className="dv-panel dv-cashflow" aria-labelledby="cashflow-heading"><div className="dv-panel-heading"><div><span className="dv-section-icon dv-cool"><Wallet size={19} /></span><div><h2 id="cashflow-heading">Como está seu caixa?</h2><p>{chartScale === 'dia' ? monthLabel(month) : `Visão anual de ${year}`} · somente valores realizados</p></div></div><div className="dv-segment"><button type="button" className={chartScale === 'dia' ? 'is-active' : ''} aria-pressed={chartScale === 'dia'} onClick={() => setChartScale('dia')}>Por dia</button><button type="button" className={chartScale === 'mes' ? 'is-active' : ''} aria-pressed={chartScale === 'mes'} onClick={() => setChartScale('mes')}>Por mês</button></div></div>
          <div className="dv-chart-legend"><span><i style={{ background: '#5865ef' }} />Entradas</span><span><i style={{ background: '#ef9b75' }} />Saídas pagas</span></div>
          {chartData.some(row => row.entradas || row.saidas) ? <div className="dv-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 1 }}><AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}><defs><linearGradient id="dv-income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5865ef" stopOpacity={0.18} /><stop offset="100%" stopColor="#5865ef" stopOpacity={0.01} /></linearGradient><linearGradient id="dv-expense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef9b75" stopOpacity={0.15} /><stop offset="100%" stopColor="#ef9b75" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eef0f6" vertical={false} strokeDasharray="4 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={20} tick={{ fill: '#8b93a6', fontSize: 11 }} dy={10} /><YAxis tickFormatter={compactNumber} axisLine={false} tickLine={false} width={52} tick={{ fill: '#8b93a6', fontSize: 11 }} /><Tooltip formatter={value => formatCurrency(value)} labelFormatter={value => chartScale === 'dia' ? `Dia ${value}` : value} contentStyle={{ borderRadius: 12, border: '1px solid #eceef6', fontSize: 12 }} /><Area type="monotone" dataKey="entradas" name="Entradas" stroke="#5865ef" strokeWidth={2.5} fill="url(#dv-income)" /><Area type="monotone" dataKey="saidas" name="Saídas pagas" stroke="#ef9b75" strokeWidth={2} fill="url(#dv-expense)" /></AreaChart></ResponsiveContainer></div> : <Empty icon={Wallet} title="O caixa ainda não teve movimento" description="Entradas e despesas pagas aparecerão aqui quando forem registradas neste período." />}
        </section>

        <div className="dv-lower-grid"><section className="dv-panel"><div className="dv-panel-heading"><div><span className="dv-section-icon"><Scissors size={19} /></span><div><h2>Os favoritos dos pets</h2><p>Serviços concluídos em {monthLabel(month)}</p></div></div></div>{model.services.length ? <div className="dv-services">{model.services.slice(0, 5).map((service, index) => <Link key={service.id} to={appointmentsLink({ month, status: 'concluido', service: service.id === 'outros' ? '' : service.id })} className="dv-service"><span className="dv-rank">{String(index + 1).padStart(2, '0')}</span><div><div className="dv-service-title"><strong>{service.name}</strong><span>{service.count} <small>serviços</small></span></div><div className="dv-service-bar"><i style={{ width: `${service.count / model.services[0].count * 100}%`, background: palette[index] }} /></div></div><span className="dv-service-amount">{formatCurrency(service.revenue)}</span></Link>)}</div> : <Empty icon={Scissors} title="Os favoritos vão aparecer aqui" description="Conclua atendimentos neste mês para acompanhar seus serviços mais procurados." />}</section>
          <section className="dv-panel"><div className="dv-panel-heading"><div><span className="dv-section-icon dv-cool"><ArrowDownLeft size={19} /></span><div><h2>Como você recebe</h2><p>Entradas realizadas em {monthLabel(month)}</p></div></div></div>{model.payments.length ? <div className="dv-payments"><div className="dv-donut"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 1 }}><PieChart><Pie data={model.payments} dataKey="value" innerRadius="70%" outerRadius="94%" paddingAngle={3} stroke="none">{model.payments.map((row, index) => <Cell key={row.key} fill={palette[index % palette.length]} />)}</Pie><Tooltip formatter={(value, name, props) => [formatCurrency(value), FORMA_PAGAMENTO_LABEL[props.payload.key] || props.payload.key]} /></PieChart></ResponsiveContainer><div className="dv-donut-label"><span>Recebido</span><strong>{formatCurrency(model.receipts)}</strong></div></div><div className="dv-payment-list">{model.payments.map((row, index) => <div key={row.key}><i style={{ background: palette[index % palette.length] }} /><span>{FORMA_PAGAMENTO_LABEL[row.key] || 'Outros'}<small>{model.receipts ? Math.round(row.value / model.receipts * 100) : 0}%</small></span><strong>{formatCurrency(row.value)}</strong></div>)}</div></div> : <Empty icon={Receipt} title="Sem recebimentos no período" description="As formas de pagamento aparecem após a entrada ser registrada no financeiro." />}</section>
        </div>

        <footer className="dv-shortcuts"><div><strong>Menos cliques, mais cuidado.</strong><span>O que você precisa fazer agora?</span></div><nav aria-label="Ações rápidas"><Link to={newAppointment}><CalendarDays size={17} /> Agendar atendimento <ArrowUpRight size={14} /></Link><Link to="/clientes?novo=1"><Users size={17} /> Cadastrar cliente <ArrowUpRight size={14} /></Link><Link to={`/financeiro?novo=saida&data=${day}`}><Receipt size={17} /> Lançar despesa <ArrowUpRight size={14} /></Link></nav></footer>
      </>}
    </div>
  </>
}
