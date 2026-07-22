            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">Total Saidas</p>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xl font-bold truncate text-red-600">{formatCurrency(totalSaidas)}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600"><TrendingDown size={16} /></div>
              </div>
            </div>
            <div className={`rounded-xl border p-5 shadow-sm ${lucro >= 0 ? 'border-indigo-200 bg-indigo-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-medium ${lucro >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>Lucro</p>
              <div className="mt-2 flex flex-col gap-2">
                <p className={`text-xl font-bold truncate ${lucro >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>{formatCurrency(lucro)}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${lucro >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}><DollarSign size={16} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700">Comissoes (40%)</p>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xl font-bold truncate text-amber-700">{formatCurrency(totalComissoes)}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><FileText size={16} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">Clientes Atendidos</p>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xl font-bold truncate text-blue-700">{uniqueClientes}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Users size={16} /></div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>


{/* Saidas por Grupo */}
      <CollapsibleSection title="Saidas por Grupo" icon={TrendingDown} defaultOpen={true}>
      {loadingFinanceiro ? (
        <Spinner />
      ) : saidas.length === 0 ? (
        <EmptyState icon={TrendingDown} message="Nenhuma saida no periodo selecionado." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4">
            {saidasByGrupoCards.map((grupo) => {
              const pct = totalSaidas > 0 ? (grupo.total / totalSaidas) * 100 : 0
              return (
                <div key={grupo.nome} className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${GRUPO_COLORS[grupo.nome] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{grupo.nome}</span>
                    <span className="text-red-600 font-bold text-lg">{formatCurrency(grupo.total)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-gray-100">
                    <div
                      className="h-1.5 rounded bg-red-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{pct.toFixed(1)}% do total</p>
                  {grupo.categorias.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {grupo.categorias.map((cat) => (
                        <div key={cat.nome}>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm font-medium text-gray-700">{cat.nome}</span>
                            <span className="text-sm text-red-500 font-semibold">{formatCurrency(cat.total)}</span>
                          </div>
                          {cat.itens.length > 1 && (
                            <div className="pl-3 divide-y divide-gray-50">
                              {cat.itens.map((item) => (
                                <div key={item.nome} className="flex items-center justify-between py-1">
                                  <span className="text-xs text-gray-400">{item.nome}</span>
                                  <span className="text-xs text-red-300 font-medium">{formatCurrency(item.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="border-t border-gray-200 pt-4 mt-2 mx-4 mb-4 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Total de Saidas:</span>
            <span className="text-red-600 font-bold text-xl">{formatCurrency(totalSaidas)}</span>
          </div>
        </>
      )}
    </CollapsibleSection>

      {/* 2. Servicos do Mes */}
      <CollapsibleSection title="Servicos do Mes" icon={Calendar} defaultOpen={true} count={filteredAtendimentos.length}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : filteredAtendimentos.length === 0 ? (
          <EmptyState icon={Calendar} message="Nenhum atendimento no periodo selecionado." />
        ) : (
          <>
            <div className="p-4">
              <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por pet, cliente ou servico..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Servicos</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {atendimentosPorDia.map((dia) => (
                      <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900"><span className="inline-block w-8 text-right">{DIAS_SEMANA[getDayOfWeek(dia.date)]}</span> - {formatDate(dia.date)}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-600">{dia.items.length}</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">{formatCurrency(dia.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filteredAtendimentos.length}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(filteredAtendimentos.reduce((s, a) => s + (parseFloat(a.valor) || 0), 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {atendimentosPorDia.map((dia) => {
                const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
                return (
                  <div key={dia.date} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900"><span className="inline-block w-8 text-right">{diaSemana}</span> - {formatDate(dia.date)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{dia.items.length} servico{dia.items.length > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-gray-900">Total: {formatCurrency(dia.total)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Pet</th>
                            <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Servico</th>
                            <th className="hidden md:table-cell px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                            <th className="hidden lg:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dia.items.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><PawPrint size={12} /></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 truncate">{a.pet?.nome || 'â€”'}</div>
                                    {a.pet?.especie && <div className="text-xs text-gray-500">{a.pet.especie}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="hidden sm:table-cell px-4 py-2.5 text-sm text-gray-700">{a.cliente?.nome || 'â€”'}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-700">{a.servico?.nome || 'â€”'}</td>
                              <td className="hidden md:table-cell px-4 py-2.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(a.valor)}</td>
                              <td className="hidden lg:table-cell px-4 py-2.5">
                                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">
                                  {FORMA_PAGAMENTO_LABEL[a.forma_pagamento] || a.forma_pagamento || 'â€”'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[a.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                  {a.status || 'â€”'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* 3. Entradas do Mes */}
      <CollapsibleSection title="Entradas do Mes" icon={TrendingUp} defaultOpen={true} count={entradas.length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : entradas.length === 0 ? (
          <EmptyState icon={TrendingUp} message="Nenhuma entrada no periodo selecionado." />
        ) : (
          <div className="space-y-3 p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entradasPorDia.map((dia) => (
                    <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900"><span className="inline-block w-8 text-right">{DIAS_SEMANA[getDayOfWeek(dia.date)]}</span> - {formatDate(dia.date)}</td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">{dia.items.length}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-700">{formatCurrency(dia.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {entradasPorDia.map((dia) => {
              const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
              return (
                <div key={dia.date} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900"><span className="inline-block w-8 text-right">{diaSemana}</span> - {formatDate(dia.date)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{dia.items.length} entrada{dia.items.length > 1 ? 's' : ''}</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(dia.total)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Categoria</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                          <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dia.items.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{r.categoria || 'â€”'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || 'â€”'}</td>
                            <td className="hidden sm:table-cell px-4 py-2.5">
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || 'â€”'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">+ {formatCurrency(r.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* 4. Saidas do Mes */}
      <CollapsibleSection title="Saidas do Mes" icon={TrendingDown} defaultOpen={true} count={saidas.length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : saidas.length === 0 ? (
          <EmptyState icon={TrendingDown} message="Nenhuma saida no periodo selecionado." />
        ) : (
          <div>
            {grupoNames.map((grupo) => (
              <div key={grupo} className="border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between bg-gray-50 px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${GRUPO_COLORS[grupo] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{grupo}</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">- {formatCurrency(saidasByGrupo[grupo].subtotal)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Categoria</th>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {saidasByGrupo[grupo].items.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-600">{r.categoria || 'â€”'}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900">{r.descricao || 'â€”'}</td>
                          <td className="hidden sm:table-cell px-6 py-3">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || 'â€”'}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 text-right text-sm font-semibold text-red-700">- {formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-red-50 px-6 py-4">
              <span className="text-sm font-bold text-gray-900">Total Saidas</span>
              <span className="text-sm font-bold text-red-700">- {formatCurrency(totalSaidas)}</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 5. Clientes Atendidos - Detalhado */}
      <CollapsibleSection title="Clientes Atendidos" icon={Users} defaultOpen={true} count={clientesDetalhado.length}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : clientesDetalhado.length === 0 ? (
          <EmptyState icon={Users} message="Nenhum cliente atendido no periodo." />
        ) : (
          <div className="p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Atendimentos</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientesDetalhado.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Users size={12} /></div>
                          <span className="text-sm font-medium text-gray-900">{c.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{c.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(c.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total ({clientesDetalhado.length} clientes)</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filteredAtendimentos.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(filteredAtendimentos.reduce((s, a) => s + (parseFloat(a.valor) || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 6. Pets Atendidos */}
      <CollapsibleSection title="Pets Atendidos" icon={PawPrint} defaultOpen={true}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-3"><PawPrint size={32} /></div>
            <p className="text-3xl font-bold text-gray-900">{uniquePets}</p>
            <p className="mt-1 text-sm text-gray-500">pets atendidos no periodo</p>
          </div>
        )}
      </CollapsibleSection>

      {/* 7. Relatorio por Banco */}
      <CollapsibleSection title="Relatorio por Banco" icon={Landmark} defaultOpen={false} count={Object.keys(porBanco).length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : Object.keys(porBanco).length === 0 ? (
          <EmptyState icon={Landmark} message="Nenhum dado por banco no periodo." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Banco</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(porBanco).sort(([,a], [,b]) => b.total - a.total).map(([banco, data]) => (
                    <tr key={banco} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{data.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {Object.entries(porBanco).sort(([,a], [,b]) => b.total - a.total).map(([banco, data]) => (
              <div key={banco} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Landmark size={14} className="text-indigo-600" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{data.count} entrada{data.count > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(data.total)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.items.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || 'â€”'}</td>
                          <td className="hidden sm:table-cell px-4 py-2.5">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || 'â€”'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 8. Relatorio por Forma de Pagamento */}
      <CollapsibleSection title="Relatorio por Forma de Pagamento" icon={CreditCard} defaultOpen={false} count={Object.keys(porFormaPagamento).length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : Object.keys(porFormaPagamento).length === 0 ? (
          <EmptyState icon={CreditCard} message="Nenhum dado por forma de pagamento no periodo." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Forma Pagamento</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(porFormaPagamento).sort(([,a], [,b]) => b.total - a.total).map(([forma, data]) => (
                    <tr key={forma} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getFormaLabel(forma)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{data.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {Object.entries(porFormaPagamento).sort(([,a], [,b]) => b.total - a.total).map(([forma, data]) => (
              <div key={forma} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-indigo-600" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getFormaLabel(forma)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{data.count} entrada{data.count > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(data.total)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Banco</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.items.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || 'â€”'}</td>
                          <td className="hidden sm:table-cell px-4 py-2.5">
                            {r.banco ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[r.banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{BANCO_LABEL[r.banco] || r.banco}</span>
                            ) : <span className="text-xs text-gray-400">â€”</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 9. Relatorio por Mes */}
      <CollapsibleSection title="Relatorio por Mes (Historico)" icon={BarChart3} defaultOpen={false} count={porMes.length}>
        {loadingHistoricoFin ? (
          <Spinner />
        ) : porMes.length === 0 ? (
          <EmptyState icon={BarChart3} message="Nenhum dado historico disponivel." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mes</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Registros</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Saidas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-indigo-600">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porMes.map((m) => {
                    const [y, mo] = m.month.split('-')
                    const label = getMonthLabel(parseInt(mo)) + ' ' + y
                    const saldo = m.totalEntrada - m.totalSaida
                    return (
                      <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{label}</td>
                        <td className="px-4 py-2.5 text-center text-sm text-gray-600">{m.count}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(m.totalEntrada)}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-700">{formatCurrency(m.totalSaida)}</td>
                        <td className={`px-4 py-2.5 text-right text-sm font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {porMes.map((m) => {
              const [y, mo] = m.month.split('-')
              const label = getMonthLabel(parseInt(mo)) + ' ' + y
              const saldo = m.totalEntrada - m.totalSaida
              return (
                <div key={m.month} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-900">{label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-700 font-semibold">+{formatCurrency(m.totalEntrada)}</span>
                      <span className="text-red-700 font-semibold">-{formatCurrency(m.totalSaida)}</span>
                      <span className={`font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>Saldo: {formatCurrency(saldo)}</span>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Por Forma de Pagamento</p>
                      <div className="space-y-1.5">
                        {Object.entries(m.porForma).sort(([,a],[,b]) => b - a).map(([forma, valor]) => (
                          <div key={forma} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{FORMA_PAGAMENTO_LABEL[forma] || forma}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Por Banco</p>
                      <div className="space-y-1.5">
                        {Object.entries(m.porBanco).sort(([,a],[,b]) => b - a).map(([banco, valor]) => (
                          <div key={banco} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
