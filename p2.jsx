  const totalServicos = useMemo(
    () => atendimentos.reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0),
    [atendimentos]
  )
  const qtdAtendimentos = useMemo(() => atendimentos.length, [atendimentos])
  const totalComissoes = useMemo(
    () => atendimentos.reduce((sum, a) => sum + (parseFloat(a.valor) || 0) * COMISSAO_RATE, 0),
    [atendimentos]
  )
