# Dashboard operacional

O dashboard conecta os indicadores aos registros e oferece agenda diária, pendências financeiras de todos os períodos, fluxo de caixa e atalhos de cadastro. A tela atualiza ao voltar para a janela, a cada minuto ou ao clicar em atualizar.

## Indicadores

- Receita de serviços: soma dos valores das duas formas de pagamento válidas nos atendimentos concluídos. No mês atual, considera até a data de hoje; a comparação usa o mesmo estágio do mês anterior. Nos meses encerrados, compara meses completos.
- Saldo do período: entradas realizadas menos saídas pagas. Lançamentos pendentes não entram no caixa; os registros antigos sem status de pagamento mantêm o tratamento de realizados já utilizado no sistema.
- A receber no mês: valores de atendimentos do mês que não estão cancelados e não receberam baixa de pagamento.
- Serviços realizados: quantidade de atendimentos concluídos e ticket médio correspondente.

O gráfico mostra entradas e saídas efetivamente registradas no financeiro, por dia ou por mês. Datas futuras não são apresentadas como se fossem movimentos realizados no mês atual. As formas de recebimento também usam os lançamentos financeiros realizados, inclusive a segunda forma de pagamento quando houver o lançamento correspondente.

## Ações

- O mês selecionado filtra os indicadores; a data da agenda permanece no mesmo mês.
- Os cartões e os serviços mais procurados abrem o módulo de atendimentos ou financeiro com o período e os filtros corretos.
- Novo atendimento, cadastro de cliente e lançamento de despesa abrem os formulários existentes. Abrir um formulário não grava dados.
- Iniciar e concluir atendimentos reutilizam a gravação transacional já instalada. O status do pagamento é preservado. Uma condição no status anterior impede sobrescrever uma alteração feita em outra tela.
- Os filtros recebidos pelo módulo de atendimentos ficam visíveis e podem ser removidos.
- As pendências incluem outros meses e destacam vencimentos anteriores a hoje. Um item sem vencimento informado não é marcado como atrasado.

## Qualidade

Os testes cobrem recebimentos divididos, cancelamentos, serviços ainda em andamento, exclusão de despesas pendentes do saldo, comparação por períodos equivalentes, virada de ano, fevereiro, vencimentos e preservação dos parâmetros dos links.

A prévia isolada utiliza somente dados fictícios. Foram conferidos os tamanhos de desktop e celular, a transição de agendado para em andamento e concluído sem alterar o pagamento, a navegação entre meses, os estados vazios e a falha de conexão sem indicadores parciais.

Não há nova migração de banco. A tela reutiliza as tabelas e as regras de acesso existentes.
