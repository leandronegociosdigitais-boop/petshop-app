            <div className=rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm>
              <p className=text-sm font-medium text-emerald-700>Servicos Realizados</p>
              <div className=mt-2 flex flex-col gap-2>
                <p className=text-xl font-bold truncate text-emerald-700>{formatCurrency(totalServicos)}</p>
                <p className=text-xs text-emerald-600>{qtdAtendimentos} atendimento(s)</p>
              </div>
            </div>
