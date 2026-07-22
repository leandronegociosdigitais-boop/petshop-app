// ---- STATUS DE ATENDIMENTO ----
export const STATUS_LABEL = {
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

export const STATUS_BADGE = {
  agendado: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_andamento: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  concluido: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelado: 'bg-gray-50 text-gray-500 ring-gray-500/20',
}

export const STATUS_BADGE_SIMPLE = {
  agendado: 'bg-blue-50 text-blue-700',
  em_andamento: 'bg-amber-50 text-amber-700',
  concluido: 'bg-emerald-50 text-emerald-700',
  cancelado: 'bg-gray-50 text-gray-500',
}

export const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'cancelado', label: 'Cancelado' },
]

// ---- FORMAS DE PAGAMENTO ----
export const FORMA_PAGAMENTO_LABEL = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  pix: 'Pix',
  permuta: 'Permuta',
}

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartao de Credito' },
  { value: 'cartao_debito', label: 'Cartao de Debito' },
  { value: 'pix', label: 'Pix' },
  { value: 'permuta', label: 'Permuta' },
]

export const FORMA_PAGAMENTO_COLORS = {
  dinheiro: 'bg-green-50 text-green-700 ring-green-600/20',
  cartao_credito: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cartao_debito: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pix: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  permuta: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

// ---- STATUS DE PAGAMENTO ----
export const PAGAMENTO_STATUS_LABEL = {
  pago: 'Pago',
  pendente: 'Pendente',
  vencido: 'Vencido',
}

export const PAGAMENTO_STATUS_BADGE = {
  pago: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pendente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  vencido: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const PAGAMENTO_STATUS_COLORS_FIN = {
  pago: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pendente: 'bg-amber-100 text-amber-700 border border-amber-200',
}

export const STATUS_PAGAMENTO_OPTIONS = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencido', label: 'Vencido' },
]

// ---- BANCOS ----
export const BANCO_LABEL = {
  mercado_pago: 'Mercado Pago',
  mercado_pago_juridico: 'Mercado Pago Juridico',
  pagseguro: 'PagSeguro',
  pagseguro_juridico: 'PagSeguro Juridico',
  caixa_loja: 'Caixa Loja',
  permuta: 'Permuta',
}

export const BANCO_COLORS = {
  mercado_pago: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  mercado_pago_juridico: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pagseguro: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pagseguro_juridico: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  caixa_loja: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  permuta: 'bg-gray-50 text-gray-700 ring-gray-600/20',
}

export const BANCO_OPTIONS_ATENDIMENTOS = [
  { value: '', label: 'Nenhum' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'pagseguro', label: 'PagSeguro' },
  { value: 'pagseguro_juridico', label: 'PagSeguro Juridico' },
  { value: 'caixa_loja', label: 'Caixa Loja' },
]

export const BANCO_OPTIONS_FINANCEIRO = [
  { value: '', label: 'Nenhum' },
  { value: 'mercado_pago_juridico', label: 'Mercado Pago Juridico' },
  { value: 'pagseguro', label: 'PagSeguro' },
  { value: 'pagseguro_juridico', label: 'PagSeguro Juridico' },
  { value: 'caixa_loja', label: 'Caixa da Loja' },
  { value: 'permuta', label: 'Permuta' },
]

// ---- MESES / DIAS ----
export const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const MONTH_NAMES_FULL = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

export const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sabado',
]

// ---- DASHBOARD ----
export const DOT_COLORS = {
  pix: '#A78BFA',
  cartao_credito: '#34D399',
  cartao_debito: '#60A5FA',
  dinheiro: '#FCD34D',
  permuta: '#F87171',
}

export const RANKING_COLORS = ['text-yellow-400', 'text-gray-400', 'text-amber-500', 'text-gray-600', 'text-gray-600']

// ---- GRUPOS FINANCEIRO ----
export const CATEGORIAS_ENTRADA = ['Servicos', 'Produtos', 'Outros']

export const CATEGORIAS_SAIDA_POR_GRUPO = {
  Servicos: ['Banho', 'Tosa', 'Banho e Tosa', 'Hidratacao', 'Tosa Higienica'],
  'Despesas Fixas': ['Energia Eletrica', 'Internet', 'Aluguel'],
  'Custo de Consumo': ['Shampoo Neutro', 'Pre-lavagem', 'Lacos', 'Algodao', 'Perfume', 'Hidratante', 'Afiacao de Laminas'],
  'Custo de Descartaveis': ['Limpeza', 'Copo Descartavel', 'Papel Higienico', 'Agua'],
  Comissoes: ['Comissao Emidio'],
  'Despesas Variaveis': ['Medicamento'],
  'Taxas de Cartao': ['PagSeguro', 'Mercado Pago'],
  Manutencao: ['Equipamento', 'Predial'],
}

export const GRUPOS_SAIDA = [
  'Servicos', 'Despesas Fixas', 'Custo de Consumo', 'Custo de Descartaveis',
  'Comissoes', 'Despesas Variaveis', 'Taxas de Cartao', 'Manutencao',
]

export const GRUPO_COLORS_SAIDA = {
  Servicos: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Despesas Fixas': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Custo de Consumo': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  'Custo de Descartaveis': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  Comissoes: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'Despesas Variaveis': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Taxas de Cartao': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Manutencao: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export const COMISSAO_RATE = 0.4
